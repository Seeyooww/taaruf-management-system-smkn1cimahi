import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import {
  getMockAnggotaProgressSummaries,
  saveMockBookingProgress,
} from "@/lib/mock-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { fetchEventSettings } from "@/services/settings.service";
import { recordActivityLog } from "@/services/activity.service";
import type {
  AnggotaProgressSummary,
  MetKatingDetail,
  ParticipantEstimateItem,
  ProgressEstimateResult,
  SubstituteEntry,
} from "@/types/database";

/**
 * Fetches progress summaries for all anggota (or filtered by kelompokId).
 *
 * Batch approach (no N+1):
 * 1. Fetch all anggota (with kelompok join) in one query.
 * 2. Fetch ALL progress records for those anggota in one query.
 * 3. Fetch ALL substitution records in two bulk queries.
 * 4. Assemble summaries in-memory.
 */
export async function fetchAnggotaProgressSummaries(
  kelompokId?: string
): Promise<AnggotaProgressSummary[]> {
  const settings = await fetchEventSettings();
  const targetKating = settings.target_kating || 5;

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();

    // ── Query 1: all anggota (optionally filtered by kelompok) ──────────────
    let anggotaQuery = supabase
      .from("anggota")
      .select("id, nama, jenis_kelamin, kelompok_id, kelompok:kelompok_id(nomor_kelompok, kelas)");

    if (kelompokId) {
      anggotaQuery = anggotaQuery.eq("kelompok_id", kelompokId);
    }

    const { data: anggotaList, error: anggotaError } = await anggotaQuery;

    if (anggotaError || !anggotaList || anggotaList.length === 0) {
      if (anggotaError) console.error("[fetchAnggotaProgressSummaries] anggota error:", anggotaError.message);
      return getMockAnggotaProgressSummaries(targetKating, kelompokId);
    }

    const anggotaIds = anggotaList.map((a: any) => a.id);

    // ── Query 2: all progress records for these anggota ──────────────────────
    const { data: allProgress } = await supabase
      .from("progress")
      .select("anggota_id, kating_id, booking_id, kating:kating_id(nama, jenis_kelamin), booking:booking_id(tanggal, slot:slot_id(nama_slot))")
      .in("anggota_id", anggotaIds);

    // ── Query 3: all substitution records (as substitute) ─────────────────────
    const { data: allAsSubstitute } = await supabase
      .from("booking_participants")
      .select("anggota_id, booking_id, replaces_anggota_id, booking:booking_id(tanggal, slot:slot_id(nama_slot)), replaced:replaces_anggota_id(nama)")
      .in("anggota_id", anggotaIds)
      .eq("is_substitute", true);

    // ── Query 4: all substitution records (was replaced) ──────────────────────
    const { data: allWasReplaced } = await supabase
      .from("booking_participants")
      .select("anggota_id, booking_id, replaces_anggota_id, booking:booking_id(tanggal, slot:slot_id(nama_slot)), substitute:anggota_id(nama)")
      .in("replaces_anggota_id", anggotaIds)
      .eq("is_substitute", true);

    // Build lookup maps keyed by anggota_id for O(1) access
    const progressByAnggota = new Map<string, any[]>();
    const asSubByAnggota = new Map<string, any[]>();
    const wasReplacedByAnggota = new Map<string, any[]>();

    for (const id of anggotaIds) {
      progressByAnggota.set(id, []);
      asSubByAnggota.set(id, []);
      wasReplacedByAnggota.set(id, []);
    }

    (allProgress ?? []).forEach((p: any) => {
      progressByAnggota.get(p.anggota_id)?.push(p);
    });

    (allAsSubstitute ?? []).forEach((s: any) => {
      asSubByAnggota.get(s.anggota_id)?.push(s);
    });

    (allWasReplaced ?? []).forEach((r: any) => {
      if (r.replaces_anggota_id) {
        wasReplacedByAnggota.get(r.replaces_anggota_id)?.push(r);
      }
    });

    // Assemble summaries in-memory
    const summaries: AnggotaProgressSummary[] = anggotaList.map((a: any) => {
      const progressRecords = progressByAnggota.get(a.id) ?? [];

      const metList: MetKatingDetail[] = progressRecords.map((p: any) => ({
        kating_id: p.kating_id,
        kating_nama: p.kating?.nama ?? "Kating",
        jenis_kelamin: p.kating?.jenis_kelamin ?? "L",
        tanggal: p.booking?.tanggal ?? "",
        slot_nama: p.booking?.slot?.nama_slot ?? "Sesi Taaruf",
      }));

      const metCount = metList.length;
      const percentage = Math.min(Math.round((metCount / targetKating) * 100), 100);

      let status_label: AnggotaProgressSummary["status_label"] = "Belum";
      let status_color: AnggotaProgressSummary["status_color"] = "destructive";

      if (metCount >= targetKating) {
        status_label = "Selesai";
        status_color = "success";
      } else if (percentage >= 50) {
        status_label = "Hampir Selesai";
        status_color = "warning";
      }

      const asSubRecords = asSubByAnggota.get(a.id) ?? [];
      const wasReplacedRecords = wasReplacedByAnggota.get(a.id) ?? [];

      const substitution_history = [
        ...asSubRecords.map((s: any) => ({
          booking_id: s.booking_id,
          tanggal: s.booking?.tanggal ?? "",
          slot_nama: s.booking?.slot?.nama_slot ?? "Sesi",
          replaces_nama: s.replaced?.nama ?? "Anggota",
        })),
        ...wasReplacedRecords.map((r: any) => ({
          booking_id: r.booking_id,
          tanggal: r.booking?.tanggal ?? "",
          slot_nama: r.booking?.slot?.nama_slot ?? "Sesi",
          replaced_by_nama: r.substitute?.nama ?? "Pengganti",
        })),
      ];

      return {
        anggota_id: a.id,
        nama: a.nama,
        jenis_kelamin: a.jenis_kelamin,
        kelompok_id: a.kelompok_id,
        kelompok_nama: a.kelompok ? `Kelompok ${a.kelompok.nomor_kelompok}` : "Tidak Diketahui",
        kelas: a.kelompok?.kelas ?? "-",
        total_kating_met: metCount,
        target_kating: targetKating,
        percentage,
        status_label,
        status_color,
        kating_met_list: metList,
        substitution_history,
      };
    });

    return summaries;
  }

  return getMockAnggotaProgressSummaries(targetKating, kelompokId);
}

/**
 * Saves attendance + substitution data for a completed booking session.
 *
 * Uses batch inserts. Kating IDs are now fetched from booking_kating table.
 */
export async function saveBookingProgress(
  bookingId: string,
  presentOriginalIds: string[] = [],
  absentOriginalIds: string[] = [],
  substitutes: SubstituteEntry[] = []
) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();

    // ── Idempotency guard: Single Source of Truth = progress table ──────────
    const { data: existingProgress } = await supabase
      .from("progress")
      .select("id")
      .eq("booking_id", bookingId)
      .limit(1)
      .maybeSingle();

    if (existingProgress) {
      return {
        success: false,
        message: "Progress untuk sesi ini sudah pernah dikonfirmasi sebelumnya.",
      };
    }

    // ── Fetch booking details and kating IDs ──────────────────────────────────
    const { data: bookingData } = await supabase
      .from("booking")
      .select("id, kelompok:kelompok_id(nomor_kelompok, kelas)")
      .eq("id", bookingId)
      .single();

    const { data: bkRows } = await supabase
      .from("booking_kating")
      .select("kating_id, kating:kating_id(id, nama)")
      .eq("booking_id", bookingId);

    if (!bkRows || bkRows.length === 0) {
      return { success: false, message: "Booking tidak ditemukan atau tidak memiliki kating." };
    }

    const katingList = bkRows.map((r: any) => r.kating).filter(Boolean);
    const katingIds = katingList.map((k: any) => k.id);
    const katingNames = katingList.map((k: any) => k.nama).join(", ");

    // ── UPSERT booking_participants (maintain history & relations) ────────────
    const participantRows = [
      ...presentOriginalIds.map((anggotaId) => ({
        booking_id: bookingId,
        anggota_id: anggotaId,
        hadir: true,
        is_substitute: false,
        replaces_anggota_id: null as string | null,
      })),
      ...absentOriginalIds.map((anggotaId) => ({
        booking_id: bookingId,
        anggota_id: anggotaId,
        hadir: false,
        is_substitute: false,
        replaces_anggota_id: null as string | null,
      })),
      ...substitutes.map((sub) => ({
        booking_id: bookingId,
        anggota_id: sub.substituteId,
        hadir: true,
        is_substitute: true,
        replaces_anggota_id: sub.replacesId,
      })),
    ];

    if (participantRows.length > 0) {
      const { error: participantError } = await supabase
        .from("booking_participants")
        .upsert(participantRows, { onConflict: "booking_id,anggota_id" });

      if (participantError) {
        return { success: false, message: `Gagal menyimpan data presensi: ${participantError.message}` };
      }
    }

    // ── Detect duplicate progress vs new progress ─────────────────────────────
    const participantIdsForProgress = [
      ...presentOriginalIds,
      ...substitutes.map((s) => s.substituteId),
    ];

    let newProgressCount = 0;
    let duplicateMeetingCount = 0;

    if (participantIdsForProgress.length > 0 && katingIds.length > 0) {
      // Query existing progress records for these participants & kating
      const { data: existingProgressRows } = await supabase
        .from("progress")
        .select("anggota_id, kating_id")
        .in("anggota_id", participantIdsForProgress)
        .in("kating_id", katingIds);

      const existingPairSet = new Set<string>();
      (existingProgressRows ?? []).forEach((row: any) => {
        existingPairSet.add(`${row.anggota_id}:${row.kating_id}`);
      });

      const progressRows: { anggota_id: string; booking_id: string; kating_id: string }[] = [];
      for (const anggotaId of participantIdsForProgress) {
        for (const katingId of katingIds) {
          if (!existingPairSet.has(`${anggotaId}:${katingId}`)) {
            progressRows.push({ anggota_id: anggotaId, booking_id: bookingId, kating_id: katingId });
            newProgressCount++;
          } else {
            duplicateMeetingCount++;
          }
        }
      }

      if (progressRows.length > 0) {
        const adminClient = createSupabaseAdminClient();
        const { error: progressError } = await adminClient
          .from("progress")
          .upsert(progressRows, { onConflict: "anggota_id,kating_id", ignoreDuplicates: true });

        if (progressError) {
          console.error("[saveBookingProgress] progress insert error:", progressError.message);
          return { success: false, message: `Gagal menyimpan progress: ${progressError.message}` };
        }
      }
    }

    // ── Update booking status to Selesai ONLY AFTER progress is saved ──────────
    const { error: statusError } = await supabase
      .from("booking")
      .update({ status: "Selesai" })
      .eq("id", bookingId);

    if (statusError) {
      return { success: false, message: `Gagal memperbarui status booking: ${statusError.message}` };
    }

    // ── Log Activity ──────────────────────────────────────────────────────────
    const kelompokObj = (bookingData as any)?.kelompok;
    const kelompokNama = kelompokObj
      ? `Kelompok ${Array.isArray(kelompokObj) ? kelompokObj[0]?.nomor_kelompok : kelompokObj.nomor_kelompok}`
      : "Kelompok";
    const totalHadir = presentOriginalIds.length + substitutes.length;

    await recordActivityLog(
      kelompokNama,
      "kelompok",
      "Progress Dihitung",
      `Konfirmasi presensi booking ${bookingId} (${totalHadir} hadir, ${substitutes.length} pengganti). Kating: ${katingNames}. Progress bertambah: ${newProgressCount}, Sudah pernah bertemu sebelumnya: ${duplicateMeetingCount}.`
    );

    return {
      success: true,
      message: `Progress berhasil disimpan: ${totalHadir} peserta hadir (${substitutes.length} pengganti). Progress bertambah: ${newProgressCount}.`,
    };
  }

  // Dev mode fallback
  const allPresentIds = [
    ...presentOriginalIds,
    ...substitutes.map((s) => s.substituteId),
  ];
  return saveMockBookingProgress(bookingId, allPresentIds);
}

/**
  * Checks for each final participant whether their progress will increase (+1)
  * or remain unchanged (already met all selected kating) based on history in database.
  */
export async function checkProgressEstimate(
  participants: ParticipantEstimateItem[],
  katingIds: string[]
): Promise<ProgressEstimateResult> {
  if (participants.length === 0 || katingIds.length === 0) {
    return {
      willIncreaseList: [],
      alreadyMetList: [],
      totalParticipants: 0,
      totalIncrease: 0,
      totalUnchanged: 0,
    };
  }

  const anggotaIds = participants.map((p) => p.anggotaId);
  const metPairSet = new Set<string>(); // "anggota_id:kating_id"

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data: progressRows } = await supabase
      .from("progress")
      .select("anggota_id, kating_id")
      .in("anggota_id", anggotaIds)
      .in("kating_id", katingIds);

    (progressRows ?? []).forEach((row: any) => {
      metPairSet.add(`${row.anggota_id}:${row.kating_id}`);
    });
  }

  const willIncreaseList: ParticipantEstimateItem[] = [];
  const alreadyMetList: ParticipantEstimateItem[] = [];

  for (const p of participants) {
    let metCount = 0;
    for (const kId of katingIds) {
      if (metPairSet.has(`${p.anggotaId}:${kId}`)) {
        metCount++;
      }
    }

    if (metCount >= katingIds.length) {
      alreadyMetList.push({ ...p, alreadyMetCount: metCount });
    } else {
      willIncreaseList.push({ ...p, alreadyMetCount: metCount });
    }
  }

  return {
    willIncreaseList,
    alreadyMetList,
    totalParticipants: participants.length,
    totalIncrease: willIncreaseList.length,
    totalUnchanged: alreadyMetList.length,
  };
}

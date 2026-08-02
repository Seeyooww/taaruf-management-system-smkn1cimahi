import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import {
  getMockAnggotaProgressSummaries,
  saveMockBookingProgress,
} from "@/lib/mock-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { fetchEventSettings } from "@/services/settings.service";
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

    // ── Idempotency guard: abort if already confirmed ────────────────────────
    const { data: existingParticipant } = await supabase
      .from("booking_participants")
      .select("id")
      .eq("booking_id", bookingId)
      .limit(1)
      .maybeSingle();

    if (existingParticipant) {
      return {
        success: false,
        message: "Progress untuk sesi ini sudah pernah dikonfirmasi sebelumnya.",
      };
    }

    // ── Fetch kating IDs from booking_kating (not from booking directly) ──────
    const { data: bkRows } = await supabase
      .from("booking_kating")
      .select("kating_id")
      .eq("booking_id", bookingId);

    if (!bkRows || bkRows.length === 0) {
      return { success: false, message: "Booking tidak ditemukan atau tidak memiliki kating." };
    }

    const katingIds = bkRows.map((r: any) => r.kating_id).filter(Boolean);

    // ── Mark booking as Selesai ───────────────────────────────────────────────
    const { error: statusError } = await supabase
      .from("booking")
      .update({ status: "Selesai" })
      .eq("id", bookingId);

    if (statusError) {
      return { success: false, message: `Gagal memperbarui status booking: ${statusError.message}` };
    }

    // ── Batch insert booking_participants ────────────────────────────────────
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
        .insert(participantRows);

      if (participantError) {
        if (participantError.code === "23505") {
          return { success: false, message: "Progress untuk sesi ini sudah pernah dikonfirmasi." };
        }
        return { success: false, message: `Gagal menyimpan data kehadiran: ${participantError.message}` };
      }
    }

    // ── Batch insert progress records (all participant × all kating) ──────────
    const participantIdsForProgress = [
      ...presentOriginalIds,
      ...substitutes.map((s) => s.substituteId),
    ];

    if (participantIdsForProgress.length > 0 && katingIds.length > 0) {
      const progressRows: { anggota_id: string; booking_id: string; kating_id: string }[] = [];
      for (const anggotaId of participantIdsForProgress) {
        for (const katingId of katingIds) {
          progressRows.push({ anggota_id: anggotaId, booking_id: bookingId, kating_id: katingId });
        }
      }

      const adminClient = createSupabaseAdminClient();
      const { error: progressError } = await adminClient
        .from("progress")
        .upsert(progressRows, { onConflict: "anggota_id,kating_id", ignoreDuplicates: true });

      if (progressError) {
        console.error("[saveBookingProgress] progress upsert error:", progressError.message);
      }
    }

    const totalHadir = presentOriginalIds.length + substitutes.length;
    const totalTidakHadir = absentOriginalIds.length;
    const totalPengganti = substitutes.length;

    return {
      success: true,
      message: `Progress dihitung: ${totalHadir} hadir (${totalPengganti} pengganti), ${totalTidakHadir} tidak hadir.`,
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

import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import {
  createMockBooking,
  getAvailableKatingList,
  getMockBookingList,
  updateMockBookingContactedStatus,
  updateMockBookingStatus,
  type BookingWithDetails,
} from "@/lib/mock-db";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { fetchEventSettings } from "@/services/settings.service";
import { fetchSlotList } from "@/services/slot.service";
import { recordActivityLog } from "@/services/activity.service";
import { rollbackBookingProgress } from "@/services/progress.service";
import type { BookingStatus, CalendarBookingEntry, KatingBasic, Kating } from "@/types/database";

/**
 * Helper: Returns true if two time ranges [a_mulai, a_selesai) and [b_mulai, b_selesai) overlap.
 * Waktu dalam format "HH:mm" (24-jam).
 */
function doTimeSlotsOverlap(
  a_mulai: string,
  a_selesai: string,
  b_mulai: string,
  b_selesai: string
): boolean {
  // Konversi "HH:mm" ke menit sejak tengah malam untuk perbandingan numerik
  const toMinutes = (t: string): number => {
    const [h, m] = t.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const aStart = toMinutes(a_mulai);
  const aEnd = toMinutes(a_selesai);
  const bStart = toMinutes(b_mulai);
  const bEnd = toMinutes(b_selesai);
  // Overlap: aStart < bEnd AND bStart < aEnd
  return aStart < bEnd && bStart < aEnd;
}

// CalendarBookingEntry is defined in @/types/database and re-exported for convenience
export type { CalendarBookingEntry } from "@/types/database";

/**
 * Fetch booking list (optionally filtered by kelompok).
 * Uses a single JOIN query via booking_kating to avoid N+1.
 */
export async function fetchBookingList(
  kelompokId?: string
): Promise<BookingWithDetails[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("booking")
      .select(
        `
        id, kelompok_id, tanggal, slot_id, status, catatan, jam_pulang, tempat_taaruf, created_at,
        kelompok:kelompok_id(nomor_kelompok, kelas),
        slot:slot_id(nama_slot, jam_mulai, jam_selesai),
        booking_kating(
          kating_id, contacted, contacted_at,
          kating:kating_id(id, nama, jenis_kelamin, nomor_whatsapp)
        )
      `
      )
      .order("created_at", { ascending: false });

    if (kelompokId) {
      query = query.eq("kelompok_id", kelompokId);
    }

    const { data: bookingData, error } = await query;

    if (error) {
      console.error("[fetchBookingList] Supabase query error:", error.message, error.code);
    }

    if (!error && bookingData) {
      return bookingData.map((b: any) => ({
        id: b.id,
        kelompok_id: b.kelompok_id,
        tanggal: b.tanggal,
        slot_id: b.slot_id,
        status: b.status as BookingStatus,
        catatan: b.catatan,
        jam_pulang: b.jam_pulang ?? null,
        tempat_taaruf: b.tempat_taaruf ?? null,
        created_at: b.created_at,
        kelompok_nama: b.kelompok
          ? `Kelompok ${b.kelompok.nomor_kelompok} (${b.kelompok.kelas})`
          : "Kelompok",
        slot_nama: b.slot ? b.slot.nama_slot : "Slot",
        jam_mulai: b.slot ? b.slot.jam_mulai : "00:00",
        jam_selesai: b.slot ? b.slot.jam_selesai : "00:00",
        kating_list: (b.booking_kating ?? []).map((bk: any) => ({
          id: bk.kating?.id ?? bk.kating_id,
          nama: bk.kating?.nama ?? "Kating",
          jenis_kelamin: bk.kating?.jenis_kelamin ?? "L",
          nomor_whatsapp: bk.kating?.nomor_whatsapp ?? "",
          contacted: bk.contacted ?? false,
          contacted_at: bk.contacted_at ?? null,
        })) as KatingBasic[],
      }));
    }
  }

  return getMockBookingList(kelompokId);
}

/**
 * Fetch all available kating for a given date + slot.
 * Gender is no longer filtered here — callers can filter if needed.
 *
 * BUG FIX: Query dua langkah untuk menghindari perilaku nested-filter
 * PostgREST yang tidak reliable. Konflik hanya terjadi jika
 * kombinasi (tanggal, slot_id, kating_id) sama — bukan hanya (tanggal, kating_id).
 */
export async function fetchAvailableKating(
  tanggal: string,
  slot_id: string,
  excludeBookingId?: string
): Promise<Kating[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data: katingList } = await supabase
      .from("kating")
      .select("*")
      .eq("aktif", true);

    if (!katingList) return [];

    // Detail slot target (jam_mulai & jam_selesai)
    const { data: targetSlot } = await supabase
      .from("slot_waktu")
      .select("jam_mulai, jam_selesai")
      .eq("id", slot_id)
      .single();

    // Langkah 1: Cari semua booking_id yang aktif (bukan Ditolak/Dibatalkan) pada tanggal tersebut
    let activeQuery = supabase
      .from("booking")
      .select("id, slot_id, slot:slot_id(jam_mulai, jam_selesai)")
      .eq("tanggal", tanggal)
      .not("status", "in", '("Ditolak","Dibatalkan")');

    if (excludeBookingId) {
      activeQuery = activeQuery.neq("id", excludeBookingId);
    }

    const { data: activeBookings } = await activeQuery;

    if (!activeBookings || activeBookings.length === 0) {
      return katingList as Kating[];
    }

    // Filter booking yang bentrok secara slot_id ATAU secara rentang jam
    const busyBookingIds = activeBookings
      .filter((b: any) => {
        if (b.slot_id === slot_id) return true;
        if (targetSlot && b.slot?.jam_mulai && b.slot?.jam_selesai) {
          return doTimeSlotsOverlap(
            targetSlot.jam_mulai,
            targetSlot.jam_selesai,
            b.slot.jam_mulai,
            b.slot.jam_selesai
          );
        }
        return false;
      })
      .map((b: any) => b.id);

    if (busyBookingIds.length === 0) {
      return katingList as Kating[];
    }

    // Langkah 2: Cari semua kating_id yang terdaftar di booking aktif tersebut.
    const { data: busyRows } = await supabase
      .from("booking_kating")
      .select("kating_id")
      .in("booking_id", busyBookingIds);

    const busyIds = new Set<string>(
      (busyRows ?? []).map((r: any) => r.kating_id).filter(Boolean)
    );

    return katingList.filter((k: any) => !busyIds.has(k.id)) as Kating[];
  }

  return getAvailableKatingList(tanggal, slot_id);
}

/**
 * Create a new booking with a list of kating (many-to-many).
 */
export async function createBooking(data: {
  kelompok_id: string;
  tanggal: string;
  slot_id: string;
  kating_ids: string[];
  catatan?: string;
  jam_pulang?: string | null;
  tempat_taaruf?: string | null;
  participants?: {
    presentOriginalIds: string[];
    absentOriginalIds: string[];
    substitutes: { substituteId: string; replacesId: string }[];
  };
}) {
  const settings = await fetchEventSettings();
  const bookingDate = new Date(data.tanggal);
  const startDate = new Date(settings.tanggal_mulai);
  const endDate = new Date(settings.tanggal_selesai);

  if (bookingDate < startDate || bookingDate > endDate) {
    return {
      success: false,
      message: `Tanggal booking harus berada dalam rentang pelaksanaan acara (${settings.tanggal_mulai} s/d ${settings.tanggal_selesai}).`,
    };
  }

  const slots = await fetchSlotList();
  const slot = slots.find((s) => s.id === data.slot_id);
  if (!slot || !slot.aktif) {
    return {
      success: false,
      message: "Slot waktu yang dipilih tidak aktif atau tidak ditemukan.",
    };
  }

  if (!data.kating_ids || data.kating_ids.length === 0) {
    return {
      success: false,
      message: "Pilih minimal satu kating pendamping.",
    };
  }

  // Validate availability: berbasis slot_id dulu
  const available = await fetchAvailableKating(data.tanggal, data.slot_id);
  const availableIds = new Set(available.map((k) => k.id));
  const conflictIds = data.kating_ids.filter((id) => !availableIds.has(id));

  if (conflictIds.length > 0) {
    return {
      success: false,
      message:
        "Satu atau lebih kating yang Anda pilih sudah dibooking oleh kelompok lain untuk slot waktu tersebut. Silakan pilih kating lain.",
    };
  }

  // ── Validasi konflik berbasis WAKTU (bukan hanya slot_id) ─────────────────
  // Tangkap kasus slot berbeda tapi waktunya overlap (mis. "Istirahat 3" vs "Jam Pulang" keduanya 15:00)
  if (isSupabaseConfigured()) {
    const _sc = await createSupabaseServerClient();
    // Ambil semua booking aktif pada tanggal yang sama (bukan slot yang sama)
    const { data: sameDayBookings } = await _sc
      .from("booking")
      .select("id, slot_id, slot:slot_id(jam_mulai, jam_selesai)")
      .eq("tanggal", data.tanggal)
      .neq("slot_id", data.slot_id)
      .not("status", "in", '("Ditolak","Dibatalkan")');

    if (sameDayBookings && sameDayBookings.length > 0) {
      // Filter hanya booking yang waktunya overlap dengan slot yang dipilih
      const overlappingBookingIds = (sameDayBookings as any[])
        .filter((b) => {
          const bSlot = b.slot as { jam_mulai: string; jam_selesai: string } | null;
          if (!bSlot) return false;
          return doTimeSlotsOverlap(slot.jam_mulai, slot.jam_selesai, bSlot.jam_mulai, bSlot.jam_selesai);
        })
        .map((b) => b.id);

      if (overlappingBookingIds.length > 0) {
        const { data: timeConflictKating } = await _sc
          .from("booking_kating")
          .select("kating_id")
          .in("booking_id", overlappingBookingIds)
          .in("kating_id", data.kating_ids);

        if (timeConflictKating && timeConflictKating.length > 0) {
          return {
            success: false,
            message: `Konflik waktu: satu atau lebih kating yang Anda pilih sudah memiliki sesi lain pada rentang waktu ${slot.jam_mulai}–${slot.jam_selesai} di tanggal ${data.tanggal}. Silakan pilih kating lain atau ubah slot.`,
          };
        }
      }
    }
  }

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();

    // Insert booking row
    const { data: created, error } = await supabase
      .from("booking")
      .insert({
        kelompok_id: data.kelompok_id,
        tanggal: data.tanggal,
        slot_id: data.slot_id,
        status: "Menunggu Konfirmasi",
        catatan: data.catatan || null,
        jam_pulang: data.jam_pulang || null,
        tempat_taaruf: data.tempat_taaruf || null,
      })
      .select()
      .single();

    if (error || !created) {
      console.error("[createBooking] Supabase insert error:", error?.message, error?.code);
      return {
        success: false,
        message: `Gagal membuat booking: ${error?.message ?? "Unknown error"}`,
      };
    }

    // Batch insert booking_kating rows
    const bookingKatingRows = data.kating_ids.map((kating_id) => ({
      booking_id: created.id,
      kating_id,
    }));

    const { error: bkError } = await supabase
      .from("booking_kating")
      .insert(bookingKatingRows);

    if (bkError) {
      console.error("[createBooking] booking_kating insert error:", bkError.message);
      // Rollback booking
      await supabase.from("booking").delete().eq("id", created.id);
      return {
        success: false,
        message: `Gagal menyimpan relasi kating: ${bkError.message}`,
      };
    }

    // ── Optional: batch insert booking_participants (jika dikirim saat booking) ──
    if (data.participants) {
      const { presentOriginalIds, absentOriginalIds, substitutes } = data.participants;
      const participantRows = [
        ...presentOriginalIds.map((anggotaId) => ({
          booking_id: created.id,
          anggota_id: anggotaId,
          hadir: true,
          is_substitute: false,
          replaces_anggota_id: null as string | null,
        })),
        ...absentOriginalIds.map((anggotaId) => ({
          booking_id: created.id,
          anggota_id: anggotaId,
          hadir: false,
          is_substitute: false,
          replaces_anggota_id: null as string | null,
        })),
        ...substitutes.map((sub) => ({
          booking_id: created.id,
          anggota_id: sub.substituteId,
          hadir: true,
          is_substitute: true,
          // Guard: jangan pernah kirim string kosong / placeholder ke kolom UUID
          replaces_anggota_id: sub.replacesId || null,
        })),
      ];

      if (participantRows.length > 0) {
        const { error: participantError } = await supabase
          .from("booking_participants")
          .insert(participantRows);

        if (participantError) {
          console.error("[createBooking] booking_participants insert error:", participantError.message);
          // Non-fatal: booking and kating are saved; log only
        }
      }
    }

    // Return full booking with kating_list
    const { data: fullBooking } = await supabase
      .from("booking")
      .select(
        `id, kelompok_id, tanggal, slot_id, status, catatan, jam_pulang, tempat_taaruf, created_at,
        kelompok:kelompok_id(nomor_kelompok, kelas),
        slot:slot_id(nama_slot, jam_mulai, jam_selesai),
        booking_kating(kating_id, contacted, contacted_at, kating:kating_id(id, nama, jenis_kelamin, nomor_whatsapp))`
      )
      .eq("id", created.id)
      .single();

    if (fullBooking) {
      const b = fullBooking as any;
      return {
        success: true,
        data: {
          id: b.id,
          kelompok_id: b.kelompok_id,
          tanggal: b.tanggal,
          slot_id: b.slot_id,
          status: b.status as BookingStatus,
          catatan: b.catatan,
          jam_pulang: b.jam_pulang ?? null,
          tempat_taaruf: b.tempat_taaruf ?? null,
          created_at: b.created_at,
          kelompok_nama: b.kelompok
            ? `Kelompok ${b.kelompok.nomor_kelompok} (${b.kelompok.kelas})`
            : "Kelompok",
          slot_nama: b.slot?.nama_slot ?? "Slot",
          jam_mulai: b.slot?.jam_mulai ?? "00:00",
          jam_selesai: b.slot?.jam_selesai ?? "00:00",
          kating_list: (b.booking_kating ?? []).map((bk: any) => ({
            id: bk.kating?.id ?? bk.kating_id,
            nama: bk.kating?.nama ?? "Kating",
            jenis_kelamin: bk.kating?.jenis_kelamin ?? "L",
            nomor_whatsapp: bk.kating?.nomor_whatsapp ?? "",
            contacted: bk.contacted ?? false,
            contacted_at: bk.contacted_at ?? null,
          })) as KatingBasic[],
        } as BookingWithDetails,
      };
    }

    return { success: true, data: { ...created, kating_list: [] } as unknown as BookingWithDetails };
  }

  // Development-only fallback (hanya aktif jika Supabase tidak dikonfigurasi)
  const createdMock = createMockBooking(data);
  return { success: true, data: createdMock };
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();

    // ── Cek status saat ini sebelum update ───────────────────────────────────
    const { data: currentBooking } = await supabase
      .from("booking")
      .select("status")
      .eq("id", id)
      .single();

    const previousStatus = (currentBooking as any)?.status as BookingStatus | undefined;

    const { error } = await supabase
      .from("booking")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("[updateBookingStatus] Supabase update error:", error.message, error.code);
      return {
        success: false,
        message: `Gagal memperbarui status booking: ${error.message}`,
      };
    }

    // ── Auto-rollback: Selesai → Ditolak/Dibatalkan ──────────────────────────
    const isRollingBack =
      previousStatus === "Selesai" &&
      (status === "Ditolak" || status === "Dibatalkan");

    if (isRollingBack) {
      try {
        const rollbackResult = await rollbackBookingProgress(id);
        if (!rollbackResult.success) {
          console.error("[updateBookingStatus] rollback failed:", rollbackResult.message);
          // Non-fatal: status sudah berubah, log saja
        }
      } catch (e) {
        console.error("[updateBookingStatus] rollback exception:", e);
      }
    }

    if (status === "Dibatalkan") {
      try {
        await recordActivityLog(
          "Admin",
          "admin",
          "Booking Dibatalkan",
          `Booking ID ${id} telah dibatalkan oleh Admin.${
            isRollingBack ? " Progress yang terkait telah di-rollback." : ""
          }`
        );
      } catch (e) {
        console.error("[updateBookingStatus] Activity log error:", e);
      }
    }

    if (status === "Ditolak" && isRollingBack) {
      try {
        await recordActivityLog(
          "Admin",
          "admin",
          "Booking Diubah",
          `Booking ID ${id} diubah dari Selesai menjadi Ditolak. Progress yang terkait telah di-rollback.`
        );
      } catch (e) {
        console.error("[updateBookingStatus] Activity log error:", e);
      }
    }

    return { success: true, message: `Status booking diperbarui menjadi "${status}".` };
  }

  // Development-only fallback
  updateMockBookingStatus(id, status);
  return { success: true, message: `Status booking diperbarui menjadi "${status}".` };
}

/**
 * Mark a specific kating as contacted for a booking.
 */
export async function updateBookingContactedStatus(id: string, kating_id: string) {
  const timeStr = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }) + " WIB";

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("booking_kating")
      .update({ contacted: true, contacted_at: timeStr })
      .eq("booking_id", id)
      .eq("kating_id", kating_id);

    if (error) {
      console.error("[updateBookingContactedStatus] Supabase update error:", error.message, error.code);
      return { success: false, message: `Gagal memperbarui status kontak: ${error.message}` };
    }

    return { success: true };
  }

  // Development-only fallback
  updateMockBookingContactedStatus(id, kating_id);
  return { success: true };
}

/**
 * Compact booking data for calendar availability calculation.
 * Returns ALL bookings (all kelompok) with kating_ids array.
 */
export async function fetchAllBookingsForCalendar(): Promise<CalendarBookingEntry[]> {
  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();

    // Fetch booking basic data + their kating via booking_kating
    const { data: bookings, error: bookingError } = await adminClient
      .from("booking")
      .select("id, tanggal, slot_id, status");

    if (bookingError) {
      console.error("[fetchAllBookingsForCalendar] booking error:", bookingError.message);
      return [];
    }

    if (!bookings || bookings.length === 0) return [];

    // Batch-fetch all booking_kating for these booking ids (single query)
    const bookingIds = bookings.map((b: any) => b.id);
    const { data: bkRows } = await adminClient
      .from("booking_kating")
      .select("booking_id, kating_id")
      .in("booking_id", bookingIds);

    // Build kating_ids map per booking
    const katingMap = new Map<string, string[]>();
    (bkRows ?? []).forEach((r: any) => {
      const arr = katingMap.get(r.booking_id) ?? [];
      arr.push(r.kating_id);
      katingMap.set(r.booking_id, arr);
    });

    return bookings.map((b: any) => ({
      tanggal: b.tanggal,
      slot_id: b.slot_id,
      status: b.status,
      kating_ids: katingMap.get(b.id) ?? [],
    })) as CalendarBookingEntry[];
  }
  return [];
}

/**
 * Permanently delete a booking and its booking_kating relations.
 * Only admin should call this via the server action.
 */
export async function deleteBooking(id: string): Promise<{ success: boolean; message: string }> {
  if (!id) return { success: false, message: "ID booking tidak valid." };

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseAdminClient();

    // Rollback seluruh progress & presensi terkait booking ini terlebih dahulu
    try {
      await rollbackBookingProgress(id);
    } catch (e) {
      console.error("[deleteBooking] rollback error:", e);
    }

    // Delete child rows first (if CASCADE is not set in DB)
    const { error: bkError } = await supabase
      .from("booking_kating")
      .delete()
      .eq("booking_id", id);

    if (bkError) {
      console.error("[deleteBooking] booking_kating delete error:", bkError.message);
      return { success: false, message: `Gagal menghapus relasi kating: ${bkError.message}` };
    }

    const { error } = await supabase.from("booking").delete().eq("id", id);

    if (error) {
      console.error("[deleteBooking] booking delete error:", error.message);
      return { success: false, message: `Gagal menghapus booking: ${error.message}` };
    }

    return { success: true, message: "Booking berhasil dihapus." };
  }

  // Mock fallback
  const { deleteMockBooking } = await import("@/lib/mock-db");
  deleteMockBooking(id);
  return { success: true, message: "Booking berhasil dihapus." };
}

/**
 * Returns total count of active kating (total, no gender split).
 */
export async function fetchKatingCounts(): Promise<{ total: number }> {
  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();
    const { count, error } = await adminClient
      .from("kating")
      .select("id", { count: "exact", head: true })
      .eq("aktif", true);

    if (error) {
      console.error("[fetchKatingCounts] error:", error.message);
      return { total: 0 };
    }
    return { total: count ?? 0 };
  }
  return { total: 0 };
}

/**
 * Update an existing booking in "Menunggu Konfirmasi" status with last-mile conflict check.
 */
export async function updateBookingDetails(
  bookingId: string,
  data: {
    tanggal: string;
    slot_id: string;
    kating_ids: string[];
    catatan?: string;
    jam_pulang?: string | null;
    tempat_taaruf?: string | null;
    participants?: {
      presentOriginalIds: string[];
      absentOriginalIds: string[];
      substitutes: { substituteId: string; replacesId: string }[];
    };
  }
): Promise<{ success: boolean; data?: BookingWithDetails; message?: string }> {
  if (!bookingId) {
    return { success: false, message: "ID booking tidak valid." };
  }

  if (!data.tanggal || !data.slot_id || !data.kating_ids || data.kating_ids.length === 0) {
    return { success: false, message: "Mohon lengkapi tanggal, slot, dan minimal 1 kating." };
  }

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();

    // 1. Fetch current booking state
    const { data: currentBooking, error: fetchErr } = await supabase
      .from("booking")
      .select(`
        id, kelompok_id, tanggal, slot_id, status, catatan, jam_pulang, tempat_taaruf,
        kelompok:kelompok_id(nomor_kelompok, kelas),
        slot:slot_id(nama_slot),
        booking_kating(kating_id, kating:kating_id(nama))
      `)
      .eq("id", bookingId)
      .single();

    if (fetchErr || !currentBooking) {
      return { success: false, message: "Booking tidak ditemukan." };
    }

    const editableStatuses: string[] = ["Menunggu Konfirmasi", "Disetujui"];
    if (!editableStatuses.includes(currentBooking.status)) {
      return {
        success: false,
        message: `Hanya booking berstatus "Menunggu Konfirmasi" atau "Disetujui" yang dapat diubah. Status saat ini: "${currentBooking.status}".`,
      };
    }

    // Fetch slot name for new slot_id if changed
    const { data: newSlot } = await supabase
      .from("slot_waktu")
      .select("nama_slot")
      .eq("id", data.slot_id)
      .single();

    // 2. LAST-MILE CONFLICT CHECK (Right before UPDATE) — berbasis slot_id
    const { data: conflictingBookings } = await supabase
      .from("booking")
      .select("id")
      .eq("tanggal", data.tanggal)
      .eq("slot_id", data.slot_id)
      .neq("id", bookingId)
      .not("status", "in", '("Ditolak","Dibatalkan")');

    if (conflictingBookings && conflictingBookings.length > 0) {
      const conflictingBookingIds = conflictingBookings.map((b: any) => b.id);
      const { data: busyKatingRows } = await supabase
        .from("booking_kating")
        .select("kating_id, kating:kating_id(nama)")
        .in("booking_id", conflictingBookingIds)
        .in("kating_id", data.kating_ids);

      if (busyKatingRows && busyKatingRows.length > 0) {
        const busyNames = busyKatingRows.map((r: any) => r.kating?.nama ?? "Kating").join(", ");
        return {
          success: false,
          message: `🔴 Konflik Booking: ${busyNames} sudah dibooking oleh kelompok lain pada tanggal ${data.tanggal} slot ${newSlot?.nama_slot ?? "tersebut"}. Silakan pilih kating lain.`,
        };
      }
    }

    // 2b. VALIDASI KONFLIK BERBASIS WAKTU — tangkap slot berbeda tapi waktu overlap
    const { data: newSlotDetail } = await supabase
      .from("slot_waktu")
      .select("jam_mulai, jam_selesai")
      .eq("id", data.slot_id)
      .single();

    if (newSlotDetail) {
      const { data: sameDayOtherBookings } = await supabase
        .from("booking")
        .select("id, slot_id, slot:slot_id(jam_mulai, jam_selesai)")
        .eq("tanggal", data.tanggal)
        .neq("slot_id", data.slot_id)
        .neq("id", bookingId)
        .not("status", "in", '("Ditolak","Dibatalkan")');

      if (sameDayOtherBookings && sameDayOtherBookings.length > 0) {
        const timeOverlapIds = (sameDayOtherBookings as any[])
          .filter((b) => {
            const bSlot = b.slot as { jam_mulai: string; jam_selesai: string } | null;
            if (!bSlot) return false;
            return doTimeSlotsOverlap(
              (newSlotDetail as any).jam_mulai,
              (newSlotDetail as any).jam_selesai,
              bSlot.jam_mulai,
              bSlot.jam_selesai
            );
          })
          .map((b) => b.id);

        if (timeOverlapIds.length > 0) {
          const { data: timeConflictKating } = await supabase
            .from("booking_kating")
            .select("kating_id, kating:kating_id(nama)")
            .in("booking_id", timeOverlapIds)
            .in("kating_id", data.kating_ids);

          if (timeConflictKating && timeConflictKating.length > 0) {
            const conflictNames = timeConflictKating.map((r: any) => r.kating?.nama ?? "Kating").join(", ");
            return {
              success: false,
              message: `🔴 Konflik Waktu: ${conflictNames} sudah memiliki sesi lain pada rentang waktu yang sama (${(newSlotDetail as any).jam_mulai}–${(newSlotDetail as any).jam_selesai}). Silakan pilih kating lain.`,
            };
          }
        }
      }
    }

    // Fetch new kating names for logging
    const { data: newKatingList } = await supabase
      .from("kating")
      .select("id, nama")
      .in("id", data.kating_ids);

    const oldKatingNames = (currentBooking.booking_kating ?? [])
      .map((bk: any) => bk.kating?.nama ?? "Kating")
      .join(", ") || "-";
    const newKatingNames = (newKatingList ?? []).map((k: any) => k.nama).join(", ") || "-";

    const oldSlotName = (currentBooking.slot as any)?.nama_slot ?? "Slot";
    const newSlotName = newSlot?.nama_slot ?? "Slot";

    // 3. Perform UPDATE on booking table (booking_id remains unchanged)
    const { error: updateErr } = await supabase
      .from("booking")
      .update({
        tanggal: data.tanggal,
        slot_id: data.slot_id,
        catatan: data.catatan || null,
        jam_pulang: data.jam_pulang || null,
        tempat_taaruf: data.tempat_taaruf || null,
      })
      .eq("id", bookingId);

    if (updateErr) {
      return { success: false, message: `Gagal memperbarui booking: ${updateErr.message}` };
    }

    // 4. Update booking_kating table
    const { error: deleteBkErr } = await supabase
      .from("booking_kating")
      .delete()
      .eq("booking_id", bookingId);

    if (deleteBkErr) {
      console.error("[updateBookingDetails] delete booking_kating error:", deleteBkErr.message);
    }

    const newBkRows = data.kating_ids.map((kating_id) => ({
      booking_id: bookingId,
      kating_id,
    }));

    const { error: insertBkErr } = await supabase
      .from("booking_kating")
      .insert(newBkRows);

    if (insertBkErr) {
      return { success: false, message: `Gagal memperbarui kating pendamping: ${insertBkErr.message}` };
    }

    // 4.5. Incremental Synchronization of booking_participants
    // Preserves created_at, record IDs, relations, and audit trail of untouched records.
    if (data.participants) {
      const { presentOriginalIds, absentOriginalIds, substitutes } = data.participants;

      // Desired participant map by anggota_id
      const desiredMap = new Map<
        string,
        { hadir: boolean; is_substitute: boolean; replaces_anggota_id: string | null }
      >();

      presentOriginalIds.forEach((anggotaId) => {
        desiredMap.set(anggotaId, {
          hadir: true,
          is_substitute: false,
          replaces_anggota_id: null,
        });
      });

      absentOriginalIds.forEach((anggotaId) => {
        desiredMap.set(anggotaId, {
          hadir: false,
          is_substitute: false,
          replaces_anggota_id: null,
        });
      });

      substitutes.forEach((sub) => {
        desiredMap.set(sub.substituteId, {
          hadir: true,
          is_substitute: true,
          // Guard: jangan pernah kirim string kosong / placeholder ke kolom UUID
          replaces_anggota_id: sub.replacesId || null,
        });
      });

      // Fetch existing booking_participants for this booking
      const { data: existingRows } = await supabase
        .from("booking_participants")
        .select("id, anggota_id, hadir, is_substitute, replaces_anggota_id")
        .eq("booking_id", bookingId);

      const existingMap = new Map<string, any>(
        (existingRows ?? []).map((r: any) => [r.anggota_id, r])
      );

      // 1. DELETE rows that are no longer in desiredMap
      const idsToDelete = (existingRows ?? [])
        .filter((r: any) => !desiredMap.has(r.anggota_id))
        .map((r: any) => r.id);

      if (idsToDelete.length > 0) {
        await supabase
          .from("booking_participants")
          .delete()
          .in("id", idsToDelete);
      }

      // 2. UPDATE existing rows that changed
      for (const [anggotaId, desired] of desiredMap.entries()) {
        const existing = existingMap.get(anggotaId);
        if (existing) {
          if (
            existing.hadir !== desired.hadir ||
            existing.is_substitute !== desired.is_substitute ||
            existing.replaces_anggota_id !== desired.replaces_anggota_id
          ) {
            await supabase
              .from("booking_participants")
              .update({
                hadir: desired.hadir,
                is_substitute: desired.is_substitute,
                replaces_anggota_id: desired.replaces_anggota_id,
              })
              .eq("id", existing.id);
          }
        }
      }

      // 3. INSERT new rows that do not exist yet
      const rowsToInsert: any[] = [];
      for (const [anggotaId, desired] of desiredMap.entries()) {
        if (!existingMap.has(anggotaId)) {
          rowsToInsert.push({
            booking_id: bookingId,
            anggota_id: anggotaId,
            hadir: desired.hadir,
            is_substitute: desired.is_substitute,
            replaces_anggota_id: desired.replaces_anggota_id,
          });
        }
      }

      if (rowsToInsert.length > 0) {
        const { error: insertErr } = await supabase
          .from("booking_participants")
          .insert(rowsToInsert);

        if (insertErr) {
          console.error("[updateBookingDetails] booking_participants insert error:", insertErr.message);
        }
      }
    }

    // 5. Detailed Activity Log
    const kelompokObj = (currentBooking as any).kelompok;
    const kelompokInfo = kelompokObj
      ? `Kelompok ${Array.isArray(kelompokObj) ? kelompokObj[0]?.nomor_kelompok : kelompokObj.nomor_kelompok} (${Array.isArray(kelompokObj) ? kelompokObj[0]?.kelas : kelompokObj.kelas})`
      : "Kelompok";

    const logDetails = `${kelompokInfo} mengubah booking\nTanggal: ${currentBooking.tanggal} → ${data.tanggal}\nSlot: ${oldSlotName} → ${newSlotName}\nKating: ${oldKatingNames} → ${newKatingNames}`;

    await recordActivityLog(
      kelompokInfo,
      "kelompok",
      "Booking Diubah",
      logDetails
    );

    // 6. Fetch updated full booking
    const { data: updatedFull } = await supabase
      .from("booking")
      .select(
        `id, kelompok_id, tanggal, slot_id, status, catatan, jam_pulang, tempat_taaruf, created_at,
        kelompok:kelompok_id(nomor_kelompok, kelas),
        slot:slot_id(nama_slot, jam_mulai, jam_selesai),
        booking_kating(kating_id, contacted, contacted_at, kating:kating_id(id, nama, jenis_kelamin, nomor_whatsapp))`
      )
      .eq("id", bookingId)
      .single();

    if (updatedFull) {
      const b = updatedFull as any;
      const resultBooking: BookingWithDetails = {
        id: b.id,
        kelompok_id: b.kelompok_id,
        tanggal: b.tanggal,
        slot_id: b.slot_id,
        status: b.status as BookingStatus,
        catatan: b.catatan,
        jam_pulang: b.jam_pulang ?? null,
        tempat_taaruf: b.tempat_taaruf ?? null,
        created_at: b.created_at,
        kelompok_nama: b.kelompok
          ? `Kelompok ${b.kelompok.nomor_kelompok} (${b.kelompok.kelas})`
          : "Kelompok",
        slot_nama: b.slot?.nama_slot ?? "Slot",
        jam_mulai: b.slot?.jam_mulai ?? "00:00",
        jam_selesai: b.slot?.jam_selesai ?? "00:00",
        kating_list: (b.booking_kating ?? []).map((bk: any) => ({
          id: bk.kating?.id ?? bk.kating_id,
          nama: bk.kating?.nama ?? "Kating",
          jenis_kelamin: bk.kating?.jenis_kelamin ?? "L",
          nomor_whatsapp: bk.kating?.nomor_whatsapp ?? "",
          contacted: bk.contacted ?? false,
          contacted_at: bk.contacted_at ?? null,
        })) as KatingBasic[],
      };
      return { success: true, data: resultBooking, message: "Booking berhasil diperbarui." };
    }

    return { success: true, message: "Booking berhasil diperbarui." };
  }

  return { success: false, message: "Supabase belum dikonfigurasi." };
}

/**
 * Fetch participants for a given booking.
 * Single source of truth for final booking participants across all views.
 */
export async function fetchBookingParticipants(bookingId: string) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data: rows, error } = await supabase
      .from("booking_participants")
      .select(`
        id, booking_id, anggota_id, hadir, is_substitute, replaces_anggota_id,
        anggota:anggota_id(
          id, nama, jenis_kelamin, kelompok_id,
          kelompok:kelompok_id(nomor_kelompok, kelas)
        ),
        replaces:replaces_anggota_id(id, nama)
      `)
      .eq("booking_id", bookingId);

    if (error) {
      console.error("[fetchBookingParticipants] error:", error.message);
      return [];
    }

    return (rows ?? []).map((r: any) => ({
      id: r.id,
      booking_id: r.booking_id,
      anggota_id: r.anggota_id,
      hadir: r.hadir,
      is_substitute: r.is_substitute,
      replaces_anggota_id: r.replaces_anggota_id,
      anggota_nama: r.anggota?.nama ?? "Anggota",
      replaces_nama: r.replaces?.nama ?? "Anggota",
      anggota: r.anggota
        ? {
            id: r.anggota.id,
            nama: r.anggota.nama,
            jenis_kelamin: r.anggota.jenis_kelamin ?? "L",
            kelompok_id: r.anggota.kelompok_id,
            kelompok_nama: r.anggota.kelompok
              ? `Kelompok ${r.anggota.kelompok.nomor_kelompok} (${r.anggota.kelompok.kelas})`
              : "Kelompok",
            aktif: true,
          }
        : null,
    }));
  }
  return [];
}

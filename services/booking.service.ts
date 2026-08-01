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
import type { BookingStatus, CalendarBookingEntry, KatingBasic, Kating } from "@/types/database";

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
 */
export async function fetchAvailableKating(
  tanggal: string,
  slot_id: string
): Promise<Kating[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data: katingList } = await supabase
      .from("kating")
      .select("*")
      .eq("aktif", true);

    if (!katingList) return [];

    // Find kating already booked on this date+slot (via booking_kating)
    const { data: busyRows } = await supabase
      .from("booking_kating")
      .select("kating_id, booking:booking_id(tanggal, slot_id, status)")
      .filter("booking.tanggal", "eq", tanggal)
      .filter("booking.slot_id", "eq", slot_id)
      .not("booking.status", "in", '("Ditolak","Dibatalkan")');

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

  // Validate availability for every selected kating
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

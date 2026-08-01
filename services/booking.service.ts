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
import type { BookingStatus, CalendarBookingEntry, Gender, Kating } from "@/types/database";

// CalendarBookingEntry is defined in @/types/database and re-exported for convenience
export type { CalendarBookingEntry } from "@/types/database";

export async function fetchBookingList(
  kelompokId?: string
): Promise<BookingWithDetails[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("booking")
      .select(
        `
        *,
        kelompok:kelompok_id(nomor_kelompok, kelas),
        slot:slot_id(nama_slot, jam_mulai, jam_selesai),
        kating_laki:kating_laki_id(nama, nomor_whatsapp),
        kating_perempuan:kating_perempuan_id(nama, nomor_whatsapp)
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
        kating_laki_id: b.kating_laki_id,
        kating_perempuan_id: b.kating_perempuan_id,
        status: b.status as BookingStatus,
        catatan: b.catatan,
        jam_pulang: b.jam_pulang ?? null,
        created_at: b.created_at,
        akang_contacted: b.akang_contacted,
        akang_contacted_at: b.akang_contacted_at,
        teteh_contacted: b.teteh_contacted,
        teteh_contacted_at: b.teteh_contacted_at,
        kelompok_nama: b.kelompok
          ? `Kelompok ${b.kelompok.nomor_kelompok} (${b.kelompok.kelas})`
          : "Kelompok",
        slot_nama: b.slot ? b.slot.nama_slot : "Slot",
        jam_mulai: b.slot ? b.slot.jam_mulai : "00:00",
        jam_selesai: b.slot ? b.slot.jam_selesai : "00:00",
        kating_laki_nama: b.kating_laki ? b.kating_laki.nama : "Akang",
        kating_perempuan_nama: b.kating_perempuan ? b.kating_perempuan.nama : "Teteh",
        kating_laki_wa: b.kating_laki ? b.kating_laki.nomor_whatsapp : "",
        kating_perempuan_wa: b.kating_perempuan ? b.kating_perempuan.nomor_whatsapp : "",
      }));
    }
  }

  return getMockBookingList(kelompokId);
}

export async function fetchAvailableKating(
  tanggal: string,
  slot_id: string,
  gender: Gender
): Promise<Kating[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data: katingList } = await supabase
      .from("kating")
      .select("*")
      .eq("jenis_kelamin", gender)
      .eq("aktif", true);

    if (!katingList) return [];

    const { data: busyBookings } = await supabase
      .from("booking")
      .select("kating_laki_id, kating_perempuan_id")
      .eq("tanggal", tanggal)
      .eq("slot_id", slot_id)
      .not("status", "in", '("Ditolak","Dibatalkan")');

    const busyIds = new Set<string>();
    (busyBookings || []).forEach((b: any) => {
      if (b.kating_laki_id) busyIds.add(b.kating_laki_id);
      if (b.kating_perempuan_id) busyIds.add(b.kating_perempuan_id);
    });

    return katingList.filter((k: any) => !busyIds.has(k.id)) as Kating[];
  }

  return getAvailableKatingList(tanggal, slot_id, gender);
}

export async function createBooking(data: {
  kelompok_id: string;
  tanggal: string;
  slot_id: string;
  kating_laki_id: string;
  kating_perempuan_id: string;
  catatan?: string;
  jam_pulang?: string | null;
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

  const availableAkang = await fetchAvailableKating(data.tanggal, data.slot_id, "L");
  const availableTeteh = await fetchAvailableKating(data.tanggal, data.slot_id, "P");

  const isAkangFree = availableAkang.some((k) => k.id === data.kating_laki_id);
  const isTetehFree = availableTeteh.some((k) => k.id === data.kating_perempuan_id);

  if (!isAkangFree || !isTetehFree) {
    return {
      success: false,
      message:
        "Akang atau Teteh yang Anda pilih baru saja dibooking oleh kelompok lain untuk slot waktu tersebut. Silakan pilih kating lain.",
    };
  }

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data: created, error } = await supabase
      .from("booking")
      .insert({
        kelompok_id: data.kelompok_id,
        tanggal: data.tanggal,
        slot_id: data.slot_id,
        kating_laki_id: data.kating_laki_id,
        kating_perempuan_id: data.kating_perempuan_id,
        status: "Menunggu Konfirmasi",
        catatan: data.catatan || null,
        jam_pulang: data.jam_pulang || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[createBooking] Supabase insert error:", error.message, error.code);
      return {
        success: false,
        message: `Gagal membuat booking: ${error.message}`,
      };
    }

    return { success: true, data: created };
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

export async function updateBookingContactedStatus(id: string, gender: Gender) {
  const timeStr = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }) + " WIB";

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const payload = gender === "L"
      ? { akang_contacted: true, akang_contacted_at: timeStr }
      : { teteh_contacted: true, teteh_contacted_at: timeStr };

    const { error } = await supabase.from("booking").update(payload).eq("id", id);

    if (error) {
      console.error("[updateBookingContactedStatus] Supabase update error:", error.message, error.code);
      return { success: false, message: `Gagal memperbarui status kontak: ${error.message}` };
    }

    return { success: true };
  }

  // Development-only fallback
  const updated = updateMockBookingContactedStatus(id, gender);
  return { success: true, data: updated };
}

/**
 * Compact booking data for calendar availability calculation.
 * Returns ALL bookings (all kelompok) with only the fields needed.
 */
export async function fetchAllBookingsForCalendar(): Promise<CalendarBookingEntry[]> {
  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();
    const { data, error } = await adminClient
      .from("booking")
      .select("tanggal, slot_id, kating_laki_id, kating_perempuan_id, status");

    if (error) {
      console.error("[fetchAllBookingsForCalendar] error:", error.message);
      return [];
    }
    return (data ?? []) as CalendarBookingEntry[];
  }
  return [];
}

/**
 * Returns total count of active kating per gender.
 */
export async function fetchKatingCounts(): Promise<{ totalL: number; totalP: number }> {
  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();
    const { data, error } = await adminClient
      .from("kating")
      .select("id, jenis_kelamin")
      .eq("aktif", true);

    if (error) {
      console.error("[fetchKatingCounts] error:", error.message);
      return { totalL: 0, totalP: 0 };
    }
    const totalL = (data ?? []).filter((k: any) => k.jenis_kelamin === "L").length;
    const totalP = (data ?? []).filter((k: any) => k.jenis_kelamin === "P").length;
    return { totalL, totalP };
  }
  return { totalL: 0, totalP: 0 };
}

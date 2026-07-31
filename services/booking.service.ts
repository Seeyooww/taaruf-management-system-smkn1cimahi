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
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchEventSettings } from "@/services/settings.service";
import { fetchSlotList } from "@/services/slot.service";
import type { BookingStatus, Gender, Kating } from "@/types/database";

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
      })
      .select()
      .single();

    if (!error && created) {
      return { success: true, data: created };
    }
  }

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

    if (!error) {
      return { success: true, message: `Status booking diperbarui menjadi "${status}".` };
    }
  }

  updateMockBookingStatus(id, status);
  return { success: true, message: `Status booking diperbarui menjadi "${status}".` };
}

export async function updateBookingContactedStatus(id: string, gender: Gender) {
  const timeStr = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }) + " WIB";

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const payload = gender === "L"
        ? { akang_contacted: true, akang_contacted_at: timeStr }
        : { teteh_contacted: true, teteh_contacted_at: timeStr };

      await supabase.from("booking").update(payload).eq("id", id);
    } catch {
      // Fallback
    }
  }

  const updated = updateMockBookingContactedStatus(id, gender);
  return { success: true, data: updated };
}

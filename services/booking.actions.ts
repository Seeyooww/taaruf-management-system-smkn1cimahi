"use server";

import {
  createBooking,
  fetchAllBookingsForCalendar,
  fetchAvailableKating,
  fetchBookingList,
  fetchKatingCounts,
  updateBookingContactedStatus,
  updateBookingStatus,
} from "@/services/booking.service";
import type { BookingStatus, Gender } from "@/types/database";

export async function getBookingAction(kelompokId?: string) {
  return await fetchBookingList(kelompokId);
}

export async function getAvailableKatingAction(
  tanggal: string,
  slot_id: string,
  gender: Gender
) {
  if (!tanggal || !slot_id) return [];
  return await fetchAvailableKating(tanggal, slot_id, gender);
}

export async function createBookingAction(formData: FormData) {
  const kelompok_id = String(formData.get("kelompok_id") || "").trim();
  const tanggal = String(formData.get("tanggal") || "").trim();
  const slot_id = String(formData.get("slot_id") || "").trim();
  const kating_laki_id = String(formData.get("kating_laki_id") || "").trim();
  const kating_perempuan_id = String(formData.get("kating_perempuan_id") || "").trim();
  const catatan = String(formData.get("catatan") || "").trim();
  const jam_pulang = String(formData.get("jam_pulang") || "").trim();

  if (!kelompok_id || !tanggal || !slot_id || !kating_laki_id || !kating_perempuan_id) {
    return {
      success: false,
      message: "Mohon lengkapi seluruh langkah pemilihan (Hari, Slot, Akang, & Teteh).",
    };
  }

  const result = await createBooking({
    kelompok_id,
    tanggal,
    slot_id,
    kating_laki_id,
    kating_perempuan_id,
    catatan,
    jam_pulang: jam_pulang || null,
  });

  if (result.success) {
    return {
      success: true,
      data: result.data,
      message: "Booking berhasil dibuat dengan status 'Menunggu Konfirmasi'!",
    };
  }

  return {
    success: false,
    message: result.message || "Gagal membuat booking.",
  };
}

export async function updateBookingStatusAction(
  id: string,
  status: BookingStatus
) {
  if (!id || !status) {
    return { success: false, message: "ID atau Status tidak valid." };
  }

  return await updateBookingStatus(id, status);
}

export async function updateBookingContactedAction(id: string, gender: Gender) {
  if (!id || !gender) {
    return { success: false, message: "Parameter tidak valid." };
  }
  return await updateBookingContactedStatus(id, gender);
}

export async function getAllBookingsForCalendarAction() {
  return await fetchAllBookingsForCalendar();
}

export async function getKatingCountsAction() {
  return await fetchKatingCounts();
}

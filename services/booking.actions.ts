"use server";

import {
  createBooking,
  deleteBooking,
  fetchAllBookingsForCalendar,
  fetchAvailableKating,
  fetchBookingList,
  fetchKatingCounts,
  updateBookingContactedStatus,
  updateBookingStatus,
} from "@/services/booking.service";
import type { BookingStatus } from "@/types/database";

export async function getBookingAction(kelompokId?: string) {
  return await fetchBookingList(kelompokId);
}

export async function getAvailableKatingAction(
  tanggal: string,
  slot_id: string
) {
  if (!tanggal || !slot_id) return [];
  return await fetchAvailableKating(tanggal, slot_id);
}

export async function createBookingAction(formData: FormData) {
  const kelompok_id = String(formData.get("kelompok_id") || "").trim();
  const tanggal = String(formData.get("tanggal") || "").trim();
  const slot_id = String(formData.get("slot_id") || "").trim();
  // Support multiple kating_ids via repeated FormData keys
  const kating_ids = formData.getAll("kating_ids").map((v) => String(v).trim()).filter(Boolean);
  const catatan = String(formData.get("catatan") || "").trim();
  const jam_pulang = String(formData.get("jam_pulang") || "").trim();
  const tempat_taaruf = String(formData.get("tempat_taaruf") || "").trim();
  const participantsRaw = formData.get("participants");

  if (!kelompok_id || !tanggal || !slot_id) {
    return {
      success: false,
      message: "Mohon lengkapi seluruh langkah pemilihan (Hari, Slot).",
    };
  }

  if (kating_ids.length === 0) {
    return {
      success: false,
      message: "Mohon pilih minimal satu kating pendamping.",
    };
  }

  let participants: {
    presentOriginalIds: string[];
    absentOriginalIds: string[];
    substitutes: { substituteId: string; replacesId: string }[];
  } | undefined;

  if (participantsRaw) {
    try {
      participants = JSON.parse(String(participantsRaw));
    } catch {
      // Non-fatal: ignore malformed JSON, booking proceeds without participants
      console.warn("[createBookingAction] Failed to parse participants JSON");
    }
  }

  const result = await createBooking({
    kelompok_id,
    tanggal,
    slot_id,
    kating_ids,
    catatan,
    jam_pulang: jam_pulang || null,
    tempat_taaruf: tempat_taaruf || null,
    participants,
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

/**
 * Update contacted status per kating_id (menggantikan per-gender).
 */
export async function updateBookingContactedAction(id: string, kating_id: string) {
  if (!id || !kating_id) {
    return { success: false, message: "Parameter tidak valid." };
  }
  return await updateBookingContactedStatus(id, kating_id);
}

export async function getAllBookingsForCalendarAction() {
  return await fetchAllBookingsForCalendar();
}

export async function getKatingCountsAction() {
  return await fetchKatingCounts();
}

export async function deleteBookingAction(id: string) {
  if (!id) return { success: false, message: "ID tidak valid." };
  return await deleteBooking(id);
}

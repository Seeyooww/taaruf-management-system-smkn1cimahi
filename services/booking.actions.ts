"use server";

import {
  createBooking,
  deleteBooking,
  fetchAllBookingsForCalendar,
  fetchAvailableKating,
  fetchBookingList,
  fetchBookingParticipants,
  fetchKatingCounts,
  updateBookingContactedStatus,
  updateBookingDetails,
  updateBookingStatus,
} from "@/services/booking.service";
import type { BookingStatus } from "@/types/database";

export async function getBookingParticipantsAction(bookingId: string) {
  if (!bookingId) return [];
  return await fetchBookingParticipants(bookingId);
}

export async function getBookingAction(kelompokId?: string) {
  return await fetchBookingList(kelompokId);
}

export async function getAvailableKatingAction(
  tanggal: string,
  slot_id: string,
  excludeBookingId?: string
) {
  if (!tanggal || !slot_id) return [];
  return await fetchAvailableKating(tanggal, slot_id, excludeBookingId);
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

export async function updateBookingDetailsAction(formData: FormData) {
  const booking_id = String(formData.get("booking_id") || "").trim();
  const tanggal = String(formData.get("tanggal") || "").trim();
  const slot_id = String(formData.get("slot_id") || "").trim();
  const kating_ids = formData.getAll("kating_ids").map((v) => String(v).trim()).filter(Boolean);
  const catatan = String(formData.get("catatan") || "").trim();
  const jam_pulang = String(formData.get("jam_pulang") || "").trim();
  const tempat_taaruf = String(formData.get("tempat_taaruf") || "").trim();

  // Participants (optional – sent by EditBookingDialog when managing peserta)
  const presentOriginalIds = formData
    .getAll("present_ids")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const absentOriginalIds = formData
    .getAll("absent_ids")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const substituteRaw = formData
    .getAll("substitutes")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const substitutes = substituteRaw
    .map((s) => {
      const [substituteId, replacesId] = s.split(":");
      return substituteId && replacesId ? { substituteId, replacesId } : null;
    })
    .filter((s): s is { substituteId: string; replacesId: string } => s !== null);

  if (!booking_id || !tanggal || !slot_id) {
    return {
      success: false,
      message: "Mohon lengkapi parameter pengubahan booking.",
    };
  }

  if (kating_ids.length === 0) {
    return {
      success: false,
      message: "Mohon pilih minimal satu kating pendamping.",
    };
  }

  const hasParticipants =
    presentOriginalIds.length > 0 ||
    absentOriginalIds.length > 0 ||
    substitutes.length > 0;

  return await updateBookingDetails(booking_id, {
    tanggal,
    slot_id,
    kating_ids,
    catatan,
    jam_pulang: jam_pulang || null,
    tempat_taaruf: tempat_taaruf || null,
    participants: hasParticipants
      ? { presentOriginalIds, absentOriginalIds, substitutes }
      : undefined,
  });
}

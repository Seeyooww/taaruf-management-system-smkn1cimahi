"use server";

import {
  checkProgressEstimate,
  deleteKatingProgressByBooking,
  fetchAnggotaProgressSummaries,
  rollbackBookingProgress,
  saveBookingProgress,
} from "@/services/progress.service";
import type { ParticipantEstimateItem, SubstituteEntry } from "@/types/database";

export async function getAnggotaProgressAction(kelompokId?: string) {
  return await fetchAnggotaProgressSummaries(kelompokId);
}

export async function calculateBookingProgressAction(
  bookingId: string,
  presentOriginalIds: string[] = [],
  absentOriginalIds: string[] = [],
  substitutes: SubstituteEntry[] = []
) {
  if (!bookingId) {
    return { success: false, message: "Booking ID tidak valid." };
  }

  const totalHadir = presentOriginalIds.length + substitutes.length;
  if (totalHadir === 0 && absentOriginalIds.length === 0) {
    return { success: false, message: "Tidak ada data kehadiran yang bisa disimpan." };
  }

  return await saveBookingProgress(bookingId, presentOriginalIds, absentOriginalIds, substitutes);
}

export async function checkProgressEstimateAction(
  participants: ParticipantEstimateItem[],
  katingIds: string[]
) {
  if (!participants || participants.length === 0 || !katingIds || katingIds.length === 0) {
    return {
      willIncreaseList: [],
      alreadyMetList: [],
      totalParticipants: 0,
      totalIncrease: 0,
      totalUnchanged: 0,
    };
  }

  return await checkProgressEstimate(participants, katingIds);
}

/**
 * Rollback seluruh progress yang dibuat oleh satu booking.
 * Dipanggil saat status berubah dari Selesai → Ditolak/Dibatalkan.
 */
export async function rollbackBookingProgressAction(bookingId: string) {
  if (!bookingId) return { success: false, message: "Booking ID tidak valid." };
  return await rollbackBookingProgress(bookingId);
}

/**
 * Hapus progress untuk satu kating dalam satu booking tertentu.
 * Digunakan pada fitur "Hapus Riwayat" di Laporan Kating.
 */
export async function deleteKatingHistoryAction(katingId: string, bookingId: string) {
  if (!katingId || !bookingId) {
    return { success: false, message: "Parameter tidak valid." };
  }
  return await deleteKatingProgressByBooking(katingId, bookingId);
}


"use server";

import {
  fetchAnggotaProgressSummaries,
  saveBookingProgress,
} from "@/services/progress.service";
import type { SubstituteEntry } from "@/types/database";

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

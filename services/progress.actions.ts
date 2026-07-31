"use server";

import {
  fetchAnggotaProgressSummaries,
  saveBookingProgress,
} from "@/services/progress.service";

export async function getAnggotaProgressAction(kelompokId?: string) {
  return await fetchAnggotaProgressSummaries(kelompokId);
}

export async function calculateBookingProgressAction(
  bookingId: string,
  presentAnggotaIds: string[]
) {
  if (!bookingId || !presentAnggotaIds || presentAnggotaIds.length === 0) {
    return {
      success: false,
      message: "Silakan pilih minimal 1 anggota yang hadir untuk menghitung progress.",
    };
  }

  return await saveBookingProgress(bookingId, presentAnggotaIds);
}

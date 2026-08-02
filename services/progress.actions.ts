"use server";

import {
  checkProgressEstimate,
  fetchAnggotaProgressSummaries,
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

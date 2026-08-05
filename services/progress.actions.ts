"use server";

import {
  checkProgressEstimate,
  createManualProgress,
  deleteKatingProgressByBooking,
  fetchAnggotaProgressSummaries,
  rollbackBookingProgress,
  saveBookingProgress,
  updateManualProgress,
} from "@/services/progress.service";
import { fetchKatingList } from "@/services/kating.service";
import { fetchSlotList } from "@/services/slot.service";
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
 * Digunakan pada fitur "Hapus Riwayat" di Laporan Kating & Progress.
 */
export async function deleteKatingHistoryAction(katingId: string, bookingId: string) {
  if (!katingId || !bookingId) {
    return { success: false, message: "Parameter tidak valid." };
  }
  return await deleteKatingProgressByBooking(katingId, bookingId);
}

/**
 * Tambah riwayat progress anggota secara manual oleh Admin.
 */
export async function createManualProgressAction(
  anggotaId: string,
  katingId: string,
  tanggal: string,
  slotId: string
) {
  return await createManualProgress(anggotaId, katingId, tanggal, slotId);
}

/**
 * Edit riwayat progress anggota secara manual oleh Admin.
 */
export async function updateManualProgressAction(
  anggotaId: string,
  oldKatingId: string,
  oldBookingId: string,
  newKatingId: string,
  newTanggal: string,
  newSlotId: string
) {
  return await updateManualProgress(
    anggotaId,
    oldKatingId,
    oldBookingId,
    newKatingId,
    newTanggal,
    newSlotId
  );
}

/**
 * Fetch daftar kating aktif & slot waktu untuk opsi form manual progress.
 */
export async function getKatingAndSlotOptionsAction() {
  const [katingList, slotList] = await Promise.all([
    fetchKatingList(),
    fetchSlotList(),
  ]);

  return {
    katingOptions: katingList.filter((k) => k.aktif),
    slotOptions: slotList.filter((s) => s.aktif),
  };
}

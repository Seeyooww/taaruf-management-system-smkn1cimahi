"use server";

import {
  fetchAnalyticsData,
  fetchLaporanAnggota,
  fetchLaporanKating,
  fetchLaporanKelompok,
  fetchLiveActiveSessions,
  fetchLPJSummary,
} from "@/services/reporting.service";

export async function getLaporanKelompokAction(filters?: {
  tanggalMulai?: string;
  tanggalSelesai?: string;
  kelompokId?: string;
  kelas?: string;
  status?: string;
}) {
  return await fetchLaporanKelompok(filters);
}

export async function getLaporanAnggotaAction(filters?: {
  kelompokId?: string;
  namaSearch?: string;
  status?: string;
  kelas?: string;
}) {
  return await fetchLaporanAnggota(filters);
}

export async function getLaporanKatingAction(filters?: {
  tanggalMulai?: string;
  tanggalSelesai?: string;
  kelompokId?: string;
  status?: string;
  katingSearch?: string;
}) {
  return await fetchLaporanKating(filters);
}

export async function getAnalyticsDataAction() {
  return await fetchAnalyticsData();
}

export async function getLPJSummaryAction() {
  return await fetchLPJSummary();
}

export async function getLiveActiveSessionsAction() {
  return await fetchLiveActiveSessions();
}

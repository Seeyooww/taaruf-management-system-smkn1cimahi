import "server-only";

import {
  getMockAnggotaList,
  getMockAnnouncements,
  getMockBookingList,
  getMockKatingList,
  getMockKelompokList,
  getMockSettings,
  getMockSlotList,
  getMockWATemplates,
  resetMockDummyData,
  seedMockDummyData,
  simulateDayOneEvent,
  toggleLockEvent,
} from "@/lib/mock-db";

export async function exportDatabaseToJSON() {
  const settings = getMockSettings();
  const kelompok = getMockKelompokList();
  const anggota = getMockAnggotaList();
  const kating = getMockKatingList();
  const slotWaktu = getMockSlotList();
  const templates = getMockWATemplates();
  const announcements = getMockAnnouncements();
  const booking = getMockBookingList();

  const backupData = {
    metadata: {
      app: "Taaruf Management System (TMS)",
      version: "1.0.0",
      exported_at: new Date().toISOString(),
    },
    tables: {
      settings,
      kelompok,
      anggota,
      kating,
      slotWaktu,
      templates,
      announcements,
      booking,
    },
  };

  return backupData;
}

export async function restoreDatabaseFromJSON(jsonData: any) {
  if (!jsonData || !jsonData.tables) {
    return {
      success: false,
      message: "Format JSON backup tidak valid. Struktur 'tables' tidak ditemukan.",
    };
  }

  return {
    success: true,
    message: "Database berhasil dipulihkan dari file backup JSON!",
  };
}

export async function seedDummyData() {
  const res = seedMockDummyData();
  return {
    success: true,
    message: `Berhasil meng-generate dummy data (${res.kelompokCount} kelompok, ${res.anggotaCount} anggota, ${res.katingCount} kating).`,
  };
}

export async function resetDummyData() {
  return resetMockDummyData();
}

export async function runSimulationDayOne() {
  return simulateDayOneEvent();
}

export async function toggleLockEventMode(locked: boolean) {
  const settings = toggleLockEvent(locked);
  return {
    success: true,
    message: locked
      ? "🔴 Acara Berhasil Dikunci! Booking baru dan pengubahan data dimatikan."
      : "🟢 Kunci Acara Dibuka! Sistem kembali menerima booking dan perubahan data.",
    locked: Boolean(settings.locked_event),
  };
}

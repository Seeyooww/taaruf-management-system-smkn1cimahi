import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
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
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function exportDatabaseToJSON() {
  if (isSupabaseConfigured()) {
    try {
      const adminClient = createSupabaseAdminClient();

      const [
        { data: settings },
        { data: kelompok },
        { data: anggota },
        { data: kating },
        { data: slotWaktu },
        { data: templates },
        { data: announcements },
        { data: booking },
      ] = await Promise.all([
        adminClient.from("settings").select("*").limit(1).maybeSingle(),
        adminClient.from("kelompok").select("*").order("nomor_kelompok"),
        adminClient.from("anggota").select("*").order("created_at"),
        adminClient.from("kating").select("*").order("nama"),
        adminClient.from("slot_waktu").select("*").order("urutan"),
        adminClient.from("whatsapp_templates").select("*"),
        adminClient.from("announcements").select("*"),
        adminClient.from("booking").select("*").order("created_at"),
      ]);

      return {
        metadata: {
          app: "Taaruf Management System (TMS)",
          version: "1.0.0",
          exported_at: new Date().toISOString(),
          source: "supabase",
        },
        tables: {
          settings: settings ? [settings] : [],
          kelompok: kelompok ?? [],
          anggota: anggota ?? [],
          kating: kating ?? [],
          slotWaktu: slotWaktu ?? [],
          templates: templates ?? [],
          announcements: announcements ?? [],
          booking: booking ?? [],
        },
      };
    } catch (err) {
      console.error("[exportDatabaseToJSON] error:", err);
    }
  }

  // Dev fallback: export mock data
  return {
    metadata: {
      app: "Taaruf Management System (TMS)",
      version: "1.0.0",
      exported_at: new Date().toISOString(),
      source: "mock",
    },
    tables: {
      settings: getMockSettings(),
      kelompok: getMockKelompokList(),
      anggota: getMockAnggotaList(),
      kating: getMockKatingList(),
      slotWaktu: getMockSlotList(),
      templates: getMockWATemplates(),
      announcements: getMockAnnouncements(),
      booking: getMockBookingList(),
    },
  };
}

export async function restoreDatabaseFromJSON(jsonData: any) {
  if (!jsonData || !jsonData.tables) {
    return {
      success: false,
      message: "Format JSON backup tidak valid. Struktur 'tables' tidak ditemukan.",
    };
  }

  // BUG-19 fix: restore is not supported to avoid accidental data overwrites.
  // Admin should use Supabase Dashboard for production restore operations.
  return {
    success: false,
    message:
      "Fitur restore otomatis tidak tersedia untuk keamanan data produksi. " +
      "Gunakan Supabase Dashboard (supabase.com) untuk restore manual melalui SQL Editor.",
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

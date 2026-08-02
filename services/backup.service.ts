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
  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();
    const jurusanList = ["SIJA", "RPL", "TKJ", "TEI", "TFLM"];

    // 1. Generate 30 Kelompok
    const kelompokRows: any[] = [];
    for (let i = 1; i <= 30; i++) {
      const jur = jurusanList[(i - 1) % jurusanList.length];
      const kelasNum = (i % 2) + 1;
      const kelasStr = `X ${jur} ${kelasNum}`;
      const username = `kelompok${i}`;

      kelompokRows.push({
        nomor_kelompok: i,
        kelas: kelasStr,
        username,
      });
    }

    const { data: insertedKelompok, error: kErr } = await adminClient
      .from("kelompok")
      .upsert(kelompokRows, { onConflict: "nomor_kelompok" })
      .select("id, nomor_kelompok");

    if (kErr || !insertedKelompok) {
      console.error("[seedDummyData] Supabase kelompok upsert error:", kErr?.message);
      return { success: false, message: `Gagal seed data kelompok: ${kErr?.message}` };
    }

    const kMap = new Map<number, string>();
    insertedKelompok.forEach((k: any) => kMap.set(k.nomor_kelompok, k.id));

    // 2. Generate 110 Anggota
    const anggotaRows: any[] = [];
    for (let i = 1; i <= 30; i++) {
      const kId = kMap.get(i);
      if (!kId) continue;
      const anggotaCount = i <= 20 ? 4 : 3;
      for (let a = 1; a <= anggotaCount; a++) {
        const g = (a + i) % 2 === 0 ? "L" : "P";
        const namePrefix = g === "L" ? ["Daffa", "Budi", "Rizky", "Fajar", "Aditya", "Gilang", "Rafi"] : ["Siti", "Dewi", "Rina", "Nabila", "Zahra", "Maya", "Putri"];
        const randName = `${namePrefix[(a + i) % namePrefix.length]} ${jurusanList[(i - 1) % jurusanList.length]} ${i}-${a}`;
        anggotaRows.push({
          kelompok_id: kId,
          nama: randName,
          jenis_kelamin: g,
          aktif: true,
        });
      }
    }

    const { error: aErr } = await adminClient.from("anggota").insert(anggotaRows);
    if (aErr) {
      console.error("[seedDummyData] Supabase anggota insert error:", aErr.message);
    }

    // 3. Generate 108 Kating
    const katingRows: any[] = [];
    for (let k = 1; k <= 108; k++) {
      const g = k <= 54 ? "L" : "P";
      const prefix = g === "L" ? "Akang" : "Teteh";
      const jur = jurusanList[(k - 1) % jurusanList.length];
      const kelasStr = `XII ${jur} ${(k % 2) + 1}`;

      katingRows.push({
        nama: `${prefix} Senior ${jur} ${k}`,
        kelas: kelasStr,
        jenis_kelamin: g,
        nomor_whatsapp: `081234567${String(k).padStart(3, "0")}`,
        aktif: true,
      });
    }

    const { error: katErr } = await adminClient.from("kating").insert(katingRows);
    if (katErr) {
      console.error("[seedDummyData] Supabase kating insert error:", katErr.message);
    }

    return {
      success: true,
      message: `Berhasil meng-generate dummy data Supabase (${insertedKelompok.length} kelompok, ${anggotaRows.length} anggota, ${katingRows.length} kating).`,
    };
  }

  const res = seedMockDummyData();
  return {
    success: true,
    message: `Berhasil meng-generate dummy data (${res.kelompokCount} kelompok, ${res.anggotaCount} anggota, ${res.katingCount} kating).`,
  };
}

export async function resetDummyData() {
  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();
    await adminClient.from("progress").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("booking_participants").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("booking_kating").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("booking").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await adminClient.from("activity_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    return { success: true, message: "Semua riwayat booking & progress di Supabase berhasil direset." };
  }

  return resetMockDummyData();
}

export async function runSimulationDayOne() {
  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();

    const { data: kelompokList } = await adminClient.from("kelompok").select("id").order("nomor_kelompok").limit(15);
    const { data: slotList } = await adminClient.from("slot_waktu").select("id").eq("aktif", true).order("urutan");
    const { data: katingList } = await adminClient.from("kating").select("id, jenis_kelamin").eq("aktif", true);

    if (!kelompokList || kelompokList.length === 0 || !slotList || slotList.length === 0 || !katingList || katingList.length === 0) {
      return { success: false, message: "Gagal menjalankan simulasi: master data tidak ditemukan di Supabase. Silakan seeder data terlebih dahulu." };
    }

    const akangs = katingList.filter((k: any) => k.jenis_kelamin === "L");
    const tetehs = katingList.filter((k: any) => k.jenis_kelamin === "P");
    const dayOneStr = "2026-08-01";

    for (let i = 0; i < Math.min(15, kelompokList.length); i++) {
      const k = kelompokList[i];
      const slotObj = slotList[i % slotList.length];
      const akangObj = akangs[i % akangs.length];
      const tetehObj = tetehs[i % tetehs.length];

      let status = "Selesai";
      if (i === 1) status = "Menunggu Konfirmasi";
      else if (i === 2) status = "Disetujui";
      else if (i === 3) status = "Ditolak";
      else if (i === 4) status = "Dibatalkan";

      const { data: createdBook, error: bErr } = await adminClient
        .from("booking")
        .insert({
          kelompok_id: k.id,
          tanggal: dayOneStr,
          slot_id: slotObj.id,
          status,
          catatan: `Simulasi otomatis Day 1 sesi ke-${i + 1}`,
          tempat_taaruf: "Masjid SMKN 1 Cimahi",
        })
        .select()
        .single();

      if (!bErr && createdBook) {
        const bkRows = [];
        if (akangObj) bkRows.push({ booking_id: createdBook.id, kating_id: akangObj.id });
        if (tetehObj) bkRows.push({ booking_id: createdBook.id, kating_id: tetehObj.id });
        if (bkRows.length > 0) {
          await adminClient.from("booking_kating").insert(bkRows);
        }
      }
    }

    return {
      success: true,
      message: "Simulasi Day 1 berhasil dijalankan di Supabase (15 sesi booking terbuat).",
    };
  }

  return simulateDayOneEvent();
}

export async function toggleLockEventMode(locked: boolean) {
  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();
    const { data: settings } = await adminClient.from("settings").select("id").limit(1).maybeSingle();

    if (settings) {
      await adminClient.from("settings").update({ locked_event: locked }).eq("id", settings.id);
    } else {
      await adminClient.from("settings").insert({ locked_event: locked });
    }

    return {
      success: true,
      message: locked
        ? "🔴 Acara Berhasil Dikunci! Booking baru dan pengubahan data dimatikan."
        : "🟢 Kunci Acara Dibuka! Sistem kembali menerima booking dan perubahan data.",
      locked,
    };
  }

  const settings = toggleLockEvent(locked);
  return {
    success: true,
    message: locked
      ? "🔴 Acara Berhasil Dikunci! Booking baru dan pengubahan data dimatikan."
      : "🟢 Kunci Acara Dibuka! Sistem kembali menerima booking dan perubahan data.",
    locked: Boolean(settings.locked_event),
  };
}

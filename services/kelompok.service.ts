import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import {
  deleteMockKelompok,
  getMockKelompokList,
  saveMockKelompok,
} from "@/lib/mock-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Kelompok } from "@/types/database";

export async function fetchKelompokList(): Promise<Kelompok[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data: kelompokData, error } = await supabase
      .from("kelompok")
      .select("*, anggota(id)")
      .order("nomor_kelompok", { ascending: true });

    if (error || !kelompokData) {
      return getMockKelompokList();
    }

    return kelompokData.map((k: any) => ({
      id: k.id,
      nomor_kelompok: k.nomor_kelompok,
      kelas: k.kelas,
      username: k.username,
      created_at: k.created_at,
      total_anggota: Array.isArray(k.anggota) ? k.anggota.length : 0,
    }));
  }

  return getMockKelompokList();
}

export async function saveKelompok(data: {
  nomor_kelompok: number;
  kelas: string;
  username: string;
}) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data: result, error } = await supabase
      .from("kelompok")
      .upsert(
        {
          nomor_kelompok: Number(data.nomor_kelompok),
          kelas: data.kelas,
          username: data.username.toLowerCase().trim(),
        },
        { onConflict: "nomor_kelompok" }
      )
      .select()
      .single();

    if (!error && result) {
      return { success: true, data: result };
    }
  }

  const saved = saveMockKelompok(data);
  return { success: true, data: saved };
}

export async function deleteKelompok(id: string) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.from("kelompok").delete().eq("id", id);
  }

  deleteMockKelompok(id);
  return { success: true };
}

export async function parseAndImportKelompokCSV(csvText: string) {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let importedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip header line if present
    if (i === 0 && line.toLowerCase().includes("nomor")) continue;

    const parts = line.split(",").map((p) => p.trim());
    if (parts.length >= 3) {
      const nomor_kelompok = parseInt(parts[0], 10);
      const kelas = parts[1];
      const username = parts[2];

      if (!isNaN(nomor_kelompok) && kelas && username) {
        await saveKelompok({ nomor_kelompok, kelas, username });
        importedCount++;
      }
    }
  }

  return { success: true, importedCount };
}

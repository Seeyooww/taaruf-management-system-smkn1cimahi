import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import {
  deleteMockKating,
  getMockKatingList,
  saveMockKating,
} from "@/lib/mock-db";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Gender, Kating } from "@/types/database";

export async function fetchKatingList(): Promise<Kating[]> {
  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();
    const { data: katingData, error } = await adminClient
      .from("kating")
      .select("*")
      .order("nama", { ascending: true });

    if (error) {
      console.error("[Supabase fetchKatingList error]", error.message);
      return [];
    }

    return (katingData ?? []).map((k: any) => ({
      id: k.id,
      nama: k.nama,
      kelas: k.kelas,
      jenis_kelamin: k.jenis_kelamin as Gender,
      nomor_whatsapp: k.nomor_whatsapp,
      aktif: k.aktif,
      created_at: k.created_at,
    }));
  }

  return getMockKatingList();
}

export async function saveKating(data: {
  id?: string;
  nama: string;
  kelas: string;
  jenis_kelamin: Gender;
  nomor_whatsapp: string;
  aktif: boolean;
}) {
  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();
    const { data: result, error } = await adminClient
      .from("kating")
      .upsert({
        ...(data.id ? { id: data.id } : {}),
        nama: data.nama,
        kelas: data.kelas,
        jenis_kelamin: data.jenis_kelamin,
        nomor_whatsapp: data.nomor_whatsapp,
        aktif: data.aktif,
      })
      .select()
      .single();

    if (error || !result) {
      console.error("[Supabase saveKating error]", error?.message);
      return { success: false, message: "Gagal menyimpan data kating." };
    }

    return { success: true, data: result };
  }

  const saved = saveMockKating(data);
  return { success: true, data: saved };
}

export async function deleteKating(id: string) {
  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();
    const { error } = await adminClient.from("kating").delete().eq("id", id);

    if (error) {
      console.error("[Supabase deleteKating error]", error.message);
      return { success: false, message: "Gagal menghapus data kating." };
    }

    return { success: true };
  }

  deleteMockKating(id);
  return { success: true };
}

export async function parseAndImportKatingCSV(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  let importedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && line.toLowerCase().includes("nama")) continue;

    const parts = line.split(",").map((p) => p.trim());
    if (parts.length >= 4) {
      const nama = parts[0];
      const kelas = parts[1];
      const jenis_kelamin = parts[2].toUpperCase() === "P" ? "P" : "L";
      const nomor_whatsapp = parts[3];

      if (nama && kelas && nomor_whatsapp) {
        await saveKating({
          nama,
          kelas,
          jenis_kelamin,
          nomor_whatsapp,
          aktif: true,
        });
        importedCount++;
      }
    }
  }

  return { success: true, importedCount };
}

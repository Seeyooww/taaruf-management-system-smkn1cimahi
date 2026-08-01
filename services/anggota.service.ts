import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import {
  deleteMockAnggota,
  getMockAnggotaList,
  saveMockAnggota,
} from "@/lib/mock-db";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Anggota, Gender } from "@/types/database";

export async function fetchAnggotaList(): Promise<Anggota[]> {
  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();

    // Fetch anggota dengan embedded join ke kelompok
    const { data: anggotaData, error } = await adminClient
      .from("anggota")
      .select("*, kelompok(nomor_kelompok, kelas)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Supabase fetchAnggotaList error]", error.message, error.code, error.details);

      // Fallback: fetch tanpa join, lalu fetch kelompok terpisah
      const { data: anggotaRaw, error: err2 } = await adminClient
        .from("anggota")
        .select("*")
        .order("created_at", { ascending: false });

      if (err2) {
        console.error("[Supabase fetchAnggotaList fallback error]", err2.message);
        return [];
      }

      const { data: kelompokRaw } = await adminClient
        .from("kelompok")
        .select("id, nomor_kelompok, kelas");

      const kelompokMap = new Map(
        (kelompokRaw ?? []).map((k: any) => [k.id, k])
      );

      return (anggotaRaw ?? []).map((a: any) => {
        const kel = kelompokMap.get(a.kelompok_id);
        return {
          id: a.id,
          kelompok_id: a.kelompok_id,
          nama: a.nama,
          jenis_kelamin: a.jenis_kelamin as Gender,
          aktif: a.aktif,
          created_at: a.created_at,
          kelompok_nama: kel
            ? `Kelompok ${kel.nomor_kelompok} (${kel.kelas})`
            : "Tidak Diketahui",
        };
      });
    }

    return (anggotaData ?? []).map((a: any) => ({
      id: a.id,
      kelompok_id: a.kelompok_id,
      nama: a.nama,
      jenis_kelamin: a.jenis_kelamin as Gender,
      aktif: a.aktif,
      created_at: a.created_at,
      kelompok_nama: a.kelompok
        ? `Kelompok ${a.kelompok.nomor_kelompok} (${a.kelompok.kelas})`
        : "Tidak Diketahui",
    }));
  }

  return getMockAnggotaList();
}

export async function saveAnggota(data: {
  id?: string;
  kelompok_id: string;
  nama: string;
  jenis_kelamin: Gender;
  aktif: boolean;
}) {
  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();
    const { data: result, error } = await adminClient
      .from("anggota")
      .upsert({
        ...(data.id ? { id: data.id } : {}),
        kelompok_id: data.kelompok_id,
        nama: data.nama,
        jenis_kelamin: data.jenis_kelamin,
        aktif: data.aktif,
      })
      .select()
      .single();

    if (error || !result) {
      console.error("[Supabase saveAnggota error]", error?.message);
      return { success: false, message: "Gagal menyimpan data anggota." };
    }

    return { success: true, data: result };
  }

  const saved = saveMockAnggota(data);
  return { success: true, data: saved };
}

export async function deleteAnggota(id: string) {
  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();
    const { error } = await adminClient.from("anggota").delete().eq("id", id);

    if (error) {
      console.error("[Supabase deleteAnggota error]", error.message);
      return { success: false, message: "Gagal menghapus data anggota." };
    }

    return { success: true };
  }

  deleteMockAnggota(id);
  return { success: true };
}

export async function parseAndImportAnggotaCSV(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  let importedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && line.toLowerCase().includes("nama")) continue;

    const parts = line.split(",").map((p) => p.trim());
    if (parts.length >= 3) {
      const kelompok_id = parts[0];
      const nama = parts[1];
      const jenis_kelamin = parts[2].toUpperCase() === "P" ? "P" : "L";

      if (kelompok_id && nama) {
        await saveAnggota({
          kelompok_id,
          nama,
          jenis_kelamin,
          aktif: true,
        });
        importedCount++;
      }
    }
  }

  return { success: true, importedCount };
}

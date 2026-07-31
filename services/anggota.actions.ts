"use server";

import {
  deleteAnggota,
  fetchAnggotaList,
  parseAndImportAnggotaCSV,
  saveAnggota,
} from "@/services/anggota.service";
import type { Gender } from "@/types/database";

export async function getAnggotaAction() {
  return await fetchAnggotaList();
}

export async function saveAnggotaAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim() || undefined;
  const kelompok_id = String(formData.get("kelompok_id") || "").trim();
  const nama = String(formData.get("nama") || "").trim();
  const jenis_kelamin = String(formData.get("jenis_kelamin") || "L") as Gender;
  const aktif = formData.get("aktif") === "on" || formData.get("aktif") === "true";

  if (!kelompok_id || !nama) {
    return {
      success: false,
      message: "Mohon pilih Kelompok dan isi Nama Anggota.",
    };
  }

  await saveAnggota({ id, kelompok_id, nama, jenis_kelamin, aktif });
  return { success: true, message: "Data Anggota berhasil disimpan." };
}

export async function deleteAnggotaAction(id: string) {
  if (!id) return { success: false, message: "ID Anggota tidak valid." };
  await deleteAnggota(id);
  return { success: true, message: "Anggota berhasil dihapus." };
}

export async function importAnggotaAction(formData: FormData) {
  const csvContent = String(formData.get("csv") || "").trim();
  if (!csvContent) {
    return { success: false, message: "File CSV kosong atau tidak valid." };
  }

  const result = await parseAndImportAnggotaCSV(csvContent);
  return {
    success: true,
    message: `Berhasil mengimpor ${result.importedCount} data anggota.`,
  };
}

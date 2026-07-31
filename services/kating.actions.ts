"use server";

import {
  deleteKating,
  fetchKatingList,
  parseAndImportKatingCSV,
  saveKating,
} from "@/services/kating.service";
import type { Gender } from "@/types/database";

export async function getKatingAction() {
  return await fetchKatingList();
}

export async function saveKatingAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim() || undefined;
  const nama = String(formData.get("nama") || "").trim();
  const kelas = String(formData.get("kelas") || "").trim();
  const jenis_kelamin = String(formData.get("jenis_kelamin") || "L") as Gender;
  const nomor_whatsapp = String(formData.get("nomor_whatsapp") || "").trim();
  const aktif = formData.get("aktif") === "on" || formData.get("aktif") === "true";

  if (!nama || !kelas || !nomor_whatsapp) {
    return {
      success: false,
      message: "Mohon isi Nama, Kelas, dan Nomor WhatsApp dengan benar.",
    };
  }

  await saveKating({ id, nama, kelas, jenis_kelamin, nomor_whatsapp, aktif });
  return { success: true, message: "Data Kating berhasil disimpan." };
}

export async function deleteKatingAction(id: string) {
  if (!id) return { success: false, message: "ID Kating tidak valid." };
  await deleteKating(id);
  return { success: true, message: "Data Kating berhasil dihapus." };
}

export async function importKatingAction(formData: FormData) {
  const csvContent = String(formData.get("csv") || "").trim();
  if (!csvContent) {
    return { success: false, message: "File CSV kosong atau tidak valid." };
  }

  const result = await parseAndImportKatingCSV(csvContent);
  return {
    success: true,
    message: `Berhasil mengimpor ${result.importedCount} data kating.`,
  };
}

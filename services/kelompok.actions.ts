"use server";

import { revalidatePath } from "next/cache";

import {
  deleteKelompok,
  fetchKelompokList,
  parseAndImportKelompokCSV,
  saveKelompok,
  updateKelompokPassword,
} from "@/services/kelompok.service";

export async function getKelompokAction() {
  return await fetchKelompokList();
}

export async function saveKelompokAction(formData: FormData) {
  const nomor_kelompok = parseInt(String(formData.get("nomor_kelompok")), 10);
  const kelas = String(formData.get("kelas") || "").trim();
  const username = String(formData.get("username") || "").trim();

  if (isNaN(nomor_kelompok) || !kelas || !username) {
    return {
      success: false,
      message: "Mohon isi Nomor Kelompok, Kelas, dan Username dengan benar.",
    };
  }

  const res = await saveKelompok({ nomor_kelompok, kelas, username });
  if (!res.success) return { success: false, message: res.message ?? "Gagal menyimpan data kelompok." };
  revalidatePath("/admin/kelompok");
  return { success: true, message: "Data Kelompok berhasil disimpan." };
}

export async function updateKelompokPasswordAction(formData: FormData) {
  const kelompokId = String(formData.get("kelompok_id") || "").trim();
  const username = String(formData.get("username") || "").trim();
  const newPassword = String(formData.get("new_password") || "").trim();

  if (!kelompokId || !username || !newPassword) {
    return { success: false, message: "Data pengubahan password tidak lengkap." };
  }

  if (newPassword.length < 6) {
    return { success: false, message: "Password minimal 6 karakter." };
  }

  const res = await updateKelompokPassword({ kelompokId, username, newPassword });
  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/admin/kelompok");
  return { success: true, message: res.message };
}

export async function deleteKelompokAction(id: string) {
  if (!id) return { success: false, message: "ID Kelompok tidak valid." };
  const res = await deleteKelompok(id);
  if (!res.success) return { success: false, message: res.message ?? "Gagal menghapus kelompok." };
  revalidatePath("/admin/kelompok");
  return { success: true, message: "Kelompok berhasil dihapus." };
}

export async function importKelompokAction(formData: FormData) {
  const csvContent = String(formData.get("csv") || "").trim();
  if (!csvContent) {
    return { success: false, message: "File CSV kosong atau tidak valid." };
  }

  const result = await parseAndImportKelompokCSV(csvContent);
  revalidatePath("/admin/kelompok");
  return {
    success: true,
    message: `Berhasil mengimpor ${result.importedCount} data kelompok.`,
  };
}

"use server";

import { fetchEventSettings, updateEventSettings } from "@/services/settings.service";

export async function getSettingsAction() {
  return await fetchEventSettings();
}

export async function updateSettingsAction(formData: FormData) {
  const nama_acara = String(formData.get("nama_acara") || "").trim();
  const tahun = parseInt(String(formData.get("tahun")), 10);
  const target_kating = parseInt(String(formData.get("target_kating")), 10);
  const minimal_durasi = parseInt(String(formData.get("minimal_durasi")), 10);
  const tanggal_mulai = String(formData.get("tanggal_mulai") || "").trim();
  const tanggal_selesai = String(formData.get("tanggal_selesai") || "").trim();

  if (
    !nama_acara ||
    isNaN(tahun) ||
    isNaN(target_kating) ||
    isNaN(minimal_durasi) ||
    !tanggal_mulai ||
    !tanggal_selesai
  ) {
    return {
      success: false,
      message: "Mohon periksa kembali input formulir pengaturan acara.",
    };
  }

  await updateEventSettings({
    nama_acara,
    tahun,
    target_kating,
    minimal_durasi,
    tanggal_mulai,
    tanggal_selesai,
  });

  return { success: true, message: "Pengaturan acara berhasil diperbarui." };
}

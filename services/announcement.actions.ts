"use server";

import {
  deleteAnnouncement,
  fetchAnnouncementList,
  saveAnnouncement,
} from "@/services/announcement.service";

export async function getAnnouncementAction() {
  return await fetchAnnouncementList();
}

export async function saveAnnouncementAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim() || undefined;
  const judul = String(formData.get("judul") || "").trim();
  const isi = String(formData.get("isi") || "").trim();
  const aktif = formData.get("aktif") === "on" || formData.get("aktif") === "true";

  if (!judul || !isi) {
    return {
      success: false,
      message: "Mohon isi Judul dan Isi Pengumuman dengan benar.",
    };
  }

  await saveAnnouncement({ id, judul, isi, aktif });
  return { success: true, message: "Pengumuman berhasil disimpan." };
}

export async function deleteAnnouncementAction(id: string) {
  if (!id) return { success: false, message: "ID Pengumuman tidak valid." };
  await deleteAnnouncement(id);
  return { success: true, message: "Pengumuman berhasil dihapus." };
}

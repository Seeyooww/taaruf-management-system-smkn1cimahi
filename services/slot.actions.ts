"use server";

import { deleteSlot, fetchSlotList, saveSlot } from "@/services/slot.service";

export async function getSlotAction() {
  return await fetchSlotList();
}

export async function saveSlotAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim() || undefined;
  const nama_slot = String(formData.get("nama_slot") || "").trim();
  const jam_mulai = String(formData.get("jam_mulai") || "").trim();
  const jam_selesai = String(formData.get("jam_selesai") || "").trim();
  const urutan = parseInt(String(formData.get("urutan")), 10);
  const aktif = formData.get("aktif") === "on" || formData.get("aktif") === "true";

  if (!nama_slot || !jam_mulai || !jam_selesai || isNaN(urutan)) {
    return {
      success: false,
      message: "Mohon isi Nama Slot, Jam Mulai, Jam Selesai, dan Urutan.",
    };
  }

  await saveSlot({ id, nama_slot, jam_mulai, jam_selesai, urutan, aktif });
  return { success: true, message: "Slot Waktu berhasil disimpan." };
}

export async function deleteSlotAction(id: string) {
  if (!id) return { success: false, message: "ID Slot tidak valid." };
  await deleteSlot(id);
  return { success: true, message: "Slot Waktu berhasil dihapus." };
}

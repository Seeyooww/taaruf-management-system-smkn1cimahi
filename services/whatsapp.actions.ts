"use server";

import {
  deleteWATemplate,
  fetchWATemplateList,
  saveWATemplate,
} from "@/services/whatsapp.service";

export async function getWATemplateAction() {
  return await fetchWATemplateList();
}

export async function saveWATemplateAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim() || undefined;
  const nama_template = String(formData.get("nama_template") || "").trim();
  const isi_template = String(formData.get("isi_template") || "").trim();

  if (!nama_template || !isi_template) {
    return {
      success: false,
      message: "Mohon isi Nama Template dan Isi Template dengan benar.",
    };
  }

  await saveWATemplate({ id, nama_template, isi_template });
  return { success: true, message: "Template WhatsApp berhasil disimpan." };
}

export async function deleteWATemplateAction(id: string) {
  if (!id) return { success: false, message: "ID Template tidak valid." };
  await deleteWATemplate(id);
  return { success: true, message: "Template WhatsApp berhasil dihapus." };
}

import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import {
  deleteMockWATemplate,
  getMockWATemplates,
  saveMockWATemplate,
} from "@/lib/mock-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WhatsAppTemplate } from "@/types/database";

export async function fetchWATemplateList(): Promise<WhatsAppTemplate[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("whatsapp_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[fetchWATemplateList] Supabase error:", error.message);
      return [];
    }

    return (data ?? []) as WhatsAppTemplate[];
  }

  return getMockWATemplates();
}

export async function saveWATemplate(data: {
  id?: string;
  nama_template: string;
  isi_template: string;
}) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data: result, error } = await supabase
      .from("whatsapp_templates")
      .upsert({
        ...(data.id ? { id: data.id } : {}),
        nama_template: data.nama_template,
        isi_template: data.isi_template,
      })
      .select()
      .single();

    if (error || !result) {
      console.error("[saveWATemplate] Supabase error:", error?.message);
      return { success: false, message: `Gagal menyimpan template: ${error?.message ?? "Unknown error"}` };
    }

    return { success: true, data: result };
  }

  const saved = saveMockWATemplate(data);
  return { success: true, data: saved };
}

export async function deleteWATemplate(id: string) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("whatsapp_templates").delete().eq("id", id);
    if (error) {
      console.error("[deleteWATemplate] Supabase error:", error.message);
      return { success: false, message: `Gagal menghapus template: ${error.message}` };
    }
    return { success: true };
  }

  deleteMockWATemplate(id);
  return { success: true };
}

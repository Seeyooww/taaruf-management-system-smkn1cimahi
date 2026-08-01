import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import {
  deleteMockAnnouncement,
  getMockAnnouncements,
  saveMockAnnouncement,
} from "@/lib/mock-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Announcement } from "@/types/database";

export async function fetchAnnouncementList(): Promise<Announcement[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[fetchAnnouncementList] Supabase error:", error.message);
      return [];
    }

    return (data ?? []) as Announcement[];
  }

  return getMockAnnouncements();
}

export async function saveAnnouncement(data: {
  id?: string;
  judul: string;
  isi: string;
  aktif: boolean;
}) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data: result, error } = await supabase
      .from("announcements")
      .upsert({
        ...(data.id ? { id: data.id } : {}),
        judul: data.judul,
        isi: data.isi,
        aktif: data.aktif,
      })
      .select()
      .single();

    if (error || !result) {
      console.error("[saveAnnouncement] Supabase error:", error?.message);
      return { success: false, message: `Gagal menyimpan pengumuman: ${error?.message ?? "Unknown error"}` };
    }

    return { success: true, data: result };
  }

  const saved = saveMockAnnouncement(data);
  return { success: true, data: saved };
}

export async function deleteAnnouncement(id: string) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) {
      console.error("[deleteAnnouncement] Supabase error:", error.message);
      return { success: false, message: `Gagal menghapus pengumuman: ${error.message}` };
    }
    return { success: true };
  }

  deleteMockAnnouncement(id);
  return { success: true };
}

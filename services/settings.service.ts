import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getMockSettings, updateMockSettings } from "@/lib/mock-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EventSettings } from "@/types/database";

export async function fetchEventSettings(): Promise<EventSettings> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[fetchEventSettings] Supabase error:", error.message);
      // Return mock as safe fallback for read operations only
      return getMockSettings();
    }

    if (data) {
      return data as EventSettings;
    }
  }

  return getMockSettings();
}

export async function updateEventSettings(data: Partial<EventSettings>) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const current = await fetchEventSettings();

    const { data: updated, error } = await supabase
      .from("settings")
      .upsert({
        id: current.id,
        nama_acara: data.nama_acara ?? current.nama_acara,
        tahun: Number(data.tahun ?? current.tahun),
        target_kating: Number(data.target_kating ?? current.target_kating),
        minimal_durasi: Number(data.minimal_durasi ?? current.minimal_durasi),
        tanggal_mulai: data.tanggal_mulai ?? current.tanggal_mulai,
        tanggal_selesai: data.tanggal_selesai ?? current.tanggal_selesai,
        locked_event: data.locked_event !== undefined ? data.locked_event : Boolean(current.locked_event),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !updated) {
      console.error("[updateEventSettings] Supabase error:", error?.message);
      return { success: false, message: `Gagal menyimpan pengaturan: ${error?.message ?? "Unknown error"}` };
    }

    return { success: true, data: updated };
  }

  const updated = updateMockSettings(data);
  return { success: true, data: updated };
}

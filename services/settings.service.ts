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

    if (!error && data) {
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
        nama_acara: data.nama_acara,
        tahun: Number(data.tahun),
        target_kating: Number(data.target_kating),
        minimal_durasi: Number(data.minimal_durasi),
        tanggal_mulai: data.tanggal_mulai,
        tanggal_selesai: data.tanggal_selesai,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!error && updated) {
      return { success: true, data: updated };
    }
  }

  const updated = updateMockSettings(data);
  return { success: true, data: updated };
}

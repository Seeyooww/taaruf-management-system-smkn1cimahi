import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import {
  deleteMockSlot,
  getMockSlotList,
  saveMockSlot,
} from "@/lib/mock-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SlotWaktu } from "@/types/database";

export async function fetchSlotList(): Promise<SlotWaktu[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data: slotData, error } = await supabase
      .from("slot_waktu")
      .select("*")
      .order("urutan", { ascending: true });

    if (error) {
      // Log error but don't silently fallback — return empty to signal misconfiguration
      console.error("[fetchSlotList] Supabase error:", error.message);
      return [];
    }

    return (slotData ?? []) as SlotWaktu[];
  }

  return getMockSlotList();
}

export async function saveSlot(data: {
  id?: string;
  nama_slot: string;
  jam_mulai: string;
  jam_selesai: string;
  urutan: number;
  aktif: boolean;
}) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data: result, error } = await supabase
      .from("slot_waktu")
      .upsert({
        ...(data.id ? { id: data.id } : {}),
        nama_slot: data.nama_slot,
        jam_mulai: data.jam_mulai,
        jam_selesai: data.jam_selesai,
        urutan: Number(data.urutan),
        aktif: data.aktif,
      })
      .select()
      .single();

    if (error || !result) {
      console.error("[saveSlot] Supabase error:", error?.message);
      return { success: false, message: `Gagal menyimpan slot: ${error?.message ?? "Unknown error"}` };
    }

    return { success: true, data: result };
  }

  const saved = saveMockSlot(data);
  return { success: true, data: saved };
}

export async function deleteSlot(id: string) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("slot_waktu").delete().eq("id", id);
    if (error) {
      console.error("[deleteSlot] Supabase error:", error.message);
      return { success: false, message: `Gagal menghapus slot: ${error.message}` };
    }
    return { success: true };
  }

  deleteMockSlot(id);
  return { success: true };
}

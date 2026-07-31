import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import {
  getMockAnggotaProgressSummaries,
  getMockKelompokList,
  saveMockBookingProgress,
} from "@/lib/mock-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchEventSettings } from "@/services/settings.service";
import type { AnggotaProgressSummary, MetKatingDetail } from "@/types/database";

export async function fetchAnggotaProgressSummaries(
  kelompokId?: string
): Promise<AnggotaProgressSummary[]> {
  const settings = await fetchEventSettings();
  const targetKating = settings.target_kating || 5;

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    
    // Fetch anggota list with kelompok
    let query = supabase
      .from("anggota")
      .select("*, kelompok:kelompok_id(nomor_kelompok, kelas)");

    if (kelompokId) {
      query = query.eq("kelompok_id", kelompokId);
    }

    const { data: anggotaList, error } = await query;

    if (!error && anggotaList) {
      // For each anggota, fetch progress records
      const summaries: AnggotaProgressSummary[] = await Promise.all(
        anggotaList.map(async (a: any) => {
          const { data: progressRecords } = await supabase
            .from("progress")
            .select("*, kating:kating_id(nama, jenis_kelamin), booking:booking_id(tanggal, slot:slot_id(nama_slot))")
            .eq("anggota_id", a.id);

          const metList: MetKatingDetail[] = (progressRecords || []).map((p: any) => ({
            kating_id: p.kating_id,
            kating_nama: p.kating ? p.kating.nama : "Kating",
            jenis_kelamin: p.kating ? p.kating.jenis_kelamin : "L",
            tanggal: p.booking ? p.booking.tanggal : p.created_at.split("T")[0],
            slot_nama: p.booking?.slot ? p.booking.slot.nama_slot : "Sesi Taaruf",
          }));

          const metCount = metList.length;
          const percentage = Math.min(Math.round((metCount / targetKating) * 100), 100);

          let status_label: AnggotaProgressSummary["status_label"] = "Belum";
          let status_color: AnggotaProgressSummary["status_color"] = "destructive";

          if (metCount >= targetKating) {
            status_label = "Selesai";
            status_color = "success";
          } else if (percentage >= 50) {
            status_label = "Hampir Selesai";
            status_color = "warning";
          }

          return {
            anggota_id: a.id,
            nama: a.nama,
            jenis_kelamin: a.jenis_kelamin,
            kelompok_id: a.kelompok_id,
            kelompok_nama: a.kelompok ? `Kelompok ${a.kelompok.nomor_kelompok}` : "Tidak Diketahui",
            kelas: a.kelompok ? a.kelompok.kelas : "-",
            total_kating_met: metCount,
            target_kating: targetKating,
            percentage,
            status_label,
            status_color,
            kating_met_list: metList,
          };
        })
      );

      return summaries;
    }
  }

  return getMockAnggotaProgressSummaries(targetKating, kelompokId);
}

export async function saveBookingProgress(
  bookingId: string,
  presentAnggotaIds: string[]
) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    
    // 1. Fetch booking details to get kating IDs
    const { data: booking } = await supabase
      .from("booking")
      .select("kating_laki_id, kating_perempuan_id")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      return { success: false, message: "Booking tidak ditemukan." };
    }

    // 2. Mark booking status as Selesai
    await supabase
      .from("booking")
      .update({ status: "Selesai" })
      .eq("id", bookingId);

    const katingIds = [booking.kating_laki_id, booking.kating_perempuan_id].filter(Boolean);

    // 3. For each present participant, record attendance and unique progress
    for (const anggotaId of presentAnggotaIds) {
      await supabase.from("booking_participants").insert({
        booking_id: bookingId,
        anggota_id: anggotaId,
        hadir: true,
      });

      for (const katingId of katingIds) {
        const { data: existing } = await supabase
          .from("progress")
          .select("id")
          .eq("anggota_id", anggotaId)
          .eq("kating_id", katingId)
          .maybeSingle();

        if (!existing) {
          await supabase.from("progress").insert({
            anggota_id: anggotaId,
            booking_id: bookingId,
            kating_id: katingId,
          });
        }
      }
    }

    return {
      success: true,
      message: `Progress berhasil dihitung untuk ${presentAnggotaIds.length} anggota yang hadir!`,
    };
  }

  return saveMockBookingProgress(bookingId, presentAnggotaIds);
}

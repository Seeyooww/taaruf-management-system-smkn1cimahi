import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getMockAnggotaList, getMockKelompokList, getMockSettings } from "@/lib/mock-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchEventSettings } from "@/services/settings.service";
import type { IndividuLeaderboardItem, KelompokLeaderboardItem } from "@/types/database";

/**
 * PURE READ-ONLY Service for Kelompok & Individu Leaderboards.
 * Strictly performs SELECT queries only — NO database updates or side effects.
 */

export async function fetchKelompokLeaderboard(): Promise<KelompokLeaderboardItem[]> {
  const settings = await fetchEventSettings();
  const targetKating = settings.target_kating || 5;

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();

    // 1. Fetch all kelompok
    const { data: kelompokList, error: kelErr } = await supabase
      .from("kelompok")
      .select("id, nomor_kelompok, kelas, completed_at")
      .order("nomor_kelompok", { ascending: true });

    if (kelErr || !kelompokList || kelompokList.length === 0) {
      return getMockKelompokLeaderboard(targetKating);
    }

    const kelompokIds = kelompokList.map((k: any) => k.id);

    // 2. Fetch all active anggota for these kelompok
    const { data: anggotaList } = await supabase
      .from("anggota")
      .select("id, kelompok_id")
      .in("kelompok_id", kelompokIds)
      .eq("aktif", true);

    const anggotaIds = (anggotaList ?? []).map((a: any) => a.id);

    // 3. Fetch progress for these anggota using paginated query
    const progressCountMap = new Map<string, number>();
    if (anggotaIds.length > 0) {
      const progressRows = await fetchAllProgressRows(supabase, anggotaIds);

      (progressRows ?? []).forEach((p: any) => {
        progressCountMap.set(p.anggota_id, (progressCountMap.get(p.anggota_id) || 0) + 1);
      });
    }

    // Group anggota by kelompok_id
    const anggotaByKelompok = new Map<string, any[]>();
    kelompokIds.forEach((id) => anggotaByKelompok.set(id, []));
    (anggotaList ?? []).forEach((a: any) => {
      anggotaByKelompok.get(a.kelompok_id)?.push(a);
    });

    // Assemble raw items
    const rawItems: KelompokLeaderboardItem[] = kelompokList.map((k: any) => {
      const members = anggotaByKelompok.get(k.id) ?? [];
      const totalAnggota = members.length;
      const totalTarget = targetKating * (totalAnggota || 1);

      let totalProgress = 0;
      let anggotaSelesai = 0;

      members.forEach((m: any) => {
        const metCount = progressCountMap.get(m.id) || 0;
        totalProgress += metCount;
        if (metCount >= targetKating) {
          anggotaSelesai++;
        }
      });

      const rawPercentage = totalTarget > 0 ? (totalProgress / totalTarget) * 100 : 0;
      const persentase = Number(Math.min(100, Math.round(rawPercentage * 100) / 100).toFixed(2));
      const allMembersDone = totalAnggota > 0 && anggotaSelesai === totalAnggota;
      const targetTercapai = persentase >= 100 || allMembersDone;

      return {
        kelompok_id: k.id,
        nomor_kelompok: k.nomor_kelompok,
        kelompok_nama: `Kelompok ${String(k.nomor_kelompok).padStart(2, "0")}`,
        kelas: k.kelas || "-",
        total_anggota: totalAnggota,
        total_progress: totalProgress,
        total_target: totalTarget,
        persentase,
        anggota_selesai: anggotaSelesai,
        target_tercapai: targetTercapai,
        completed_at: k.completed_at ? new Date(k.completed_at).toISOString() : null,
        rank: 0,
      };
    });

    // Sort according to rules:
    // 1. Persentase DESC
    // 2. If 100% / finished, completed_at ASC (earliest first, nulls last)
    // 3. nomor_kelompok ASC
    rawItems.sort((a, b) => {
      if (b.persentase !== a.persentase) {
        return b.persentase - a.persentase;
      }

      if (a.completed_at && b.completed_at) {
        const timeDiff = new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
        if (timeDiff !== 0) return timeDiff;
      } else if (a.completed_at && !b.completed_at) {
        return -1;
      } else if (!a.completed_at && b.completed_at) {
        return 1;
      }

      return a.nomor_kelompok - b.nomor_kelompok;
    });

    return rawItems.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }

  return getMockKelompokLeaderboard(targetKating);
}

/**
 * Helper to fetch ALL progress rows for given anggota_ids without hitting PostgREST 1000-row cap.
 */
async function fetchAllProgressRows(
  supabaseClient: any,
  anggotaIds: string[]
): Promise<{ anggota_id: string }[]> {
  if (!anggotaIds || anggotaIds.length === 0) return [];

  const PAGE_SIZE = 1000;
  let allRows: { anggota_id: string }[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabaseClient
      .from("progress")
      .select("anggota_id")
      .in("anggota_id", anggotaIds)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error || !data || data.length === 0) {
      hasMore = false;
    } else {
      allRows.push(...data);
      if (data.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  return allRows;
}

export async function fetchIndividuLeaderboard(): Promise<IndividuLeaderboardItem[]> {
  const settings = await fetchEventSettings();
  const targetKating = settings.target_kating || 5;

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();

    // Fetch all active anggota with kelompok details
    const { data: anggotaList, error } = await supabase
      .from("anggota")
      .select("id, nama, jenis_kelamin, completed_at, kelompok_id, kelompok:kelompok_id(nomor_kelompok, kelas)")
      .eq("aktif", true);

    if (error || !anggotaList || anggotaList.length === 0) {
      return getMockIndividuLeaderboard(targetKating);
    }

    const anggotaIds = anggotaList.map((a: any) => a.id);

    // Fetch progress for all active anggota using paginated query
    const progressCountMap = new Map<string, number>();
    if (anggotaIds.length > 0) {
      const progressRows = await fetchAllProgressRows(supabase, anggotaIds);

      (progressRows ?? []).forEach((p: any) => {
        progressCountMap.set(p.anggota_id, (progressCountMap.get(p.anggota_id) || 0) + 1);
      });
    }

    const rawItems: IndividuLeaderboardItem[] = anggotaList.map((a: any) => {
      const metCount = progressCountMap.get(a.id) || 0;
      const persentase = Math.min(100, Math.round((metCount / targetKating) * 100));
      const targetTercapai = metCount >= targetKating;

      const kelompokObj = Array.isArray(a.kelompok) ? a.kelompok[0] : a.kelompok;
      const kelompokNo = kelompokObj?.nomor_kelompok ?? 0;
      const kelompokKelas = kelompokObj?.kelas ?? "-";

      return {
        anggota_id: a.id,
        nama: a.nama,
        jenis_kelamin: a.jenis_kelamin || "L",
        kelompok_id: a.kelompok_id,
        kelompok_nama: `Kelompok ${String(kelompokNo).padStart(2, "0")}`,
        kelas: kelompokKelas,
        total_kating_met: metCount,
        target_kating: targetKating,
        persentase,
        target_tercapai: targetTercapai,
        completed_at: a.completed_at ? new Date(a.completed_at).toISOString() : null,
        rank: 0,
      };
    });

    // Sorting for Individu Leaderboard:
    // 1. Progress (total_kating_met) DESC
    // 2. If reached target: completed_at ASC (earliest first, nulls last)
    // 3. nama ASC
    // 4. anggota_id ASC
    rawItems.sort((a, b) => {
      if (b.total_kating_met !== a.total_kating_met) {
        return b.total_kating_met - a.total_kating_met;
      }

      if (a.completed_at && b.completed_at) {
        const timeDiff = new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
        if (timeDiff !== 0) return timeDiff;
      } else if (a.completed_at && !b.completed_at) {
        return -1;
      } else if (!a.completed_at && b.completed_at) {
        return 1;
      }

      const nameCompare = a.nama.localeCompare(b.nama);
      if (nameCompare !== 0) return nameCompare;

      return a.anggota_id.localeCompare(b.anggota_id);
    });

    return rawItems.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }

  return getMockIndividuLeaderboard(targetKating);
}

// ── Dev Fallback Mock Leaderboard Generators ────────────────────────────────

function getMockKelompokLeaderboard(targetKating: number): KelompokLeaderboardItem[] {
  const kelompokList = getMockKelompokList();
  const anggotaList = getMockAnggotaList();

  const rawItems: KelompokLeaderboardItem[] = kelompokList.map((k) => {
    const members = anggotaList.filter((a) => a.kelompok_id === k.id);
    const totalAnggota = members.length || 4;
    const totalTarget = targetKating * totalAnggota;

    // Simulate progress if not populated
    const totalProgress = Math.min(totalTarget, Math.floor(totalTarget * 0.8));
    const persentase = Number(((totalProgress / totalTarget) * 100).toFixed(2));
    const anggotaSelesai = members.filter((a) => (a as any).completed_at).length;
    const targetTercapai = persentase >= 100;

    return {
      kelompok_id: k.id,
      nomor_kelompok: k.nomor_kelompok,
      kelompok_nama: `Kelompok ${String(k.nomor_kelompok).padStart(2, "0")}`,
      kelas: k.kelas,
      total_anggota: totalAnggota,
      total_progress: totalProgress,
      total_target: totalTarget,
      persentase,
      anggota_selesai: anggotaSelesai,
      target_tercapai: targetTercapai,
      completed_at: k.completed_at || null,
      rank: 0,
    };
  });

  rawItems.sort((a, b) => {
    if (b.persentase !== a.persentase) return b.persentase - a.persentase;
    if (a.completed_at && b.completed_at) {
      const timeDiff = new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
      if (timeDiff !== 0) return timeDiff;
    } else if (a.completed_at && !b.completed_at) return -1;
    else if (!a.completed_at && b.completed_at) return 1;
    return a.nomor_kelompok - b.nomor_kelompok;
  });

  return rawItems.map((item, index) => ({ ...item, rank: index + 1 }));
}

function getMockIndividuLeaderboard(targetKating: number): IndividuLeaderboardItem[] {
  const anggotaList = getMockAnggotaList();
  const kelompokList = getMockKelompokList();

  const rawItems: IndividuLeaderboardItem[] = anggotaList.map((a) => {
    const kObj = kelompokList.find((k) => k.id === a.kelompok_id);
    const metCount = 4; // Mock met count
    const persentase = Math.min(100, Math.round((metCount / targetKating) * 100));

    return {
      anggota_id: a.id,
      nama: a.nama,
      jenis_kelamin: a.jenis_kelamin,
      kelompok_id: a.kelompok_id,
      kelompok_nama: kObj ? `Kelompok ${String(kObj.nomor_kelompok).padStart(2, "0")}` : "Kelompok",
      kelas: kObj?.kelas || "-",
      total_kating_met: metCount,
      target_kating: targetKating,
      persentase,
      target_tercapai: metCount >= targetKating,
      completed_at: a.completed_at || null,
      rank: 0,
    };
  });

  rawItems.sort((a, b) => {
    if (b.total_kating_met !== a.total_kating_met) return b.total_kating_met - a.total_kating_met;
    if (a.completed_at && b.completed_at) {
      const timeDiff = new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
      if (timeDiff !== 0) return timeDiff;
    } else if (a.completed_at && !b.completed_at) return -1;
    else if (!a.completed_at && b.completed_at) return 1;
    return a.nama.localeCompare(b.nama);
  });

  return rawItems.map((item, index) => ({ ...item, rank: index + 1 }));
}

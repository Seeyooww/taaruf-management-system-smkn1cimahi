import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import {
  getMockAnggotaList,
  getMockAnggotaProgressSummaries,
  getMockBookingList,
  getMockKatingList,
  getMockKelompokList,
  getMockSlotList,
} from "@/lib/mock-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { fetchEventSettings } from "@/services/settings.service";
import type { BookingStatus, Gender } from "@/types/database";

export interface LaporanKelompokItem {
  kelompok_id: string;
  nomor_kelompok: number;
  kelas: string;
  nama_anggota: string[];
  total_anggota: number;
  total_booking: number;
  booking_selesai: number;
  booking_ditolak: number;
  booking_dibatalkan: number;
  progress_rata_rata: number;
  persentase_target: number;
}

export interface MetKatingDetail {
  kating_id: string;
  kating_nama: string;
  jenis_kelamin: Gender;
  tanggal: string;
  slot_nama: string;
  kelompok_nama?: string;
}

export interface LaporanAnggotaItem {
  anggota_id: string;
  nama: string;
  jenis_kelamin: Gender;
  kelompok_id: string;
  kelompok_nama: string;
  kelas: string;
  target_kating: number;
  progress: number;
  persentase: number;
  status: "Selesai" | "Hampir Selesai" | "Belum";
  kating_met_list: MetKatingDetail[];
}

export interface KatingHistoryItem {
  booking_id: string;
  tanggal: string;
  slot_nama: string;
  kelompok_nama: string;
  status: BookingStatus;
}

export interface LaporanKatingItem {
  kating_id: string;
  nama: string;
  kelas: string;
  jenis_kelamin: Gender;
  nomor_whatsapp: string;
  jumlah_ditaarufi: number;
  kelompok_pernah_bertemu: string[];
  riwayat: KatingHistoryItem[];
}

export interface AnalyticsData {
  bookingPerHari: { tanggal: string; label: string; count: number }[];
  bookingPerSlot: { slot_id: string; slot_nama: string; count: number }[];
  bookingPerStatus: { status: BookingStatus; count: number; color: string }[];
  progressDistribusi: { range: string; count: number }[];
  targetTercapaiStats: {
    totalAnggota: number;
    tercapai: number;
    belumTercapai: number;
    persentaseTercapai: number;
  };
}

export interface LPJSummaryData {
  totalKelompok: number;
  totalAnggota: number;
  totalKating: number;
  totalBooking: number;
  bookingBerhasil: number;
  bookingGagal: number;
  targetTercapai: number;
  targetBelumTercapai: number;
  persentaseTargetSistem: number;
  persentaseKelulusanBooking: number;
  tanggalMulai: string;
  tanggalSelesai: string;
}

export interface LiveActiveSessionItem {
  booking_id: string;
  kelompok_nama: string;
  slot_nama: string;
  /** Daftar nama semua kating yang terlibat */
  kating_names: string[];
  status: BookingStatus;
  jam: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH LAPORAN KELOMPOK
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchLaporanKelompok(filters?: {
  tanggalMulai?: string;
  tanggalSelesai?: string;
  kelompokId?: string;
  kelas?: string;
  status?: string;
}): Promise<LaporanKelompokItem[]> {
  const settings = await fetchEventSettings();
  const targetKating = settings.target_kating || 5;

  if (isSupabaseConfigured()) {
    try {
      const adminClient = createSupabaseAdminClient();

      // Fetch kelompok with anggota count
      let kelompokQuery = adminClient
        .from("kelompok")
        .select("id, nomor_kelompok, kelas, anggota(id, nama)")
        .order("nomor_kelompok");

      if (filters?.kelompokId && filters.kelompokId !== "all") {
        kelompokQuery = kelompokQuery.eq("id", filters.kelompokId);
      }
      if (filters?.kelas && filters.kelas !== "all") {
        kelompokQuery = kelompokQuery.eq("kelas", filters.kelas);
      }

      const { data: kelompokData } = await kelompokQuery;

      // Fetch all bookings
      let bookingQuery = adminClient
        .from("booking")
        .select("id, kelompok_id, tanggal, status");

      if (filters?.tanggalMulai) bookingQuery = bookingQuery.gte("tanggal", filters.tanggalMulai);
      if (filters?.tanggalSelesai) bookingQuery = bookingQuery.lte("tanggal", filters.tanggalSelesai);
      if (filters?.status && filters.status !== "all") bookingQuery = bookingQuery.eq("status", filters.status);

      const { data: bookingData } = await bookingQuery;

      // Fetch progress records to compute per-anggota met counts
      const { data: progressData } = await adminClient
        .from("progress")
        .select("anggota_id, kating_id");

      if (kelompokData) {
        return kelompokData.map((k: any) => {
          const kAnggota: any[] = k.anggota ?? [];
          const kNamaAnggota = kAnggota.map((a: any) => a.nama);
          const kAnggotaIds = new Set(kAnggota.map((a: any) => a.id));

          const kBookings = (bookingData ?? []).filter((b: any) => b.kelompok_id === k.id);

          const totalBooking = kBookings.length;
          const bookingSelesai = kBookings.filter((b: any) => b.status === "Selesai" || b.status === "Disetujui").length;
          const bookingDitolak = kBookings.filter((b: any) => b.status === "Ditolak").length;
          const bookingDibatalkan = kBookings.filter((b: any) => b.status === "Dibatalkan").length;

          // Compute per-anggota progress from progress table
          const anggotaProgress = kAnggota.map((a: any) => {
            const metCount = (progressData ?? []).filter((p: any) => p.anggota_id === a.id).length;
            // Unique kating count:
            const uniqueKating = new Set((progressData ?? []).filter((p: any) => p.anggota_id === a.id).map((p: any) => p.kating_id));
            return { met: uniqueKating.size };
          });

          const avgProgress = anggotaProgress.length === 0 ? 0 :
            Math.round(anggotaProgress.reduce((sum, a) => sum + Math.min(100, Math.round((a.met / targetKating) * 100)), 0) / anggotaProgress.length);

          const achievedCount = anggotaProgress.filter((a) => a.met >= targetKating).length;
          const persentaseTarget = anggotaProgress.length === 0 ? 0 :
            Math.round((achievedCount / anggotaProgress.length) * 100);

          return {
            kelompok_id: k.id,
            nomor_kelompok: k.nomor_kelompok,
            kelas: k.kelas,
            nama_anggota: kNamaAnggota,
            total_anggota: kAnggota.length,
            total_booking: totalBooking,
            booking_selesai: bookingSelesai,
            booking_ditolak: bookingDitolak,
            booking_dibatalkan: bookingDibatalkan,
            progress_rata_rata: avgProgress,
            persentase_target: persentaseTarget,
          };
        });
      }
    } catch (err) {
      console.error("[fetchLaporanKelompok] error:", err);
    }
  }

  // Mock fallback
  const kelompokList = getMockKelompokList();
  const anggotaList = getMockAnggotaList();
  const bookingList = getMockBookingList();
  const progressSummaries = getMockAnggotaProgressSummaries(targetKating);

  let filteredKelompok = kelompokList;
  if (filters?.kelompokId && filters.kelompokId !== "all") {
    filteredKelompok = filteredKelompok.filter((k) => k.id === filters.kelompokId);
  }
  if (filters?.kelas && filters.kelas !== "all") {
    filteredKelompok = filteredKelompok.filter((k) => k.kelas === filters.kelas);
  }

  return filteredKelompok.map((k) => {
    const kAnggota = anggotaList.filter((a) => a.kelompok_id === k.id);
    let kBookings = bookingList.filter((b) => b.kelompok_id === k.id);
    if (filters?.tanggalMulai) kBookings = kBookings.filter((b) => b.tanggal >= filters.tanggalMulai!);
    if (filters?.tanggalSelesai) kBookings = kBookings.filter((b) => b.tanggal <= filters.tanggalSelesai!);
    if (filters?.status && filters.status !== "all") kBookings = kBookings.filter((b) => b.status === filters.status);

    const kProgress = progressSummaries.filter((p) => p.kelompok_id === k.id);
    const avgProgress = kProgress.length === 0 ? 0 :
      Math.round(kProgress.reduce((acc, curr) => acc + curr.percentage, 0) / kProgress.length);
    const achievedCount = kProgress.filter((p) => p.total_kating_met >= p.target_kating).length;
    const persentaseTarget = kProgress.length === 0 ? 0 : Math.round((achievedCount / kProgress.length) * 100);

    return {
      kelompok_id: k.id,
      nomor_kelompok: k.nomor_kelompok,
      kelas: k.kelas,
      nama_anggota: kAnggota.map((a) => a.nama),
      total_anggota: kAnggota.length,
      total_booking: kBookings.length,
      booking_selesai: kBookings.filter((b) => b.status === "Selesai" || b.status === "Disetujui").length,
      booking_ditolak: kBookings.filter((b) => b.status === "Ditolak").length,
      booking_dibatalkan: kBookings.filter((b) => b.status === "Dibatalkan").length,
      progress_rata_rata: avgProgress,
      persentase_target: persentaseTarget,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH LAPORAN ANGGOTA
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchLaporanAnggota(filters?: {
  kelompokId?: string;
  namaSearch?: string;
  status?: string;
  kelas?: string;
}): Promise<LaporanAnggotaItem[]> {
  const settings = await fetchEventSettings();
  const targetKating = settings.target_kating || 5;

  if (isSupabaseConfigured()) {
    try {
      const adminClient = createSupabaseAdminClient();

      // Fetch anggota with kelompok join
      let anggotaQuery = adminClient
        .from("anggota")
        .select("id, nama, jenis_kelamin, kelompok_id, kelompok:kelompok_id(nomor_kelompok, kelas)")
        .order("nama");

      if (filters?.kelompokId && filters.kelompokId !== "all") {
        anggotaQuery = anggotaQuery.eq("kelompok_id", filters.kelompokId);
      }
      if (filters?.namaSearch && filters.namaSearch.trim() !== "") {
        anggotaQuery = anggotaQuery.ilike("nama", `%${filters.namaSearch.trim()}%`);
      }

      const { data: anggotaData } = await anggotaQuery;
      if (!anggotaData) return [];

      // Fetch all progress records for these anggota in bulk
      const anggotaIds = anggotaData.map((a: any) => a.id);
      const { data: progressData } = await adminClient
        .from("progress")
        .select("anggota_id, kating_id, booking_id, kating:kating_id(nama, jenis_kelamin), booking:booking_id(tanggal, slot:slot_id(nama_slot))")
        .in("anggota_id", anggotaIds);

      // Build progress map
      const progressByAnggota = new Map<string, any[]>();
      anggotaIds.forEach((id: string) => progressByAnggota.set(id, []));
      (progressData ?? []).forEach((p: any) => progressByAnggota.get(p.anggota_id)?.push(p));

      let result: LaporanAnggotaItem[] = anggotaData.map((a: any) => {
        const records = progressByAnggota.get(a.id) ?? [];
        // Unique kating count
        const uniqueKatingIds = new Set(records.map((p: any) => p.kating_id));
        const metCount = uniqueKatingIds.size;
        const percentage = Math.min(Math.round((metCount / targetKating) * 100), 100);

        let status: "Selesai" | "Hampir Selesai" | "Belum" = "Belum";
        if (metCount >= targetKating) status = "Selesai";
        else if (percentage >= 50) status = "Hampir Selesai";

        const kelompokNama = a.kelompok ? `Kelompok ${a.kelompok.nomor_kelompok}` : "Tidak Diketahui";
        const kelas = a.kelompok?.kelas ?? "-";

        const katingMetList: MetKatingDetail[] = records.map((p: any) => ({
          kating_id: p.kating_id,
          kating_nama: p.kating?.nama ?? "Kating",
          jenis_kelamin: p.kating?.jenis_kelamin ?? "L",
          tanggal: p.booking?.tanggal ?? "",
          slot_nama: p.booking?.slot?.nama_slot ?? "Sesi",
          booking_id: p.booking_id,
          kelompok_nama: kelompokNama,
        }));

        return {
          anggota_id: a.id,
          nama: a.nama,
          jenis_kelamin: a.jenis_kelamin as Gender,
          kelompok_id: a.kelompok_id,
          kelompok_nama: kelompokNama,
          kelas,
          target_kating: targetKating,
          progress: metCount,
          persentase: percentage,
          status,
          kating_met_list: katingMetList,
        };
      });

      // Apply client-side filters that can't be done in DB
      if (filters?.kelas && filters.kelas !== "all") {
        result = result.filter((a) => a.kelas === filters.kelas);
      }
      if (filters?.status && filters.status !== "all") {
        result = result.filter((a) => a.status === filters.status);
      }

      return result;
    } catch (err) {
      console.error("[fetchLaporanAnggota] error:", err);
    }
  }

  // Mock fallback
  const summaries = getMockAnggotaProgressSummaries(targetKating);
  let result: LaporanAnggotaItem[] = summaries.map((s) => ({
    anggota_id: s.anggota_id,
    nama: s.nama,
    jenis_kelamin: s.jenis_kelamin,
    kelompok_id: s.kelompok_id,
    kelompok_nama: s.kelompok_nama,
    kelas: s.kelas,
    target_kating: s.target_kating,
    progress: s.total_kating_met,
    persentase: s.percentage,
    status: s.status_label,
    kating_met_list: s.kating_met_list.map((m) => ({ ...m, kelompok_nama: s.kelompok_nama })),
  }));

  if (filters?.kelompokId && filters.kelompokId !== "all") result = result.filter((a) => a.kelompok_id === filters.kelompokId);
  if (filters?.kelas && filters.kelas !== "all") result = result.filter((a) => a.kelas === filters.kelas);
  if (filters?.status && filters.status !== "all") result = result.filter((a) => a.status === filters.status);
  if (filters?.namaSearch && filters.namaSearch.trim() !== "") {
    const q = filters.namaSearch.toLowerCase().trim();
    result = result.filter((a) => a.nama.toLowerCase().includes(q));
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH LAPORAN KATING
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchLaporanKating(filters?: {
  tanggalMulai?: string;
  tanggalSelesai?: string;
  kelompokId?: string;
  status?: string;
  katingSearch?: string;
}): Promise<LaporanKatingItem[]> {
  if (isSupabaseConfigured()) {
    try {
      const adminClient = createSupabaseAdminClient();

      // Fetch all kating
      const { data: katingData } = await adminClient
        .from("kating")
        .select("id, nama, kelas, jenis_kelamin, nomor_whatsapp")
        .order("nama");

      if (!katingData) return [];

      // Fetch bookings with booking_kating relation (no kating_laki_id/kating_perempuan_id)
      let bookingQuery = adminClient
        .from("booking")
        .select("id, tanggal, status, kelompok_id, slot_id, kelompok:kelompok_id(nomor_kelompok, kelas), slot:slot_id(nama_slot)");

      if (filters?.tanggalMulai) bookingQuery = bookingQuery.gte("tanggal", filters.tanggalMulai);
      if (filters?.tanggalSelesai) bookingQuery = bookingQuery.lte("tanggal", filters.tanggalSelesai);
      if (filters?.kelompokId && filters.kelompokId !== "all") bookingQuery = bookingQuery.eq("kelompok_id", filters.kelompokId);
      if (filters?.status && filters.status !== "all") bookingQuery = bookingQuery.eq("status", filters.status);

      const { data: bookingData } = await bookingQuery;

      // Fetch booking_kating to map which kating appear in which bookings
      const { data: bkData } = await adminClient
        .from("booking_kating")
        .select("booking_id, kating_id");

      // Fetch progress to count jumlah_ditaarufi per kating
      const { data: progressData } = await adminClient
        .from("progress")
        .select("kating_id, anggota_id");

      // Build map: kating_id -> [booking_id]
      const katingBookingsMap = new Map<string, string[]>();
      (bkData ?? []).forEach((r: any) => {
        const arr = katingBookingsMap.get(r.kating_id) ?? [];
        arr.push(r.booking_id);
        katingBookingsMap.set(r.kating_id, arr);
      });

      // Build map: booking_id -> booking
      const bookingById = new Map<string, any>();
      (bookingData ?? []).forEach((b: any) => bookingById.set(b.id, b));

      let result: LaporanKatingItem[] = katingData.map((kat: any) => {
        const myBookingIds = katingBookingsMap.get(kat.id) ?? [];
        const myBookings = myBookingIds
          .map((bid) => bookingById.get(bid))
          .filter(Boolean);

        const uniqueKelompokSet = new Set<string>();
        myBookings.forEach((b: any) => {
          if (b.kelompok) {
            uniqueKelompokSet.add(`Kelompok ${b.kelompok.nomor_kelompok} (${b.kelompok.kelas})`);
          }
        });

        // Count unique anggota who met this kating
        const uniqueAnggotaWhoMet = new Set(
          (progressData ?? [])
            .filter((p: any) => p.kating_id === kat.id)
            .map((p: any) => p.anggota_id)
        );

        const riwayat: KatingHistoryItem[] = myBookings.map((b: any) => ({
          booking_id: b.id,
          tanggal: b.tanggal,
          slot_nama: b.slot?.nama_slot ?? "Slot",
          kelompok_nama: b.kelompok ? `Kelompok ${b.kelompok.nomor_kelompok}` : "Kelompok",
          status: b.status as BookingStatus,
        }));

        return {
          kating_id: kat.id,
          nama: kat.nama,
          kelas: kat.kelas,
          jenis_kelamin: kat.jenis_kelamin as Gender,
          nomor_whatsapp: kat.nomor_whatsapp,
          jumlah_ditaarufi: uniqueAnggotaWhoMet.size,
          kelompok_pernah_bertemu: Array.from(uniqueKelompokSet),
          riwayat,
        };
      });

      if (filters?.katingSearch && filters.katingSearch.trim() !== "") {
        const q = filters.katingSearch.toLowerCase().trim();
        result = result.filter((k) => k.nama.toLowerCase().includes(q) || k.kelas.toLowerCase().includes(q));
      }

      return result;
    } catch (err) {
      console.error("[fetchLaporanKating] error:", err);
    }
  }

  // Mock fallback
  const katingList = getMockKatingList();
  const bookingList = getMockBookingList();
  const slotList = getMockSlotList();
  const summaries = getMockAnggotaProgressSummaries();

  let result: LaporanKatingItem[] = katingList.map((kat) => {
    let myBookings = bookingList.filter((b) =>
      b.kating_list?.some((k) => k.id === kat.id)
    );
    if (filters?.tanggalMulai) myBookings = myBookings.filter((b) => b.tanggal >= filters.tanggalMulai!);
    if (filters?.tanggalSelesai) myBookings = myBookings.filter((b) => b.tanggal <= filters.tanggalSelesai!);
    if (filters?.kelompokId && filters.kelompokId !== "all") myBookings = myBookings.filter((b) => b.kelompok_id === filters.kelompokId);
    if (filters?.status && filters.status !== "all") myBookings = myBookings.filter((b) => b.status === filters.status);

    const uniqueKelompokSet = new Set<string>();
    myBookings.forEach((b) => { if (b.kelompok_nama) uniqueKelompokSet.add(b.kelompok_nama); });

    let countDitaarufi = 0;
    summaries.forEach((s) => {
      if (s.kating_met_list.some((m) => m.kating_id === kat.id)) countDitaarufi++;
    });

    const riwayat: KatingHistoryItem[] = myBookings.map((b) => {
      const slotObj = slotList.find((s) => s.id === b.slot_id);
      return {
        booking_id: b.id,
        tanggal: b.tanggal,
        slot_nama: slotObj ? slotObj.nama_slot : b.slot_nama || "Slot",
        kelompok_nama: b.kelompok_nama || "Kelompok",
        status: b.status,
      };
    });

    return {
      kating_id: kat.id,
      nama: kat.nama,
      kelas: kat.kelas,
      jenis_kelamin: kat.jenis_kelamin,
      nomor_whatsapp: kat.nomor_whatsapp,
      jumlah_ditaarufi: countDitaarufi,
      kelompok_pernah_bertemu: Array.from(uniqueKelompokSet),
      riwayat,
    };
  });

  if (filters?.katingSearch && filters.katingSearch.trim() !== "") {
    const q = filters.katingSearch.toLowerCase().trim();
    result = result.filter((k) => k.nama.toLowerCase().includes(q) || k.kelas.toLowerCase().includes(q));
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH ANALYTICS DATA
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchAnalyticsData(): Promise<AnalyticsData> {
  const settings = await fetchEventSettings();
  const targetKating = settings.target_kating || 5;

  const statusColorMap: Record<BookingStatus, string> = {
    "Selesai": "#10b981",
    "Disetujui": "#3b82f6",
    "Menunggu Konfirmasi": "#f59e0b",
    "Ditolak": "#ef4444",
    "Dibatalkan": "#6b7280",
    "Draft": "#8b5cf6",
    "Tidak Dihitung": "#9ca3af",
  };

  if (isSupabaseConfigured()) {
    try {
      const adminClient = createSupabaseAdminClient();

      const [{ data: bookingData }, { data: slotData }, { data: anggotaData }, { data: progressData }] = await Promise.all([
        adminClient.from("booking").select("tanggal, slot_id, status"),
        adminClient.from("slot_waktu").select("id, nama_slot"),
        adminClient.from("anggota").select("id"),
        adminClient.from("progress").select("anggota_id, kating_id"),
      ]);

      const bookingList = bookingData ?? [];
      const slotList = slotData ?? [];

      // bookingPerHari
      const dateMap = new Map<string, number>();
      bookingList.forEach((b: any) => dateMap.set(b.tanggal, (dateMap.get(b.tanggal) || 0) + 1));
      const bookingPerHari = Array.from(dateMap.keys()).sort().map((dateStr) => ({
        tanggal: dateStr,
        label: new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        count: dateMap.get(dateStr) || 0,
      }));

      // bookingPerSlot
      const slotMap = new Map<string, { nama: string; count: number }>();
      slotList.forEach((s: any) => slotMap.set(s.id, { nama: s.nama_slot, count: 0 }));
      bookingList.forEach((b: any) => { if (slotMap.has(b.slot_id)) slotMap.get(b.slot_id)!.count += 1; });
      const bookingPerSlot = Array.from(slotMap.entries()).map(([id, val]) => ({
        slot_id: id,
        slot_nama: val.nama,
        count: val.count,
      }));

      // bookingPerStatus
      const statusCounts: Partial<Record<BookingStatus, number>> = {};
      bookingList.forEach((b: any) => {
        const st = b.status as BookingStatus;
        statusCounts[st] = (statusCounts[st] || 0) + 1;
      });
      const bookingPerStatus = (Object.keys(statusCounts) as BookingStatus[])
        .filter((st) => (statusCounts[st] ?? 0) > 0)
        .map((st) => ({ status: st, count: statusCounts[st]!, color: statusColorMap[st] || "#3b82f6" }));

      // Progress distribution from progress table
      const anggotaList = anggotaData ?? [];
      const progressList = progressData ?? [];

      // Count unique kating met per anggota
      const anggotaMetMap = new Map<string, Set<string>>();
      anggotaList.forEach((a: any) => anggotaMetMap.set(a.id, new Set()));
      progressList.forEach((p: any) => anggotaMetMap.get(p.anggota_id)?.add(p.kating_id));

      let p0_25 = 0, p26_50 = 0, p51_75 = 0, p76_99 = 0, p100 = 0;
      let tercapai = 0;
      const totalAnggota = anggotaList.length;

      anggotaMetMap.forEach((katingSet) => {
        const metCount = katingSet.size;
        const pct = Math.min(Math.round((metCount / targetKating) * 100), 100);
        if (pct === 100) p100++;
        else if (pct >= 76) p76_99++;
        else if (pct >= 51) p51_75++;
        else if (pct >= 26) p26_50++;
        else p0_25++;
        if (metCount >= targetKating) tercapai++;
      });

      const progressDistribusi = [
        { range: "0 - 25%", count: p0_25 },
        { range: "26 - 50%", count: p26_50 },
        { range: "51 - 75%", count: p51_75 },
        { range: "76 - 99%", count: p76_99 },
        { range: "100% (Target)", count: p100 },
      ];

      return {
        bookingPerHari,
        bookingPerSlot,
        bookingPerStatus,
        progressDistribusi,
        targetTercapaiStats: {
          totalAnggota,
          tercapai,
          belumTercapai: Math.max(0, totalAnggota - tercapai),
          persentaseTercapai: totalAnggota === 0 ? 0 : Math.round((tercapai / totalAnggota) * 100),
        },
      };
    } catch (err) {
      console.error("[fetchAnalyticsData] error:", err);
    }
  }

  // Mock fallback
  const bookingList = getMockBookingList();
  const slotList = getMockSlotList();
  const progressSummaries = getMockAnggotaProgressSummaries();

  const dateMap = new Map<string, number>();
  bookingList.forEach((b) => dateMap.set(b.tanggal, (dateMap.get(b.tanggal) || 0) + 1));
  const bookingPerHari = Array.from(dateMap.keys()).sort().map((dateStr) => ({
    tanggal: dateStr,
    label: new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
    count: dateMap.get(dateStr) || 0,
  }));

  const slotMap = new Map<string, { nama: string; count: number }>();
  slotList.forEach((s) => slotMap.set(s.id, { nama: s.nama_slot, count: 0 }));
  bookingList.forEach((b) => { if (slotMap.has(b.slot_id)) slotMap.get(b.slot_id)!.count += 1; });
  const bookingPerSlot = Array.from(slotMap.entries()).map(([id, val]) => ({ slot_id: id, slot_nama: val.nama, count: val.count }));

  const statusCounts: Partial<Record<BookingStatus, number>> = {};
  bookingList.forEach((b) => { statusCounts[b.status] = (statusCounts[b.status] || 0) + 1; });
  const bookingPerStatus = (Object.keys(statusCounts) as BookingStatus[])
    .filter((st) => (statusCounts[st] ?? 0) > 0)
    .map((st) => ({ status: st, count: statusCounts[st]!, color: statusColorMap[st] || "#3b82f6" }));

  let p0_25 = 0, p26_50 = 0, p51_75 = 0, p76_99 = 0, p100 = 0;
  progressSummaries.forEach((p) => {
    if (p.percentage === 100) p100++;
    else if (p.percentage >= 76) p76_99++;
    else if (p.percentage >= 51) p51_75++;
    else if (p.percentage >= 26) p26_50++;
    else p0_25++;
  });

  const tercapai = progressSummaries.filter((p) => p.total_kating_met >= targetKating).length;
  const totalAnggota = progressSummaries.length;

  return {
    bookingPerHari,
    bookingPerSlot,
    bookingPerStatus,
    progressDistribusi: [
      { range: "0 - 25%", count: p0_25 },
      { range: "26 - 50%", count: p26_50 },
      { range: "51 - 75%", count: p51_75 },
      { range: "76 - 99%", count: p76_99 },
      { range: "100% (Target)", count: p100 },
    ],
    targetTercapaiStats: {
      totalAnggota,
      tercapai,
      belumTercapai: Math.max(0, totalAnggota - tercapai),
      persentaseTercapai: totalAnggota === 0 ? 0 : Math.round((tercapai / totalAnggota) * 100),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH LPJ SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchLPJSummary(): Promise<LPJSummaryData> {
  const settings = await fetchEventSettings();
  const targetKating = settings.target_kating || 5;

  if (isSupabaseConfigured()) {
    try {
      const adminClient = createSupabaseAdminClient();

      const [
        { count: totalKelompok },
        { count: totalAnggota },
        { count: totalKating },
        { data: bookingData },
        { data: progressData },
        { data: anggotaData },
      ] = await Promise.all([
        adminClient.from("kelompok").select("id", { count: "exact", head: true }),
        adminClient.from("anggota").select("id", { count: "exact", head: true }),
        adminClient.from("kating").select("id", { count: "exact", head: true }),
        adminClient.from("booking").select("status"),
        adminClient.from("progress").select("anggota_id, kating_id"),
        adminClient.from("anggota").select("id"),
      ]);

      const bookingList = bookingData ?? [];
      const bookingBerhasil = bookingList.filter((b: any) => b.status === "Selesai" || b.status === "Disetujui").length;
      const bookingGagal = bookingList.filter((b: any) => b.status === "Ditolak" || b.status === "Dibatalkan").length;

      // Count unique kating met per anggota
      const anggotaMetMap = new Map<string, Set<string>>();
      (anggotaData ?? []).forEach((a: any) => anggotaMetMap.set(a.id, new Set()));
      (progressData ?? []).forEach((p: any) => anggotaMetMap.get(p.anggota_id)?.add(p.kating_id));

      const targetTercapai = Array.from(anggotaMetMap.values()).filter((s) => s.size >= targetKating).length;
      const totalAnggotaCount = totalAnggota ?? 0;
      const targetBelumTercapai = Math.max(0, totalAnggotaCount - targetTercapai);

      return {
        totalKelompok: totalKelompok ?? 0,
        totalAnggota: totalAnggotaCount,
        totalKating: totalKating ?? 0,
        totalBooking: bookingList.length,
        bookingBerhasil,
        bookingGagal,
        targetTercapai,
        targetBelumTercapai,
        persentaseTargetSistem: totalAnggotaCount === 0 ? 0 : Math.round((targetTercapai / totalAnggotaCount) * 100),
        persentaseKelulusanBooking: bookingList.length === 0 ? 0 : Math.round((bookingBerhasil / bookingList.length) * 100),
        tanggalMulai: settings.tanggal_mulai,
        tanggalSelesai: settings.tanggal_selesai,
      };
    } catch (err) {
      console.error("[fetchLPJSummary] error:", err);
    }
  }

  // Mock fallback
  const kelompokList = getMockKelompokList();
  const anggotaList = getMockAnggotaList();
  const katingList = getMockKatingList();
  const bookingList = getMockBookingList();
  const progressSummaries = getMockAnggotaProgressSummaries(targetKating);

  const bookingBerhasil = bookingList.filter((b) => b.status === "Selesai" || b.status === "Disetujui").length;
  const bookingGagal = bookingList.filter((b) => b.status === "Ditolak" || b.status === "Dibatalkan").length;
  const targetTercapai = progressSummaries.filter((p) => p.total_kating_met >= targetKating).length;
  const totalAnggotaCount = anggotaList.length;

  return {
    totalKelompok: kelompokList.length,
    totalAnggota: totalAnggotaCount,
    totalKating: katingList.length,
    totalBooking: bookingList.length,
    bookingBerhasil,
    bookingGagal,
    targetTercapai,
    targetBelumTercapai: Math.max(0, totalAnggotaCount - targetTercapai),
    persentaseTargetSistem: totalAnggotaCount === 0 ? 0 : Math.round((targetTercapai / totalAnggotaCount) * 100),
    persentaseKelulusanBooking: bookingList.length === 0 ? 0 : Math.round((bookingBerhasil / bookingList.length) * 100),
    tanggalMulai: settings.tanggal_mulai,
    tanggalSelesai: settings.tanggal_selesai,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH LIVE ACTIVE SESSIONS
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchLiveActiveSessions(): Promise<LiveActiveSessionItem[]> {
  if (isSupabaseConfigured()) {
    try {
      const adminClient = createSupabaseAdminClient();

      const today = new Date().toISOString().split("T")[0];

      const { data } = await adminClient
        .from("booking")
        .select(`
          id, status,
          kelompok:kelompok_id(nomor_kelompok, kelas),
          slot:slot_id(nama_slot, jam_mulai, jam_selesai),
          booking_kating(kating:kating_id(nama))
        `)
        .eq("tanggal", today)
        .in("status", ["Disetujui", "Selesai"])
        .order("created_at", { ascending: false });

      return (data ?? []).map((b: any) => ({
        booking_id: b.id,
        kelompok_nama: b.kelompok ? `Kelompok ${b.kelompok.nomor_kelompok} (${b.kelompok.kelas})` : "Kelompok",
        slot_nama: b.slot?.nama_slot ?? "Istirahat",
        kating_names: (b.booking_kating ?? []).map((bk: any) => bk.kating?.nama ?? "Kating"),
        status: b.status as BookingStatus,
        jam: `${b.slot?.jam_mulai ?? "00:00"} - ${b.slot?.jam_selesai ?? "00:00"} WIB`,
      }));
    } catch (err) {
      console.error("[fetchLiveActiveSessions] error:", err);
    }
  }

  // Mock fallback
  const bookingList = getMockBookingList();
  return bookingList
    .filter((b) => b.status === "Disetujui" || b.status === "Selesai")
    .map((b) => ({
      booking_id: b.id,
      kelompok_nama: b.kelompok_nama || "Kelompok",
      slot_nama: b.slot_nama || "Istirahat",
      kating_names: (b.kating_list ?? []).map((k) => k.nama),
      status: b.status,
      jam: `${b.jam_mulai} - ${b.jam_selesai} WIB`,
    }));
}

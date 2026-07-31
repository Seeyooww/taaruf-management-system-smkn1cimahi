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
  progress_rata_rata: number; // percentage avg
  persentase_target: number; // % of members in this group who achieved target
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
  kating_laki_nama: string;
  kating_perempuan_nama: string;
  status: BookingStatus;
  jam: string;
}

/**
 * Fetch Laporan Kelompok
 */
export async function fetchLaporanKelompok(filters?: {
  tanggalMulai?: string;
  tanggalSelesai?: string;
  kelompokId?: string;
  kelas?: string;
  status?: string;
}): Promise<LaporanKelompokItem[]> {
  const settings = await fetchEventSettings();
  const targetKating = settings.target_kating || 5;

  let kelompokList = getMockKelompokList();
  let anggotaList = getMockAnggotaList();
  let bookingList = getMockBookingList();
  let progressSummaries = getMockAnggotaProgressSummaries(targetKating);

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: dbKelompok } = await supabase.from("kelompok").select("*");
      const { data: dbAnggota } = await supabase.from("anggota").select("*");
      const { data: dbBooking } = await supabase.from("booking").select("*");

      if (dbKelompok) kelompokList = dbKelompok as any;
      if (dbAnggota) anggotaList = dbAnggota as any;
      if (dbBooking) bookingList = dbBooking as any;
    } catch {
      // Fallback to mock
    }
  }

  // Apply basic filters
  if (filters?.kelompokId && filters.kelompokId !== "all") {
    kelompokList = kelompokList.filter((k) => k.id === filters.kelompokId);
  }
  if (filters?.kelas && filters.kelas !== "all") {
    kelompokList = kelompokList.filter((k) => k.kelas === filters.kelas);
  }

  return kelompokList.map((k) => {
    const kAnggota = anggotaList.filter((a) => a.kelompok_id === k.id);
    const kNamaAnggota = kAnggota.map((a) => a.nama);

    let kBookings = bookingList.filter((b) => b.kelompok_id === k.id);
    if (filters?.tanggalMulai) {
      kBookings = kBookings.filter((b) => b.tanggal >= filters.tanggalMulai!);
    }
    if (filters?.tanggalSelesai) {
      kBookings = kBookings.filter((b) => b.tanggal <= filters.tanggalSelesai!);
    }
    if (filters?.status && filters.status !== "all") {
      kBookings = kBookings.filter((b) => b.status === filters.status);
    }

    const totalBooking = kBookings.length;
    const bookingSelesai = kBookings.filter((b) => b.status === "Selesai" || b.status === "Disetujui").length;
    const bookingDitolak = kBookings.filter((b) => b.status === "Ditolak").length;
    const bookingDibatalkan = kBookings.filter((b) => b.status === "Dibatalkan").length;

    const kProgress = progressSummaries.filter((p) => p.kelompok_id === k.id);
    const avgProgress =
      kProgress.length === 0
        ? 0
        : Math.round(kProgress.reduce((acc, curr) => acc + curr.percentage, 0) / kProgress.length);

    const achievedCount = kProgress.filter((p) => p.total_kating_met >= p.target_kating).length;
    const persentaseTarget =
      kProgress.length === 0 ? 0 : Math.round((achievedCount / kProgress.length) * 100);

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

/**
 * Fetch Laporan Anggota
 */
export async function fetchLaporanAnggota(filters?: {
  kelompokId?: string;
  namaSearch?: string;
  status?: string;
  kelas?: string;
}): Promise<LaporanAnggotaItem[]> {
  const settings = await fetchEventSettings();
  const targetKating = settings.target_kating || 5;
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
    kating_met_list: s.kating_met_list.map((m) => ({
      ...m,
      kelompok_nama: s.kelompok_nama,
    })),
  }));

  if (filters?.kelompokId && filters.kelompokId !== "all") {
    result = result.filter((a) => a.kelompok_id === filters.kelompokId);
  }

  if (filters?.kelas && filters.kelas !== "all") {
    result = result.filter((a) => a.kelas === filters.kelas);
  }

  if (filters?.status && filters.status !== "all") {
    result = result.filter((a) => a.status === filters.status);
  }

  if (filters?.namaSearch && filters.namaSearch.trim() !== "") {
    const q = filters.namaSearch.toLowerCase().trim();
    result = result.filter((a) => a.nama.toLowerCase().includes(q));
  }

  return result;
}

/**
 * Fetch Laporan Kating
 */
export async function fetchLaporanKating(filters?: {
  tanggalMulai?: string;
  tanggalSelesai?: string;
  kelompokId?: string;
  status?: string;
  katingSearch?: string;
}): Promise<LaporanKatingItem[]> {
  const katingList = getMockKatingList();
  const bookingList = getMockBookingList();
  const slotList = getMockSlotList();
  const summaries = getMockAnggotaProgressSummaries();

  let result: LaporanKatingItem[] = katingList.map((kat) => {
    let myBookings = bookingList.filter(
      (b) => b.kating_laki_id === kat.id || b.kating_perempuan_id === kat.id
    );

    if (filters?.tanggalMulai) {
      myBookings = myBookings.filter((b) => b.tanggal >= filters.tanggalMulai!);
    }
    if (filters?.tanggalSelesai) {
      myBookings = myBookings.filter((b) => b.tanggal <= filters.tanggalSelesai!);
    }
    if (filters?.kelompokId && filters.kelompokId !== "all") {
      myBookings = myBookings.filter((b) => b.kelompok_id === filters.kelompokId);
    }
    if (filters?.status && filters.status !== "all") {
      myBookings = myBookings.filter((b) => b.status === filters.status);
    }

    const uniqueKelompokSet = new Set<string>();
    myBookings.forEach((b) => {
      if (b.kelompok_nama) uniqueKelompokSet.add(b.kelompok_nama);
    });

    let countDitaarufi = 0;
    summaries.forEach((s) => {
      if (s.kating_met_list.some((m) => m.kating_id === kat.id)) {
        countDitaarufi++;
      }
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

/**
 * Fetch Modern Analytics Charts Data
 */
export async function fetchAnalyticsData(): Promise<AnalyticsData> {
  const bookingList = getMockBookingList();
  const slotList = getMockSlotList();
  const progressSummaries = getMockAnggotaProgressSummaries();
  const settings = await fetchEventSettings();

  const dateMap = new Map<string, number>();
  bookingList.forEach((b) => {
    const count = dateMap.get(b.tanggal) || 0;
    dateMap.set(b.tanggal, count + 1);
  });

  const sortedDates = Array.from(dateMap.keys()).sort();
  const bookingPerHari = sortedDates.map((dateStr) => {
    const dateObj = new Date(dateStr);
    const label = dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    return {
      tanggal: dateStr,
      label,
      count: dateMap.get(dateStr) || 0,
    };
  });

  const slotMap = new Map<string, { nama: string; count: number }>();
  slotList.forEach((s) => {
    slotMap.set(s.id, { nama: s.nama_slot, count: 0 });
  });

  bookingList.forEach((b) => {
    if (slotMap.has(b.slot_id)) {
      slotMap.get(b.slot_id)!.count += 1;
    }
  });

  const bookingPerSlot = Array.from(slotMap.entries()).map(([id, val]) => ({
    slot_id: id,
    slot_nama: val.nama,
    count: val.count,
  }));

  const statusCounts: Record<BookingStatus, number> = {
    "Draft": 0,
    "Menunggu Konfirmasi": 0,
    "Disetujui": 0,
    "Ditolak": 0,
    "Selesai": 0,
    "Tidak Dihitung": 0,
    "Dibatalkan": 0,
  };

  bookingList.forEach((b) => {
    if (statusCounts[b.status] !== undefined) {
      statusCounts[b.status] += 1;
    }
  });

  const statusColorMap: Record<BookingStatus, string> = {
    "Selesai": "#10b981",
    "Disetujui": "#3b82f6",
    "Menunggu Konfirmasi": "#f59e0b",
    "Ditolak": "#ef4444",
    "Dibatalkan": "#6b7280",
    "Draft": "#8b5cf6",
    "Tidak Dihitung": "#9ca3af",
  };

  const bookingPerStatus = (Object.keys(statusCounts) as BookingStatus[])
    .filter((st) => statusCounts[st] > 0)
    .map((st) => ({
      status: st,
      count: statusCounts[st],
      color: statusColorMap[st] || "#3b82f6",
    }));

  let p0_25 = 0;
  let p26_50 = 0;
  let p51_75 = 0;
  let p76_99 = 0;
  let p100 = 0;

  progressSummaries.forEach((p) => {
    if (p.percentage === 100) p100++;
    else if (p.percentage >= 76) p76_99++;
    else if (p.percentage >= 51) p51_75++;
    else if (p.percentage >= 26) p26_50++;
    else p0_25++;
  });

  const progressDistribusi = [
    { range: "0 - 25%", count: p0_25 },
    { range: "26 - 50%", count: p26_50 },
    { range: "51 - 75%", count: p51_75 },
    { range: "76 - 99%", count: p76_99 },
    { range: "100% (Target)", count: p100 },
  ];

  const targetKating = settings.target_kating || 5;
  const tercapai = progressSummaries.filter((p) => p.total_kating_met >= targetKating).length;
  const totalAnggota = progressSummaries.length;
  const belumTercapai = Math.max(0, totalAnggota - tercapai);
  const persentaseTercapai =
    totalAnggota === 0 ? 0 : Math.round((tercapai / totalAnggota) * 100);

  return {
    bookingPerHari,
    bookingPerSlot,
    bookingPerStatus,
    progressDistribusi,
    targetTercapaiStats: {
      totalAnggota,
      tercapai,
      belumTercapai,
      persentaseTercapai,
    },
  };
}

/**
 * Fetch LPJ (Rekap Akhir Acara)
 */
export async function fetchLPJSummary(): Promise<LPJSummaryData> {
  const settings = await fetchEventSettings();
  const targetKating = settings.target_kating || 5;

  const kelompokList = getMockKelompokList();
  const anggotaList = getMockAnggotaList();
  const katingList = getMockKatingList();
  const bookingList = getMockBookingList();
  const progressSummaries = getMockAnggotaProgressSummaries(targetKating);

  const totalKelompok = kelompokList.length;
  const totalAnggota = anggotaList.length;
  const totalKating = katingList.length;
  const totalBooking = bookingList.length;

  const bookingBerhasil = bookingList.filter(
    (b) => b.status === "Selesai" || b.status === "Disetujui"
  ).length;
  const bookingGagal = bookingList.filter(
    (b) => b.status === "Ditolak" || b.status === "Dibatalkan"
  ).length;

  const targetTercapai = progressSummaries.filter((p) => p.total_kating_met >= targetKating).length;
  const targetBelumTercapai = Math.max(0, totalAnggota - targetTercapai);

  const persentaseTargetSistem =
    totalAnggota === 0 ? 0 : Math.round((targetTercapai / totalAnggota) * 100);
  const persentaseKelulusanBooking =
    totalBooking === 0 ? 0 : Math.round((bookingBerhasil / totalBooking) * 100);

  return {
    totalKelompok,
    totalAnggota,
    totalKating,
    totalBooking,
    bookingBerhasil,
    bookingGagal,
    targetTercapai,
    targetBelumTercapai,
    persentaseTargetSistem,
    persentaseKelulusanBooking,
    tanggalMulai: settings.tanggal_mulai,
    tanggalSelesai: settings.tanggal_selesai,
  };
}

/**
 * Fetch Live Active Sessions for Admin Tracker Widget
 */
export async function fetchLiveActiveSessions(): Promise<LiveActiveSessionItem[]> {
  const bookingList = getMockBookingList();
  const activeApproved = bookingList.filter((b) => b.status === "Disetujui" || b.status === "Selesai");

  return activeApproved.map((b) => ({
    booking_id: b.id,
    kelompok_nama: b.kelompok_nama || "Kelompok",
    slot_nama: b.slot_nama || "Istirahat",
    kating_laki_nama: b.kating_laki_nama || "Akang",
    kating_perempuan_nama: b.kating_perempuan_nama || "Teteh",
    status: b.status,
    jam: `${b.jam_mulai} - ${b.jam_selesai} WIB`,
  }));
}

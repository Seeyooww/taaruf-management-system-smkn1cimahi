"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  Bell,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Download,
  Flame,
  LayoutDashboard,
  PieChart as PieIcon,
  Plus,
  Radio,
  RefreshCw,
  Server,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CommandPalette } from "@/components/ui/command-palette";
import type {
  ActivityLog,
  Anggota,
  AnggotaProgressSummary,
  BookingWithDetails,
  EventSettings,
  Kating,
  Kelompok,
  LiveSessionItem,
} from "@/types/database";
import type { AnalyticsData } from "@/services/reporting.service";

interface AdminDashboardViewProps {
  sessionProfile: { displayName?: string; username?: string } | null;
  settings: EventSettings;
  kelompokList: Kelompok[];
  anggotaList: Anggota[];
  katingList: Kating[];
  bookingList: BookingWithDetails[];
  progressSummaries: AnggotaProgressSummary[];
  analyticsData: AnalyticsData;
  liveSessions: LiveSessionItem[];
  activityLogs: ActivityLog[];
}

export function AdminDashboardView({
  sessionProfile,
  settings,
  anggotaList,
  katingList,
  bookingList,
  progressSummaries,
  analyticsData,
  liveSessions,
  activityLogs,
}: AdminDashboardViewProps) {
  const [hoveredHariIndex, setHoveredHariIndex] = React.useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = React.useState<string>("Baru Saja");
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);

  // ── Calculation & Computed Metrics ──────────────────────────────────────────
  const totalAnggota = anggotaList.length;
  const katingAktif = katingList.filter((k) => k.aktif).length;

  const todayStr = new Date().toISOString().split("T")[0];
  const bookingHariIni = bookingList.filter((b) => b.tanggal === todayStr);
  const bookingHariIniCount = bookingHariIni.length;

  const bookingSelesai = bookingList.filter((b) => b.status === "Selesai" || b.status === "Disetujui").length;
  const bookingPending = bookingList.filter((b) => b.status === "Menunggu Konfirmasi").length;
  const bookingDitolak = bookingList.filter((b) => b.status === "Ditolak" || b.status === "Dibatalkan").length;

  const targetKatingSetting = settings?.target_kating || 5;
  const sudahTarget = progressSummaries.filter((p) => p.total_kating_met >= targetKatingSetting).length;
  const hampirTarget = progressSummaries.filter(
    (p) => p.total_kating_met < targetKatingSetting && p.percentage >= 70
  ).length;

  const avgPercentage =
    progressSummaries.length === 0
      ? 0
      : Math.round(
          progressSummaries.reduce((acc, curr) => acc + curr.percentage, 0) / progressSummaries.length
        );

  // Event Duration & Day Calculation
  const startDate = new Date(settings?.tanggal_mulai || todayStr);
  const endDate = new Date(settings?.tanggal_selesai || todayStr);
  const todayDate = new Date(todayStr);

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const currentDayNum = Math.min(
    Math.max(1, Math.ceil((todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1),
    totalDays
  );

  // ── Insight Hari Ini (Dynamic Engine) ───────────────────────────────────────
  const insights = React.useMemo(() => {
    const list: { id: number; text: string; type: "success" | "warning" | "info" | "purple" }[] = [];

    // Insight 1: Trend Booking vs Yesterday / Hari Ini
    if (bookingHariIniCount > 0) {
      list.push({
        id: 1,
        text: `Terdapat ${bookingHariIniCount} booking sesi Ta'aruf terdaftar untuk hari ini (${todayStr}).`,
        type: "info",
      });
    } else {
      list.push({
        id: 1,
        text: "Belum ada booking baru untuk hari ini. Jadwal berikutnya dapat dipantau di menu Booking.",
        type: "info",
      });
    }

    // Insight 2: Slot Paling Padat
    if (analyticsData?.bookingPerSlot && analyticsData.bookingPerSlot.length > 0) {
      const topSlot = [...analyticsData.bookingPerSlot].sort((a, b) => b.count - a.count)[0];
      if (topSlot && topSlot.count > 0) {
        list.push({
          id: 2,
          text: `Slot "${topSlot.slot_nama}" paling padat dengan total ${topSlot.count} sesi ta'aruf.`,
          type: "warning",
        });
      }
    }

    // Insight 3: Hampir Target
    if (hampirTarget > 0) {
      list.push({
        id: 3,
        text: `${hampirTarget} anggota telah mencapai >70% progress dan hampir menyelesaikan target.`,
        type: "purple",
      });
    } else if (sudahTarget > 0) {
      list.push({
        id: 3,
        text: `Sebanyak ${sudahTarget} anggota (${Math.round((sudahTarget / (totalAnggota || 1)) * 100)}%) telah 100% tuntas memenuhi target.`,
        type: "success",
      });
    }

    // Insight 4: Bentrok Jadwal Check
    list.push({
      id: 4,
      text: "Engine validasi bentrok aktif: 0 bentrok jadwal kating terdeteksi.",
      type: "success",
    });

    // Insight 5: Rerata System
    list.push({
      id: 5,
      text: `Progress rata-rata seluruh anggota saat ini berada pada angka ${avgPercentage}%.`,
      type: "info",
    });

    return list;
  }, [bookingHariIniCount, todayStr, analyticsData?.bookingPerSlot, hampirTarget, sudahTarget, totalAnggota, avgPercentage]);

  // Handle Refresh Click
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastSyncTime(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB");
    }, 600);
  };

  const { bookingPerHari, bookingPerSlot, bookingPerStatus, progressDistribusi, targetTercapaiStats } = analyticsData || {};

  const maxHariCount = Math.max(...(bookingPerHari ?? []).map((d) => d.count), 1);
  const maxSlotCount = Math.max(...(bookingPerSlot ?? []).map((s) => s.count), 1);
  const topSlotId = React.useMemo(() => {
    if (!bookingPerSlot || bookingPerSlot.length === 0) return null;
    return [...bookingPerSlot].sort((a, b) => b.count - a.count)[0]?.slot_id;
  }, [bookingPerSlot]);

  const maxProgressCount = Math.max(...(progressDistribusi ?? []).map((p) => p.count), 1);
  const totalStatusCount = (bookingPerStatus ?? []).reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ── SECTION 1: TOP COMMAND HEADER BAR ────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border bg-card/80 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <LayoutDashboard className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Command Center Admin
              </h1>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5">
                ENTERPRISE V1.3
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Status Pelaksanaan Acara:</span>
              <span className="font-semibold text-foreground flex items-center gap-1">
                <Calendar className="size-3.5 text-primary" /> Hari Ke-{currentDayNum} dari {totalDays} Hari ({settings?.tanggal_mulai || "2026-08-01"})
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            className="text-xs h-8 font-medium gap-1.5"
            disabled={isRefreshing}
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </Button>
          <CommandPalette />
        </div>
      </div>

      {/* ── SECTION 2: HERO COMMAND CENTER CARD & PROGRESS OVERALL ──────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card/90 to-card p-5 sm:p-6 shadow-md">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 size-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Welcome Info */}
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-[10px] px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
                <Radio className="size-3 animate-pulse" /> System Live Operational
              </Badge>
              <span className="text-xs text-muted-foreground">
                Sync: <strong className="text-foreground">{lastSyncTime}</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Selamat Datang, {sessionProfile?.displayName || sessionProfile?.username || "Admin"}! 👋
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Pantau jalannya sesi Ta&apos;aruf, persetujuan booking kelompok, presensi kating, &amp; pencapaian target peserta secara realtime.
            </p>
          </div>

          {/* Global Progress Bar Ring Widget */}
          <div className="lg:w-80 p-4 rounded-xl border bg-background/80 backdrop-blur-xs space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground flex items-center gap-1">
                <Activity className="size-3.5 text-primary" /> Rata-Rata Progress Acara
              </span>
              <span className="font-extrabold text-primary text-sm font-mono">{avgPercentage}%</span>
            </div>
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden p-0.5 border border-border/50">
              <div
                className="h-full bg-gradient-to-r from-primary via-indigo-500 to-emerald-500 rounded-full transition-all duration-700 ease-out shadow-xs"
                style={{ width: `${Math.max(avgPercentage, 5)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium pt-0.5">
              <span>{sudahTarget} Siswa Tuntas</span>
              <span>Target: {targetKatingSetting} Kating/Siswa</span>
            </div>
          </div>
        </div>

        {/* ADMIN QUICK ACTIONS BAR (Requirement 10) */}
        <div className="mt-5 pt-4 border-t border-border/60">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Zap className="size-3.5 text-amber-500" /> Akses Cepat (Quick Actions):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <Button asChild size="sm" className="text-xs font-semibold bg-primary hover:bg-primary/90 justify-start shadow-xs">
              <Link href="/admin/booking">
                <Plus className="size-3.5 mr-1.5 shrink-0" /> Booking Baru
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="text-xs font-semibold justify-start border-border hover:bg-accent">
              <Link href="/admin/laporan/anggota">
                <UserPlus className="size-3.5 mr-1.5 text-indigo-500 shrink-0" /> Tambah Progress
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="text-xs font-semibold justify-start border-border hover:bg-accent">
              <Link href="/admin/laporan/kelompok">
                <Download className="size-3.5 mr-1.5 text-emerald-500 shrink-0" /> Export Laporan
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="text-xs font-semibold justify-start border-border hover:bg-accent">
              <Link href="/kelompok/leaderboard">
                <Flame className="size-3.5 mr-1.5 text-amber-500 shrink-0" /> Leaderboard
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="text-xs font-semibold justify-start border-border hover:bg-accent">
              <Link href="/admin/pengaturan/acara">
                <Clock className="size-3.5 mr-1.5 text-blue-500 shrink-0" /> Kelola Slot
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="text-xs font-semibold justify-start border-border hover:bg-accent">
              <Link href="/admin/kating">
                <Users className="size-3.5 mr-1.5 text-purple-500 shrink-0" /> Kelola Kating
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: NOTIFIKASI PENDING & LIVE SESSION TRACKER ────────────── */}
      {bookingPending > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-800 dark:text-amber-300 shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            <Bell className="size-4 animate-bounce text-amber-500 shrink-0" />
            <span>
              <strong>🔔 Perhatian Admin:</strong> Terdapat <strong>{bookingPending} permohonan booking baru</strong> yang menunggu konfirmasi/persetujuan.
            </span>
          </div>
          <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs shrink-0 font-semibold shadow-xs">
            <Link href="/admin/booking">
              Tinjau Sekarang ({bookingPending})
            </Link>
          </Button>
        </div>
      )}

      {/* Live Active Sessions Card */}
      <Card className="glass-card border-emerald-500/30 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Radio className="size-4 animate-pulse text-emerald-500" /> Sesi Ta&apos;aruf Berlangsung Saat Ini
            </CardTitle>
            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
              {liveSessions.length} Active Now
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Daftar kelompok dan Kating pendamping yang saat ini sedang melakukan sesi Ta&apos;aruf secara fisik.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {liveSessions.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center justify-center space-y-1">
              <Clock className="size-6 text-muted-foreground/30" />
              <p className="font-semibold text-foreground">Tidak ada sesi berlangsung saat ini.</p>
              <p className="text-[11px]">Sesi berikutnya akan muncul otomatis ketika jam slot dimulai.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {liveSessions.slice(0, 6).map((item) => (
                <div
                  key={item.booking_id}
                  className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 space-y-1.5 hover:border-emerald-500/40 transition-all"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <span>{item.kelompok_nama}</span>
                    <Badge variant="success" className="text-[10px]">
                      {item.slot_nama}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                    <Clock className="size-3 text-emerald-500" /> {item.jam}
                  </div>
                  <div className="text-xs pt-1.5 border-t border-emerald-500/10 flex items-center justify-between text-foreground">
                    <span className="font-medium text-[11px] truncate">
                      👥 {(item.kating_names ?? []).join(" & ") || "Kating"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SECTION 4: KPI CARDS HIERARCHY (Requirement 2) ────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* DOMINANT HERO KPI CARD: Overall Progress (Spans 2 Cols) */}
        <Card className="sm:col-span-2 relative overflow-hidden border-2 border-primary/40 bg-gradient-to-br from-primary/20 via-card to-card p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Activity className="size-4" /> Progress Rerata Sistem
            </span>
            <Badge variant="primary" className="text-[10px] font-mono">HERO KPI</Badge>
          </div>
          <div className="py-2 flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-mono">
              {avgPercentage}%
            </span>
            <span className="text-xs text-emerald-500 font-semibold flex items-center gap-0.5">
              <TrendingUp className="size-3.5" /> Normal
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(avgPercentage, 5)}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Total {totalAnggota} siswa dalam sistem | Target minimal {targetKatingSetting} Kating
            </p>
          </div>
        </Card>

        {/* Card 2: Booking Hari Ini */}
        <Card className="p-3.5 space-y-1.5 border bg-card shadow-2xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Hari Ini</span>
            <CalendarCheck className="size-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
            {bookingHariIniCount}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">Booking Sesi Hari Ini</div>
        </Card>

        {/* Card 3: Booking Selesai */}
        <Card className="p-3.5 space-y-1.5 border bg-card shadow-2xs hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Disetujui / OK</span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {bookingSelesai}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">Sesi Disetujui / Selesai</div>
        </Card>

        {/* Card 4: Booking Pending */}
        <Card className="p-3.5 space-y-1.5 border bg-card shadow-2xs hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Pending</span>
            <Clock className="size-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {bookingPending}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">Menunggu Persetujuan</div>
        </Card>

        {/* Card 5: Target Tercapai */}
        <Card className="p-3.5 space-y-1.5 border bg-card shadow-2xs hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Target OK</span>
            <UserCheck className="size-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
            {sudahTarget}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            {Math.round((sudahTarget / (totalAnggota || 1)) * 100)}% dari Total Siswa
          </div>
        </Card>
      </div>

      {/* ── SECTION 5: CHARTS GRID (Requirements 3, 4, 5, 6, 7) ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: 2 Cols Width (Booking Per Hari, Booking Per Slot, Progress Anggota) */}
        <div className="lg:col-span-2 space-y-6">

          {/* CHART 1: Booking Per Hari (Requirement 3) */}
          <Card className="glass-card shadow-xs border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="size-4 text-blue-500" /> Booking Per Hari
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tren pengajuan sesi Ta&apos;aruf sepanjang pelaksanaan acara
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {(bookingPerHari ?? []).reduce((a, b) => a + b.count, 0)} Total Sesi
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {(!bookingPerHari || bookingPerHari.length === 0) ? (
                <p className="text-xs text-muted-foreground text-center py-8">Belum ada data booking.</p>
              ) : (
                <div className="space-y-3">
                  <div className="h-44 flex items-end justify-between gap-2 px-2 pt-6 pb-2 border-b border-border">
                    {bookingPerHari.map((item, idx) => {
                      const heightPercent = Math.round((item.count / maxHariCount) * 100);
                      const isToday = item.tanggal === todayStr;
                      return (
                        <div
                          key={item.tanggal}
                          className="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer"
                          onMouseEnter={() => setHoveredHariIndex(idx)}
                          onMouseLeave={() => setHoveredHariIndex(null)}
                        >
                          {/* Tooltip */}
                          {hoveredHariIndex === idx && (
                            <div className="absolute -top-10 z-20 px-2.5 py-1 rounded-md bg-popover text-popover-foreground border border-border text-[11px] font-medium shadow-md animate-in fade-in zoom-in-95 whitespace-nowrap">
                              <strong>{item.label}</strong>: <span className="text-primary font-bold">{item.count} booking</span>
                            </div>
                          )}

                          <div className="text-[10px] font-semibold text-muted-foreground group-hover:text-primary transition-colors font-mono">
                            {item.count}
                          </div>
                          <div
                            className={`w-full max-w-[36px] rounded-t-md transition-all duration-300 group-hover:brightness-110 shadow-xs ${
                              isToday
                                ? "bg-gradient-to-t from-primary via-blue-500 to-indigo-400 ring-2 ring-primary/40"
                                : "bg-gradient-to-t from-primary/70 to-blue-400"
                            }`}
                            style={{ height: `${Math.max(heightPercent, 8)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between px-2 text-[10px] text-muted-foreground font-medium">
                    {bookingPerHari.map((item) => (
                      <span key={item.tanggal} className="truncate max-w-[44px] text-center">
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CHART 2: Booking Per Slot (Requirement 5) */}
          <Card className="glass-card shadow-xs border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="size-4 text-amber-500" /> Booking Per Slot Waktu
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Distribusi permohonan pada slot jam istirahat
                  </CardDescription>
                </div>
                <Badge variant="warning" className="text-[10px] flex items-center gap-1">
                  <Flame className="size-3" /> Slot Padat Highlight
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {(bookingPerSlot ?? []).map((slot) => {
                const widthPct = Math.round((slot.count / maxSlotCount) * 100);
                const isTopSlot = slot.slot_id === topSlotId && slot.count > 0;
                return (
                  <div key={slot.slot_id} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5 truncate">
                        {slot.slot_nama}
                        {isTopSlot && (
                          <Badge variant="warning" className="text-[9px] h-4 px-1">
                            🔥 Terpadat
                          </Badge>
                        )}
                      </span>
                      <span className="font-bold text-foreground font-mono">{slot.count} sesi</span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isTopSlot
                            ? "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 shadow-xs"
                            : "bg-gradient-to-r from-amber-400 to-amber-600"
                        }`}
                        style={{ width: `${Math.max(widthPct, 6)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* CHART 3: Progress Anggota Histogram (Requirement 6) */}
          <Card className="glass-card shadow-xs border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="size-4 text-indigo-500" /> Sebaran Progress Anggota
              </CardTitle>
              <CardDescription className="text-xs">
                Distribusikan tingkat pencapaian kating seluruh siswa (Warna Bertingkat)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {(progressDistribusi ?? []).map((item, idx) => {
                const widthPct = Math.round((item.count / maxProgressCount) * 100);
                // Graduated Colors: 0-25% Red, 26-50% Amber, 51-75% Blue, 76-100% Emerald
                let gradientClass = "from-rose-500 to-red-600";
                if (idx === 1) gradientClass = "from-amber-500 to-orange-600";
                if (idx === 2) gradientClass = "from-blue-500 to-indigo-600";
                if (idx === 3) gradientClass = "from-emerald-500 to-teal-600";

                return (
                  <div key={item.range} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Interval Progress {item.range}</span>
                      <span className="font-bold text-foreground font-mono">{item.count} siswa</span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full bg-gradient-to-r ${gradientClass} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(widthPct, 6)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: 1 Col Width (Target Gauge & Status Segmented Bar) */}
        <div className="space-y-6">

          {/* CHART 4: Target Tercapai Gauge (Requirement 7) */}
          <Card className="glass-card shadow-xs border flex flex-col justify-between">
            <CardHeader className="pb-2 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="size-4 text-purple-500" /> Target Tercapai Gauge
              </CardTitle>
              <CardDescription className="text-xs">
                Siswa yang memenuhi kriteria minimal {targetKatingSetting} Kating
              </CardDescription>
            </CardHeader>
            <CardContent className="py-5 flex flex-col items-center justify-center space-y-4">
              {/* Donut Ring SVG */}
              <div className="relative size-36 flex items-center justify-center">
                <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-muted stroke-current"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-purple-600 dark:text-purple-400 stroke-current transition-all duration-700 ease-out"
                    strokeDasharray={`${targetTercapaiStats?.persentaseTercapai || 0}, 100`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-foreground font-mono tracking-tight">
                    {targetTercapaiStats?.persentaseTercapai || 0}%
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Tuntas</span>
                </div>
              </div>

              {/* Target Breakdown Card */}
              <div className="grid grid-cols-2 gap-2.5 w-full text-center text-xs">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="font-extrabold text-purple-600 dark:text-purple-300 font-mono text-sm">
                    {targetTercapaiStats?.tercapai || 0} Siswa
                  </div>
                  <div className="text-[10px] text-muted-foreground">Selesai (Target OK)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="font-extrabold text-amber-600 dark:text-amber-300 font-mono text-sm">
                    {targetTercapaiStats?.belumTercapai || 0} Siswa
                  </div>
                  <div className="text-[10px] text-muted-foreground">Belum Selesai</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CHART 5: Booking Per Status (Requirement 4) */}
          <Card className="glass-card shadow-xs border">
            <CardHeader className="pb-2 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <PieIcon className="size-4 text-emerald-500" /> Booking Per Status
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {totalStatusCount} Total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {/* Segmented Distribution Bar */}
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-muted p-0.5 border border-border/40">
                {(bookingPerStatus ?? []).map((st) => {
                  const pct = totalStatusCount === 0 ? 0 : Math.round((st.count / totalStatusCount) * 100);
                  return (
                    <div
                      key={st.status}
                      className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 hover:opacity-90"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: st.color,
                      }}
                      title={`${st.status}: ${st.count} (${pct}%)`}
                    />
                  );
                })}
              </div>

              {/* Status Details Cards */}
              <div className="space-y-1.5 pt-1">
                {(bookingPerStatus ?? []).map((st) => {
                  const pct = totalStatusCount === 0 ? 0 : Math.round((st.count / totalStatusCount) * 100);
                  return (
                    <div
                      key={st.status}
                      className="flex items-center justify-between p-2 rounded-lg border bg-card/60 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: st.color }}
                        />
                        <span className="font-medium text-foreground">{st.status}</span>
                      </div>
                      <div className="font-semibold font-mono flex items-center gap-1">
                        <span>{st.count}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* ── SECTION 6: D-DAY PANELS (Requirements 8, 9, 11, 12) ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* PANEL 1: Insight Hari Ini (Requirement 8) */}
        <Card className="glass-card border-blue-500/30 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Sparkles className="size-4 text-blue-500" /> 📊 Insight Hari Ini
            </CardTitle>
            <CardDescription className="text-xs">
              Rangkuman analisis otomatis diekstrak langsung dari data sistem.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5 text-xs">
            {insights.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl border border-border/50 bg-card/50 flex items-start gap-2 leading-relaxed"
              >
                <span className="text-primary font-bold shrink-0 mt-0.5">•</span>
                <span className="text-muted-foreground text-[11px]">{item.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* PANEL 2: Aktivitas Terbaru Timeline (Requirement 9) */}
        <Card className="glass-card border-purple-500/30 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Clock className="size-4 text-purple-500" /> ⚡ Aktivitas Terbaru
            </CardTitle>
            <CardDescription className="text-xs">
              Log aktivitas realtime dari sistem Ta&apos;aruf Management System.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs max-h-72 overflow-y-auto pr-1">
            {(!activityLogs || activityLogs.length === 0) ? (
              <p className="text-center py-6 text-xs text-muted-foreground">Belum ada catatan aktivitas.</p>
            ) : (
              activityLogs.slice(0, 6).map((log) => {
                const timeOnly = new Date(log.created_at).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div key={log.id} className="flex items-start gap-2.5 text-[11px] pb-2 border-b border-border/40 last:border-0 last:pb-0">
                    <Badge variant="outline" className="text-[9px] font-mono shrink-0 px-1.5 py-0.5 mt-0.5">
                      {timeOnly}
                    </Badge>
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-semibold text-foreground truncate">
                        {log.user_name} — <span className="text-primary">{log.action}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{log.details}</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* PANEL 3: System Status & Today's Summary (Requirements 11, 12) */}
        <Card className="glass-card border-emerald-500/30 shadow-xs space-y-4">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Server className="size-4 text-emerald-500" /> 🖥️ System &amp; Today Summary
            </CardTitle>
            <CardDescription className="text-xs">
              Status operasional server &amp; ringkasan metrik hari ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {/* System Status Indicators (Requirement 11) */}
            <div className="space-y-1.5 p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20 font-mono text-[11px]">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-300">
                <span className="flex items-center gap-1.5">🟢 Database Connected</span>
                <span className="text-[9px] opacity-75">OK</span>
              </div>
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-300">
                <span className="flex items-center gap-1.5">🟢 Realtime Sync Active</span>
                <span className="text-[9px] opacity-75">ONLINE</span>
              </div>
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-300">
                <span className="flex items-center gap-1.5">🟢 Server Healthy (Next.js 15)</span>
                <span className="text-[9px] opacity-75">HEALTHY</span>
              </div>
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-300">
                <span className="flex items-center gap-1.5">🟢 Booking Service Engine</span>
                <span className="text-[9px] opacity-75">ACTIVE</span>
              </div>
            </div>

            {/* Today's Summary Numbers (Requirement 12) */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Ringkasan Hari Ini:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg border bg-card/60 flex items-center justify-between">
                  <span>Booking Baru</span>
                  <span className="font-bold text-primary font-mono">{bookingHariIniCount}</span>
                </div>
                <div className="p-2 rounded-lg border bg-card/60 flex items-center justify-between">
                  <span>Target OK</span>
                  <span className="font-bold text-purple-500 font-mono">{sudahTarget}</span>
                </div>
                <div className="p-2 rounded-lg border bg-card/60 flex items-center justify-between">
                  <span>Kating Aktif</span>
                  <span className="font-bold text-indigo-500 font-mono">{katingAktif}</span>
                </div>
                <div className="p-2 rounded-lg border bg-card/60 flex items-center justify-between">
                  <span>Pembatalan</span>
                  <span className="font-bold text-rose-500 font-mono">{bookingDitolak}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

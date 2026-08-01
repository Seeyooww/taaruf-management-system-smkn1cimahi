import Link from "next/link";

export const dynamic = "force-dynamic";

import { getAnggotaAction } from "@/services/anggota.actions";
import { getBookingAction } from "@/services/booking.actions";
import { getKatingAction } from "@/services/kating.actions";
import { getKelompokAction } from "@/services/kelompok.actions";
import { getAnggotaProgressAction } from "@/services/progress.actions";
import { getAnalyticsDataAction, getLiveActiveSessionsAction } from "@/services/reporting.actions";
import { getSessionProfile } from "@/services/auth.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommandPalette } from "@/components/ui/command-palette";
import {
  Activity,
  Bell,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Database,
  Plus,
  Radio,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { AdminStatsCharts } from "@/components/admin/charts/admin-stats-charts";

export const metadata = {
  title: "Dashboard Admin - TMS",
};

export default async function AdminDashboardPage() {
  const session = await getSessionProfile();

  const [
    ,
    anggotaList,
    ,
    bookingList,
    progressSummaries,
    analyticsData,
    liveSessions,
  ] = await Promise.all([
    getKelompokAction(),
    getAnggotaAction(),
    getKatingAction(),
    getBookingAction(),
    getAnggotaProgressAction(),
    getAnalyticsDataAction(),
    getLiveActiveSessionsAction(),
  ]);

  const totalAnggota = anggotaList.length;

  const todayStr = new Date().toISOString().split("T")[0];
  const bookingHariIni = bookingList.filter((b) => b.tanggal === todayStr).length;

  const bookingSelesai = bookingList.filter((b) => b.status === "Selesai" || b.status === "Disetujui").length;
  const bookingPending = bookingList.filter((b) => b.status === "Menunggu Konfirmasi").length;
  const bookingDitolak = bookingList.filter((b) => b.status === "Ditolak" || b.status === "Dibatalkan").length;

  const sudahTarget = progressSummaries.filter((p) => p.total_kating_met >= p.target_kating).length;
  const belumTarget = Math.max(0, totalAnggota - sudahTarget);

  const avgPercentage =
    progressSummaries.length === 0
      ? 0
      : Math.round(
          progressSummaries.reduce((acc, curr) => acc + curr.percentage, 0) / progressSummaries.length
        );

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Quick Actions */}
      <div className="rounded-2xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Selamat Datang, {session?.displayName || session?.username || "Admin"}!
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Ringkasan statistik live, active session tracker, & pelaporan Taaruf Management System.
            </p>
          </div>
          <CommandPalette />
        </div>

        {/* ADMIN QUICK ACTIONS WIDGET BAR */}
        <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">
            Quick Actions:
          </span>
          <Button asChild size="sm" className="text-xs font-semibold bg-primary">
            <Link href="/admin/booking">
              <Plus className="size-3.5 mr-1" /> Booking Baru
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="text-xs font-semibold">
            <Link href="/admin/kelompok">
              <Plus className="size-3.5 mr-1 text-primary" /> Tambah Kelompok
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="text-xs font-semibold">
            <Link href="/admin/kating">
              <Plus className="size-3.5 mr-1 text-indigo-500" /> Tambah Kating
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="text-xs font-semibold">
            <Link href="/admin/pengaturan/backup">
              <Sparkles className="size-3.5 mr-1 text-amber-500" /> Seeder
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="text-xs font-semibold">
            <Link href="/admin/pengaturan/backup">
              <Database className="size-3.5 mr-1 text-emerald-500" /> Backup JSON
            </Link>
          </Button>
        </div>
      </div>

      {/* NOTIFIKASI PENDING BOOKING BADGE */}
      {bookingPending > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-3 text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <Bell className="size-4 animate-bounce text-amber-500 shrink-0" />
            <span>
              <strong>🔔 Notifikasi:</strong> Terdapat <strong>{bookingPending} permohonan booking</strong> menunggu persetujuan Admin!
            </span>
          </div>
          <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs shrink-0">
            <Link href="/admin/booking">
              Tinjau Booking ({bookingPending})
            </Link>
          </Button>
        </div>
      )}

      {/* LIVE ACTIVE SESSIONS WIDGET */}
      <Card className="glass-card border-emerald-500/30">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Radio className="size-4 animate-pulse text-emerald-500" /> Kelompok Sedang Taaruf Sekarang
            </CardTitle>
            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
              Live Session Tracker
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Daftar kelompok dan pasangan Kating yang saat ini sedang berlangsung sesi Taaruf.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {liveSessions.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center justify-center space-y-1">
              <Clock className="size-6 text-muted-foreground/40" />
              <p className="font-semibold text-foreground">Tidak ada sesi berlangsung saat ini.</p>
              <p className="text-[11px]">Seluruh sesi Taaruf hari ini belum dimulai atau telah selesai.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {liveSessions.slice(0, 6).map((item) => (
                <div
                  key={item.booking_id}
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1.5"
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
                  <div className="text-xs pt-1 border-t border-emerald-500/10 flex items-center justify-between text-foreground">
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

      {/* Live Statistics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Booking Hari Ini */}
        <Card className="glass-card p-3 space-y-1 border">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>Hari Ini</span>
            <CalendarCheck className="size-3.5 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-primary">{bookingHariIni}</div>
          <div className="text-[10px] text-muted-foreground truncate">Booking Hari Ini</div>
        </Card>

        {/* Booking Selesai */}
        <Card className="glass-card p-3 space-y-1 border">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>Selesai</span>
            <CheckCircle2 className="size-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{bookingSelesai}</div>
          <div className="text-[10px] text-muted-foreground truncate">Disetujui / Selesai</div>
        </Card>

        {/* Booking Pending */}
        <Card className="glass-card p-3 space-y-1 border">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>Pending</span>
            <Clock className="size-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{bookingPending}</div>
          <div className="text-[10px] text-muted-foreground truncate">Menunggu Konfirmasi</div>
        </Card>

        {/* Booking Ditolak */}
        <Card className="glass-card p-3 space-y-1 border">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>Ditolak</span>
            <XCircle className="size-3.5 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{bookingDitolak}</div>
          <div className="text-[10px] text-muted-foreground truncate">Ditolak / Batal</div>
        </Card>

        {/* Total Progress */}
        <Card className="glass-card p-3 space-y-1 border">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>Progress</span>
            <Activity className="size-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{avgPercentage}%</div>
          <div className="text-[10px] text-muted-foreground truncate">Total Rerata Sistem</div>
        </Card>

        {/* Target Tercapai */}
        <Card className="glass-card p-3 space-y-1 border">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>Target OK</span>
            <CheckCircle2 className="size-3.5 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{sudahTarget}</div>
          <div className="text-[10px] text-muted-foreground truncate">Mencapai Target</div>
        </Card>

        {/* Target Belum */}
        <Card className="glass-card p-3 space-y-1 border">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>Belum OK</span>
            <Users className="size-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{belumTarget}</div>
          <div className="text-[10px] text-muted-foreground truncate">Belum Selesai</div>
        </Card>
      </div>

      {/* Modern Interactive Charts */}
      <AdminStatsCharts data={analyticsData} />
    </div>
  );
}

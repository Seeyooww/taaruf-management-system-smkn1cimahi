import Link from "next/link";
import { redirect } from "next/navigation";
import { getAnnouncementAction } from "@/services/announcement.actions";
import { getBookingAction } from "@/services/booking.actions";
import { getAnggotaProgressAction } from "@/services/progress.actions";
import { getSessionProfile } from "@/services/auth.service";
import { getKelompokIdFromSession } from "@/services/auth.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Bell,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Target,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Kelompok - TMS",
};

export default async function KelompokDashboardPage() {
  const session = await getSessionProfile();
  const kelompokId = await getKelompokIdFromSession();

  if (!kelompokId) {
    redirect("/kelompok/login");
  }

  const [bookingList, announcements, progressList] = await Promise.all([
    getBookingAction(kelompokId),
    getAnnouncementAction(),
    getAnggotaProgressAction(kelompokId),
  ]);

  const activeAnnouncements = announcements.filter((a) => a.aktif);

  const totalBooking = bookingList.length;
  const approvedBooking = bookingList.filter((b) => b.status === "Disetujui" || b.status === "Selesai").length;
  const pendingBooking = bookingList.filter((b) => b.status === "Menunggu Konfirmasi").length;

  // Group Progress Summary Calculation
  const totalTargetKatingSum = progressList.reduce((acc, curr) => acc + curr.target_kating, 0);
  const totalMetCountSum = progressList.reduce((acc, curr) => acc + curr.total_kating_met, 0);
  const totalGroupPercentage =
    totalTargetKatingSum === 0
      ? 0
      : Math.min(100, Math.round((totalMetCountSum / totalTargetKatingSum) * 100));

  // Find Next Upcoming Approved/Pending Booking (sorted by tanggal asc)
  const sortedUpcoming = [...bookingList]
    .filter((b) => b.status === "Disetujui" || b.status === "Menunggu Konfirmasi")
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  const nextBooking = sortedUpcoming[0] ?? null;

  // Dynamic countdown: days until next booking
  const countdownText = (() => {
    if (!nextBooking) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(nextBooking.tanggal);
    bookingDate.setHours(0, 0, 0, 0);
    const diffMs = bookingDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return `Hari Ini pukul ${nextBooking.jam_mulai} WIB`;
    if (diffDays === 1) return `Besok pukul ${nextBooking.jam_mulai} WIB`;
    if (diffDays > 1) return `${diffDays} hari lagi (${nextBooking.jam_mulai} WIB)`;
    return `Sudah berlalu`;
  })();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl border bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
              <Sparkles className="size-3.5" /> Akun Terverifikasi
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Selamat Datang, {session?.displayName || session?.username || "Kelompok"}!
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Beranda resmi kelompok untuk memantau alur kegiatan Taaruf SMKN 1 Cimahi.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="text-xs font-semibold">
              <Link href="/kelompok/progress">
                <Activity className="mr-1.5 size-3.5 text-blue-500" /> Progress Anggota
              </Link>
            </Button>
            <Button asChild size="sm" className="font-semibold text-xs shadow-xs bg-primary">
              <Link href="/kelompok/booking">
                <CalendarCheck className="mr-1.5 size-3.5" /> Booking Baru
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* BOOKING BERIKUTNYA & COUNTDOWN CARD */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Card className="glass-card md:col-span-6 border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-2 border-b border-emerald-500/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <Clock className="size-4 animate-pulse text-emerald-500" /> Booking Berikutnya
              </CardTitle>
              <Badge variant="success" className="text-[10px]">
                {nextBooking ? nextBooking.status : "Belum Ada Jadwal"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {nextBooking ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-foreground">
                  <span className="font-semibold">Hari & Tanggal:</span>
                  <span className="font-bold text-primary">{nextBooking.tanggal}</span>
                </div>
                <div className="flex items-center justify-between text-foreground">
                  <span className="font-semibold">Slot Waktu:</span>
                  <span>{nextBooking.slot_nama} ({nextBooking.jam_mulai} - {nextBooking.jam_selesai} WIB)</span>
                </div>
                <div className="flex items-center justify-between text-foreground pt-1 border-t border-border/50">
                  <span className="font-semibold">Akang:</span>
                  <span className="font-medium text-emerald-700 dark:text-emerald-300">{nextBooking.kating_laki_nama}</span>
                </div>
                <div className="flex items-center justify-between text-foreground">
                  <span className="font-semibold">Teteh:</span>
                  <span className="font-medium text-emerald-700 dark:text-emerald-300">{nextBooking.kating_perempuan_nama}</span>
                </div>

                {/* Dynamic Countdown */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 mt-2 flex items-center justify-between text-emerald-800 dark:text-emerald-200">
                  <span className="text-[11px] font-semibold flex items-center gap-1.5">
                    <Clock className="size-3.5 text-emerald-500" /> Countdown Sesi:
                  </span>
                  <span className="font-mono font-bold text-xs">
                    {countdownText}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground space-y-2">
                <CalendarCheck className="mx-auto size-8 text-muted-foreground/40" />
                <p className="font-semibold text-foreground">Belum ada booking aktif berikutnya.</p>
                <Button asChild size="sm" className="text-xs bg-primary mt-1">
                  <Link href="/kelompok/booking">+ Buat Booking Sekarang</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PROGRESS TARGET ANIMATED CARD */}
        <Card className="glass-card md:col-span-6 border-primary/30">
          <CardHeader className="pb-2 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <Target className="size-4 text-primary" /> Target & Progress Kelompok
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs text-primary h-7">
                <Link href="/kelompok/progress">Rincian &rarr;</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-semibold">Total Pencapaian Kating:</span>
              <span className="text-primary text-xl font-extrabold">
                {totalMetCountSum} / {totalTargetKatingSum} <span className="text-sm font-bold">({totalGroupPercentage}%)</span>
              </span>
            </div>

            {/* Animated Progress Bar */}
            <div className="space-y-1">
              <Progress
                value={totalGroupPercentage}
                className="h-3.5 bg-muted/60 transition-all duration-700 ease-in-out"
                indicatorClassName="bg-primary transition-all duration-700 ease-in-out"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100% Target</span>
              </div>
            </div>

            {/* Quick Member Progress Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {progressList.slice(0, 4).map((m) => {
                const isDone = m.total_kating_met >= m.target_kating;
                return (
                  <div key={m.anggota_id} className="p-2 rounded-lg border bg-card/60 flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground truncate max-w-[100px]">{m.nama}</span>
                    <Badge variant={isDone ? "default" : "secondary"} className="text-[10px]">
                      {m.total_kating_met}/{m.target_kating} ({m.percentage}%)
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Announcements Section */}
      {activeAnnouncements.length > 0 && (
        <Card className="glass-card border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <Bell className="size-4" /> Pengumuman Resmi Panitia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeAnnouncements.map((ann) => (
              <div key={ann.id} className="rounded-xl border bg-card p-3.5 space-y-1">
                <div className="flex items-center justify-between font-bold text-xs">
                  <span>{ann.judul}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {new Date(ann.created_at).toLocaleDateString("id-ID")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{ann.isi}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Info Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Total Booking Sesi
            </CardTitle>
            <CalendarCheck className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">{totalBooking}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Pengajuan jadwal kelompok
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Sesi Disetujui
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {approvedBooking}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Jadwal siap dilaksanakan
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Menunggu Konfirmasi
            </CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {pendingBooking}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Menunggu verifikasi admin
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

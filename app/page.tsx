import Link from "next/link";
import { ArrowRight, Bell, Calendar, Shield, Sparkles, Users } from "lucide-react";

import { ThemeSwitch } from "@/components/common/theme-switch";
import { CountdownTimer } from "@/components/common/countdown-timer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_SHORT_NAME,
} from "@/lib/constants";
import { getAnnouncementAction } from "@/services/announcement.actions";

export default async function LandingPage() {
  const announcements = await getAnnouncementAction();
  const activeAnnouncement = announcements.find((a) => a.aktif) || announcements[0];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-sm shrink-0">
              {APP_SHORT_NAME}
            </div>
            <span className="font-bold text-sm sm:text-base tracking-tight hidden xs:inline-block">
              {APP_NAME}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeSwitch />
            <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
              <Link href="/admin/login">Masuk Admin</Link>
            </Button>
            <Button asChild size="sm" className="text-xs sm:text-sm">
              <Link href="/kelompok/login">Masuk Kelompok</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-10 sm:py-20 lg:py-28 px-4">
          {/* Subtle Background Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[320px] sm:size-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-xs">
              <Sparkles className="size-3.5 shrink-0" />
              <span>Sistem Manajemen Taaruf SMKN 1 Cimahi</span>
            </div>

            <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance leading-tight">
              Kelola Event Taaruf Secara <span className="text-primary">Terstruktur & Safe</span>
            </h1>

            <p className="text-sm sm:text-lg text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed px-2">
              {APP_DESCRIPTION}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2 max-w-md sm:max-w-none mx-auto">
              <Button asChild size="lg" className="w-full sm:w-auto font-semibold px-8 shadow-md h-12 min-h-[48px]">
                <Link href="/kelompok/login">
                  <Users className="mr-2 size-5" />
                  Masuk Kelompok
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto font-semibold px-8 h-12 min-h-[48px]">
                <Link href="/admin/login">
                  <Shield className="mr-2 size-5" />
                  Masuk Admin
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Dynamic Cards Grid Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Countdown Placeholder Card */}
            <Card className="glass-card border-border/60 shadow-sm relative overflow-hidden">
              <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Hitung Mundur Acara</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Jadwal resmi event Taaruf</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <CountdownTimer />
              </CardContent>
            </Card>

            {/* Dynamic Announcement Card */}
            <Card className="glass-card border-border/60 shadow-sm relative overflow-hidden">
              <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <Bell className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    {activeAnnouncement ? activeAnnouncement.judul : "Pengumuman Terbaru"}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Informasi resmi dari Admin</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 sm:p-6 text-center space-y-2">
                  <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed">
                    {activeAnnouncement ? activeAnnouncement.isi : "Belum ada pengumuman baru."}
                  </p>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Diperbarui oleh Panitia Taaruf SMKN 1 Cimahi
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 sm:py-8 bg-card text-card-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-semibold text-foreground">{APP_SHORT_NAME}</span>
            <span>&bull;</span>
            <span>SMKN 1 Cimahi &copy; {new Date().getFullYear()}</span>
          </div>
          <p>Phase 2A Foundation Application</p>
        </div>
      </footer>
    </div>
  );
}

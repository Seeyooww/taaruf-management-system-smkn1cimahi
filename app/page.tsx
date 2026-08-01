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
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-sm">
              {APP_SHORT_NAME}
            </div>
            <span className="font-bold text-base tracking-tight hidden sm:inline-block">
              {APP_NAME}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitch />
            <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
              <Link href="/admin/login">Masuk Admin</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/kelompok/login">Masuk Kelompok</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
          {/* Subtle Background Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary shadow-xs">
              <Sparkles className="size-3.5" />
              <span>Sistem Manajemen Taaruf SMKN 1 Cimahi</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance leading-tight">
              Kelola Event Taaruf Secara <span className="text-primary">Terstruktur & Safe</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
              {APP_DESCRIPTION}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button asChild size="lg" className="w-full sm:w-auto font-semibold px-8 shadow-md">
                <Link href="/kelompok/login">
                  <Users className="mr-2 size-5" />
                  Masuk Kelompok
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto font-semibold px-8">
                <Link href="/admin/login">
                  <Shield className="mr-2 size-5" />
                  Masuk Admin
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Dynamic Cards Grid Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Countdown Placeholder Card */}
            <Card className="glass-card border-border/60 shadow-sm relative overflow-hidden">
              <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Hitung Mundur Acara</CardTitle>
                  <CardDescription>Jadwal resmi event Taaruf</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <CountdownTimer />
              </CardContent>
            </Card>

            {/* Dynamic Announcement Card */}
            <Card className="glass-card border-border/60 shadow-sm relative overflow-hidden">
              <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Bell className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {activeAnnouncement ? activeAnnouncement.judul : "Pengumuman Terbaru"}
                  </CardTitle>
                  <CardDescription>Informasi resmi dari Admin</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center space-y-2">
                  <p className="text-sm text-foreground font-medium leading-relaxed">
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
      <footer className="border-t border-border py-8 bg-card text-card-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
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

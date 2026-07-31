"use client";

import * as React from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  Activity,
  Award,
  BookOpen,
  CalendarCheck,
  Clock,
  Database,
  FileSpreadsheet,
  FileText,
  Info,
  Search,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Halaman" | "Kelompok" | "Anggota" | "Kating";
  href: string;
  icon: React.ElementType;
}

const STATIC_PAGES: CommandItem[] = [
  { id: "page-1", title: "Dashboard Admin", subtitle: "Ringkasan statistik & aktivitas", category: "Halaman", href: "/admin/dashboard", icon: Activity },
  { id: "page-2", title: "Booking Kelompok", subtitle: "Verifikasi permohonan booking", category: "Halaman", href: "/admin/booking", icon: CalendarCheck },
  { id: "page-3", title: "Monitoring Progress", subtitle: "Pantau kating met per anggota", category: "Halaman", href: "/admin/progress", icon: Activity },
  { id: "page-4", title: "Data Kelompok", subtitle: "Master data kelompok peserta", category: "Halaman", href: "/admin/kelompok", icon: Users },
  { id: "page-5", title: "Data Anggota", subtitle: "Master data anggota per kelompok", category: "Halaman", href: "/admin/anggota", icon: UserCheck },
  { id: "page-6", title: "Data Kating", subtitle: "Master data Kakak Tingkat", category: "Halaman", href: "/admin/kating", icon: Shield },
  { id: "page-7", title: "Laporan Kelompok", subtitle: "Rekapitulasi booking kelompok", category: "Halaman", href: "/admin/laporan/kelompok", icon: FileSpreadsheet },
  { id: "page-8", title: "Laporan Anggota", subtitle: "Rekapitulasi kating met anggota", category: "Halaman", href: "/admin/laporan/anggota", icon: FileText },
  { id: "page-9", title: "Laporan Kating", subtitle: "Rekapitulasi riwayat ditaarufi", category: "Halaman", href: "/admin/laporan/kating", icon: Shield },
  { id: "page-10", title: "Rekap LPJ (Akhir Acara)", subtitle: "Laporan pertanggungjawaban resmi", category: "Halaman", href: "/admin/laporan/lpj", icon: Award },
  { id: "page-11", title: "Pengaturan Backup & Seeder", subtitle: "JSON Backup & Simulasi Event", category: "Halaman", href: "/admin/pengaturan/backup", icon: Database },
  { id: "page-12", title: "Panduan System", subtitle: "Petunjuk operasional Admin & Kelompok", category: "Halaman", href: "/admin/panduan", icon: BookOpen },
  { id: "page-13", title: "Tentang Aplikasi", subtitle: "Informasi SMKN 1 Cimahi v1.0.0", category: "Halaman", href: "/admin/tentang", icon: Info },
];

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  // Listen to Ctrl+K or Cmd+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredItems = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return STATIC_PAGES;

    return STATIC_PAGES.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href as Route);
  };

  return (
    <>
      {/* Keyboard Shortcut Trigger Badge on UI */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-input bg-background/60 hover:bg-muted text-xs text-muted-foreground transition-all shadow-xs"
      >
        <Search className="size-3.5" />
        <span>Cari cepat halaman / data...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command Palette Modal Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-border shadow-2xl">
          <DialogHeader className="p-4 pb-0 border-b border-border/50">
            <DialogTitle className="sr-only">Command Palette Navigation</DialogTitle>
            <div className="relative flex items-center">
              <Search className="absolute left-3 size-4 text-muted-foreground" />
              <Input
                placeholder="Ketik nama halaman, kelompok, anggota, atau kating... (Esc untuk menutup)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-10 border-0 focus-visible:ring-0 text-xs font-medium bg-transparent"
                autoFocus
              />
            </div>
          </DialogHeader>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                <Clock className="mx-auto size-6 text-muted-foreground/40" />
                <p className="font-semibold text-foreground">Hasil tidak ditemukan</p>
                <p className="text-[11px]">Coba ketik pencarian lain seperti &quot;Booking&quot;, &quot;Kelompok&quot;, &quot;LPJ&quot;.</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.href)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-primary/10 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-foreground">{item.title}</div>
                        <div className="text-[11px] text-muted-foreground">{item.subtitle}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      {item.category}
                    </Badge>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Navigasi Cepat TMS (Ctrl + K)</span>
            <span>Tekan <kbd className="px-1 border rounded bg-background">Esc</kbd> untuk Batal</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

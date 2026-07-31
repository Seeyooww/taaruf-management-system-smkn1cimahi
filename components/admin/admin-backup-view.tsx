"use client";

import * as React from "react";
import {
  Download,
  FileJson,
  Lock,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
  exportDatabaseAction,
  resetDummyDataAction,
  restoreDatabaseAction,
  runSimulationDayOneAction,
  seedDummyDataAction,
  toggleLockEventAction,
} from "@/services/backup.actions";

export function AdminBackupView() {
  const [jsonText, setJsonText] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  const [isLocked, setIsLocked] = React.useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = React.useState(false);

  const handleExportJSON = () => {
    startTransition(async () => {
      const data = await exportDatabaseAction();
      const str = JSON.stringify(data, null, 2);

      const blob = new Blob([str], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tms_backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();

      toast.success("✔ File backup JSON berhasil diunduh!");
    });
  };

  const handleRestoreJSON = () => {
    if (!jsonText.trim()) {
      toast.error("Silakan tempel isi file JSON backup terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      try {
        const parsed = JSON.parse(jsonText);
        const res = await restoreDatabaseAction(parsed);
        if (res.success) {
          toast.success("✔ " + res.message);
          setJsonText("");
        } else {
          toast.error("❌ " + res.message);
        }
      } catch {
        toast.error("❌ Format JSON tidak valid. Periksa sintaks JSON Anda.");
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
      toast.info("File JSON berhasil dimuat ke pratinjau.");
    };
    reader.readAsText(file);
  };

  const handleSeedDummy = () => {
    startTransition(async () => {
      const res = await seedDummyDataAction();
      if (res.success) {
        toast.success("✔ " + res.message);
      }
    });
  };

  const handleRunSimulation = () => {
    startTransition(async () => {
      const res = await runSimulationDayOneAction();
      if (res.success) {
        toast.success("✔ " + res.message);
      }
    });
  };

  const handleConfirmReset = () => {
    startTransition(async () => {
      const res = await resetDummyDataAction();
      if (res.success) {
        toast.success("✔ " + res.message);
        setIsResetConfirmOpen(false);
      }
    });
  };

  const handleToggleLock = () => {
    const targetState = !isLocked;
    startTransition(async () => {
      const res = await toggleLockEventAction(targetState);
      setIsLocked(res.locked);
      if (res.locked) {
        toast.error("🔴 Acara Dikunci! Seluruh pengajuan booking baru dan editan data dimatikan.");
      } else {
        toast.success("🟢 Kunci Acara Dibuka! Sistem kembali menerima booking.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Simulasi, Data Seeder & Backup</h1>
          <p className="text-xs text-muted-foreground">
            Fitur pengujian otomatis, kunci acara, serta pencadangan & pemulihan database ke format JSON.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isLocked ? "destructive" : "outline"}
            onClick={handleToggleLock}
            disabled={isPending}
            className="text-xs font-semibold"
          >
            {isLocked ? (
              <>
                <Lock className="size-3.5 mr-1.5" /> Acara Dikunci
              </>
            ) : (
              <>
                <Unlock className="size-3.5 mr-1.5 text-emerald-500" /> Kunci Acara
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Row 1: Event Simulation & Data Seeder Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SIMULATION CARD */}
        <Card className="glass-card border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <PlayCircle className="size-5" /> Simulasi Event Sebenarnya
              </CardTitle>
              <Badge variant="default" className="text-[10px] bg-primary">
                Auto Test
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Jalankan skenario simulasi hari pertama otomatis untuk menguji booking, presensi, progress, dan laporan tanpa input manual.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-xl border bg-card text-xs space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-500" /> Skenario Hari Pertama
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Sistem membuat 15 booking acak (Selesai, Disetujui, Menunggu, Ditolak, Dibatalkan) beserta pencatatan presensi anggota dan progress.
              </p>
            </div>

            <Button
              onClick={handleRunSimulation}
              disabled={isPending || isLocked}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs"
            >
              <PlayCircle className="mr-2 size-4" />
              {isPending ? "Jalankan Simulasi..." : "Jalankan Simulasi Hari Pertama"}
            </Button>
          </CardContent>
        </Card>

        {/* DATA SEEDER CARD */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-5 text-emerald-500" /> Data Seeder & Clean Reset
            </CardTitle>
            <CardDescription className="text-xs">
              Generate data dummy massal (30 Kelompok, 110 Anggota, 108 Kating) atau kosongkan data pengujian.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedDummy}
                disabled={isPending || isLocked}
                className="text-xs font-semibold border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
              >
                <Sparkles className="mr-1.5 size-3.5 text-emerald-500" /> Generate 30 Kelompok
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResetConfirmOpen(true)}
                disabled={isPending || isLocked}
                className="text-xs font-semibold text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
              >
                <Trash2 className="mr-1.5 size-3.5" /> Hapus Semua Dummy
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Membantu pengujian massal dan pembersihan data uji coba sebelum sistem digunakan resmi.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: JSON Export & JSON Restore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EXPORT CARD */}
        <Card className="glass-card flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="size-5 text-emerald-500" /> Export Database (JSON)
            </CardTitle>
            <CardDescription className="text-xs">
              Unduh salinan cadangan lengkap seluruh tabel Master Data, Settings, Slot, WA Template, Pengumuman, dan Booking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border p-4 bg-muted/20 text-xs space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" /> Format Terstruktur & Aman
              </p>
              <p className="text-muted-foreground leading-relaxed">
                File hasil export berisi metadata versi dan struktur tabel lengkap yang kompatibel untuk dipulihkan kembali sewaktu-waktu.
              </p>
            </div>

            <Button
              onClick={handleExportJSON}
              disabled={isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              <FileJson className="mr-2 size-4" />
              {isPending ? "Mengeksport..." : "Unduh File Backup JSON"}
            </Button>
          </CardContent>
        </Card>

        {/* RESTORE CARD */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="size-5 text-primary" /> Restore Database (JSON)
            </CardTitle>
            <CardDescription className="text-xs">
              Unggah atau tempel kode JSON backup untuk memulihkan seluruh data sistem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Pilih File Backup JSON:
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Pratinjau Kode JSON:
              </label>
              <Textarea
                placeholder="Kode JSON backup akan muncul di sini..."
                rows={4}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <Button
              onClick={handleRestoreJSON}
              disabled={isPending || !jsonText.trim()}
              className="w-full font-semibold text-xs"
            >
              <RefreshCw className="mr-2 size-4" />
              {isPending ? "Memproses Restore..." : "Pulihkan Database Dari JSON"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Reset Confirm Dialog */}
      <ConfirmDeleteDialog
        open={isResetConfirmOpen}
        onOpenChange={setIsResetConfirmOpen}
        title="Hapus Semua Dummy Data?"
        itemName="Seluruh data dummy kelompok, anggota, kating, booking, dan progress"
        description="Aksi ini akan mereset database kembali ke kondisi awal."
        onConfirm={handleConfirmDeleteReset}
        isPending={isPending}
      />
    </div>
  );

  function handleConfirmDeleteReset() {
    handleConfirmReset();
  }
}

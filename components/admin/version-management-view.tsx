"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  GitCommit,
  Layers,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCategoryBadge } from "@/components/version/changelog-modal";
import {
  addChangelogAction,
  createVersionAction,
  deleteChangelogAction,
  setCurrentVersionAction,
} from "@/services/version.actions";
import type { ChangelogCategory, SystemVersion } from "@/types/database";

interface VersionManagementViewProps {
  initialVersions: SystemVersion[];
}

export function VersionManagementView({ initialVersions }: VersionManagementViewProps) {
  const [versions] = React.useState<SystemVersion[]>(initialVersions);
  const [isPending, startTransition] = React.useTransition();

  // Create Version Dialog state
  const [isAddVerOpen, setIsAddVerOpen] = React.useState(false);
  const [verInput, setVerInput] = React.useState("");
  const [buildInput, setBuildInput] = React.useState("");
  const [dateInput, setDateInput] = React.useState("");
  const [statusInput, setStatusInput] = React.useState<"Stable" | "Beta" | "RC">("Stable");
  const [isCurrentInput, setIsCurrentInput] = React.useState(false);

  // Add Changelog Dialog state
  const [isAddClOpen, setIsAddClOpen] = React.useState(false);
  const [selectedVerForCl, setSelectedVerForCl] = React.useState<SystemVersion | null>(null);
  const [clCategory, setClCategory] = React.useState<ChangelogCategory>("FEATURE");
  const [clTitle, setClTitle] = React.useState("");
  const [clDesc, setClDesc] = React.useState("");
  const [clImportant, setClImportant] = React.useState(false);

  // Expanded cards
  const [expandedVerId, setExpandedVerId] = React.useState<string | null>(
    initialVersions.find((v) => v.current)?.id || initialVersions[0]?.id || null
  );

  const currentVer = versions.find((v) => v.current) || versions[0];

  // Refresh helper
  const reloadData = () => {
    window.location.reload();
  };

  // Create Version Handler
  const handleCreateVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verInput.trim() || !dateInput.trim()) {
      toast.error("Versi dan tanggal rilis harus diisi.");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("version", verInput);
      fd.append("build", buildInput || new Date().toISOString().split("T")[0].replace(/-/g, ""));
      fd.append("release_date", dateInput);
      fd.append("status", statusInput);
      if (isCurrentInput) fd.append("current", "true");

      const res = await createVersionAction(fd);
      if (res.success && res.data) {
        toast.success("✔ Versi baru berhasil dibuat!");
        setIsAddVerOpen(false);
        setVerInput("");
        setBuildInput("");
        setDateInput("");
        reloadData();
      } else {
        toast.error(`❌ ${res.message}`);
      }
    });
  };

  // Set Current Version Handler
  const handleSetCurrent = (verId: string) => {
    startTransition(async () => {
      const res = await setCurrentVersionAction(verId);
      if (res.success) {
        toast.success("✔ Versi aktif berhasil diperbarui!");
        reloadData();
      } else {
        toast.error(`❌ ${res.message}`);
      }
    });
  };

  // Add Changelog Handler
  const handleAddChangelog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVerForCl || !clTitle.trim()) {
      toast.error("Judul changelog harus diisi.");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("version_id", selectedVerForCl.id);
      fd.append("version", selectedVerForCl.version);
      fd.append("category", clCategory);
      fd.append("title", clTitle);
      fd.append("description", clDesc);
      if (clImportant) fd.append("important", "true");

      const res = await addChangelogAction(fd);
      if (res.success) {
        toast.success("✔ Changelog berhasil ditambahkan!");
        setIsAddClOpen(false);
        setClTitle("");
        setClDesc("");
        setClImportant(false);
        reloadData();
      } else {
        toast.error(`❌ ${res.message}`);
      }
    });
  };

  // Delete Changelog Handler
  const handleDeleteChangelog = (clId: string) => {
    if (!confirm("Hapus item changelog ini?")) return;
    startTransition(async () => {
      const res = await deleteChangelogAction(clId);
      if (res.success) {
        toast.success("✔ Changelog berhasil dihapus!");
        reloadData();
      } else {
        toast.error(`❌ ${res.message}`);
      }
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border bg-card/80 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Layers className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Manajemen Versi &amp; Changelog
              </h1>
              <Badge variant="success" className="text-[10px] font-mono">
                Dinamis
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kelola versi rilis sistem, tandai versi aktif (current), dan catat fitur/bugfix baru tanpa ubah kode.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsAddVerOpen(true)}
          className="text-xs font-semibold bg-primary gap-1.5 shadow-xs w-full sm:w-auto justify-center"
        >
          <Plus className="size-4" /> Versi Baru
        </Button>
      </div>

      {/* ── CURRENT ACTIVE VERSION CARD ─────────────────────────────────────── */}
      {currentVer && (
        <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-primary/20 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="primary" className="text-[10px] font-bold uppercase tracking-wider">
                  🟢 Versi Aktif Saat Ini (Current Version)
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                  Build {currentVer.build}
                </Badge>
              </div>
              <h2 className="text-2xl font-extrabold font-mono text-foreground mt-1">
                {currentVer.version}
              </h2>
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Tanggal Rilis: <strong className="text-foreground">{currentVer.release_date}</strong>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Total <strong>{currentVer.changelogs?.length || 0} item changelog</strong> terdaftar.
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedVerForCl(currentVer);
                setIsAddClOpen(true);
              }}
              className="text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
            >
              <Plus className="size-3.5" /> Tambah Changelog Ke {currentVer.version}
            </Button>
          </div>
        </Card>
      )}

      {/* ── ALL VERSIONS LIST ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <GitCommit className="size-4 text-primary" /> Daftar Seluruh Versi Sistem
        </h3>

        <div className="space-y-3">
          {versions.map((ver) => {
            const isExpanded = expandedVerId === ver.id;
            return (
              <Card key={ver.id} className="glass-card shadow-2xs border transition-all overflow-hidden">
                {/* Card Header / Summary Row */}
                <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-muted flex items-center justify-center font-mono font-bold text-sm shrink-0 border">
                      {ver.version.replace("v", "")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold font-mono text-base text-foreground">
                          {ver.version}
                        </span>
                        {ver.current && (
                          <Badge variant="success" className="text-[10px] font-bold">
                            🟢 Current Active
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px]">
                          Build: {ver.build}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {ver.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Rilis: {ver.release_date} • {ver.changelogs?.length || 0} Perubahan
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {!ver.current && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetCurrent(ver.id)}
                        disabled={isPending}
                        className="text-xs font-semibold gap-1 h-8"
                      >
                        <Star className="size-3.5 text-amber-500" /> Jadikan Versi Aktif
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedVerForCl(ver);
                        setIsAddClOpen(true);
                      }}
                      className="text-xs font-semibold gap-1 h-8"
                    >
                      <Plus className="size-3.5 text-primary" /> Changelog
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedVerId(isExpanded ? null : ver.id)}
                      className="text-xs h-8 px-2"
                    >
                      {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded Details Row */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-border/40 bg-muted/20 space-y-3 animate-in fade-in duration-200">
                    <div className="text-xs font-bold text-foreground pt-2 flex items-center justify-between">
                      <span>Daftar Changelog ({ver.version}):</span>
                    </div>

                    {(!ver.changelogs || ver.changelogs.length === 0) ? (
                      <p className="text-xs text-muted-foreground py-2 italic">Belum ada item changelog untuk versi ini.</p>
                    ) : (
                      <div className="space-y-2">
                        {ver.changelogs.map((item) => {
                          const badgeInfo = getCategoryBadge(item.category);
                          const Icon = badgeInfo.icon;
                          return (
                            <div
                              key={item.id}
                              className="p-3 rounded-xl border bg-card/60 flex items-start justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className={`text-[10px] border ${badgeInfo.className} flex items-center gap-1`}>
                                    <Icon className="size-3" /> {badgeInfo.label}
                                  </Badge>
                                  <span className="font-semibold text-foreground">{item.title}</span>
                                  {item.important && (
                                    <Badge variant="destructive" className="text-[9px] h-4 px-1">
                                      Penting
                                    </Badge>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteChangelog(item.id)}
                                disabled={isPending}
                                className="size-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 shrink-0"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── DIALOG 1: CREATE NEW VERSION ───────────────────────────────────── */}
      <Dialog open={isAddVerOpen} onOpenChange={setIsAddVerOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-md p-5 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <Plus className="size-4" /> Tambah Versi Rilis Baru
            </DialogTitle>
            <DialogDescription className="text-xs">
              Buat entri versi baru untuk aplikasi Taaruf Management System.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateVersion} className="space-y-3 py-1 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nomor Versi (misal: v1.4.3)</Label>
              <Input
                placeholder="v1.4.3"
                value={verInput}
                onChange={(e) => setVerInput(e.target.value)}
                className="text-xs font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Build Number</Label>
                <Input
                  placeholder="20260810"
                  value={buildInput}
                  onChange={(e) => setBuildInput(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Status Rilis</Label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as "Stable" | "Beta" | "RC")}
                  className="w-full h-9 rounded-md border bg-background px-3 py-1 text-xs"
                >
                  <option value="Stable">Stable</option>
                  <option value="Beta">Beta</option>
                  <option value="RC">RC</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tanggal Rilis (misal: 10 Agustus 2026)</Label>
              <Input
                placeholder="10 Agustus 2026"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is-current"
                checked={isCurrentInput}
                onChange={(e) => setIsCurrentInput(e.target.checked)}
                className="size-4 rounded border-border"
              />
              <Label htmlFor="is-current" className="text-xs cursor-pointer font-medium">
                Jadikan sebagai Versi Aktif Saat Ini (Current Active)
              </Label>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddVerOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="bg-primary">
                Simpan Versi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 2: ADD CHANGELOG ITEM ────────────────────────────────────── */}
      <Dialog open={isAddClOpen} onOpenChange={setIsAddClOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-md p-5 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <Plus className="size-4" /> Tambah Changelog Ke {selectedVerForCl?.version}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Catat item fitur, perbaikan bug, atau improvement baru untuk versi ini.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddChangelog} className="space-y-3 py-1 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Kategori</Label>
              <select
                value={clCategory}
                onChange={(e) => setClCategory(e.target.value as ChangelogCategory)}
                className="w-full h-9 rounded-md border bg-background px-3 py-1 text-xs"
              >
                <option value="FEATURE">🚀 Feature (Fitur Baru)</option>
                <option value="IMPROVEMENT">✨ Improvement (Peningkatan)</option>
                <option value="BUGFIX">🐞 Bug Fix (Perbaikan Bug)</option>
                <option value="SECURITY">🔒 Security (Keamanan)</option>
                <option value="BREAKING">⚠️ Breaking Change (Perubahan Besar)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Judul Perubahan / Fitur</Label>
              <Input
                placeholder="Contoh: Fixed Leaderboard Pagination (>1000 Rows)"
                value={clTitle}
                onChange={(e) => setClTitle(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Deskripsi Tambahan (Opsional)</Label>
              <Textarea
                placeholder="Penjelasan detail mengenai perubahan ini..."
                value={clDesc}
                onChange={(e) => setClDesc(e.target.value)}
                className="text-xs min-h-[70px]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is-important"
                checked={clImportant}
                onChange={(e) => setClImportant(e.target.checked)}
                className="size-4 rounded border-border"
              />
              <Label htmlFor="is-important" className="text-xs cursor-pointer font-medium">
                Tandai Sebagai &quot;Penting / Highlight&quot;
              </Label>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddClOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="bg-primary">
                Simpan Changelog
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

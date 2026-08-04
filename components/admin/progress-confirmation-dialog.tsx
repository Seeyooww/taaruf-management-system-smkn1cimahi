"use client";

import * as React from "react";
import { Activity, Loader2, Plus, Search, UserCheck, UserMinus, Users, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { getBookingParticipantsAction } from "@/services/booking.actions";
import { calculateBookingProgressAction } from "@/services/progress.actions";
import type { Anggota, BookingWithDetails, SubstituteEntry } from "@/types/database";

// ─── Local types ─────────────────────────────────────────────────────────────

/** Anggota asli kelompok (is_substitute = false) yang tampil di checklist */
interface OriginalMember {
  anggota_id: string;
  nama: string;
  jenis_kelamin: string;
}

/** Peserta pengganti yang sudah ada di booking_participants */
interface SubstituteItem {
  /** anggota_id pengganti */
  substituteId: string;
  nama: string;
  kelompok_nama: string;
  /** ID anggota asli yang digantikan (bisa null untuk substitute tambahan) */
  replacesId: string | null;
  replaces_nama: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ProgressConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithDetails | null;
  /** Semua anggota sistem — dipakai untuk candidate search substitute */
  allAnggotaList: Anggota[];
  onProgressCalculated: () => void;
}

export function ProgressConfirmationDialog({
  open,
  onOpenChange,
  booking,
  allAnggotaList,
  onProgressCalculated,
}: ProgressConfirmationDialogProps) {
  // ── State ─────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = React.useState(false);

  /** Anggota asli (is_substitute=false) yang dimuat dari booking_participants */
  const [originalMembers, setOriginalMembers] = React.useState<OriginalMember[]>([]);

  /** ID anggota asli yang HADIR */
  const [presentIds, setPresentIds] = React.useState<Set<string>>(new Set());

  /** Daftar peserta pengganti (pre-loaded + bisa ditambah admin) */
  const [substitutes, setSubstitutes] = React.useState<SubstituteItem[]>([]);

  /** Kontrol search panel: null = tidak ada, string = sedang menambah pengganti baru */
  const [isAddingSubstitute, setIsAddingSubstitute] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const [isPending, startTransition] = React.useTransition();

  // ── Fetch booking_participants saat dialog dibuka ─────────────────────────
  React.useEffect(() => {
    if (!open || !booking) return;

    setIsLoading(true);
    setIsAddingSubstitute(false);
    setSearchQuery("");

    getBookingParticipantsAction(booking.id)
      .then((rows) => {
        const originals: OriginalMember[] = [];
        const subs: SubstituteItem[] = [];
        const pres = new Set<string>();

        if (rows && rows.length > 0) {
          // ── Rows berasal dari booking_participants ─────────────────────
          for (const r of rows) {
            if (!r.is_substitute) {
              // Anggota asli kelompok
              const anggotaObj = r.anggota as { nama?: string; jenis_kelamin?: string } | undefined;
              originals.push({
                anggota_id: r.anggota_id,
                nama: anggotaObj?.nama ?? r.anggota_nama ?? "Anggota",
                jenis_kelamin: anggotaObj?.jenis_kelamin ?? "L",
              });
              if (r.hadir !== false) {
                pres.add(r.anggota_id);
              }
            } else {
              // Peserta pengganti
              const subAnggotaObj = r.anggota as { nama?: string; jenis_kelamin?: string; kelompok_id?: string; kelompok_nama?: string } | null;
              subs.push({
                substituteId: r.anggota_id,
                nama: subAnggotaObj?.nama ?? r.anggota_nama ?? "Pengganti",
                kelompok_nama: subAnggotaObj?.kelompok_nama ?? "Kelompok Lain",
                replacesId: r.replaces_anggota_id ?? null,
                replaces_nama: r.replaces_nama ?? "",
              });
            }
          }
        } else {
          // ── Backward-compat: booking lama belum punya booking_participants ─
          // Fallback ke anggota kelompok
          const kelompokAnggota = allAnggotaList.filter(
            (a) => a.kelompok_id === booking.kelompok_id
          );
          for (const a of kelompokAnggota) {
            originals.push({
              anggota_id: a.id,
              nama: a.nama,
              jenis_kelamin: a.jenis_kelamin,
            });
            pres.add(a.id);
          }
        }

        setOriginalMembers(originals);
        setPresentIds(pres);
        setSubstitutes(subs);
      })
      .catch((err) => {
        console.error("[ProgressConfirmationDialog] fetch participants error:", err);
        // Fallback ke anggota kelompok
        const kelompokAnggota = allAnggotaList.filter(
          (a) => a.kelompok_id === booking.kelompok_id
        );
        const originals: OriginalMember[] = kelompokAnggota.map((a) => ({
          anggota_id: a.id,
          nama: a.nama,
          jenis_kelamin: a.jenis_kelamin,
        }));
        const pres = new Set(kelompokAnggota.map((a) => a.id));
        setOriginalMembers(originals);
        setPresentIds(pres);
        setSubstitutes([]);
      })
      .finally(() => setIsLoading(false));
  }, [open, booking, allAnggotaList]);

  if (!booking) return null;

  // ── Toggle hadir / tidak hadir ────────────────────────────────────────────
  const togglePresent = (id: string) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ── Substitute management ─────────────────────────────────────────────────
  const removeSubstitute = (substituteId: string) => {
    setSubstitutes((prev) => prev.filter((s) => s.substituteId !== substituteId));
  };

  const chosenSubstituteIds = new Set(substitutes.map((s) => s.substituteId));

  const substituteCandidates = allAnggotaList.filter((a) => {
    if (a.kelompok_id === booking.kelompok_id) return false;
    if (chosenSubstituteIds.has(a.id)) return false;
    if (!searchQuery.trim()) return false; // hanya tampil setelah user mengetik
    return (
      a.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.kelompok_nama ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const addSubstitute = (candidate: Anggota) => {
    setSubstitutes((prev) => [
      ...prev,
      {
        substituteId: candidate.id,
        nama: candidate.nama,
        kelompok_nama: candidate.kelompok_nama ?? "Kelompok Lain",
        replacesId: null,
        replaces_nama: "",
      },
    ]);
    setIsAddingSubstitute(false);
    setSearchQuery("");
  };

  // ── Build payload ─────────────────────────────────────────────────────────
  const handleConfirm = () => {
    const presentOriginalIds = Array.from(presentIds);
    const absentOriginalIds = originalMembers
      .map((m) => m.anggota_id)
      .filter((id) => !presentIds.has(id));

    const substituteEntries: SubstituteEntry[] = substitutes.map((s) => ({
      substituteId: s.substituteId,
      // Peserta tambahan (bukan pengganti) tidak memiliki replacesId → kirim null, BUKAN string kosong
      replacesId: s.replacesId || null,
    }));

    startTransition(async () => {
      const res = await calculateBookingProgressAction(
        booking.id,
        presentOriginalIds,
        absentOriginalIds,
        substituteEntries
      );
      if (res.success) {
        toast.success("✔ " + res.message);
        onOpenChange(false);
        onProgressCalculated();
      } else {
        toast.error("❌ " + res.message);
      }
    });
  };

  // ── Derived counts ────────────────────────────────────────────────────────
  const absentCount = originalMembers.filter((m) => !presentIds.has(m.anggota_id)).length;
  const totalHadir = presentIds.size + substitutes.length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setIsAddingSubstitute(false);
          setSearchQuery("");
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Activity className="size-5" /> Konfirmasi Presensi &amp; Hitung Progress
          </DialogTitle>
          <DialogDescription className="text-xs">
            Centang anggota yang hadir. Data peserta dimuat otomatis dari booking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Booking Context Banner */}
          <div className="rounded-xl border bg-muted/30 p-3 text-xs space-y-1">
            <div className="flex justify-between font-bold text-foreground">
              <span>{booking.kelompok_nama}</span>
              <span className="text-primary">{booking.tanggal}</span>
            </div>
            <div className="text-muted-foreground flex justify-between">
              <span>Slot: {booking.slot_nama}</span>
              <span>
                Kating: {(booking.kating_list ?? []).map((k) => k.nama).join(" & ") || "-"}
              </span>
            </div>
          </div>

          {/* Summary Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="success" className="text-[10px]">
              <Users className="size-3 mr-1" /> Hadir: {totalHadir}
            </Badge>
            {absentCount > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                <UserMinus className="size-3 mr-1" /> Tidak Hadir: {absentCount}
              </Badge>
            )}
            {substitutes.length > 0 && (
              <Badge variant="outline" className="text-[10px] border-indigo-500 text-indigo-400">
                <UserCheck className="size-3 mr-1" /> Pengganti: {substitutes.length}
              </Badge>
            )}
          </div>

          {/* ── Loading State ─────────────────────────────────────────────── */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin" />
              Memuat data peserta...
            </div>
          ) : (
            <div className="space-y-4">
              {/* ── Anggota Asli Checklist ──────────────────────────────────── */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Users className="size-4 text-primary" /> Anggota Kelompok ({originalMembers.length})
                </Label>

                <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1 scrollbar-thin">
                  {originalMembers.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      Belum ada anggota tercatat di booking ini.
                    </p>
                  )}
                  {originalMembers.map((member) => {
                    const isPresent = presentIds.has(member.anggota_id);

                    return (
                      <div
                        key={member.anggota_id}
                        onClick={() => togglePresent(member.anggota_id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isPresent ? "bg-emerald-500/10 border-emerald-500/30" : "bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`check-${member.anggota_id}`}
                            checked={isPresent}
                            onCheckedChange={() => togglePresent(member.anggota_id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-xs font-semibold">
                            {member.nama}
                            <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                              ({member.jenis_kelamin === "L" ? "L" : "P"})
                            </span>
                          </span>
                        </div>
                        {isPresent ? (
                          <Badge variant="success" className="text-[10px]">Hadir</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">Tidak Hadir</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Peserta Pengganti ────────────────────────────────────────── */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <UserCheck className="size-4 text-indigo-400" /> Peserta Pengganti ({substitutes.length})
                </Label>

                <div className="space-y-2">
                  {substitutes.map((sub) => (
                    <div
                      key={sub.substituteId}
                      className="flex items-center justify-between px-3 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/5"
                    >
                      <div className="text-xs space-y-0.5">
                        <div className="font-semibold text-indigo-300">{sub.nama}</div>
                        <div className="text-muted-foreground">
                          {sub.kelompok_nama}
                          {sub.replaces_nama && (
                            <span className="ml-2 text-indigo-400/70">
                              · Menggantikan: {sub.replaces_nama}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-rose-500 hover:bg-rose-500/10 shrink-0"
                        onClick={() => removeSubstitute(sub.substituteId)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ))}

                  {/* Panel tambah pengganti baru */}
                  {isAddingSubstitute ? (
                    <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                          <Input
                            autoFocus
                            placeholder="Cari pengganti dari kelompok lain..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-7 h-7 text-xs"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0"
                          onClick={() => { setIsAddingSubstitute(false); setSearchQuery(""); }}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>

                      <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border bg-muted/20 p-1">
                        {!searchQuery.trim() ? (
                          <p className="text-[11px] text-muted-foreground text-center py-2">
                            Ketik nama untuk mencari...
                          </p>
                        ) : substituteCandidates.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground text-center py-2">
                            Tidak ditemukan.
                          </p>
                        ) : (
                          substituteCandidates.slice(0, 8).map((cand) => (
                            <div
                              key={cand.id}
                              onClick={() => addSubstitute(cand)}
                              className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                            >
                              <span className="text-xs font-medium">{cand.nama}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {cand.kelompok_nama ?? "—"}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-indigo-400 border-indigo-500/40 hover:bg-indigo-500/10 w-full"
                      onClick={() => setIsAddingSubstitute(true)}
                    >
                      <Plus className="size-3.5 mr-1.5" />
                      + Tambah Pengganti
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            {isPending ? "Menyimpan..." : "Hitung & Simpan Progress"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

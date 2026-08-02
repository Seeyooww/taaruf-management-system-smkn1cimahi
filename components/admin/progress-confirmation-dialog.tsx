"use client";

import * as React from "react";
import { Activity, Search, UserCheck, UserMinus, Users, X } from "lucide-react";
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
import { calculateBookingProgressAction } from "@/services/progress.actions";
import type { Anggota, BookingWithDetails, SubstituteEntry } from "@/types/database";

interface ProgressConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithDetails | null;
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
  // Set ID anggota asli yang HADIR (default: semua anggota kelompok)
  const [presentIds, setPresentIds] = React.useState<Set<string>>(new Set());
  // Map: absentId → Anggota pengganti (null = belum dipilih pengganti)
  const [substituteMap, setSubstituteMap] = React.useState<Map<string, Anggota | null>>(new Map());
  // ID anggota yang sedang dicarikan pengganti
  const [searchingForId, setSearchingForId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  // Anggota asli kelompok booking
  const kelompokMembers = React.useMemo(() => {
    if (!booking) return [];
    return allAnggotaList.filter((a) => a.kelompok_id === booking.kelompok_id);
  }, [booking, allAnggotaList]);

  // Reset state saat booking berubah
  React.useEffect(() => {
    if (booking) {
      const defaultIds = new Set(
        allAnggotaList
          .filter((a) => a.kelompok_id === booking.kelompok_id)
          .map((a) => a.id)
      );
      setPresentIds(defaultIds);
      setSubstituteMap(new Map());
      setSearchingForId(null);
      setSearchQuery("");
    }
  }, [booking, allAnggotaList]);

  if (!booking) return null;

  // Toggle hadir/tidak-hadir untuk anggota asli
  const togglePresent = (id: string) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        // Jadi tidak hadir: tambahkan ke substituteMap sebagai belum ada pengganti
        next.delete(id);
        setSubstituteMap((sm) => {
          const nsm = new Map(sm);
          nsm.set(id, null);
          return nsm;
        });
      } else {
        // Jadi hadir lagi: hapus dari substituteMap
        next.add(id);
        setSubstituteMap((sm) => {
          const nsm = new Map(sm);
          nsm.delete(id);
          return nsm;
        });
        if (searchingForId === id) setSearchingForId(null);
      }
      return next;
    });
  };

  // Pilih pengganti untuk anggota yang absen
  const selectSubstitute = (absentId: string, candidate: Anggota) => {
    setSubstituteMap((prev) => {
      const next = new Map(prev);
      next.set(absentId, candidate);
      return next;
    });
    setSearchingForId(null);
    setSearchQuery("");
  };

  // Hapus pengganti yang sudah dipilih
  const removeSubstitute = (absentId: string) => {
    setSubstituteMap((prev) => {
      const next = new Map(prev);
      next.set(absentId, null);
      return next;
    });
  };

  // Kandidat pengganti: bukan anggota kelompok ini, belum dipilih sebagai pengganti lain
  const alreadyChosenSubstituteIds = new Set(
    [...substituteMap.values()].filter(Boolean).map((a) => a!.id)
  );

  const substituteCandidates = allAnggotaList.filter((a) => {
    if (a.kelompok_id === booking.kelompok_id) return false;
    if (alreadyChosenSubstituteIds.has(a.id)) return false;
    if (!searchQuery.trim()) return true;
    return (
      a.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.kelompok_nama ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleConfirm = () => {
    const presentOriginalIds = Array.from(presentIds);
    const absentOriginalIds = [...substituteMap.keys()];
    const substitutes: SubstituteEntry[] = [];

    for (const [absentId, sub] of substituteMap.entries()) {
      if (sub) {
        substitutes.push({ substituteId: sub.id, replacesId: absentId });
      }
    }

    startTransition(async () => {
      const res = await calculateBookingProgressAction(
        booking.id,
        presentOriginalIds,
        absentOriginalIds,
        substitutes
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

  const absentCount = substituteMap.size;
  const substituteCount = [...substituteMap.values()].filter(Boolean).length;
  const totalHadir = presentIds.size + substituteCount;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          // Reset ephemeral UI state when dialog is dismissed without submitting
          setSearchingForId(null);
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
            Centang anggota yang hadir. Jika ada yang tidak hadir, pilih penggantinya dari kelompok lain.
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
            {substituteCount > 0 && (
              <Badge variant="outline" className="text-[10px] border-indigo-500 text-indigo-400">
                <UserCheck className="size-3 mr-1" /> Pengganti: {substituteCount}
              </Badge>
            )}
          </div>

          {/* Anggota Kelompok Checklist */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Users className="size-4 text-primary" /> Anggota Kelompok ({kelompokMembers.length})
            </Label>

            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1 scrollbar-thin">
              {kelompokMembers.map((member) => {
                const isPresent = presentIds.has(member.id);
                const isAbsent = substituteMap.has(member.id);
                const chosenSub = substituteMap.get(member.id) ?? null;
                const isSearchingThis = searchingForId === member.id;

                return (
                  <div key={member.id} className="rounded-xl border overflow-hidden">
                    {/* Row utama anggota */}
                    <div
                      onClick={() => togglePresent(member.id)}
                      className={`flex items-center justify-between p-2.5 cursor-pointer transition-all ${
                        isPresent
                          ? "bg-emerald-500/10"
                          : "bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`check-${member.id}`}
                          checked={isPresent}
                          onCheckedChange={() => togglePresent(member.id)}
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

                    {/* Panel substitusi — hanya muncul jika tidak hadir */}
                    {isAbsent && (
                      <div className="border-t bg-card px-3 py-2 space-y-2">
                        {chosenSub ? (
                          /* Pengganti sudah dipilih */
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs">
                              <UserCheck className="size-3.5 text-indigo-400 shrink-0" />
                              <span className="text-muted-foreground">Digantikan oleh:</span>
                              <span className="font-semibold text-indigo-400">
                                {chosenSub.nama}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                ({chosenSub.kelompok_nama ?? "Kelompok Lain"})
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-6 text-rose-500 hover:bg-rose-500/10"
                              onClick={() => removeSubstitute(member.id)}
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        ) : isSearchingThis ? (
                          /* Mode pencarian pengganti */
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                                <Input
                                  autoFocus
                                  placeholder={`Cari pengganti untuk ${member.nama}...`}
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="pl-7 h-7 text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 shrink-0"
                                onClick={() => { setSearchingForId(null); setSearchQuery(""); }}
                              >
                                <X className="size-3.5" />
                              </Button>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border bg-muted/20 p-1">
                              {substituteCandidates.length === 0 ? (
                                <p className="text-[11px] text-muted-foreground text-center py-2">
                                  {searchQuery ? "Tidak ditemukan." : "Ketik nama untuk mencari..."}
                                </p>
                              ) : (
                                substituteCandidates.slice(0, 8).map((cand) => (
                                  <div
                                    key={cand.id}
                                    onClick={(e) => { e.stopPropagation(); selectSubstitute(member.id, cand); }}
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
                          /* Tombol untuk mulai mencari pengganti */
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-indigo-400 border-indigo-500/40 hover:bg-indigo-500/10"
                            onClick={(e) => { e.stopPropagation(); setSearchingForId(member.id); setSearchQuery(""); }}
                          >
                            <UserCheck className="size-3.5 mr-1.5" />
                            Pilih Pengganti untuk {member.nama}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            {isPending ? "Menyimpan..." : "Hitung & Simpan Progress"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

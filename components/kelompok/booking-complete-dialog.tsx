"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckSquare,
  Plus,
  Search,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";
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
import { getAnggotaAction } from "@/services/anggota.actions";
import { getBookingParticipantsAction } from "@/services/booking.actions";
import {
  calculateBookingProgressAction,
  checkProgressEstimateAction,
} from "@/services/progress.actions";
import type {
  Anggota,
  BookingWithDetails,
  ParticipantEstimateItem,
  ProgressEstimateResult,
  SubstituteEntry,
} from "@/types/database";

export interface CompleteSubstituteItem {
  substituteId: string;
  nama: string;
  kelompokNama?: string;
  replacesId: string | null;
  replacesNama?: string;
}

interface BookingCompleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithDetails | null;
  anggotaList: Anggota[];
  onCompleted: (bookingId: string) => void;
}

export function BookingCompleteDialog({
  open,
  onOpenChange,
  booking,
  anggotaList,
  onCompleted,
}: BookingCompleteDialogProps) {
  // Set ID anggota asli yang HADIR
  const [presentIds, setPresentIds] = React.useState<Set<string>>(new Set());
  // Set ID anggota asli yang ABSEN
  const [absentIds, setAbsentIds] = React.useState<Set<string>>(new Set());
  // Substitutes array (flexible, non-group members)
  const [substitutes, setSubstitutes] = React.useState<CompleteSubstituteItem[]>([]);

  // Search candidate substitute
  const [isAddingSubstitute, setIsAddingSubstitute] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // External list of all anggota (for substitute candidates)
  const [allAnggotaList, setAllAnggotaList] = React.useState<Anggota[]>([]);
  const [isLoadingAnggota, setIsLoadingAnggota] = React.useState(false);

  // Realtime progress estimate
  const [estimateResult, setEstimateResult] = React.useState<ProgressEstimateResult | null>(null);
  const [isLoadingEstimate, setIsLoadingEstimate] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const aktifAnggota = React.useMemo(() => {
    return anggotaList.filter((a) => a.aktif);
  }, [anggotaList]);

  // Load participants & all anggota when dialog opens
  React.useEffect(() => {
    if (open && booking) {
      setError(null);
      setIsAddingSubstitute(false);
      setSearchQuery("");

      // Default: all active group members present
      const defaultIds = new Set(aktifAnggota.map((a) => a.id));
      setPresentIds(defaultIds);
      setAbsentIds(new Set());
      setSubstitutes([]);

      // Fetch booking_participants directly from DB (Single Source of Truth)
      getBookingParticipantsAction(booking.id).then((rows) => {
        if (rows && rows.length > 0) {
          const pres = new Set<string>();
          const abs = new Set<string>();
          const subs: CompleteSubstituteItem[] = [];
          const accountedOriginalIds = new Set<string>();

          for (const r of rows) {
            if (r.is_substitute) {
              const subAnggota = r.anggota as { nama?: string; kelompok_nama?: string } | undefined;
              subs.push({
                substituteId: r.anggota_id,
                nama: subAnggota?.nama ?? r.anggota_nama,
                kelompokNama: subAnggota?.kelompok_nama ?? "Kelompok Lain",
                replacesId: r.replaces_anggota_id || null,
                replacesNama: r.replaces_nama ?? undefined,
              });
            } else if (r.hadir) {
              pres.add(r.anggota_id);
              accountedOriginalIds.add(r.anggota_id);
            } else {
              abs.add(r.anggota_id);
              accountedOriginalIds.add(r.anggota_id);
            }
          }

          for (const a of aktifAnggota) {
            if (!accountedOriginalIds.has(a.id)) {
              pres.add(a.id);
            }
          }

          setPresentIds(pres);
          setAbsentIds(abs);
          setSubstitutes(subs);
        }
      }).catch(() => {});

      if (allAnggotaList.length === 0) {
        setIsLoadingAnggota(true);
        getAnggotaAction()
          .then((list) => setAllAnggotaList(list))
          .catch(() => console.error("Gagal memuat anggota pengganti"))
          .finally(() => setIsLoadingAnggota(false));
      }
    }
  }, [open, booking, aktifAnggota, allAnggotaList.length]);

  // Compute realtime progress estimate whenever presentIds or substitutes changes
  React.useEffect(() => {
    if (open && booking && (booking.kating_list ?? []).length > 0) {
      const presentOriginals = aktifAnggota.filter((a) => presentIds.has(a.id));
      const finalParticipants: ParticipantEstimateItem[] = [
        ...presentOriginals.map((a) => ({ anggotaId: a.id, nama: a.nama })),
        ...substitutes.map((s) => {
          const replacedObj = aktifAnggota.find((a) => a.id === s.replacesId);
          return {
            anggotaId: s.substituteId,
            nama: s.nama,
            isSubstitute: true,
            replacesNama: replacedObj?.nama ?? s.replacesNama ?? "Anggota",
          };
        }),
      ];

      const katingIds = (booking.kating_list ?? []).map((k) => k.id);

      if (finalParticipants.length > 0 && katingIds.length > 0) {
        setIsLoadingEstimate(true);
        checkProgressEstimateAction(finalParticipants, katingIds)
          .then((res) => setEstimateResult(res))
          .catch((err) => {
            console.error("[checkProgressEstimateAction error]", err);
            setEstimateResult(null);
          })
          .finally(() => setIsLoadingEstimate(false));
      } else {
        setEstimateResult(null);
      }
    }
  }, [open, booking, presentIds, substitutes, aktifAnggota]);

  if (!booking) return null;

  const togglePresent = (memberId: string) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
        setAbsentIds((abs) => new Set(abs).add(memberId));
      } else {
        next.add(memberId);
        setAbsentIds((abs) => {
          const n = new Set(abs);
          n.delete(memberId);
          return n;
        });
      }
      return next;
    });
  };

  const chosenSubstituteIds = new Set(substitutes.map((s) => s.substituteId));

  const substituteCandidates = allAnggotaList.filter((a) => {
    if (a.kelompok_id === booking.kelompok_id) return false;
    if (chosenSubstituteIds.has(a.id)) return false;
    if (presentIds.has(a.id)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.nama.toLowerCase().includes(q) ||
      (a.kelompok_nama ?? "").toLowerCase().includes(q)
    );
  });

  const addSubstitute = (candidate: Anggota) => {
    const firstAbsentId = Array.from(absentIds)[0] || null;
    const firstAbsentObj = aktifAnggota.find((a) => a.id === firstAbsentId);

    setSubstitutes((prev) => [
      ...prev,
      {
        substituteId: candidate.id,
        nama: candidate.nama,
        kelompokNama: candidate.kelompok_nama ?? "Kelompok Lain",
        replacesId: firstAbsentId,
        replacesNama: firstAbsentObj?.nama,
      },
    ]);
    setIsAddingSubstitute(false);
    setSearchQuery("");
  };

  const removeSubstitute = (substituteId: string) => {
    setSubstitutes((prev) => prev.filter((s) => s.substituteId !== substituteId));
  };

  const updateSubstituteReplaces = (substituteId: string, replacesId: string | null) => {
    setSubstitutes((prev) =>
      prev.map((s) => {
        if (s.substituteId === substituteId) {
          const replacedObj = aktifAnggota.find((a) => a.id === replacesId);
          return {
            ...s,
            replacesId,
            replacesNama: replacedObj?.nama,
          };
        }
        return s;
      })
    );
  };

  const handleSimpan = async () => {
    const presentOriginalIds = Array.from(presentIds);
    const absentOriginalIds = Array.from(absentIds);
    const substituteEntries: SubstituteEntry[] = substitutes.map((s) => ({
      substituteId: s.substituteId,
      replacesId: s.replacesId || "",
    }));

    if (presentOriginalIds.length + substituteEntries.length === 0) {
      setError("Pilih minimal 1 peserta yang hadir (asli atau pengganti).");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await calculateBookingProgressAction(
        booking.id,
        presentOriginalIds,
        absentOriginalIds,
        substituteEntries
      );

      if (result.success) {
        toast.success("✔ " + result.message);
        onCompleted(booking.id);
        onOpenChange(false);
      } else {
        setError(result.message || "Gagal menyimpan progress.");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const totalHadir = presentIds.size + substitutes.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary font-bold text-sm sm:text-base">
            <CheckSquare className="size-5 text-emerald-500" />
            Tandai Sesi Taaruf Selesai &amp; Hitung Progress
          </DialogTitle>
          <DialogDescription className="text-xs">
            Verifikasi presensi peserta final dari <code>booking_participants</code>.
          </DialogDescription>
        </DialogHeader>

        {/* Info Session */}
        <div className="rounded-lg bg-muted/40 border px-3 py-2 text-xs space-y-0.5">
          <div className="flex justify-between font-semibold">
            <span>{booking.tanggal} · {booking.slot_nama}</span>
            <span className="text-primary font-bold">Total Hadir: {totalHadir} Peserta</span>
          </div>
          <p className="text-muted-foreground text-[11px]">
            Kating: {(booking.kating_list ?? []).map((k) => k.nama).join(", ") || "-"}
          </p>
        </div>

        {/* Section A: Anggota Kelompok Asli */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-foreground">
              1. Anggota Kelompok Asli ({aktifAnggota.length}):
            </p>
            <span className="text-[10px] text-muted-foreground">{presentIds.size} Hadir</span>
          </div>

          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {aktifAnggota.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Users className="size-8 opacity-40" />
                <span>Belum ada data anggota untuk kelompok ini.</span>
              </div>
            ) : (
              aktifAnggota.map((member) => {
                const isPresent = presentIds.has(member.id);
                return (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
                      isPresent
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-rose-500/30 bg-rose-500/5 opacity-70"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Checkbox
                        id={`check-${member.id}`}
                        checked={isPresent}
                        onCheckedChange={() => togglePresent(member.id)}
                      />
                      <label
                        htmlFor={`check-${member.id}`}
                        className={`font-semibold cursor-pointer truncate ${
                          !isPresent ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {member.nama}
                      </label>
                      <Badge variant="outline" className="text-[9px]">
                        {member.jenis_kelamin === "L" ? "Ikhwan" : "Akhwat"}
                      </Badge>
                    </div>

                    {isPresent ? (
                      <Badge variant="success" className="text-[10px]">Hadir</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">Absen</Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section B: Peserta Pengganti Fleksibel */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
              <UserPlus className="size-3.5 text-amber-600" />
              2. Peserta Pengganti / Substitute ({substitutes.length}):
            </span>
            {!isAddingSubstitute && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 text-[10px] gap-1 text-amber-600 border-amber-500/40 hover:bg-amber-500/10 font-semibold"
                onClick={() => {
                  setIsAddingSubstitute(true);
                  setSearchQuery("");
                }}
              >
                <Plus className="size-3" /> Tambah Substitute
              </Button>
            )}
          </div>

          {/* Autocomplete Panel */}
          {isAddingSubstitute && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2 space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                  Cari Peserta Pengganti (Kelompok Lain):
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-5 text-muted-foreground"
                  onClick={() => setIsAddingSubstitute(false)}
                >
                  <X className="size-3" />
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-2 top-2 size-3 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Cari nama peserta pengganti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-7 text-xs"
                />
              </div>

              <div className="max-h-28 overflow-y-auto space-y-1 border rounded bg-background p-1">
                {isLoadingAnggota ? (
                  <p className="text-[10px] text-muted-foreground text-center py-1">Memuat...</p>
                ) : substituteCandidates.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-1">
                    {searchQuery ? "Tidak ditemukan." : "Ketik nama untuk mencari..."}
                  </p>
                ) : (
                  substituteCandidates.slice(0, 10).map((cand) => (
                    <button
                      key={cand.id}
                      type="button"
                      onClick={() => addSubstitute(cand)}
                      className="w-full text-left px-2 py-1 rounded hover:bg-amber-500/10 text-xs flex items-center justify-between transition-colors font-medium"
                    >
                      <span className="font-semibold text-foreground">{cand.nama}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {cand.kelompok_nama ?? "Kelompok Lain"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* List of active substitutes */}
          {substitutes.length === 0 ? (
            <p className="text-[10px] text-muted-foreground italic text-center py-1 bg-muted/20 rounded border border-dashed">
              Belum ada peserta pengganti.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {substitutes.map((sub) => (
                <div
                  key={sub.substituteId}
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Badge variant="warning" className="text-[9px]">Substitute</Badge>
                      <span>{sub.nama}</span>
                      <span className="text-[10px] text-muted-foreground">({sub.kelompokNama})</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-5 text-rose-500 hover:bg-rose-500/10"
                      onClick={() => removeSubstitute(sub.substituteId)}
                    >
                      <X className="size-3" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1 border-t border-amber-500/20">
                    <span className="shrink-0 font-medium">Menggantikan:</span>
                    <select
                      value={sub.replacesId || ""}
                      onChange={(e) => updateSubstituteReplaces(sub.substituteId, e.target.value || null)}
                      className="h-5 rounded border border-input bg-background px-1 text-[10px] flex-1 font-medium"
                    >
                      <option value="">-- Tanpa Penggantian Spesifik --</option>
                      {Array.from(absentIds).map((absId) => {
                        const absObj = aktifAnggota.find((a) => a.id === absId);
                        return (
                          <option key={absId} value={absId}>
                            {absObj?.nama ?? "Anggota Absen"}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-Time Progress Preview for Final Attendees */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b pb-1">
            <span className="font-semibold flex items-center gap-1 text-foreground text-[11px]">
              <TrendingUp className="size-3.5 text-primary" /> Real-Time Preview Peserta Final
            </span>
            {estimateResult && (
              <span className="text-[10px] font-bold text-emerald-600">
                +{estimateResult.totalIncrease} Progress Bertambah
              </span>
            )}
          </div>

          {isLoadingEstimate ? (
            <p className="text-[10px] text-muted-foreground italic text-center py-1">
              Menghitung estimasi progress...
            </p>
          ) : !estimateResult || estimateResult.totalParticipants === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-1">
              Belum ada peserta hadir yang dipilih.
            </p>
          ) : (
            <div className="space-y-1.5">
              {estimateResult.willIncreaseList.length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    🟢 Akan Bertambah (+1 Progress):
                  </p>
                  {estimateResult.willIncreaseList.map((p) => (
                    <div key={p.anggotaId} className="flex items-center justify-between text-[11px] pl-2">
                      <span className="font-medium">
                        {p.nama} {p.isSubstitute && <span className="text-amber-600 text-[10px]">(pengganti {p.replacesNama})</span>}
                      </span>
                      <Badge variant="success" className="text-[9px]">
                        +1 Progress
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {estimateResult.alreadyMetList.length > 0 && (
                <div className="space-y-0.5 pt-1 border-t border-border/40">
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    🟡 Sudah Pernah Bertemu (Progress Tidak Bertambah):
                  </p>
                  {estimateResult.alreadyMetList.map((p) => (
                    <div key={p.anggotaId} className="flex items-center justify-between text-[11px] pl-2 text-muted-foreground">
                      <span>
                        {p.nama} {p.isSubstitute && <span className="text-amber-600 text-[10px]">(pengganti {p.replacesNama})</span>}
                      </span>
                      <Badge variant="outline" className="text-[9px] border-amber-500/50 text-amber-600">
                        Sudah Pernah Bertemu
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-semibold flex items-center gap-1.5">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSimpan}
            disabled={isLoading || totalHadir === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
          >
            {isLoading ? "Menyimpan..." : `Simpan Progress (${totalHadir} Hadir)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckSquare,
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
  // Set ID anggota asli yang HADIR (default: semua anggota kelompok aktif)
  const [presentIds, setPresentIds] = React.useState<Set<string>>(new Set());
  // Map: replacesId -> Anggota pengganti (null = belum dipilih pengganti)
  const [substituteMap, setSubstituteMap] = React.useState<Map<string, Anggota | null>>(new Map());
  // ID anggota yang sedang dicarikan pengganti
  const [searchingForId, setSearchingForId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  // External list of all anggota (for substitute candidates from other kelompok)
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

  // Load all anggota when dialog opens (for substitute picking)
  React.useEffect(() => {
    if (open) {
      setError(null);
      setSearchingForId(null);
      setSearchQuery("");

      // Default: semua anggota asli dianggap hadir
      const defaultIds = new Set(aktifAnggota.map((a) => a.id));
      setPresentIds(defaultIds);
      setSubstituteMap(new Map());

      if (allAnggotaList.length === 0) {
        setIsLoadingAnggota(true);
        getAnggotaAction()
          .then((list) => setAllAnggotaList(list))
          .catch(() => console.error("Gagal memuat anggota pengganti"))
          .finally(() => setIsLoadingAnggota(false));
      }
    }
  }, [open, aktifAnggota, allAnggotaList.length]);

  // Compute realtime progress estimate whenever presentIds or substituteMap changes
  React.useEffect(() => {
    if (open && booking && (booking.kating_list ?? []).length > 0) {
      const presentOriginals = aktifAnggota.filter((a) => presentIds.has(a.id));
      const substitutesList: Anggota[] = [...substituteMap.values()].filter(Boolean) as Anggota[];

      const finalParticipants: ParticipantEstimateItem[] = [
        ...presentOriginals.map((a) => ({ anggotaId: a.id, nama: a.nama })),
        ...substitutesList.map((s) => {
          const replacesId = [...substituteMap.entries()].find((entry) => entry[1]?.id === s.id)?.[0];
          const replacedObj = aktifAnggota.find((a) => a.id === replacesId);
          return {
            anggotaId: s.id,
            nama: s.nama,
            isSubstitute: true,
            replacesNama: replacedObj?.nama ?? "Anggota",
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
  }, [open, booking, presentIds, substituteMap, aktifAnggota]);

  if (!booking) return null;

  const togglePresent = (memberId: string) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        // Jadi tidak hadir -> tambahkan ke substituteMap (belum ada pengganti)
        next.delete(memberId);
        setSubstituteMap((sm) => {
          const nsm = new Map(sm);
          nsm.set(memberId, null);
          return nsm;
        });
      } else {
        // Jadi hadir lagi -> hapus dari substituteMap
        next.add(memberId);
        setSubstituteMap((sm) => {
          const nsm = new Map(sm);
          nsm.delete(memberId);
          return nsm;
        });
        if (searchingForId === memberId) setSearchingForId(null);
      }
      return next;
    });
  };

  const selectSubstitute = (absentId: string, candidate: Anggota) => {
    setSubstituteMap((prev) => {
      const next = new Map(prev);
      next.set(absentId, candidate);
      return next;
    });
    setSearchingForId(null);
    setSearchQuery("");
  };

  const removeSubstitute = (absentId: string) => {
    setSubstituteMap((prev) => {
      const next = new Map(prev);
      next.set(absentId, null);
      return next;
    });
  };

  // Substitute candidates validation rules:
  // - Not from this kelompok
  // - Not already in presentIds or chosen as another substitute
  // - Not replacing themselves
  const alreadyChosenSubstituteIds = new Set(
    [...substituteMap.values()].filter(Boolean).map((a) => a!.id)
  );

  const substituteCandidates = allAnggotaList.filter((a) => {
    if (a.kelompok_id === booking.kelompok_id) return false;
    if (alreadyChosenSubstituteIds.has(a.id)) return false;
    if (presentIds.has(a.id)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.nama.toLowerCase().includes(q) ||
      (a.kelompok_nama ?? "").toLowerCase().includes(q)
    );
  });

  const handleSimpan = async () => {
    const presentOriginalIds = Array.from(presentIds);
    const absentOriginalIds = [...substituteMap.keys()];
    const substitutes: SubstituteEntry[] = [];

    for (const [absentId, sub] of substituteMap.entries()) {
      if (sub) {
        substitutes.push({ substituteId: sub.id, replacesId: absentId });
      }
    }

    if (presentOriginalIds.length + substitutes.length === 0) {
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
        substitutes
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

  const totalHadir = presentIds.size + [...substituteMap.values()].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary font-bold text-sm sm:text-base">
            <CheckSquare className="size-5 text-emerald-500" />
            Tandai Sesi Taaruf Selesai &amp; Hitung Progress
          </DialogTitle>
          <DialogDescription className="text-xs">
            Verifikasi kehadiran peserta. Centang anggota yang hadir. Jika ada anggota yang tidak hadir, Anda dapat memilih pengganti dari kelompok lain.
          </DialogDescription>
        </DialogHeader>

        {/* Info Session */}
        <div className="rounded-lg bg-muted/40 border px-3 py-2 text-xs space-y-0.5">
          <div className="flex justify-between font-semibold">
            <span>{booking.tanggal} · {booking.slot_nama}</span>
            <span className="text-primary font-bold">Total Hadir: {totalHadir}</span>
          </div>
          <p className="text-muted-foreground text-[11px]">
            Kating: {(booking.kating_list ?? []).map((k) => k.nama).join(", ") || "-"}
          </p>
        </div>

        {/* Member Attendance & Inline Substitute Checklist */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-foreground">
            Daftar Anggota Kelompok ({aktifAnggota.length}):
          </p>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {aktifAnggota.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Users className="size-8 opacity-40" />
                <span>Belum ada data anggota untuk kelompok ini.</span>
              </div>
            ) : (
              aktifAnggota.map((member) => {
                const isPresent = presentIds.has(member.id);
                const isAbsent = substituteMap.has(member.id);
                const chosenSub = substituteMap.get(member.id) ?? null;
                const isSearchingThis = searchingForId === member.id;

                return (
                  <div
                    key={member.id}
                    className={`rounded-lg border text-xs transition-all overflow-hidden ${
                      isPresent
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-rose-500/30 bg-rose-500/5"
                    }`}
                  >
                    {/* Main Member Row */}
                    <div className="flex items-center justify-between p-2.5">
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
                        <Badge variant="success" className="text-[10px]">
                          Hadir
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">
                          Tidak Hadir
                        </Badge>
                      )}
                    </div>

                    {/* Inline Substitute Panel (Only if Absent) */}
                    {isAbsent && (
                      <div className="border-t bg-card/60 px-3 py-2 space-y-2">
                        {chosenSub ? (
                          /* Substitute Chosen */
                          <div className="flex items-center justify-between pl-4 text-xs">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-amber-600 font-bold">↳ Diganti oleh:</span>
                              <span className="font-semibold text-foreground">{chosenSub.nama}</span>
                              <span className="text-[10px] text-muted-foreground">
                                ({chosenSub.kelompok_nama ?? "Kelompok Lain"})
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-5 text-rose-500 hover:bg-rose-500/10"
                              onClick={() => removeSubstitute(member.id)}
                              title="Hapus pengganti"
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                        ) : isSearchingThis ? (
                          /* Search Substitute Input */
                          <div className="space-y-1.5 pl-2 animate-in fade-in">
                            <div className="flex items-center gap-1">
                              <div className="relative flex-1">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                                <Input
                                  autoFocus
                                  placeholder={`Cari pengganti untuk ${member.nama}...`}
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
                                onClick={() => {
                                  setSearchingForId(null);
                                  setSearchQuery("");
                                }}
                              >
                                <X className="size-3.5" />
                              </Button>
                            </div>
                            <div className="max-h-28 overflow-y-auto space-y-1 rounded-md border bg-muted/30 p-1">
                              {isLoadingAnggota ? (
                                <p className="text-[10px] text-muted-foreground text-center py-1">Memuat...</p>
                              ) : substituteCandidates.length === 0 ? (
                                <p className="text-[10px] text-muted-foreground text-center py-1">
                                  {searchQuery ? "Tidak ditemukan." : "Ketik nama untuk mencari pengganti..."}
                                </p>
                              ) : (
                                substituteCandidates.slice(0, 10).map((cand) => (
                                  <button
                                    key={cand.id}
                                    type="button"
                                    onClick={() => selectSubstitute(member.id, cand)}
                                    className="w-full text-left px-2 py-1 rounded hover:bg-accent text-xs flex items-center justify-between transition-colors"
                                  >
                                    <span className="font-semibold">{cand.nama}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {cand.kelompok_nama ?? "—"}
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Action button to open search */
                          <div className="pl-4">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] text-amber-600 border-amber-500/40 hover:bg-amber-500/10"
                              onClick={() => {
                                setSearchingForId(member.id);
                                setSearchQuery("");
                              }}
                            >
                              <UserPlus className="size-3 mr-1" /> Pilih Pengganti
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Real-Time Progress Preview for Final Attendees */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b pb-1">
            <span className="font-semibold flex items-center gap-1 text-foreground text-[11px]">
              <TrendingUp className="size-3.5 text-primary" /> Preview Progress Peserta Final
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
              {/* Will Increase (+1) */}
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

              {/* Already Met (No Progress Increase) */}
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

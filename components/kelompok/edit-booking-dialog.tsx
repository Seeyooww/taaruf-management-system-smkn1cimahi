"use client";

import * as React from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit,
  MapPin,
  Plus,
  Search,
  Shield,
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
import { Label } from "@/components/ui/label";
import {
  getAvailableKatingAction,
  getBookingParticipantsAction,
  updateBookingDetailsAction,
} from "@/services/booking.actions";
import { getAnggotaAction } from "@/services/anggota.actions";
import { checkProgressEstimateAction } from "@/services/progress.actions";
import type {
  Anggota,
  BookingWithDetails,
  EventSettings,
  Kating,
  ParticipantEstimateItem,
  ProgressEstimateResult,
  SlotWaktu,
} from "@/types/database";

export interface SubstituteItem {
  substituteId: string;
  nama: string;
  kelompokNama?: string;
  replacesId: string | null;
  replacesNama?: string;
}

interface EditBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithDetails | null;
  settings: EventSettings;
  slotList: SlotWaktu[];
  onBookingUpdated: (updatedBooking: BookingWithDetails) => void;
  anggotaList?: Anggota[];
}

export function EditBookingDialog({
  open,
  onOpenChange,
  booking,
  settings,
  slotList,
  onBookingUpdated,
  anggotaList = [],
}: EditBookingDialogProps) {
  const [isPending, startTransition] = React.useTransition();

  // ── Booking Detail Fields ───────────────────────────────────────────────────
  const [tanggal, setTanggal] = React.useState("");
  const [selectedSlot, setSelectedSlot] = React.useState<SlotWaktu | null>(null);
  const [selectedKatingIds, setSelectedKatingIds] = React.useState<Set<string>>(new Set());
  const [catatan, setCatatan] = React.useState("");
  const [jamPulang, setJamPulang] = React.useState("");
  const [tempatTaaruf, setTempatTaaruf] = React.useState("");

  const [allKatingList, setAllKatingList] = React.useState<Kating[]>([]);
  const [isLoadingKating, setIsLoadingKating] = React.useState(false);
  const [searchKating, setSearchKating] = React.useState("");
  const [conflictWarning, setConflictWarning] = React.useState<string | null>(null);

  // ── Participant Management State ────────────────────────────────────────────
  // Original member IDs present
  const [presentIds, setPresentIds] = React.useState<Set<string>>(new Set());
  // Original member IDs absent
  const [absentIds, setAbsentIds] = React.useState<Set<string>>(new Set());
  // Substitutes array (flexible, non-group members)
  const [substitutes, setSubstitutes] = React.useState<SubstituteItem[]>([]);

  // Search candidate substitute
  const [isAddingSubstitute, setIsAddingSubstitute] = React.useState(false);
  const [searchSubQuery, setSearchSubQuery] = React.useState("");
  const [allAnggotaList, setAllAnggotaList] = React.useState<Anggota[]>([]);
  const [isLoadingAnggota, setIsLoadingAnggota] = React.useState(false);

  // Real-time Progress Estimate
  const [estimateResult, setEstimateResult] = React.useState<ProgressEstimateResult | null>(null);
  const [isLoadingEstimate, setIsLoadingEstimate] = React.useState(false);

  // Active tab: "booking" | "peserta"
  const [activeTab, setActiveTab] = React.useState<"booking" | "peserta">("booking");

  const aktifAnggota = React.useMemo(() => {
    return anggotaList.filter((a) => a.aktif);
  }, [anggotaList]);

  // ── Initialize Form & Fetch Booking Participants from DB ────────────────────
  React.useEffect(() => {
    if (booking && open) {
      setTanggal(booking.tanggal || settings.tanggal_mulai || "");
      const foundSlot = slotList.find((s) => s.id === booking.slot_id) || slotList[0] || null;
      setSelectedSlot(foundSlot);
      setSelectedKatingIds(new Set((booking.kating_list ?? []).map((k) => k.id)));
      setCatatan(booking.catatan || "");
      setJamPulang(booking.jam_pulang || "");
      setTempatTaaruf(booking.tempat_taaruf || "");
      setConflictWarning(null);
      setSearchKating("");
      setActiveTab("booking");
      setIsAddingSubstitute(false);
      setSearchSubQuery("");

      // Default: active members present
      const defaultPresent = new Set(aktifAnggota.map((a) => a.id));
      setPresentIds(defaultPresent);
      setAbsentIds(new Set());
      setSubstitutes([]);

      // Fetch booking_participants directly from DB (Single Source of Truth)
      if (booking.id) {
        getBookingParticipantsAction(booking.id).then((rows) => {
          if (rows && rows.length > 0) {
            const pres = new Set<string>();
            const abs = new Set<string>();
            const subs: SubstituteItem[] = [];

            // Accounted member IDs from DB rows
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

            // Ensure any active group member not in DB rows defaults to present
            for (const a of aktifAnggota) {
              if (!accountedOriginalIds.has(a.id)) {
                pres.add(a.id);
              }
            }

            setPresentIds(pres);
            setAbsentIds(abs);
            setSubstitutes(subs);
          }
        }).catch(() => { /* ignore error */ });
      }

      // Load all anggota for substitute autocomplete
      if (allAnggotaList.length === 0) {
        setIsLoadingAnggota(true);
        getAnggotaAction()
          .then((list) => setAllAnggotaList(list))
          .catch(() => console.error("Gagal memuat anggota pengganti"))
          .finally(() => setIsLoadingAnggota(false));
      }
    }
  }, [booking, open, settings.tanggal_mulai, slotList, aktifAnggota, allAnggotaList.length, booking?.id]);

  // ── Compute Real-Time Progress Estimate ──────────────────────────────────────
  React.useEffect(() => {
    if (open && selectedKatingIds.size > 0) {
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

      const katingIds = Array.from(selectedKatingIds);

      if (finalParticipants.length > 0 && katingIds.length > 0) {
        setIsLoadingEstimate(true);
        checkProgressEstimateAction(finalParticipants, katingIds)
          .then((res) => setEstimateResult(res))
          .catch(() => setEstimateResult(null))
          .finally(() => setIsLoadingEstimate(false));
      } else {
        setEstimateResult(null);
      }
    } else {
      setEstimateResult(null);
    }
  }, [open, selectedKatingIds, presentIds, substitutes, aktifAnggota]);

  // ── Kating Availability ─────────────────────────────────────────────────────
  const loadAvailableKating = React.useCallback(async () => {
    if (!tanggal || !selectedSlot || !booking) return;
    setIsLoadingKating(true);
    setConflictWarning(null);
    try {
      const katingList = await getAvailableKatingAction(tanggal, selectedSlot.id, booking.id);
      setAllKatingList(katingList);

      const availableIds = new Set(katingList.map((k) => k.id));
      setSelectedKatingIds((prev) => {
        const conflictedNames: string[] = [];
        const next = new Set<string>();
        prev.forEach((id) => {
          if (availableIds.has(id)) {
            next.add(id);
          } else {
            const kat = (booking.kating_list ?? []).find((k) => k.id === id);
            if (kat) conflictedNames.push(kat.nama);
          }
        });
        if (conflictedNames.length > 0) {
          setConflictWarning(
            `🔴 ${conflictedNames.join(", ")} sudah dibooking oleh kelompok lain pada tanggal ${tanggal} slot ${selectedSlot.nama_slot}. Pilihan kating tersebut telah disesuaikan.`
          );
        }
        return next;
      });
    } catch {
      toast.error("Gagal memuat kating yang tersedia.");
    } finally {
      setIsLoadingKating(false);
    }
  }, [tanggal, selectedSlot, booking]);

  React.useEffect(() => {
    if (open && tanggal && selectedSlot?.id) {
      loadAvailableKating();
    }
  }, [open, tanggal, selectedSlot?.id, loadAvailableKating]);

  if (!booking) return null;

  const isPulangSlot = Boolean(selectedSlot?.nama_slot.toLowerCase().includes("pulang"));

  // ── Kating Select Helper ────────────────────────────────────────────────────
  const toggleKating = (kat: Kating) => {
    setSelectedKatingIds((prev) => {
      const next = new Set(prev);
      if (next.has(kat.id)) {
        next.delete(kat.id);
      } else {
        if (next.size >= 2) {
          toast.error("Maksimal 2 kating pendamping per booking.");
          return prev;
        }
        next.add(kat.id);
      }
      return next;
    });
    setConflictWarning(null);
  };

  const filteredKatingList = allKatingList.filter((k) => {
    if (!searchKating.trim()) return true;
    const q = searchKating.toLowerCase();
    return k.nama.toLowerCase().includes(q) || k.kelas.toLowerCase().includes(q);
  });
  const ikhwanList = filteredKatingList.filter((k) => k.jenis_kelamin === "L");
  const akhwatList = filteredKatingList.filter((k) => k.jenis_kelamin === "P");
  const selectedKatingObjects = allKatingList.filter((k) => selectedKatingIds.has(k.id));

  // ── Original Member Attendance Helper ─────────────────────────────────────
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

  // ── Substitute Candidates Rules (Flexible, non-group) ──────────────────────
  const chosenSubstituteIds = new Set(substitutes.map((s) => s.substituteId));

  const substituteCandidates = allAnggotaList.filter((a) => {
    if (a.kelompok_id === booking.kelompok_id) return false; // not group member
    if (chosenSubstituteIds.has(a.id)) return false; // no duplicate substitutes
    if (presentIds.has(a.id)) return false; // not present original
    if (!searchSubQuery.trim()) return true;
    const q = searchSubQuery.toLowerCase();
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
    setSearchSubQuery("");
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

  const totalHadir = presentIds.size + substitutes.length;

  // ── Submit Edit ─────────────────────────────────────────────────────────────
  const handleSubmitEdit = () => {
    if (!tanggal || !selectedSlot) {
      toast.error("Silakan pilih tanggal dan slot waktu.");
      return;
    }
    if (selectedKatingIds.size === 0) {
      toast.error("Silakan pilih minimal 1 kating pendamping.");
      return;
    }
    if (totalHadir === 0) {
      toast.error("Silakan pilih minimal 1 peserta yang hadir (asli atau pengganti).");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("booking_id", booking.id);
      formData.append("tanggal", tanggal);
      formData.append("slot_id", selectedSlot.id);
      selectedKatingIds.forEach((id) => formData.append("kating_ids", id));
      formData.append("catatan", catatan);
      formData.append("jam_pulang", jamPulang);
      formData.append("tempat_taaruf", tempatTaaruf);

      // Participants data
      Array.from(presentIds).forEach((id) => formData.append("present_ids", id));
      Array.from(absentIds).forEach((id) => formData.append("absent_ids", id));
      substitutes.forEach((sub) => {
        formData.append("substitutes", `${sub.substituteId}:${sub.replacesId || ""}`);
      });

      const res = await updateBookingDetailsAction(formData);

      if (res.success && res.data) {
        toast.success("✔ Booking berhasil diperbarui!");
        onBookingUpdated(res.data);
        onOpenChange(false);
      } else {
        toast.error(`❌ ${res.message || "Gagal memperbarui booking."}`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold text-sm sm:text-base text-primary">
            <Edit className="size-4 sm:size-5" /> Ubah Booking Sesi Taaruf
          </DialogTitle>
          <DialogDescription className="text-xs">
            Ubah detail pengajuan booking (Status: <strong>{booking?.status ?? "—"}</strong>). Single Source of Truth dari <code>booking_participants</code>.
          </DialogDescription>
        </DialogHeader>

        {conflictWarning && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{conflictWarning}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setActiveTab("booking")}
            className={`flex-1 text-xs font-semibold rounded-md py-1.5 transition-all ${
              activeTab === "booking"
                ? "bg-background shadow text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📅 Detail Booking
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("peserta")}
            className={`flex-1 text-xs font-semibold rounded-md py-1.5 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "peserta"
                ? "bg-background shadow text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            👥 Peserta ({totalHadir} Hadir)
            {substitutes.length > 0 && (
              <Badge variant="warning" className="text-[9px] h-4 px-1">
                +{substitutes.length} Pengganti
              </Badge>
            )}
          </button>
        </div>

        {/* ── TAB 1: DETAIL BOOKING ─────────────────────────────────────────── */}
        {activeTab === "booking" && (
          <div className="space-y-4 py-1 text-xs animate-in fade-in">
            {/* Tanggal & Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-tanggal" className="text-xs font-semibold flex items-center gap-1">
                  <CalendarDays className="size-3.5 text-primary" /> Tanggal
                </Label>
                <Input
                  id="edit-tanggal"
                  type="date"
                  min={settings.tanggal_mulai}
                  max={settings.tanggal_selesai}
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-slot" className="text-xs font-semibold flex items-center gap-1">
                  <Clock className="size-3.5 text-primary" /> Slot Waktu
                </Label>
                <select
                  id="edit-slot"
                  value={selectedSlot?.id || ""}
                  onChange={(e) => {
                    const s = slotList.find((sl) => sl.id === e.target.value);
                    if (s) setSelectedSlot(s);
                  }}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {slotList.filter((s) => s.aktif).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama_slot} ({s.jam_mulai} - {s.jam_selesai} WIB)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Jam Pulang & Tempat Taaruf */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
              {isPulangSlot && (
                <div className="space-y-1.5">
                  <Label htmlFor="edit-jam-pulang" className="text-xs font-semibold flex items-center gap-1">
                    <Clock className="size-3.5 text-primary" /> Estimasi Jam Pulang
                  </Label>
                  <Input
                    id="edit-jam-pulang"
                    type="time"
                    value={jamPulang}
                    onChange={(e) => setJamPulang(e.target.value)}
                    className="text-xs h-9 font-mono font-semibold"
                  />
                </div>
              )}
              <div className="space-y-1.5 col-span-1 sm:col-span-2">
                <Label htmlFor="edit-tempat" className="text-xs font-semibold flex items-center gap-1">
                  <MapPin className="size-3.5 text-primary" /> Tempat / Lokasi Ta&apos;aruf
                </Label>
                <Input
                  id="edit-tempat"
                  placeholder="Contoh: Masjid SMKN 1 Cimahi / Lab RPL 1"
                  value={tempatTaaruf}
                  onChange={(e) => setTempatTaaruf(e.target.value)}
                  className="text-xs h-9 font-medium"
                />
              </div>
            </div>

            {/* Kating Selection */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Users className="size-4 text-primary" /> Pilih Kating Pendamping
                </Label>
                <Badge variant="outline" className="text-[10px]">
                  {selectedKatingIds.size}/2 dipilih
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau kelas kating..."
                  value={searchKating}
                  onChange={(e) => setSearchKating(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>

              {isLoadingKating ? (
                <p className="text-center py-4 text-xs text-muted-foreground">
                  Memeriksa ketersediaan kating real-time...
                </p>
              ) : filteredKatingList.length === 0 ? (
                <p className="text-center py-4 text-xs text-rose-500 font-medium">
                  Tidak ada kating yang tersedia pada tanggal dan slot ini.
                </p>
              ) : (
                <div className="space-y-3 max-h-44 overflow-y-auto pr-1">
                  {ikhwanList.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-primary uppercase">Ikhwan</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {ikhwanList.map((kat) => {
                          const isSelected = selectedKatingIds.has(kat.id);
                          return (
                            <button
                              key={kat.id}
                              type="button"
                              onClick={() => toggleKating(kat)}
                              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                                  : "border-border hover:bg-accent"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs flex items-center gap-1">
                                  <Shield className="size-3 text-primary" /> {kat.nama}
                                </span>
                                {isSelected && <CheckCircle2 className="size-3.5 text-primary shrink-0" />}
                              </div>
                              <span className="text-[10px] text-muted-foreground block">{kat.kelas}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {akhwatList.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Akhwat</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {akhwatList.map((kat) => {
                          const isSelected = selectedKatingIds.has(kat.id);
                          return (
                            <button
                              key={kat.id}
                              type="button"
                              onClick={() => toggleKating(kat)}
                              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500"
                                  : "border-border hover:bg-accent"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs flex items-center gap-1">
                                  <Shield className="size-3 text-emerald-500" /> {kat.nama}
                                </span>
                                {isSelected && <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />}
                              </div>
                              <span className="text-[10px] text-muted-foreground block">{kat.kelas}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedKatingIds.size > 0 && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-2 text-xs space-y-1">
                  <p className="font-semibold text-primary text-[11px]">✓ Kating Terpilih:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedKatingObjects.map((k) => (
                      <Badge
                        key={k.id}
                        variant="outline"
                        className="text-[10px] cursor-pointer"
                        onClick={() => toggleKating(k)}
                      >
                        {k.nama} ✕
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Catatan */}
            <div className="space-y-1 pt-2 border-t">
              <Label htmlFor="edit-catatan" className="text-xs font-semibold">
                Catatan Tambahan (Opsional)
              </Label>
              <Input
                id="edit-catatan"
                placeholder="Catatan..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>
        )}

        {/* ── TAB 2: MANAJEMEN PESERTA FLEKSIBEL ─────────────────────────────── */}
        {activeTab === "peserta" && (
          <div className="space-y-4 py-1 text-xs animate-in fade-in">
            {/* Header info */}
            <div className="rounded-lg bg-muted/40 border px-3 py-2 text-xs flex items-center justify-between">
              <span className="font-semibold text-foreground">Status Kehadiran Peserta</span>
              <span className="text-primary font-bold">Total Hadir: {totalHadir} Peserta</span>
            </div>

            {/* Section A: Anggota Kelompok Asli */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>1. Anggota Kelompok Asli ({aktifAnggota.length})</span>
                <span className="text-[10px] font-normal text-muted-foreground">
                  {presentIds.size} Centang Hadir
                </span>
              </Label>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {aktifAnggota.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">Belum ada anggota kelompok.</p>
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
                        <div className="flex items-center gap-2 min-w-0">
                          <Checkbox
                            id={`edit-member-${member.id}`}
                            checked={isPresent}
                            onCheckedChange={() => togglePresent(member.id)}
                          />
                          <label
                            htmlFor={`edit-member-${member.id}`}
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

            {/* Section B: Peserta Pengganti (Substitutes) Fleksibel */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <UserPlus className="size-3.5 text-amber-600" />
                  2. Peserta Pengganti / Substitute ({substitutes.length})
                </Label>
                {!isAddingSubstitute && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] gap-1 text-amber-600 border-amber-500/40 hover:bg-amber-500/10 font-semibold"
                    onClick={() => {
                      setIsAddingSubstitute(true);
                      setSearchSubQuery("");
                    }}
                  >
                    <Plus className="size-3" /> Tambah Substitute
                  </Button>
                )}
              </div>

              {/* Add Substitute Autocomplete Panel */}
              {isAddingSubstitute && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                      Cari Peserta Pengganti (Kelompok Lain):
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-5 text-muted-foreground hover:bg-muted"
                      onClick={() => {
                        setIsAddingSubstitute(false);
                        setSearchSubQuery("");
                      }}
                    >
                      <X className="size-3" />
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 size-3 text-muted-foreground" />
                    <Input
                      autoFocus
                      placeholder="Cari nama peserta dari kelompok lain..."
                      value={searchSubQuery}
                      onChange={(e) => setSearchSubQuery(e.target.value)}
                      className="pl-7 h-7 text-xs"
                    />
                  </div>

                  <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md bg-background p-1">
                    {isLoadingAnggota ? (
                      <p className="text-[10px] text-muted-foreground text-center py-2">Memuat daftar anggota...</p>
                    ) : substituteCandidates.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground text-center py-2">
                        {searchSubQuery ? "Peserta tidak ditemukan." : "Ketik nama untuk mencari peserta..."}
                      </p>
                    ) : (
                      substituteCandidates.slice(0, 10).map((cand) => (
                        <button
                          key={cand.id}
                          type="button"
                          onClick={() => addSubstitute(cand)}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-amber-500/10 text-xs flex items-center justify-between transition-colors font-medium"
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
                <p className="text-[11px] text-muted-foreground italic py-1 text-center bg-muted/20 rounded-md border border-dashed">
                  Belum ada peserta pengganti. Klik &quot;+ Tambah Substitute&quot; jika ada anggota kelompok lain yang bergabung.
                </p>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {substitutes.map((sub) => (
                    <div
                      key={sub.substituteId}
                      className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs space-y-1.5"
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
                          title="Hapus pengganti ini"
                        >
                          <X className="size-3" />
                        </Button>
                      </div>

                      {/* Replaces member selector */}
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1 border-t border-amber-500/20">
                        <span className="shrink-0 font-medium">Menggantikan:</span>
                        <select
                          value={sub.replacesId || ""}
                          onChange={(e) => updateSubstituteReplaces(sub.substituteId, e.target.value || null)}
                          className="h-6 rounded border border-input bg-background px-2 text-[11px] flex-1 font-medium"
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

            {/* Real-Time Progress Preview */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-xs pt-2">
              <div className="flex items-center justify-between border-b pb-1">
                <span className="font-semibold flex items-center gap-1 text-foreground text-[11px]">
                  <TrendingUp className="size-3.5 text-primary" /> Real-Time Progress Preview ({totalHadir} Hadir)
                </span>
                {estimateResult && (
                  <span className="text-[10px] font-bold text-emerald-600">
                    +{estimateResult.totalIncrease} Progress Bertambah
                  </span>
                )}
              </div>

              {isLoadingEstimate ? (
                <p className="text-[10px] text-muted-foreground italic text-center py-1">
                  Menghitung estimasi progress peserta final...
                </p>
              ) : !estimateResult || estimateResult.totalParticipants === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-1">
                  Pilih kating dan peserta hadir untuk melihat preview progress.
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
                          <Badge variant="success" className="text-[9px]">+1 Progress</Badge>
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
          </div>
        )}

        <DialogFooter className="gap-2 pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSubmitEdit}
            disabled={isPending || selectedKatingIds.size === 0 || totalHadir === 0}
            className="bg-primary text-primary-foreground font-semibold text-xs"
          >
            {isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

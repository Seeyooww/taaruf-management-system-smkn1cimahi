"use client";

import * as React from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit,
  MapPin,
  Search,
  Shield,
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
import type {
  Anggota,
  BookingWithDetails,
  EventSettings,
  Kating,
  SlotWaktu,
} from "@/types/database";

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

  // ── Booking Fields ──────────────────────────────────────────────────────────
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

  // ── Participant Fields ──────────────────────────────────────────────────────
  // Set of anggota IDs that are PRESENT (original members)
  const [presentIds, setPresentIds] = React.useState<Set<string>>(new Set());
  // Map: absent anggota ID -> substitute Anggota (or null if not chosen yet)
  const [substituteMap, setSubstituteMap] = React.useState<Map<string, Anggota | null>>(new Map());
  const [searchingForId, setSearchingForId] = React.useState<string | null>(null);
  const [searchSubQuery, setSearchSubQuery] = React.useState("");
  const [allAnggotaList, setAllAnggotaList] = React.useState<Anggota[]>([]);
  const [isLoadingAnggota, setIsLoadingAnggota] = React.useState(false);

  // Active tab: "booking" | "peserta"
  const [activeTab, setActiveTab] = React.useState<"booking" | "peserta">("booking");

  // The kelompok's own active anggota
  const aktifAnggota = React.useMemo(() => {
    return anggotaList.filter((a) => a.aktif);
  }, [anggotaList]);

  // ── Initialize form state ────────────────────────────────────────────────────
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
      setSearchingForId(null);
      setSearchSubQuery("");

      // Default: all active members as present, no substitutes yet
      const defaultIds = new Set(aktifAnggota.map((a) => a.id));
      setPresentIds(defaultIds);
      setSubstituteMap(new Map());

      // Load persisted participants if any
      if (booking.id) {
        getBookingParticipantsAction(booking.id).then((rows) => {
          if (rows && rows.length > 0) {
            const pres = new Set<string>();
            const subMap = new Map<string, Anggota | null>();

            // First pass – find who is absent (original members with hadir=false)
            const absentIds = new Set<string>();
            for (const r of rows) {
              if (!r.is_substitute && !r.hadir) {
                absentIds.add(r.anggota_id);
              }
            }

            // Build presentIds from active kelompok members
            for (const a of aktifAnggota) {
              if (!absentIds.has(a.id)) {
                pres.add(a.id);
              } else {
                subMap.set(a.id, null); // absent, substitute unknown yet
              }
            }

            // Fill in known substitutes
            for (const r of rows) {
              if (r.is_substitute && r.replaces_anggota_id) {
                const subAnggota = anggotaList.find((a) => a.id === r.anggota_id);
                if (subAnggota) {
                  subMap.set(r.replaces_anggota_id, subAnggota);
                }
              }
            }

            setPresentIds(pres);
            setSubstituteMap(subMap);
          }
        }).catch(() => { /* silently ignore */ });
      }

      // Load all anggota for substitute picker
      if (allAnggotaList.length === 0) {
        setIsLoadingAnggota(true);
        getAnggotaAction()
          .then((list) => setAllAnggotaList(list))
          .catch(() => console.error("Gagal memuat anggota pengganti"))
          .finally(() => setIsLoadingAnggota(false));
      }
    }
  }, [booking, open, settings.tanggal_mulai, slotList, aktifAnggota, anggotaList, allAnggotaList.length, booking?.id]);

  // ── Kating availability ──────────────────────────────────────────────────────
  const loadAvailableKating = React.useCallback(async () => {
    if (!tanggal || !selectedSlot || !booking) return;
    setIsLoadingKating(true);
    setConflictWarning(null);
    try {
      const katingList = await getAvailableKatingAction(tanggal, selectedSlot.id, booking.id);
      setAllKatingList(katingList);

      // Deselect any kating no longer available
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

  // ── Kating helpers ───────────────────────────────────────────────────────────
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

  // ── Participant helpers ──────────────────────────────────────────────────────
  const togglePresent = (memberId: string) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
        setSubstituteMap((sm) => {
          const nsm = new Map(sm);
          nsm.set(memberId, null);
          return nsm;
        });
      } else {
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
    setSearchSubQuery("");
  };

  const removeSubstitute = (absentId: string) => {
    setSubstituteMap((prev) => {
      const next = new Map(prev);
      next.set(absentId, null);
      return next;
    });
  };

  const alreadyChosenSubstituteIds = new Set(
    [...substituteMap.values()].filter(Boolean).map((a) => a!.id)
  );

  const substituteCandidates = allAnggotaList.filter((a) => {
    if (a.kelompok_id === booking.kelompok_id) return false;
    if (alreadyChosenSubstituteIds.has(a.id)) return false;
    if (presentIds.has(a.id)) return false;
    if (!searchSubQuery.trim()) return true;
    const q = searchSubQuery.toLowerCase();
    return (
      a.nama.toLowerCase().includes(q) ||
      (a.kelompok_nama ?? "").toLowerCase().includes(q)
    );
  });

  const totalHadir = presentIds.size + [...substituteMap.values()].filter(Boolean).length;

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmitEdit = () => {
    if (!tanggal || !selectedSlot) {
      toast.error("Silakan pilih tanggal dan slot waktu.");
      return;
    }
    if (selectedKatingIds.size === 0) {
      toast.error("Silakan pilih minimal 1 kating pendamping.");
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

      // Participants
      const presentOriginalIds = Array.from(presentIds);
      const absentOriginalIds = [...substituteMap.keys()];
      presentOriginalIds.forEach((id) => formData.append("present_ids", id));
      absentOriginalIds.forEach((id) => formData.append("absent_ids", id));
      for (const [absentId, sub] of substituteMap.entries()) {
        if (sub) formData.append("substitutes", `${sub.id}:${absentId}`);
      }

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
            Ubah detail pengajuan booking (Status: <strong>Menunggu Konfirmasi</strong>). ID dan riwayat booking tetap terjaga.
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
            className={`flex-1 text-xs font-semibold rounded-md py-1.5 transition-all flex items-center justify-center gap-1 ${
              activeTab === "peserta"
                ? "bg-background shadow text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            👥 Peserta
            <Badge variant="outline" className="text-[9px] h-4 px-1">{totalHadir} Hadir</Badge>
          </button>
        </div>

        {/* ── TAB: BOOKING ─────────────────────────────────────────────────── */}
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
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
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

        {/* ── TAB: PESERTA ─────────────────────────────────────────────────── */}
        {activeTab === "peserta" && (
          <div className="space-y-3 py-1 text-xs animate-in fade-in">
            <div className="rounded-lg bg-muted/40 border px-3 py-2 text-xs flex items-center justify-between">
              <span className="font-semibold">Daftar Peserta Kelompok ({aktifAnggota.length})</span>
              <span className="text-primary font-bold">Total Hadir: {totalHadir}</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {aktifAnggota.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground flex flex-col items-center gap-2">
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
                      {/* Member Row */}
                      <div className="flex items-center justify-between p-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Checkbox
                            id={`edit-check-${member.id}`}
                            checked={isPresent}
                            onCheckedChange={() => togglePresent(member.id)}
                          />
                          <label
                            htmlFor={`edit-check-${member.id}`}
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
                          <Badge variant="destructive" className="text-[10px]">Tidak Hadir</Badge>
                        )}
                      </div>

                      {/* Substitute Panel */}
                      {isAbsent && (
                        <div className="border-t bg-card/60 px-3 py-2 space-y-2">
                          {chosenSub ? (
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
                              >
                                <X className="size-3" />
                              </Button>
                            </div>
                          ) : isSearchingThis ? (
                            <div className="space-y-1.5 pl-2 animate-in fade-in">
                              <div className="flex items-center gap-1">
                                <div className="relative flex-1">
                                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                                  <Input
                                    autoFocus
                                    placeholder={`Cari pengganti untuk ${member.nama}...`}
                                    value={searchSubQuery}
                                    onChange={(e) => setSearchSubQuery(e.target.value)}
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
                                    setSearchSubQuery("");
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
                                    {searchSubQuery ? "Tidak ditemukan." : "Ketik nama untuk mencari pengganti..."}
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
                            <div className="pl-4">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] text-amber-600 border-amber-500/40 hover:bg-amber-500/10"
                                onClick={() => {
                                  setSearchingForId(member.id);
                                  setSearchSubQuery("");
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

            <p className="text-[10px] text-muted-foreground text-center">
              Centang anggota yang hadir. Jika tidak hadir, dapat ditunjuk pengganti dari kelompok lain.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSubmitEdit}
            disabled={isPending || selectedKatingIds.size === 0}
            className="bg-primary text-primary-foreground font-semibold text-xs"
          >
            {isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

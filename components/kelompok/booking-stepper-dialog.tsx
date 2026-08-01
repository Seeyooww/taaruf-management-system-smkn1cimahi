"use client";

import * as React from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  MapPin,
  MessageSquare,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBookingAction, getAvailableKatingAction } from "@/services/booking.actions";
import type { Anggota, BookingWithDetails, EventSettings, Kating, SlotWaktu } from "@/types/database";

interface BookingStepperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: EventSettings;
  slotList: SlotWaktu[];
  kelompokId: string;
  kelompokNama: string;
  anggotaList?: Anggota[];
  presetTanggal?: string;
  onBookingCreated: (booking: BookingWithDetails) => void;
}

export function BookingStepperDialog({
  open,
  onOpenChange,
  settings,
  slotList,
  kelompokId,
  kelompokNama,
  anggotaList = [],
  presetTanggal,
  onBookingCreated,
}: BookingStepperDialogProps) {
  const [step, setStep] = React.useState(1);
  const [isPending, startTransition] = React.useTransition();

  // Form states
  const [tanggal, setTanggal] = React.useState(presetTanggal || settings.tanggal_mulai || "2026-08-01");
  const [selectedSlot, setSelectedSlot] = React.useState<SlotWaktu | null>(
    slotList.find((s) => s.aktif) || null
  );
  // Multi-select: kating dapat dipilih bebas (ikhwan/akhwat kombinasi)
  const [selectedKatingIds, setSelectedKatingIds] = React.useState<Set<string>>(new Set());
  const [catatan, setCatatan] = React.useState("");
  const [jamPulang, setJamPulang] = React.useState("16:30");
  const [tempatTaaruf, setTempatTaaruf] = React.useState("Masjid SMKN 1 Cimahi");

  // Kating list state
  const [allKatingList, setAllKatingList] = React.useState<Kating[]>([]);
  const [isLoadingKating, setIsLoadingKating] = React.useState(false);
  const [conflictWarning, setConflictWarning] = React.useState<string | null>(null);
  const [searchKating, setSearchKating] = React.useState("");

  React.useEffect(() => {
    if (presetTanggal) {
      setTanggal(presetTanggal);
    }
  }, [presetTanggal]);

  // Load available kating when date or slot changes (step 3)
  const loadAvailableKating = React.useCallback(async () => {
    if (!tanggal || !selectedSlot) return;
    setIsLoadingKating(true);
    setConflictWarning(null);
    try {
      const katingList = await getAvailableKatingAction(tanggal, selectedSlot.id);
      setAllKatingList(katingList);

      // Deselect any kating that are no longer available
      const availableIds = new Set(katingList.map((k) => k.id));
      setSelectedKatingIds((prev) => {
        const conflictedNames: string[] = [];
        const next = new Set<string>();
        prev.forEach((id) => {
          if (availableIds.has(id)) {
            next.add(id);
          } else {
            const kat = allKatingList.find((k) => k.id === id);
            if (kat) conflictedNames.push(kat.nama);
          }
        });
        if (conflictedNames.length > 0) {
          setConflictWarning(
            `🔴 ${conflictedNames.join(", ")} sudah dibooking pada ${tanggal} ${selectedSlot.nama_slot}. Pilihan otomatis dihapus.`
          );
        }
        return next;
      });
    } catch {
      toast.error("Gagal memuat kating yang tersedia.");
    } finally {
      setIsLoadingKating(false);
    }
  }, [tanggal, selectedSlot, allKatingList]);

  React.useEffect(() => {
    if (step >= 3) {
      loadAvailableKating();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, tanggal, selectedSlot?.id]);

  const toggleKating = (kat: Kating) => {
    setSelectedKatingIds((prev) => {
      const next = new Set(prev);
      if (next.has(kat.id)) {
        next.delete(kat.id);
      } else {
        next.add(kat.id);
      }
      return next;
    });
    setConflictWarning(null);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!tanggal) {
        toast.error("Silakan pilih tanggal booking.");
        return;
      }
    }

    if (step === 2 && !selectedSlot) {
      toast.error("Silakan pilih slot waktu.");
      return;
    }

    if (step === 3 && selectedKatingIds.size === 0) {
      toast.error("Silakan pilih minimal satu kating pendamping.");
      return;
    }

    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitBooking = () => {
    if (!tanggal || !selectedSlot || selectedKatingIds.size === 0) {
      toast.error("Tidak dapat submit: Pilih minimal satu kating pendamping!");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("kelompok_id", kelompokId);
      formData.append("tanggal", tanggal);
      formData.append("slot_id", selectedSlot.id);
      selectedKatingIds.forEach((id) => formData.append("kating_ids", id));
      formData.append("catatan", catatan);
      formData.append("jam_pulang", jamPulang);
      formData.append("tempat_taaruf", tempatTaaruf);

      const res = await createBookingAction(formData);

      if (res.success && res.data) {
        toast.success("✔ Booking berhasil dibuat!");
        onOpenChange(false);
        onBookingCreated(res.data);
        // Reset form
        setStep(1);
        setSelectedKatingIds(new Set());
        setCatatan("");
        setJamPulang("16:30");
        setTempatTaaruf("Masjid SMKN 1 Cimahi");
      } else {
        toast.error(`❌ ${res.message}`);
      }
    });
  };

  // Group kating by gender for display
  const filteredKatingList = React.useMemo(() => {
    if (!searchKating.trim()) return allKatingList;
    const q = searchKating.toLowerCase();
    return allKatingList.filter(
      (k) => k.nama.toLowerCase().includes(q) || k.kelas.toLowerCase().includes(q)
    );
  }, [allKatingList, searchKating]);

  const ikhwanList = filteredKatingList.filter((k) => k.jenis_kelamin === "L");
  const akhwatList = filteredKatingList.filter((k) => k.jenis_kelamin === "P");

  const activeSlots = slotList.filter((s) => s.aktif);

  const formattedDateLabel = new Date(tanggal).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Selected kating objects for preview
  const selectedKatingObjects = allKatingList.filter((k) => selectedKatingIds.has(k.id));
  const selectedIkhwan = selectedKatingObjects.filter((k) => k.jenis_kelamin === "L");
  const selectedAkhwat = selectedKatingObjects.filter((k) => k.jenis_kelamin === "P");

  const STEP_LABELS = ["1. Hari", "2. Slot", "3. Kating", "4. Preview"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold text-base">
            <CalendarDays className="size-5 text-primary" /> Booking Sesi Taaruf Baru
          </DialogTitle>
          <DialogDescription className="text-xs">
            Langkah {step} dari 4: Hari &rarr; Slot &rarr; Kating &rarr; Preview Booking
          </DialogDescription>
        </DialogHeader>

        {/* Stepper Header Bar */}
        <div className="flex items-center justify-between py-2 border-b text-xs font-semibold overflow-x-auto gap-1">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            return (
              <React.Fragment key={stepNum}>
                {i > 0 && <span className="text-muted-foreground shrink-0">&gt;</span>}
                <span className={step >= stepNum ? "text-primary font-bold shrink-0" : "text-muted-foreground shrink-0"}>
                  {label}
                </span>
              </React.Fragment>
            );
          })}
        </div>

        {/* REAL-TIME CONFLICT WARNING BADGE */}
        {conflictWarning && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{conflictWarning}</span>
          </div>
        )}

        {/* STEP CONTENT */}
        <div className="py-3 space-y-4">
          {/* STEP 1: PILIH HARI */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="step-tanggal" className="text-xs font-semibold">
                  Pilih Hari &amp; Tanggal Pelaksanaan
                </Label>
                <Input
                  id="step-tanggal"
                  type="date"
                  min={settings.tanggal_mulai}
                  max={settings.tanggal_selesai}
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Jadwal Resmi Taaruf SMKN 1 Cimahi:</p>
                <p>
                  {settings.tanggal_mulai} s/d {settings.tanggal_selesai} ({settings.nama_acara})
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: PILIH SLOT */}
          {step === 2 && (
            <div className="space-y-3">
              <Label className="text-xs font-semibold">Pilih Slot Waktu Istirahat</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeSlots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between space-y-1 cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-xs">{slot.nama_slot}</span>
                        {isSelected && <CheckCircle2 className="size-4 text-primary" />}
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" /> {slot.jam_mulai} - {slot.jam_selesai} WIB
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <Label htmlFor="jamPulang" className="text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" /> Estimasi Jam Pulang
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Tentukan estimasi waktu jam pulang kelompok secara fleksibel.
                </p>
                <Input
                  id="jamPulang"
                  type="time"
                  value={jamPulang}
                  onChange={(e) => setJamPulang(e.target.value)}
                  className="text-xs w-36 h-9 font-mono font-semibold"
                />
              </div>

              {/* TEMPAT TAARUF SECTION */}
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <Label htmlFor="tempatTaaruf" className="text-xs font-semibold flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" /> Tempat / Lokasi Ta&apos;aruf
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Tentukan lokasi pertemuan (misal: Masjid SMKN 1 Cimahi, Lab RPL 1, Taman Sekolah, dll).
                </p>
                <Input
                  id="tempatTaaruf"
                  type="text"
                  placeholder="Contoh: Masjid SMKN 1 Cimahi / Lab RPL 1"
                  value={tempatTaaruf}
                  onChange={(e) => setTempatTaaruf(e.target.value)}
                  className="text-xs h-9 font-medium"
                />
              </div>
            </div>
          )}

          {/* STEP 3: PILIH KATING (MULTI-SELECT, BEBAS KOMBINASI) */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Pilih Kating Pendamping</Label>
                <Badge variant="outline" className="text-[10px]">
                  <Users className="size-3 mr-1" />
                  {selectedKatingIds.size} dipilih
                </Badge>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Pilih satu atau lebih kating bebas (ikhwan, akhwat, atau campuran).
              </p>

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
                <p className="text-center py-6 text-xs text-muted-foreground">
                  Memeriksa ketersediaan kating real-time...
                </p>
              ) : filteredKatingList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-rose-300 p-6 text-center text-xs text-muted-foreground space-y-1 bg-rose-500/5">
                  <p className="font-semibold text-rose-600">🔴 Seluruh Kating Sudah Dibooking</p>
                  <p>
                    Semua kating pendamping telah dibooking pada {tanggal} slot{" "}
                    {selectedSlot?.nama_slot}. Silakan pilih tanggal atau slot lain.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {/* Ikhwan Section */}
                  {ikhwanList.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-primary uppercase tracking-wider">
                        Ikhwan ({ikhwanList.length} tersedia)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ikhwanList.map((kat) => {
                          const isSelected = selectedKatingIds.has(kat.id);
                          return (
                            <button
                              key={kat.id}
                              type="button"
                              onClick={() => toggleKating(kat)}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                                  : "border-border hover:bg-accent"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs flex items-center gap-1.5">
                                  <Shield className="size-3.5 text-primary" /> {kat.nama}
                                </span>
                                {isSelected && <CheckCircle2 className="size-4 text-primary shrink-0" />}
                              </div>
                              <span className="text-[11px] text-muted-foreground mt-0.5 block">{kat.kelas}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Akhwat Section */}
                  {akhwatList.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Akhwat ({akhwatList.length} tersedia)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {akhwatList.map((kat) => {
                          const isSelected = selectedKatingIds.has(kat.id);
                          return (
                            <button
                              key={kat.id}
                              type="button"
                              onClick={() => toggleKating(kat)}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20"
                                  : "border-border hover:bg-accent"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs flex items-center gap-1.5">
                                  <Shield className="size-3.5 text-emerald-500" /> {kat.nama}
                                </span>
                                {isSelected && <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />}
                              </div>
                              <span className="text-[11px] text-muted-foreground mt-0.5 block">{kat.kelas}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedKatingIds.size > 0 && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
                  <p className="font-semibold text-primary">✓ Kating Terpilih ({selectedKatingIds.size}):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedKatingObjects.map((k) => (
                      <Badge
                        key={k.id}
                        variant="outline"
                        className={`text-[10px] cursor-pointer ${
                          k.jenis_kelamin === "L"
                            ? "border-primary/40 text-primary hover:bg-rose-500/10"
                            : "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                        }`}
                        onClick={() => toggleKating(k)}
                      >
                        {k.nama} ✕
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: BOOKING PREVIEW CARD */}
          {step === 4 && (
            <div className="space-y-4">
              <Card className="glass-card border-primary/20">
                <CardHeader className="py-3 px-4 bg-primary/5 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" /> Preview Booking Sesi
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="size-3 mr-1" /> Edit
                  </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3 pb-2 border-b">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Hari &amp; Tanggal</span>
                      <span className="font-bold text-foreground">{formattedDateLabel}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Slot &amp; Jam Pulang</span>
                      <span className="font-bold text-foreground">
                        {selectedSlot?.nama_slot} ({selectedSlot?.jam_mulai} WIB) &bull; Pulang: {jamPulang || "-"} WIB
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-border/40">
                      <span className="text-muted-foreground block text-[11px]">Tempat Ta&apos;aruf</span>
                      <span className="font-bold text-primary flex items-center gap-1">
                        <MapPin className="size-3 text-primary" /> {tempatTaaruf || "(Belum ditentukan)"}
                      </span>
                    </div>
                  </div>

                  {/* Kating terpilih */}
                  <div className="space-y-1.5">
                    <span className="text-muted-foreground block text-[11px]">Kating Pendamping ({selectedKatingIds.size})</span>
                    <div className="space-y-1">
                      {selectedIkhwan.length > 0 && (
                        <div>
                          <span className="text-[10px] text-primary font-semibold">Ikhwan: </span>
                          <span className="font-semibold text-foreground">{selectedIkhwan.map((k) => k.nama).join(", ")}</span>
                        </div>
                      )}
                      {selectedAkhwat.length > 0 && (
                        <div>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Akhwat: </span>
                          <span className="font-semibold text-foreground">{selectedAkhwat.map((k) => k.nama).join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Anggota Hadir List Preview */}
                  <div className="space-y-1.5 pt-1 border-t">
                    <span className="text-muted-foreground block text-[11px] font-semibold">
                      Anggota Peserta Kelompok:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {anggotaList.length === 0 ? (
                        <span className="text-muted-foreground text-[11px]">Seluruh Anggota Kelompok</span>
                      ) : (
                        anggotaList.map((a) => (
                          <Badge key={a.id} variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            ✔ {a.nama}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  {/* WA Template Preview */}
                  <div className="p-3 rounded-lg border bg-muted/40 text-[11px] space-y-1 mt-2">
                    <div className="font-semibold text-foreground flex items-center gap-1">
                      <MessageSquare className="size-3 text-emerald-500" /> Template WhatsApp Pesan Konfirmasi:
                    </div>
                    <p className="text-muted-foreground italic">
                      &quot;Halo {selectedKatingObjects.map((k) => k.nama).join(" & ")}, kami dari {kelompokNama} mengajukan sesi Taaruf pada hari {tanggal}, slot {selectedSlot?.nama_slot}. Mohon konfirmasinya. Terima kasih!&quot;
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-1">
                <Label htmlFor="catatan" className="text-xs font-semibold">
                  Catatan Tambahan (Opsional)
                </Label>
                <Input
                  id="catatan"
                  placeholder="Contoh: Pembimbingan materi Taaruf"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stepper Navigation Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBack}
            disabled={step === 1 || isPending}
            className="text-xs"
          >
            <ChevronLeft className="mr-1 size-3.5" /> Kembali
          </Button>

          {step < 4 ? (
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              disabled={step === 3 && selectedKatingIds.size === 0}
              className="text-xs bg-primary"
            >
              Lanjut <ChevronRight className="ml-1 size-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleSubmitBooking}
              disabled={isPending || selectedKatingIds.size === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              {isPending ? "Memproses..." : "✔ Konfirmasi & Submit Booking"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

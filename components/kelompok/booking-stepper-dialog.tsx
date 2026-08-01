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
  MessageSquare,
  Search,
  Shield,
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
  const [selectedAkang, setSelectedAkang] = React.useState<Kating | null>(null);
  const [selectedTeteh, setSelectedTeteh] = React.useState<Kating | null>(null);
  const [catatan, setCatatan] = React.useState("");
  const [jamPulang, setJamPulang] = React.useState("16:30");

  // Kating options states
  const [akangList, setAkangList] = React.useState<Kating[]>([]);
  const [tetehList, setTetehList] = React.useState<Kating[]>([]);
  const [isLoadingKating, setIsLoadingKating] = React.useState(false);
  const [conflictWarning, setConflictWarning] = React.useState<string | null>(null);

  const [searchAkang, setSearchAkang] = React.useState("");
  const [searchTeteh, setSearchTeteh] = React.useState("");

  React.useEffect(() => {
    if (presetTanggal) {
      setTanggal(presetTanggal);
    }
  }, [presetTanggal]);

  // Load available Kating when date or slot changes.
  // BUG-22: selectedAkang and selectedTeteh are intentionally excluded from deps.
  // Conflict validation is performed reactively via the returned lists,
  // not by re-fetching every time a kating is selected.
  const loadAvailableKating = React.useCallback(async () => {
    if (!tanggal || !selectedSlot) return;
    setIsLoadingKating(true);
    setConflictWarning(null);
    try {
      const [akangs, tetehs] = await Promise.all([
        getAvailableKatingAction(tanggal, selectedSlot.id, "L"),
        getAvailableKatingAction(tanggal, selectedSlot.id, "P"),
      ]);
      setAkangList(akangs);
      setTetehList(tetehs);

      // Conflict validation: run against the freshly fetched lists
      setSelectedAkang((prev) => {
        if (prev && !akangs.some((k) => k.id === prev.id)) {
          setConflictWarning(`🔴 ${prev.nama} sudah dibooking pada ${tanggal} ${selectedSlot.nama_slot}. Silakan pilih Akang lain.`);
          return null;
        }
        return prev;
      });

      setSelectedTeteh((prev) => {
        if (prev && !tetehs.some((k) => k.id === prev.id)) {
          setConflictWarning(`🔴 ${prev.nama} sudah dibooking pada ${tanggal} ${selectedSlot.nama_slot}. Silakan pilih Teteh lain.`);
          return null;
        }
        return prev;
      });
    } catch {
      toast.error("Gagal memuat kating yang tersedia.");
    } finally {
      setIsLoadingKating(false);
    }
  }, [tanggal, selectedSlot]);

  React.useEffect(() => {
    if (step >= 3) {
      loadAvailableKating();
    }
  }, [step, tanggal, selectedSlot?.id, loadAvailableKating]);

  const handleSelectAkang = (kat: Kating) => {
    setSelectedAkang(kat);
    setConflictWarning(null);
  };

  const handleSelectTeteh = (kat: Kating) => {
    setSelectedTeteh(kat);
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

    if (step === 3 && !selectedAkang) {
      toast.error("Silakan pilih Akang pendamping terlebih dahulu.");
      return;
    }

    if (step === 4 && !selectedTeteh) {
      toast.error("Silakan pilih Teteh pendamping untuk melengkapi pasangan.");
      return;
    }

    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitBooking = () => {
    if (!tanggal || !selectedSlot || !selectedAkang || !selectedTeteh) {
      toast.error("Tidak dapat submit: Pasangan Akang & Teteh belum lengkap!");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("kelompok_id", kelompokId);
      formData.append("tanggal", tanggal);
      formData.append("slot_id", selectedSlot.id);
      formData.append("kating_laki_id", selectedAkang.id);
      formData.append("kating_perempuan_id", selectedTeteh.id);
      formData.append("catatan", catatan);
      formData.append("jam_pulang", jamPulang);

      const res = await createBookingAction(formData);

      if (res.success && res.data) {
        toast.success("✔ Booking berhasil dibuat!");
        onOpenChange(false);
        onBookingCreated(res.data);
        // Reset form
        setStep(1);
        setSelectedAkang(null);
        setSelectedTeteh(null);
        setCatatan("");
        setJamPulang("16:30");
      } else {
        toast.error(`❌ ${res.message}`);
      }
    });
  };

  const filteredAkangs = React.useMemo(() => {
    return akangList.filter((k) => k.nama.toLowerCase().includes(searchAkang.toLowerCase()));
  }, [akangList, searchAkang]);

  const filteredTetehs = React.useMemo(() => {
    return tetehList.filter((k) => k.nama.toLowerCase().includes(searchTeteh.toLowerCase()));
  }, [tetehList, searchTeteh]);

  const activeSlots = slotList.filter((s) => s.aktif);

  const formattedDateLabel = new Date(tanggal).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold text-base">
            <CalendarDays className="size-5 text-primary" /> Booking Sesi Taaruf Baru
          </DialogTitle>
          <DialogDescription className="text-xs">
            Langkah {step} dari 5: Hari &rarr; Slot &rarr; Akang &rarr; Teteh &rarr; Preview Booking
          </DialogDescription>
        </DialogHeader>

        {/* Stepper Header Bar */}
        <div className="flex items-center justify-between py-2 border-b text-xs font-semibold overflow-x-auto">
          <span className={step >= 1 ? "text-primary font-bold" : "text-muted-foreground"}>
            1. Hari
          </span>
          <span className="text-muted-foreground">&gt;</span>
          <span className={step >= 2 ? "text-primary font-bold" : "text-muted-foreground"}>
            2. Slot
          </span>
          <span className="text-muted-foreground">&gt;</span>
          <span className={step >= 3 ? "text-primary font-bold" : "text-muted-foreground"}>
            3. Akang
          </span>
          <span className="text-muted-foreground">&gt;</span>
          <span className={step >= 4 ? "text-primary font-bold" : "text-muted-foreground"}>
            4. Teteh
          </span>
          <span className="text-muted-foreground">&gt;</span>
          <span className={step === 5 ? "text-primary font-bold" : "text-muted-foreground"}>
            5. Preview
          </span>
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
                  Pilih Hari & Tanggal Pelaksanaan
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
            </div>
          )}

          {/* STEP 3: PILIH AKANG */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Pilih Akang Pendamping</Label>
                <Badge variant="outline" className="text-[10px]">
                  Tersedia: {filteredAkangs.length} Akang
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari nama Akang..."
                  value={searchAkang}
                  onChange={(e) => setSearchAkang(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>

              {isLoadingKating ? (
                <p className="text-center py-6 text-xs text-muted-foreground">
                  Memeriksa ketersediaan Akang real-time...
                </p>
              ) : filteredAkangs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-rose-300 p-6 text-center text-xs text-muted-foreground space-y-1 bg-rose-500/5">
                  <p className="font-semibold text-rose-600">🔴 Seluruh Akang Sudah Dibooking</p>
                  <p>
                    Seluruh Akang pendamping telah dibooking oleh kelompok lain pada {tanggal} slot{" "}
                    {selectedSlot?.nama_slot}. Silakan pilih tanggal atau slot lain.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {filteredAkangs.map((kat) => {
                    const isSelected = selectedAkang?.id === kat.id;
                    return (
                      <button
                        key={kat.id}
                        type="button"
                        onClick={() => handleSelectAkang(kat)}
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
                          {isSelected && <CheckCircle2 className="size-4 text-primary" />}
                        </div>
                        <span className="text-[11px] text-muted-foreground mt-0.5 block">{kat.kelas}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: PILIH TETEH */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Pilih Teteh Pendamping</Label>
                <Badge variant="outline" className="text-[10px]">
                  Tersedia: {filteredTetehs.length} Teteh
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari nama Teteh..."
                  value={searchTeteh}
                  onChange={(e) => setSearchTeteh(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>

              {isLoadingKating ? (
                <p className="text-center py-6 text-xs text-muted-foreground">
                  Memeriksa ketersediaan Teteh real-time...
                </p>
              ) : filteredTetehs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-rose-300 p-6 text-center text-xs text-muted-foreground space-y-1 bg-rose-500/5">
                  <p className="font-semibold text-rose-600">🔴 Seluruh Teteh Sudah Dibooking</p>
                  <p>
                    Seluruh Teteh pendamping telah dibooking oleh kelompok lain pada {tanggal} slot{" "}
                    {selectedSlot?.nama_slot}. Silakan pilih slot lain.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {filteredTetehs.map((kat) => {
                    const isSelected = selectedTeteh?.id === kat.id;
                    return (
                      <button
                        key={kat.id}
                        type="button"
                        onClick={() => handleSelectTeteh(kat)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs flex items-center gap-1.5">
                            <Shield className="size-3.5 text-emerald-500" /> {kat.nama}
                          </span>
                          {isSelected && <CheckCircle2 className="size-4 text-primary" />}
                        </div>
                        <span className="text-[11px] text-muted-foreground mt-0.5 block">{kat.kelas}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: BOOKING PREVIEW CARD */}
          {step === 5 && (
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
                      <span className="text-muted-foreground block text-[11px]">Hari & Tanggal</span>
                      <span className="font-bold text-foreground">{formattedDateLabel}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Slot & Jam Pulang</span>
                      <span className="font-bold text-foreground">
                        {selectedSlot?.nama_slot} ({selectedSlot?.jam_mulai} WIB) &bull; Pulang: {jamPulang || "-"} WIB
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-2 border-b">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Akang Pendamping</span>
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <Shield className="size-3 text-primary shrink-0" /> {selectedAkang?.nama}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Teteh Pendamping</span>
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <Shield className="size-3 text-emerald-500 shrink-0" /> {selectedTeteh?.nama}
                      </span>
                    </div>
                  </div>

                  {/* Anggota Hadir List Preview */}
                  <div className="space-y-1.5 pt-1">
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
                      &quot;Halo Akang {selectedAkang?.nama} & Teteh {selectedTeteh?.nama}, kami dari {kelompokNama} mengajukan sesi Taaruf pada hari {tanggal}, slot {selectedSlot?.nama_slot}. Mohon konfirmasinya. Terima kasih!&quot;
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

          {step < 5 ? (
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              disabled={
                (step === 3 && !selectedAkang) || (step === 4 && !selectedTeteh)
              }
              className="text-xs bg-primary"
            >
              Lanjut <ChevronRight className="ml-1 size-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleSubmitBooking}
              disabled={isPending || !selectedAkang || !selectedTeteh}
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

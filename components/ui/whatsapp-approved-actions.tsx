"use client";

import * as React from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MapPin,
  MessageSquare,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { updateBookingContactedAction } from "@/services/booking.actions";
import {
  checkIsOperationalHours,
  generateApprovedBookingWAMessage,
  openWhatsAppLink,
} from "@/utils/whatsapp-helper";
import type { Anggota, BookingWithDetails, KatingBasic } from "@/types/database";

interface WhatsAppApprovedActionsProps {
  booking: BookingWithDetails;
  anggotaList?: Anggota[];
  ketuaNama?: string;
  kelasNama?: string;
  className?: string;
  onContactedUpdate?: (bookingId: string, katingId: string, timeStr: string) => void;
}

export function WhatsAppApprovedActions({
  booking,
  anggotaList = [],
  ketuaNama,
  kelasNama,
  className,
  onContactedUpdate,
}: WhatsAppApprovedActionsProps) {
  // Dialog States
  const [activeKating, setActiveKating] = React.useState<KatingBasic | null>(null);
  const [isHoursDialogOpen, setIsHoursDialogOpen] = React.useState(false);
  const [isTempatDialogOpen, setIsTempatDialogOpen] = React.useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = React.useState(false);
  const [isNoPhoneDialogOpen, setIsNoPhoneDialogOpen] = React.useState(false);

  const [tempatTaaruf, setTempatTaaruf] = React.useState("");
  const [isCopied, setIsCopied] = React.useState(false);

  // Local contacted tracking per kating_id
  const [contactedMap, setContactedMap] = React.useState<Map<string, { contacted: boolean; time: string | null }>>(() => {
    const map = new Map();
    (booking.kating_list ?? []).forEach((k) => {
      map.set(k.id, { contacted: Boolean(k.contacted), time: k.contacted_at || null });
    });
    return map;
  });

  // Sync if props update
  React.useEffect(() => {
    const map = new Map();
    (booking.kating_list ?? []).forEach((k) => {
      map.set(k.id, { contacted: Boolean(k.contacted), time: k.contacted_at || null });
    });
    setContactedMap(map);
  }, [booking]);

  // Only display if booking status is "Disetujui"
  if (booking.status !== "Disetujui") {
    return null;
  }

  const katingList = booking.kating_list ?? [];

  // STEP 1: Click Chat Kating
  const handleInitiateChat = (kating: KatingBasic) => {
    setActiveKating(kating);

    // Missing Number Validation
    if (!kating.nomor_whatsapp || !kating.nomor_whatsapp.trim()) {
      setIsNoPhoneDialogOpen(true);
      return;
    }

    // Operational Hours Check (06:00 - 20:00 WIB)
    const isWithinHours = checkIsOperationalHours();
    if (!isWithinHours) {
      setIsHoursDialogOpen(true);
      return;
    }

    // Proceed to Tempat Taaruf input or direct preview if already set
    if (booking.tempat_taaruf) {
      setTempatTaaruf(booking.tempat_taaruf);
      setIsPreviewDialogOpen(true);
    } else {
      setTempatTaaruf("");
      setIsTempatDialogOpen(true);
    }
  };

  // Step 2: From Hours Dialog -> "Tetap Kirim"
  const handleConfirmOutsideHours = () => {
    setIsHoursDialogOpen(false);
    if (booking.tempat_taaruf) {
      setTempatTaaruf(booking.tempat_taaruf);
      setIsPreviewDialogOpen(true);
    } else {
      setTempatTaaruf("");
      setIsTempatDialogOpen(true);
    }
  };

  // Step 3: From Tempat Taaruf Dialog -> "Lanjutkan"
  const handleConfirmTempat = () => {
    setIsTempatDialogOpen(false);
    setIsPreviewDialogOpen(true);
  };

  // Step 4: Final Send -> "Buka WhatsApp"
  const handleFinalOpenWhatsApp = () => {
    if (!activeKating) return;

    const payload = generateApprovedBookingWAMessage({
      booking,
      targetKating: activeKating,
      anggotaList,
      ketuaNama,
      kelasNama,
      tempatTaaruf,
    });

    openWhatsAppLink(payload.targetPhone, payload.message);
    setIsPreviewDialogOpen(false);

    // Update Delivery Status & Timestamp
    const nowTimeStr =
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB";

    setContactedMap((prev) => {
      const next = new Map(prev);
      next.set(activeKating.id, { contacted: true, time: nowTimeStr });
      return next;
    });

    if (onContactedUpdate) {
      onContactedUpdate(booking.id, activeKating.id, nowTimeStr);
    }

    // Fire background server action
    updateBookingContactedAction(booking.id, activeKating.id);

    toast.success(`Membuka WhatsApp untuk ${payload.targetName}...`);
  };

  // Step 5: Copy Template Action
  const handleCopyTemplate = (kating?: KatingBasic) => {
    const target = kating || activeKating || katingList[0];
    if (!target) return;

    const payload = generateApprovedBookingWAMessage({
      booking,
      targetKating: target,
      anggotaList,
      ketuaNama,
      kelasNama,
      tempatTaaruf,
    });
    navigator.clipboard.writeText(payload.message);
    setIsCopied(true);
    toast.success("✔ Template berhasil disalin.");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Computed preview payload
  const currentPreviewPayload = activeKating
    ? generateApprovedBookingWAMessage({
        booking,
        targetKating: activeKating,
        anggotaList,
        ketuaNama,
        kelasNama,
        tempatTaaruf,
      })
    : null;

  const allContacted = katingList.every((k) => contactedMap.get(k.id)?.contacted);

  return (
    <div className={`space-y-2 ${className || ""}`}>
      {/* Status Komunikasi Indicators */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-muted-foreground text-[11px]">Status Komunikasi:</span>

        {katingList.map((k) => {
          const info = contactedMap.get(k.id);
          const isContacted = info?.contacted;
          return isContacted ? (
            <Badge
              key={k.id}
              variant="success"
              className="text-[10px] gap-1 bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
            >
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span>✓ {k.nama.split(" ")[0]} ({info?.time || "Sudah Dihubungi"})</span>
            </Badge>
          ) : (
            <Badge key={k.id} variant="outline" className="text-[10px] gap-1 text-muted-foreground">
              <span>☐ {k.nama.split(" ")[0]}</span>
            </Badge>
          );
        })}

        {allContacted && katingList.length > 0 && (
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            (Semua Kating sudah dihubungi)
          </span>
        )}
      </div>

      {/* Responsive Action Buttons */}
      <div className="flex flex-wrap items-stretch sm:items-center gap-2">
        {katingList.map((k) => {
          const info = contactedMap.get(k.id);
          const isContacted = info?.contacted;
          return (
            <Button
              key={k.id}
              type="button"
              size="sm"
              onClick={() => handleInitiateChat(k)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex-1 sm:flex-initial"
            >
              {k.jenis_kelamin === "L" ? (
                <Send className="mr-1.5 size-3.5" />
              ) : (
                <MessageSquare className="mr-1.5 size-3.5" />
              )}
              {isContacted ? `Chat Lagi (${k.nama.split(" ")[0]})` : `Chat ${k.nama.split(" ")[0]}`}
            </Button>
          );
        })}

        {/* Tombol Copy Template */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleCopyTemplate()}
          className="text-xs font-semibold flex-1 sm:flex-initial border-input hover:bg-muted"
        >
          <Copy className="mr-1.5 size-3.5 text-muted-foreground" />
          Copy Template
        </Button>
      </div>

      {/* DIALOG 1: Operational Hours Warning Dialog */}
      <Dialog open={isHoursDialogOpen} onOpenChange={setIsHoursDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-base font-bold">
              <Clock className="size-5" /> Jam Operasional WhatsApp
            </DialogTitle>
            <DialogDescription className="text-xs pt-1 leading-relaxed">
              Saat ini berada di luar jam operasional (<strong>06.00–20.00 WIB</strong>). Apakah Anda tetap ingin membuka WhatsApp?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsHoursDialogOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmOutsideHours}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
            >
              Tetap Kirim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Tempat Taaruf Input Dialog */}
      <Dialog open={isTempatDialogOpen} onOpenChange={setIsTempatDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary text-base font-bold">
              <MapPin className="size-5" /> Tentukan Tempat Ta&apos;aruf
            </DialogTitle>
            <DialogDescription className="text-xs">
              Masukkan lokasi pertemuan sesi Taaruf jika sudah disepakati.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="tempat_taaruf_input" className="text-xs font-semibold">
                Tempat Ta&apos;aruf:
              </Label>
              <Input
                id="tempat_taaruf_input"
                type="text"
                placeholder="Contoh: Lab RPL 1 / Masjid SMKN 1 Cimahi"
                value={tempatTaaruf}
                onChange={(e) => setTempatTaaruf(e.target.value)}
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                *Kosongkan apabila ingin mengisi manual di WhatsApp.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTempatDialogOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmTempat}
              className="bg-primary text-primary-foreground text-xs font-semibold"
            >
              Lanjutkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: Preview Message Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-base font-bold">
              <Send className="size-5" /> Pratinjau Pesan WhatsApp ({activeKating?.nama})
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pesan berikut akan otomatis diisikan pada aplikasi WhatsApp Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="rounded-xl bg-emerald-950/10 dark:bg-emerald-950/40 border border-emerald-500/30 p-3 text-xs font-sans leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
              {currentPreviewPayload?.message}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewDialogOpen(false)}
              className="text-xs"
            >
              Kembali
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopyTemplate()}
              className="text-xs"
            >
              {isCopied ? <Check className="mr-1 size-3.5 text-emerald-500" /> : <Copy className="mr-1 size-3.5" />}
              {isCopied ? "Tersalin!" : "Copy"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleFinalOpenWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              <ExternalLink className="mr-1.5 size-3.5" /> Buka WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: Nomor Belum Diisi Dialog */}
      <Dialog open={isNoPhoneDialogOpen} onOpenChange={setIsNoPhoneDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-base font-bold">
              <AlertTriangle className="size-5" /> Nomor WhatsApp Belum Tersedia
            </DialogTitle>
            <DialogDescription className="text-xs pt-1 leading-relaxed">
              Nomor WhatsApp Kating ({activeKating?.nama}) belum diisi di sistem. Silakan hubungi Admin untuk memperbarui data Kating.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNoPhoneDialogOpen(false)}
              className="text-xs"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

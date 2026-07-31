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
import type { Anggota, BookingWithDetails } from "@/types/database";

interface WhatsAppApprovedActionsProps {
  booking: BookingWithDetails;
  anggotaList?: Anggota[];
  ketuaNama?: string;
  kelasNama?: string;
  className?: string;
  onContactedUpdate?: (bookingId: string, gender: "L" | "P", timeStr: string) => void;
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
  const [activeGender, setActiveGender] = React.useState<"L" | "P">("L");
  const [isHoursDialogOpen, setIsHoursDialogOpen] = React.useState(false);
  const [isTempatDialogOpen, setIsTempatDialogOpen] = React.useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = React.useState(false);
  const [isNoPhoneDialogOpen, setIsNoPhoneDialogOpen] = React.useState(false);

  const [tempatTaaruf, setTempatTaaruf] = React.useState("");
  const [isCopied, setIsCopied] = React.useState(false);

  // Local contacted tracking
  const [localAkangContacted, setLocalAkangContacted] = React.useState<boolean>(
    Boolean(booking.akang_contacted)
  );
  const [localAkangTime, setLocalAkangTime] = React.useState<string | null>(
    booking.akang_contacted_at || null
  );

  const [localTetehContacted, setLocalTetehContacted] = React.useState<boolean>(
    Boolean(booking.teteh_contacted)
  );
  const [localTetehTime, setLocalTetehTime] = React.useState<string | null>(
    booking.teteh_contacted_at || null
  );

  // Sync if props update
  React.useEffect(() => {
    setLocalAkangContacted(Boolean(booking.akang_contacted));
    setLocalAkangTime(booking.akang_contacted_at || null);
    setLocalTetehContacted(Boolean(booking.teteh_contacted));
    setLocalTetehTime(booking.teteh_contacted_at || null);
  }, [booking]);

  // REQUIREMENT 1: Only display if booking status is "Disetujui"
  if (booking.status !== "Disetujui") {
    return null;
  }

  // STEP 1: Click Chat Akang or Chat Teteh
  const handleInitiateChat = (gender: "L" | "P") => {
    setActiveGender(gender);
    const isAkang = gender === "L";
    const phone = isAkang ? booking.kating_laki_wa : booking.kating_perempuan_wa;

    // Requirement 7: Missing Number Validation
    if (!phone || !phone.trim()) {
      setIsNoPhoneDialogOpen(true);
      return;
    }

    // Requirement 1: Operational Hours Check (06:00 - 20:00 WIB)
    const isWithinHours = checkIsOperationalHours();
    if (!isWithinHours) {
      setIsHoursDialogOpen(true);
      return;
    }

    // Proceed to Tempat Taaruf input
    setTempatTaaruf("");
    setIsTempatDialogOpen(true);
  };

  // Step 2: From Hours Dialog -> "Tetap Kirim"
  const handleConfirmOutsideHours = () => {
    setIsHoursDialogOpen(false);
    setTempatTaaruf("");
    setIsTempatDialogOpen(true);
  };

  // Step 3: From Tempat Taaruf Dialog -> "Lanjutkan"
  const handleConfirmTempat = () => {
    setIsTempatDialogOpen(false);
    setIsPreviewDialogOpen(true);
  };

  // Step 4: Final Send -> "Buka WhatsApp"
  const handleFinalOpenWhatsApp = () => {
    const payload = generateApprovedBookingWAMessage({
      booking,
      targetGender: activeGender,
      anggotaList,
      ketuaNama,
      kelasNama,
      tempatTaaruf,
    });

    openWhatsAppLink(payload.targetPhone, payload.message);
    setIsPreviewDialogOpen(false);

    // Requirement 2 & 4: Update Delivery Status & Timestamp
    const nowTimeStr =
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB";

    if (activeGender === "L") {
      setLocalAkangContacted(true);
      setLocalAkangTime(nowTimeStr);
      if (onContactedUpdate) onContactedUpdate(booking.id, "L", nowTimeStr);
    } else {
      setLocalTetehContacted(true);
      setLocalTetehTime(nowTimeStr);
      if (onContactedUpdate) onContactedUpdate(booking.id, "P", nowTimeStr);
    }

    // Fire background server action
    updateBookingContactedAction(booking.id, activeGender);

    toast.success(`Membuka WhatsApp untuk ${payload.targetName}...`);
  };

  // Step 5: Copy Template Action
  const handleCopyTemplate = () => {
    const payload = generateApprovedBookingWAMessage({
      booking,
      targetGender: activeGender || "L",
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
  const currentPreviewPayload = generateApprovedBookingWAMessage({
    booking,
    targetGender: activeGender,
    anggotaList,
    ketuaNama,
    kelasNama,
    tempatTaaruf,
  });

  const bothContacted = localAkangContacted && localTetehContacted;

  return (
    <div className={`space-y-2 ${className || ""}`}>
      {/* Requirement 3: Status Komunikasi Indicators */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-muted-foreground text-[11px]">Status Komunikasi:</span>

        {/* Akang Indicator */}
        {localAkangContacted ? (
          <Badge variant="success" className="text-[10px] gap-1 bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
            <CheckCircle2 className="size-3 text-emerald-500" />
            <span>✓ Akang ({localAkangTime || "Sudah Dihubungi"})</span>
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
            <span>☐ Akang</span>
          </Badge>
        )}

        {/* Teteh Indicator */}
        {localTetehContacted ? (
          <Badge variant="success" className="text-[10px] gap-1 bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
            <CheckCircle2 className="size-3 text-emerald-500" />
            <span>✓ Teteh ({localTetehTime || "Sudah Dihubungi"})</span>
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
            <span>☐ Teteh</span>
          </Badge>
        )}

        {bothContacted && (
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            (Semua Kating sudah dihubungi)
          </span>
        )}
      </div>

      {/* Requirement 10: Responsive Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Tombol Chat Akang */}
        <Button
          type="button"
          size="sm"
          onClick={() => handleInitiateChat("L")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex-1 sm:flex-initial"
        >
          <Send className="mr-1.5 size-3.5" />
          {localAkangContacted ? "Chat Lagi (Akang)" : "Chat Akang"}
        </Button>

        {/* Tombol Chat Teteh */}
        <Button
          type="button"
          size="sm"
          onClick={() => handleInitiateChat("P")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex-1 sm:flex-initial"
        >
          <MessageSquare className="mr-1.5 size-3.5" />
          {localTetehContacted ? "Chat Lagi (Teteh)" : "Chat Teteh"}
        </Button>

        {/* Tombol Copy Template */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyTemplate}
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
              <Send className="size-5" /> Pratinjau Pesan WhatsApp
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pesan berikut akan otomatis diisikan pada aplikasi WhatsApp Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="rounded-xl bg-emerald-950/10 dark:bg-emerald-950/40 border border-emerald-500/30 p-3 text-xs font-sans leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
              {currentPreviewPayload.message}
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
              onClick={handleCopyTemplate}
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
              Nomor WhatsApp Kating ({activeGender === "L" ? booking.kating_laki_nama || "Akang" : booking.kating_perempuan_nama || "Teteh"}) belum diisi di sistem. Silakan hubungi Admin untuk memperbarui data Kating.
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

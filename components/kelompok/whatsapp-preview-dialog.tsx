"use client";

import * as React from "react";
import { Check, Copy, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  generateApprovedBookingWAMessage,
  openWhatsAppLink,
} from "@/utils/whatsapp-helper";
import type { Anggota, BookingWithDetails, WhatsAppTemplate } from "@/types/database";

interface WhatsAppPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithDetails | null;
  templates?: WhatsAppTemplate[];
  anggotaList?: Anggota[];
}

export function WhatsAppPreviewDialog({
  open,
  onOpenChange,
  booking,
  anggotaList = [],
}: WhatsAppPreviewDialogProps) {
  const [isCopied, setIsCopied] = React.useState(false);

  if (!booking) return null;

  const akangPayload = generateApprovedBookingWAMessage({
    booking,
    targetGender: "L",
    anggotaList,
  });

  const tetehPayload = generateApprovedBookingWAMessage({
    booking,
    targetGender: "P",
    anggotaList,
  });

  const handleCopyText = () => {
    navigator.clipboard.writeText(akangPayload.message);
    setIsCopied(true);
    toast.success("✔ Template berhasil disalin.");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-base font-bold">
            <MessageSquare className="size-5" /> Generator WhatsApp Taaruf
          </DialogTitle>
          <DialogDescription className="text-xs">
            Hubungi Akang & Teteh pendamping secara langsung menggunakan format pesan otomatis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Booking Summary Box */}
          <div className="rounded-xl border bg-muted/40 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-foreground">
              <span>{booking.kelompok_nama}</span>
              <span className="text-primary">{booking.tanggal}</span>
            </div>
            <div className="text-muted-foreground flex justify-between">
              <span>Slot: {booking.slot_nama} ({booking.jam_mulai} - {booking.jam_selesai})</span>
            </div>
            <div className="border-t border-border pt-1.5 flex justify-between font-medium">
              <span>Akang: {booking.kating_laki_nama}</span>
              <span>Teteh: {booking.kating_perempuan_nama}</span>
            </div>
          </div>

          {/* Chat Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground">Pratinjau Pesan WhatsApp:</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyText}
                className="h-7 text-[11px] gap-1"
              >
                {isCopied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                {isCopied ? "Tersalin!" : "Copy Template"}
              </Button>
            </div>
            <div className="rounded-xl bg-emerald-950/10 dark:bg-emerald-950/40 border border-emerald-500/30 p-3 text-xs font-sans leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
              {akangPayload.message}
            </div>
          </div>

          {/* Action Buttons Responsive */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (!akangPayload.targetPhone) {
                  toast.error("Nomor WhatsApp Akang tidak tersedia.");
                  return;
                }
                openWhatsAppLink(akangPayload.targetPhone, akangPayload.message);
                toast.success(`Membuka WhatsApp untuk ${akangPayload.targetName}...`);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex-1"
            >
              <Send className="mr-1.5 size-3.5" /> Chat Akang ({booking.kating_laki_nama?.split(" ")[0] || "Akang"})
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (!tetehPayload.targetPhone) {
                  toast.error("Nomor WhatsApp Teteh tidak tersedia.");
                  return;
                }
                openWhatsAppLink(tetehPayload.targetPhone, tetehPayload.message);
                toast.success(`Membuka WhatsApp untuk ${tetehPayload.targetName}...`);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex-1"
            >
              <MessageSquare className="mr-1.5 size-3.5" /> Chat Teteh ({booking.kating_perempuan_nama?.split(" ")[0] || "Teteh"})
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyText}
              className="text-xs font-semibold flex-1 border-input hover:bg-muted"
            >
              <Copy className="mr-1.5 size-3.5 text-muted-foreground" /> Copy Template
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

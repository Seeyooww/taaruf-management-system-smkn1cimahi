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
import type { Anggota, BookingWithDetails, KatingBasic, WhatsAppTemplate } from "@/types/database";

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
  const [selectedKatingIndex, setSelectedKatingIndex] = React.useState(0);
  const [isCopied, setIsCopied] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setSelectedKatingIndex(0);
    }
  }, [open]);

  if (!booking) return null;

  const katingList: KatingBasic[] = booking.kating_list ?? [];
  const currentKating = katingList[selectedKatingIndex] || katingList[0];

  const payload = currentKating
    ? generateApprovedBookingWAMessage({
        booking,
        targetKating: currentKating,
        anggotaList,
      })
    : { message: "", targetPhone: "", targetName: "" };

  const handleCopyText = () => {
    navigator.clipboard.writeText(payload.message);
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
            Hubungi kating pendamping secara langsung menggunakan format pesan otomatis.
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
              {booking.tempat_taaruf && <span>Tempat: {booking.tempat_taaruf}</span>}
            </div>
            <div className="border-t border-border pt-1.5 flex flex-wrap gap-2 font-medium">
              <span className="text-muted-foreground">Kating Pendamping:</span>
              <span>{katingList.map((k) => k.nama).join(", ") || "-"}</span>
            </div>
          </div>

          {/* Kating Selector Tabs if multiple kating */}
          {katingList.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Target Pesan:</span>
              {katingList.map((k, idx) => (
                <Button
                  key={k.id}
                  type="button"
                  variant={selectedKatingIndex === idx ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedKatingIndex(idx)}
                  className="h-7 text-xs px-2.5 shrink-0"
                >
                  {k.nama.split(" ")[0]} ({k.jenis_kelamin === "L" ? "Ikhwan" : "Akhwat"})
                </Button>
              ))}
            </div>
          )}

          {/* Chat Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground">
                Pratinjau Pesan WhatsApp ({currentKating?.nama}):
              </label>
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
              {payload.message}
            </div>
          </div>

          {/* Action Buttons Responsive */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
            {katingList.map((k) => {
              const kPayload = generateApprovedBookingWAMessage({
                booking,
                targetKating: k,
                anggotaList,
              });
              return (
                <Button
                  key={k.id}
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (!kPayload.targetPhone) {
                      toast.error(`Nomor WhatsApp ${k.nama} tidak tersedia.`);
                      return;
                    }
                    openWhatsAppLink(kPayload.targetPhone, kPayload.message);
                    toast.success(`Membuka WhatsApp untuk ${kPayload.targetName}...`);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex-1"
                >
                  {k.jenis_kelamin === "L" ? <Send className="mr-1.5 size-3.5" /> : <MessageSquare className="mr-1.5 size-3.5" />}
                  Chat {k.nama.split(" ")[0]}
                </Button>
              );
            })}

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

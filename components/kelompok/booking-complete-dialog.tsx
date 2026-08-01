"use client";

import * as React from "react";
import { CheckSquare, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { calculateBookingProgressAction } from "@/services/progress.actions";
import type { Anggota, BookingWithDetails } from "@/types/database";

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
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
      setError(null);
    }
  }, [open]);

  const toggleAnggota = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSimpan = async () => {
    if (!booking) return;
    if (selectedIds.size === 0) {
      setError("Pilih minimal 1 anggota yang hadir.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await calculateBookingProgressAction(
        booking.id,
        Array.from(selectedIds)
      );

      if (result.success) {
        onCompleted(booking.id);
        onOpenChange(false);
      } else {
        setError(result.message || "Gagal menyimpan progress.");
      }
    } catch (e) {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const aktifAnggota = anggotaList.filter((a) => a.aktif);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="size-5 text-emerald-500" />
            Tandai Taaruf Selesai
          </DialogTitle>
          <DialogDescription>
            Pilih anggota kelompok yang <strong>hadir</strong> dalam sesi taaruf ini.
            Progress kating akan bertambah untuk anggota yang dipilih.
          </DialogDescription>
        </DialogHeader>

        {booking && (
          <div className="rounded-lg bg-muted/40 border px-3 py-2 text-xs space-y-0.5 mb-1">
            <p className="font-semibold">{booking.tanggal} · {booking.slot_nama}</p>
            <p className="text-muted-foreground">
              Akang: {booking.kating_laki_nama} · Teteh: {booking.kating_perempuan_nama}
            </p>
          </div>
        )}

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {aktifAnggota.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground flex flex-col items-center gap-2">
              <Users className="size-8 opacity-40" />
              <span>Belum ada data anggota untuk kelompok ini.</span>
            </div>
          ) : (
            aktifAnggota.map((a) => (
              <label
                key={a.id}
                htmlFor={`anggota-${a.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <Checkbox
                  id={`anggota-${a.id}`}
                  checked={selectedIds.has(a.id)}
                  onCheckedChange={() => toggleAnggota(a.id)}
                />
                <div className="flex-1 text-sm">
                  <span className="font-medium">{a.nama}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {a.jenis_kelamin === "L" ? "Ikhwan" : "Akhwat"}
                </Badge>
              </label>
            ))
          )}
        </div>

        {error && (
          <p className="text-xs text-destructive font-medium">{error}</p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSimpan}
            disabled={isLoading || aktifAnggota.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            {isLoading ? "Menyimpan..." : `Simpan (${selectedIds.size} hadir)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

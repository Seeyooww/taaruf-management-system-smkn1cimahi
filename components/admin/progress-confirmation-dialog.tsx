"use client";

import * as React from "react";
import { Activity, Search, UserCheck, Users } from "lucide-react";
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
import { calculateBookingProgressAction } from "@/services/progress.actions";
import type { Anggota, BookingWithDetails } from "@/types/database";

interface ProgressConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithDetails | null;
  allAnggotaList: Anggota[];
  onProgressCalculated: () => void;
}

export function ProgressConfirmationDialog({
  open,
  onOpenChange,
  booking,
  allAnggotaList,
  onProgressCalculated,
}: ProgressConfirmationDialogProps) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [searchSubstitute, setSearchSubstitute] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  // Members of the booking's kelompok
  const kelompokMembers = React.useMemo(() => {
    if (!booking) return [];
    return allAnggotaList.filter((a) => a.kelompok_id === booking.kelompok_id);
  }, [booking, allAnggotaList]);

  // Reset selected IDs when booking changes (Default: all kelompok members checked)
  React.useEffect(() => {
    if (booking) {
      const defaultIds = new Set(
        allAnggotaList
          .filter((a) => a.kelompok_id === booking.kelompok_id)
          .map((a) => a.id)
      );
      setSelectedIds(defaultIds);
    }
  }, [booking, allAnggotaList]);

  if (!booking) return null;

  const toggleCheck = (id: string) => {
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

  // Filter substitute candidates (members NOT in this kelompok)
  const substituteCandidates = allAnggotaList.filter((a) => {
    const notInKelompok = a.kelompok_id !== booking.kelompok_id;
    const match = a.nama.toLowerCase().includes(searchSubstitute.toLowerCase());
    return notInKelompok && match;
  });

  const handleConfirm = () => {
    const presentIds = Array.from(selectedIds);
    if (presentIds.length === 0) {
      toast.error("Silakan centang minimal 1 anggota yang hadir.");
      return;
    }

    startTransition(async () => {
      const res = await calculateBookingProgressAction(booking.id, presentIds);
      if (res.success) {
        toast.success(res.message);
        onOpenChange(false);
        onProgressCalculated();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Activity className="size-5" /> Konfirmasi Presensi & Hitung Progress
          </DialogTitle>
          <DialogDescription className="text-xs">
            Checklist anggota yang hadir pada sesi ini. Anggota yang centang akan mendapatkan penambahan progress kating.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Booking Context Banner */}
          <div className="rounded-xl border bg-muted/30 p-3 text-xs space-y-1">
            <div className="flex justify-between font-bold text-foreground">
              <span>{booking.kelompok_nama}</span>
              <span className="text-primary">{booking.tanggal}</span>
            </div>
            <div className="text-muted-foreground flex justify-between">
              <span>Slot: {booking.slot_nama}</span>
              <span>
                Akang: {booking.kating_laki_nama} &bull; Teteh: {booking.kating_perempuan_nama}
              </span>
            </div>
          </div>

          {/* Kelompok Member Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Users className="size-4 text-primary" /> Anggota Kelompok ({kelompokMembers.length})
              </Label>
              <Badge variant="outline" className="text-[10px]">
                Hadir: {selectedIds.size} Anggota
              </Badge>
            </div>

            <div className="rounded-xl border p-3 space-y-2 bg-card max-h-48 overflow-y-auto">
              {kelompokMembers.map((member) => {
                const isChecked = selectedIds.has(member.id);
                return (
                  <div
                    key={member.id}
                    onClick={() => toggleCheck(member.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                      isChecked
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-border bg-muted/20 opacity-60"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`check-${member.id}`}
                        checked={isChecked}
                        onCheckedChange={() => toggleCheck(member.id)}
                      />
                      <span className="text-xs font-semibold text-foreground">
                        {member.nama} ({member.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"})
                      </span>
                    </div>
                    {isChecked ? (
                      <Badge variant="success">Hadir (+2 Progress)</Badge>
                    ) : (
                      <Badge variant="destructive">Tidak Hadir (0 Progress)</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Peserta Pengganti / Tambahan Section */}
          <div className="space-y-2 border-t pt-3">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <UserCheck className="size-4 text-indigo-500" /> Tambah Peserta Pengganti (Dari Kelompok Lain)
            </Label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari nama peserta pengganti..."
                value={searchSubstitute}
                onChange={(e) => setSearchSubstitute(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            {searchSubstitute && (
              <div className="rounded-xl border p-2 space-y-1 max-h-36 overflow-y-auto bg-card">
                {substituteCandidates.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground text-center py-2">
                    Tidak ditemukan peserta pengganti.
                  </p>
                ) : (
                  substituteCandidates.map((cand) => {
                    const isChecked = selectedIds.has(cand.id);
                    return (
                      <div
                        key={cand.id}
                        onClick={() => toggleCheck(cand.id)}
                        className={`flex items-center justify-between p-1.5 rounded-md border text-xs cursor-pointer ${
                          isChecked ? "bg-indigo-500/10 border-indigo-500/40" : "hover:bg-accent"
                        }`}
                      >
                        <span>
                          {cand.nama} ({cand.kelompok_nama || "Kelompok Lain"})
                        </span>
                        <Button size="sm" variant={isChecked ? "destructive" : "outline"} className="h-6 px-2 text-[10px]">
                          {isChecked ? "Batal" : "+ Tambah Hadir"}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            {isPending ? "Menghitung..." : "Hitung & Simpan Progress"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

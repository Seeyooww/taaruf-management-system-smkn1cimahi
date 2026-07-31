"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Search,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getAnggotaAction } from "@/services/anggota.actions";
import { getBookingAction } from "@/services/booking.actions";
import { getKatingAction } from "@/services/kating.actions";
import { getKelompokAction } from "@/services/kelompok.actions";
import type { Anggota, BookingWithDetails, Kating, Kelompok } from "@/types/database";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const [query, setQuery] = React.useState("");

  const [kelompokList, setKelompokList] = React.useState<Kelompok[]>([]);
  const [anggotaList, setAnggotaList] = React.useState<Anggota[]>([]);
  const [katingList, setKatingList] = React.useState<Kating[]>([]);
  const [bookingList, setBookingList] = React.useState<BookingWithDetails[]>([]);

  const [isLoading, setIsLoading] = React.useState(false);

  // Load data when dialog opens
  React.useEffect(() => {
    if (open) {
      setIsLoading(true);
      Promise.all([
        getKelompokAction(),
        getAnggotaAction(),
        getKatingAction(),
        getBookingAction(),
      ])
        .then(([kel, ang, kat, book]) => {
          setKelompokList(kel);
          setAnggotaList(ang);
          setKatingList(kat);
          setBookingList(book);
        })
        .finally(() => setIsLoading(false));
    }
  }, [open]);

  // Global search filtering
  const results = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return { kelompok: [], anggota: [], kating: [], booking: [] };

    const matchingKelompok = kelompokList.filter(
      (k) =>
        k.nomor_kelompok.toString().includes(q) ||
        k.kelas.toLowerCase().includes(q) ||
        k.username.toLowerCase().includes(q)
    );

    const matchingAnggota = anggotaList.filter(
      (a) =>
        a.nama.toLowerCase().includes(q) ||
        (a.kelompok_nama && a.kelompok_nama.toLowerCase().includes(q))
    );

    const matchingKating = katingList.filter(
      (k) => k.nama.toLowerCase().includes(q) || k.kelas.toLowerCase().includes(q)
    );

    const matchingBooking = bookingList.filter(
      (b) =>
        b.tanggal.includes(q) ||
        (b.kelompok_nama && b.kelompok_nama.toLowerCase().includes(q)) ||
        (b.kating_laki_nama && b.kating_laki_nama.toLowerCase().includes(q)) ||
        (b.kating_perempuan_nama && b.kating_perempuan_nama.toLowerCase().includes(q))
    );

    return {
      kelompok: matchingKelompok,
      anggota: matchingAnggota,
      kating: matchingKating,
      booking: matchingBooking,
    };
  }, [query, kelompokList, anggotaList, katingList, bookingList]);

  const totalResults =
    results.kelompok.length +
    results.anggota.length +
    results.kating.length +
    results.booking.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center px-4 border-b border-border bg-card">
          <Search className="size-5 text-muted-foreground shrink-0" />
          <Input
            placeholder="Ketik kata kunci (Kelompok, Anggota, Kating, Booking)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 text-sm h-14 bg-transparent"
            autoFocus
          />
        </div>

        {/* Results Body */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
          {isLoading ? (
            <p className="text-center py-8 text-xs text-muted-foreground">
              Memuat indeks pencarian global...
            </p>
          ) : !query ? (
            <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Pencarian Global TMS</p>
              <p>Cari nama siswa, kelompok, kating pendamping, atau riwayat booking.</p>
            </div>
          ) : totalResults === 0 ? (
            <p className="text-center py-8 text-xs text-muted-foreground">
              Tidak ditemukan hasil untuk &quot;{query}&quot;.
            </p>
          ) : (
            <>
              {/* Kelompok Results */}
              {results.kelompok.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Users className="size-3 text-primary" /> Kelompok ({results.kelompok.length})
                  </div>
                  {results.kelompok.map((k) => (
                    <Link
                      key={k.id}
                      href="/admin/kelompok"
                      onClick={() => onOpenChange(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl border bg-card hover:bg-accent text-xs transition-colors"
                    >
                      <span className="font-semibold">
                        Kelompok {k.nomor_kelompok} ({k.kelas})
                      </span>
                      <Badge variant="outline">@{k.username}</Badge>
                    </Link>
                  ))}
                </div>
              )}

              {/* Anggota Results */}
              {results.anggota.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <UserCheck className="size-3 text-emerald-500" /> Anggota ({results.anggota.length})
                  </div>
                  {results.anggota.map((a) => (
                    <Link
                      key={a.id}
                      href="/admin/anggota"
                      onClick={() => onOpenChange(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl border bg-card hover:bg-accent text-xs transition-colors"
                    >
                      <span className="font-semibold">{a.nama}</span>
                      <span className="text-muted-foreground text-[11px]">
                        {a.kelompok_nama}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Kating Results */}
              {results.kating.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Shield className="size-3 text-indigo-500" /> Kating ({results.kating.length})
                  </div>
                  {results.kating.map((k) => (
                    <Link
                      key={k.id}
                      href="/admin/kating"
                      onClick={() => onOpenChange(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl border bg-card hover:bg-accent text-xs transition-colors"
                    >
                      <span className="font-semibold">{k.nama}</span>
                      <span className="text-muted-foreground text-[11px] font-mono">
                        {k.kelas} ({k.jenis_kelamin === "L" ? "Akang" : "Teteh"})
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Booking Results */}
              {results.booking.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <CalendarCheck className="size-3 text-amber-500" /> Booking ({results.booking.length})
                  </div>
                  {results.booking.map((b) => (
                    <Link
                      key={b.id}
                      href="/admin/booking"
                      onClick={() => onOpenChange(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl border bg-card hover:bg-accent text-xs transition-colors"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold">{b.kelompok_nama}</span>
                        <p className="text-[11px] text-muted-foreground">
                          {b.tanggal} &bull; {b.kating_laki_nama} &amp; {b.kating_perempuan_nama}
                        </p>
                      </div>
                      <Badge variant="outline">{b.status}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

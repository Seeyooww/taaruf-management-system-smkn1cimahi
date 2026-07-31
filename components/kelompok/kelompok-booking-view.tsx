"use client";

import * as React from "react";
import { CalendarCheck, CalendarDays, MessageSquare, Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookingStepperDialog } from "@/components/kelompok/booking-stepper-dialog";
import { WhatsAppPreviewDialog } from "@/components/kelompok/whatsapp-preview-dialog";
import { BookingCalendarView } from "@/components/kelompok/booking-calendar-view";
import { WhatsAppApprovedActions } from "@/components/ui/whatsapp-approved-actions";
import type {
  Anggota,
  BookingStatus,
  BookingWithDetails,
  EventSettings,
  SlotWaktu,
  WhatsAppTemplate,
} from "@/types/database";

interface KelompokBookingViewProps {
  initialBookings: BookingWithDetails[];
  settings: EventSettings;
  slotList: SlotWaktu[];
  templates: WhatsAppTemplate[];
  kelompokId: string;
  kelompokNama: string;
  anggotaList?: Anggota[];
}

export function KelompokBookingView({
  initialBookings,
  settings,
  slotList,
  templates,
  kelompokId,
  kelompokNama,
  anggotaList = [],
}: KelompokBookingViewProps) {
  const [bookings, setBookings] = React.useState<BookingWithDetails[]>(initialBookings);
  const [search, setSearch] = React.useState("");

  // Dialogs
  const [isStepperOpen, setIsStepperOpen] = React.useState(false);
  const [presetDate, setPresetDate] = React.useState<string | undefined>(undefined);
  const [isWaPreviewOpen, setIsWaPreviewOpen] = React.useState(false);
  const [selectedWaBooking, setSelectedWaBooking] = React.useState<BookingWithDetails | null>(null);

  const filteredBookings = React.useMemo(() => {
    return bookings.filter((b) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        b.tanggal.toLowerCase().includes(q) ||
        (b.slot_nama && b.slot_nama.toLowerCase().includes(q)) ||
        (b.kating_laki_nama && b.kating_laki_nama.toLowerCase().includes(q)) ||
        (b.kating_perempuan_nama && b.kating_perempuan_nama.toLowerCase().includes(q)) ||
        b.status.toLowerCase().includes(q)
      );
    });
  }, [bookings, search]);

  const handleBookingCreated = (newBooking: BookingWithDetails) => {
    setBookings((prev) => [newBooking, ...prev]);
    setSelectedWaBooking(newBooking);
    setIsWaPreviewOpen(true);
  };

  const handleSelectCalendarDate = (dateStr: string) => {
    setPresetDate(dateStr);
    setIsStepperOpen(true);
  };

  const handleContactedUpdate = (bookingId: string, gender: "L" | "P", timeStr: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          if (gender === "L") {
            return { ...b, akang_contacted: true, akang_contacted_at: timeStr };
          } else {
            return { ...b, teteh_contacted: true, teteh_contacted_at: timeStr };
          }
        }
        return b;
      })
    );
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case "Disetujui":
        return <Badge variant="success">Disetujui</Badge>;
      case "Menunggu Konfirmasi":
        return <Badge variant="warning">Menunggu Konfirmasi</Badge>;
      case "Ditolak":
        return <Badge variant="destructive">Ditolak</Badge>;
      case "Dibatalkan":
        return <Badge variant="destructive">Dibatalkan</Badge>;
      case "Selesai":
        return <Badge variant="secondary">Selesai</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Booking Saya</h1>
          <p className="text-xs text-muted-foreground">
            Kelola pengajuan jadwal dan sesi Taaruf kelompok Anda.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setPresetDate(undefined);
            setIsStepperOpen(true);
          }}
          className="font-semibold bg-primary text-xs"
        >
          <Plus className="mr-2 size-4" /> Buat Booking Baru
        </Button>
      </div>

      {/* Interactive Booking Availability Calendar */}
      <BookingCalendarView
        settings={settings}
        slotList={slotList}
        bookings={bookings}
        onSelectDate={handleSelectCalendarDate}
      />

      {/* Main Table Card */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarCheck className="size-4 text-primary" /> Riwayat Booking ({filteredBookings.length})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari booking / kating..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Tanggal</TableHead>
                  <TableHead className="text-xs">Slot Waktu</TableHead>
                  <TableHead className="text-xs">Akang (L)</TableHead>
                  <TableHead className="text-xs">Teteh (P)</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Status Komunikasi & Aksi WA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                          <CalendarDays className="size-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-foreground">Belum ada Booking</p>
                          <p className="text-xs text-muted-foreground max-w-sm">
                            Kelompok Anda belum memiliki riwayat booking sesi Taaruf.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setPresetDate(undefined);
                            setIsStepperOpen(true);
                          }}
                          className="text-xs font-semibold bg-primary mt-2"
                        >
                          <Plus className="mr-1.5 size-3.5" /> + Booking Baru
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-semibold text-xs">{item.tanggal}</TableCell>
                      <TableCell>
                        <div className="font-medium text-xs">{item.slot_nama}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {item.jam_mulai} - {item.jam_selesai} WIB
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{item.kating_laki_nama}</TableCell>
                      <TableCell className="text-xs font-medium">{item.kating_perempuan_nama}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right p-3">
                        {item.status === "Disetujui" ? (
                          <WhatsAppApprovedActions
                            booking={item}
                            anggotaList={anggotaList}
                            onContactedUpdate={handleContactedUpdate}
                            className="align-right"
                          />
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedWaBooking(item);
                              setIsWaPreviewOpen(true);
                            }}
                            className="h-7 text-xs gap-1 text-muted-foreground"
                          >
                            <MessageSquare className="size-3" />
                            Detail WA
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stepper Form Dialog */}
      <BookingStepperDialog
        open={isStepperOpen}
        onOpenChange={setIsStepperOpen}
        settings={settings}
        slotList={slotList}
        kelompokId={kelompokId}
        kelompokNama={kelompokNama}
        anggotaList={anggotaList}
        presetTanggal={presetDate}
        onBookingCreated={handleBookingCreated}
      />

      {/* WhatsApp Preview Dialog */}
      <WhatsAppPreviewDialog
        open={isWaPreviewOpen}
        onOpenChange={setIsWaPreviewOpen}
        booking={selectedWaBooking}
        templates={templates}
        anggotaList={anggotaList}
      />
    </div>
  );
}

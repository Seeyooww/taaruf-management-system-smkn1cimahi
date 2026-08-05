"use client";

import * as React from "react";
import {
  Ban,
  CalendarCheck,
  CalendarDays,
  CheckCircle,
  Edit,
  MessageSquare,
  Plus,
  Search,
  XCircle,
} from "lucide-react";

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
import { BookingCompleteDialog } from "@/components/kelompok/booking-complete-dialog";
import { EditBookingDialog } from "@/components/kelompok/edit-booking-dialog";
import { WhatsAppApprovedActions } from "@/components/ui/whatsapp-approved-actions";
import { updateBookingStatusAction } from "@/services/booking.actions";
import type {
  Anggota,
  BookingStatus,
  BookingWithDetails,
  CalendarBookingEntry,
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
  allCalendarBookings: CalendarBookingEntry[];
  katingCounts: { total: number };
}

export function KelompokBookingView({
  initialBookings,
  settings,
  slotList,
  templates,
  kelompokId,
  kelompokNama,
  anggotaList = [],
  allCalendarBookings,
  katingCounts,
}: KelompokBookingViewProps) {
  const [bookings, setBookings] = React.useState<BookingWithDetails[]>(initialBookings);
  const [search, setSearch] = React.useState("");
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  // Dialogs
  const [isStepperOpen, setIsStepperOpen] = React.useState(false);
  const [presetDate, setPresetDate] = React.useState<string | undefined>(undefined);
  const [isWaPreviewOpen, setIsWaPreviewOpen] = React.useState(false);
  const [selectedWaBooking, setSelectedWaBooking] = React.useState<BookingWithDetails | null>(null);
  const [isCompleteOpen, setIsCompleteOpen] = React.useState(false);
  const [completeBooking, setCompleteBooking] = React.useState<BookingWithDetails | null>(null);
  // Edit Booking dialog state
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editBooking, setEditBooking] = React.useState<BookingWithDetails | null>(null);

  const filteredBookings = React.useMemo(() => {
    return bookings.filter((b) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      const katingMatch = (b.kating_list ?? []).some((k) =>
        k.nama.toLowerCase().includes(q)
      );
      return (
        b.tanggal.toLowerCase().includes(q) ||
        (b.slot_nama && b.slot_nama.toLowerCase().includes(q)) ||
        katingMatch ||
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

  const handleContactedUpdate = (bookingId: string, katingId: string, timeStr: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const kating_list = (b.kating_list ?? []).map((k) =>
            k.id === katingId ? { ...k, contacted: true, contacted_at: timeStr } : k
          );
          return { ...b, kating_list };
        }
        return b;
      })
    );
  };

  /** Update status booking dan refleksikan di state */
  const handleUpdateStatus = async (bookingId: string, status: BookingStatus) => {
    setLoadingId(bookingId);
    const result = await updateBookingStatusAction(bookingId, status);
    setLoadingId(null);

    if (result.success) {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
    } else {
      alert(result.message || "Gagal memperbarui status.");
    }
  };

  /** Setelah taaruf selesai berhasil (dari BookingCompleteDialog) */
  const handleTaarufCompleted = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "Selesai" } : b))
    );
  };

  /** Setelah booking berhasil diedit (dari EditBookingDialog) */
  const handleBookingUpdated = (updatedBooking: BookingWithDetails) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
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
        return (
          <Badge variant="outline" className="border-slate-500/30 text-slate-600 dark:text-slate-400 bg-slate-500/10 font-semibold gap-1">
            <Ban className="size-3" /> Dibatalkan
          </Badge>
        );
      case "Selesai":
        return <Badge variant="secondary">Selesai ✓</Badge>;
      case "Tidak Dihitung":
        return <Badge variant="outline">Tidak Dihitung</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderActionCell = (item: BookingWithDetails) => {
    const isLoading = loadingId === item.id;

    // === Menunggu Konfirmasi: kelompok input hasil balasan WA + Ubah Booking ===
    if (item.status === "Menunggu Konfirmasi") {
      return (
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <span className="text-[10px] text-muted-foreground self-center">Balasan WA:</span>
            <Button
              size="sm"
              variant="outline"
              className="h-8 min-h-[32px] text-xs gap-1 text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10"
              disabled={isLoading}
              onClick={() => handleUpdateStatus(item.id, "Disetujui")}
            >
              <CheckCircle className="size-3" />
              Diterima
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 min-h-[32px] text-xs gap-1 text-rose-600 border-rose-500/40 hover:bg-rose-500/10"
              disabled={isLoading}
              onClick={() => handleUpdateStatus(item.id, "Ditolak")}
            >
              <XCircle className="size-3" />
              Ditolak
            </Button>
          </div>
          {/* Ubah Booking — untuk Menunggu Konfirmasi & Disetujui */}
          <Button
            size="sm"
            variant="outline"
            className="h-7 min-h-[28px] text-[11px] gap-1 text-primary border-primary/40 hover:bg-primary/10"
            disabled={isLoading}
            onClick={() => {
              setEditBooking(item);
              setIsEditOpen(true);
            }}
          >
            <Edit className="size-3" />
            Ubah Booking
          </Button>
        </div>
      );
    }

    // === Disetujui: WA actions + Ubah Booking + setelah hari H ===
    if (item.status === "Disetujui") {
      return (
        <div className="flex flex-col items-end gap-1.5">
          <WhatsAppApprovedActions
            booking={item}
            anggotaList={anggotaList}
            onContactedUpdate={handleContactedUpdate}
            className="align-right"
          />
          <div className="flex flex-wrap items-center justify-end gap-1.5 mt-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 min-h-[32px] text-xs gap-1 text-primary border-primary/40 hover:bg-primary/10 font-semibold"
              disabled={isLoading}
              onClick={() => {
                setEditBooking(item);
                setIsEditOpen(true);
              }}
            >
              <Edit className="size-3" />
              Ubah Booking
            </Button>
            <span className="text-[10px] text-muted-foreground self-center">Setelah taaruf:</span>
            <Button
              size="sm"
              className="h-8 min-h-[32px] text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              disabled={isLoading}
              onClick={() => {
                setCompleteBooking(item);
                setIsCompleteOpen(true);
              }}
            >
              <CheckCircle className="size-3" />
              Berhasil
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 min-h-[32px] text-xs gap-1 text-slate-700 dark:text-slate-300 border-slate-400/40 hover:bg-slate-500/10 font-semibold"
              disabled={isLoading}
              onClick={() => handleUpdateStatus(item.id, "Dibatalkan")}
            >
              <Ban className="size-3 text-slate-500" />
              Dibatalkan
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 min-h-[32px] text-xs gap-1 text-rose-600 border-rose-500/30 hover:bg-rose-500/10 font-semibold"
              disabled={isLoading}
              onClick={() => handleUpdateStatus(item.id, "Tidak Dihitung")}
            >
              <XCircle className="size-3" />
              Tidak Berhasil
            </Button>
          </div>
        </div>
      );
    }

    // === Terminal states: Selesai, Ditolak, Tidak Dihitung, Dibatalkan ===
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setSelectedWaBooking(item);
          setIsWaPreviewOpen(true);
        }}
        className="h-8 min-h-[32px] text-xs gap-1 text-muted-foreground"
      >
        <MessageSquare className="size-3" />
        Detail WA
      </Button>
    );
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
        allCalendarBookings={allCalendarBookings}
        katingCounts={katingCounts}
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
                  <TableHead className="text-xs">Kating Pendamping</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Aksi</TableHead>
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
                          {item.jam_mulai} WIB {item.jam_pulang ? `• Pulang: ${item.jam_pulang} WIB` : `- ${item.jam_selesai} WIB`}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        <div className="flex flex-wrap gap-1">
                          {(item.kating_list ?? []).map((k) => (
                            <Badge
                              key={k.id}
                              variant="outline"
                              className={`text-[10px] ${
                                k.jenis_kelamin === "L"
                                  ? "border-primary/30 text-primary"
                                  : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {k.nama}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right p-3">
                        {renderActionCell(item)}
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

      {/* Booking Complete (Attendance + Substitute + Progress) Dialog */}
      <BookingCompleteDialog
        open={isCompleteOpen}
        onOpenChange={setIsCompleteOpen}
        booking={completeBooking}
        anggotaList={anggotaList}
        onCompleted={handleTaarufCompleted}
      />

      {/* Edit Booking Dialog (hanya untuk status Menunggu Konfirmasi) */}
      <EditBookingDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        booking={editBooking}
        settings={settings}
        slotList={slotList}
        anggotaList={anggotaList}
        onBookingUpdated={handleBookingUpdated}
      />
    </div>
  );
}

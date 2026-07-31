"use client";

import * as React from "react";
import { Activity, CalendarCheck, CalendarDays, Check, ListFilter, Search, X } from "lucide-react";
import { toast } from "sonner";

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
import { BookingCalendarView } from "@/components/admin/booking-calendar-view";
import { ProgressConfirmationDialog } from "@/components/admin/progress-confirmation-dialog";
import { WhatsAppApprovedActions } from "@/components/ui/whatsapp-approved-actions";
import { updateBookingStatusAction } from "@/services/booking.actions";
import type { Anggota, BookingStatus, BookingWithDetails, EventSettings, Kelompok, SlotWaktu } from "@/types/database";

interface AdminBookingViewProps {
  initialBookings: BookingWithDetails[];
  kelompokList: Kelompok[];
  slotList: SlotWaktu[];
  allAnggotaList: Anggota[];
  settings: EventSettings;
}

export function AdminBookingView({
  initialBookings,
  kelompokList,
  slotList,
  allAnggotaList,
  settings,
}: AdminBookingViewProps) {
  const [data, setData] = React.useState<BookingWithDetails[]>(initialBookings);
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"table" | "calendar">("table");

  // Progress Dialog State
  const [isProgressOpen, setIsProgressOpen] = React.useState(false);
  const [targetBookingForProgress, setTargetBookingForProgress] = React.useState<BookingWithDetails | null>(null);

  // Filters
  const [dateFilter, setDateFilter] = React.useState("");
  const [slotFilter, setSlotFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [kelompokFilter, setKelompokFilter] = React.useState("all");

  const [page, setPage] = React.useState(1);
  const pageSize = 8;
  const [isPending, startTransition] = React.useTransition();

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        (item.kelompok_nama && item.kelompok_nama.toLowerCase().includes(q)) ||
        (item.kating_laki_nama && item.kating_laki_nama.toLowerCase().includes(q)) ||
        (item.kating_perempuan_nama && item.kating_perempuan_nama.toLowerCase().includes(q));

      const matchDate = dateFilter ? item.tanggal === dateFilter : true;
      const matchSlot = slotFilter === "all" ? true : item.slot_id === slotFilter;
      const matchStatus = statusFilter === "all" ? true : item.status === statusFilter;
      const matchKelompok = kelompokFilter === "all" ? true : item.kelompok_id === kelompokFilter;

      return matchSearch && matchDate && matchSlot && matchStatus && matchKelompok;
    });
  }, [data, search, dateFilter, slotFilter, statusFilter, kelompokFilter]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  const handleUpdateStatus = (bookingItem: BookingWithDetails, newStatus: BookingStatus) => {
    if (newStatus === "Selesai") {
      setTargetBookingForProgress(bookingItem);
      setIsProgressOpen(true);
      return;
    }

    startTransition(async () => {
      const res = await updateBookingStatusAction(bookingItem.id, newStatus);
      if (res.success) {
        toast.success("✔ " + res.message);
        setData((prev) =>
          prev.map((b) => (b.id === bookingItem.id ? { ...b, status: newStatus } : b))
        );
      } else {
        toast.error("❌ " + res.message);
      }
    });
  };

  const handleContactedUpdate = (bookingId: string, gender: "L" | "P", timeStr: string) => {
    setData((prev) =>
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
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Booking Kelompok</h1>
          <p className="text-xs text-muted-foreground">
            Kelola persetujuan, penolakan, verifikasi, dan visualisasi kalender sesi Taaruf.
          </p>
        </div>

        {/* Tab Toggle View */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border">
          <Button
            size="sm"
            variant={activeTab === "table" ? "default" : "ghost"}
            onClick={() => setActiveTab("table")}
            className="h-7 text-xs font-semibold"
          >
            <ListFilter className="mr-1.5 size-3.5" /> Tabel Booking
          </Button>
          <Button
            size="sm"
            variant={activeTab === "calendar" ? "default" : "ghost"}
            onClick={() => setActiveTab("calendar")}
            className="h-7 text-xs font-semibold"
          >
            <CalendarDays className="mr-1.5 size-3.5" /> Kalender Ketersediaan
          </Button>
        </div>
      </div>

      {activeTab === "calendar" ? (
        <BookingCalendarView bookingList={data} settings={settings} slotList={slotList} />
      ) : (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex flex-col space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarCheck className="size-4 text-primary" /> Permohonan Booking ({filteredData.length})
                </CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari kelompok / kating..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
                <div className="space-y-1">
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-8 text-xs w-36"
                  />
                </div>

                <select
                  value={slotFilter}
                  onChange={(e) => {
                    setSlotFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="all">Semua Slot</option>
                  {slotList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama_slot}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="all">Semua Status</option>
                  <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Ditolak">Ditolak</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                  <option value="Tidak Dihitung">Tidak Dihitung</option>
                </select>

                <select
                  value={kelompokFilter}
                  onChange={(e) => {
                    setKelompokFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="all">Semua Kelompok</option>
                  {kelompokList.map((k) => (
                    <option key={k.id} value={k.id}>
                      Kelompok {k.nomor_kelompok} ({k.kelas})
                    </option>
                  ))}
                </select>

                {(dateFilter || slotFilter !== "all" || statusFilter !== "all" || kelompokFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateFilter("");
                      setSlotFilter("all");
                      setStatusFilter("all");
                      setKelompokFilter("all");
                    }}
                    className="h-8 text-xs text-muted-foreground"
                  >
                    Reset Filter
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Kelompok</TableHead>
                    <TableHead className="text-xs">Tanggal & Slot</TableHead>
                    <TableHead className="text-xs">Pasangan Kating</TableHead>
                    <TableHead className="w-28 text-xs">Status</TableHead>
                    <TableHead className="text-right text-xs">Status Komunikasi & Aksi Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs">
                        Tidak ada permohonan booking ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-semibold text-xs">{item.kelompok_nama}</TableCell>
                        <TableCell>
                          <div className="font-medium text-xs text-primary">{item.tanggal}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {item.slot_nama} ({item.jam_mulai} - {item.jam_selesai})
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-medium">Akang: {item.kating_laki_nama}</div>
                          <div className="text-xs text-muted-foreground">Teteh: {item.kating_perempuan_nama}</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-right p-3">
                          <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
                            {item.status === "Disetujui" && (
                              <WhatsAppApprovedActions
                                booking={item}
                                anggotaList={allAnggotaList.filter((a) => a.kelompok_id === item.kelompok_id)}
                                onContactedUpdate={handleContactedUpdate}
                              />
                            )}

                            {item.status === "Menunggu Konfirmasi" && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  disabled={isPending}
                                  onClick={() => handleUpdateStatus(item, "Disetujui")}
                                  className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <Check className="mr-1 size-3" /> Setujui
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={isPending}
                                  onClick={() => handleUpdateStatus(item, "Ditolak")}
                                  className="h-7 px-2 text-xs"
                                >
                                  <X className="mr-1 size-3" /> Tolak
                                </Button>
                              </div>
                            )}

                            {item.status === "Disetujui" && (
                              <Button
                                size="sm"
                                disabled={isPending}
                                onClick={() => handleUpdateStatus(item, "Selesai")}
                                className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                              >
                                <Activity className="size-3" /> Presensi & Selesai
                              </Button>
                            )}

                            <select
                              value={item.status}
                              disabled={isPending}
                              onChange={(e) =>
                                handleUpdateStatus(item, e.target.value as BookingStatus)
                              }
                              className="h-7 rounded-md border border-input bg-background px-1 text-[11px]"
                            >
                              <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                              <option value="Disetujui">Disetujui</option>
                              <option value="Selesai">Selesai</option>
                              <option value="Ditolak">Ditolak</option>
                              <option value="Dibatalkan">Dibatalkan</option>
                              <option value="Tidak Dihitung">Tidak Dihitung</option>
                            </select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t text-xs text-muted-foreground">
                <span>
                  Halaman {page} dari {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="h-7 text-xs"
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-7 text-xs"
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress & Attendance Confirmation Dialog */}
      <ProgressConfirmationDialog
        open={isProgressOpen}
        onOpenChange={setIsProgressOpen}
        booking={targetBookingForProgress}
        allAnggotaList={allAnggotaList}
        onProgressCalculated={() => {
          if (targetBookingForProgress) {
            setData((prev) =>
              prev.map((b) =>
                b.id === targetBookingForProgress.id ? { ...b, status: "Selesai" } : b
              )
            );
          }
        }}
      />
    </div>
  );
}

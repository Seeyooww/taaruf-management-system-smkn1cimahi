"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  Printer,
  RefreshCw,
  Search,
  Shield,
  Users,
} from "lucide-react";
import type { LaporanKatingItem } from "@/services/reporting.service";
import { getLaporanKatingAction } from "@/services/reporting.actions";
import { exportToCSV, exportToExcel, exportToPDF, triggerPrint } from "@/utils/export-utils";

interface LaporanKatingViewProps {
  initialData: LaporanKatingItem[];
  kelompokList: { id: string; nomor_kelompok: number; kelas: string }[];
}

export function LaporanKatingView({ initialData, kelompokList }: LaporanKatingViewProps) {
  const [data, setData] = React.useState<LaporanKatingItem[]>(initialData);
  const [loading, setLoading] = React.useState(false);

  // Filters
  const [search, setSearch] = React.useState("");
  const [kelompokId, setKelompokId] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [tanggalMulai, setTanggalMulai] = React.useState("");
  const [tanggalSelesai, setTanggalSelesai] = React.useState("");

  // Detail Modal
  const [selectedKating, setSelectedKating] = React.useState<LaporanKatingItem | null>(null);

  const handleApplyFilter = async () => {
    setLoading(true);
    try {
      const res = await getLaporanKatingAction({
        kelompokId: kelompokId === "all" ? undefined : kelompokId,
        status: statusFilter === "all" ? undefined : statusFilter,
        katingSearch: search.trim() || undefined,
        tanggalMulai: tanggalMulai || undefined,
        tanggalSelesai: tanggalSelesai || undefined,
      });
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setSearch("");
    setKelompokId("all");
    setStatusFilter("all");
    setTanggalMulai("");
    setTanggalSelesai("");
    setLoading(true);
    try {
      const res = await getLaporanKatingAction();
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  // Export Data Preparation
  const prepareExportData = () => {
    const headers = [
      "Nama Kating",
      "Kelas",
      "Jenis Kelamin",
      "No. WhatsApp",
      "Jumlah Ditaarufi (Siswa)",
      "Kelompok Pernah Bertemu",
      "Total Riwayat Sesi",
    ];

    const rows = data.map((item) => [
      item.nama,
      item.kelas,
      item.jenis_kelamin === "L" ? "Akang" : "Teteh",
      item.nomor_whatsapp,
      item.jumlah_ditaarufi,
      item.kelompok_pernah_bertemu.join("; ") || "-",
      item.riwayat.length,
    ]);

    return { headers, rows };
  };

  const handleExportCSV = () => {
    const { headers, rows } = prepareExportData();
    exportToCSV("Laporan_Kating_TMS", headers, rows);
  };

  const handleExportExcel = () => {
    const { headers, rows } = prepareExportData();
    exportToExcel("Laporan_Kating_TMS", headers, rows);
  };

  const handleExportPDF = () => {
    const { headers, rows } = prepareExportData();
    exportToPDF("Laporan Rekapitulasi Kating Pendamping", headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Shield className="size-6 text-indigo-500" /> Laporan Kating Pendamping
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Rekapitulasi aktivitas Akang & Teteh kating pendamping, jumlah siswa yang ditaarufi, kelompok yang bertemu, dan riwayat sesi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button size="sm" variant="outline" onClick={handleExportCSV} className="text-xs">
            <Download className="size-3.5 mr-1 text-blue-500" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportExcel} className="text-xs">
            <FileSpreadsheet className="size-3.5 mr-1 text-emerald-500" /> Excel
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportPDF} className="text-xs">
            <FileText className="size-3.5 mr-1 text-rose-500" /> PDF
          </Button>
          <Button size="sm" onClick={triggerPrint} className="text-xs bg-slate-900 text-white hover:bg-slate-800">
            <Printer className="size-3.5 mr-1" /> Cetak
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="glass-card print:hidden">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Filter className="size-3.5 text-primary" /> Filter Laporan Kating
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Cari Nama / Kelas Kating</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Ketik nama Kating..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>
            </div>

            {/* Select Kelompok */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Kelompok</label>
              <select
                value={kelompokId}
                onChange={(e) => setKelompokId(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary"
              >
                <option value="all">Semua Kelompok</option>
                {kelompokList.map((k) => (
                  <option key={k.id} value={k.id}>
                    Kelompok {k.nomor_kelompok} ({k.kelas})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Sesi */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Status Booking</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary"
              >
                <option value="all">Semua Status</option>
                <option value="Selesai">Selesai</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                <option value="Ditolak">Ditolak</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Mulai Tanggal</label>
              <Input
                type="date"
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Sampai Tanggal</label>
              <Input
                type="date"
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button size="sm" variant="ghost" onClick={handleReset} className="text-xs h-7">
              <RefreshCw className="size-3 mr-1" /> Reset Filter
            </Button>
            <Button size="sm" onClick={handleApplyFilter} disabled={loading} className="text-xs h-7 bg-primary">
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3">Nama Kating</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3 text-center">Gender</th>
                  <th className="p-3 text-center">Jumlah Ditaarufi</th>
                  <th className="p-3">Kelompok Pernah Bertemu</th>
                  <th className="p-3 text-center">Total Sesi</th>
                  <th className="p-3 text-center print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada data kating yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr
                      key={item.kating_id}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => setSelectedKating(item)}
                    >
                      <td className="p-3 font-semibold text-foreground flex items-center gap-2">
                        <Shield className="size-3.5 text-indigo-500 shrink-0" />
                        <span>{item.nama}</span>
                      </td>
                      <td className="p-3 font-medium text-muted-foreground">{item.kelas}</td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className="text-[10px]">
                          {item.jenis_kelamin === "L" ? "Akang" : "Teteh"}
                        </Badge>
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {item.jumlah_ditaarufi} Siswa
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.kelompok_pernah_bertemu.length === 0 ? (
                            <span className="text-muted-foreground text-[11px]">-</span>
                          ) : (
                            item.kelompok_pernah_bertemu.map((kelName, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[10px]">
                                {kelName}
                              </Badge>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center font-bold">{item.riwayat.length}</td>
                      <td className="p-3 text-center print:hidden" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedKating(item)}
                          className="text-xs h-7 text-primary hover:text-primary/80"
                        >
                          <History className="size-3 mr-1" /> Riwayat
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Kating Detail Modal */}
      {selectedKating && (
        <Dialog open={Boolean(selectedKating)} onOpenChange={() => setSelectedKating(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Shield className="size-5 text-indigo-500" /> Riwayat Taaruf - {selectedKating.nama}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {selectedKating.kelas} • Total {selectedKating.jumlah_ditaarufi} siswa ditaarufi dari {selectedKating.kelompok_pernah_bertemu.length} kelompok.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Riwayat Sesi Booking & Pertemuan
              </div>

              {selectedKating.riwayat.length === 0 ? (
                <div className="p-4 rounded-lg border text-center text-xs text-muted-foreground bg-muted/20">
                  Belum ada riwayat sesi booking untuk kating ini.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {selectedKating.riwayat.map((rw, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border bg-card flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <Users className="size-3.5 text-primary shrink-0" />
                          <span>{rw.kelompok_nama}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" /> {rw.tanggal}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" /> {rw.slot_nama}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          rw.status === "Selesai"
                            ? "default"
                            : rw.status === "Disetujui"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-[10px]"
                      >
                        {rw.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

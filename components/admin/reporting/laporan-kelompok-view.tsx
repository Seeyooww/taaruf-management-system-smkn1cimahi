"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Printer,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import type { LaporanKelompokItem } from "@/services/reporting.service";
import { getLaporanKelompokAction } from "@/services/reporting.actions";
import { exportToCSV, exportToExcel, exportToPDF, triggerPrint } from "@/utils/export-utils";

interface LaporanKelompokViewProps {
  initialData: LaporanKelompokItem[];
  kelompokList: { id: string; nomor_kelompok: number; kelas: string }[];
}

export function LaporanKelompokView({ initialData, kelompokList }: LaporanKelompokViewProps) {
  const [data, setData] = React.useState<LaporanKelompokItem[]>(initialData);
  const [loading, setLoading] = React.useState(false);

  // Filters
  const [search, setSearch] = React.useState("");
  const [kelompokId, setKelompokId] = React.useState("all");
  const [kelasFilter, setKelasFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [tanggalMulai, setTanggalMulai] = React.useState("");
  const [tanggalSelesai, setTanggalSelesai] = React.useState("");

  // Extract unique kelas options
  const kelasOptions = React.useMemo(() => {
    const set = new Set<string>();
    kelompokList.forEach((k) => {
      if (k.kelas) set.add(k.kelas);
    });
    return Array.from(set);
  }, [kelompokList]);

  const handleApplyFilter = async () => {
    setLoading(true);
    try {
      const res = await getLaporanKelompokAction({
        kelompokId: kelompokId === "all" ? undefined : kelompokId,
        kelas: kelasFilter === "all" ? undefined : kelasFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        tanggalMulai: tanggalMulai || undefined,
        tanggalSelesai: tanggalSelesai || undefined,
      });
      setData(res);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setSearch("");
    setKelompokId("all");
    setKelasFilter("all");
    setStatusFilter("all");
    setTanggalMulai("");
    setTanggalSelesai("");
    setLoading(true);
    try {
      const res = await getLaporanKelompokAction();
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  // Filtered by search text
  const filteredData = React.useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase().trim();
    return data.filter(
      (item) =>
        `kelompok ${item.nomor_kelompok}`.toLowerCase().includes(q) ||
        item.kelas.toLowerCase().includes(q) ||
        item.nama_anggota.some((name) => name.toLowerCase().includes(q))
    );
  }, [data, search]);

  // Export Table Data Preparation
  const prepareExportData = () => {
    const headers = [
      "No. Kelompok",
      "Kelas",
      "Nama Anggota",
      "Jumlah Booking",
      "Booking Selesai",
      "Booking Ditolak",
      "Booking Dibatalkan",
      "Progress Rata-rata (%)",
      "Persentase Target (%)",
    ];

    const rows = filteredData.map((item) => [
      `Kelompok ${item.nomor_kelompok}`,
      item.kelas,
      item.nama_anggota.join("; "),
      item.total_booking,
      item.booking_selesai,
      item.booking_ditolak,
      item.booking_dibatalkan,
      `${item.progress_rata_rata}%`,
      `${item.persentase_target}%`,
    ]);

    return { headers, rows };
  };

  const handleExportCSV = () => {
    const { headers, rows } = prepareExportData();
    exportToCSV("Laporan_Kelompok_TMS", headers, rows);
  };

  const handleExportExcel = () => {
    const { headers, rows } = prepareExportData();
    exportToExcel("Laporan_Kelompok_TMS", headers, rows);
  };

  const handleExportPDF = () => {
    const { headers, rows } = prepareExportData();
    exportToPDF("Laporan Rekapitulasi Kelompok", headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Users className="size-6 text-primary" /> Laporan Kelompok
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Rekapitulasi otomatis permohonan booking, status, progress rata-rata, & capaian target per kelompok.
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
            <Filter className="size-3.5 text-primary" /> Filter Laporan Kelompok
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Cari Kelompok / Anggota</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari..."
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

            {/* Select Kelas */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Kelas</label>
              <select
                value={kelasFilter}
                onChange={(e) => setKelasFilter(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary"
              >
                <option value="all">Semua Kelas</option>
                {kelasOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Booking Status Filter */}
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

      {/* Report Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border bg-card/60">
          <div className="text-[11px] text-muted-foreground font-medium">Total Kelompok</div>
          <div className="text-xl font-extrabold text-foreground">{filteredData.length}</div>
        </div>
        <div className="p-3 rounded-xl border bg-card/60">
          <div className="text-[11px] text-muted-foreground font-medium">Total Booking</div>
          <div className="text-xl font-extrabold text-amber-600">
            {filteredData.reduce((acc, curr) => acc + curr.total_booking, 0)}
          </div>
        </div>
        <div className="p-3 rounded-xl border bg-card/60">
          <div className="text-[11px] text-muted-foreground font-medium">Booking Selesai</div>
          <div className="text-xl font-extrabold text-emerald-600">
            {filteredData.reduce((acc, curr) => acc + curr.booking_selesai, 0)}
          </div>
        </div>
        <div className="p-3 rounded-xl border bg-card/60">
          <div className="text-[11px] text-muted-foreground font-medium">Rata-Rata Progress</div>
          <div className="text-xl font-extrabold text-primary">
            {filteredData.length === 0
              ? 0
              : Math.round(
                  filteredData.reduce((acc, curr) => acc + curr.progress_rata_rata, 0) /
                    filteredData.length
                )}
            %
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3">No. Kelompok</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">Nama Anggota</th>
                  <th className="p-3 text-center">Total Booking</th>
                  <th className="p-3 text-center">Selesai</th>
                  <th className="p-3 text-center">Ditolak</th>
                  <th className="p-3 text-center">Dibatalkan</th>
                  <th className="p-3 text-center">Progress Avg</th>
                  <th className="p-3 text-center">Target Tercapai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-foreground">
                      Tidak ada data kelompok yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.kelompok_id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-bold text-foreground">
                        Kelompok {item.nomor_kelompok}
                      </td>
                      <td className="p-3 font-medium text-muted-foreground">{item.kelas}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.nama_anggota.map((nama, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px] bg-card">
                              {nama}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-center font-bold">{item.total_booking}</td>
                      <td className="p-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.booking_selesai}
                      </td>
                      <td className="p-3 text-center font-semibold text-rose-600 dark:text-rose-400">
                        {item.booking_ditolak}
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-500">
                        {item.booking_dibatalkan}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-bold text-primary">
                          <span>{item.progress_rata_rata}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={item.persentase_target >= 80 ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {item.persentase_target}% Peserta
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Printer,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
} from "lucide-react";
import type { LaporanAnggotaItem, MetKatingDetail } from "@/services/reporting.service";
import { getLaporanAnggotaAction } from "@/services/reporting.actions";
import { exportToCSV, exportToExcel, exportToPDF, triggerPrint } from "@/utils/export-utils";

interface LaporanAnggotaViewProps {
  initialData: LaporanAnggotaItem[];
  kelompokList: { id: string; nomor_kelompok: number; kelas: string }[];
}

export function LaporanAnggotaView({ initialData, kelompokList }: LaporanAnggotaViewProps) {
  const [data, setData] = React.useState<LaporanAnggotaItem[]>(initialData);
  const [loading, setLoading] = React.useState(false);

  // Filters
  const [namaSearch, setNamaSearch] = React.useState("");
  const [kelompokId, setKelompokId] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [kelasFilter, setKelasFilter] = React.useState("all");

  // Selected Anggota for Detail Modal
  const [selectedAnggota, setSelectedAnggota] = React.useState<LaporanAnggotaItem | null>(null);

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
      const res = await getLaporanAnggotaAction({
        kelompokId: kelompokId === "all" ? undefined : kelompokId,
        namaSearch: namaSearch.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        kelas: kelasFilter === "all" ? undefined : kelasFilter,
      });
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setNamaSearch("");
    setKelompokId("all");
    setStatusFilter("all");
    setKelasFilter("all");
    setLoading(true);
    try {
      const res = await getLaporanAnggotaAction();
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  // Export Data Preparation
  const prepareExportData = () => {
    const headers = [
      "Nama Anggota",
      "Jenis Kelamin",
      "Kelompok",
      "Kelas",
      "Target Kating",
      "Progress (Ketemu)",
      "Persentase (%)",
      "Status",
    ];

    const rows = data.map((item) => [
      item.nama,
      item.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan",
      item.kelompok_nama,
      item.kelas,
      item.target_kating,
      item.progress,
      `${item.persentase}%`,
      item.status,
    ]);

    return { headers, rows };
  };

  const handleExportCSV = () => {
    const { headers, rows } = prepareExportData();
    exportToCSV("Laporan_Anggota_TMS", headers, rows);
  };

  const handleExportExcel = () => {
    const { headers, rows } = prepareExportData();
    exportToExcel("Laporan_Anggota_TMS", headers, rows);
  };

  const handleExportPDF = () => {
    const { headers, rows } = prepareExportData();
    exportToPDF("Laporan Rekapitulasi Anggota", headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <UserCheck className="size-6 text-emerald-500" /> Laporan Anggota
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Daftar rekapitulasi progress pencapaian kating per peserta individu. Klik nama anggota untuk melihat detail riwayat kating.
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

      {/* Filters */}
      <Card className="glass-card print:hidden">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Filter className="size-3.5 text-primary" /> Filter Laporan Anggota
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Nama */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Cari Nama Anggota</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Ketik nama..."
                  value={namaSearch}
                  onChange={(e) => setNamaSearch(e.target.value)}
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

            {/* Status Progress */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Status Target</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary"
              >
                <option value="all">Semua Status</option>
                <option value="Selesai">Selesai (Target OK)</option>
                <option value="Hampir Selesai">Hampir Selesai (&ge;50%)</option>
                <option value="Belum">Belum (&lt;50%)</option>
              </select>
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
                  <th className="p-3">Nama Anggota</th>
                  <th className="p-3">Kelompok</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3 text-center">Target</th>
                  <th className="p-3 text-center">Progress (Met)</th>
                  <th className="p-3 text-center">Persentase</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      Tidak ada data anggota yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr
                      key={item.anggota_id}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => setSelectedAnggota(item)}
                    >
                      <td className="p-3 font-semibold text-foreground flex items-center gap-2">
                        <span className="hover:underline">{item.nama}</span>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {item.jenis_kelamin}
                        </Badge>
                      </td>
                      <td className="p-3 font-medium text-foreground">{item.kelompok_nama}</td>
                      <td className="p-3 text-muted-foreground">{item.kelas}</td>
                      <td className="p-3 text-center font-bold">{item.target_kating}</td>
                      <td className="p-3 text-center font-extrabold text-emerald-600 dark:text-emerald-400">
                        {item.progress}
                      </td>
                      <td className="p-3 text-center">
                        <div className="w-full max-w-[100px] mx-auto space-y-1">
                          <span className="font-bold text-xs">{item.persentase}%</span>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${item.persentase}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={
                            item.status === "Selesai"
                              ? "default"
                              : item.status === "Hampir Selesai"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-[10px]"
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-center print:hidden" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedAnggota(item)}
                          className="text-xs h-7 text-primary hover:text-primary/80"
                        >
                          Detail Riwayat
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

      {/* Member Detail Dialog */}
      {selectedAnggota && (
        <Dialog open={Boolean(selectedAnggota)} onOpenChange={() => setSelectedAnggota(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <UserCheck className="size-5 text-primary" /> Detail Kating Met - {selectedAnggota.nama}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {selectedAnggota.kelompok_nama} ({selectedAnggota.kelas}) • Progress: {selectedAnggota.progress} / {selectedAnggota.target_kating} Kating ({selectedAnggota.persentase}%)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Daftar Kating Yang Pernah Ditemui
              </div>

              {selectedAnggota.kating_met_list.length === 0 ? (
                <div className="p-4 rounded-lg border text-center text-xs text-muted-foreground bg-muted/20">
                  Anggota ini belum pernah mengikuti sesi Taaruf dengan kating.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedAnggota.kating_met_list.map((met: MetKatingDetail, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border bg-card flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <Shield className="size-3.5 text-primary shrink-0" />
                          <span>{met.kating_nama}</span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            {met.jenis_kelamin === "L" ? "Akang" : "Teteh"}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3 text-muted-foreground" /> {met.tanggal}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3 text-muted-foreground" /> {met.slot_nama}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {met.kelompok_nama}
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

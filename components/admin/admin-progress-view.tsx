"use client";

import * as React from "react";
import {
  Activity,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Search,
  Shield,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AnggotaProgressSummary, Kelompok } from "@/types/database";

interface AdminProgressViewProps {
  initialProgressList: AnggotaProgressSummary[];
  kelompokList: Kelompok[];
}

export function AdminProgressView({
  initialProgressList,
  kelompokList,
}: AdminProgressViewProps) {
  const [data] = React.useState<AnggotaProgressSummary[]>(initialProgressList);
  const [search, setSearch] = React.useState("");

  // Filters
  const [kelompokFilter, setKelompokFilter] = React.useState("all");
  const [kelasFilter, setKelasFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  // Selected member for detail modal
  const [selectedAnggota, setSelectedAnggota] = React.useState<AnggotaProgressSummary | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  // Extract unique classes for filter
  const uniqueClasses = React.useMemo(() => {
    const set = new Set<string>();
    kelompokList.forEach((k) => {
      if (k.kelas) set.add(k.kelas);
    });
    return Array.from(set);
  }, [kelompokList]);

  // Filtering
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        item.nama.toLowerCase().includes(q) ||
        item.kelompok_nama.toLowerCase().includes(q) ||
        item.kelas.toLowerCase().includes(q);

      const matchKelompok = kelompokFilter === "all" ? true : item.kelompok_id === kelompokFilter;
      const matchKelas = kelasFilter === "all" ? true : item.kelas === kelasFilter;
      const matchStatus = statusFilter === "all" ? true : item.status_label === statusFilter;

      return matchSearch && matchKelompok && matchKelas && matchStatus;
    });
  }, [data, search, kelompokFilter, kelasFilter, statusFilter]);

  // Stats calculation
  const totalAnggota = data.length;
  const sudahTarget = data.filter((item) => item.total_kating_met >= item.target_kating).length;
  const belumTarget = totalAnggota - sudahTarget;
  const avgPercentage =
    totalAnggota === 0
      ? 0
      : Math.round(
          data.reduce((acc, curr) => acc + curr.percentage, 0) / totalAnggota
        );

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  const handleExportCSV = () => {
    let csv = "Nama Anggota,Kelompok,Kelas,Gender,Kating Ditemui,Target,Persentase,Status\n";
    filteredData.forEach((item) => {
      csv += `"${item.nama}","${item.kelompok_nama}","${item.kelas}","${item.jenis_kelamin}",${item.total_kating_met},${item.target_kating},${item.percentage}%,"${item.status_label}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekap_progress_taaruf_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Laporan Excel/CSV berhasil diunduh.");
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitoring Progress Anggota</h1>
          <p className="text-xs text-muted-foreground">
            Pemantauan capaian target kating unik per peserta secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileSpreadsheet className="mr-2 size-4 text-emerald-600 dark:text-emerald-400" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrintPDF}>
            <Printer className="mr-2 size-4" /> Cetak / PDF
          </Button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Total Peserta
            </CardTitle>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{totalAnggota}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Siswa/i terdaftar</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Sudah Mencapai Target
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {sudahTarget}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Capaian &ge; Target Kating</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Belum Mencapai Target
            </CardTitle>
            <XCircle className="size-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {belumTarget}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Dalam proses pendampingan</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Rata-rata Progress
            </CardTitle>
            <Activity className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {avgPercentage}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Rerata seluruh peserta</p>
          </CardContent>
        </Card>
      </div>

      {/* Main DataTable Card */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="size-4 text-primary" /> Tabel Progress Per Anggota ({filteredData.length})
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Cari anggota / kelompok / kelas..."
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

              <select
                value={kelasFilter}
                onChange={(e) => {
                  setKelasFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="all">Semua Kelas</option>
                {uniqueClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
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
                <option value="Selesai">Selesai (Target Tercapai)</option>
                <option value="Hampir Selesai">Hampir Selesai (&ge;50%)</option>
                <option value="Belum">Belum (&lt;50%)</option>
              </select>

              {(kelompokFilter !== "all" || kelasFilter !== "all" || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setKelompokFilter("all");
                    setKelasFilter("all");
                    setStatusFilter("all");
                  }}
                  className="h-8 text-xs text-muted-foreground"
                >
                  Reset Filter
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Anggota</TableHead>
                <TableHead>Kelompok & Kelas</TableHead>
                <TableHead className="w-48">Progress (Kating / Target)</TableHead>
                <TableHead className="w-24">Persentase</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-20 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                    Tidak ada data progress anggota ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow key={item.anggota_id}>
                    <TableCell className="font-semibold">
                      {item.nama}{" "}
                      <span className="text-[11px] text-muted-foreground font-normal">
                        ({item.jenis_kelamin})
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs">{item.kelompok_nama}</div>
                      <div className="text-[11px] text-muted-foreground">{item.kelas}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs font-semibold">
                          {item.total_kating_met} / {item.target_kating} Kating
                        </div>
                        <Progress
                          value={item.percentage}
                          indicatorClassName={
                            item.status_color === "success"
                              ? "bg-emerald-500"
                              : item.status_color === "warning"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-xs">{item.percentage}%</TableCell>
                    <TableCell>
                      <Badge variant={item.status_color}>{item.status_label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAnggota(item);
                          setIsDetailOpen(true);
                        }}
                        className="h-8 px-2 text-xs"
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
            <span>
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member Kating Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="size-5 text-primary" /> Rincian Pertemuan Kating
            </DialogTitle>
            <DialogDescription className="text-xs">
              Riwayat Kating yang ditemui oleh {selectedAnggota?.nama}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border bg-muted/30 p-3 text-xs space-y-1">
              <div className="flex justify-between font-bold">
                <span>{selectedAnggota?.nama}</span>
                <Badge variant={selectedAnggota?.status_color}>
                  {selectedAnggota?.total_kating_met} / {selectedAnggota?.target_kating} Kating
                </Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Kelompok: {selectedAnggota?.kelompok_nama} ({selectedAnggota?.kelas})
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">
                Daftar Kating Unik Yang Ditemui:
              </label>

              {selectedAnggota?.kating_met_list.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                  Belum ada kating yang ditemui oleh anggota ini.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedAnggota?.kating_met_list.map((met, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border bg-card text-xs flex items-center justify-between shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                          <Shield className="size-3.5 text-primary" /> {met.kating_nama}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {met.jenis_kelamin === "L" ? "Akang (L)" : "Teteh (P)"} &bull; {met.slot_nama}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {met.tanggal}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

          {/* Riwayat Substitusi — hanya tampil jika ada */}
          {(selectedAnggota?.substitution_history?.length ?? 0) > 0 && (
            <div className="space-y-2 border-t pt-3">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <UserCheck className="size-3.5 text-indigo-400" /> Riwayat Substitusi
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {selectedAnggota?.substitution_history?.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border bg-muted/20 text-xs flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      {s.replaces_nama ? (
                        <p className="font-medium text-indigo-400">
                          Hadir sebagai Pengganti{" "}
                          <span className="font-bold">{s.replaces_nama}</span>
                        </p>
                      ) : (
                        <p className="font-medium text-rose-400">
                          Digantikan oleh{" "}
                          <span className="font-bold">{s.replaced_by_nama}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground">{s.slot_nama}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{s.tanggal}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

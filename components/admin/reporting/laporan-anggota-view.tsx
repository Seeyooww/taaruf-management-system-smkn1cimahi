"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
} from "lucide-react";
import type { LaporanAnggotaItem, MetKatingDetail } from "@/services/reporting.service";
import { getLaporanAnggotaAction } from "@/services/reporting.actions";
import {
  createManualProgressAction,
  deleteKatingHistoryAction,
  getKatingAndSlotOptionsAction,
  updateManualProgressAction,
} from "@/services/progress.actions";
import type { Kating, SlotWaktu } from "@/types/database";
import { exportToCSV, exportToExcel, exportToPDF, triggerPrint } from "@/utils/export-utils";

interface LaporanAnggotaViewProps {
  initialData: LaporanAnggotaItem[];
  kelompokList: { id: string; nomor_kelompok: number; kelas: string }[];
}

export function LaporanAnggotaView({ initialData, kelompokList }: LaporanAnggotaViewProps) {
  const router = useRouter();
  const [data, setData] = React.useState<LaporanAnggotaItem[]>(initialData);
  const [loading, setLoading] = React.useState(false);

  // Filters
  const [namaSearch, setNamaSearch] = React.useState("");
  const [kelompokId, setKelompokId] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [kelasFilter, setKelasFilter] = React.useState("all");

  // Selected Anggota for Detail Modal
  const [selectedAnggota, setSelectedAnggota] = React.useState<LaporanAnggotaItem | null>(null);

  // Delete Riwayat State
  const [deleteTarget, setDeleteTarget] = React.useState<{
    anggota: LaporanAnggotaItem;
    met: MetKatingDetail;
  } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Create / Edit Form state
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editTargetMet, setEditTargetMet] = React.useState<MetKatingDetail | null>(null);

  const [katingOptions, setKatingOptions] = React.useState<Kating[]>([]);
  const [slotOptions, setSlotOptions] = React.useState<SlotWaktu[]>([]);
  const [formKatingId, setFormKatingId] = React.useState("");
  const [formTanggal, setFormTanggal] = React.useState("");
  const [formSlotId, setFormSlotId] = React.useState("");
  const [katingFilterSearch, setKatingFilterSearch] = React.useState("");
  const [isSubmittingForm, setIsSubmittingForm] = React.useState(false);

  const loadOptions = React.useCallback(async () => {
    if (katingOptions.length > 0 && slotOptions.length > 0) return;
    try {
      const { katingOptions: kOpts, slotOptions: sOpts } = await getKatingAndSlotOptionsAction();
      setKatingOptions(kOpts);
      setSlotOptions(sOpts);
    } catch {
      toast.error("Gagal memuat opsi kating & slot.");
    }
  }, [katingOptions.length, slotOptions.length]);

  const handleOpenCreateForm = () => {
    setEditTargetMet(null);
    setFormKatingId("");
    setFormTanggal(new Date().toISOString().split("T")[0]);
    setFormSlotId(slotOptions[0]?.id ?? "");
    setKatingFilterSearch("");
    setIsFormOpen(true);
    loadOptions();
  };

  const handleOpenEditForm = (met: MetKatingDetail) => {
    setEditTargetMet(met);
    setFormKatingId(met.kating_id);
    setFormTanggal(met.tanggal || new Date().toISOString().split("T")[0]);

    const matchedSlot = slotOptions.find((s) => s.nama_slot === met.slot_nama);
    setFormSlotId(matchedSlot ? matchedSlot.id : slotOptions[0]?.id ?? "");
    setKatingFilterSearch("");
    setIsFormOpen(true);
    loadOptions();
  };

  const filteredKatingOptions = React.useMemo(() => {
    if (!katingFilterSearch.trim()) return katingOptions;
    const q = katingFilterSearch.toLowerCase();
    return katingOptions.filter(
      (k) => k.nama.toLowerCase().includes(q) || k.kelas.toLowerCase().includes(q)
    );
  }, [katingOptions, katingFilterSearch]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnggota) return;

    const slotToUse = formSlotId || slotOptions[0]?.id;
    if (!formKatingId || !formTanggal || !slotToUse) {
      toast.error("Seluruh kolom (Kating, Tanggal, Slot) wajib dipilih.");
      return;
    }

    setIsSubmittingForm(true);

    try {
      let res;
      if (editTargetMet) {
        res = await updateManualProgressAction(
          selectedAnggota.anggota_id,
          editTargetMet.kating_id,
          editTargetMet.booking_id,
          formKatingId,
          formTanggal,
          slotToUse
        );
      } else {
        res = await createManualProgressAction(
          selectedAnggota.anggota_id,
          formKatingId,
          formTanggal,
          slotToUse
        );
      }

      if (res.success) {
        toast.success(`✅ ${res.message}`);
        setIsFormOpen(false);

        // Refresh data dari server
        router.refresh();
        const newData = await getLaporanAnggotaAction({
          kelompokId: kelompokId === "all" ? undefined : kelompokId,
          namaSearch: namaSearch.trim() || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          kelas: kelasFilter === "all" ? undefined : kelasFilter,
        });
        setData(newData);

        // Update selectedAnggota agar dialog langsung merefleksikan perubahan
        const updatedAnggota =
          newData.find((a) => a.anggota_id === selectedAnggota.anggota_id) ?? null;
        setSelectedAnggota(updatedAnggota);
      } else {
        toast.error(`❌ ${res.message}`);
      }
    } catch {
      toast.error("❌ Gagal menyimpan data progress.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

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

  // ── Hapus Riwayat Handler ─────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { anggota, met } = deleteTarget;
    setIsDeleting(true);

    try {
      const res = await deleteKatingHistoryAction(met.kating_id, met.booking_id);
      if (res.success) {
        toast.success(
          `✅ Riwayat kating ${met.kating_nama} untuk ${anggota.nama} berhasil dihapus. Progress anggota diperbarui.`
        );

        // Refresh data dari server untuk sinkronisasi seluruh laporan & komponen
        router.refresh();

        const newData = await getLaporanAnggotaAction({
          kelompokId: kelompokId === "all" ? undefined : kelompokId,
          namaSearch: namaSearch.trim() || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          kelas: kelasFilter === "all" ? undefined : kelasFilter,
        });
        setData(newData);

        // Update selectedAnggota agar modal merefleksikan progress terbaru
        const updatedAnggota = newData.find((a) => a.anggota_id === anggota.anggota_id) ?? null;
        setSelectedAnggota(updatedAnggota);
      } else {
        toast.error(`❌ ${res.message}`);
      }
    } catch {
      toast.error("❌ Gagal menghapus riwayat. Silakan coba lagi.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
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
          <Button size="sm" onClick={triggerPrint} className="text-xs">
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
              <div className="flex items-center justify-between gap-2">
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <UserCheck className="size-5 text-primary" /> Detail Kating Met - {selectedAnggota.nama}
                </DialogTitle>
                <Button
                  size="sm"
                  onClick={handleOpenCreateForm}
                  className="h-7 text-xs bg-primary gap-1"
                >
                  <Plus className="size-3.5" /> Tambah Riwayat
                </Button>
              </div>
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
                      <div className="space-y-1 flex-1 min-w-0">
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
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="secondary" className="text-[10px]">
                          {met.kelompok_nama || selectedAnggota.kelompok_nama}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Edit riwayat ini"
                          onClick={() => handleOpenEditForm(met)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                          title="Hapus riwayat ini"
                          onClick={() => {
                            if (selectedAnggota) {
                              setDeleteTarget({ anggota: selectedAnggota, met });
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Form Create / Edit Progress Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              {editTargetMet ? (
                <>
                  <Pencil className="size-5 text-primary" /> Edit Riwayat Progress
                </>
              ) : (
                <>
                  <Plus className="size-5 text-primary" /> Tambah Riwayat Progress
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedAnggota?.nama} ({selectedAnggota?.kelompok_nama})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitForm} className="space-y-4 py-2 text-xs">
            {/* Select / Filter Kating */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Pilih Kating <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Cari nama kating / kelas..."
                value={katingFilterSearch}
                onChange={(e) => setKatingFilterSearch(e.target.value)}
                className="h-8 text-xs mb-1"
              />
              <select
                value={formKatingId}
                onChange={(e) => setFormKatingId(e.target.value)}
                required
                className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Pilih Kating --</option>
                {filteredKatingOptions.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama} ({k.jenis_kelamin === "L" ? "Akang" : "Teteh"}) - {k.kelas}
                  </option>
                ))}
              </select>
            </div>

            {/* Tanggal Input */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Tanggal Sesi <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={formTanggal}
                onChange={(e) => setFormTanggal(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            {/* Slot Dropdown */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Slot Waktu <span className="text-rose-500">*</span>
              </label>
              <select
                value={formSlotId}
                onChange={(e) => setFormSlotId(e.target.value)}
                required
                className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary"
              >
                {slotOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama_slot} ({s.jam_mulai} - {s.jam_selesai})
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmittingForm}
                onClick={() => setIsFormOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingForm} className="bg-primary">
                {isSubmittingForm
                  ? "Menyimpan..."
                  : editTargetMet
                  ? "Simpan Perubahan"
                  : "Simpan Riwayat"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="size-5" /> Hapus Riwayat Kating
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Tindakan ini akan mengurangi progress anggota. Riwayat booking tetap tersimpan.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className="rounded-xl border bg-muted/30 p-3 text-xs space-y-1.5 my-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <Shield className="size-3.5 text-primary" />
                {deleteTarget.met.kating_nama}
              </div>
              <div className="text-muted-foreground space-y-0.5 pl-5">
                <p>
                  <span className="text-foreground font-medium">Anggota:</span>{" "}
                  {deleteTarget.anggota.nama}
                </p>
                <p>
                  <span className="text-foreground font-medium">Kelompok:</span>{" "}
                  {deleteTarget.anggota.kelompok_nama} ({deleteTarget.anggota.kelas})
                </p>
                <p>
                  <span className="text-foreground font-medium">Tanggal:</span>{" "}
                  {deleteTarget.met.tanggal}
                </p>
                <p>
                  <span className="text-foreground font-medium">Slot:</span>{" "}
                  {deleteTarget.met.slot_nama}
                </p>
              </div>
              <p className="text-rose-500 text-[11px] font-medium pt-1 border-t border-border">
                ⚠ Progress anggota akan berkurang 1 kating.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus Riwayat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

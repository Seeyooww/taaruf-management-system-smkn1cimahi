"use client";

import * as React from "react";
import {
  Download,
  FileSpreadsheet,
  Plus,
  Search,
  Shield,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
  deleteKatingAction,
  importKatingAction,
  saveKatingAction,
} from "@/services/kating.actions";
import type { Gender, Kating } from "@/types/database";

interface KatingViewProps {
  initialKating: Kating[];
}

export function KatingView({ initialKating }: KatingViewProps) {
  const [data, setData] = React.useState<Kating[]>(initialKating);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");
  const [genderFilter, setGenderFilter] = React.useState<"all" | "L" | "P">("all");
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Kating | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const [formValues, setFormValues] = React.useState({
    id: "",
    nama: "",
    kelas: "",
    jenis_kelamin: "L" as Gender,
    nomor_whatsapp: "",
    aktif: true,
  });

  const [csvContent, setCsvContent] = React.useState("");

  // Filter
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const query = search.toLowerCase().trim();
      const statusLabel = item.aktif ? "aktif" : "nonaktif";
      const matchSearch =
        !query ||
        item.nama.toLowerCase().includes(query) ||
        item.kelas.toLowerCase().includes(query) ||
        item.nomor_whatsapp.includes(query) ||
        statusLabel.includes(query);

      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? item.aktif
          : !item.aktif;

      const matchGender =
        genderFilter === "all" ? true : item.jenis_kelamin === genderFilter;

      return matchSearch && matchStatus && matchGender;
    });
  }, [data, search, statusFilter, genderFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  const handleOpenAdd = () => {
    setFormValues({
      id: "",
      nama: "",
      kelas: "",
      jenis_kelamin: "L",
      nomor_whatsapp: "",
      aktif: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: Kating) => {
    setFormValues({
      id: item.id,
      nama: item.nama,
      kelas: item.kelas,
      jenis_kelamin: item.jenis_kelamin,
      nomor_whatsapp: item.nomor_whatsapp,
      aktif: item.aktif,
    });
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      if (formValues.id) formData.append("id", formValues.id);
      formData.append("nama", formValues.nama);
      formData.append("kelas", formValues.kelas);
      formData.append("jenis_kelamin", formValues.jenis_kelamin);
      formData.append("nomor_whatsapp", formValues.nomor_whatsapp);
      if (formValues.aktif) formData.append("aktif", "on");

      const res = await saveKatingAction(formData);
      if (res.success) {
        toast.success("✔ " + res.message);
        setIsFormOpen(false);
        setData((prev) => {
          if (formValues.id) {
            return prev.map((k) =>
              k.id === formValues.id ? { ...k, ...formValues } : k
            );
          }
          return [
            {
              ...formValues,
              id: (res as { data?: { id?: string } }).data?.id || formValues.id || `kat-${Date.now()}`,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ];
        });
      } else {
        toast.error("❌ " + res.message);
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteKatingAction(deleteTarget.id);
      if (res.success) {
        toast.success(`✔ Kating "${deleteTarget.nama}" berhasil dihapus.`);
        setData((prev) => prev.filter((k) => k.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        toast.error("❌ " + res.message);
      }
    });
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.append("csv", csvContent);
      const res = await importKatingAction(formData);
      if (res.success) {
        toast.success("✔ " + res.message);
        setIsImportOpen(false);
        setCsvContent("");
      } else {
        toast.error("❌ " + res.message);
      }
    });
  };

  const downloadTemplate = () => {
    const template = "nama,kelas,jenis_kelamin,nomor_whatsapp\nAkang Fikri Haikal,XII SIJA 1,L,081234567890\nTeteh Anisa Fitri,XII RPL 2,P,081987654321";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_kating.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Kakak Tingkat (Kating)</h1>
          <p className="text-xs text-muted-foreground">
            Kelola data Kating pendamping putra & putri.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 size-4 text-blue-500" /> Import CSV
          </Button>
          <Button size="sm" onClick={handleOpenAdd} className="bg-primary">
            <Plus className="mr-2 size-4" /> Tambah Kating
          </Button>
        </div>
      </div>

      {/* Filter & Table Card */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="size-4 text-primary" /> Daftar Kating ({filteredData.length})
            </CardTitle>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari Kating / WhatsApp..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              <select
                value={genderFilter}
                onChange={(e) => {
                  setGenderFilter(e.target.value as "all" | "L" | "P");
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="all">Semua Gender</option>
                <option value="L">Akang (L)</option>
                <option value="P">Teteh (P)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "all" | "active" | "inactive");
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif Saja</option>
                <option value="inactive">Tidak Aktif</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Nama Kating</TableHead>
                  <TableHead className="text-xs">Kelas</TableHead>
                  <TableHead className="text-xs">Gender</TableHead>
                  <TableHead className="text-xs">Nomor WhatsApp</TableHead>
                  <TableHead className="w-24 text-xs">Status</TableHead>
                  <TableHead className="w-24 text-right text-xs">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Shield className="size-8 text-muted-foreground/50" />
                        <p className="font-semibold text-xs text-foreground">Tidak ada data Kating</p>
                        <p className="text-[11px] text-muted-foreground">Silakan tambah atau sesuaikan pencarian.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-semibold text-xs flex items-center gap-1.5">
                        <Shield className="size-3.5 text-indigo-500 shrink-0" />
                        <span>{item.nama}</span>
                      </TableCell>
                      <TableCell className="text-xs">{item.kelas}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {item.jenis_kelamin === "L" ? "Akang (L)" : "Teteh (P)"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {item.nomor_whatsapp}
                      </TableCell>
                      <TableCell>
                        {item.aktif ? (
                          <Badge variant="success" className="text-[10px]">Aktif</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">Nonaktif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            className="h-7 px-2 text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(item)}
                            disabled={isPending}
                            className="size-7 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
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
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {formValues.id ? "Edit Data Kating" : "Tambah Data Kating"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Isi formulir Kating pendamping.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nama_kating" className="text-xs">Nama Lengkap Kating</Label>
              <Input
                id="nama_kating"
                type="text"
                placeholder="Contoh: Akang Fikri Haikal"
                required
                value={formValues.nama}
                onChange={(e) => setFormValues((p) => ({ ...p, nama: e.target.value }))}
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kelas_kating" className="text-xs">Kelas</Label>
              <Input
                id="kelas_kating"
                type="text"
                placeholder="Contoh: XII SIJA 1"
                required
                value={formValues.kelas}
                onChange={(e) => setFormValues((p) => ({ ...p, kelas: e.target.value }))}
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jk_kating" className="text-xs">Jenis Kelamin</Label>
              <select
                id="jk_kating"
                value={formValues.jenis_kelamin}
                onChange={(e) =>
                  setFormValues((p) => ({ ...p, jenis_kelamin: e.target.value as Gender }))
                }
                className="w-full rounded-md border border-input bg-background p-2 text-xs"
              >
                <option value="L">Akang / Laki-laki (L)</option>
                <option value="P">Teteh / Perempuan (P)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomor_wa" className="text-xs">Nomor WhatsApp</Label>
              <Input
                id="nomor_wa"
                type="text"
                placeholder="Contoh: 081234567890"
                required
                value={formValues.nomor_whatsapp}
                onChange={(e) => setFormValues((p) => ({ ...p, nomor_whatsapp: e.target.value }))}
                className="text-xs"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="aktif_kating"
                checked={formValues.aktif}
                onChange={(e) => setFormValues((p) => ({ ...p, aktif: e.target.checked }))}
                className="rounded border-input"
              />
              <Label htmlFor="aktif_kating" className="text-xs cursor-pointer font-normal">
                Status Kating Aktif
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="text-xs">
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="text-xs bg-primary">
                {isPending ? "Menyimpan..." : "Simpan Kating"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <FileSpreadsheet className="size-5 text-primary" /> Import Data Kating
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload atau tempel isi file CSV untuk mengimpor banyak Kating sekaligus.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleImport} className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="csv-kating" className="text-xs">Isi Format CSV</Label>
              <Button type="button" variant="ghost" size="sm" onClick={downloadTemplate} className="text-xs text-primary">
                <Download className="mr-1 size-3.5" /> Unduh Template CSV
              </Button>
            </div>
            <textarea
              id="csv-kating"
              rows={6}
              className="w-full rounded-md border border-input bg-background p-3 text-xs font-mono"
              placeholder={"nama,kelas,jenis_kelamin,nomor_whatsapp\nAkang Fikri Haikal,XII SIJA 1,L,081234567890\nTeteh Anisa Fitri,XII RPL 2,P,081987654321"}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              required
            />
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsImportOpen(false)} className="text-xs">
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="text-xs bg-primary">
                {isPending ? "Mengimpor..." : "Proses Import"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={() => setDeleteTarget(null)}
        title="Hapus Kating?"
        itemName={deleteTarget ? `${deleteTarget.nama} (${deleteTarget.kelas})` : ""}
        description="Aksi ini tidak dapat dibatalkan."
        onConfirm={handleConfirmDelete}
        isPending={isPending}
      />
    </div>
  );
}

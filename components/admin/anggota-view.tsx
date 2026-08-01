"use client";

import * as React from "react";
import {
  Download,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Upload,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
  deleteAnggotaAction,
  importAnggotaAction,
  saveAnggotaAction,
} from "@/services/anggota.actions";
import type { Anggota, Gender, Kelompok } from "@/types/database";

interface AnggotaViewProps {
  initialAnggota: Anggota[];
  kelompokList: Kelompok[];
}

export function AnggotaView({ initialAnggota, kelompokList }: AnggotaViewProps) {
  const router = useRouter();
  const [data, setData] = React.useState<Anggota[]>(initialAnggota);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");
  const [kelompokFilter, setKelompokFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Anggota | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const [formValues, setFormValues] = React.useState({
    id: "",
    kelompok_id: kelompokList[0]?.id || "",
    nama: "",
    jenis_kelamin: "L" as Gender,
    aktif: true,
  });

  const [csvContent, setCsvContent] = React.useState("");

  // Filtering
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const query = search.toLowerCase().trim();
      const statusLabel = item.aktif ? "aktif" : "nonaktif";
      const matchSearch =
        !query ||
        item.nama.toLowerCase().includes(query) ||
        (item.kelompok_nama && item.kelompok_nama.toLowerCase().includes(query)) ||
        statusLabel.includes(query);

      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? item.aktif
            : !item.aktif;

      const matchKelompok =
        kelompokFilter === "all" ? true : item.kelompok_id === kelompokFilter;

      return matchSearch && matchStatus && matchKelompok;
    });
  }, [data, search, statusFilter, kelompokFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  const handleOpenAdd = () => {
    setFormValues({
      id: "",
      kelompok_id: kelompokList[0]?.id || "",
      nama: "",
      jenis_kelamin: "L",
      aktif: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: Anggota) => {
    setFormValues({
      id: item.id,
      kelompok_id: item.kelompok_id,
      nama: item.nama,
      jenis_kelamin: item.jenis_kelamin,
      aktif: item.aktif,
    });
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      if (formValues.id) formData.append("id", formValues.id);
      formData.append("kelompok_id", formValues.kelompok_id);
      formData.append("nama", formValues.nama);
      formData.append("jenis_kelamin", formValues.jenis_kelamin);
      if (formValues.aktif) formData.append("aktif", "on");

      const res = await saveAnggotaAction(formData);
      if (res.success) {
        toast.success("✔ " + res.message);
        setIsFormOpen(false);
        const kObj = kelompokList.find((k) => k.id === formValues.kelompok_id);
        const kName = kObj ? `Kelompok ${kObj.nomor_kelompok} (${kObj.kelas})` : "Tidak Diketahui";

        setData((prev) => {
          if (formValues.id) {
            return prev.map((a) =>
              a.id === formValues.id
                ? { ...a, ...formValues, kelompok_nama: kName }
                : a
            );
          }
          return [
            {
              ...formValues,
              id: (res as { data?: { id?: string } }).data?.id || formValues.id || `ang-${Date.now()}`,
              created_at: new Date().toISOString(),
              kelompok_nama: kName,
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
      const res = await deleteAnggotaAction(deleteTarget.id);
      if (res.success) {
        toast.success(`✔ Anggota "${deleteTarget.nama}" berhasil dihapus.`);
        setData((prev) => prev.filter((a) => a.id !== deleteTarget.id));
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
      const res = await importAnggotaAction(formData);
      if (res.success) {
        toast.success("✔ " + res.message);
        setIsImportOpen(false);
        setCsvContent("");
        router.refresh();
      } else {
        toast.error("❌ " + res.message);
      }
    });
  };

  const downloadTemplate = () => {
    const kId = kelompokList[0]?.id || "kel-1";
    const template = `kelompok_id,nama,jenis_kelamin\n${kId},Ahmad Fauzi,L\n${kId},Siti Rahmawati,P`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_anggota.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Anggota Kelompok</h1>
          <p className="text-xs text-muted-foreground">
            Kelola data siswa/i peserta Taaruf per kelompok.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 size-4 text-blue-500" /> Import CSV
          </Button>
          <Button size="sm" onClick={handleOpenAdd} className="bg-primary">
            <Plus className="mr-2 size-4" /> Tambah Anggota
          </Button>
        </div>
      </div>

      {/* Filter & Table Card */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="size-4 text-primary" /> Daftar Anggota ({filteredData.length})
            </CardTitle>

            {/* Filters bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari nama anggota..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8 h-8 text-xs"
                />
              </div>

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
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Nama Anggota</TableHead>
                  <TableHead className="text-xs">L/P</TableHead>
                  <TableHead className="text-xs">Kelompok</TableHead>
                  <TableHead className="w-24 text-xs">Status</TableHead>
                  <TableHead className="w-24 text-right text-xs">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <UserCheck className="size-8 text-muted-foreground/50" />
                        <p className="font-semibold text-xs text-foreground">Tidak ada data anggota</p>
                        <p className="text-[11px] text-muted-foreground">Silakan tambah atau sesuaikan pencarian.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-semibold text-xs">{item.nama}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {item.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.kelompok_nama}</TableCell>
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
              {formValues.id ? "Edit Data Anggota" : "Tambah Data Anggota"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Isi data anggota peserta Taaruf.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="kelompok_id" className="text-xs">Pilih Kelompok</Label>
              <select
                id="kelompok_id"
                required
                value={formValues.kelompok_id}
                onChange={(e) => setFormValues((p) => ({ ...p, kelompok_id: e.target.value }))}
                className="w-full rounded-md border border-input bg-background p-2 text-xs"
              >
                {kelompokList.map((k) => (
                  <option key={k.id} value={k.id}>
                    Kelompok {k.nomor_kelompok} ({k.kelas})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama_anggota" className="text-xs">Nama Lengkap</Label>
              <Input
                id="nama_anggota"
                type="text"
                placeholder="Contoh: Ahmad Fauzi"
                required
                value={formValues.nama}
                onChange={(e) => setFormValues((p) => ({ ...p, nama: e.target.value }))}
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jenis_kelamin" className="text-xs">Jenis Kelamin</Label>
              <select
                id="jenis_kelamin"
                value={formValues.jenis_kelamin}
                onChange={(e) =>
                  setFormValues((p) => ({ ...p, jenis_kelamin: e.target.value as Gender }))
                }
                className="w-full rounded-md border border-input bg-background p-2 text-xs"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="aktif"
                checked={formValues.aktif}
                onChange={(e) => setFormValues((p) => ({ ...p, aktif: e.target.checked }))}
                className="rounded border-input"
              />
              <Label htmlFor="aktif" className="text-xs cursor-pointer font-normal">
                Status Akun Aktif
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="text-xs">
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="text-xs bg-primary">
                {isPending ? "Menyimpan..." : "Simpan Anggota"}
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
              <FileSpreadsheet className="size-5 text-primary" /> Import Data Anggota
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload atau tempel isi file CSV untuk mengimpor banyak anggota sekaligus.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleImport} className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="csv-anggota" className="text-xs">Isi Format CSV</Label>
              <Button type="button" variant="ghost" size="sm" onClick={downloadTemplate} className="text-xs text-primary">
                <Download className="mr-1 size-3.5" /> Unduh Template CSV
              </Button>
            </div>
            <textarea
              id="csv-anggota"
              rows={6}
              className="w-full rounded-md border border-input bg-background p-3 text-xs font-mono"
              placeholder={`kelompok_id,nama,jenis_kelamin\n${kelompokList[0]?.id || "kel-1"},Ahmad Fauzi,L\n${kelompokList[0]?.id || "kel-1"},Siti Rahmawati,P`}
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
        title="Hapus Anggota?"
        itemName={deleteTarget ? deleteTarget.nama : ""}
        description="Aksi ini tidak dapat dibatalkan."
        onConfirm={handleConfirmDelete}
        isPending={isPending}
      />
    </div>
  );
}

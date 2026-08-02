"use client";

import * as React from "react";
import {
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Key,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
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
  deleteKelompokAction,
  importKelompokAction,
  saveKelompokAction,
  updateKelompokPasswordAction,
} from "@/services/kelompok.actions";
import type { Kelompok } from "@/types/database";

interface KelompokViewProps {
  initialData: Kelompok[];
}

export function KelompokView({ initialData }: KelompokViewProps) {
  const router = useRouter();
  const [data, setData] = React.useState<Kelompok[]>(initialData);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Kelompok | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const [formValues, setFormValues] = React.useState({
    nomor_kelompok: "",
    kelas: "",
    username: "",
  });

  const [csvContent, setCsvContent] = React.useState("");

  // Password management state
  const [pwTarget, setPwTarget] = React.useState<Kelompok | null>(null);
  const [pwValue, setPwValue] = React.useState("");
  const [pwConfirm, setPwConfirm] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [visiblePasswords, setVisiblePasswords] = React.useState<Set<string>>(new Set());

  // Filter & Search
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const query = search.toLowerCase().trim();
      if (!query) return true;
      return (
        String(item.nomor_kelompok).includes(query) ||
        `kelompok ${item.nomor_kelompok}`.toLowerCase().includes(query) ||
        item.kelas.toLowerCase().includes(query) ||
        item.username.toLowerCase().includes(query)
      );
    });
  }, [data, search]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.append("nomor_kelompok", formValues.nomor_kelompok);
      formData.append("kelas", formValues.kelas);
      formData.append("username", formValues.username);

      const res = await saveKelompokAction(formData);
      if (res.success) {
        toast.success("✔ " + res.message);
        setIsFormOpen(false);
        setFormValues({ nomor_kelompok: "", kelas: "", username: "" });
        router.refresh(); // Re-fetch data dari Supabase
      } else {
        toast.error("❌ " + res.message);
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteKelompokAction(deleteTarget.id);
      if (res.success) {
        toast.success(`✔ Kelompok ${deleteTarget.nomor_kelompok} berhasil dihapus.`);
        setData((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        toast.error("❌ " + res.message);
      }
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwTarget) return;
    if (pwValue !== pwConfirm) {
      toast.error("❌ Konfirmasi password tidak cocok.");
      return;
    }
    if (pwValue.length < 6) {
      toast.error("❌ Password minimal 6 karakter.");
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.append("kelompok_id", pwTarget.id);
      formData.append("username", pwTarget.username);
      formData.append("new_password", pwValue);
      const res = await updateKelompokPasswordAction(formData);
      if (res.success) {
        toast.success("🔑 " + res.message);
        setPwTarget(null);
        setPwValue("");
        setPwConfirm("");
        setShowPw(false);
      } else {
        toast.error("❌ " + res.message);
      }
    });
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.append("csv", csvContent);
      const res = await importKelompokAction(formData);
      if (res.success) {
        toast.success("✔ " + res.message);
        setIsImportOpen(false);
        setCsvContent("");
        router.refresh(); // Re-fetch data dari Supabase agar tabel terupdate
      } else {
        toast.error("❌ " + res.message);
      }
    });
  };

  const downloadTemplate = () => {
    const template = "nomor_kelompok,kelas,username\n1,X SIJA 1,kelompok1\n2,X SIJA 2,kelompok2";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_kelompok.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Kelompok</h1>
          <p className="text-xs text-muted-foreground">
            Kelola daftar kelompok peserta Taaruf SMKN 1 Cimahi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 size-4 text-blue-500" /> Import CSV
          </Button>
          <Button size="sm" onClick={() => setIsFormOpen(true)} className="bg-primary">
            <Plus className="mr-2 size-4" /> Tambah Kelompok
          </Button>
        </div>
      </div>

      {/* Filter & Table Card */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4 text-primary" /> Daftar Kelompok ({filteredData.length})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari nomor kelompok / kelas..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
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
                  <TableHead className="w-28 text-xs">No. Kelompok</TableHead>
                  <TableHead className="text-xs">Kelas</TableHead>
                  <TableHead className="text-xs">Username</TableHead>
                  <TableHead className="text-xs">Password</TableHead>
                  <TableHead className="w-32 text-xs">Total Anggota</TableHead>
                  <TableHead className="w-32 text-right text-xs">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="size-8 text-muted-foreground/50" />
                        <p className="font-semibold text-xs text-foreground">Tidak ada data kelompok</p>
                        <p className="text-[11px] text-muted-foreground">Silakan tambah atau sesuaikan pencarian.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => {
                    const isVisible = visiblePasswords.has(item.id);
                    return (
                      <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-bold text-xs">Kelompok {item.nomor_kelompok}</TableCell>
                        <TableCell className="text-xs">{item.kelas}</TableCell>
                        <TableCell className="font-mono text-xs">{item.username}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs select-none">
                              {isVisible ? item.username : "••••••••"}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 text-muted-foreground hover:text-foreground"
                              onClick={() => togglePasswordVisibility(item.id)}
                              title={isVisible ? "Sembunyikan" : "Tampilkan password"}
                            >
                              {isVisible ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {item.total_anggota || 0} Anggota
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setPwTarget(item);
                                setPwValue("");
                                setPwConfirm("");
                                setShowPw(false);
                              }}
                              disabled={isPending}
                              className="size-7 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
                              title="Ubah Password"
                            >
                              <Key className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(item)}
                              disabled={isPending}
                              className="size-7 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                              title="Hapus Kelompok"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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

      {/* Add Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Tambah Data Kelompok</DialogTitle>
            <DialogDescription className="text-xs">
              Masukkan informasi kelompok baru.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nomor_kelompok" className="text-xs">Nomor Kelompok</Label>
              <Input
                id="nomor_kelompok"
                type="number"
                placeholder="Contoh: 1"
                required
                value={formValues.nomor_kelompok}
                onChange={(e) =>
                  setFormValues((p) => ({ ...p, nomor_kelompok: e.target.value }))
                }
                className="text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kelas" className="text-xs">Kelas</Label>
              <Input
                id="kelas"
                type="text"
                placeholder="Contoh: X SIJA 1"
                required
                value={formValues.kelas}
                onChange={(e) =>
                  setFormValues((p) => ({ ...p, kelas: e.target.value }))
                }
                className="text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs">Username Login</Label>
              <Input
                id="username"
                type="text"
                placeholder="Contoh: kelompok1"
                required
                value={formValues.username}
                onChange={(e) =>
                  setFormValues((p) => ({ ...p, username: e.target.value }))
                }
                className="text-xs"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="text-xs">
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="text-xs bg-primary">
                {isPending ? "Menyimpan..." : "Simpan Kelompok"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={Boolean(pwTarget)} onOpenChange={(open) => { if (!open) { setPwTarget(null); setPwValue(""); setPwConfirm(""); setShowPw(false); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Key className="size-4 text-amber-500" />
              Ubah Password Kelompok
            </DialogTitle>
            <DialogDescription className="text-xs">
              Password baru untuk{" "}
              <span className="font-semibold text-foreground">
                Kelompok {pwTarget?.nomor_kelompok} ({pwTarget?.username})
              </span>.
              Perubahan akan langsung berlaku di Supabase Auth.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pw-username" className="text-xs">Username (tidak dapat diubah)</Label>
              <Input
                id="pw-username"
                type="text"
                value={pwTarget?.username ?? ""}
                disabled
                className="text-xs font-mono bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw-new" className="text-xs">Password Baru</Label>
              <div className="relative">
                <Input
                  id="pw-new"
                  type={showPw ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                  value={pwValue}
                  onChange={(e) => setPwValue(e.target.value)}
                  className="text-xs pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw-confirm" className="text-xs">Konfirmasi Password Baru</Label>
              <Input
                id="pw-confirm"
                type={showPw ? "text" : "password"}
                placeholder="Ulangi password baru"
                required
                minLength={6}
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                className="text-xs"
              />
            </div>
            {pwConfirm && pwValue !== pwConfirm && (
              <p className="text-[11px] text-rose-500">Password tidak cocok.</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setPwTarget(null); setPwValue(""); setPwConfirm(""); setShowPw(false); }}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending || !pwValue || pwValue !== pwConfirm}
                className="text-xs bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isPending ? "Menyimpan..." : "Simpan Password"}
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
              <FileSpreadsheet className="size-5 text-primary" /> Import Data Kelompok
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload atau tempel isi file CSV untuk mengimpor banyak kelompok sekaligus.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleImport} className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="csv-content" className="text-xs">Isi Format CSV</Label>
              <Button type="button" variant="ghost" size="sm" onClick={downloadTemplate} className="text-xs text-primary">
                <Download className="mr-1 size-3.5" /> Unduh Template CSV
              </Button>
            </div>
            <textarea
              id="csv-content"
              rows={6}
              className="w-full rounded-md border border-input bg-background p-3 text-xs font-mono"
              placeholder={"nomor_kelompok,kelas,username\n1,X SIJA 1,kelompok1\n2,X SIJA 2,kelompok2"}
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
        title="Hapus Kelompok?"
        itemName={deleteTarget ? `Kelompok ${deleteTarget.nomor_kelompok} (${deleteTarget.kelas})` : ""}
        description="Menghapus kelompok akan menghapus seluruh asosiasi data anggota pada kelompok ini."
        onConfirm={handleConfirmDelete}
        isPending={isPending}
      />
    </div>
  );
}

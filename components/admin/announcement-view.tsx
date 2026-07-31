"use client";

import * as React from "react";
import { Bell, Plus, Trash2 } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { deleteAnnouncementAction, saveAnnouncementAction } from "@/services/announcement.actions";
import type { Announcement } from "@/types/database";

interface AnnouncementViewProps {
  initialAnnouncements: Announcement[];
}

export function AnnouncementView({ initialAnnouncements }: AnnouncementViewProps) {
  const [data, setData] = React.useState<Announcement[]>(initialAnnouncements);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Announcement | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const [formValues, setFormValues] = React.useState({
    id: "",
    judul: "",
    isi: "",
    aktif: true,
  });

  const handleOpenAdd = () => {
    setFormValues({
      id: "",
      judul: "",
      isi: "",
      aktif: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: Announcement) => {
    setFormValues({
      id: item.id,
      judul: item.judul,
      isi: item.isi,
      aktif: item.aktif,
    });
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      if (formValues.id) formData.append("id", formValues.id);
      formData.append("judul", formValues.judul);
      formData.append("isi", formValues.isi);
      if (formValues.aktif) formData.append("aktif", "on");

      const res = await saveAnnouncementAction(formData);
      if (res.success) {
        toast.success("✔ " + res.message);
        setIsFormOpen(false);
        setData((prev) => {
          if (formValues.id) {
            return prev.map((a) => (a.id === formValues.id ? { ...a, ...formValues } : a));
          }
          return [
            {
              ...formValues,
              id: res.data?.id || formValues.id || `ann-${Date.now()}`,
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
      const res = await deleteAnnouncementAction(deleteTarget.id);
      if (res.success) {
        toast.success(`✔ Pengumuman "${deleteTarget.judul}" berhasil dihapus.`);
        setData((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        toast.error("❌ " + res.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Pengumuman</h1>
          <p className="text-xs text-muted-foreground">
            Kelola pengumuman resmi yang tampil pada Landing Page dan Dashboard.
          </p>
        </div>
        <Button size="sm" onClick={handleOpenAdd} className="bg-primary">
          <Plus className="mr-2 size-4" /> Tambah Pengumuman
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="size-4 text-primary" /> Daftar Pengumuman ({data.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Judul Pengumuman</TableHead>
                  <TableHead className="text-xs">Isi Ringkas</TableHead>
                  <TableHead className="w-24 text-xs">Status</TableHead>
                  <TableHead className="w-24 text-right text-xs">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Bell className="size-8 text-muted-foreground/50" />
                        <p className="font-semibold text-xs text-foreground">Belum ada pengumuman</p>
                        <p className="text-[11px] text-muted-foreground">Klik &quot;Tambah Pengumuman&quot; untuk menambahkan.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-semibold text-xs">{item.judul}</TableCell>
                      <TableCell className="text-xs text-muted-foreground line-clamp-2 max-w-md">
                        {item.isi}
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
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {formValues.id ? "Edit Pengumuman" : "Tambah Pengumuman"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Isi pengumuman yang akan dipublikasikan ke peserta.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="judul_announcement" className="text-xs">Judul Pengumuman</Label>
              <Input
                id="judul_announcement"
                type="text"
                placeholder="Contoh: Pembagian Kelompok Taaruf"
                required
                value={formValues.judul}
                onChange={(e) => setFormValues((p) => ({ ...p, judul: e.target.value }))}
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isi_announcement" className="text-xs">Isi Pengumuman</Label>
              <Textarea
                id="isi_announcement"
                rows={5}
                required
                placeholder="Tuliskan detail pengumuman di sini..."
                value={formValues.isi}
                onChange={(e) => setFormValues((p) => ({ ...p, isi: e.target.value }))}
                className="text-xs"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="aktif_announcement"
                checked={formValues.aktif}
                onChange={(e) => setFormValues((p) => ({ ...p, aktif: e.target.checked }))}
                className="rounded border-input"
              />
              <Label htmlFor="aktif_announcement" className="text-xs cursor-pointer font-normal">
                Publikasikan / Aktifkan Pengumuman
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="text-xs">
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="text-xs bg-primary">
                {isPending ? "Menyimpan..." : "Simpan Pengumuman"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={() => setDeleteTarget(null)}
        title="Hapus Pengumuman?"
        itemName={deleteTarget ? deleteTarget.judul : ""}
        description="Aksi ini tidak dapat dibatalkan."
        onConfirm={handleConfirmDelete}
        isPending={isPending}
      />
    </div>
  );
}

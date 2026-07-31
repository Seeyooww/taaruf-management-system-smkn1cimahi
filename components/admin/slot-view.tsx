"use client";

import * as React from "react";
import { Clock, Plus, Trash2 } from "lucide-react";
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
import { deleteSlotAction, saveSlotAction } from "@/services/slot.actions";
import type { SlotWaktu } from "@/types/database";

interface SlotViewProps {
  initialSlotList: SlotWaktu[];
}

export function SlotView({ initialSlotList }: SlotViewProps) {
  const [data, setData] = React.useState<SlotWaktu[]>(initialSlotList);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<SlotWaktu | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const [formValues, setFormValues] = React.useState({
    id: "",
    nama_slot: "",
    jam_mulai: "09:00",
    jam_selesai: "09:30",
    urutan: 1,
    aktif: true,
  });

  const handleOpenAdd = () => {
    setFormValues({
      id: "",
      nama_slot: "",
      jam_mulai: "09:00",
      jam_selesai: "09:30",
      urutan: data.length + 1,
      aktif: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: SlotWaktu) => {
    setFormValues({
      id: item.id,
      nama_slot: item.nama_slot,
      jam_mulai: item.jam_mulai,
      jam_selesai: item.jam_selesai,
      urutan: item.urutan,
      aktif: item.aktif,
    });
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      if (formValues.id) formData.append("id", formValues.id);
      formData.append("nama_slot", formValues.nama_slot);
      formData.append("jam_mulai", formValues.jam_mulai);
      formData.append("jam_selesai", formValues.jam_selesai);
      formData.append("urutan", String(formValues.urutan));
      if (formValues.aktif) formData.append("aktif", "on");

      const res = await saveSlotAction(formData);
      if (res.success) {
        toast.success("✔ " + res.message);
        setIsFormOpen(false);
        setData((prev) => {
          if (formValues.id) {
            return prev
              .map((s) => (s.id === formValues.id ? { ...s, ...formValues } : s))
              .sort((a, b) => a.urutan - b.urutan);
          }
          return [
            ...prev,
            { id: `slot-${Date.now()}`, ...formValues },
          ].sort((a, b) => a.urutan - b.urutan);
        });
      } else {
        toast.error("❌ " + res.message);
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteSlotAction(deleteTarget.id);
      if (res.success) {
        toast.success(`✔ Slot "${deleteTarget.nama_slot}" berhasil dihapus.`);
        setData((prev) => prev.filter((s) => s.id !== deleteTarget.id));
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
          <h1 className="text-2xl font-bold tracking-tight">Pengaturan Slot Waktu</h1>
          <p className="text-xs text-muted-foreground">
            Kelola pilihan jam istirahat dan slot waktu kegiatan Taaruf.
          </p>
        </div>
        <Button size="sm" onClick={handleOpenAdd} className="bg-primary">
          <Plus className="mr-2 size-4" /> Tambah Slot Waktu
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="size-4 text-primary" /> Daftar Slot Waktu ({data.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20 text-xs">Urutan</TableHead>
                  <TableHead className="text-xs">Nama Slot</TableHead>
                  <TableHead className="text-xs">Jam Mulai - Jam Selesai</TableHead>
                  <TableHead className="w-24 text-xs">Status</TableHead>
                  <TableHead className="w-24 text-right text-xs">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Clock className="size-8 text-muted-foreground/50" />
                        <p className="font-semibold text-xs text-foreground">Belum ada slot waktu</p>
                        <p className="text-[11px] text-muted-foreground">Klik &quot;Tambah Slot Waktu&quot; untuk menambahkan.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-bold text-xs">#{item.urutan}</TableCell>
                      <TableCell className="font-semibold text-xs">{item.nama_slot}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {item.jam_mulai} - {item.jam_selesai} WIB
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {formValues.id ? "Edit Slot Waktu" : "Tambah Slot Waktu"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Isi parameter nama slot dan alokasi jam.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nama_slot" className="text-xs">Nama Slot</Label>
              <Input
                id="nama_slot"
                type="text"
                placeholder="Contoh: Istirahat 1"
                required
                value={formValues.nama_slot}
                onChange={(e) => setFormValues((p) => ({ ...p, nama_slot: e.target.value }))}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="jam_mulai" className="text-xs">Jam Mulai</Label>
                <Input
                  id="jam_mulai"
                  type="text"
                  placeholder="09:30"
                  required
                  value={formValues.jam_mulai}
                  onChange={(e) => setFormValues((p) => ({ ...p, jam_mulai: e.target.value }))}
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jam_selesai" className="text-xs">Jam Selesai</Label>
                <Input
                  id="jam_selesai"
                  type="text"
                  placeholder="10:00"
                  required
                  value={formValues.jam_selesai}
                  onChange={(e) => setFormValues((p) => ({ ...p, jam_selesai: e.target.value }))}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urutan" className="text-xs">Urutan Tampilan</Label>
              <Input
                id="urutan"
                type="number"
                required
                value={formValues.urutan}
                onChange={(e) =>
                  setFormValues((p) => ({ ...p, urutan: parseInt(e.target.value, 10) || 1 }))
                }
                className="text-xs"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="aktif_slot"
                checked={formValues.aktif}
                onChange={(e) => setFormValues((p) => ({ ...p, aktif: e.target.checked }))}
                className="rounded border-input"
              />
              <Label htmlFor="aktif_slot" className="text-xs cursor-pointer font-normal">
                Slot Waktu Aktif
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="text-xs">
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="text-xs bg-primary">
                {isPending ? "Menyimpan..." : "Simpan Slot"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={() => setDeleteTarget(null)}
        title="Hapus Slot Waktu?"
        itemName={deleteTarget ? `${deleteTarget.nama_slot} (${deleteTarget.jam_mulai} - ${deleteTarget.jam_selesai})` : ""}
        description="Menghapus slot waktu ini tidak dapat dibatalkan."
        onConfirm={handleConfirmDelete}
        isPending={isPending}
      />
    </div>
  );
}

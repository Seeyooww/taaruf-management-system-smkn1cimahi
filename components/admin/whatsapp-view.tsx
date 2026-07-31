"use client";

import * as React from "react";
import { MessageSquare, Plus, Send, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { deleteWATemplateAction, saveWATemplateAction } from "@/services/whatsapp.actions";
import type { WhatsAppTemplate } from "@/types/database";

interface WhatsAppViewProps {
  initialTemplates: WhatsAppTemplate[];
}

export function WhatsAppView({ initialTemplates }: WhatsAppViewProps) {
  const [data, setData] = React.useState<WhatsAppTemplate[]>(initialTemplates);
  const [selectedTemplate, setSelectedTemplate] = React.useState<WhatsAppTemplate | null>(
    initialTemplates[0] || null
  );

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<WhatsAppTemplate | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const [formValues, setFormValues] = React.useState({
    id: "",
    nama_template: "",
    isi_template: "",
  });

  // Live Preview Placeholder State
  const [previewValues, setPreviewValues] = React.useState({
    kelompok: "Kelompok 1 (X SIJA 1)",
    hari: "Senin, 3 Agustus 2026",
    slot: "Istirahat 1 (09:30 - 10:00 WIB)",
    akang: "Fikri Haikal",
    teteh: "Anisa Fitri",
  });

  const handleOpenAdd = () => {
    setFormValues({
      id: "",
      nama_template: "",
      isi_template:
        "Halo Akang {{akang}} & Teteh {{teteh}}, kami dari {{kelompok}} mengajukan sesi Taaruf pada hari {{hari}}, slot {{slot}}. Mohon konfirmasinya.",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: WhatsAppTemplate) => {
    setFormValues({
      id: item.id,
      nama_template: item.nama_template,
      isi_template: item.isi_template,
    });
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      if (formValues.id) formData.append("id", formValues.id);
      formData.append("nama_template", formValues.nama_template);
      formData.append("isi_template", formValues.isi_template);

      const res = await saveWATemplateAction(formData);
      if (res.success) {
        toast.success("✔ " + res.message);
        setIsFormOpen(false);
        const updatedItem = {
          id: formValues.id || `wa-${Date.now()}`,
          nama_template: formValues.nama_template,
          isi_template: formValues.isi_template,
          created_at: new Date().toISOString(),
        };

        setData((prev) => {
          if (formValues.id) {
            return prev.map((w) => (w.id === formValues.id ? updatedItem : w));
          }
          return [updatedItem, ...prev];
        });
        setSelectedTemplate(updatedItem);
      } else {
        toast.error("❌ " + res.message);
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteWATemplateAction(deleteTarget.id);
      if (res.success) {
        toast.success(`✔ Template "${deleteTarget.nama_template}" berhasil dihapus.`);
        setData((prev) => {
          const nextData = prev.filter((w) => w.id !== deleteTarget.id);
          if (selectedTemplate?.id === deleteTarget.id) {
            setSelectedTemplate(nextData[0] || null);
          }
          return nextData;
        });
        setDeleteTarget(null);
      } else {
        toast.error("❌ " + res.message);
      }
    });
  };

  // Live Template Engine Renderer
  const renderedPreview = React.useMemo(() => {
    if (!selectedTemplate) return "Pilih atau buat template untuk melihat pratinjau.";
    let text = selectedTemplate.isi_template;
    text = text.replace(/\{\{kelompok\}\}/g, previewValues.kelompok);
    text = text.replace(/\{\{hari\}\}/g, previewValues.hari);
    text = text.replace(/\{\{slot\}\}/g, previewValues.slot);
    text = text.replace(/\{\{akang\}\}/g, previewValues.akang);
    text = text.replace(/\{\{teteh\}\}/g, previewValues.teteh);
    return text;
  }, [selectedTemplate, previewValues]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Template Pesan WhatsApp</h1>
          <p className="text-xs text-muted-foreground">
            Kelola template pesan konfirmasi dan pratinjau penggantian variabel placeholder.
          </p>
        </div>
        <Button size="sm" onClick={handleOpenAdd} className="bg-primary">
          <Plus className="mr-2 size-4" /> Tambah Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table Column */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="size-4 text-primary" /> Daftar Template ({data.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Nama Template</TableHead>
                      <TableHead className="w-24 text-right text-xs">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-10">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <MessageSquare className="size-8 text-muted-foreground/50" />
                            <p className="font-semibold text-xs text-foreground">Belum ada template</p>
                            <p className="text-[11px] text-muted-foreground">Klik &quot;Tambah Template&quot; untuk menambahkan.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.map((item) => (
                        <TableRow
                          key={item.id}
                          onClick={() => setSelectedTemplate(item)}
                          className={`cursor-pointer hover:bg-muted/20 transition-colors ${
                            selectedTemplate?.id === item.id ? "bg-primary/10 font-semibold" : ""
                          }`}
                        >
                          <TableCell className="p-3">
                            <div className="font-semibold text-xs text-foreground">{item.nama_template}</div>
                            <div className="text-[11px] text-muted-foreground line-clamp-1">
                              {item.isi_template}
                            </div>
                          </TableCell>
                          <TableCell className="text-right p-3">
                            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
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
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="glass-card border-emerald-500/30">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="size-4" /> Live Preview WhatsApp
              </CardTitle>
              <CardDescription className="text-xs">
                Simulasi hasil pesan teks dengan variabel pengganti.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* WhatsApp Chat Bubble Mockup */}
              <div className="rounded-2xl bg-emerald-950/10 dark:bg-emerald-950/40 p-4 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <Send className="size-3.5" /> Template: {selectedTemplate?.nama_template || "Pilih Template"}
                </div>
                <div className="rounded-xl bg-card border p-3 text-xs leading-relaxed font-sans shadow-xs whitespace-pre-wrap">
                  {renderedPreview}
                </div>
              </div>

              {/* Interactive Test Parameters */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Uji Variabel Placeholder:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <Label className="text-[11px]">{"{{kelompok}}"}</Label>
                    <Input
                      value={previewValues.kelompok}
                      onChange={(e) => setPreviewValues((p) => ({ ...p, kelompok: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">{"{{hari}}"}</Label>
                    <Input
                      value={previewValues.hari}
                      onChange={(e) => setPreviewValues((p) => ({ ...p, hari: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">{"{{slot}}"}</Label>
                    <Input
                      value={previewValues.slot}
                      onChange={(e) => setPreviewValues((p) => ({ ...p, slot: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">{"{{akang}}"}</Label>
                    <Input
                      value={previewValues.akang}
                      onChange={(e) => setPreviewValues((p) => ({ ...p, akang: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {formValues.id ? "Edit Template WhatsApp" : "Tambah Template WhatsApp"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Gunakan tag placeholder seperti {"{{kelompok}}"}, {"{{hari}}"}, {"{{slot}}"}, {"{{akang}}"}, {"{{teteh}}"}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nama_template" className="text-xs">Nama Template</Label>
              <Input
                id="nama_template"
                type="text"
                placeholder="Contoh: Konfirmasi Booking"
                required
                value={formValues.nama_template}
                onChange={(e) => setFormValues((p) => ({ ...p, nama_template: e.target.value }))}
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isi_template" className="text-xs">Isi Pesan Template</Label>
              <Textarea
                id="isi_template"
                rows={5}
                required
                value={formValues.isi_template}
                onChange={(e) => setFormValues((p) => ({ ...p, isi_template: e.target.value }))}
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="text-xs">
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="text-xs bg-primary">
                {isPending ? "Menyimpan..." : "Simpan Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={() => setDeleteTarget(null)}
        title="Hapus Template WhatsApp?"
        itemName={deleteTarget ? deleteTarget.nama_template : ""}
        description="Aksi ini tidak dapat dibatalkan."
        onConfirm={handleConfirmDelete}
        isPending={isPending}
      />
    </div>
  );
}

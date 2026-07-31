"use client";

import * as React from "react";
import { CalendarDays, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettingsAction } from "@/services/settings.actions";
import type { EventSettings } from "@/types/database";

interface SettingsAcaraViewProps {
  initialSettings: EventSettings;
}

export function SettingsAcaraView({ initialSettings }: SettingsAcaraViewProps) {
  const [formValues, setFormValues] = React.useState(initialSettings);
  const [isPending, startTransition] = React.useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.append("nama_acara", formValues.nama_acara);
      formData.append("tahun", String(formValues.tahun));
      formData.append("target_kating", String(formValues.target_kating));
      formData.append("minimal_durasi", String(formValues.minimal_durasi));
      formData.append("tanggal_mulai", formValues.tanggal_mulai);
      formData.append("tanggal_selesai", formValues.tanggal_selesai);

      const res = await updateSettingsAction(formData);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Acara Taaruf</h1>
        <p className="text-xs text-muted-foreground">
          Konfigurasi umum nama event, target kating, durasi sesi, dan periode pelaksanaan.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" /> Parameter Sistem Taaruf
          </CardTitle>
          <CardDescription className="text-xs">
            Perubahan pengaturan akan berpengaruh pada validasi alur sistem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nama_acara">Nama Acara</Label>
                <Input
                  id="nama_acara"
                  type="text"
                  required
                  value={formValues.nama_acara}
                  onChange={(e) =>
                    setFormValues((p) => ({ ...p, nama_acara: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tahun">Tahun Pelaksanaan</Label>
                <Input
                  id="tahun"
                  type="number"
                  required
                  value={formValues.tahun}
                  onChange={(e) =>
                    setFormValues((p) => ({ ...p, tahun: parseInt(e.target.value, 10) || 2026 }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_kating">Target Pertemuan Kating Per Anggota</Label>
                <Input
                  id="target_kating"
                  type="number"
                  required
                  value={formValues.target_kating}
                  onChange={(e) =>
                    setFormValues((p) => ({ ...p, target_kating: parseInt(e.target.value, 10) || 5 }))
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  Jumlah kating yang harus ditemui setiap peserta anggota.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimal_durasi">Minimal Durasi Sesi (Menit)</Label>
                <Input
                  id="minimal_durasi"
                  type="number"
                  required
                  value={formValues.minimal_durasi}
                  onChange={(e) =>
                    setFormValues((p) => ({ ...p, minimal_durasi: parseInt(e.target.value, 10) || 30 }))
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  Durasi standar minimal per sesi Taaruf.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="tanggal_mulai">Tanggal Mulai Event</Label>
                <Input
                  id="tanggal_mulai"
                  type="date"
                  required
                  value={formValues.tanggal_mulai}
                  onChange={(e) =>
                    setFormValues((p) => ({ ...p, tanggal_mulai: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tanggal_selesai">Tanggal Selesai Event</Label>
                <Input
                  id="tanggal_selesai"
                  type="date"
                  required
                  value={formValues.tanggal_selesai}
                  onChange={(e) =>
                    setFormValues((p) => ({ ...p, tanggal_selesai: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={isPending} className="font-semibold">
                <Save className="mr-2 size-4" />
                {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

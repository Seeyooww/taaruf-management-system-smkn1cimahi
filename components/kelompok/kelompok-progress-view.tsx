"use client";

import * as React from "react";
import { Activity, Calendar, CheckCircle2, ChevronRight, Shield, Target, UserCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import type { AnggotaProgressSummary } from "@/types/database";

interface KelompokProgressViewProps {
  progressList: AnggotaProgressSummary[];
}

export function KelompokProgressView({ progressList }: KelompokProgressViewProps) {
  const [selectedAnggota, setSelectedAnggota] = React.useState<AnggotaProgressSummary | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  const handleOpenDetail = (item: AnggotaProgressSummary) => {
    setSelectedAnggota(item);
    setIsDetailOpen(true);
  };

  // Group Total Metrics
  const totalAnggota = progressList.length;
  const totalTargetKatingSum = progressList.reduce((acc, curr) => acc + curr.target_kating, 0);
  const totalMetCountSum = progressList.reduce((acc, curr) => acc + curr.total_kating_met, 0);
  const totalGroupPercentage =
    totalTargetKatingSum === 0
      ? 0
      : Math.min(100, Math.round((totalMetCountSum / totalTargetKatingSum) * 100));

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Progress Anggota Kelompok</h1>
          <p className="text-xs text-muted-foreground">
            Pemantauan visual capaian kating per peserta individu secara transparan & real-time.
          </p>
        </div>
      </div>

      {/* Group Overall Progress Banner Card */}
      <Card className="glass-card border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardContent className="p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="size-5 text-primary" />
              <span className="text-sm font-bold text-foreground">Target Akumulasi Kelompok</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-primary">
                {totalMetCountSum} / {totalTargetKatingSum}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                ({totalGroupPercentage}%)
              </span>
            </div>
          </div>

          <Progress value={totalGroupPercentage} className="h-3 bg-muted/60" indicatorClassName="bg-primary" />

          <p className="text-[11px] text-muted-foreground">
            Rerata akumulasi presensi kating dari {totalAnggota} anggota kelompok terdaftar.
          </p>
        </CardContent>
      </Card>

      {/* Progress Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {progressList.length === 0 ? (
          <Card className="col-span-2 p-8 text-center glass-card">
            <p className="text-xs text-muted-foreground">Belum ada anggota di kelompok ini.</p>
          </Card>
        ) : (
          progressList.map((item) => {
            const sisaNeeds = Math.max(0, item.target_kating - item.total_kating_met);
            const isFinished = item.total_kating_met >= item.target_kating;

            return (
              <Card
                key={item.anggota_id}
                onClick={() => handleOpenDetail(item)}
                className="glass-card hover:border-primary/40 transition-all cursor-pointer group"
              >
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2 group-hover:text-primary transition-colors">
                      <UserCheck className="size-4 text-primary" /> {item.nama}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {item.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"} &bull; {item.kelompok_nama}
                    </CardDescription>
                  </div>
                  <Badge variant={item.status_color}>{item.status_label}</Badge>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Pencapaian Kating:</span>
                    <span className="text-foreground font-bold">
                      {item.total_kating_met} / {item.target_kating} Kating ({item.percentage}%)
                    </span>
                  </div>

                  <Progress
                    value={item.percentage}
                    className="h-2.5"
                    indicatorClassName={
                      item.status_color === "success"
                        ? "bg-emerald-500"
                        : item.status_color === "warning"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }
                  />

                  <div className="flex items-center justify-between text-xs pt-1">
                    {isFinished ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="size-3.5" /> Selesai Target!
                      </span>
                    ) : (
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        Butuh {sisaNeeds} kating lagi
                      </span>
                    )}

                    <span className="text-[11px] text-muted-foreground flex items-center gap-0.5 group-hover:text-primary transition-colors">
                      Detail rincian <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Detail Timeline Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="size-5 text-primary" /> Rincian Pertemuan Kating
            </DialogTitle>
            <DialogDescription className="text-xs">
              Riwayat Kating yang telah ditemui oleh {selectedAnggota?.nama}.
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
                Target: {selectedAnggota?.target_kating} Kating Unik &bull; Persentase: {selectedAnggota?.percentage}%
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">
                Daftar Kating Unik Yang Ditemui:
              </label>

              {selectedAnggota?.kating_met_list.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                  Belum ada kating yang ditemui. Ikuti sesi booking Taaruf hingga selesai.
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
                        <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <span>
                            {met.jenis_kelamin === "L" ? "Akang (L)" : "Teteh (P)"}
                          </span>
                          <span>&bull;</span>
                          <span>{met.slot_nama}</span>
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Calendar className="size-3" /> {met.tanggal}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

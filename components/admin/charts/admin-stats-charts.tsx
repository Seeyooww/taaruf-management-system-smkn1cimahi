"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  PieChart as PieIcon,
  TrendingUp,
} from "lucide-react";
import type { AnalyticsData } from "@/services/reporting.service";

interface AdminStatsChartsProps {
  data: AnalyticsData;
}

export function AdminStatsCharts({ data }: AdminStatsChartsProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const {
    bookingPerHari,
    bookingPerSlot,
    bookingPerStatus,
    progressDistribusi,
    targetTercapaiStats,
  } = data;

  const maxHariCount = Math.max(...bookingPerHari.map((d) => d.count), 1);
  const maxSlotCount = Math.max(...bookingPerSlot.map((s) => s.count), 1);
  const maxProgressCount = Math.max(...progressDistribusi.map((p) => p.count), 1);
  const totalStatusCount = bookingPerStatus.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner for Analytics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card/60 backdrop-blur-xs">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" /> Analisis & Statistik Real-Time
          </h2>
          <p className="text-xs text-muted-foreground">
            Grafik interaktif pemantauan tren booking, distribusi slot, status permohonan, & capaian target.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1">
            <TrendingUp className="size-3.5 mr-1" /> System Active
          </Badge>
        </div>
      </div>

      {/* Row 1: Booking per Hari & Booking per Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Booking per Hari */}
        <Card className="glass-card shadow-sm border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="size-4 text-blue-500" /> Booking Per Hari
                </CardTitle>
                <CardDescription className="text-xs">
                  Volume pengajuan sesi Taaruf berdasarkan tanggal
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {bookingPerHari.reduce((a, b) => a + b.count, 0)} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {bookingPerHari.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Belum ada data booking.</p>
            ) : (
              <div className="space-y-3">
                <div className="h-44 flex items-end justify-between gap-2 px-2 pt-6 pb-2 border-b border-border">
                  {bookingPerHari.map((item, idx) => {
                    const heightPercent = Math.round((item.count / maxHariCount) * 100);
                    return (
                      <div
                        key={item.tanggal}
                        className="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Tooltip */}
                        {hoveredIndex === idx && (
                          <div className="absolute -top-10 z-20 px-2.5 py-1 rounded bg-popover text-popover-foreground border border-border text-[11px] font-medium shadow-md animate-in fade-in zoom-in-95">
                            {item.label}: <span className="font-bold text-primary">{item.count} booking</span>
                          </div>
                        )}

                        <div className="text-[10px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                          {item.count}
                        </div>
                        <div
                          className="w-full max-w-[36px] bg-gradient-to-t from-primary/80 to-blue-400 rounded-t-md transition-all duration-300 group-hover:brightness-110 shadow-xs"
                          style={{ height: `${Math.max(heightPercent, 8)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between px-2 text-[10px] text-muted-foreground font-medium">
                  {bookingPerHari.map((item) => (
                    <span key={item.tanggal} className="truncate max-w-[40px] text-center">
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Booking per Status */}
        <Card className="glass-card shadow-sm border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <PieIcon className="size-4 text-emerald-500" /> Booking Per Status
                </CardTitle>
                <CardDescription className="text-xs">
                  Persentase & jumlah permohonan berdasarkan status verifikasi
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {totalStatusCount} Sesi
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {bookingPerStatus.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Belum ada data status booking.</p>
            ) : (
              <div className="space-y-3">
                {/* Visual Bar Distribution */}
                <div className="h-4 w-full rounded-full overflow-hidden flex bg-muted p-0.5 shadow-inner">
                  {bookingPerStatus.map((st) => {
                    const pct = totalStatusCount === 0 ? 0 : Math.round((st.count / totalStatusCount) * 100);
                    return (
                      <div
                        key={st.status}
                        className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 hover:opacity-90"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: st.color,
                        }}
                        title={`${st.status}: ${st.count} (${pct}%)`}
                      />
                    );
                  })}
                </div>

                {/* Status Breakdown Legend */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {bookingPerStatus.map((st) => {
                    const pct = totalStatusCount === 0 ? 0 : Math.round((st.count / totalStatusCount) * 100);
                    return (
                      <div
                        key={st.status}
                        className="flex items-center justify-between p-2 rounded-lg border bg-card/40 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="size-3 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: st.color }}
                          />
                          <span className="font-medium text-foreground truncate">{st.status}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-semibold">
                          <span>{st.count}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Booking per Slot, Progress Anggota, & Target Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 3: Booking per Slot */}
        <Card className="glass-card shadow-sm border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="size-4 text-amber-500" /> Booking Per Slot
            </CardTitle>
            <CardDescription className="text-xs">
              Distribusi permohonan pada slot jam istirahat
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {bookingPerSlot.map((slot) => {
              const widthPct = Math.round((slot.count / maxSlotCount) * 100);
              return (
                <div key={slot.slot_id} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="truncate">{slot.slot_nama}</span>
                    <span className="font-bold text-foreground">{slot.count} sesi</span>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(widthPct, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Chart 4: Progress Seluruh Anggota */}
        <Card className="glass-card shadow-sm border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="size-4 text-indigo-500" /> Progress Anggota
            </CardTitle>
            <CardDescription className="text-xs">
              Sebaran pencapaian kating per interval %
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {progressDistribusi.map((item) => {
              const widthPct = Math.round((item.count / maxProgressCount) * 100);
              return (
                <div key={item.range} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{item.range}</span>
                    <span className="font-bold text-foreground">{item.count} siswa</span>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(widthPct, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Chart 5: Target Tercapai Gauge */}
        <Card className="glass-card shadow-sm border flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="size-4 text-purple-500" /> Target Tercapai
            </CardTitle>
            <CardDescription className="text-xs">
              Siswa yang memenuhi kriteria kating minimal
            </CardDescription>
          </CardHeader>
          <CardContent className="py-4 flex flex-col items-center justify-center space-y-4">
            {/* Donut Gauge Chart */}
            <div className="relative size-32 flex items-center justify-center">
              <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted stroke-current"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-purple-600 stroke-current transition-all duration-700 ease-out"
                  strokeDasharray={`${targetTercapaiStats.persentaseTercapai}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-foreground tracking-tight">
                  {targetTercapaiStats.persentaseTercapai}%
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">Tercapai</span>
              </div>
            </div>

            {/* Quick Metrics Badge Footer */}
            <div className="grid grid-cols-2 gap-3 w-full text-center text-xs">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                  {targetTercapaiStats.tercapai} Siswa
                </div>
                <div className="text-[10px] text-muted-foreground">Tercapai Target</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="font-bold text-amber-600 dark:text-amber-400">
                  {targetTercapaiStats.belumTercapai} Siswa
                </div>
                <div className="text-[10px] text-muted-foreground">Belum Selesai</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

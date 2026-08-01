"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EventSettings, SlotWaktu, CalendarBookingEntry } from "@/types/database";

interface BookingCalendarViewProps {
  settings: EventSettings;
  slotList: SlotWaktu[];
  /** Semua booking dari semua kelompok (compact) — untuk hitung ketersediaan kating */
  allCalendarBookings: CalendarBookingEntry[];
  /** Total kating aktif (tidak dibedakan gender) */
  katingCounts: { total: number };
  onSelectDate: (dateStr: string) => void;
}

export function BookingCalendarView({
  settings,
  slotList,
  allCalendarBookings,
  katingCounts,
  onSelectDate,
}: BookingCalendarViewProps) {
  const activeSlots = slotList.filter((s) => s.aktif);

  /**
   * Cek apakah sebuah slot pada tanggal tertentu "penuh".
   * Penuh = semua kating L atau semua kating P sudah di-booking untuk slot+tanggal itu.
   */
  const isSlotFull = React.useCallback(
    (dateStr: string, slotId: string): boolean => {
      const activeOnSlot = allCalendarBookings.filter(
        (b) =>
          b.tanggal === dateStr &&
          b.slot_id === slotId &&
          b.status !== "Ditolak" &&
          b.status !== "Dibatalkan"
      );

      // Collect all booked kating_ids for this slot+date
      const bookedKatingIds = new Set<string>();
      activeOnSlot.forEach((b) => {
        (b.kating_ids ?? []).forEach((id) => bookedKatingIds.add(id));
      });

      // Penuh jika semua kating aktif sudah terpakai
      return katingCounts.total > 0 && bookedKatingIds.size >= katingCounts.total;
    },
    [allCalendarBookings, katingCounts]
  );

  const calendarDates = React.useMemo(() => {
    const dates: {
      dateStr: string;
      label: string;
      dayName: string;
      status: "kosong" | "sebagian" | "penuh";
      fullSlots: number;
      totalSlots: number;
    }[] = [];

    let startDate = new Date(settings.tanggal_mulai || "2026-08-01");
    let endDate = new Date(settings.tanggal_selesai || "2026-08-07");

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      startDate = new Date("2026-08-01");
      endDate = new Date("2026-08-07");
    }

    const current = new Date(startDate);
    while (current <= endDate) {
      const dayOfWeek = current.getDay(); // 0=Minggu, 6=Sabtu

      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = current.toISOString().split("T")[0];
        const dayName = current.toLocaleDateString("id-ID", { weekday: "long" });
        const label = current.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

        // Hitung jumlah slot yang penuh di hari ini
        const fullSlotCount = activeSlots.filter((s) => isSlotFull(dateStr, s.id)).length;
        const totalSlotsCount = activeSlots.length;

        let status: "kosong" | "sebagian" | "penuh" = "kosong";
        if (totalSlotsCount > 0 && fullSlotCount >= totalSlotsCount) {
          status = "penuh";
        } else if (fullSlotCount > 0) {
          status = "sebagian";
        }

        dates.push({
          dateStr,
          label,
          dayName,
          status,
          fullSlots: fullSlotCount,
          totalSlots: totalSlotsCount,
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return dates;
  }, [settings, activeSlots, isSlotFull]);

  return (
    <Card className="glass-card border shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarIcon className="size-4 text-primary" /> Kalender Ketersediaan Sesi Taaruf
            </CardTitle>
            <CardDescription className="text-xs">
              Klik tanggal untuk memilih hari pelaksanaan sesi secara langsung.
            </CardDescription>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] font-medium">
            <div className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              <span>Tersedia</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-amber-500" />
              <span>Sebagian</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-rose-500" />
              <span>Penuh</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {calendarDates.map((item) => {
            const isFull = item.status === "penuh";
            const isPartial = item.status === "sebagian";

            let bgClass =
              "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300";
            let badgeClass = "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300";
            let badgeText = "Tersedia";

            if (isFull) {
              bgClass =
                "bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 cursor-not-allowed opacity-60";
              badgeClass = "bg-rose-500/20 text-rose-700 dark:text-rose-300";
              badgeText = "Penuh";
            } else if (isPartial) {
              bgClass =
                "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300";
              badgeClass = "bg-amber-500/20 text-amber-700 dark:text-amber-300";
              badgeText = `${item.totalSlots - item.fullSlots}/${item.totalSlots} Slot`;
            }

            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => !isFull && onSelectDate(item.dateStr)}
                disabled={isFull}
                className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between space-y-2 group relative cursor-pointer ${bgClass}`}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">
                    {item.dayName}
                  </span>
                  <span className="text-sm font-extrabold block mt-0.5">{item.label}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-current/10">
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 border-0 ${badgeClass}`}>
                    {badgeText}
                  </Badge>
                  <Clock className="size-3 opacity-60 group-hover:scale-110 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
        {calendarDates.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">
            Tidak ada hari taaruf yang tersedia dalam rentang ini.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

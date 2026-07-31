"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BookingWithDetails, EventSettings, SlotWaktu } from "@/types/database";

interface BookingCalendarViewProps {
  settings: EventSettings;
  slotList: SlotWaktu[];
  bookings: BookingWithDetails[];
  onSelectDate: (dateStr: string) => void;
}

export function BookingCalendarView({
  settings,
  slotList,
  bookings,
  onSelectDate,
}: BookingCalendarViewProps) {
  // Generate list of dates between tanggal_mulai and tanggal_selesai
  const calendarDates = React.useMemo(() => {
    const dates: { dateStr: string; label: string; dayName: string; status: "kosong" | "sebagian" | "penuh"; bookedCount: number; totalSlots: number }[] = [];
    const activeSlots = slotList.filter((s) => s.aktif);
    const totalSlotsCount = activeSlots.length;

    let startDate = new Date(settings.tanggal_mulai || "2026-08-01");
    let endDate = new Date(settings.tanggal_selesai || "2026-08-07");

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      startDate = new Date("2026-08-01");
      endDate = new Date("2026-08-07");
    }

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split("T")[0];
      const dayName = current.toLocaleDateString("id-ID", { weekday: "long" });
      const label = current.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

      // Bookings on this date that are not rejected or cancelled
      const activeBookingsOnDate = bookings.filter(
        (b) => b.tanggal === dateStr && b.status !== "Ditolak" && b.status !== "Dibatalkan"
      );

      // Unique slots booked
      const bookedSlotsSet = new Set(activeBookingsOnDate.map((b) => b.slot_id));
      const bookedCount = bookedSlotsSet.size;

      let status: "kosong" | "sebagian" | "penuh" = "kosong";
      if (bookedCount >= totalSlotsCount && totalSlotsCount > 0) {
        status = "penuh";
      } else if (bookedCount > 0) {
        status = "sebagian";
      }

      dates.push({
        dateStr,
        label,
        dayName,
        status,
        bookedCount,
        totalSlots: totalSlotsCount,
      });

      current.setDate(current.getDate() + 1);
    }

    return dates;
  }, [settings, slotList, bookings]);

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
              <span>Kosong</span>
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

            let bgClass = "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300";
            let badgeClass = "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300";
            let badgeText = "Kosong";

            if (isFull) {
              bgClass = "bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300";
              badgeClass = "bg-rose-500/20 text-rose-700 dark:text-rose-300";
              badgeText = "Penuh";
            } else if (isPartial) {
              bgClass = "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300";
              badgeClass = "bg-amber-500/20 text-amber-700 dark:text-amber-300";
              badgeText = `${item.bookedCount}/${item.totalSlots} Slot`;
            }

            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => onSelectDate(item.dateStr)}
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
      </CardContent>
    </Card>
  );
}

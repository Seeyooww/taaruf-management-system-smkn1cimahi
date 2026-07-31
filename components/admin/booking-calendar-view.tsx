"use client";

import * as React from "react";
import { Calendar as CalendarIcon, CalendarDays, Clock, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BookingWithDetails, EventSettings, SlotWaktu } from "@/types/database";

interface BookingCalendarViewProps {
  bookingList: BookingWithDetails[];
  settings: EventSettings;
  slotList: SlotWaktu[];
}

export function BookingCalendarView({
  bookingList,
  settings,
  slotList,
}: BookingCalendarViewProps) {
  // Generate date array from event settings range
  const dateList = React.useMemo(() => {
    const start = new Date(settings.tanggal_mulai || "2026-08-01");
    const end = new Date(settings.tanggal_selesai || "2026-08-07");
    const dates: string[] = [];

    const curr = new Date(start);
    while (curr <= end) {
      dates.push(curr.toISOString().split("T")[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  }, [settings]);

  const activeSlots = slotList.filter((s) => s.aktif);

  const getSlotStatus = (date: string, slotId: string) => {
    const activeBookings = bookingList.filter(
      (b) =>
        b.tanggal === date &&
        b.slot_id === slotId &&
        b.status !== "Ditolak" &&
        b.status !== "Dibatalkan"
    );

    if (activeBookings.length === 0) {
      return { status: "kosong", count: 0, bookings: [] };
    }
    if (activeBookings.length >= 4) {
      return { status: "bentrok", count: activeBookings.length, bookings: activeBookings };
    }
    return { status: "terbooking", count: activeBookings.length, bookings: activeBookings };
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" /> Kalender Ketersediaan Slot Taaruf
            </CardTitle>
            <CardDescription className="text-xs">
              Visualisasi status keterisian slot per hari & jam istirahat.
            </CardDescription>
          </div>

          {/* Color Indicators Legend */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Kosong</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Terbooking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-rose-500" />
              <span className="text-muted-foreground">Penuh/Bentrok</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="p-3 text-left font-bold text-muted-foreground bg-muted/30 min-w-32">
                  Slot Waktu / Tanggal
                </th>
                {dateList.map((d) => (
                  <th key={d} className="p-3 text-center font-bold text-foreground bg-muted/20 min-w-36">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeSlots.map((slot) => (
                <tr key={slot.id} className="border-b border-border hover:bg-muted/10">
                  <td className="p-3 font-semibold text-foreground bg-muted/20">
                    <div>{slot.nama_slot}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {slot.jam_mulai} - {slot.jam_selesai}
                    </div>
                  </td>

                  {dateList.map((d) => {
                    const info = getSlotStatus(d, slot.id);

                    let bgClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
                    let badgeLabel = "Kosong";
                    let badgeVariant: "success" | "warning" | "destructive" = "success";

                    if (info.status === "terbooking") {
                      bgClass = "bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300";
                      badgeLabel = `${info.count} Sesi`;
                      badgeVariant = "warning";
                    } else if (info.status === "bentrok") {
                      bgClass = "bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300";
                      badgeLabel = `${info.count} Penuh`;
                      badgeVariant = "destructive";
                    }

                    return (
                      <td key={d} className="p-2 text-center">
                        <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${bgClass}`}>
                          <div className="flex items-center justify-between">
                            <Badge variant={badgeVariant} className="text-[10px]">
                              {badgeLabel}
                            </Badge>
                          </div>
                          {info.bookings.length > 0 && (
                            <div className="text-[11px] font-medium truncate text-left mt-1">
                              {info.bookings[0].kelompok_nama}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import * as React from "react";
import { Clock, Hourglass, PartyPopper } from "lucide-react";

// Target waktu: Senin 3 Agustus 2026 00:00 WIB (UTC+7)
const EVENT_START = new Date("2026-08-03T00:00:00+07:00");
// Target akhir: Selasa 11 Agustus 2026 23:59 WIB
const EVENT_END = new Date("2026-08-11T23:59:00+07:00");

type Phase = "before" | "during" | "done";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function UnitBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-3xl sm:text-4xl font-mono font-extrabold text-primary tabular-nums leading-none">
        {pad(value)}
      </span>
      <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer() {
  const [phase, setPhase] = React.useState<Phase>("before");
  const [timeLeft, setTimeLeft] = React.useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    function tick() {
      const now = Date.now();
      if (now < EVENT_START.getTime()) {
        setPhase("before");
        setTimeLeft(calcTimeLeft(EVENT_START));
      } else if (now < EVENT_END.getTime()) {
        setPhase("during");
        setTimeLeft(calcTimeLeft(EVENT_END));
      } else {
        setPhase("done");
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (phase === "done") {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center space-y-2">
        <PartyPopper className="size-8 text-emerald-500 mx-auto" />
        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
          🎉 Acara Taaruf Telah Selesai!
        </p>
        <p className="text-xs text-muted-foreground">
          Terima kasih kepada seluruh peserta & panitia Taaruf SMKN 1 Cimahi 2026.
        </p>
      </div>
    );
  }

  const isBefore = phase === "before";

  return (
    <div
      className={`rounded-xl border p-5 text-center space-y-4 ${
        isBefore
          ? "border-primary/30 bg-primary/5"
          : "border-amber-500/30 bg-amber-500/5"
      }`}
    >
      {/* Phase label */}
      <div className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 ${
        isBefore
          ? "bg-primary/10 text-primary"
          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      }`}>
        {isBefore ? (
          <><Clock className="size-3.5 animate-pulse" /> Acara Dimulai Dalam</>
        ) : (
          <><Hourglass className="size-3.5 animate-spin" style={{ animationDuration: "3s" }} /> Acara Berakhir Dalam</>
        )}
      </div>

      {/* Digit boxes */}
      <div className="flex items-end justify-center gap-3 sm:gap-5">
        <UnitBox value={timeLeft.days} label="Hari" />
        <span className="text-3xl font-mono font-bold text-muted-foreground pb-4 leading-none">:</span>
        <UnitBox value={timeLeft.hours} label="Jam" />
        <span className="text-3xl font-mono font-bold text-muted-foreground pb-4 leading-none">:</span>
        <UnitBox value={timeLeft.minutes} label="Menit" />
        <span className="text-3xl font-mono font-bold text-muted-foreground pb-4 leading-none">:</span>
        <UnitBox value={timeLeft.seconds} label="Detik" />
      </div>

      {/* Sub-label */}
      <p className="text-[11px] text-muted-foreground">
        {isBefore
          ? "Senin, 3 Agustus 2026 · 00:00 WIB · SMKN 1 Cimahi"
          : "Selasa, 11 Agustus 2026 · 23:59 WIB · SMKN 1 Cimahi"}
      </p>
    </div>
  );
}

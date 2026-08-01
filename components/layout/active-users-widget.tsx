"use client";

import * as React from "react";
import { ChevronDown, Shield } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getActiveUsersAction } from "@/services/presence.actions";
import type { ActiveUserItem } from "@/services/presence.service";

/** Animated radar dot */
function RadarDot({ color }: { color: "green" | "orange" }) {
  const base = color === "orange" ? "bg-orange-500" : "bg-emerald-500";
  const ping = color === "orange" ? "bg-orange-400" : "bg-emerald-400";
  return (
    <span className="relative flex size-2.5 shrink-0 mt-0.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${ping} opacity-70`} />
      <span className={`relative inline-flex rounded-full size-2.5 ${base}`} />
    </span>
  );
}

function getLabel(u: ActiveUserItem): string {
  if (u.role === "admin") return "Admin";
  if (u.nomorKelompok != null) return `Kelompok ${u.nomorKelompok}`;
  return "Kelompok";
}

export function ActiveUsersWidget() {
  const [users, setUsers] = React.useState<ActiveUserItem[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const loadActiveUsers = React.useCallback(async () => {
    try {
      const list = await getActiveUsersAction();
      setUsers(list ?? []);
    } catch {
      // Silent fail — widget stays visible, just shows 0
    } finally {
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    loadActiveUsers();
    const id = setInterval(loadActiveUsers, 15_000);
    return () => clearInterval(id);
  }, [loadActiveUsers]);

  // Sort: admin always first
  const sorted = React.useMemo(
    () =>
      [...users].sort((a, b) => {
        if (a.role === "admin" && b.role !== "admin") return -1;
        if (b.role === "admin" && a.role !== "admin") return 1;
        return 0;
      }),
    [users]
  );

  const count = sorted.length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {/* Always rendered — never conditionally hidden */}
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer select-none shrink-0"
        >
          {/* Radar ping dot */}
          <span className="relative flex size-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
          </span>
          <span>{loaded ? count : "…"} Online</span>
          <ChevronDown
            className={`size-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-52 p-2 rounded-2xl shadow-xl border bg-card backdrop-blur-xl"
      >
        <DropdownMenuLabel className="px-2 py-1 text-[11px] font-bold flex items-center gap-1.5 text-foreground">
          <span className="relative flex size-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
          </span>
          Pengguna Aktif ({count})
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />

        <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
          {!loaded ? (
            <div className="p-3 text-center text-xs text-muted-foreground animate-pulse">
              Memuat...
            </div>
          ) : sorted.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              Tidak ada pengguna aktif
            </div>
          ) : (
            sorted.map((u) => {
              const isAdmin = u.role === "admin";
              return (
                <div
                  key={u.id}
                  className={`flex items-start gap-2 px-2 py-1.5 rounded-xl text-xs transition-colors ${
                    isAdmin
                      ? "bg-orange-500/10 border border-orange-500/20"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <RadarDot color={isAdmin ? "orange" : "green"} />
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`font-bold text-[11px] truncate ${
                        isAdmin
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-foreground"
                      }`}
                    >
                      {getLabel(u)}
                    </span>
                    {isAdmin && (
                      <span className="text-[9px] text-orange-500/80 flex items-center gap-0.5 font-medium">
                        <Shield className="size-2.5" /> Administrator
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

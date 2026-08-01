"use client";

import * as React from "react";
import { ChevronDown, Users } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getActiveUsersAction } from "@/services/presence.actions";
import type { ActiveUserItem } from "@/services/presence.service";

export function ActiveUsersWidget() {
  const [users, setUsers] = React.useState<ActiveUserItem[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  const loadActiveUsers = React.useCallback(async () => {
    try {
      const activeList = await getActiveUsersAction();
      setUsers(activeList);
    } catch (err) {
      console.error("Failed to load active users:", err);
    }
  }, []);

  // Poll active users list every 15 seconds
  React.useEffect(() => {
    loadActiveUsers();
    const interval = setInterval(loadActiveUsers, 15000);
    return () => clearInterval(interval);
  }, [loadActiveUsers]);

  const activeCount = Math.max(users.length, 1);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer select-none"
        >
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{activeCount} Online</span>
          <ChevronDown className={`size-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border bg-card backdrop-blur-xl">
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-bold flex items-center gap-2 text-foreground">
          <Users className="size-4 text-emerald-500" />
          <span>Pengguna Aktif ({activeCount})</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />

        <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
          {users.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              Memuat pengguna aktif...
            </div>
          ) : (
            users.map((u) => (
              <DropdownMenuItem
                key={u.id}
                className="flex items-start gap-2 p-2 rounded-xl text-xs hover:bg-muted/50 focus:bg-muted/50 cursor-default"
              >
                <span className="size-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-foreground truncate uppercase text-[11px]">
                    {u.displayName}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {u.role === "admin" ? "Admin System" : "Kelompok Sesi"}
                  </span>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Clock,
  Database,
  FileSpreadsheet,
  FileText,
  History,
  Info,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";

import { APP_NAME, APP_SHORT_NAME, DASHBOARD_NAVIGATION } from "@/lib/constants";
import { cn, getRoleLabel } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

interface AppSidebarProps {
  role: UserRole;
  className?: string;
  onNavClick?: () => void;
}

function getNavIcon(href: string) {
  if (href.includes("/admin/panduan")) return BookOpen;
  if (href.includes("/admin/tentang")) return Info;
  if (href.includes("/admin/laporan/lpj")) return Award;
  if (href.includes("/admin/laporan/kelompok")) return FileSpreadsheet;
  if (href.includes("/admin/laporan/anggota")) return FileText;
  if (href.includes("/admin/laporan/kating")) return Shield;
  if (href.includes("/dashboard")) return LayoutDashboard;
  if (href.includes("/booking")) return CalendarCheck;
  if (href.includes("/progress")) return Activity;
  if (href.includes("/riwayat")) return History;
  if (href.includes("/kelompok")) return Users;
  if (href.includes("/anggota")) return UserCheck;
  if (href.includes("/kating")) return Shield;
  if (href.includes("/pengaturan/acara")) return CalendarDays;
  if (href.includes("/pengaturan/slot")) return Clock;
  if (href.includes("/pengaturan/whatsapp")) return MessageSquare;
  if (href.includes("/pengaturan/pengumuman")) return Bell;
  if (href.includes("/pengaturan/backup")) return Database;
  return Settings;
}

export function AppSidebar({ role, className, onNavClick }: AppSidebarProps) {
  const pathname = usePathname();
  const roleLabel = getRoleLabel(role);

  // Group navigation items by category
  const categories = React.useMemo(() => {
    const navItems = DASHBOARD_NAVIGATION[role] || [];
    const map = new Map<string, typeof navItems>();
    navItems.forEach((item) => {
      const cat = item.category || "Utama";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    });
    return Array.from(map.entries());
  }, [role]);

  return (
    <aside
      className={cn(
        "flex flex-col w-64 border-r border-border bg-card text-card-foreground h-full transition-all duration-300",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-xs">
          {APP_SHORT_NAME}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm leading-tight tracking-tight">
            {APP_NAME}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
            <Shield className="size-3 text-primary" /> Area {roleLabel}
          </span>
        </div>
      </div>

      {/* Navigation Section Grouped by Category */}
      <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
        {categories.map(([category, items]) => (
          <div key={category} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {category}
            </div>
            {items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = getNavIcon(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border bg-muted/20">
        <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">SMKN 1 Cimahi</p>
          <p className="text-[11px] mt-0.5">Taaruf Management System v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}

"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu, Search, X } from "lucide-react";
import { toast } from "sonner";

import { ThemeSwitch } from "@/components/common/theme-switch";
import { ActiveUsersWidget } from "@/components/layout/active-users-widget";
import { GlobalSearchDialog } from "@/components/layout/global-search-dialog";
import { UserMenu } from "@/components/layout/user-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { titleFromPath } from "@/lib/utils";
import type { SessionProfile } from "@/types/auth";

interface AppNavbarProps {
  user: SessionProfile;
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export function AppNavbar({
  user,
  onMobileMenuToggle,
  isMobileMenuOpen,
}: AppNavbarProps) {
  const pathname = usePathname();
  const pageTitle = titleFromPath(pathname);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  // Keyboard shortcut Ctrl+K / Cmd+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNotificationClick = () => {
    toast.info("Aktivitas notifikasi: Seluruh status booking & progress dalam kondisi aktif.");
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/80 px-3 sm:px-4 md:px-6 backdrop-blur-md">
        {/* Left side: Mobile Toggle + Breadcrumb Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0 h-10 w-10 min-h-[40px] min-w-[40px]"
            onClick={onMobileMenuToggle}
            aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
          >
            {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>

          <Breadcrumb className="min-w-0 truncate">
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem className="hidden xs:inline-flex">
                <span className="text-xs text-muted-foreground font-medium">TMS</span>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden xs:inline-flex" />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[110px] xs:max-w-[160px] sm:max-w-none">
                  {pageTitle}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right side: Global Search + Actions & User Menu */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
          {/* Global Search Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsSearchOpen(true)}
            className="h-9 px-3 text-xs text-muted-foreground hidden sm:flex items-center gap-2"
          >
            <Search className="size-3.5 text-primary" />
            <span>Cari...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </Button>

          {/* Mobile Search Button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsSearchOpen(true)}
            className="sm:hidden h-9 w-9 min-h-[36px] min-w-[36px]"
            aria-label="Cari"
          >
            <Search className="size-4 text-primary" />
          </Button>

          {/* Notification Placeholder */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleNotificationClick}
            className="relative h-9 w-9 min-h-[36px] min-w-[36px]"
            aria-label="Notifikasi"
          >
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary animate-pulse" />
          </Button>

          {/* Active Online Users Widget */}
          <ActiveUsersWidget />

          {/* Theme Switcher */}
          <ThemeSwitch />

          {/* User Menu */}
          <UserMenu user={user} />
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}

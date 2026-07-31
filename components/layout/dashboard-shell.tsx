"use client";

import * as React from "react";
import { AppNavbar } from "@/components/layout/app-navbar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import type { SessionProfile } from "@/types/auth";

interface DashboardShellProps {
  user: SessionProfile;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 shrink-0">
        <AppSidebar role={user.role} className="fixed inset-y-0 left-0" />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AppSidebar role={user.role} onNavClick={() => setMobileOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <AppNavbar
          user={user}
          isMobileMenuOpen={mobileOpen}
          onMobileMenuToggle={() => setMobileOpen((prev) => !prev)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}

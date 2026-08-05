"use client";

import * as React from "react";
import { FileText, Radio, ShieldCheck } from "lucide-react";
import { useVersion } from "@/components/version/version-provider";
import { Badge } from "@/components/ui/badge";

interface AppFooterProps {
  className?: string;
}

export function AppFooter({ className = "" }: AppFooterProps) {
  const { currentVersion, openChangelogModal } = useVersion();

  const verStr = currentVersion?.version || "v1.4.2";
  const releaseDate = currentVersion?.release_date || "8 Agustus 2026";
  const statusStr = currentVersion?.status || "Stable";

  return (
    <footer className={`w-full border-t border-border/50 bg-card/40 backdrop-blur-xs py-4 px-4 sm:px-6 text-xs text-muted-foreground ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <span className="font-semibold text-foreground">SMKN 1 Cimahi</span>
          <span className="hidden sm:inline">•</span>
          <span>Taaruf Management System</span>
          
          <button
            type="button"
            onClick={openChangelogModal}
            className="inline-flex items-center gap-1 font-mono font-bold text-primary hover:underline transition-all cursor-pointer bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20"
          >
            {verStr}
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-end text-[11px]">
          <span>Released {releaseDate}</span>
          <span className="text-emerald-500 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            🟢 {statusStr}
          </span>
          <button
            type="button"
            onClick={openChangelogModal}
            className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary hover:underline cursor-pointer transition-colors"
          >
            <FileText className="size-3.5 text-primary" /> Lihat Changelog
          </button>
        </div>
      </div>
    </footer>
  );
}

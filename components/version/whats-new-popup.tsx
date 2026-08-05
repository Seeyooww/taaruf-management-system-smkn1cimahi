"use client";

import * as React from "react";
import { CheckCircle2, ChevronRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SystemVersion } from "@/types/database";

interface WhatsNewPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentVersion: SystemVersion | null;
  onOpenFullChangelog: () => void;
}

export function WhatsNewPopup({
  open,
  onOpenChange,
  currentVersion,
  onOpenFullChangelog,
}: WhatsNewPopupProps) {
  if (!currentVersion) return null;

  const topChangelogs = (currentVersion.changelogs ?? []).slice(0, 4);

  const handleConfirmSeen = () => {
    onOpenChange(false);
  };

  const handleOpenDetail = () => {
    onOpenChange(false);
    onOpenFullChangelog();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-md p-5 rounded-2xl border-primary/40 bg-card shadow-2xl animate-in zoom-in-95">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="success" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 flex items-center gap-1">
              <Sparkles className="size-3" /> Pembaruan Aplikasi
            </Badge>
            <span className="text-xs font-mono font-bold text-primary">{currentVersion.version}</span>
          </div>
          <DialogTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
            🎉 What&apos;s New di TMS!
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Taaruf Management System telah diperbarui ke versi <strong>{currentVersion.version}</strong> ({currentVersion.release_date}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="text-xs font-semibold text-foreground">
            Apa yang baru pada pembaruan ini?
          </div>

          <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
            {topChangelogs.length === 0 ? (
              <p className="text-xs text-muted-foreground">Peningkatan stabilitas dan perbaikan bug sistem.</p>
            ) : (
              topChangelogs.map((item) => (
                <div key={item.id} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">{item.title}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-end gap-2 pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenDetail}
            className="text-xs font-semibold"
          >
            Lihat Detail <ChevronRight className="size-3.5 ml-1" />
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirmSeen}
            className="text-xs font-semibold bg-primary"
          >
            OK, Mengerti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

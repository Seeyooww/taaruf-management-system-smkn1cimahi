"use client";

import * as React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  itemName: string;
  description?: string;
  onConfirm: () => void;
  isPending?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  itemName,
  description = "Aksi ini tidak dapat dibatalkan.",
  onConfirm,
  isPending = false,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="size-5 shrink-0" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs space-y-2 pt-1 text-muted-foreground">
            <span>Apakah Anda yakin ingin menghapus data ini?</span>
            <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-foreground font-semibold text-xs">
              {itemName}
            </div>
            <span className="text-[11px] text-muted-foreground">{description}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="text-xs"
          >
            Batal
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              onConfirm();
            }}
            disabled={isPending}
            className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
          >
            {isPending ? (
              "Menghapus..."
            ) : (
              <>
                <Trash2 className="size-3.5 mr-1" /> Hapus Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  _error,
  reset,
}: {
  _error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md space-y-6">
          <div className="mx-auto size-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="size-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Terjadi Kesalahan Sistem
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Coba muat ulang halaman untuk melanjutkan operasional Taaruf Management System.
            </p>
            {_error.digest && (
              <p className="font-mono text-[10px] text-muted-foreground/60">
                Error Digest: {_error.digest}
              </p>
            )}
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <Button
              size="sm"
              onClick={() => reset()}
              className="bg-primary text-primary-foreground text-xs"
            >
              <RefreshCw className="mr-2 size-3.5" /> Refresh Halaman
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}

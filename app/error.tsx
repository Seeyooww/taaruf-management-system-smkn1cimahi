"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("App Runtime Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="mx-auto size-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <AlertTriangle className="size-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Terjadi Kesalahan Pada Aplikasi
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Maaf, sistem mengalami kendala teknis tak terduga. Silakan muat ulang halaman atau kembali ke beranda utama.
          </p>
          {error.digest && (
            <p className="font-mono text-[10px] text-muted-foreground/60">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto text-xs"
          >
            <Home className="mr-2 size-3.5" /> Kembali
          </Button>
          <Button
            size="sm"
            onClick={() => reset()}
            className="w-full sm:w-auto text-xs bg-primary text-primary-foreground"
          >
            <RefreshCw className="mr-2 size-3.5" /> Refresh Halaman
          </Button>
        </div>
      </div>
    </div>
  );
}

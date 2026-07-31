import Link from "next/link";
import { ArrowLeft, Lock, LogIn } from "lucide-react";

import { ThemeSwitch } from "@/components/common/theme-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: "Sesi Tidak Ditemukan (401)",
  description: "Anda perlu masuk terlebih dahulu untuk mengakses halaman ini.",
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background relative">
      <div className="absolute top-4 left-4 right-4 max-w-7xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1.5 size-4" /> Beranda
        </Link>
        <ThemeSwitch />
      </div>

      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto inline-flex size-16 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-md">
          <Lock className="size-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Sesi Belum Terautentikasi</h1>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Halaman yang Anda tuju memerlukan autentikasi aktif. Silakan masuk terlebih dahulu.
          </p>
        </div>

        <Card className="glass-card border-border/80 shadow-lg text-left">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Pilih Pintu Masuk Akun</CardTitle>
            <CardDescription className="text-xs">
              Silakan pilih portal login sesuai dengan hak akses Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="default">
              <Link href="/kelompok/login">
                <LogIn className="mr-2 size-4" />
                Masuk Sebagai Kelompok
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/login">
                <Lock className="mr-2 size-4" />
                Masuk Sebagai Admin
              </Link>
            </Button>
          </CardContent>
        </Card>

        <p className="text-[11px] text-muted-foreground">{APP_NAME} &bull; SMKN 1 Cimahi</p>
      </div>
    </div>
  );
}

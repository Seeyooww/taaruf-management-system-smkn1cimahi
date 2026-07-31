import Link from "next/link";
import { ArrowLeft, Home, ShieldX } from "lucide-react";

import { ThemeSwitch } from "@/components/common/theme-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: "Akses Ditolak (403)",
  description: "Akun Anda tidak memiliki izin untuk mengakses area ini.",
};

export default function ForbiddenPage() {
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
        <div className="mx-auto inline-flex size-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive shadow-md">
          <ShieldX className="size-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Akses Ditolak (403)</h1>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Akun Anda terautentikasi tetapi tidak memiliki hak akses untuk membuka halaman ini.
          </p>
        </div>

        <Card className="glass-card border-border/80 shadow-lg text-left">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Tindakan Yang Disarankan</CardTitle>
            <CardDescription className="text-xs">
              Kembali ke dashboard yang sesuai dengan peran akun Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 size-4" />
                Kembali Ke Beranda
              </Link>
            </Button>
          </CardContent>
        </Card>

        <p className="text-[11px] text-muted-foreground">{APP_NAME} &bull; SMKN 1 Cimahi</p>
      </div>
    </div>
  );
}

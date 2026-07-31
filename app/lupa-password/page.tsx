import Link from "next/link";
import { ArrowLeft, HelpCircle, LifeBuoy, ShieldCheck } from "lucide-react";

import { ThemeSwitch } from "@/components/common/theme-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: "Bantuan Lupa Password",
  description: "Petunjuk pemulihan password akun Taaruf Management System.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background relative">
      <div className="absolute top-4 left-4 right-4 max-w-7xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1.5 size-4" /> Kembali ke Beranda
        </Link>
        <ThemeSwitch />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
          <p className="text-xs text-muted-foreground">Pusat Bantuan Akun</p>
        </div>

        <Card className="glass-card border-border/80 shadow-lg">
          <CardHeader className="space-y-1 pb-4 text-center">
            <div className="mx-auto inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-1">
              <HelpCircle className="size-5" />
            </div>
            <CardTitle className="text-xl">Lupa Password Akun?</CardTitle>
            <CardDescription className="text-xs">
              Informasi mengenai mekanisme pemulihan kredensial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-muted/40 p-4 space-y-3 text-xs leading-relaxed text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground text-sm">
                <LifeBuoy className="size-4 text-primary" /> Pengaturan Pemulihan Internal
              </div>
              <p>
                Sistem TMS menggunakan jaringan internal terbatas. Untuk alasan keamanan, pemulihan password mandiri melalui email <strong>tidak tersedia</strong>.
              </p>
              <div className="border-t border-border pt-3 space-y-1.5">
                <p className="font-medium text-foreground">Langkah Pemulihan Password:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Hubungi Panitia atau Admin Taaruf SMKN 1 Cimahi.</li>
                  <li>Sampaikan nama kelompok atau username akun Anda.</li>
                  <li>Admin akan memverifikasi dan melakukan reset password.</li>
                </ol>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button asChild className="w-full">
                <Link href="/kelompok/login">
                  <ArrowLeft className="mr-2 size-4" />
                  Kembali ke Login Kelompok
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/login">
                  <ShieldCheck className="mr-2 size-4" />
                  Login Sebagai Admin
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

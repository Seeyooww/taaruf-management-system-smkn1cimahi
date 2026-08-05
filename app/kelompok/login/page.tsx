import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

import { AppFooter } from "@/components/layout/app-footer";
import { ThemeSwitch } from "@/components/common/theme-switch";
import { KelompokLoginForm } from "@/components/forms/kelompok-login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, APP_SHORT_NAME } from "@/lib/constants";

export const metadata = {
  title: "Login Kelompok",
  description: "Halaman autentikasi akun kelompok peserta Taaruf.",
};

export default function KelompokLoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute bottom-0 left-0 size-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation */}
      <div className="absolute top-4 left-4 right-4 max-w-7xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1.5 size-4" /> Kembali ke Beranda
        </Link>
        <ThemeSwitch />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-xl shadow-md">
            {APP_SHORT_NAME}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
          <p className="text-xs text-muted-foreground">SMKN 1 Cimahi</p>
        </div>

        <Card className="glass-card border-border/80 shadow-lg">
          <CardHeader className="space-y-1 pb-4 text-center">
            <div className="mx-auto inline-flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary mb-1">
              <Users className="size-5" />
            </div>
            <CardTitle className="text-xl">Akses Login Kelompok</CardTitle>
            <CardDescription className="text-xs">
              Masukkan nama kelompok dan password untuk mengakses dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <KelompokLoginForm />
          </CardContent>
        </Card>
      </div>

      <AppFooter className="mt-8 border-t-0 bg-transparent" />
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

import { ThemeSwitch } from "@/components/common/theme-switch";
import { AdminLoginForm } from "@/components/forms/admin-login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, APP_SHORT_NAME } from "@/lib/constants";

export const metadata = {
  title: "Login Admin",
  description: "Halaman autentikasi untuk pengelola dan admin sistem Taaruf.",
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 right-0 size-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

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
              <Shield className="size-5" />
            </div>
            <CardTitle className="text-xl">Akses Login Admin</CardTitle>
            <CardDescription className="text-xs">
              Masukkan kredensial admin untuk mengakses dashboard pengelola
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminLoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

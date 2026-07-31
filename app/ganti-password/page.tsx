import { KeyRound, ShieldAlert } from "lucide-react";

import { ThemeSwitch } from "@/components/common/theme-switch";
import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: "Ganti Password Wajib",
  description: "Pembaruan password wajib untuk keamanan akun pertama kali.",
};

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background relative">
      <div className="absolute top-4 right-4">
        <ThemeSwitch />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
          <p className="text-xs text-muted-foreground">Prosedur Keamanan Akun</p>
        </div>

        {/* Security Warning Notice */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-3 shadow-xs">
          <ShieldAlert className="size-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Pembaruan Password Diperlukan</p>
            <p className="leading-relaxed opacity-90">
              Akun Anda masih menggunakan password default. Untuk melanjutkan akses ke sistem, silakan perbarui password Anda.
            </p>
          </div>
        </div>

        <Card className="glass-card border-border/80 shadow-lg">
          <CardHeader className="space-y-1 pb-4 text-center">
            <div className="mx-auto inline-flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary mb-1">
              <KeyRound className="size-5" />
            </div>
            <CardTitle className="text-xl">Formulir Ganti Password</CardTitle>
            <CardDescription className="text-xs">
              Buat password baru yang kuat dan unik untuk akun Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/services/auth.actions";
import { changePasswordSchema } from "@/validation/auth";

type FormValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("currentPassword", values.currentPassword);
      formData.append("newPassword", values.newPassword);
      formData.append("confirmPassword", values.confirmPassword);

      const result = await changePasswordAction({ success: false }, formData);

      if (!result.success) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              setError(field as keyof FormValues, {
                type: "manual",
                message: messages[0],
              });
            }
          });
        }
        toast.error(result.message || "Gagal memperbarui password.");
        return;
      }

      toast.success("Password berhasil diperbarui! Mengalihkan ke Dashboard...");
      if (result.redirectTo) {
        window.location.href = result.redirectTo;
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Password Lama / Default</Label>
        <Input
          id="currentPassword"
          type="password"
          placeholder="Masukkan password saat ini"
          disabled={isPending}
          autoComplete="current-password"
          {...register("currentPassword")}
        />
        {errors.currentPassword && (
          <p className="text-xs font-medium text-destructive flex items-center gap-1">
            <ShieldAlert className="size-3.5" /> {errors.currentPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">Password Baru</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="Minimal 8 karakter"
          disabled={isPending}
          autoComplete="new-password"
          {...register("newPassword")}
        />
        {errors.newPassword && (
          <p className="text-xs font-medium text-destructive flex items-center gap-1">
            <ShieldAlert className="size-3.5" /> {errors.newPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Ulangi password baru"
          disabled={isPending}
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-xs font-medium text-destructive flex items-center gap-1">
            <ShieldAlert className="size-3.5" /> {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <ShieldCheck className="size-4 text-emerald-500" /> Aturan Keamanan Password:
        </div>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          <li>Minimal 8 karakter</li>
          <li>Harus berbeda dari password lama/default</li>
          <li>Password baru tidak boleh sama dengan username</li>
        </ul>
      </div>

      <Button
        type="submit"
        className="w-full font-medium"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Menyimpan Password...
          </>
        ) : (
          <>
            <KeyRound className="mr-2 size-4" />
            Simpan Password Baru
          </>
        )}
      </Button>
    </form>
  );
}

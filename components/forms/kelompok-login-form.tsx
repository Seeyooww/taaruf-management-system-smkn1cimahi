"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, LogIn, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginKelompokAction } from "@/services/auth.actions";
import { loginSchema } from "@/validation/auth";

type FormValues = z.infer<typeof loginSchema>;

export function KelompokLoginForm() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMeValue = watch("rememberMe");

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("username", values.username);
      formData.append("password", values.password);
      if (values.rememberMe) {
        formData.append("rememberMe", "on");
      }

      const result = await loginKelompokAction({ success: false }, formData);

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
        toast.error(result.message || "Gagal masuk sebagai Kelompok.");
        return;
      }

      toast.success("Berhasil masuk! Mengalihkan ke Dashboard Kelompok...");
      if (result.redirectTo) {
        window.location.href = result.redirectTo;
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="kelompok-username">Nama Kelompok / Username</Label>
        <Input
          id="kelompok-username"
          type="text"
          placeholder="Contoh: kelompok1"
          disabled={isPending}
          autoComplete="username"
          {...register("username")}
        />
        {errors.username && (
          <p className="text-xs font-medium text-destructive flex items-center gap-1">
            <ShieldAlert className="size-3.5" /> {errors.username.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="kelompok-password">Password</Label>
          <Link
            href="/lupa-password"
            className="text-xs text-primary hover:underline font-medium"
          >
            Lupa password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="kelompok-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            disabled={isPending}
            autoComplete="current-password"
            className="pr-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={isPending}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs font-medium text-destructive flex items-center gap-1">
            <ShieldAlert className="size-3.5" /> {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2 py-1">
        <Checkbox
          id="rememberMe"
          checked={Boolean(rememberMeValue)}
          onCheckedChange={(checked) => setValue("rememberMe", Boolean(checked))}
          disabled={isPending}
        />
        <Label
          htmlFor="rememberMe"
          className="text-xs text-muted-foreground font-normal cursor-pointer leading-none"
        >
          Ingat sesi saya di perangkat ini
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full font-medium"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Memproses...
          </>
        ) : (
          <>
            <LogIn className="mr-2 size-4" />
            Masuk Sebagai Kelompok
          </>
        )}
      </Button>
    </form>
  );
}

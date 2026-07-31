"useClient";
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAdminAction } from "@/services/auth.actions";
import { loginSchema } from "@/validation/auth";

type FormValues = z.infer<typeof loginSchema>;

export function AdminLoginForm() {
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("username", values.username);
      formData.append("password", values.password);

      const result = await loginAdminAction({ success: false }, formData);

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
        toast.error(result.message || "Gagal masuk sebagai Admin.");
        return;
      }

      toast.success("Berhasil masuk! Mengalihkan ke Dashboard Admin...");
      if (result.redirectTo) {
        window.location.href = result.redirectTo;
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="admin-username">Username Admin</Label>
        <Input
          id="admin-username"
          type="text"
          placeholder="Masukkan username admin"
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
        <Label htmlFor="admin-password">Password</Label>
        <Input
          id="admin-password"
          type="password"
          placeholder="••••••••"
          disabled={isPending}
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs font-medium text-destructive flex items-center gap-1">
            <ShieldAlert className="size-3.5" /> {errors.password.message}
          </p>
        )}
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
            Masuk Sebagai Admin
          </>
        )}
      </Button>
    </form>
  );
}

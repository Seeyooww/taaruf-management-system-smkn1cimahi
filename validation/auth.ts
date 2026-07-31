import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Username wajib diisi.")
    .max(50, "Username terlalu panjang."),
  password: z
    .string()
    .min(1, "Password wajib diisi.")
    .max(100, "Password terlalu panjang."),
  rememberMe: z.boolean().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Password lama wajib diisi.")
      .max(100, "Password lama terlalu panjang."),
    newPassword: z
      .string()
      .min(8, "Password baru minimal 8 karakter.")
      .max(100, "Password baru terlalu panjang."),
    confirmPassword: z
      .string()
      .min(1, "Konfirmasi password wajib diisi.")
      .max(100, "Konfirmasi password terlalu panjang."),
  })
  .superRefine(({ newPassword, confirmPassword, currentPassword }, context) => {
    if (newPassword !== confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Konfirmasi password tidak cocok.",
      });
    }

    if (newPassword === currentPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: "Password baru harus berbeda dari password lama.",
      });
    }
  });

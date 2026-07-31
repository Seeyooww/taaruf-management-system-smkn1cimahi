"use server";

import type { ActionState } from "@/types/auth";
import { changePasswordSchema, loginSchema } from "@/validation/auth";
import { changePassword, loginWithUsername, logout } from "@/services/auth.service";

function fromZodError(error: ReturnType<typeof loginSchema.safeParse>["error"]): ActionState {
  return {
    success: false,
    message: "Mohon periksa kembali input yang dimasukkan.",
    fieldErrors: error?.flatten().fieldErrors,
  };
}

export async function loginAdminAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "on",
  });

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const result = await loginWithUsername({
    ...parsed.data,
    expectedRole: "admin",
  });

  return result.success
    ? { success: true, redirectTo: result.redirectTo }
    : { success: false, message: result.message };
}

export async function loginKelompokAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "on",
  });

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const result = await loginWithUsername({
    ...parsed.data,
    expectedRole: "kelompok",
  });

  return result.success
    ? { success: true, redirectTo: result.redirectTo }
    : { success: false, message: result.message };
}

export async function changePasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Mohon periksa kembali input yang dimasukkan.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await changePassword(parsed.data);

  return result.success
    ? { success: true, redirectTo: result.redirectTo }
    : {
        success: false,
        message: result.message,
        fieldErrors: result.field
          ? { [result.field]: [result.message ?? "Terjadi kesalahan."] }
          : undefined,
      };
}

export async function logoutAction() {
  await logout();
}

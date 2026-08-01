import "server-only";

import { cookies } from "next/headers";

import { isSupabaseConfigured } from "@/lib/env";
import { getMockAccount, updateMockPassword, verifyMockPassword } from "@/lib/mock-auth";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/session";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  createSupabaseStatelessClient,
} from "@/lib/supabase/server";
import { buildInternalAuthEmail, getDashboardPath } from "@/lib/utils";
import type {
  ChangePasswordPayload,
  LoginPayload,
  SessionCookiePayload,
  SessionProfile,
} from "@/types/auth";

const cookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7,
};

interface UserProfileRow {
  auth_user_id: string;
  username: string;
  role: SessionProfile["role"];
  display_name: string | null;
  must_change_password: boolean;
  is_active: boolean;
}

function toSessionProfile(
  profile: UserProfileRow,
  authMode: SessionProfile["authMode"],
): SessionProfile {
  return {
    id: profile.auth_user_id,
    username: profile.username,
    role: profile.role,
    displayName: profile.display_name,
    mustChangePassword: profile.must_change_password,
    authMode,
  };
}

async function setDevelopmentSession(profile: SessionProfile) {
  const cookieStore = await cookies();

  const payload: SessionCookiePayload = {
    sub: profile.id,
    username: profile.username,
    role: profile.role,
    displayName: profile.displayName,
    mustChangePassword: profile.mustChangePassword,
    authMode: "development",
  };

  const token = await createSessionToken(payload);
  cookieStore.set(SESSION_COOKIE_NAME, token, cookieOptions);
}

async function clearDevelopmentSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionProfile() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data } = await supabase
      .from("user_profiles")
      .select("auth_user_id, username, role, display_name, must_change_password, is_active")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle<UserProfileRow>();

    return data ? toSessionProfile(data, "supabase") : null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);

  if (!payload) {
    return null;
  }

  return {
    id: payload.sub,
    username: payload.username,
    role: payload.role,
    displayName: payload.displayName,
    mustChangePassword: payload.mustChangePassword,
    authMode: payload.authMode,
  } satisfies SessionProfile;
}

/**
 * Resolves the actual `kelompok.id` (UUID from public.kelompok table)
 * for the currently logged-in kelompok user.
 *
 * IMPORTANT: session.id = auth_user_id (Supabase Auth UUID) ≠ kelompok.id.
 * This function does the proper lookup by matching username.
 *
 * Returns null if the session is missing or no matching kelompok row is found.
 */
export async function getKelompokIdFromSession(): Promise<string | null> {
  const session = await getSessionProfile();
  if (!session || session.role !== "kelompok") return null;

  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();
    const { data } = await adminClient
      .from("kelompok")
      .select("id")
      .eq("username", session.username)
      .maybeSingle();
    return data?.id ?? null;
  }

  // Dev mode: return the mock kelompok id stored in payload.sub
  return session.id || null;
}

export async function loginWithUsername(payload: LoginPayload) {
  const normalizedUsername = payload.username.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();
    const { data: profile } = await adminClient
      .from("user_profiles")
      .select("auth_user_id, username, role, display_name, must_change_password, is_active")
      .eq("username", normalizedUsername)
      .eq("role", payload.expectedRole)
      .eq("is_active", true)
      .maybeSingle<UserProfileRow>();

    if (!profile) {
      return {
        success: false,
        message: "Username atau password tidak valid.",
      };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: buildInternalAuthEmail(profile.username),
      password: payload.password,
    });

    if (error) {
      return {
        success: false,
        message: "Username atau password tidak valid.",
      };
    }

    const session = toSessionProfile(profile, "supabase");

    return {
      success: true,
      redirectTo: session.mustChangePassword
        ? "/ganti-password"
        : getDashboardPath(session.role),
    };
  }

  const account = await verifyMockPassword(normalizedUsername, payload.password);

  if (!account || account.role !== payload.expectedRole) {
    return {
      success: false,
      message: "Username atau password tidak valid.",
    };
  }

  await setDevelopmentSession(account);

  return {
    success: true,
    redirectTo: account.mustChangePassword
      ? "/ganti-password"
      : getDashboardPath(account.role),
  };
}

export async function changePassword(payload: ChangePasswordPayload) {
  const session = await getSessionProfile();

  if (!session) {
    return {
      success: false,
      message: "Sesi tidak ditemukan. Silakan masuk kembali.",
    };
  }

  if (payload.newPassword.trim().toLowerCase() === session.username.toLowerCase()) {
    return {
      success: false,
      message: "Password baru tidak boleh sama dengan password default.",
      field: "newPassword",
    };
  }

  if (isSupabaseConfigured()) {
    const verifier = createSupabaseStatelessClient();
    const verification = await verifier.auth.signInWithPassword({
      email: buildInternalAuthEmail(session.username),
      password: payload.currentPassword,
    });

    if (verification.error) {
      return {
        success: false,
        message: "Password lama tidak sesuai.",
        field: "currentPassword",
      };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({
      password: payload.newPassword,
    });

    if (error) {
      return {
        success: false,
        message: "Gagal mengganti password. Silakan coba lagi.",
      };
    }

    const adminClient = createSupabaseAdminClient();
    await adminClient
      .from("user_profiles")
      .update({
        must_change_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq("auth_user_id", session.id);

    return {
      success: true,
      redirectTo: getDashboardPath(session.role),
    };
  }

  const account = getMockAccount(session.username);

  if (!account) {
    return {
      success: false,
      message: "Akun tidak ditemukan.",
    };
  }

  const verified = await verifyMockPassword(session.username, payload.currentPassword);

  if (!verified) {
    return {
      success: false,
      message: "Password lama tidak sesuai.",
      field: "currentPassword",
    };
  }

  const updated = await updateMockPassword(
    session.username,
    session.role,
    payload.newPassword,
  );

  if (!updated) {
    return {
      success: false,
      message: "Gagal mengganti password. Silakan coba lagi.",
    };
  }

  await setDevelopmentSession(updated);

  return {
    success: true,
    redirectTo: getDashboardPath(session.role),
  };
}

export async function logout() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return;
  }

  await clearDevelopmentSession();
}

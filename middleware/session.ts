import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { env, isSupabaseConfigured } from "@/lib/env";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import type { SessionProfile } from "@/types/auth";

interface UserProfileRow {
  auth_user_id: string;
  username: string;
  role: SessionProfile["role"];
  display_name: string | null;
  must_change_password: boolean;
}

export async function getMiddlewareSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return {
        response: NextResponse.next(),
        session: null,
      };
    }

    const payload = await verifySessionToken(token);

    return {
      response: NextResponse.next(),
      session: payload
        ? ({
            id: payload.sub,
            username: payload.username,
            role: payload.role,
            displayName: payload.displayName,
            mustChangePassword: payload.mustChangePassword,
            authMode: payload.authMode,
          } satisfies SessionProfile)
        : null,
    };
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { response, session: null };
  }

  const { data } = await supabase
    .from("user_profiles")
    .select("auth_user_id, username, role, display_name, must_change_password")
    .eq("auth_user_id", user.id)
    .maybeSingle<UserProfileRow>();

  if (!data) {
    return { response, session: null };
  }

  return {
    response,
    session: {
      id: data.auth_user_id,
      username: data.username,
      role: data.role,
      displayName: data.display_name,
      mustChangePassword: data.must_change_password,
      authMode: "supabase",
    } satisfies SessionProfile,
  };
}

import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export interface ActiveUserItem {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "kelompok";
  lastActiveAt: string;
  nomorKelompok?: number | null;
}

/**
 * Record presence touch using the auth_user_id directly.
 * Called from a server action that already has the session.
 */
export async function touchPresenceById(authUserId: string) {
  if (!authUserId) return;
  if (!isSupabaseConfigured()) return;

  try {
    const adminClient = createSupabaseAdminClient();
    await adminClient
      .from("user_profiles")
      .update({ updated_at: new Date().toISOString() })
      .eq("auth_user_id", authUserId);
  } catch (err) {
    console.error("[touchPresenceById] error:", err);
  }
}

/**
 * Fetch list of users active within the last 15 minutes.
 * Does NOT call getSessionProfile – avoids cookie context issues in server actions.
 */
export async function fetchActiveUsers(): Promise<ActiveUserItem[]> {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  if (isSupabaseConfigured()) {
    try {
      const adminClient = createSupabaseAdminClient();
      const { data, error } = await adminClient
        .from("user_profiles")
        .select("auth_user_id, username, display_name, role, updated_at")
        .eq("is_active", true)
        .gte("updated_at", fifteenMinutesAgo)
        .order("updated_at", { ascending: false });

      if (!error && data && data.length > 0) {
        // Fetch kelompok numbers separately to avoid FK join issues
        const kelompokUsers = data.filter((u: any) => u.role === "kelompok");
        let kelompokMap = new Map<string, number>();

        if (kelompokUsers.length > 0) {
          const usernames = kelompokUsers.map((u: any) => u.username);
          const { data: kelData } = await adminClient
            .from("kelompok")
            .select("username, nomor_kelompok")
            .in("username", usernames);

          (kelData ?? []).forEach((k: any) => {
            if (k.username && k.nomor_kelompok != null) {
              kelompokMap.set(k.username, k.nomor_kelompok);
            }
          });
        }

        return data.map((u: any) => ({
          id: u.auth_user_id,
          username: u.username,
          displayName: u.display_name || u.username,
          role: u.role as "admin" | "kelompok",
          lastActiveAt: u.updated_at,
          nomorKelompok: kelompokMap.get(u.username) ?? null,
        }));
      }
    } catch (err) {
      console.error("[fetchActiveUsers] error:", err);
    }
  }

  return [];
}

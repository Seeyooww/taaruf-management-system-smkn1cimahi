import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/services/auth.service";

export interface ActiveUserItem {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "kelompok";
  lastActiveAt: string;
}

// In-memory active presence tracker for dev mode / fallback
const devActiveUsersMap = new Map<string, ActiveUserItem>();

/**
 * Record presence touch for the currently logged-in user.
 */
export async function touchPresence() {
  const session = await getSessionProfile();
  if (!session) return;

  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      const adminClient = createSupabaseAdminClient();
      await adminClient
        .from("user_profiles")
        .update({ updated_at: now })
        .eq("auth_user_id", session.id);
    } catch (err) {
      console.error("[touchPresence] error:", err);
    }
  }

  // Record in memory (both dev & server-side tracking)
  devActiveUsersMap.set(session.id, {
    id: session.id,
    username: session.username,
    displayName: session.displayName || session.username,
    role: session.role,
    lastActiveAt: now,
  });
}

/**
 * Fetch list of users active within the last 15 minutes.
 */
export async function fetchActiveUsers(): Promise<ActiveUserItem[]> {
  // Always trigger presence touch for current caller
  await touchPresence();

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
        return data.map((u: any) => ({
          id: u.auth_user_id,
          username: u.username,
          displayName: u.display_name || u.username,
          role: u.role as "admin" | "kelompok",
          lastActiveAt: u.updated_at,
        }));
      }
    } catch (err) {
      console.error("[fetchActiveUsers] error:", err);
    }
  }

  // Filter in-memory map for active users within last 15 minutes
  const activeList: ActiveUserItem[] = [];
  const cutoff = Date.now() - 15 * 60 * 1000;

  for (const item of devActiveUsersMap.values()) {
    if (new Date(item.lastActiveAt).getTime() >= cutoff) {
      activeList.push(item);
    }
  }

  // Ensure current user is always included if logged in
  const currentSession = await getSessionProfile();
  if (currentSession && !activeList.some((u) => u.id === currentSession.id)) {
    activeList.unshift({
      id: currentSession.id,
      username: currentSession.username,
      displayName: currentSession.displayName || currentSession.username,
      role: currentSession.role,
      lastActiveAt: new Date().toISOString(),
    });
  }

  return activeList;
}

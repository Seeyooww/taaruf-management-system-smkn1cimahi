"use server";

import { getSessionProfile } from "@/services/auth.service";
import { fetchActiveUsers, touchPresenceById } from "@/services/presence.service";

/**
 * Touch presence for current user then return active users list.
 * getSessionProfile() is safe here since this is a Next.js Server Action
 * called from a client component that has cookies.
 */
export async function getActiveUsersAction() {
  try {
    // Touch presence for the currently logged-in user
    const session = await getSessionProfile();
    if (session?.id) {
      await touchPresenceById(session.id);
    }
  } catch {
    // Non-fatal: if session can't be read, still return active users
  }

  return await fetchActiveUsers();
}

export async function touchPresenceAction() {
  try {
    const session = await getSessionProfile();
    if (session?.id) {
      await touchPresenceById(session.id);
    }
  } catch {
    // Ignore
  }
}

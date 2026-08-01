"use server";

import { fetchActiveUsers, touchPresence } from "@/services/presence.service";

export async function getActiveUsersAction() {
  return await fetchActiveUsers();
}

export async function touchPresenceAction() {
  await touchPresence();
}

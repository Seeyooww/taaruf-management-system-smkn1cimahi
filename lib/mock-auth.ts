import { compare, hashSync } from "bcryptjs";

import {
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
} from "@/lib/constants";
import type { SessionProfile, UserRole } from "@/types/auth";

interface MockAccount extends SessionProfile {
  passwordHash: string;
}

const mockAccounts = new Map<string, MockAccount>([
  [
    DEFAULT_ADMIN_USERNAME,
    {
      id: "mock-admin-1",
      username: DEFAULT_ADMIN_USERNAME,
      role: "admin",
      displayName: "Admin TMS",
      mustChangePassword: true,
      authMode: "development",
      passwordHash: hashSync(DEFAULT_ADMIN_PASSWORD, 10),
    },
  ],
  [
    "kelompok1",
    {
      id: "mock-kelompok-1",
      username: "kelompok1",
      role: "kelompok",
      displayName: "Kelompok 1",
      mustChangePassword: true,
      authMode: "development",
      passwordHash: hashSync("kelompok1", 10),
    },
  ],
  [
    "kelompok2",
    {
      id: "mock-kelompok-2",
      username: "kelompok2",
      role: "kelompok",
      displayName: "Kelompok 2",
      mustChangePassword: true,
      authMode: "development",
      passwordHash: hashSync("kelompok2", 10),
    },
  ],
]);

export function getMockAccount(username: string) {
  return mockAccounts.get(username.trim().toLowerCase()) ?? null;
}

export async function verifyMockPassword(username: string, password: string) {
  const account = getMockAccount(username);

  if (!account) {
    return null;
  }

  const isMatch = await compare(password, account.passwordHash);
  return isMatch ? account : null;
}

export async function updateMockPassword(
  username: string,
  role: UserRole,
  newPassword: string,
) {
  const current = getMockAccount(username);

  if (!current || current.role !== role) {
    return null;
  }

  const nextValue: MockAccount = {
    ...current,
    mustChangePassword: false,
    passwordHash: hashSync(newPassword, 10),
  };

  mockAccounts.set(username.toLowerCase(), nextValue);
  return nextValue;
}

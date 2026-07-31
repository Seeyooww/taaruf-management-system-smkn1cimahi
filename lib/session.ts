import { jwtVerify, SignJWT } from "jose";

import { getJwtSecretBuffer } from "@/lib/env";
import type { SessionCookiePayload } from "@/types/auth";

export const SESSION_COOKIE_NAME = "tms-session";

export async function createSessionToken(payload: SessionCookiePayload) {
  return new SignJWT({
    username: payload.username,
    role: payload.role,
    displayName: payload.displayName,
    mustChangePassword: payload.mustChangePassword,
    authMode: payload.authMode,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecretBuffer());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretBuffer());

    return {
      sub: String(payload.sub),
      username: String(payload.username),
      role: payload.role as SessionCookiePayload["role"],
      displayName:
        typeof payload.displayName === "string" ? payload.displayName : null,
      mustChangePassword: Boolean(payload.mustChangePassword),
      authMode: payload.authMode as SessionCookiePayload["authMode"],
    } satisfies SessionCookiePayload;
  } catch {
    return null;
  }
}

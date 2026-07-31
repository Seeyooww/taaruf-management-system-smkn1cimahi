import type { SessionProfile, UserRole } from "@/types/auth";
import { getDashboardPath, getLoginPath } from "@/lib/utils";

interface RouteMeta {
  kind: "public" | "login" | "protected";
  role?: UserRole;
}

export function getRouteMeta(pathname: string): RouteMeta {
  if (
    pathname === "/" ||
    pathname === "/lupa-password" ||
    pathname === "/unauthorized" ||
    pathname === "/forbidden"
  ) {
    return { kind: "public" };
  }

  if (pathname === "/admin/login") {
    return { kind: "login", role: "admin" };
  }

  if (pathname === "/kelompok/login") {
    return { kind: "login", role: "kelompok" };
  }

  if (pathname.startsWith("/admin")) {
    return { kind: "protected", role: "admin" };
  }

  if (pathname.startsWith("/kelompok")) {
    return { kind: "protected", role: "kelompok" };
  }

  if (pathname === "/ganti-password") {
    return { kind: "protected" };
  }

  return { kind: "public" };
}

export function resolveRouteRedirect(
  pathname: string,
  session: SessionProfile | null,
) {
  const meta = getRouteMeta(pathname);

  if (meta.kind === "public") {
    return null;
  }

  if (!session) {
    if (meta.kind === "login") {
      return null;
    }

    if (meta.role) {
      return getLoginPath(meta.role);
    }

    return "/unauthorized";
  }

  if (session.mustChangePassword && pathname !== "/ganti-password") {
    return "/ganti-password";
  }

  if (pathname === "/ganti-password" && !session.mustChangePassword) {
    return getDashboardPath(session.role);
  }

  if (meta.kind === "login") {
    return getDashboardPath(session.role);
  }

  if (meta.role && meta.role !== session.role) {
    return "/forbidden";
  }

  return null;
}

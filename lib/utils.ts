import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { UserRole } from "@/types/auth";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildInternalAuthEmail(username: string) {
  return `${username.trim().toLowerCase()}@tms.internal`;
}

export function getDashboardPath(role: UserRole) {
  return role === "admin" ? "/admin/dashboard" : "/kelompok/dashboard";
}

export function getLoginPath(role: UserRole) {
  return role === "admin" ? "/admin/login" : "/kelompok/login";
}

export function getRoleLabel(role: UserRole) {
  return role === "admin" ? "Admin" : "Kelompok";
}

export function getInitials(name: string | null | undefined) {
  if (!name) {
    return "TM";
  }

  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function titleFromPath(pathname: string) {
  if (pathname.includes("/dashboard")) {
    return pathname.startsWith("/admin") ? "Dashboard Admin" : "Dashboard Kelompok";
  }

  if (pathname === "/ganti-password") {
    return "Ganti Password";
  }

  if (pathname === "/lupa-password") {
    return "Lupa Password";
  }

  return "Taaruf Management System";
}

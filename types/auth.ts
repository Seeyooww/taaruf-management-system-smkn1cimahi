export type UserRole = "admin" | "kelompok";

export type AuthMode = "supabase" | "development";

export interface SessionProfile {
  id: string;
  username: string;
  role: UserRole;
  displayName: string | null;
  mustChangePassword: boolean;
  authMode: AuthMode;
}

export interface LoginPayload {
  username: string;
  password: string;
  rememberMe?: boolean;
  expectedRole: UserRole;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ActionState {
  success: boolean;
  message?: string;
  redirectTo?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export interface SessionCookiePayload {
  sub: string;
  username: string;
  role: UserRole;
  displayName: string | null;
  mustChangePassword: boolean;
  authMode: AuthMode;
}

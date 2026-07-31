export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Taaruf Management System",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET ?? "development-only-secret-change-me",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
};

export function validateEnvironment(): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (!env.supabaseUrl) {
    warnings.push("⚠️ NEXT_PUBLIC_SUPABASE_URL belum diisi. Menggunakan in-memory mock DB fallback.");
  }
  if (!env.supabaseAnonKey) {
    warnings.push("⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi.");
  }
  if (!env.supabaseServiceRoleKey) {
    warnings.push("⚠️ SUPABASE_SERVICE_ROLE_KEY belum diisi.");
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "development-only-secret-change-me") {
    warnings.push("⚠️ JWT_SECRET masih menggunakan secret default. Ganti di environment production.");
  }
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    warnings.push("⚠️ NEXT_PUBLIC_APP_URL belum diisi. Fallback ke http://localhost:3000.");
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey);
}

export function getJwtSecretBuffer(): Uint8Array {
  return new TextEncoder().encode(env.jwtSecret);
}

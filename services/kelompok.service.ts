import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import {
  deleteMockKelompok,
  getMockKelompokList,
  saveMockKelompok,
} from "@/lib/mock-db";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { buildInternalAuthEmail } from "@/lib/utils";
import type { Kelompok } from "@/types/database";

export async function fetchKelompokList(): Promise<Kelompok[]> {
  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();
    const { data: kelompokData, error } = await adminClient
      .from("kelompok")
      .select("*, anggota(id)")
      .order("nomor_kelompok", { ascending: true });

    if (error) {
      console.error("[Supabase fetchKelompokList error]", error.message);
      return [];
    }

    return (kelompokData ?? []).map((k: any) => ({
      id: k.id,
      nomor_kelompok: k.nomor_kelompok,
      kelas: k.kelas,
      username: k.username,
      created_at: k.created_at,
      total_anggota: Array.isArray(k.anggota) ? k.anggota.length : 0,
    }));
  }

  return getMockKelompokList();
}

export async function saveKelompok(data: {
  nomor_kelompok: number;
  kelas: string;
  username: string;
}) {
  const username = data.username.toLowerCase().trim();

  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();

    // Check if this kelompok already exists (to decide create vs update)
    const { data: existing } = await adminClient
      .from("kelompok")
      .select("id, username")
      .eq("nomor_kelompok", data.nomor_kelompok)
      .maybeSingle();

    const isNew = !existing;
    const usernameChanged =
      existing && existing.username !== username;

    // Upsert kelompok row
    const { data: result, error } = await adminClient
      .from("kelompok")
      .upsert(
        {
          nomor_kelompok: Number(data.nomor_kelompok),
          kelas: data.kelas,
          username,
        },
        { onConflict: "nomor_kelompok" }
      )
      .select()
      .single();

    if (error || !result) {
      console.error("[Supabase saveKelompok error]", error?.message);
      return { success: false, message: "Gagal menyimpan data kelompok." };
    }

    if (isNew) {
      // Create Supabase Auth user — password default = username
      const email = buildInternalAuthEmail(username);
      const { data: authData, error: authError } =
        await adminClient.auth.admin.createUser({
          email,
          password: username,
          email_confirm: true,
        });

      if (authError) {
        console.error("[Supabase createUser error]", authError.message);
        // Kelompok data is saved, but auth creation failed — log only
      } else if (authData.user) {
        const { error: profileError } = await adminClient
          .from("user_profiles")
          .insert({
            auth_user_id: authData.user.id,
            username,
            role: "kelompok",
            display_name: `Kelompok ${data.nomor_kelompok}`,
            must_change_password: true,
            is_active: true,
          });

        if (profileError) {
          console.error("[Supabase insert user_profiles error]", profileError.message);
        }
      }
    } else if (usernameChanged) {
      // Find auth user via user_profiles using old username
      const oldUsername = existing.username;
      const { data: profile } = await adminClient
        .from("user_profiles")
        .select("auth_user_id")
        .eq("username", oldUsername)
        .maybeSingle();

      if (profile) {
        const newEmail = buildInternalAuthEmail(username);
        const { error: updateAuthError } =
          await adminClient.auth.admin.updateUserById(profile.auth_user_id, {
            email: newEmail,
            password: username, // reset password to new username
          });

        if (updateAuthError) {
          console.error("[Supabase updateUser error]", updateAuthError.message);
        }

        await adminClient
          .from("user_profiles")
          .update({
            username,
            display_name: `Kelompok ${data.nomor_kelompok}`,
            must_change_password: true,
            updated_at: new Date().toISOString(),
          })
          .eq("auth_user_id", profile.auth_user_id);
      }
    }

    return { success: true, data: result };
  }

  const saved = saveMockKelompok(data);
  return { success: true, data: saved };
}

export async function deleteKelompok(id: string) {
  if (isSupabaseConfigured()) {
    const adminClient = createSupabaseAdminClient();

    // Get the kelompok username before deleting
    const { data: kelompok } = await adminClient
      .from("kelompok")
      .select("username")
      .eq("id", id)
      .maybeSingle();

    if (kelompok?.username) {
      // Find auth_user_id via user_profiles
      const { data: profile } = await adminClient
        .from("user_profiles")
        .select("auth_user_id")
        .eq("username", kelompok.username)
        .maybeSingle();

      if (profile?.auth_user_id) {
        // Delete auth user (this removes from auth.users)
        const { error: deleteAuthError } =
          await adminClient.auth.admin.deleteUser(profile.auth_user_id);

        if (deleteAuthError) {
          console.error("[Supabase deleteUser error]", deleteAuthError.message);
        }

        // Delete user_profiles row
        await adminClient
          .from("user_profiles")
          .delete()
          .eq("auth_user_id", profile.auth_user_id);
      }
    }

    const { error: deleteError } = await adminClient
      .from("kelompok")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Supabase deleteKelompok error]", deleteError.message);
      return { success: false, message: "Gagal menghapus data kelompok." };
    }

    return { success: true };
  }

  deleteMockKelompok(id);
  return { success: true };
}

export async function parseAndImportKelompokCSV(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  let importedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip header line if present
    if (i === 0 && line.toLowerCase().includes("nomor")) continue;

    const parts = line.split(",").map((p) => p.trim());
    if (parts.length >= 3) {
      const nomor_kelompok = parseInt(parts[0], 10);
      const kelas = parts[1];
      const username = parts[2];

      if (!isNaN(nomor_kelompok) && kelas && username) {
        await saveKelompok({ nomor_kelompok, kelas, username });
        importedCount++;
      }
    }
  }

  return { success: true, importedCount };
}

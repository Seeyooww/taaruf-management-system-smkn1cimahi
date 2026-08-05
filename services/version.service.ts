import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import {
  addMockChangelog,
  deleteMockChangelog,
  getMockCurrentVersion,
  getMockVersions,
  saveMockVersion,
  setMockCurrentVersion,
} from "@/lib/mock-db";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { ChangelogCategory, SystemChangelog, SystemVersion } from "@/types/database";

/**
 * Fetch active current version info along with its changelog items.
 */
export async function fetchCurrentVersionInfo(): Promise<SystemVersion> {
  if (isSupabaseConfigured()) {
    try {
      const adminClient = createSupabaseAdminClient();

      // Query current version
      const { data: verRow, error: verErr } = await adminClient
        .from("system_version")
        .select("*")
        .eq("current", true)
        .limit(1)
        .maybeSingle();

      if (verErr || !verRow) {
        // Fallback to latest by created_at if no current flag set
        const { data: latestRow } = await adminClient
          .from("system_version")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!latestRow) return getMockCurrentVersion();
        
        const { data: cLogs } = await adminClient
          .from("system_changelog")
          .select("*")
          .eq("version_id", latestRow.id)
          .order("order_index", { ascending: true });

        return { ...latestRow, changelogs: cLogs ?? [] } as SystemVersion;
      }

      // Fetch changelogs for current version
      const { data: changelogs } = await adminClient
        .from("system_changelog")
        .select("*")
        .eq("version_id", verRow.id)
        .order("order_index", { ascending: true });

      return {
        ...verRow,
        changelogs: changelogs ?? [],
      } as SystemVersion;
    } catch (err) {
      console.error("[fetchCurrentVersionInfo] error:", err);
      return getMockCurrentVersion();
    }
  }

  return getMockCurrentVersion();
}

/**
 * Fetch ALL versions and their changelogs (ordered by created_at desc).
 */
export async function fetchAllVersions(): Promise<SystemVersion[]> {
  if (isSupabaseConfigured()) {
    try {
      const adminClient = createSupabaseAdminClient();

      const { data: versions, error: vErr } = await adminClient
        .from("system_version")
        .select("*")
        .order("created_at", { ascending: false });

      if (vErr || !versions || versions.length === 0) {
        return getMockVersions();
      }

      const versionIds = versions.map((v: any) => v.id);

      const { data: allLogs } = await adminClient
        .from("system_changelog")
        .select("*")
        .in("version_id", versionIds)
        .order("order_index", { ascending: true });

      const logsMap = new Map<string, SystemChangelog[]>();
      (allLogs ?? []).forEach((log: any) => {
        const arr = logsMap.get(log.version_id) ?? [];
        arr.push(log);
        logsMap.set(log.version_id, arr);
      });

      return versions.map((v: any) => ({
        ...v,
        changelogs: logsMap.get(v.id) ?? [],
      })) as SystemVersion[];
    } catch (err) {
      console.error("[fetchAllVersions] error:", err);
      return getMockVersions();
    }
  }

  return getMockVersions();
}

/**
 * Create a new version entry.
 */
export async function createVersion(data: {
  version: string;
  build: string;
  release_date: string;
  status: "Stable" | "Beta" | "RC" | "Deprecated";
  current?: boolean;
}): Promise<{ success: boolean; message: string; data?: SystemVersion }> {
  if (!data.version || !data.release_date) {
    return { success: false, message: "Versi dan tanggal rilis harus diisi." };
  }

  if (isSupabaseConfigured()) {
    try {
      const adminClient = createSupabaseAdminClient();

      if (data.current) {
        // Unset all other versions current flag
        await adminClient.from("system_version").update({ current: false }).neq("id", "00000000-0000-0000-0000-000000000000");
      }

      const { data: created, error } = await adminClient
        .from("system_version")
        .insert({
          version: data.version,
          build: data.build || new Date().toISOString().split("T")[0].replace(/-/g, ""),
          release_date: data.release_date,
          status: data.status || "Stable",
          current: Boolean(data.current),
        })
        .select()
        .single();

      if (error) {
        return { success: false, message: `Gagal membuat versi: ${error.message}` };
      }

      return { success: true, message: "Versi baru berhasil ditambahkan.", data: created as SystemVersion };
    } catch (err: any) {
      return { success: false, message: `Error: ${err?.message}` };
    }
  }

  const ver = saveMockVersion(data);
  return { success: true, message: "Versi baru berhasil ditambahkan.", data: ver };
}

/**
 * Set a specific version as the active current version.
 */
export async function setCurrentVersion(versionId: string): Promise<{ success: boolean; message: string }> {
  if (!versionId) return { success: false, message: "ID versi tidak valid." };

  if (isSupabaseConfigured()) {
    try {
      const adminClient = createSupabaseAdminClient();

      // 1. Unset current for all
      await adminClient.from("system_version").update({ current: false }).neq("id", "00000000-0000-0000-0000-000000000000");

      // 2. Set current for versionId
      const { error } = await adminClient
        .from("system_version")
        .update({ current: true })
        .eq("id", versionId);

      if (error) {
        return { success: false, message: `Gagal memperbarui versi aktif: ${error.message}` };
      }

      return { success: true, message: "Versi aktif berhasil diperbarui." };
    } catch (err: any) {
      return { success: false, message: `Error: ${err?.message}` };
    }
  }

  setMockCurrentVersion(versionId);
  return { success: true, message: "Versi aktif berhasil diperbarui." };
}

/**
 * Add a changelog item to a specific version.
 */
export async function addChangelogItem(data: {
  version_id: string;
  version: string;
  category: ChangelogCategory;
  title: string;
  description?: string;
  important?: boolean;
}): Promise<{ success: boolean; message: string; data?: SystemChangelog }> {
  if (!data.version_id || !data.title || !data.category) {
    return { success: false, message: "Versi, kategori, dan judul changelog harus diisi." };
  }

  if (isSupabaseConfigured()) {
    try {
      const adminClient = createSupabaseAdminClient();

      const { data: created, error } = await adminClient
        .from("system_changelog")
        .insert({
          version_id: data.version_id,
          version: data.version,
          category: data.category,
          title: data.title,
          description: data.description || null,
          important: Boolean(data.important),
        })
        .select()
        .single();

      if (error) {
        return { success: false, message: `Gagal menambah changelog: ${error.message}` };
      }

      return { success: true, message: "Changelog berhasil ditambahkan.", data: created as SystemChangelog };
    } catch (err: any) {
      return { success: false, message: `Error: ${err?.message}` };
    }
  }

  const cl = addMockChangelog(data);
  return { success: true, message: "Changelog berhasil ditambahkan.", data: cl };
}

/**
 * Delete a changelog item by ID.
 */
export async function deleteChangelogItem(id: string): Promise<{ success: boolean; message: string }> {
  if (!id) return { success: false, message: "ID changelog tidak valid." };

  if (isSupabaseConfigured()) {
    try {
      const adminClient = createSupabaseAdminClient();

      const { error } = await adminClient.from("system_changelog").delete().eq("id", id);
      if (error) {
        return { success: false, message: `Gagal menghapus changelog: ${error.message}` };
      }
      return { success: true, message: "Changelog berhasil dihapus." };
    } catch (err: any) {
      return { success: false, message: `Error: ${err?.message}` };
    }
  }

  deleteMockChangelog(id);
  return { success: true, message: "Changelog berhasil dihapus." };
}

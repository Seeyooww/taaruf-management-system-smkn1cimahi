"use server";

import {
  addChangelogItem,
  createVersion,
  deleteChangelogItem,
  fetchAllVersions,
  fetchCurrentVersionInfo,
  setCurrentVersion,
} from "@/services/version.service";
import type { ChangelogCategory } from "@/types/database";

export async function getCurrentVersionAction() {
  return await fetchCurrentVersionInfo();
}

export async function getAllVersionsAction() {
  return await fetchAllVersions();
}

export async function createVersionAction(formData: FormData) {
  const version = String(formData.get("version") || "").trim();
  const build = String(formData.get("build") || "").trim();
  const release_date = String(formData.get("release_date") || "").trim();
  const status = (String(formData.get("status") || "Stable").trim()) as any;
  const current = formData.get("current") === "true" || formData.get("current") === "on";

  return await createVersion({
    version,
    build,
    release_date,
    status,
    current,
  });
}

export async function setCurrentVersionAction(versionId: string) {
  return await setCurrentVersion(versionId);
}

export async function addChangelogAction(formData: FormData) {
  const version_id = String(formData.get("version_id") || "").trim();
  const version = String(formData.get("version") || "").trim();
  const category = String(formData.get("category") || "FEATURE").trim() as ChangelogCategory;
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const important = formData.get("important") === "true" || formData.get("important") === "on";

  return await addChangelogItem({
    version_id,
    version,
    category,
    title,
    description,
    important,
  });
}

export async function deleteChangelogAction(id: string) {
  return await deleteChangelogItem(id);
}

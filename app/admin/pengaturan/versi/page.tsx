export const dynamic = "force-dynamic";

import { fetchAllVersions } from "@/services/version.service";
import { VersionManagementView } from "@/components/admin/version-management-view";

export const metadata = {
  title: "Manajemen Versi & Changelog - Admin TMS",
};

export default async function AdminVersionManagementPage() {
  const versions = await fetchAllVersions();

  return <VersionManagementView initialVersions={versions} />;
}

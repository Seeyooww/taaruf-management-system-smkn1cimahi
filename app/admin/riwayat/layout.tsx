import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSessionProfile } from "@/services/auth.service";

export default async function AdminRiwayatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionProfile();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.role !== "admin") {
    redirect("/forbidden");
  }

  return <DashboardShell user={session}>{children}</DashboardShell>;
}

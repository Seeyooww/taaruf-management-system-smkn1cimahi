import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSessionProfile } from "@/services/auth.service";

export default async function KelompokDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionProfile();

  if (!session) {
    redirect("/kelompok/login");
  }

  if (session.role !== "kelompok") {
    redirect("/forbidden");
  }

  return <DashboardShell user={session}>{children}</DashboardShell>;
}

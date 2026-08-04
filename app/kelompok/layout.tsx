import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSessionProfile } from "@/services/auth.service";

export default async function KelompokRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionProfile();

  // If unauthenticated or not kelompok (e.g., login page), render children directly without sidebar
  if (!session || session.role !== "kelompok") {
    return <>{children}</>;
  }

  return <DashboardShell user={session}>{children}</DashboardShell>;
}

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSessionProfile } from "@/services/auth.service";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionProfile();

  // If unauthenticated or not admin (e.g., login page), render children directly without sidebar
  if (!session || session.role !== "admin") {
    return <>{children}</>;
  }

  return <DashboardShell user={session}>{children}</DashboardShell>;
}

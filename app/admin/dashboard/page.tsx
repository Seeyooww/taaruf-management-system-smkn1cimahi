export const dynamic = "force-dynamic";

import { getAnggotaAction } from "@/services/anggota.actions";
import { getBookingAction } from "@/services/booking.actions";
import { getKatingAction } from "@/services/kating.actions";
import { getKelompokAction } from "@/services/kelompok.actions";
import { getAnggotaProgressAction } from "@/services/progress.actions";
import { getAnalyticsDataAction, getLiveActiveSessionsAction } from "@/services/reporting.actions";
import { getSettingsAction } from "@/services/settings.actions";
import { getActivityLogsAction } from "@/services/activity.actions";
import { getSessionProfile } from "@/services/auth.service";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";

export const metadata = {
  title: "Dashboard Admin Command Center - TMS",
};

export default async function AdminDashboardPage() {
  const session = await getSessionProfile();

  const [
    settings,
    kelompokList,
    anggotaList,
    katingList,
    bookingList,
    progressSummaries,
    analyticsData,
    liveSessions,
    activityLogs,
  ] = await Promise.all([
    getSettingsAction(),
    getKelompokAction(),
    getAnggotaAction(),
    getKatingAction(),
    getBookingAction(),
    getAnggotaProgressAction(),
    getAnalyticsDataAction(),
    getLiveActiveSessionsAction(),
    getActivityLogsAction(),
  ]);

  return (
    <AdminDashboardView
      sessionProfile={session}
      settings={settings}
      kelompokList={kelompokList}
      anggotaList={anggotaList}
      katingList={katingList}
      bookingList={bookingList}
      progressSummaries={progressSummaries}
      analyticsData={analyticsData}
      liveSessions={liveSessions}
      activityLogs={activityLogs}
    />
  );
}

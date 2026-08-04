import { redirect } from "next/navigation";
import { getAnggotaAction } from "@/services/anggota.actions";
import { getSessionProfile } from "@/services/auth.service";
import { getBookingAction } from "@/services/booking.actions";
import { getKelompokAction } from "@/services/kelompok.actions";
import { getSettingsAction } from "@/services/settings.actions";
import { getSlotAction } from "@/services/slot.actions";
import { AdminBookingView } from "@/components/admin/admin-booking-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "👁 Monitoring Booking - TMS SMKN 1 Cimahi",
};

export default async function KelompokMonitoringPage() {
  const session = await getSessionProfile();
  if (!session) {
    redirect("/kelompok/login");
  }

  const [bookingList, kelompokList, slotList, allAnggotaList, settings] = await Promise.all([
    getBookingAction(),
    getKelompokAction(),
    getSlotAction(),
    getAnggotaAction(),
    getSettingsAction(),
  ]);

  return (
    <AdminBookingView
      initialBookings={bookingList}
      kelompokList={kelompokList}
      slotList={slotList}
      allAnggotaList={allAnggotaList}
      settings={settings}
      readOnly={true}
    />
  );
}

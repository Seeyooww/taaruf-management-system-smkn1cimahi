import { getAnggotaAction } from "@/services/anggota.actions";
import { getBookingAction } from "@/services/booking.actions";
import { getKelompokAction } from "@/services/kelompok.actions";
import { getSettingsAction } from "@/services/settings.actions";
import { getSlotAction } from "@/services/slot.actions";
import { AdminBookingView } from "@/components/admin/admin-booking-view";

export const metadata = {
  title: "Booking Kelompok - Admin",
};

export default async function AdminBookingPage() {
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
    />
  );
}

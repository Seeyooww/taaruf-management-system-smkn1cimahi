import { getBookingAction } from "@/services/booking.actions";
import { getSettingsAction } from "@/services/settings.actions";
import { getSlotAction } from "@/services/slot.actions";
import { getWATemplateAction } from "@/services/whatsapp.actions";
import { getSessionProfile } from "@/services/auth.service";
import { KelompokBookingView } from "@/components/kelompok/kelompok-booking-view";

export const metadata = {
  title: "Booking Saya - Kelompok",
};

export default async function KelompokBookingPage() {
  const session = await getSessionProfile();
  const kelompokId = session?.id || "kel-1";
  const kelompokNama = session?.displayName || session?.username || "Kelompok";

  const [bookingList, settings, slotList, templates] = await Promise.all([
    getBookingAction(kelompokId),
    getSettingsAction(),
    getSlotAction(),
    getWATemplateAction(),
  ]);

  return (
    <KelompokBookingView
      initialBookings={bookingList}
      settings={settings}
      slotList={slotList}
      templates={templates}
      kelompokId={kelompokId}
      kelompokNama={kelompokNama}
    />
  );
}

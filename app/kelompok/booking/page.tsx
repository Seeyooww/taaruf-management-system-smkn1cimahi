import { redirect } from "next/navigation";
import { getKelompokIdFromSession } from "@/services/auth.service";
import {
  getAllBookingsForCalendarAction,
  getBookingAction,
  getKatingCountsAction,
} from "@/services/booking.actions";
import { getSettingsAction } from "@/services/settings.actions";
import { getSlotAction } from "@/services/slot.actions";
import { getWATemplateAction } from "@/services/whatsapp.actions";
import { getAnggotaAction } from "@/services/anggota.actions";
import { getSessionProfile } from "@/services/auth.service";
import { KelompokBookingView } from "@/components/kelompok/kelompok-booking-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Booking Sesi - Kelompok",
};

export default async function KelompokBookingPage() {
  const session = await getSessionProfile();
  const kelompokId = await getKelompokIdFromSession();

  if (!kelompokId) {
    redirect("/kelompok/login");
  }

  const kelompokNama = session?.displayName || session?.username || "Kelompok";

  const [bookingList, settings, slotList, templates, allBookings, katingCounts, allAnggota] =
    await Promise.all([
      getBookingAction(kelompokId),
      getSettingsAction(),
      getSlotAction(),
      getWATemplateAction(),
      getAllBookingsForCalendarAction(),
      getKatingCountsAction(),
      getAnggotaAction(),
    ]);

  // Filter anggota milik kelompok ini
  const anggotaList = allAnggota.filter((a) => a.kelompok_id === kelompokId);

  return (
    <KelompokBookingView
      initialBookings={bookingList}
      settings={settings}
      slotList={slotList}
      templates={templates}
      kelompokId={kelompokId}
      kelompokNama={kelompokNama}
      anggotaList={anggotaList}
      allCalendarBookings={allBookings}
      katingCounts={katingCounts}
    />
  );
}

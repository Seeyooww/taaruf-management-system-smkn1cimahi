import { redirect } from "next/navigation";
import { getAnggotaAction } from "@/services/anggota.actions";
import { getSessionProfile } from "@/services/auth.service";
import { getBookingAction } from "@/services/booking.actions";
import { getKelompokAction } from "@/services/kelompok.actions";
import { getSettingsAction } from "@/services/settings.actions";
import { getSlotAction } from "@/services/slot.actions";
import { AdminBookingView } from "@/components/admin/admin-booking-view";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-4">
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <Link href="/kelompok/dashboard">
            <ArrowLeft className="mr-1.5 size-3.5" /> Kembali ke Dashboard Kelompok
          </Link>
        </Button>
      </div>

      <AdminBookingView
        initialBookings={bookingList}
        kelompokList={kelompokList}
        slotList={slotList}
        allAnggotaList={allAnggotaList}
        settings={settings}
        readOnly={true}
      />
    </div>
  );
}

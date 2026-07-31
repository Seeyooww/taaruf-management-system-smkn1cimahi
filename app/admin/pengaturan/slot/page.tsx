import { getSlotAction } from "@/services/slot.actions";
import { SlotView } from "@/components/admin/slot-view";

export const metadata = {
  title: "Slot Waktu - Admin",
};

export default async function AdminSlotPage() {
  const slotList = await getSlotAction();
  return <SlotView initialSlotList={slotList} />;
}

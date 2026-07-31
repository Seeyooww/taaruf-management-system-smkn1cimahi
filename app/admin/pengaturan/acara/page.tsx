import { getSettingsAction } from "@/services/settings.actions";
import { SettingsAcaraView } from "@/components/admin/settings-acara-view";

export const metadata = {
  title: "Pengaturan Acara - Admin",
};

export default async function AdminSettingsAcaraPage() {
  const settings = await getSettingsAction();
  return <SettingsAcaraView initialSettings={settings} />;
}

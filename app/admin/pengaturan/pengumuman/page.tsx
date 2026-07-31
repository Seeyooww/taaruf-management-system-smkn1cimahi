import { getAnnouncementAction } from "@/services/announcement.actions";
import { AnnouncementView } from "@/components/admin/announcement-view";

export const metadata = {
  title: "Pengumuman - Admin",
};

export default async function AdminAnnouncementPage() {
  const announcements = await getAnnouncementAction();
  return <AnnouncementView initialAnnouncements={announcements} />;
}

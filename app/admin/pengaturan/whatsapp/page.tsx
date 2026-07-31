import { getWATemplateAction } from "@/services/whatsapp.actions";
import { WhatsAppView } from "@/components/admin/whatsapp-view";

export const metadata = {
  title: "Template WhatsApp - Admin",
};

export default async function AdminWhatsAppPage() {
  const templates = await getWATemplateAction();
  return <WhatsAppView initialTemplates={templates} />;
}

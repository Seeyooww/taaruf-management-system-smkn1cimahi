import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PanduanView } from "@/components/admin/panduan-view";

export const metadata = {
  title: "Panduan Penggunaan - TMS",
};

export default function AdminPanduanPage() {
  return (
    <div className="space-y-4">
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-1.5 size-3.5" /> Kembali ke Dashboard Admin
          </Link>
        </Button>
      </div>
      <PanduanView />
    </div>
  );
}

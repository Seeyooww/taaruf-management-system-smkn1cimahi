import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PanduanView } from "@/components/admin/panduan-view";

export const metadata = {
  title: "Panduan Kelompok - TMS",
};

export default function KelompokPanduanPage() {
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
      <PanduanView />
    </div>
  );
}

import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="mx-auto size-20 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-xs">
          <FileQuestion className="size-10" />
        </div>

        <div className="space-y-2">
          <Badge text="404 - Halaman Tidak Ditemukan" />
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Maaf, alamat URL yang Anda tuju tidak tersedia atau telah dipindahkan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto text-xs font-semibold">
            <Link href="/admin/dashboard">
              <Home className="mr-2 size-4" /> Dashboard Admin
            </Link>
          </Button>
          <Button asChild size="sm" className="w-full sm:w-auto text-xs font-semibold bg-primary text-primary-foreground">
            <Link href="/kelompok/dashboard">
              <ArrowLeft className="mr-2 size-4" /> Dashboard Kelompok
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
      {text}
    </span>
  );
}

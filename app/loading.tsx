import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton-loader";
import { APP_SHORT_NAME } from "@/lib/constants";

export default function Loading() {
  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Skeleton */}
      <div className="flex items-center justify-between p-6 rounded-2xl border bg-card">
        <div className="space-y-2 w-1/3">
          <div className="h-6 bg-muted/60 rounded-md animate-pulse w-3/4" />
          <div className="h-4 bg-muted/40 rounded-md animate-pulse w-1/2" />
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary font-bold text-lg">
          {APP_SHORT_NAME}
        </div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Main Table Skeleton */}
      <SkeletonTable />
    </div>
  );
}

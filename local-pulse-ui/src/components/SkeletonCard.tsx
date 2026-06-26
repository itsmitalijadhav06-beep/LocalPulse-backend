import { cn } from "@/lib/utils";

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card border rounded-2xl overflow-hidden animate-pulse", className)}>
      <div className="aspect-[16/9] bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}

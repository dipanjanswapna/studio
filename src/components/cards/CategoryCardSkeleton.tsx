import { Skeleton } from "@/components/ui/skeleton";

export function CategoryCardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-muted/50 w-full h-full min-h-[80px]">
        <div className="flex items-center justify-between h-full">
            <Skeleton className="h-6 w-3/5" />
            <Skeleton className="h-10 w-10 rounded-full" />
        </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    // Replicating the structure and spacing of CompactProductCard for layout stability (CLS)
    <div className="group relative bg-card border rounded-lg p-2 flex flex-col h-full">
      {/* 1. Media Layer */}
      <Skeleton className="relative aspect-square overflow-hidden rounded-md" />
      
      {/* 2. Info & Pricing Layer */}
      <div className="mt-2 flex-grow flex flex-col">
        {/* Name skeleton */}
        <div className="min-h-[32px] space-y-1.5">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>
        
        <div className="flex-grow"></div>

        {/* Price skeleton */}
        <div className="mt-1 flex items-center justify-between">
            <div className="flex flex-col space-y-1">
                <Skeleton className="h-5 w-16 rounded" /> {/* Discounted price */}
                <Skeleton className="h-3 w-12 rounded" /> {/* Original price */}
            </div>
            <Skeleton className="h-4 w-10 rounded" /> {/* Rating */}
        </div>
      </div>

      {/* 3. Action Layer */}
      <div className="mt-2">
        <Skeleton className="h-8 w-full rounded" />
      </div>
    </div>
  );
}

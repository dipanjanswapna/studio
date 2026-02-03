import { Skeleton } from "@/components/ui/skeleton";

export function ProductPageSkeleton() {
  return (
    <div className="container py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Image Gallery Skeleton */}
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="grid grid-cols-5 gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-md" />
            ))}
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-20" />
          </div>
          
          <Skeleton className="h-8 w-48" />

          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          
          <div className="border-b my-2"></div>

          <div className="pt-2 space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-24 rounded-md" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-24 rounded-md" />
              </div>
            </div>
          </div>

          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

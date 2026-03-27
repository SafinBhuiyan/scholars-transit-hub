import { Skeleton } from "@/components/ui/skeleton"

export function AdminCardGridSkeleton({
  cards = 6,
  previewAspect = "aspect-square",
}: {
  cards?: number
  previewAspect?: string
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: cards }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm"
        >
          <div className="p-4">
            <Skeleton className={`w-full rounded-xl ${previewAspect}`} />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-2/3 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
              <div className="grid gap-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                <Skeleton className="h-3 w-1/3 rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border/40 bg-muted/10 p-3">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

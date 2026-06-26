"use client"

import * as React from "react"
import { IconFile } from "@tabler/icons-react"
import { Skeleton } from "@/components/ui/skeleton"

export function PdfPreview({
  fileUrl,
  format,
  compact = false,
}: {
  fileUrl: string
  format: string
  compact?: boolean
}) {
  const [hasError, setHasError] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  // Cloudinary has a built-in feature to convert PDFs to images on the fly.
  // We simply change the .pdf extension to .jpg to get a preview of the first page!
  const isCloudinary = fileUrl.includes("res.cloudinary.com")
  
  // Extract URL without query params to safely replace extension, then re-append query params
  const urlWithoutParams = fileUrl.split('?')[0]
  const queryParams = fileUrl.includes('?') ? `?${fileUrl.split('?')[1]}` : ''
  const previewUrl = isCloudinary 
    ? `${urlWithoutParams.replace(/\.pdf$/i, ".jpg")}${queryParams}`
    : null

  React.useEffect(() => {
    setHasError(false)
    setIsLoading(true)
  }, [fileUrl])

  return (
    <div className="rounded-xl bg-muted/20 p-1.5">
      <div
        className={`flex w-full overflow-hidden rounded-lg bg-background ${
          compact
            ? "h-40 items-start sm:h-44"
            : "aspect-[210/297] items-center"
        }`}
      >
        {isCloudinary && !hasError ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            )}
            <img
              src={previewUrl!}
              alt="PDF Preview"
              className="w-full h-full object-contain"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false)
                setHasError(true)
              }}
            />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-background p-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <IconFile className="h-4 w-4 text-destructive" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Preview unavailable</p>
              <p className="text-xs text-muted-foreground">{format.toUpperCase()} file</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

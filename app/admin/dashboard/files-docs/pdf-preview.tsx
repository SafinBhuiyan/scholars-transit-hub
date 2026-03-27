"use client"

import * as React from "react"
import { IconFile } from "@tabler/icons-react"
import { Document, Page, pdfjs } from "react-pdf"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

export function PdfPreview({ fileUrl, format }: { fileUrl: string; format: string }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [pageWidth, setPageWidth] = React.useState(0)
  const [shouldRender, setShouldRender] = React.useState(false)
  const [isDocumentLoading, setIsDocumentLoading] = React.useState(true)

  React.useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const updateWidth = () => {
      setPageWidth(Math.max(160, Math.floor(node.clientWidth + 4)))
    }

    updateWidth()

    const observer = new ResizeObserver(() => updateWidth())
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldRender(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: "300px",
      }
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    setIsDocumentLoading(true)
  }, [fileUrl])

  return (
    <div className="rounded-xl bg-muted/20 p-1.5">
      <div
        ref={containerRef}
        className="flex aspect-210/297 w-full items-center justify-center overflow-hidden rounded-lg bg-background [&_.react-pdf__Document]:flex [&_.react-pdf__Document]:h-full [&_.react-pdf__Document]:w-full [&_.react-pdf__Page]:flex [&_.react-pdf__Page]:h-full [&_.react-pdf__Page]:w-full [&_.react-pdf__Page]:items-center [&_.react-pdf__Page]:justify-center [&_.react-pdf__Page__canvas]:h-auto [&_.react-pdf__Page__canvas]:max-h-full [&_.react-pdf__Page__canvas]:w-auto [&_.react-pdf__Page__canvas]:max-w-full"
      >
        {!shouldRender || pageWidth === 0 ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={() => setIsDocumentLoading(false)}
            onLoadError={() => setIsDocumentLoading(false)}
            loading={
              <div className="flex h-full w-full items-center justify-center">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            }
            error={
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-background p-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
                  <IconFile className="h-4 w-4 text-destructive" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Preview unavailable</p>
                  <p className="text-xs text-muted-foreground">{format.toUpperCase()} file</p>
                </div>
              </div>
            }
            className="relative flex h-full w-full items-center justify-center bg-background"
          >
            {isDocumentLoading ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
                <Spinner className="h-4 w-4 text-muted-foreground" />
              </div>
            ) : null}
            <Page
              pageNumber={1}
              width={pageWidth}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              loading={
                <div className="flex h-full w-full items-center justify-center">
                  <Spinner className="h-4 w-4 text-muted-foreground" />
                </div>
              }
            />
          </Document>
        )}
      </div>
    </div>
  )
}

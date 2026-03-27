"use client"

import * as React from "react"
import Image from "next/image"
import { IconSearch, IconDownload, IconEye } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { AdminCardGridSkeleton } from "@/components/admin/admin-card-grid-skeleton"

interface ImageItem {
  id: string
  url: string
  format: string
  createdAt: string
  applicantName: string
  applicantType: "STUDENT" | "ACADEMIC" | "ADMINISTRATIVE"
  studentId: string | null
  department: string
  fileName: string
}

const applicantTypeLabels: Record<ImageItem["applicantType"], string> = {
  STUDENT: "Student",
  ACADEMIC: "Academic Staff",
  ADMINISTRATIVE: "Administrative Staff",
}

export default function GalleryPage() {
  const [images, setImages] = React.useState<ImageItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedImage, setSelectedImage] = React.useState<ImageItem | null>(null)

  const fetchImages = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/images")
      const data = await response.json()

      if (response.ok) {
        setImages(data.images)
      } else {
        toast.error(data.error || "Failed to load images")
      }
    } catch {
      toast.error("Failed to load images")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchImages()
  }, [])

  const filteredImages = images.filter((img) => {
    const query = searchQuery.toLowerCase()
    return (
      img.applicantName.toLowerCase().includes(query) ||
      img.department.toLowerCase().includes(query) ||
      (img.studentId || "").toLowerCase().includes(query) ||
      img.fileName.toLowerCase().includes(query)
    )
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">ID Cards</h1>
        <p className="text-muted-foreground">
          View ID card images submitted through transport applications
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xl">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, student ID, department, or file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={fetchImages} className="sm:w-auto">
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <AdminCardGridSkeleton cards={6} />
      ) : filteredImages.length === 0 ? (
        <Card>
          <CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No images found
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filteredImages.map((image) => (
            <Card
              key={image.id}
              className="group cursor-pointer overflow-hidden border-border/60 bg-card shadow-sm transition-all hover:border-primary/20 hover:bg-muted/10 hover:shadow-xl hover:shadow-primary/5"
              onClick={() => setSelectedImage(image)}
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={image.url}
                  alt={image.applicantName}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300"
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start bg-foreground/25 px-3 py-2">
                  <Badge variant="secondary" className="h-6 max-w-[65%] border-0 bg-background/90 px-2 text-[10px] font-semibold text-foreground">
                    <span className="truncate">{image.department}</span>
                  </Badge>
                </div>
              </div>
              <CardContent className="space-y-3 p-4">
                <div className="space-y-1">
                  <p className="line-clamp-1 text-sm font-semibold text-foreground">
                    {image.applicantName}
                  </p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {applicantTypeLabels[image.applicantType]}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-2.5 py-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Student ID
                    </p>
                    <p className="truncate text-xs font-medium text-foreground">
                      {image.studentId || "Not provided"}
                    </p>
                  </div>
                  <Badge variant="outline" className="h-6 shrink-0 px-2 text-[10px] uppercase">
                    {image.format}
                  </Badge>
                </div>
                <div className="text-[11px] font-medium text-foreground/80">
                  {formatDate(image.createdAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>
              {selectedImage?.applicantName}
            </DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-lg bg-muted">
                <div className="relative h-[60vh] w-full">
                  <Skeleton className="absolute inset-0" />
                  <Image
                    src={selectedImage.url}
                    alt={selectedImage.applicantName}
                    fill
                    sizes="100vw"
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Student ID</p>
                  <p className="font-medium">{selectedImage.studentId || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">{selectedImage.department}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">File Type</p>
                  <p className="font-medium uppercase">{selectedImage.format}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-medium">{formatDate(selectedImage.createdAt)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(selectedImage.url, "_blank")}
                >
                  <IconEye className="h-4 w-4 mr-2" />
                  View Full Size
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const link = document.createElement("a")
                    link.href = selectedImage.url
                    link.download = selectedImage.fileName || "image"
                    link.click()
                  }}
                >
                  <IconDownload className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

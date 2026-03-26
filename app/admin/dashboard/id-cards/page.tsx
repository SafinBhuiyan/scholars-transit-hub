"use client"

import * as React from "react"
import Image from "next/image"
import { IconSearch, IconDownload, IconEye, IconLoader } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

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
    } catch (error) {
      console.error("Failed to fetch images:", error)
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
    <div className="flex flex-1 flex-col gap-4">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ID Cards</h1>
          <p className="text-xs text-muted-foreground">
            View ID card images submitted through transport applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchImages}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by name, student ID, department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <IconLoader className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No images found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredImages.map((image) => (
            <Card
              key={image.id}
              className="group overflow-hidden cursor-pointer border-border/60 bg-card/80 transition-all group-hover:bg-muted/10 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
              onClick={() => setSelectedImage(image)}
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={image.url}
                  alt={image.applicantName}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition-transform duration-300"
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start bg-black/25 px-3 py-2">
                  <Badge variant="secondary" className="h-6 max-w-[65%] border-0 bg-white/90 px-2 text-[10px] font-semibold text-slate-700">
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

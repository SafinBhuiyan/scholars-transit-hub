"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  IconUpload,
  IconDownload,
  IconEye,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { AdminCardGridSkeleton } from "@/components/admin/admin-card-grid-skeleton"
import { Spinner } from "@/components/ui/spinner"

interface FileItem {
  id: string
  fileName?: string
  originalName?: string
  publicId: string
  url: string
  format: string
  bytes: number
  createdAt: string
  category: string
  uploadedBy?: string
}

interface CategoryItem {
  id: string
  name: string
}

const PdfPreview = dynamic(() => import("./pdf-preview").then((mod) => mod.PdfPreview), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl bg-muted/20 p-1.5">
      <div className="aspect-[210/297] w-full rounded-lg bg-background">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  ),
})

export default function FilesDocsPage() {
  const [files, setFiles] = React.useState<FileItem[]>([])
  const [categories, setCategories] = React.useState<CategoryItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedCategory, setSelectedCategory] = React.useState("All")
  
  // Upload dialog state
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadFile, setUploadFile] = React.useState<File | null>(null)
  const [uploadCategory, setUploadCategory] = React.useState("")

  // Preview dialog state
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<FileItem | null>(null)

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [fileToDelete, setFileToDelete] = React.useState<string | null>(null)

  const fetchCategories = React.useCallback(async () => {
    try {
      const response = await fetch("/api/admin/files-doc-categories")
      const data = await response.json()

      if (response.ok) {
        setCategories(data)
      } else {
        toast.error(data.error || "Failed to load categories")
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      toast.error("Failed to load categories")
    }
  }, [])
  
  const fetchFiles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/files-docs")
      const data = await response.json()

      if (response.ok) {
        setFiles(data.files)
      } else {
        toast.error(data.error || "Failed to load files")
      }
    } catch (error) {
      console.error("Failed to fetch files:", error)
      toast.error("Failed to load files")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchCategories()
    fetchFiles()
  }, [fetchCategories])

  React.useEffect(() => {
    if (!categories.length) return

    const nextCategory = categories[0]?.name || ""

    setUploadCategory((current) =>
      current && categories.some((category) => category.name === current) ? current : nextCategory
    )

    setSelectedCategory((current) =>
      current === "All" || categories.some((category) => category.name === current) ? current : "All"
    )
  }, [categories])

  const categoryCounts = React.useMemo(() => {
    const counts = new Map<string, number>()

    for (const file of files) {
      counts.set(file.category, (counts.get(file.category) || 0) + 1)
    }

    return counts
  }, [files])

  const filteredFiles = files.filter((file) => selectedCategory === "All" || file.category === selectedCategory)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are allowed")
        e.target.value = ""
        return
      }

      setUploadFile(file)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error("Please select a file")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", uploadFile)
      formData.append("category", uploadCategory)

      const response = await fetch("/api/admin/files-docs", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("File uploaded successfully")
        setIsUploadOpen(false)
        setUploadFile(null)
        setUploadCategory(categories[0]?.name || "")
        fetchFiles()
      } else {
        toast.error(data.error || "Failed to upload file")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload file")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!fileToDelete) return
    try {
      const response = await fetch(`/api/admin/files-docs?publicId=${encodeURIComponent(fileToDelete)}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("File deleted successfully")
        fetchFiles()
      } else {
        toast.error(data.error || "Failed to delete file")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete file")
    } finally {
      setIsDeleteDialogOpen(false)
      setFileToDelete(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Files & Docs</h1>
        <p className="text-muted-foreground">
          Manage official documents, policies, and files
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full sm:w-fit overflow-hidden">
          <TabsList className="bg-muted/50 p-1 w-full flex overflow-x-auto justify-start sm:justify-center no-scrollbar">
            {["All", ...categories.map((category) => category.name)].map((category) => (
              <TabsTrigger key={category} value={category} className="gap-2 shrink-0">
                {category}
                <Badge
                  variant={selectedCategory === category ? "secondary" : "outline"}
                  className="h-5 min-w-[20px] px-1 text-[10px]"
                >
                  {category === "All" ? files.length : categoryCounts.get(category) || 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Button className="w-full sm:w-fit shrink-0 shadow-lg shadow-primary/20" onClick={() => setIsUploadOpen(true)}>
          <IconUpload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </div>

      {isLoading ? (
        <AdminCardGridSkeleton cards={6} previewAspect="aspect-[210/297]" />
      ) : filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No files found
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filteredFiles.map((file) => {
            const fileName = file.originalName || file.fileName || file.publicId.split("/").pop() || "Untitled file"

            return (
              <div
                key={file.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="relative">
                    <Badge
                      variant="secondary"
                      className="absolute left-3 top-3 z-10 border-transparent bg-background/90 text-[10px] uppercase tracking-[0.18em] text-foreground/80 shadow-sm backdrop-blur"
                    >
                      {file.category}
                    </Badge>


                    <PdfPreview fileUrl={file.url} format={file.format} />
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-2">
                    <div className="space-y-1">
                      <h3
                        className="line-clamp-1 text-[13px] font-bold leading-snug transition-colors group-hover:text-primary sm:text-sm"
                        title={fileName}
                      >
                        {fileName}
                      </h3>
                      <p className="line-clamp-1 text-[11px] text-muted-foreground/70">PDF document</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/5 border-t border-border/30 flex items-center justify-between gap-2 opacity-100 group-hover:bg-muted/20 transition-colors">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] gap-1 px-2 border-border/40 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-sm bg-background/50"
                    onClick={() => {
                      setSelectedFile(file)
                      setIsPreviewOpen(true)
                    }}
                  >
                    <IconEye className="h-3 w-3" /> View
                  </Button>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-md border-border/40 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-sm bg-background/50"
                      onClick={() => window.open(file.url, "_blank")}
                    >
                      <IconDownload className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-md border-border/40 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all shadow-sm bg-background/50"
                      onClick={() => {
                        setFileToDelete(file.publicId)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <IconTrash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Cloud storage destination</p>
                <p className="text-xs text-muted-foreground">
                  Secured by Cloudinary and organized in the folder above.
                </p>
              </div>
              <img
                src="https://cloudinary-marketing-res.cloudinary.com/image/upload/fl_preserve_transparency/v1652806224/cloudinary_logo_blue_0720_svg.jpg"
                alt="Cloudinary logo"
                className="h-6 w-auto shrink-0 object-contain"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {uploadFile ? (
                  <div className="flex items-start justify-between gap-3 text-left">
                    <span className="min-w-0 break-words text-base leading-6 text-foreground">
                      {uploadFile.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => setUploadFile(null)}
                    >
                      <IconX className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <IconUpload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload PDF
                      </span>
                    </div>
                    <input
                      id="file"
                      type="file"
                      className="hidden"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                PDF only. Maximum file size: 10MB
              </p>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!uploadFile || isUploading}>
              {isUploading ? (
                <>
                  <Spinner className="mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <IconUpload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl w-[90vw] max-h-[90vh] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedFile?.originalName || selectedFile?.fileName || "Preview"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-lg bg-muted/20 flex items-center justify-center">
            <div className="w-full max-w-[210mm] aspect-[210/297]">
            {selectedFile && (
              <PdfPreview fileUrl={selectedFile.url} format={selectedFile.format} />
            )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => selectedFile && window.open(selectedFile.url, "_blank")}>
              <IconDownload className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

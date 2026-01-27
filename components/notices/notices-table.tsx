"use client"

import * as React from "react"
import {
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconLoader,
  IconPlus,
  IconTrash,
  IconPinned,
  IconEye,
  IconUsers,
  IconCalendar,
  IconCircleCheck,
  IconAlertTriangle,
  IconInfoCircle,
  IconAlertCircle,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { NoticeDialog } from "./notice-dialog"
import { NoticeViewDialog } from "./notice-view-dialog"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export function NoticesTable({ data }: { data: any[] }) {
  const [activeTab, setActiveTab] = React.useState("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 8

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isViewOpen, setIsViewOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [selectedNotice, setSelectedNotice] = React.useState<any>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  
  const router = useRouter()

  const counts = React.useMemo(() => {
    const now = new Date()
    return {
      all: data.length,
      published: data.filter(n => n.isPublished && (!n.expiryDate || new Date(n.expiryDate) > now)).length,
      draft: data.filter(n => !n.isPublished).length,
      expired: data.filter(n => n.expiryDate && new Date(n.expiryDate) < now).length,
      pinned: data.filter(n => n.isPinned).length,
    }
  }, [data])

  const filteredData = React.useMemo(() => {
    let result = [...data]
    const now = new Date()
    
    // Status Filter
    if (activeTab === "published") result = result.filter(n => n.isPublished && (!n.expiryDate || new Date(n.expiryDate) > now))
    if (activeTab === "draft") result = result.filter(n => !n.isPublished)
    if (activeTab === "expired") result = result.filter(n => n.expiryDate && new Date(n.expiryDate) < now)
    if (activeTab === "pinned") result = result.filter(n => n.isPinned)
    
    return result
  }, [data, activeTab])

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage])

  const totalPages = Math.ceil(filteredData.length / pageSize)

  const handleDelete = async () => {
    if (!selectedNotice) return
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/notices/${selectedNotice.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Notice deleted")
        router.refresh()
      } else {
        throw new Error()
      }
    } catch (error) {
      toast.error("Failed to delete notice")
    } finally {
      setIsProcessing(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const getTypeIcon = (t: string) => {
    switch(t) {
        case "INFO": return <IconInfoCircle className="h-5 w-5 text-blue-500" />
        case "WARNING": return <IconAlertTriangle className="h-5 w-5 text-orange-500" />
        case "SUCCESS": return <IconCircleCheck className="h-5 w-5 text-green-500" />
        case "DANGER": return <IconAlertCircle className="h-5 w-5 text-red-500" />
        default: return <IconInfoCircle className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={(val) => {
            setActiveTab(val)
            setCurrentPage(1)
        }} className="w-full sm:w-fit overflow-hidden">
            <TabsList className="bg-muted/50 p-1 w-full flex overflow-x-auto justify-start sm:justify-center no-scrollbar">
                <TabsTrigger value="all" className="gap-2 shrink-0">
                    All <Badge variant="secondary" className="h-5 min-w-[20px] px-1 text-[10px] text-muted-foreground">{counts.all}</Badge>
                </TabsTrigger>
                <TabsTrigger value="published" className="gap-2 shrink-0">
                    Published <Badge variant="secondary" className="h-5 min-w-[20px] px-1 text-[10px] text-muted-foreground">{counts.published}</Badge>
                </TabsTrigger>
                <TabsTrigger value="draft" className="gap-2 shrink-0">
                    Draft <Badge variant="secondary" className="h-5 min-w-[20px] px-1 text-[10px] text-muted-foreground">{counts.draft}</Badge>
                </TabsTrigger>
                <TabsTrigger value="expired" className="gap-2 shrink-0">
                    Expired <Badge variant="secondary" className="h-5 min-w-[20px] px-1 text-[10px] text-muted-foreground">{counts.expired}</Badge>
                </TabsTrigger>
                <TabsTrigger value="pinned" className="gap-2 shrink-0 text-primary">
                    Pinned <Badge variant="outline" className="h-5 min-w-[20px] px-1 text-[10px] border-primary/30 text-primary">{counts.pinned}</Badge>
                </TabsTrigger>
            </TabsList>
        </Tabs>
        <Button 
            className="w-full sm:w-fit shadow-lg shadow-primary/20 shrink-0"
            onClick={() => {
                setSelectedNotice(null)
                setIsDialogOpen(true)
            }}
        >
          <IconPlus className="mr-2 h-4 w-4" /> Create Notice
        </Button>
      </div>

      {/* Grid Layout (Cards) */}
      {paginatedData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedData.map((notice) => {
                const expired = notice.expiryDate && new Date(notice.expiryDate) < new Date()
                return (
                    <div 
                        key={notice.id} 
                        className="group relative flex flex-col bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
                    >
                        {/* Upper Section */}
                        <div className="p-4 space-y-3 flex-1">
                            <div className="flex items-start justify-between">
                                <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-primary/10 transition-colors">
                                    {getTypeIcon(notice.type)}
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    {notice.isPinned && (
                                        <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center rounded-full border-primary/30 text-primary bg-primary/5">
                                            <IconPinned className="h-3.5 w-3.5 fill-primary" />
                                        </Badge>
                                    )}
                                    {expired ? (
                                        <Badge variant="destructive" className="text-[10px] px-1.5 h-5">Expired</Badge>
                                    ) : (
                                        <Badge variant={notice.isPublished ? "default" : "secondary"} className="text-[10px] px-1.5 h-5">
                                            {notice.isPublished ? "Live" : "Draft"}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-bold text-sm line-clamp-1 leading-tight group-hover:text-primary transition-colors">
                                    {notice.title}
                                </h3>
                                <p className="text-[11px] text-muted-foreground/80 line-clamp-2 leading-relaxed h-7">
                                    {notice.content}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-1.5 pt-1">
                                <Badge variant="secondary" className="h-5 bg-muted/40 text-[9px] gap-1 px-1.5 border-transparent">
                                    <IconUsers className="h-2.5 w-2.5" /> {notice.target}
                                </Badge>
                                <Badge variant="outline" className="h-5 text-[9px] gap-1 px-1.5 border-border/50 font-normal">
                                    <IconCalendar className="h-2.5 w-2.5 opacity-60" /> {new Date(notice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </Badge>
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="p-3 bg-muted/5 border-t border-border/30 flex items-center justify-between gap-2 opacity-100 group-hover:bg-muted/20 transition-colors">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-[11px] gap-1 px-2 hover:bg-primary/10 hover:text-primary"
                                onClick={() => {
                                    setSelectedNotice(notice)
                                    setIsViewOpen(true)
                                }}
                            >
                                <IconEye className="h-3 w-3" /> View
                            </Button>
                            <div className="flex items-center gap-1">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 rounded-md hover:bg-primary/10 hover:text-primary"
                                    onClick={() => {
                                        setSelectedNotice(notice)
                                        setIsDialogOpen(true)
                                    }}
                                >
                                    <IconEdit className="h-3 w-3" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => {
                                        setSelectedNotice(notice)
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
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-card border border-dashed rounded-3xl opacity-60">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <IconInfoCircle className="h-6 w-6 opacity-20" />
            </div>
            <p className="text-sm font-medium">No notices found</p>
            <p className="text-xs text-muted-foreground mt-1 text-center max-w-[200px]">There are no notices in this category yet.</p>
        </div>
      )}

      {/* Pagination Container */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
            <p className="text-xs text-muted-foreground">
                Showing <span className="text-foreground font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-foreground font-medium">{Math.min(currentPage * pageSize, filteredData.length)}</span> of <span className="text-foreground font-medium">{filteredData.length}</span>
            </p>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                >
                    <IconChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                        <Button
                            key={i}
                            variant={currentPage === i + 1 ? "default" : "ghost"}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setCurrentPage(i + 1)}
                        >
                            {i + 1}
                        </Button>
                    ))}
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                >
                    <IconChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
      )}

      <NoticeDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        onSuccess={() => router.refresh()}
        notice={selectedNotice}
      />

      <NoticeViewDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        notice={selectedNotice}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the notice <span className="font-bold text-foreground">"{selectedNotice?.title}"</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing} className="border-none hover:bg-muted font-medium">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20 border-none"
            >
              {isProcessing && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

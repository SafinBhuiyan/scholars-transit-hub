"use client"

import * as React from "react"
import {
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconUsers,
  IconCalendar,
  IconCircleCheck,
  IconAlertTriangle,
  IconInfoCircle,
  IconAlertCircle,
  IconPinned,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NoticeViewDialog } from "./notice-view-dialog"
import { cn, formatDateShort } from "@/lib/utils"

export function UserNoticesList({ data }: { data: any[] }) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 8

  const [isViewOpen, setIsViewOpen] = React.useState(false)
  const [selectedNotice, setSelectedNotice] = React.useState<any>(null)

  const pinnedData = React.useMemo(() => {
    return [...data].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return 0
    })
  }, [data])

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return pinnedData.slice(start, start + pageSize)
  }, [pinnedData, currentPage])

  const totalPages = Math.ceil(data.length / pageSize)

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
      {/* Grid Layout (Cards) */}
      {paginatedData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginatedData.map((notice) => (
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
                  <div className="flex items-center gap-2">
                    {notice.isPinned && (
                      <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center rounded-full border-primary/30 text-primary bg-primary/5">
                        <IconPinned className="h-3.5 w-3.5 fill-primary" />
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-bold text-[13px] sm:text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {notice.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground/80 line-clamp-2 leading-relaxed min-h-[2.2rem]">
                    {notice.content}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="secondary" className="h-5 bg-muted/40 text-[9px] gap-1 px-1.5 border-transparent">
                    <IconUsers className="h-2.5 w-2.5" /> {notice.target}
                  </Badge>
                  <Badge variant="outline" className="h-5 text-[9px] gap-1 px-1.5 border-border/50 font-normal">
                    <IconCalendar className="h-2.5 w-2.5 opacity-60" /> {formatDateShort(notice.createdAt)}
                  </Badge>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-muted/5 border-t border-border/30 flex items-center justify-between gap-2 opacity-100 group-hover:bg-muted/20 transition-colors">
                <span className="text-xs text-muted-foreground">
                  {notice.createdBy?.name || 'Admin'}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-[11px] gap-1 px-2 border-border/40 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-sm bg-background/50"
                  onClick={() => {
                    setSelectedNotice(notice)
                    setIsViewOpen(true)
                  }}
                >
                  <IconEye className="h-3 w-3" /> View
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-card border border-dashed rounded-3xl opacity-60">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <IconInfoCircle className="h-6 w-6 opacity-20" />
          </div>
          <p className="text-sm font-medium">No notices available</p>
          <p className="text-xs text-muted-foreground mt-1 text-center max-w-[200px]">There are no notices at this time.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-muted-foreground">
            Showing <span className="text-foreground font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-foreground font-medium">{Math.min(currentPage * pageSize, data.length)}</span> of <span className="text-foreground font-medium">{data.length}</span>
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

      <NoticeViewDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        notice={selectedNotice}
      />
    </div>
  )
}

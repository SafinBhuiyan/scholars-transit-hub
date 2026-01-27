"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  IconInfoCircle, 
  IconAlertTriangle, 
  IconCircleCheck, 
  IconAlertCircle,
  IconUsers,
  IconCalendar,
  IconEye
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface NoticeViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notice: any
}

export function NoticeViewDialog({ open, onOpenChange, notice }: NoticeViewDialogProps) {
  if (!notice) return null

  const getTypeIcon = (t: string) => {
    switch(t) {
        case "INFO": return <IconInfoCircle className="h-5 w-5 text-blue-500" />
        case "WARNING": return <IconAlertTriangle className="h-5 w-5 text-orange-500" />
        case "SUCCESS": return <IconCircleCheck className="h-5 w-5 text-green-500" />
        case "DANGER": return <IconAlertCircle className="h-5 w-5 text-red-500" />
        default: return <IconInfoCircle className="h-5 w-5" />
    }
  }

  const getStatusBadge = () => {
    const published = notice.isPublished
    const expired = notice.expiryDate && new Date(notice.expiryDate).setHours(23, 59, 59, 999) < new Date().getTime()
    
    if (expired) return <Badge variant="destructive">Expired</Badge>
    return (
      <Badge variant={published ? "default" : "secondary"}>
        {published ? "Published" : "Draft"}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] gap-0 p-0 overflow-hidden shadow-2xl border-none">
        <div className="bg-primary/5 p-6 border-b">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-background rounded-lg shadow-sm">
                    {getTypeIcon(notice.type)}
                </div>
                <div>
                   <DialogTitle className="text-xl font-bold">{notice.title}</DialogTitle>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
                {getStatusBadge()}
                <Badge variant="outline" className="gap-1 border-primary/20 text-primary uppercase text-[10px]">
                    <IconUsers className="h-3 w-3" /> {notice.target}
                </Badge>
                {notice.expiryDate && (
                    <Badge variant="outline" className="gap-1 text-muted-foreground uppercase text-[10px]">
                        <IconCalendar className="h-3 w-3" /> {new Date(notice.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Badge>
                )}
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 max-h-[50vh] overflow-y-auto bg-background/50 backdrop-blur-sm">
          <div className="prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
              {notice.content}
            </p>
          </div>
        </div>

        <div className="p-6 border-t bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-[11px] text-muted-foreground italic">
                Created by {notice.createdBy?.name || "System"} on {new Date(notice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close Preview
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

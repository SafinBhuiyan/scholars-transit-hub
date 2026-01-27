"use client"

import * as React from "react"
import { 
  IconBell, 
  IconInfoCircle, 
  IconAlertTriangle, 
  IconCircleCheck, 
  IconAlertCircle, 
  IconPinned,
  IconCircleFilled
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"

export function NotificationBell() {
  const { data: session } = authClient.useSession()
  const [notices, setNotices] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const noticesPath = React.useMemo(() => {
    if (session?.user?.role === "ADMIN") return "/admin/dashboard/notices"
    if (session?.user?.role === "SUPERVISOR") return "/supervisor/dashboard/notices"
    return "/dashboard/notices"
  }, [session?.user?.role])

  const unreadCount = notices.filter(n => !n.isRead).length

  const fetchNotices = async () => {
    try {
      const res = await fetch("/api/notices")
      if (res.ok) {
        const data = await res.json()
        setNotices(data)
      }
    } catch (error) {
      console.error("Failed to fetch notifications")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchNotices()
    // Optional: Polling every 5 minutes
    const interval = setInterval(fetchNotices, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notices/${id}/read`, { method: "POST" })
      if (res.ok) {
        setNotices(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      }
    } catch (error) {
      console.error("Failed to mark as read")
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "INFO": return <IconInfoCircle className="h-4 w-4 text-blue-500" />
      case "WARNING": return <IconAlertTriangle className="h-4 w-4 text-orange-500" />
      case "SUCCESS": return <IconCircleCheck className="h-4 w-4 text-green-500" />
      case "DANGER": return <IconAlertCircle className="h-4 w-4 text-red-500" />
      default: return <IconInfoCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) fetchNotices() }}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-8 w-8">
          <IconBell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-in zoom-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <DropdownMenuLabel className="p-4 flex items-center justify-between">
          <span className="font-bold">Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-[10px] h-5">
              {unreadCount} Unread
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notices.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            notices.map((notice) => (
              <div 
                key={notice.id} 
                className={cn(
                  "flex flex-col gap-1 p-4 transition-colors hover:bg-muted/50 cursor-pointer relative",
                  !notice.isRead && "bg-muted/20"
                )}
                onClick={() => markAsRead(notice.id)}
              >
                {!notice.isRead && (
                    <IconCircleFilled className="absolute top-4 right-4 h-2 w-2 text-primary" />
                )}
                <div className="flex items-center gap-2">
                  {getTypeIcon(notice.type)}
                  <span className={cn("text-sm font-semibold leading-none", !notice.isRead && "text-foreground")}>
                    {notice.title}
                  </span>
                  {notice.isPinned && <IconPinned className="h-3 w-3 text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {notice.content}
                </p>
                <span className="text-[10px] text-muted-foreground mt-1">
                    {new Date(notice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(notice.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>
            ))
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-3 bg-muted/20 border-t">
            <Link href={noticesPath} className="block w-full">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold shadow-sm hover:bg-background">
                    View all notices
                </Button>
            </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

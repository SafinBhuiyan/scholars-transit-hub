"use client"

import * as React from "react"
import { IconBell, IconCircleFilled } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, formatDateShort } from "@/lib/utils"

type Notification = {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [pendingReadId, setPendingReadId] = React.useState<string | null>(null)

  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" })
      if (!response.ok) return

      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch {
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchNotifications()

    const interval = setInterval(fetchNotifications, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (notification: Notification) => {
    if (notification.isRead || pendingReadId) return

    setPendingReadId(notification.id)
    try {
      const response = await fetch(`/api/notifications/${notification.id}/read`, {
        method: "PATCH",
      })

      if (!response.ok) return

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item
        )
      )
    } catch {
    } finally {
      setPendingReadId(null)
    }
  }

  const formatTimestamp = (createdAt: string) => {
    const date = new Date(createdAt)
    return `${formatDateShort(date)} ${date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })}`
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) return
        setIsLoading(true)
        fetchNotifications()
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-8 w-8">
          <IconBell className="h-4 w-4" />
          <span className="sr-only">Open notifications</span>
          {unreadCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <DropdownMenuLabel className="flex items-center justify-between p-4">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 ? (
            <Badge variant="secondary" className="h-5 text-[10px]">
              {unreadCount} unread
            </Badge>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-[380px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className={cn(
                  "relative flex w-full flex-col gap-1 border-b border-border/60 p-4 text-left transition-colors hover:bg-muted/50",
                  !notification.isRead && "bg-muted/20"
                )}
                onClick={() => markAsRead(notification)}
              >
                {!notification.isRead ? (
                  <IconCircleFilled className="absolute right-4 top-4 h-2 w-2 text-primary" />
                ) : null}

                <div className="flex items-center gap-2 pr-4">
                  <span className="text-sm font-medium">{notification.title}</span>
                  {!notification.isRead ? (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                      New
                    </Badge>
                  ) : null}
                </div>

                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {notification.message}
                </p>

                <span className="mt-1 text-[10px] text-muted-foreground">
                  {formatTimestamp(notification.createdAt)}
                </span>

                {pendingReadId === notification.id ? (
                  <span className="text-[10px] text-muted-foreground">Marking as read...</span>
                ) : null}
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

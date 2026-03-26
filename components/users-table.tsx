"use client"

import * as React from "react"
import { IconClock, IconFilter, IconLoader, IconSearch } from "@tabler/icons-react"
import { z } from "zod"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { toast } from "sonner"

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  image: z.string().nullable().optional(),
  role: z.enum(["ADMIN", "USER", "BANNED"]),
  joinDate: z.string(),
})

export type User = z.infer<typeof userSchema>

type UsersResponse = {
  users: User[]
  hasMore: boolean
  nextOffset: number
}

export function UsersTable() {
  const [users, setUsers] = React.useState<User[]>([])
  const [query, setQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<"ALL" | User["role"]>("ALL")
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(true)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [targetUser, setTargetUser] = React.useState<User | null>(null)
  const [targetRole, setTargetRole] = React.useState<User["role"] | null>(null)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const searchRef = React.useRef<HTMLInputElement>(null)
  const sentinelRef = React.useRef<HTMLDivElement | null>(null)
  const usersRef = React.useRef<User[]>([])
  const loadingRef = React.useRef(false)
  const hasMoreRef = React.useRef(true)
  const requestIdRef = React.useRef(0)

  React.useEffect(() => {
    usersRef.current = users
  }, [users])

  React.useEffect(() => {
    loadingRef.current = isLoading
  }, [isLoading])

  React.useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  const loadUsers = React.useCallback(
    async ({ reset = false }: { reset?: boolean } = {}) => {
      if (!reset && (loadingRef.current || !hasMoreRef.current)) return

      const requestId = ++requestIdRef.current
      const offset = reset ? 0 : usersRef.current.length
      const params = new URLSearchParams({
        offset: String(offset),
        limit: "20",
      })

      const trimmedQuery = query.trim()
      if (trimmedQuery) params.set("q", trimmedQuery)
      if (roleFilter !== "ALL") params.set("role", roleFilter)

      if (reset) {
        setUsers([])
        setHasMore(true)
      }

      setIsLoading(true)
      loadingRef.current = true

      try {
        const response = await fetch(`/api/admin/users?${params.toString()}`)
        if (!response.ok) {
          throw new Error("Failed to load users")
        }

        const data = (await response.json()) as UsersResponse
        if (requestId !== requestIdRef.current) return

        setUsers((prev) => (reset ? data.users : [...prev, ...data.users]))
        setHasMore(data.hasMore)
      } catch (error) {
        if (requestId === requestIdRef.current) {
          toast.error("Couldn't load more users right now.")
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false)
          loadingRef.current = false
        }
      }
    },
    [query, roleFilter]
  )

  React.useEffect(() => {
    void loadUsers({ reset: true })
  }, [loadUsers])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  React.useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingRef.current) {
          void loadUsers()
        }
      },
      { rootMargin: "300px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadUsers])

  const handleRoleChangeInitiate = (user: User, newRole: User["role"]) => {
    if (user.role === newRole) return
    setTargetUser(user)
    setTargetRole(newRole)
    setConfirmOpen(true)
  }

  const handleConfirmRoleChange = async () => {
    if (!targetUser || !targetRole) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/users/${targetUser.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      })

      if (!response.ok) {
        throw new Error("Failed to update role")
      }

      toast.success("User role updated successfully")
      setConfirmOpen(false)
      await loadUsers({ reset: true })
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const getRoleTone = (role: User["role"]) => {
    if (role === "ADMIN") {
      return {
        card: "border-blue-500/20 bg-gradient-to-b from-blue-500/[0.06] to-card",
        badge: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25",
      }
    }

    if (role === "BANNED") {
      return {
        card: "border-red-500/20 bg-gradient-to-b from-red-500/[0.06] to-card",
        badge: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
      }
    }

    return {
      card: "border-border bg-card",
      badge: "bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/25",
    }
  }

  const getRoleActions = (role: User["role"]) => {
    if (role === "ADMIN") {
      return [
        { label: "Make User", role: "USER" as const, variant: "outline" as const },
        { label: "Ban User", role: "BANNED" as const, variant: "destructive" as const },
      ]
    }

    if (role === "BANNED") {
      return [{ label: "Remove Ban", role: "USER" as const, variant: "default" as const }]
    }

    return [
      { label: "Make Admin", role: "ADMIN" as const, variant: "outline" as const },
      { label: "Ban User", role: "BANNED" as const, variant: "destructive" as const },
    ]
  }

  const roleButtons: Array<{ label: string; value: "ALL" | User["role"] }> = [
    { label: "All", value: "ALL" },
    { label: "Users", value: "USER" },
    { label: "Admins", value: "ADMIN" },
    { label: "Banned", value: "BANNED" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Manage user roles and system access</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex w-full flex-col gap-2 lg:flex-1 lg:flex-row lg:items-center lg:gap-3">
          <div className="relative w-full max-w-xl lg:max-w-2xl">
            <IconSearch className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or email..."
              className="pl-9 pr-20"
            />
            <div className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 sm:block">
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end sm:shrink-0">
          {roleButtons.map((button) => (
            <Button
              key={button.value}
              variant={roleFilter === button.value ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter(button.value)}
              className={button.value === "ALL" ? "gap-2" : ""}
            >
              {button.value === "ALL" ? <IconFilter className="h-4 w-4" /> : null}
              {button.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {users.map((user) => {
          const roleTone = getRoleTone(user.role)

          return (
            <div
              key={user.id}
              className={`group relative rounded-2xl border p-2 shadow-sm transition-all group-hover:bg-muted/10 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 md:p-5 ${roleTone.card}`}
            >
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-12 w-12 ring-2 ring-background md:h-14 md:w-14">
                  <AvatarImage src={user.image || undefined} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="mt-3 line-clamp-1 text-sm font-semibold md:text-base">{user.name}</p>
                <p className="mt-1 text-center text-xs font-medium text-foreground/80 underline decoration-foreground/35 decoration-dotted underline-offset-4 md:text-sm">
                  {user.email}
                </p>
              </div>

              <div className="mt-4 grid gap-2 text-xs md:gap-3 md:text-sm">
                <div className="flex items-center justify-between rounded-xl border bg-background/60 px-2.5 py-2 md:px-3">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="font-medium">{user.joinDate}</span>
                </div>

                <div className="flex items-center justify-between rounded-xl border bg-background/60 px-2.5 py-2 md:px-3">
                  <span className="text-muted-foreground">Role</span>
                  <Badge variant="outline" className={roleTone.badge}>{user.role}</Badge>
                </div>

              </div>

              <div className="mt-3 grid gap-2 md:mt-4 md:grid-cols-2">
                {getRoleActions(user.role).map((action) => (
                  <Button
                    key={action.label}
                    variant={action.variant}
                    size="sm"
                    className={`w-full rounded-xl ${action.label === "Remove Ban" ? "md:col-span-2" : ""}`}
                    onClick={() => handleRoleChangeInitiate(user, action.role)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div ref={sentinelRef} className="flex flex-col items-center gap-3 py-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconLoader className="h-4 w-4 animate-spin" />
            Loading users...
          </div>
        )}
        {!isLoading && users.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Showing {users.length} users{hasMore ? " and loading more as you scroll" : " with no more results"}
          </p>
        )}
        {!isLoading && users.length === 0 && (
          <p className="text-sm text-muted-foreground">No users found.</p>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              You are changing this user&apos;s system role. This will immediately affect their access permissions.
            </DialogDescription>
          </DialogHeader>

          {targetUser && targetRole && (
            <div className="py-4">
              <div className="flex flex-col gap-2 rounded-md border bg-muted/50 p-4">
                <span className="text-sm font-medium">User: {targetUser.email}</span>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{targetUser.role}</Badge>
                  <span>→</span>
                  <Badge
                    className={`
                      ${targetRole === "ADMIN" ? "bg-blue-500 text-white hover:bg-blue-600" : ""}
                      ${targetRole === "BANNED" ? "bg-red-500 text-white hover:bg-red-600" : ""}
                      ${targetRole === "USER" ? "bg-gray-500 text-white hover:bg-gray-600" : ""}
                    `}
                  >
                    {targetRole}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isUpdating} className="gap-2">
              Cancel
              <Kbd>Esc</Kbd>
            </Button>
            <Button onClick={handleConfirmRoleChange} disabled={isUpdating} className="gap-2">
              {isUpdating && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Change
              <Kbd>↵</Kbd>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

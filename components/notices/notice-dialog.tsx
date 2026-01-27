"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { 
  IconLoader, 
  IconSearch, 
  IconX,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Kbd } from "@/components/ui/kbd"

interface NoticeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  notice?: any // If editing
}

export function NoticeDialog({ open, onOpenChange, onSuccess, notice }: NoticeDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  // Form State
  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [type, setType] = React.useState("INFO")
  const [target, setTarget] = React.useState("ALL")
  const [targetRoles, setTargetRoles] = React.useState<string[]>([])
  const [targetUsers, setTargetUsers] = React.useState<{ id: string, name: string, email: string }[]>([])
  const [isPublished, setIsPublished] = React.useState(false)
  const [isPinned, setIsPinned] = React.useState(false)
  const [expiryDate, setExpiryDate] = React.useState("")
  
  // User search state
  const [userSearch, setUserSearch] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<any[]>([])
  const [isSearching, setIsSearching] = React.useState(false)

  React.useEffect(() => {
    if (notice) {
      setTitle(notice.title)
      setContent(notice.content)
      setType(notice.type)
      setTarget(notice.target)
      setTargetRoles(notice.targetRoles || [])
      setTargetUsers(notice.targetUsersData || []) 
      setIsPublished(notice.isPublished)
      setIsPinned(notice.isPinned)
      setExpiryDate(notice.expiryDate ? new Date(notice.expiryDate).toISOString().split('T')[0] : "")
    } else {
      setTitle("")
      setContent("")
      setType("INFO")
      setTarget("ALL")
      setTargetRoles([])
      setTargetUsers([])
      setIsPublished(false)
      setIsPinned(false)
      setExpiryDate("")
    }
  }, [notice, open])

  const handleSearchUsers = async (q: string) => {
    setUserSearch(q)
    if (q.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const toggleRole = (role: string) => {
    setTargetRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  const addUser = (user: any) => {
    if (!targetUsers.find(u => u.id === user.id)) {
      setTargetUsers(prev => [...prev, user])
    }
    setUserSearch("")
    setSearchResults([])
  }

  const removeUser = (userId: string) => {
    setTargetUsers(prev => prev.filter(u => u.id !== userId))
  }

  const handleSubmit = async () => {
    if (!title || !content) {
      toast.error("Please fill in title and content")
      return
    }

    setIsSubmitting(true)
    try {
      const url = notice ? `/api/notices/${notice.id}` : "/api/notices"
      const method = notice ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          type,
          target,
          targetRoles,
          targetUsers: targetUsers.map(u => u.id),
          isPublished,
          isPinned,
          expiryDate: expiryDate || null,
        }),
      })

      if (!response.ok) throw new Error("Failed to save notice")

      toast.success(notice ? "Notice updated" : "Notice created")
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{notice ? "Edit Notice" : "Create New Notice"}</DialogTitle>
          <DialogDescription>
            Configure the details and visibility for this system notice.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Main Content Card Style */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Announcement Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Write your message here..."
                className="min-h-[120px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </div>

          {/* Options Section - Similar to the muted box in targetUser role change */}
          <div className="grid gap-4 p-4 border rounded-md bg-muted/50">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Notice Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INFO">Information</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="DANGER">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Everyone</SelectItem>
                  <SelectItem value="ROLE">By Role</SelectItem>
                  <SelectItem value="SPECIFIC">Pick Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {target === "ROLE" && (
              <div className="flex flex-wrap gap-4 px-1 pt-1">
                {["ADMIN", "SUPERVISOR", "USER"].map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`role-${role}`} 
                      checked={targetRoles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                    />
                    <Label htmlFor={`role-${role}`} className="text-sm cursor-pointer">{role}</Label>
                  </div>
                ))}
              </div>
            )}

            {target === "SPECIFIC" && (
              <div className="space-y-3 pt-1">
                <div className="relative">
                  <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search users..." 
                    className="pl-9 h-9 text-sm"
                    value={userSearch}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {searchResults.map(user => (
                        <div 
                          key={user.id}
                          className="flex items-center justify-between p-2 hover:bg-accent cursor-pointer text-xs"
                          onClick={() => addUser(user)}
                        >
                          <span>{user.name} ({user.email})</span>
                          <Button size="sm" variant="ghost" className="h-6 px-2">Add</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {targetUsers.map(user => (
                    <Badge key={user.id} variant="secondary" className="pl-2 pr-1 h-6 gap-1">
                      {user.name}
                      <IconX className="h-3 w-3 cursor-pointer" onClick={() => removeUser(user.id)} />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
              <Label htmlFor="published" className="text-sm cursor-pointer">Published</Label>
              <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
              <Label htmlFor="pinned" className="text-sm cursor-pointer px-1">Pinned</Label>
              <Switch id="pinned" checked={isPinned} onCheckedChange={setIsPinned} />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2 w-full sm:w-auto">
            Cancel
            <Kbd>Esc</Kbd>
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 w-full sm:w-auto">
            {isSubmitting && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
            {notice ? "Save Changes" : "Create Notice"}
            <Kbd>↵</Kbd>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

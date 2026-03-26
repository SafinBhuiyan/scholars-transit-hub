"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { IconCalendar, IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type Semester = {
  id: string
  name: string
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
}

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Invalid date"
  return format(date, "d MMM, yyyy")
}

export function SemesterSettings() {
  const [semesters, setSemesters] = React.useState<Semester[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  const [name, setName] = React.useState("")
  const [startDate, setStartDate] = React.useState<Date | undefined>()
  const [endDate, setEndDate] = React.useState<Date | undefined>()

  const [editOpen, setEditOpen] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<Semester | null>(null)
  const [editName, setEditName] = React.useState("")
  const [editStartDate, setEditStartDate] = React.useState<Date | undefined>()
  const [editEndDate, setEditEndDate] = React.useState<Date | undefined>()
  const [deleteTarget, setDeleteTarget] = React.useState<Semester | null>(null)

  const loadSemesters = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/semesters")
      if (!response.ok) {
        throw new Error("Failed to load semesters")
      }
      const data = await response.json()
      setSemesters(data)
    } catch {
      toast.error("Failed to load semesters")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadSemesters()
  }, [loadSemesters])

  const handleCreate = async () => {
    if (!name || !startDate || !endDate) {
      toast.error("Please fill in all fields")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/semesters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create semester")
      }

      toast.success("Semester created")
      setName("")
      setStartDate(undefined)
      setEndDate(undefined)
      await loadSemesters()
    } catch {
      toast.error("Failed to create semester")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditOpen = (semester: Semester) => {
    setEditTarget(semester)
    setEditName(semester.name)
    setEditStartDate(new Date(semester.startDate))
    setEditEndDate(new Date(semester.endDate))
    setEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!editTarget || !editName || !editStartDate || !editEndDate) {
      toast.error("Please fill in all fields")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/semesters/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          startDate: editStartDate.toISOString(),
          endDate: editEndDate.toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update semester")
      }

      toast.success("Semester updated")
      setEditOpen(false)
      setEditTarget(null)
      setEditStartDate(undefined)
      setEditEndDate(undefined)
      await loadSemesters()
    } catch {
      toast.error("Failed to update semester")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/semesters/${deleteTarget.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete semester")
      }

      toast.success("Semester deleted")
      setDeleteTarget(null)
      await loadSemesters()
    } catch {
      toast.error("Failed to delete semester")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6">
      <div className="rounded-md border p-4 space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Semesters</h2>
          <p className="text-sm text-muted-foreground">Manage semesters for subscription & payment requests</p>
        </div>
        <div className="h-px w-full bg-border/70" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="semester-name">Semester Name *</Label>
            <Input
              id="semester-name"
              placeholder="Spring 2026"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="semester-start">Start Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="semester-start"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <IconCalendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "d MMM, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="semester-end">End Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="semester-end"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <IconCalendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "d MMM, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleCreate} disabled={isSaving} className="w-full">
            Add New Semesters
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow>
              <TableHead>Semester</TableHead>
              <TableHead className="whitespace-nowrap">Date Range</TableHead>
              <TableHead className="w-16 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  Loading semesters...
                </TableCell>
              </TableRow>
            ) : semesters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No semesters yet.
                </TableCell>
              </TableRow>
            ) : (
              semesters.map((semester) => (
                <TableRow key={semester.id}>
                  <TableCell className="text-xs">
                    <span className="inline-flex max-w-full items-center rounded-full border border-white/80 bg-white px-3 py-1 text-xs font-medium text-slate-900 shadow-sm">
                      {semester.name}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-nowrap items-center gap-1 text-sm">
                      <Badge variant="outline" className="h-auto rounded-md px-2 py-0.5 text-[11px] font-medium">
                        {formatDate(semester.startDate)}
                      </Badge>
                      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        -
                      </span>
                      <Badge variant="outline" className="h-auto rounded-md px-2 py-0.5 text-[11px] font-medium">
                        {formatDate(semester.endDate)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => handleEditOpen(semester)} className="gap-2">
                          <IconEdit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(semester)}
                          className="gap-2"
                          disabled={isSaving}
                        >
                          <IconTrash className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Semester</DialogTitle>
            <DialogDescription>Update the semester name and dates.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-semester-name">Semester Name *</Label>
              <Input
                id="edit-semester-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-semester-start">Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="edit-semester-start"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editStartDate && "text-muted-foreground"
                    )}
                  >
                    <IconCalendar className="mr-2 h-4 w-4" />
                    {editStartDate ? format(editStartDate, "d MMM, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar mode="single" selected={editStartDate} onSelect={setEditStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-semester-end">End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="edit-semester-end"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editEndDate && "text-muted-foreground"
                    )}
                  >
                    <IconCalendar className="mr-2 h-4 w-4" />
                    {editEndDate ? format(editEndDate, "d MMM, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar mode="single" selected={editEndDate} onSelect={setEditEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSaving}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Semester?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove
              {" "}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving}
            >
              {isSaving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

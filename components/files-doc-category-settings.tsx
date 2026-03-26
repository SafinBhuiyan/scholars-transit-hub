"use client"

import * as React from "react"
import { IconEdit, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconDotsVertical } from "@tabler/icons-react"

type FilesDocCategory = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export function FilesDocCategorySettings() {
  const [categories, setCategories] = React.useState<FilesDocCategory[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [name, setName] = React.useState("")
  const [editOpen, setEditOpen] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<FilesDocCategory | null>(null)
  const [editName, setEditName] = React.useState("")
  const [deleteTarget, setDeleteTarget] = React.useState<FilesDocCategory | null>(null)

  const loadCategories = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/files-doc-categories")
      if (!response.ok) {
        throw new Error("Failed to load categories")
      }

      const data = await response.json()
      setCategories(data)
    } catch {
      toast.error("Failed to load document categories")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleCreate = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Category name is required")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/files-doc-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to create category")
      }

      toast.success("Document category created")
      setName("")
      await loadCategories()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create category")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditOpen = (category: FilesDocCategory) => {
    setEditTarget(category)
    setEditName(category.name)
    setEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!editTarget || !editName.trim()) {
      toast.error("Category name is required")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/files-doc-categories/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to update category")
      }

      toast.success("Document category updated")
      setEditOpen(false)
      setEditTarget(null)
      setEditName("")
      await loadCategories()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update category")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/files-doc-categories/${deleteTarget.id}`, {
        method: "DELETE",
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete category")
      }

      toast.success("Document category deleted")
      setDeleteTarget(null)
      await loadCategories()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete category")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6">
      <div className="rounded-md border p-4 space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Files & Docs Categories</h2>
          <p className="text-sm text-muted-foreground">
            Manage the categories available in the Files & Docs upload flow.
          </p>
        </div>
        <div className="h-px w-full bg-border/70" />
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-category-name">Category Name *</Label>
            <Input
              id="doc-category-name"
              placeholder="Student Handbook"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <Button onClick={handleCreate} disabled={isSaving} className="w-full">
            Add New Category
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="w-[30%] whitespace-normal">Updated</TableHead>
              <TableHead className="w-18 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  Loading categories...
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No categories yet.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="text-xs">
                    <span className="inline-flex max-w-full items-center rounded-full border border-white/80 bg-white px-3 py-1 text-xs font-medium text-slate-900 shadow-sm">
                      {category.name}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-normal text-xs leading-5">
                    {new Date(category.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right whitespace-normal">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => handleEditOpen(category)} className="gap-2">
                          <IconEdit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(category)}
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
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Rename this category for future and existing files.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="edit-doc-category-name">Category Name</Label>
            <Input
              id="edit-doc-category-name"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
            />
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
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove
              {" "}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span>
              . Categories assigned to existing files cannot be deleted until those files are reassigned or removed.
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

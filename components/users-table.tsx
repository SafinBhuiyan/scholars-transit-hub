"use client"

import * as React from "react"
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLoader,
  IconSearch,
  IconSelector,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  image: z.string().nullable().optional(),
  role: z.enum(["ADMIN", "SUPERVISOR", "USER"]),
})

export type User = z.infer<typeof userSchema>

export function UsersTable({ data }: { data: User[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // Confirmation Dialog State
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [targetUser, setTargetUser] = React.useState<User | null>(null)
  const [targetRole, setTargetRole] = React.useState<User["role"] | null>(null)
  const [isUpdating, setIsUpdating] = React.useState(false)

  const router = useRouter()

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: targetRole }),
      })

      if (!response.ok) {
        throw new Error("Failed to update role")
      }

      toast.success("User role updated successfully")
      setConfirmOpen(false)
      router.refresh()
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.image || undefined} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{user.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role
        return (
          <Badge
            variant="outline"
            className={`
              ${role === "ADMIN" ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25" : ""}
              ${role === "SUPERVISOR" ? "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/25" : ""}
              ${role === "USER" ? "bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/25" : ""}
            `}
          >
            {role}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original
        return (
          <Popover>
            <PopoverTrigger asChild>
               <Button variant="outline" size="sm" className="w-[140px] justify-between">
                 {user.role}
                 <IconSelector className="ml-2 h-4 w-4 shrink-0 opacity-50" />
               </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[140px] p-0" align="end">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {["USER", "ADMIN", "SUPERVISOR"].map((role) => (
                      <CommandItem
                        key={role}
                        value={role}
                        onSelect={() => handleRoleChangeInitiate(user, role as User["role"])}
                      >
                        <IconCheck
                          className={`mr-2 h-4 w-4 ${
                            user.role === role ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        {role}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Manage user roles and system access</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full max-w-sm">
            <IconSearch className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
            <Input
              placeholder="Search by name..."
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="pl-9"
            />
          </div>
          <Select
            value={(table.getColumn("role")?.getFilterValue() as string) ?? "ALL"}
            onValueChange={(value) => table.getColumn("role")?.setFilterValue(value === "ALL" ? "" : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="USER">USER</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
              <SelectItem value="SUPERVISOR">SUPERVISOR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>

      {/* Confirmation Dialog */}
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
              <div className="flex flex-col gap-2 p-4 border rounded-md bg-muted/50">
                <span className="text-sm font-medium">User: {targetUser.email}</span>
                <div className="flex items-center gap-2 text-sm">
                   <Badge variant="outline">{targetUser.role}</Badge>
                   <span>→</span>
                   <Badge 
                     className={`
                       ${targetRole === "ADMIN" ? "bg-blue-500 text-white hover:bg-blue-600" : ""}
                       ${targetRole === "SUPERVISOR" ? "bg-purple-500 text-white hover:bg-purple-600" : ""}
                       ${targetRole === "USER" ? "bg-gray-500 text-white hover:bg-gray-600" : ""}
                     `}
                   >
                     {targetRole}
                   </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRoleChange} disabled={isUpdating}>
              {isUpdating && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

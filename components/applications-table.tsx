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
  IconX,
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
import { Kbd, KbdGroup } from "@/components/ui/kbd"

export const applicationSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  applicantType: z.enum(["STUDENT", "ACADEMIC", "ADMINISTRATIVE"]),
  department: z.string(),
  batch: z.string().nullable().optional(),
  studentId: z.string().nullable().optional(),
  phone: z.string(),
  phoneVerified: z.boolean(),
  routeName: z.string(),
  pickupPointName: z.string(),
  status: z.enum(["WAITLIST", "APPROVED", "REJECTED"]),
  appliedDate: z.string(),
})

export type Application = z.infer<typeof applicationSchema>

export function ApplicationsTable({ data }: { data: Application[] }) {
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
  const [targetApplication, setTargetApplication] = React.useState<Application | null>(null)
  const [targetStatus, setTargetStatus] = React.useState<Application["status"] | null>(null)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const searchRef = React.useRef<HTMLInputElement>(null)

  const router = useRouter()

  const handleStatusChangeInitiate = (application: Application, newStatus: Application["status"]) => {
    if (application.status === newStatus) return
    setTargetApplication(application)
    setTargetStatus(newStatus)
    setConfirmOpen(true)
  }

  const handleConfirmStatusChange = async () => {
    if (!targetApplication || !targetStatus) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/applications/${targetApplication.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: targetStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      toast.success("Application status updated successfully")
      setConfirmOpen(false)
      router.refresh()
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const columns: ColumnDef<Application>[] = [
    {
      accessorKey: "fullName",
      header: "Applicant",
      cell: ({ row }) => {
        const application = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{application.fullName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{application.fullName}</span>
              <span className="text-xs text-muted-foreground">{application.applicantType}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "department",
      header: () => <div className="text-center">Department</div>,
      cell: ({ row }) => (
        <div className="text-center text-muted-foreground">{row.original.department}</div>
      ),
    },
    {
      accessorKey: "batch",
      header: () => <div className="text-center">Batch</div>,
      cell: ({ row }) => (
        <div className="text-center text-muted-foreground">{row.original.batch || "-"}</div>
      ),
    },
    {
      accessorKey: "studentId",
      header: () => <div className="text-center">Student ID</div>,
      cell: ({ row }) => (
        <div className="text-center text-muted-foreground">{row.original.studentId || "-"}</div>
      ),
    },
    {
      accessorKey: "phone",
      header: () => <div className="text-center">Phone</div>,
      cell: ({ row }) => (
        <div className="text-center text-muted-foreground">{row.original.phone}</div>
      ),
    },
    {
      accessorKey: "routeName",
      header: () => <div className="text-center">Route</div>,
      cell: ({ row }) => (
        <div className="text-center text-muted-foreground">{row.original.routeName}</div>
      ),
    },
    {
      accessorKey: "pickupPointName",
      header: () => <div className="text-center">Pickup Point</div>,
      cell: ({ row }) => (
        <div className="text-center text-muted-foreground">{row.original.pickupPointName}</div>
      ),
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className={`
                ${status === "APPROVED" ? "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/25" : ""}
                ${status === "REJECTED" ? "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25" : ""}
                ${status === "WAITLIST" ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/25" : ""}
              `}
            >
              {status}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "appliedDate",
      header: () => <div className="text-center">Applied</div>,
      cell: ({ row }) => (
        <div className="text-center text-muted-foreground">{row.original.appliedDate}</div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const application = row.original
        return (
          <div className="flex justify-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-[140px] justify-between">
                  {application.status}
                  <IconSelector className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[140px] p-0" align="end">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {["WAITLIST", "APPROVED", "REJECTED"].map((status) => (
                        <CommandItem
                          key={status}
                          value={status}
                          onSelect={() => handleStatusChangeInitiate(application, status as Application["status"])}
                        >
                          <IconCheck
                            className={`mr-2 h-4 w-4 ${
                              application.status === status ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          {status}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
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

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        searchRef.current?.focus()
      }

      if (e.key === "[" && (e.metaKey || e.ctrlKey)) {
        if (table.getCanPreviousPage()) {
          e.preventDefault()
          table.previousPage()
        }
      }

      if (e.key === "]" && (e.metaKey || e.ctrlKey)) {
        if (table.getCanNextPage()) {
          e.preventDefault()
          table.nextPage()
        }
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [table])

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
        <p className="text-muted-foreground">Manage transport pass applications</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full max-w-sm">
            <IconSearch className="text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4" />
            <Input
              ref={searchRef}
              placeholder="Search by name..."
              value={(table.getColumn("fullName")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("fullName")?.setFilterValue(event.target.value)
              }
              className="pl-9 pr-12"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:block">
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </div>
          </div>
          <Select
            value={(table.getColumn("status")?.getFilterValue() as string) ?? "ALL"}
            onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "ALL" ? "" : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="WAITLIST">WAITLIST</SelectItem>
              <SelectItem value="APPROVED">APPROVED</SelectItem>
              <SelectItem value="REJECTED">REJECTED</SelectItem>
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
                  No applications found.
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
          className="gap-2"
        >
          <KbdGroup className="hidden sm:flex">
            <Kbd>⌘</Kbd>
            <Kbd>[</Kbd>
          </KbdGroup>
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="gap-2"
        >
          Next
          <KbdGroup className="hidden sm:flex">
            <Kbd>⌘</Kbd>
            <Kbd>]</Kbd>
          </KbdGroup>
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Application Status</DialogTitle>
            <DialogDescription>
              You are changing this application's status. This will immediately affect the applicant's transport pass access.
            </DialogDescription>
          </DialogHeader>

          {targetApplication && targetStatus && (
            <div className="py-4">
              <div className="flex flex-col gap-2 p-4 border rounded-md bg-muted/50">
                <span className="text-sm font-medium">Applicant: {targetApplication.fullName}</span>
                <div className="flex items-center gap-2 text-sm">
                   <Badge variant="outline">{targetApplication.status}</Badge>
                   <span>→</span>
                   <Badge
                     className={`
                        ${targetStatus === "APPROVED" ? "bg-green-500 text-white hover:bg-green-600" : ""}
                        ${targetStatus === "REJECTED" ? "bg-red-500 text-white hover:bg-red-600" : ""}
                        ${targetStatus === "WAITLIST" ? "bg-yellow-500 text-white hover:bg-yellow-600" : ""}
                      `}
                   >
                     {targetStatus}
                   </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isUpdating} className="gap-2">
              Cancel
              <Kbd>Esc</Kbd>
            </Button>
            <Button onClick={handleConfirmStatusChange} disabled={isUpdating} className="gap-2">
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

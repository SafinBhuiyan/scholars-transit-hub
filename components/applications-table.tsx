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
  IconId,
  IconEye,
  IconClock,
  IconUser,
  IconMapPin,
  IconPhone,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export const applicationSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  userImage: z.string().optional(),
  applicantType: z.enum(["STUDENT", "ACADEMIC", "ADMINISTRATIVE"]),
  department: z.string(),
  batch: z.string().nullable().optional(),
  studentId: z.string().nullable().optional(),
  phone: z.string(),
  phoneVerified: z.boolean(),
  routeName: z.string(),
  pickupPointName: z.string(),
  status: z.enum(["PENDING_PAYMENT", "WAITLIST", "APPROVED", "REJECTED"]),
  appliedDate: z.string(),
  idCardUrl: z.string(),
  routeCapacity: z.number().optional(),
  leftCapacity: z.number().optional(),
  payments: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      billingMonth: z.string().nullable().optional(),
      amount: z.number(),
      currency: z.string(),
      status: z.string(),
      method: z.string().nullable().optional(),
      transactionId: z.string().nullable().optional(),
      paidAt: z.string().nullable().optional(),
      createdAt: z.string().nullable().optional(),
    })
  ).optional(),
})

export type Application = z.infer<typeof applicationSchema>

export function ApplicationsTable({
  data,
  hideToolbar = false,
}: {
  data: Application[]
  hideToolbar?: boolean
}) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 15,
  })

  // Confirmation Dialog State
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [targetApplication, setTargetApplication] = React.useState<Application | null>(null)
  const [targetStatus, setTargetStatus] = React.useState<Application["status"] | null>(null)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [rejectionReason, setRejectionReason] = React.useState("")
  const searchRef = React.useRef<HTMLInputElement>(null)

  // Quick View Sheet State
  const [quickViewOpen, setQuickViewOpen] = React.useState(false)
  const [quickViewApplication, setQuickViewApplication] = React.useState<Application | null>(null)

  // Calculate status counts
  const statusCounts = React.useMemo(() => {
    return {
      all: data.length,
      waitlist: data.filter(a => a.status === "WAITLIST").length,
      approved: data.filter(a => a.status === "APPROVED").length,
      rejected: data.filter(a => a.status === "REJECTED").length,
      pending: data.filter(a => a.status === "PENDING_PAYMENT").length,
    }
  }, [data])

  const router = useRouter()

  const handleStatusChangeInitiate = (application: Application, newStatus: Application["status"]) => {
    if (application.status === newStatus) return
    setTargetApplication(application)
    setTargetStatus(newStatus)
    setRejectionReason("")
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
        body: JSON.stringify({
          status: targetStatus,
          reason: targetStatus === "REJECTED" ? rejectionReason : undefined,
        }),
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

  const handleQuickView = (application: Application) => {
    setQuickViewApplication(application)
    setQuickViewOpen(true)
  }

  const getStatusBadge = (status: Application["status"]) => {
    const statusConfig = {
      WAITLIST: { label: "Needs Review", color: "bg-yellow-500/15 text-yellow-700 border-yellow-500/25" },
      APPROVED: { label: "Active Pass", color: "bg-green-500/15 text-green-700 border-green-500/25" },
      REJECTED: { label: "Rejected", color: "bg-red-500/15 text-red-700 border-red-500/25" },
      PENDING_PAYMENT: { label: "Awaiting Payment", color: "bg-amber-500/15 text-amber-700 border-amber-500/25" },
    }

    const config = statusConfig[status]

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`${config.color} cursor-help`}>
              {config.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{status}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const getFormattedType = (type: Application["applicantType"]) => {
    if (type === "STUDENT") return "Student"
    if (type === "ACADEMIC") return "Academic"
    if (type === "ADMINISTRATIVE") return "Admin"
    return type
  }

  const getPaymentStatusBadge = (status: string) => {
    const config = {
      PAID: "bg-green-500/15 text-green-700 border-green-500/25",
      PENDING: "bg-amber-500/15 text-amber-700 border-amber-500/25",
      FAILED: "bg-red-500/15 text-red-700 border-red-500/25",
      CANCELLED: "bg-gray-500/15 text-gray-700 border-gray-500/25",
    }[status] || "bg-gray-500/15 text-gray-700 border-gray-500/25"

    return (
      <Badge variant="outline" className={`${config} text-[10px] select-none`}>
        {status}
      </Badge>
    )
  }

  const columns: ColumnDef<Application>[] = [
    {
      id: "quickView",
      header: "",
      cell: ({ row }) => {
        const application = row.original
        return (
          <Button
            size="icon-sm"
            variant="default"
            className="h-7 w-7 text-primary-foreground shadow-sm bg-primary hover:bg-primary/90"
            onClick={() => handleQuickView(application)}
            title="Detailed View"
          >
            <IconEye className="h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "fullName",
      header: "Applicant",
      cell: ({ row }) => {
        const application = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 cursor-pointer shrink-0" onClick={() => handleQuickView(application)}>
              {application.userImage && <AvatarImage src={application.userImage} alt={application.fullName} />}
              <AvatarFallback className="text-xs">{application.fullName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm cursor-pointer hover:underline truncate" onClick={() => handleQuickView(application)} title={application.fullName}>
                {application.fullName}
              </div>
              {application.applicantType === "STUDENT" && application.studentId && (
                <div className="text-xs text-muted-foreground truncate">
                  {application.batch} • {application.studentId}
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "department",
      header: "Dept",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{row.original.department}</div>
      ),
    },
    {
      accessorKey: "applicantType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] h-5">
          {row.original.applicantType}
        </Badge>
      ),
    },
    {
      accessorKey: "routeName",
      header: "Route",
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">{row.original.routeName}</div>
          {row.original.routeCapacity && row.original.leftCapacity !== undefined && (
            <div className="text-xs text-muted-foreground">
              Capacity: {row.original.leftCapacity}/{row.original.routeCapacity}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "pickupPointName",
      header: "Pickup",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{row.original.pickupPointName}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "appliedDate",
      header: "Applied",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{row.original.appliedDate}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const application = row.original
        const status = application.status

        // Contextual actions based on status
        if (status === "WAITLIST") {
          return (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="default"
                className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                onClick={() => handleStatusChangeInitiate(application, "APPROVED")}
              >
                <IconCheck className="mr-1 h-3 w-3" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 px-2 text-xs"
                onClick={() => handleStatusChangeInitiate(application, "REJECTED")}
              >
                <IconX className="mr-1 h-3 w-3" />
                Reject Pass & Application
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-2">
                    <IconSelector className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0" align="end">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        <CommandItem onSelect={() => handleQuickView(application)}>
                          <IconEye className="mr-2 h-4 w-4" />
                          Detailed View
                        </CommandItem>
                        <CommandItem onSelect={() => handleStatusChangeInitiate(application, "WAITLIST")} disabled>
                          <IconClock className="mr-2 h-4 w-4" />
                          Set to Waitlist
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )
        }

        if (status === "APPROVED") {
          return (
            <div className="flex gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1.5">
                    Manage
                    <IconSelector className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0" align="end">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        <CommandItem onSelect={() => handleStatusChangeInitiate(application, "REJECTED")}>
                          <IconX className="mr-2 h-4 w-4" />
                          Reject Pass & Application
                        </CommandItem>
                        <CommandItem onSelect={() => handleStatusChangeInitiate(application, "WAITLIST")}>
                          <IconClock className="mr-2 h-4 w-4" />
                          Set to Waitlist
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )
        }

        // REJECTED status - only view details
        return (
          <div className="flex gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1.5">
                  Manage
                  <IconSelector className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0" align="end">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      <CommandItem onSelect={() => handleStatusChangeInitiate(application, "WAITLIST")}>
                        <IconClock className="mr-2 h-4 w-4" />
                        Set to Waitlist
                      </CommandItem>
                      <CommandItem onSelect={() => handleStatusChangeInitiate(application, "APPROVED")}>
                        <IconCheck className="mr-2 h-4 w-4" />
                        Approve
                      </CommandItem>
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
    initialState: {
      sorting: [
        { id: "status", desc: false }, // Sort by status first (WAITLIST comes first)
      ],
      columnFilters: [
        { id: "status", value: "WAITLIST" }, // Default filter to WAITLIST
      ],
    },
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
      {!hideToolbar && (
        <>
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
            <p className="text-muted-foreground">Review and process transport pass applications</p>
          </div>

          {/* Filter Bar with Counters */}
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

              {/* Status Filters with Counters */}
              <Select
                value={(table.getColumn("status")?.getFilterValue() as string) ?? "WAITLIST"}
                onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "ALL" ? "" : value)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    All ({statusCounts.all})
                  </SelectItem>
                  <SelectItem value="WAITLIST">
                    Needs Review ({statusCounts.waitlist})
                  </SelectItem>
                  <SelectItem value="APPROVED">
                    Active Pass ({statusCounts.approved})
                  </SelectItem>
                  <SelectItem value="REJECTED">
                    Rejected ({statusCounts.rejected})
                  </SelectItem>
                  <SelectItem value="PENDING_PAYMENT">
                    Awaiting Payment ({statusCounts.pending})
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select
                value={(table.getColumn("applicantType")?.getFilterValue() as string) ?? "ALL"}
                onValueChange={(value) => table.getColumn("applicantType")?.setFilterValue(value === "ALL" ? "" : value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="ACADEMIC">Academic</SelectItem>
                  <SelectItem value="ADMINISTRATIVE">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

      {/* Application Cards Grid */}
      {table.getRowModel().rows?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {table.getRowModel().rows.map((row) => {
            const application = row.original
            return (
              <div
                key={row.id}
                className="relative flex flex-col justify-between overflow-hidden border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20 rounded-md"
              >
                {/* Status & Date bar */}
                <div className="flex items-center justify-between mb-4 gap-2">
                  {getStatusBadge(application.status)}
                  <Badge variant="default" className="font-semibold text-[10px] bg-primary text-primary-foreground hover:bg-primary gap-1 select-none shrink-0">
                    <IconClock className="h-3 w-3" />
                    {application.appliedDate}
                  </Badge>
                </div>

                {/* Applicant Info Header */}
                <div className="flex items-start gap-3 mb-4">
                  <Avatar className="h-10 w-10 shrink-0 cursor-pointer" onClick={() => handleQuickView(application)}>
                    {application.userImage && <AvatarImage src={application.userImage} alt={application.fullName} />}
                    <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">
                      {application.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="font-semibold text-sm leading-tight text-foreground truncate cursor-pointer hover:underline"
                      onClick={() => handleQuickView(application)}
                      title={application.fullName}
                    >
                      {application.fullName}
                    </h3>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-col gap-0.5">
                      <span className="truncate font-medium">
                        {getFormattedType(application.applicantType)} - {application.department}
                      </span>
                      {application.applicantType === "STUDENT" && application.studentId && (
                        <span className="truncate text-[11px] text-muted-foreground/80">
                          {application.batch} • {application.studentId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Route Details Box */}
                <div className="space-y-2 border-t pt-3 mb-4 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Route:</span>
                    <div className="text-right">
                      <span className="font-semibold text-foreground">{application.routeName}</span>
                      {application.routeCapacity && application.leftCapacity !== undefined && (
                        <div className="text-[10px] text-muted-foreground">
                          Capacity: {application.leftCapacity}/{application.routeCapacity}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground shrink-0">Pickup:</span>
                    <span className="font-medium text-foreground text-right truncate" title={application.pickupPointName}>
                      {application.pickupPointName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium text-foreground flex items-center gap-1">
                      {application.phone}
                      {application.phoneVerified && (
                        <IconCheck className="h-3 w-3 text-green-600 font-bold" />
                      )}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="border-t pt-3 mt-auto space-y-2">
                  {/* Detailed View Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs border-primary/20 hover:border-primary/50 text-foreground shadow-sm bg-background font-medium"
                    onClick={() => handleQuickView(application)}
                  >
                    <IconEye className="mr-1.5 h-3.5 w-3.5" />
                    Detailed View
                  </Button>

                  {/* Contextual Action Buttons */}
                  <div className="flex gap-2">
                    {application.status === "WAITLIST" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white font-medium"
                          onClick={() => handleStatusChangeInitiate(application, "APPROVED")}
                        >
                          <IconCheck className="mr-1 h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 h-8 text-xs font-medium"
                          onClick={() => handleStatusChangeInitiate(application, "REJECTED")}
                        >
                          <IconX className="mr-1 h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </>
                    )}

                    {application.status === "APPROVED" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1 h-8 text-xs bg-yellow-600 hover:bg-yellow-700 text-white font-medium"
                          onClick={() => handleStatusChangeInitiate(application, "WAITLIST")}
                        >
                          <IconClock className="mr-1 h-3.5 w-3.5" />
                          Waitlist
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 h-8 text-xs font-medium"
                          onClick={() => handleStatusChangeInitiate(application, "REJECTED")}
                        >
                          <IconX className="mr-1 h-3.5 w-3.5" />
                          Reject Pass
                        </Button>
                      </>
                    )}

                    {application.status === "REJECTED" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white font-medium"
                          onClick={() => handleStatusChangeInitiate(application, "APPROVED")}
                        >
                          <IconCheck className="mr-1 h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1 h-8 text-xs bg-yellow-600 hover:bg-yellow-700 text-white font-medium"
                          onClick={() => handleStatusChangeInitiate(application, "WAITLIST")}
                        >
                          <IconClock className="mr-1 h-3.5 w-3.5" />
                          Waitlist
                        </Button>
                      </>
                    )}

                    {application.status === "PENDING_PAYMENT" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white font-medium"
                          onClick={() => handleStatusChangeInitiate(application, "APPROVED")}
                        >
                          <IconCheck className="mr-1 h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 h-8 text-xs font-medium"
                          onClick={() => handleStatusChangeInitiate(application, "REJECTED")}
                        >
                          <IconX className="mr-1 h-3.5 w-3.5" />
                          Reject
                        </Button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0">
                              <IconSelector className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0" align="end">
                            <Command>
                              <CommandList>
                                <CommandGroup>
                                  <CommandItem onSelect={() => handleStatusChangeInitiate(application, "WAITLIST")}>
                                    <IconClock className="mr-2 h-4 w-4" />
                                    Set to Waitlist
                                  </CommandItem>
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center border border-dashed h-36 text-center text-muted-foreground text-sm rounded-md">
          No applications found.
        </div>
      )}

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
              You are changing this application status. This will immediately affect the applicant transport pass access.
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
              {targetStatus === "REJECTED" && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="rejection-reason">Rejection Reason (optional)</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Add a short reason for the applicant..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
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

      {/* Quick View Sheet */}
      <Sheet open={quickViewOpen} onOpenChange={setQuickViewOpen}>
        <SheetContent className="sm:max-w-[650px] gap-0 p-0 overflow-hidden flex flex-col h-full">
          {quickViewApplication && (
            <>
              <div className="bg-primary/5 p-6 border-b">
                <SheetHeader>
                  <div className="flex items-center justify-between mb-4 gap-2">
                    {getStatusBadge(quickViewApplication.status)}
                    <Badge variant="default" className="font-semibold text-[10px] bg-primary text-primary-foreground hover:bg-primary gap-1 select-none shrink-0">
                      <IconClock className="h-3 w-3" />
                      {quickViewApplication.appliedDate}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {quickViewApplication.userImage && <AvatarImage src={quickViewApplication.userImage} alt={quickViewApplication.fullName} />}
                      <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">
                        {quickViewApplication.fullName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <SheetTitle className="text-sm sm:text-base font-bold truncate text-foreground" title={quickViewApplication.fullName}>
                        {quickViewApplication.fullName}
                      </SheetTitle>
                      <div className="text-xs text-muted-foreground mt-1 flex flex-col gap-0.5">
                        <span className="truncate font-medium">
                          {getFormattedType(quickViewApplication.applicantType)} - {quickViewApplication.department}
                        </span>
                        {quickViewApplication.applicantType === "STUDENT" && quickViewApplication.studentId && (
                          <span className="truncate text-[11px] text-muted-foreground/80">
                            {quickViewApplication.batch} • {quickViewApplication.studentId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </SheetHeader>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* ID Card Section */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">ID Card</Label>
                  <div className="border rounded-lg bg-muted/30 p-4">
                    <img
                      src={quickViewApplication.idCardUrl}
                      alt="ID Card"
                      className="max-w-full h-auto rounded-lg mx-auto"
                    />
                  </div>
                </div>

                {/* Details Grid */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">Application Details</Label>
                  <div className="grid grid-cols-2 gap-4 border rounded-md p-4 bg-muted/20 text-xs">
                    {quickViewApplication.applicantType === "STUDENT" && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Batch</Label>
                          <p className="text-sm font-medium text-foreground">{quickViewApplication.batch || "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Student ID</Label>
                          <p className="text-sm font-medium text-foreground">{quickViewApplication.studentId || "—"}</p>
                        </div>
                      </>
                    )}
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Phone</Label>
                      <p className="text-sm font-medium text-foreground flex items-center gap-1">
                        {quickViewApplication.phone}
                        {quickViewApplication.phoneVerified && (
                          <IconCheck className="h-3 w-3 text-green-600 font-bold" />
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Route</Label>
                      <p className="text-sm font-medium text-foreground">{quickViewApplication.routeName}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-[10px] text-muted-foreground">Pickup Point</Label>
                      <p className="text-sm font-medium text-foreground">{quickViewApplication.pickupPointName}</p>
                    </div>
                  </div>
                </div>

                {/* Payment History Section */}
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-sm font-semibold text-foreground">Payment History</Label>
                  {quickViewApplication.payments && quickViewApplication.payments.length > 0 ? (
                    <div className="space-y-3">
                      {quickViewApplication.payments.map((p) => (
                        <div key={p.id} className="border rounded-md p-4 bg-muted/20 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-foreground">
                              {p.type === "INITIAL" ? "Initial Fee" : "Pass Renewal"}
                              {p.billingMonth && ` (${p.billingMonth})`}
                            </span>
                            {getPaymentStatusBadge(p.status)}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                            <div>
                              Amount: <span className="font-medium text-foreground">{p.amount} {p.currency}</span>
                            </div>
                            {p.method && (
                              <div>
                                Method: <span className="font-medium text-foreground">{p.method}</span>
                              </div>
                            )}
                            {p.transactionId && (
                              <div className="col-span-2">
                                Transaction ID: <span className="font-mono font-medium text-foreground">{p.transactionId}</span>
                              </div>
                            )}
                            <div className="col-span-2 flex flex-col gap-1 border-t pt-1.5 mt-1 text-[11px]">
                              <div>Requested: {p.createdAt}</div>
                              {p.paidAt && <div className="text-green-700 dark:text-green-400 font-medium">Paid: {p.paidAt}</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-md bg-muted/10">
                      No payments found for this application.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t bg-muted/20">
                <div className="flex gap-3">
                  {quickViewApplication.status === "WAITLIST" && (
                    <>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium"
                        onClick={() => {
                          setQuickViewOpen(false)
                          handleStatusChangeInitiate(quickViewApplication, "APPROVED")
                        }}
                      >
                        <IconCheck className="mr-1.5 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 font-medium"
                        onClick={() => {
                          setQuickViewOpen(false)
                          handleStatusChangeInitiate(quickViewApplication, "REJECTED")
                        }}
                      >
                        <IconX className="mr-1.5 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}

                  {quickViewApplication.status === "APPROVED" && (
                    <>
                      <Button
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-medium"
                        onClick={() => {
                          setQuickViewOpen(false)
                          handleStatusChangeInitiate(quickViewApplication, "WAITLIST")
                        }}
                      >
                        <IconClock className="mr-1.5 h-4 w-4" />
                        Waitlist
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 font-medium"
                        onClick={() => {
                          setQuickViewOpen(false)
                          handleStatusChangeInitiate(quickViewApplication, "REJECTED")
                        }}
                      >
                        <IconX className="mr-1.5 h-4 w-4" />
                        Reject Pass
                      </Button>
                    </>
                  )}

                  {quickViewApplication.status === "REJECTED" && (
                    <>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium"
                        onClick={() => {
                          setQuickViewOpen(false)
                          handleStatusChangeInitiate(quickViewApplication, "APPROVED")
                        }}
                      >
                        <IconCheck className="mr-1.5 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-medium"
                        onClick={() => {
                          setQuickViewOpen(false)
                          handleStatusChangeInitiate(quickViewApplication, "WAITLIST")
                        }}
                      >
                        <IconClock className="mr-1.5 h-4 w-4" />
                        Waitlist
                      </Button>
                    </>
                  )}

                  {quickViewApplication.status === "PENDING_PAYMENT" && (
                    <>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium"
                        onClick={() => {
                          setQuickViewOpen(false)
                          handleStatusChangeInitiate(quickViewApplication, "APPROVED")
                        }}
                      >
                        <IconCheck className="mr-1.5 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 font-medium"
                        onClick={() => {
                          setQuickViewOpen(false)
                          handleStatusChangeInitiate(quickViewApplication, "REJECTED")
                        }}
                      >
                        <IconX className="mr-1.5 h-4 w-4" />
                        Reject
                      </Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="h-9 w-9 p-0 shrink-0">
                            <IconSelector className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="end">
                          <Command>
                            <CommandList>
                              <CommandGroup>
                                <CommandItem
                                  onSelect={() => {
                                    setQuickViewOpen(false)
                                    handleStatusChangeInitiate(quickViewApplication, "WAITLIST")
                                  }}
                                >
                                  <IconClock className="mr-2 h-4 w-4" />
                                  Set to Waitlist
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

    </div>
  )
}

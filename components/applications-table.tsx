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
  IconCreditCard,
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
  status: z.enum(["WAITLIST", "APPROVED", "REJECTED"]),
  appliedDate: z.string(),
  idCardUrl: z.string(),
  routeCapacity: z.number().optional(),
  leftCapacity: z.number().optional(),
})

export type Application = z.infer<typeof applicationSchema>

export function ApplicationsTable({ data }: { data: Application[] }) {
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
  const searchRef = React.useRef<HTMLInputElement>(null)

  // Payment Request Dialog State
  const [paymentOpen, setPaymentOpen] = React.useState(false)
  const [paymentApplication, setPaymentApplication] = React.useState<Application | null>(null)
  const [semester, setSemester] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [isSendingPayment, setIsSendingPayment] = React.useState(false)

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
    }
  }, [data])

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

  const handlePaymentRequestInitiate = (application: Application) => {
    setPaymentApplication(application)
    setSemester("")
    setAmount("")
    setPaymentOpen(true)
  }

  const handleSendPaymentRequest = async () => {
    if (!paymentApplication || !semester || !amount) {
      toast.error("Please fill in all fields")
      return
    }

    setIsSendingPayment(true)
    try {
      const response = await fetch(`/api/admin/applications/${paymentApplication.id}/payment-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ semester, amount: parseFloat(amount) }),
      })

      if (!response.ok) {
        throw new Error("Failed to send payment request")
      }

      toast.success("Payment request sent successfully")
      setPaymentOpen(false)
      setSemester("")
      setAmount("")
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSendingPayment(false)
    }
  }

  const handleQuickView = (application: Application) => {
    setQuickViewApplication(application)
    setQuickViewOpen(true)
  }

  const getStatusBadge = (status: Application["status"]) => {
    const statusConfig = {
      WAITLIST: { label: "Needs review", color: "bg-yellow-500/15 text-yellow-700 border-yellow-500/25" },
      APPROVED: { label: "Awaiting payment", color: "bg-green-500/15 text-green-700 border-green-500/25" },
      REJECTED: { label: "Closed", color: "bg-red-500/15 text-red-700 border-red-500/25" },
    }

    const config = statusConfig[status]

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`${config.color} cursor-help`}>
              {status}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{status === "WAITLIST" ? "Needs review" : status === "APPROVED" ? "Awaiting payment" : "Closed"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const columns: ColumnDef<Application>[] = [
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
                Reject
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
                          Quick View
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

        if (status === "APPROVED") {
          return (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => handlePaymentRequestInitiate(application)}
              >
                <IconCreditCard className="mr-1 h-3 w-3" />
                Payment
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
                          Quick View
                        </CommandItem>
                        <CommandItem onSelect={() => handleStatusChangeInitiate(application, "REJECTED")}>
                          <IconX className="mr-2 h-4 w-4" />
                          Reject
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
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => handleQuickView(application)}
            >
              <IconEye className="mr-1 h-3 w-3" />
              View
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
                Waitlist ({statusCounts.waitlist})
              </SelectItem>
              <SelectItem value="APPROVED">
                Approved ({statusCounts.approved})
              </SelectItem>
              <SelectItem value="REJECTED">
                Rejected ({statusCounts.rejected})
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
                  className="h-12"
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

      {/* Payment Request Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Payment Request</DialogTitle>
            <DialogDescription>
              Send a payment request to the applicant for their transport pass.
            </DialogDescription>
          </DialogHeader>

          {paymentApplication && (
            <div className="py-4 space-y-4">
              <div className="flex flex-col gap-2 p-4 border rounded-md bg-muted/50">
                <span className="text-sm font-medium">Applicant: {paymentApplication.fullName}</span>
                <span className="text-sm text-muted-foreground">Student ID: {paymentApplication.studentId || "N/A"}</span>
                <span className="text-sm text-muted-foreground">Route: {paymentApplication.routeName}</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger id="semester">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Spring 2024">Spring 2024</SelectItem>
                    <SelectItem value="Summer 2024">Summer 2024</SelectItem>
                    <SelectItem value="Fall 2024">Fall 2024</SelectItem>
                    <SelectItem value="Spring 2025">Spring 2025</SelectItem>
                    <SelectItem value="Summer 2025">Summer 2025</SelectItem>
                    <SelectItem value="Fall 2025">Fall 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (BDT)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)} disabled={isSendingPayment} className="gap-2">
              Cancel
              <Kbd>Esc</Kbd>
            </Button>
            <Button onClick={handleSendPaymentRequest} disabled={isSendingPayment} className="gap-2">
              {isSendingPayment && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
              Send Request
              <Kbd>↵</Kbd>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick View Sheet */}
      <Sheet open={quickViewOpen} onOpenChange={setQuickViewOpen}>
        <SheetContent className="sm:max-w-[550px] gap-0 p-0 overflow-hidden flex flex-col h-full">
          {quickViewApplication && (
            <>
              <div className="bg-primary/5 p-6 border-b">
                <SheetHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      {quickViewApplication.userImage && <AvatarImage src={quickViewApplication.userImage} alt={quickViewApplication.fullName} />}
                      <AvatarFallback>{quickViewApplication.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <SheetTitle className="text-lg sm:text-xl font-bold truncate" title={quickViewApplication.fullName}>
                        {quickViewApplication.fullName}
                      </SheetTitle>
                      <SheetDescription className="truncate">
                        {quickViewApplication.applicantType} • {quickViewApplication.department}
                      </SheetDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(quickViewApplication.status)}
                    {quickViewApplication.phoneVerified && (
                      <Badge variant="default" className="gap-1 bg-green-600">
                        <IconCheck className="h-3 w-3" />
                        Phone Verified
                      </Badge>
                    )}
                    <Badge variant="outline" className="gap-1">
                      <IconClock className="h-3 w-3" />
                      {quickViewApplication.appliedDate}
                    </Badge>
                  </div>
                </SheetHeader>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* ID Card Section */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">ID Card</Label>
                  <div className="border rounded-lg bg-muted/30 p-4">
                    <img
                      src={quickViewApplication.idCardUrl}
                      alt="ID Card"
                      className="max-w-full h-auto rounded-lg mx-auto"
                    />
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {quickViewApplication.applicantType === "STUDENT" && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Batch</Label>
                        <p className="text-sm font-medium">{quickViewApplication.batch || "—"}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Student ID</Label>
                        <p className="text-sm font-medium">{quickViewApplication.studentId || "—"}</p>
                      </div>
                    </>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <p className="text-sm font-medium">{quickViewApplication.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Route</Label>
                    <p className="text-sm font-medium">{quickViewApplication.routeName}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs text-muted-foreground">Pickup Point</Label>
                    <p className="text-sm font-medium">{quickViewApplication.pickupPointName}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t bg-muted/20">
                {quickViewApplication.status === "WAITLIST" && (
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setQuickViewOpen(false)
                        handleStatusChangeInitiate(quickViewApplication, "APPROVED")
                      }}
                    >
                      <IconCheck className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setQuickViewOpen(false)
                        handleStatusChangeInitiate(quickViewApplication, "REJECTED")
                      }}
                    >
                      <IconX className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}

                {quickViewApplication.status === "APPROVED" && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      setQuickViewOpen(false)
                      handlePaymentRequestInitiate(quickViewApplication)
                    }}
                  >
                    <IconCreditCard className="mr-2 h-4 w-4" />
                    Send Payment Request
                  </Button>
                )}

                {quickViewApplication.status === "REJECTED" && (
                  <div className="text-center text-sm text-muted-foreground">
                    <p>This application has been rejected.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

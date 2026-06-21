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
  IconEye,
  IconClock,
  IconEdit,
  IconTrash,
  IconCurrencyTaka,
  IconReceipt,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { formatDateShort } from "@/lib/utils"

type Payment = {
  id: string
  applicationId: string
  amount: number
  currency: string
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED"
  method: "CASH" | "BKASH" | "NAGAD" | "ROCKET" | "BANK_TRANSFER" | "CARD" | null
  transactionId: string | null
  reference: string | null
  invoiceId: string | null
  invoiceNumber: string | null
  paymentUrl: string | null
  paidAt: string | null
  requestedAt: string
  notes: string | null
  application: {
    fullName: string
    department: string
    applicantType: string
    user: {
      name: string
      email: string
      image: string | null
    }
    route: {
      name: string
    }
    pickupPoint: {
      name: string
    }
  }
}

type GatewayPayment = {
  tran_id?: string
  amount?: string
  status?: string
  card_type?: string
  bank_tran_id?: string
  val_id?: string
  tran_date?: string
}

type GatewayDetails = {
  element?: GatewayPayment[]
  error?: string
  message?: string
  paymentUrl?: string
}

export function PaymentsTable({ data }: { data: Payment[] }) {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  
  // Edit payment dialog
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null)
  const [isUpdating, setIsUpdating] = React.useState(false)
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [paymentToDelete, setPaymentToDelete] = React.useState<Payment | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [gatewayOpen, setGatewayOpen] = React.useState(false)
  const [gatewayLoading, setGatewayLoading] = React.useState(false)
  const [gatewayData, setGatewayData] = React.useState<GatewayDetails | null>(null)

  // Form state for editing
  const [editForm, setEditForm] = React.useState({
    status: "",
    method: "",
    transactionId: "",
    reference: "",
    notes: "",
    amount: "",
  })

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment)
    setEditForm({
      status: payment.status,
      method: payment.method || "",
      transactionId: payment.transactionId || "",
      reference: payment.reference || "",
      notes: payment.notes || "",
      amount: payment.amount.toString(),
    })
    setEditDialogOpen(true)
  }

  const handleUpdatePayment = async () => {
    if (!selectedPayment) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/payments/${selectedPayment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editForm.status,
          method: editForm.method || null,
          transactionId: editForm.transactionId || null,
          reference: editForm.reference || null,
          notes: editForm.notes || null,
          amount: parseFloat(editForm.amount),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update payment")
      }

      toast.success("Payment updated successfully")
      setEditDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to update payment")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!paymentToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/payments/${paymentToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete payment")
      }

      toast.success("Payment deleted successfully")
      setDeleteDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete payment")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleGatewayDetails = async (payment: Payment) => {
    setGatewayOpen(true)
    setGatewayLoading(true)
    setGatewayData(null)
    try {
      const response = await fetch(`/api/admin/payments/${payment.id}/sslcommerz`)
      const data = await response.json()
      if (!response.ok) {
        setGatewayData(data)
        return
      }
      setGatewayData(data)
    } catch (error) {
      toast.error("Failed to load SSLCommerz details")
    } finally {
      setGatewayLoading(false)
    }
  }

  const getStatusBadge = (status: Payment["status"]) => {
    const variants = {
      PENDING: "bg-muted text-muted-foreground border-border",
      PAID: "bg-primary/15 text-primary border-primary/25",
      FAILED: "bg-destructive/15 text-destructive border-destructive/25",
      REFUNDED: "bg-accent/15 text-accent-foreground border-accent/25",
    }
    return (
      <Badge variant="outline" className={variants[status]}>
        {status}
      </Badge>
    )
  }

  const getMethodBadge = (method: Payment["method"]) => {
    if (!method) return <span className="text-muted-foreground text-xs">—</span>
    
    const colors = {
      CASH: "bg-muted text-muted-foreground border-border",
      BKASH: "bg-primary/15 text-primary border-primary/25",
      NAGAD: "bg-primary/10 text-primary border-primary/20",
      ROCKET: "bg-accent/15 text-accent-foreground border-accent/25",
      BANK_TRANSFER: "bg-secondary text-secondary-foreground border-border",
      CARD: "bg-secondary text-secondary-foreground border-border",
    }
    
    return (
      <Badge variant="outline" className={colors[method]}>
        {method.replace("_", " ")}
      </Badge>
    )
  }

  const columns: ColumnDef<Payment>[] = [
    {
      id: "payee",
      accessorKey: "application.user.name",
      accessorFn: (row) =>
        [
          row.application.fullName,
          row.application.user.email,
          row.transactionId ?? "",
        ]
          .join(" ")
          .toLowerCase(),
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 hover:bg-transparent"
          >
            Student/Staff
            <IconSelector className="ml-2 h-3.5 w-3.5" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const user = row.original.application.user
        const fullName = row.original.application.fullName
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image || ""} />
              <AvatarFallback className="text-xs">
                {fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{fullName}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "application.department",
      header: "Department",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm">{row.original.application.department}</span>
          <span className="text-xs text-muted-foreground capitalize">
            {row.original.application.applicantType.toLowerCase()}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "application.route.name",
      header: "Route",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.original.application.route.name}</span>
          <span className="text-xs text-muted-foreground">{row.original.application.pickupPoint.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 hover:bg-transparent"
          >
            Amount
            <IconSelector className="ml-2 h-3.5 w-3.5" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-1 font-semibold">
          <IconCurrencyTaka className="h-4 w-4" />
          <span>{row.original.amount.toLocaleString()}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "method",
      header: "Method",
      cell: ({ row }) => getMethodBadge(row.original.method),
    },
    {
      accessorKey: "transactionId",
      header: "Transaction ID",
      cell: ({ row }) => (
        <span className="text-xs font-mono">
          {row.original.transactionId || "—"}
        </span>
      ),
    },
    {
      accessorKey: "requestedAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 hover:bg-transparent"
          >
            Requested
            <IconSelector className="ml-2 h-3.5 w-3.5" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.original.requestedAt)
        return (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <IconClock className="h-3 w-3" />
            {formatDateShort(date)}
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const payment = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(payment)}
              className="h-8 w-8 p-0"
            >
              <IconEdit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleGatewayDetails(payment)}
              className="h-8 w-8 p-0"
              title="SSLCommerz Details"
            >
              <IconReceipt className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPaymentToDelete(payment)
                setDeleteDialogOpen(true)
              }}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <IconTrash className="h-4 w-4" />
            </Button>
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
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-xs text-muted-foreground">Manage payment records and transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or transaction ID..."
            value={(table.getColumn("payee")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("payee")?.setFilterValue(event.target.value)
            }
            className="pl-8 h-9 text-xs"
          />
        </div>
        <Select
          value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
          onValueChange={(value) =>
            table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="h-9 w-[140px] text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
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
                  No payments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="hidden flex-1 text-xs text-muted-foreground lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex w-full items-center gap-3 sm:gap-6 lg:w-fit lg:gap-8">
          <div className="hidden items-center gap-2 lg:flex">
            <p className="text-xs font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-w-0 flex-1 items-center text-xs font-medium sm:flex-none sm:justify-center">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Payment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Payment</DialogTitle>
            <DialogDescription>
              Update payment status and transaction details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (BDT)</Label>
              <Input
                id="amount"
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select
                value={editForm.method}
                onValueChange={(value) => setEditForm({ ...editForm, method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BKASH">bKash</SelectItem>
                  <SelectItem value="NAGAD">Nagad</SelectItem>
                  <SelectItem value="ROCKET">Rocket</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                value={editForm.transactionId}
                onChange={(e) => setEditForm({ ...editForm, transactionId: e.target.value })}
                placeholder="e.g., TXN123456789"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                value={editForm.reference}
                onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })}
                placeholder="Additional reference"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePayment} disabled={isUpdating}>
              {isUpdating && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
              Update Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this payment record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SSLCommerz Details Dialog */}
      <Dialog open={gatewayOpen} onOpenChange={setGatewayOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>SSLCommerz Details</DialogTitle>
            <DialogDescription>Live details from the payment gateway.</DialogDescription>
          </DialogHeader>
          {gatewayLoading ? (
            <div className="py-6 text-sm text-muted-foreground">Loading details...</div>
          ) : gatewayData?.element?.[0] ? (
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono">{gatewayData.element[0].tran_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span>{gatewayData.element[0].amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span>{gatewayData.element[0].status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Card Type</span>
                <span>{gatewayData.element[0].card_type || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank Transaction ID</span>
                <span className="font-mono">{gatewayData.element[0].bank_tran_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Validation ID</span>
                <span>{gatewayData.element[0].val_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{gatewayData.element[0].tran_date}</span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-sm text-muted-foreground">
              {gatewayData?.error || gatewayData?.message || "No details available."}
              {gatewayData?.paymentUrl && (
                <div className="mt-3">
                  <a
                    href={gatewayData.paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    Open Payment Link
                  </a>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setGatewayOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

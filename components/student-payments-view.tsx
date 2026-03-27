"use client"

import * as React from "react"
import { IconCreditCard, IconLoader, IconCheck, IconAlertCircle, IconCurrencyTaka, IconReceipt } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { formatDateShort } from "@/lib/utils"

type Payment = {
  id: string
  amount: number
  currency: string
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED"
  method: string | null
  invoiceId: string | null
  transactionId: string | null
  senderNumber: string | null
  paidAt: string | null
  requestedAt: string
  notes: string | null
}

type Application = {
  id: string
  fullName: string
  applicantType: string
  department: string
  batch: string | null
  studentId: string | null
  status: string
  route: {
    name: string
  }
  pickupPoint: {
    name: string
  }
}

export function StudentPaymentsView({
  application,
  payments,
}: {
  application: Application
  payments: Payment[]
}) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handlePayNow = async (paymentId: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to initiate payment")
      }

      // Redirect to payment gateway
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate payment")
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: Payment["status"]) => {
    const variants = {
      PENDING: "bg-yellow-500/15 text-yellow-700 border-yellow-500/25",
      PAID: "bg-green-500/15 text-green-700 border-green-500/25",
      FAILED: "bg-red-500/15 text-red-700 border-red-500/25",
      REFUNDED: "bg-blue-500/15 text-blue-700 border-blue-500/25",
    }
    return (
      <Badge variant="outline" className={variants[status]}>
        {status}
      </Badge>
    )
  }

  const pendingPayment = payments.find((p) => p.status === "PENDING")
  const paidPayments = payments.filter((p) => p.status === "PAID")

  // Check if user is a student
  const isStudent = application.applicantType === "STUDENT"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">Manage your transport pass payments</p>
      </div>

      {/* Application Info */}
      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
          <CardDescription>Your transport pass application information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium">{application.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{application.applicantType.toLowerCase()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Department</p>
              <p className="font-medium">{application.department}</p>
            </div>
            {application.studentId && (
              <div>
                <p className="text-xs text-muted-foreground">Student ID</p>
                <p className="font-medium">{application.studentId}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Route</p>
              <p className="font-medium">{application.route.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pickup Point</p>
              <p className="font-medium">{application.pickupPoint.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t">
            <p className="text-sm text-muted-foreground">Application Status:</p>
            <Badge variant="outline" className={
              application.status === "APPROVED" ? "bg-green-500/15 text-green-700 border-green-500/25" :
              application.status === "REJECTED" ? "bg-red-500/15 text-red-700 border-red-500/25" :
              "bg-yellow-500/15 text-yellow-700 border-yellow-500/25"
            }>
              {application.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Free Pass Notice for Non-Students */}
      {!isStudent && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <IconCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">Free Transport Pass</h3>
              <p className="text-sm text-green-700">
                As an {application.applicantType.toLowerCase()} member, you are eligible for a free transport pass. No payment is required.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Payment */}
      {isStudent && pendingPayment && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconAlertCircle className="h-5 w-5 text-yellow-600" />
              Payment Required
            </CardTitle>
            <CardDescription>Complete your payment to activate your transport pass</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
              <div>
                <p className="text-sm text-muted-foreground">Amount Due</p>
                <div className="flex items-center gap-1 text-2xl font-bold">
                  <IconCurrencyTaka className="h-6 w-6" />
                  <span>{pendingPayment.amount.toLocaleString()}</span>
                </div>
                {pendingPayment.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{pendingPayment.notes}</p>
                )}
              </div>
              <div className="text-right">
                {getStatusBadge(pendingPayment.status)}
                <p className="text-xs text-muted-foreground mt-2">
                  Requested: {formatDateShort(pendingPayment.requestedAt)}
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => handlePayNow(pendingPayment.id)}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <IconLoader className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <IconCreditCard className="mr-2 h-5 w-5" />
                  Pay Now
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {paidPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Your completed payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paidPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <IconCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 font-semibold">
                          <IconCurrencyTaka className="h-4 w-4" />
                          <span>{payment.amount.toLocaleString()}</span>
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {payment.notes || "Transport Pass Payment"}
                      </p>
                      {payment.transactionId && (
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          TXN: {payment.transactionId}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {payment.method && (
                      <Badge variant="outline" className="mb-1">
                        {payment.method}
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {payment.paidAt ? formatDateShort(payment.paidAt) : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Payments */}
      {isStudent && payments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <IconReceipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Payments Yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Once the admin creates a payment request for your application, it will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}



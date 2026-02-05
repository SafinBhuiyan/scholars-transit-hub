"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { IconCheck, IconLoader, IconAlertCircle } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const applicationId = searchParams.get("applicationId")
  const invoiceId = searchParams.get("invoice_id")
  
  const [isVerifying, setIsVerifying] = React.useState(true)
  const [paymentStatus, setPaymentStatus] = React.useState<"success" | "pending" | "failed">("pending")

  React.useEffect(() => {
    if (invoiceId) {
      verifyPayment()
    } else {
      setIsVerifying(false)
      setPaymentStatus("pending")
    }
  }, [invoiceId])

  const verifyPayment = async () => {
    try {
      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      })

      const result = await response.json()

      if (result.success && result.status === "PAID") {
        setPaymentStatus("success")
        toast.success("Payment verified successfully!")
      } else {
        setPaymentStatus("pending")
        toast.info("Payment is being processed. Please check back later.")
      }
    } catch (error) {
      console.error("Verification error:", error)
      setPaymentStatus("failed")
      toast.error("Failed to verify payment")
    } finally {
      setIsVerifying(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconLoader className="h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-sm text-muted-foreground text-center">
              Please wait while we verify your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {paymentStatus === "success" ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <IconCheck className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Payment Successful!</CardTitle>
              <CardDescription>
                Your payment has been processed successfully.
              </CardDescription>
            </>
          ) : paymentStatus === "pending" ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                <IconLoader className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl">Payment Processing</CardTitle>
              <CardDescription>
                Your payment is being processed. This may take a few minutes.
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <IconAlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Verification Failed</CardTitle>
              <CardDescription>
                We couldn't verify your payment. Please contact support.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {invoiceId && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-xs text-muted-foreground mb-1">Invoice ID</p>
              <p className="font-mono text-sm">{invoiceId}</p>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Button onClick={() => router.push("/dashboard/pass")} className="w-full">
              View My Pass
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

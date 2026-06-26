import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { validatePayment } from "@/lib/sslcommerz"

async function readCallbackData(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const contentType = request.headers.get("content-type") || ""

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData()
    return {
      valId: formData.get("val_id")?.toString() || searchParams.get("val_id"),
      tranId: formData.get("tran_id")?.toString() || searchParams.get("tran_id"),
    }
  }

  if (contentType.includes("application/json")) {
    const body = await request.json()
    return {
      valId: body.val_id || searchParams.get("val_id"),
      tranId: body.tran_id || searchParams.get("tran_id"),
    }
  }

  return {
    valId: searchParams.get("val_id"),
    tranId: searchParams.get("tran_id"),
  }
}

async function handleSuccess(request: NextRequest) {
  const { valId, tranId } = await readCallbackData(request)
  const redirectUrl = new URL("/dashboard/payment/success", request.nextUrl.origin)

  if (tranId) {
    redirectUrl.searchParams.set("invoice_id", tranId)
  }

  if (!valId || !tranId) {
    return NextResponse.redirect(redirectUrl)
  }

  try {
    const validation = await validatePayment(valId)
    const status = validation.status?.toUpperCase()

    if ((status === "VALID" || status === "VALIDATED") && validation.tran_id === tranId) {
      const payment = await prisma.payment.findUnique({
        where: { invoiceId: tranId },
        select: {
          id: true,
          status: true,
          type: true,
          application: {
            select: {
              id: true,
              userId: true,
              status: true,
            },
          },
        },
      })

      if (payment && payment.status !== "PAID") {
        const now = new Date()
        const billingEnd = new Date(now)
        billingEnd.setDate(billingEnd.getDate() + 30)
        const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

        // Mark payment as PAID with billing dates
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            transactionId: validation.bank_tran_id || validation.val_id || null,
            method: validation.card_type ? "CARD" : null,
            senderNumber: null,
            paidAt: validation.tran_date ? new Date(validation.tran_date) : now,
            billingStart: now,
            billingEnd: billingEnd,
            billingMonth: billingMonth,
          },
        })

        // For INITIAL payments: promote application from PENDING_PAYMENT → WAITLIST
        if (payment.type === "INITIAL" && payment.application.status === "PENDING_PAYMENT") {
          await prisma.transportApplication.update({
            where: { id: payment.application.id },
            data: { status: "WAITLIST" },
          })

          await prisma.notification.create({
            data: {
              userId: payment.application.userId,
              title: "Payment Received",
              message: "Your payment was successful. Your application is now under review.",
            },
          })
        }

        // For RENEWAL payments: extend billing period
        if (payment.type === "RENEWAL") {
          await prisma.notification.create({
            data: {
              userId: payment.application.userId,
              title: "Pass Renewed",
              message: `Your transport pass has been renewed until ${billingEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.`,
            },
          })
        }
      }
    }
  } catch (error) {
    console.error("Payment validation error:", error)
  }

  return NextResponse.redirect(redirectUrl, 303)
}

export async function GET(request: NextRequest) {
  return handleSuccess(request)
}

export async function POST(request: NextRequest) {
  return handleSuccess(request)
}

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

  const validation = await validatePayment(valId)
  const status = validation.status?.toUpperCase()

  if ((status === "VALID" || status === "VALIDATED") && validation.tran_id === tranId) {
    const payment = await prisma.payment.findUnique({
      where: { invoiceId: tranId },
      select: {
        id: true,
        status: true,
        application: {
          select: {
            userId: true,
          },
        },
      },
    })

    await prisma.payment.updateMany({
      where: { invoiceId: tranId },
      data: {
        status: "PAID",
        transactionId: validation.bank_tran_id || validation.val_id || null,
        method: validation.card_type ? "CARD" : null,
        senderNumber: null,
        paidAt: validation.tran_date ? new Date(validation.tran_date) : new Date(),
      },
    })

    if (payment && payment.status !== "PAID") {
      await prisma.notification.create({
        data: {
          userId: payment.application.userId,
          title: "Payment Successful",
          message: "Your transport pass is now active.",
        },
      })
    }
  }

  return NextResponse.redirect(redirectUrl)
}

export async function GET(request: NextRequest) {
  return handleSuccess(request)
}

export async function POST(request: NextRequest) {
  return handleSuccess(request)
}

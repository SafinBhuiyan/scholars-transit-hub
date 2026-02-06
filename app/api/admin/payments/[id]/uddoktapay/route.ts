import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { verifyPayment } from "@/lib/uddoktapay"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const payment = await prisma.payment.findUnique({
      where: { id },
      select: { invoiceId: true, paymentUrl: true },
    })

    if (!payment?.invoiceId) {
      return NextResponse.json(
        {
          error: "Invoice ID not found for this payment",
          paymentUrl: payment?.paymentUrl || null,
        },
        { status: 404 }
      )
    }

    const result = await verifyPayment(payment.invoiceId)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to fetch UddoktaPay details:", error)
    return NextResponse.json({ error: "Failed to fetch UddoktaPay details" }, { status: 500 })
  }
}

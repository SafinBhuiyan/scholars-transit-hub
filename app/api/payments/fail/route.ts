import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

async function readTranId(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const contentType = request.headers.get("content-type") || ""

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData()
    return formData.get("tran_id")?.toString() || searchParams.get("tran_id")
  }

  if (contentType.includes("application/json")) {
    const body = await request.json()
    return body.tran_id || searchParams.get("tran_id")
  }

  return searchParams.get("tran_id")
}

async function handleFail(request: NextRequest) {
  const tranId = await readTranId(request)

  if (tranId) {
    await prisma.payment.updateMany({
      where: { invoiceId: tranId },
      data: { status: "FAILED" },
    })
  }

  const redirectUrl = new URL("/dashboard/payment/cancel", request.nextUrl.origin)
  if (tranId) redirectUrl.searchParams.set("invoice_id", tranId)
  return NextResponse.redirect(redirectUrl)
}

export async function GET(request: NextRequest) {
  return handleFail(request)
}

export async function POST(request: NextRequest) {
  return handleFail(request)
}

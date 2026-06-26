import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { generateInvoiceNumber, getGatewayUrl, initiatePayment } from "@/lib/sslcommerz"

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() })

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Find user's approved application
        const application = await prisma.transportApplication.findFirst({
            where: {
                userId: session.user.id,
                status: "APPROVED",
            },
            include: {
                route: {
                    select: { fees: true, name: true },
                },
                user: true,
            },
        })

        if (!application) {
            return NextResponse.json(
                { error: "No approved application found" },
                { status: 404 }
            )
        }

        if (application.route.fees <= 0) {
            return NextResponse.json(
                { error: "Route fees not configured" },
                { status: 400 }
            )
        }

        // Check if there's already a pending renewal payment
        const pendingRenewal = await prisma.payment.findFirst({
            where: {
                applicationId: application.id,
                type: "RENEWAL",
                status: "PENDING",
            },
        })

        if (pendingRenewal) {
            // If there's an existing pending renewal with a payment URL, reuse it
            if (pendingRenewal.paymentUrl) {
                return NextResponse.json({
                    paymentUrl: pendingRenewal.paymentUrl,
                    invoiceId: pendingRenewal.invoiceId,
                })
            }
        }

        // Find latest billing end to extend from
        const latestPaidPayment = await prisma.payment.findFirst({
            where: {
                applicationId: application.id,
                status: "PAID",
                billingEnd: { not: null },
            },
            orderBy: { billingEnd: "desc" },
        })

        const invoiceNumber = generateInvoiceNumber(application.id)
        const now = new Date()

        // Calculate billing period: extend from latest billingEnd or from now
        const billingStart = latestPaidPayment?.billingEnd && new Date(latestPaidPayment.billingEnd) > now
            ? new Date(latestPaidPayment.billingEnd)
            : now
        const billingEnd = new Date(billingStart)
        billingEnd.setDate(billingEnd.getDate() + 30)

        const billingMonth = `${billingStart.getFullYear()}-${String(billingStart.getMonth() + 1).padStart(2, "0")}`

        // Create renewal payment
        const payment = await prisma.payment.create({
            data: {
                applicationId: application.id,
                type: "RENEWAL",
                amount: application.route.fees,
                invoiceId: invoiceNumber,
                invoiceNumber: invoiceNumber,
                billingStart,
                billingEnd,
                billingMonth,
                notes: `Monthly renewal for ${application.route.name}`,
                status: "PENDING",
            },
        })

        // Initiate SSLCommerz payment
        const sslResponse = await initiatePayment({
            amount: application.route.fees.toString(),
            tranId: invoiceNumber,
            fullName: application.fullName,
            email: application.user.email,
            phone: application.phone,
            applicationId: application.id,
            productName: `Transport Pass Renewal - ${application.route.name} (Monthly)`,
        })

        const gatewayUrl = getGatewayUrl(sslResponse)

        if (sslResponse.status !== "SUCCESS" || !gatewayUrl) {
            await prisma.payment.delete({ where: { id: payment.id } })
            throw new Error(sslResponse.failedreason || "Failed to initiate renewal payment")
        }

        await prisma.payment.update({
            where: { id: payment.id },
            data: { paymentUrl: gatewayUrl },
        })

        return NextResponse.json({
            success: true,
            paymentUrl: gatewayUrl,
            invoiceId: invoiceNumber,
        })
    } catch (error) {
        console.error("Failed to initiate renewal:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to initiate renewal" },
            { status: 500 }
        )
    }
}

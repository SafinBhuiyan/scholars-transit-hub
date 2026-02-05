import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() })

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        const body = await request.json()
        const { semester, amount } = body

        if (!semester || !amount) {
            return NextResponse.json({ error: "Semester and amount are required" }, { status: 400 })
        }

        if (amount <= 0) {
            return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
        }

        // Check if application exists and is approved
        const application = await prisma.transportApplication.findUnique({
            where: { id },
            include: {
                user: true,
            },
        })

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 })
        }

        if (application.status !== "APPROVED") {
            return NextResponse.json(
                { error: "Only approved applications can have payment requests" },
                { status: 400 }
            )
        }

        // Only students need to pay - academic and administrative staff get free passes
        if (application.applicantType !== "STUDENT") {
            return NextResponse.json(
                { error: "Only students need to make payment. Academic and administrative staff get free passes." },
                { status: 400 }
            )
        }

        // Check if payment already exists
        const existingPayment = await prisma.payment.findFirst({
            where: {
                applicationId: id,
                status: {
                    in: ["PENDING", "PAID"],
                },
            },
        })

        if (existingPayment) {
            return NextResponse.json(
                { error: "Payment request already exists for this application" },
                { status: 400 }
            )
        }

        // Create payment record
        const payment = await prisma.payment.create({
            data: {
                applicationId: id,
                amount: parseFloat(amount),
                notes: `Payment for ${semester} semester`,
                status: "PENDING",
            },
            include: {
                application: {
                    include: {
                        user: true,
                        route: true,
                        pickupPoint: true,
                    },
                },
            },
        })

        console.log("Payment request created:", {
            paymentId: payment.id,
            applicationId: id,
            applicantName: application.fullName,
            semester,
            amount,
            createdBy: session.user.name,
        })

        return NextResponse.json({
            success: true,
            message: "Payment request sent successfully",
            data: payment,
        })
    } catch (error) {
        console.error("Error sending payment request:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

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

        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR")) {
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

        // Check if application exists
        const application = await prisma.transportApplication.findUnique({
            where: { id }
        })

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 })
        }

        // In a real application, you would:
        // 1. Create a payment record in the database
        // 2. Send an email/SMS notification to the applicant
        // 3. Create a payment link or QR code

        // For now, we'll just log the payment request
        console.log("Payment request sent:", {
            applicationId: id,
            applicantName: application.fullName,
            semester,
            amount,
            sentBy: session.user.name,
        })

        return NextResponse.json({
            success: true,
            message: "Payment request sent successfully",
            data: {
                applicationId: id,
                semester,
                amount,
            }
        })
    } catch (error) {
        console.error("Error sending payment request:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

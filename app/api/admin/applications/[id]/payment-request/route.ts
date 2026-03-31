import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { renderEmailTemplate, sendEmail } from "@/lib/email"
import { generateInvoiceNumber } from "@/lib/uddoktapay"

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
        const { semesterId, amount } = body

        if (!semesterId || !amount) {
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

        const semester = await prisma.semester.findUnique({
            where: { id: semesterId },
        })

        if (!semester) {
            return NextResponse.json({ error: "Semester not found" }, { status: 404 })
        }

        // Create payment record
        const payment = await prisma.payment.create({
            data: {
                applicationId: id,
                amount: parseFloat(amount),
                semesterId: semester.id,
                invoiceNumber: generateInvoiceNumber(id),
                notes: `Payment for ${semester.name} semester`,
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

        try {
            await sendEmail({
                from: "ScholarsPass <no-reply@divupstudio.online>",
                to: [application.user.email],
                subject: "Payment Request for Your Transport Pass Application",
                html: renderEmailTemplate({
                    title: "Payment Request",
                    greetingName: application.fullName,
                    bodyHtml: `
                      <p>Your transport pass application has been approved.</p>
                      <p>Please complete the payment below to continue with pass issuance.</p>
                      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                        <p style="margin: 0;"><strong>Semester:</strong> ${semester.name}</p>
                        <p style="margin: 8px 0 0;"><strong>Amount:</strong> ${amount} BDT</p>
                      </div>
                      <a href="https://www.divupstudio.online/dashboard/payments" style="display: inline-block; padding: 12px 18px; background: #5C60DB; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
                        Pay Now
                      </a>
                      <p style="margin-top: 16px;">If you have already completed the payment, you can safely ignore this message.</p>
                    `,
                }),
            })
        } catch (emailError) {
            console.error("Failed to send payment request email:", emailError)
        }

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

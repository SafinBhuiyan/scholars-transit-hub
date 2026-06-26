import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateInvoiceNumber, getGatewayUrl, initiatePayment } from "@/lib/sslcommerz"

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() })

        if (!session || session.user.role !== "USER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const {
            applicantType,
            fullName,
            department,
            batch,
            studentId,
            phone,
            phoneVerified,
            idCardUrl,
            routeId,
            pickupPointId,
        } = body

        // Validate required fields based on applicant type
        if (!applicantType || !fullName || !department || !phone || !phoneVerified || !idCardUrl || !routeId || !pickupPointId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        if (applicantType === "STUDENT" && (!batch || !studentId)) {
            return NextResponse.json({ error: "Batch and Student ID are required for students" }, { status: 400 })
        }

        // Check if student ID is already used by another application
        if (applicantType === "STUDENT" && studentId) {
            const existingStudentId = await prisma.transportApplication.findFirst({
                where: {
                    studentId: studentId
                }
            })

            if (existingStudentId) {
                return NextResponse.json({ error: "This Student ID is already registered for a transport pass" }, { status: 400 })
            }
        }

        // Check if user already has a pending or approved application
        const existingApplication = await prisma.transportApplication.findFirst({
            where: {
                userId: session.user.id,
                status: { in: ["PENDING_PAYMENT", "WAITLIST", "APPROVED"] }
            }
        })

        if (existingApplication) {
            return NextResponse.json({ error: "You already have an active application" }, { status: 400 })
        }

        // Get route to determine fees
        const route = await prisma.route.findUnique({
            where: { id: routeId },
            select: { fees: true, name: true }
        })

        if (!route) {
            return NextResponse.json({ error: "Route not found" }, { status: 404 })
        }

        if (route.fees <= 0) {
            return NextResponse.json({ error: "Route fees not configured" }, { status: 400 })
        }

        // Create application with PENDING_PAYMENT status
        const application = await prisma.transportApplication.create({
            data: {
                userId: session.user.id,
                applicantType,
                fullName,
                department,
                batch,
                studentId,
                phone,
                phoneVerified,
                idCardUrl,
                routeId,
                pickupPointId,
                status: "PENDING_PAYMENT",
            },
        })

        // Create initial payment record
        const invoiceNumber = generateInvoiceNumber(application.id)
        const payment = await prisma.payment.create({
            data: {
                applicationId: application.id,
                type: "INITIAL",
                amount: route.fees,
                invoiceId: invoiceNumber,
                invoiceNumber: invoiceNumber,
                notes: `Initial payment for ${route.name}`,
                status: "PENDING",
            },
        })

        // Initiate SSLCommerz payment
        const sslResponse = await initiatePayment({
            amount: route.fees.toString(),
            tranId: invoiceNumber,
            fullName,
            email: session.user.email,
            phone,
            applicationId: application.id,
            productName: `Transport Pass - ${route.name} (Monthly)`,
        })

        const gatewayUrl = getGatewayUrl(sslResponse)

        if (sslResponse.status !== "SUCCESS" || !gatewayUrl) {
            // Clean up if SSLCommerz initiation fails
            await prisma.payment.delete({ where: { id: payment.id } })
            await prisma.transportApplication.delete({ where: { id: application.id } })
            throw new Error(sslResponse.failedreason || "Failed to initiate payment")
        }

        // Save the payment URL
        await prisma.payment.update({
            where: { id: payment.id },
            data: { paymentUrl: gatewayUrl },
        })

        return NextResponse.json({
            application,
            paymentUrl: gatewayUrl,
            invoiceId: invoiceNumber,
        }, { status: 201 })
    } catch (error) {
        console.error("Error creating application:", error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal server error"
        }, { status: 500 })
    }
}

export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() })

        if (!session || session.user.role !== "USER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const application = await prisma.transportApplication.findFirst({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            include: {
                route: {
                    include: {
                        pickupPoints: {
                            where: { isActive: true },
                            orderBy: { order: "asc" }
                        }
                    }
                },
                pickupPoint: true,
                payments: {
                    orderBy: { createdAt: "desc" },
                },
            }
        })

        return NextResponse.json({ application })
    } catch (error) {
        console.error("Error fetching application:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() })

        if (!session || session.user.role !== "USER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Find pending application
        const application = await prisma.transportApplication.findFirst({
            where: { 
                userId: session.user.id, 
                status: "PENDING_PAYMENT" 
            }
        })

        if (!application) {
            return NextResponse.json({ error: "No pending application found" }, { status: 404 })
        }

        await prisma.transportApplication.delete({
            where: { id: application.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting application:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

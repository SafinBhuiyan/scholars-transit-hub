import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { renderEmailTemplate, sendEmail } from "@/lib/email"
import { generateInvoiceNumber } from "@/lib/sslcommerz"

const STUDENT_PAYMENT_AMOUNT = 100

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() })

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { status, reason } = body

        if (!status || !["WAITLIST", "APPROVED", "REJECTED"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 })
        }

        const { id } = await params

        const currentApplication = await prisma.transportApplication.findUnique({
            where: { id },
            include: {
                route: {
                    select: {
                        capacity: true,
                    },
                },
            },
        })

        if (!currentApplication) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 })
        }

        if (status === "APPROVED" && currentApplication.status !== "APPROVED") {
            const approvedCount = await prisma.transportApplication.count({
                where: {
                    routeId: currentApplication.routeId,
                    status: "APPROVED",
                },
            })

            if (approvedCount >= currentApplication.route.capacity) {
                return NextResponse.json(
                    { error: "Route capacity has been reached. This application cannot be approved." },
                    { status: 400 }
                )
            }
        }

        const application = await prisma.transportApplication.update({
            where: { id },
            data: { status },
            include: {
                user: true,
            },
        })

        if (status === "APPROVED") {
            await prisma.notification.create({
                data: {
                    userId: application.userId,
                    title: "Application Approved",
                    message: application.applicantType === "STUDENT"
                        ? "Please complete payment to activate your pass."
                        : "Your pass is now active.",
                },
            })
        }

        if (status === "REJECTED") {
            await prisma.notification.create({
                data: {
                    userId: application.userId,
                    title: "Application Rejected",
                    message: "Your transport application has been rejected.",
                },
            })
        }

        if (status === "APPROVED" && application.applicantType === "STUDENT") {
            const existingPayment = await prisma.payment.findFirst({
                where: {
                    applicationId: application.id,
                    status: {
                        in: ["PENDING", "PAID"],
                    },
                },
            })

            if (!existingPayment) {
                await prisma.payment.create({
                    data: {
                        applicationId: application.id,
                        amount: STUDENT_PAYMENT_AMOUNT,
                        invoiceNumber: generateInvoiceNumber(application.id),
                        notes: "System-generated transport pass payment",
                        status: "PENDING",
                    },
                })
            }
        }

        if (application.user?.email) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000"
            if (status === "REJECTED") {
                await sendEmail({
                    from: "ScholarsPass <no-reply@divupstudio.online>",
                    to: [application.user.email],
                    subject: "Update on Your Transport Pass Application",
                    html: renderEmailTemplate({
                        title: "Application Update",
                        greetingName: application.fullName,
                        bodyHtml: `
                          <p>Thank you for your interest in the ScholarsPass transport service.</p>
                          <p>After review, we are unable to approve your application at this time.</p>
                          ${reason ? `<div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
                            <p style="margin: 0; color: #b91c1c;"><strong>Review note:</strong> ${reason}</p>
                          </div>` : ""}
                          <p>If you believe this was sent in error or would like clarification, please contact the transport office or check your dashboard for updates.</p>
                          <p style="margin-top: 12px;">
                            <a href="${baseUrl}/dashboard" style="color: #5C60DB; text-decoration: underline;">Go to your dashboard</a>
                          </p>
                        `,
                    }),
                })
            }

            if (status === "WAITLIST") {
                await sendEmail({
                    from: "ScholarsPass <no-reply@divupstudio.online>",
                    to: [application.user.email],
                    subject: "Your Transport Pass Application Is on the Waitlist",
                    html: renderEmailTemplate({
                        title: "Application Waitlisted",
                        greetingName: application.fullName,
                        bodyHtml: `
                          <p>Your transport pass application has been placed on the waitlist.</p>
                          <p>We will review availability and notify you as soon as your status changes.</p>
                          <p>No action is required from you at this time.</p>
                          <p style="margin-top: 12px;">
                            <a href="${baseUrl}/dashboard" style="color: #5C60DB; text-decoration: underline;">Check your application status</a>
                          </p>
                        `,
                    }),
                })
            }
        }

        return NextResponse.json({ application })
    } catch (error) {
        console.error("Error updating application status:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

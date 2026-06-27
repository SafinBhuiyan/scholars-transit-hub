import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { renderEmailTemplate, sendEmail } from "@/lib/email"
import { initiateRefund } from "@/lib/sslcommerz"
import { sendSMS } from "@/lib/sms"

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
                        name: true,
                    },
                },
                payments: {
                    where: { status: "PAID" },
                    orderBy: { createdAt: "desc" },
                    take: 1,
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
                    message: "Your transport pass is now active.",
                },
            })

            // Set paid INITIAL payment validity range starting from approval time (for students)
            const paidInitialPayment = await prisma.payment.findFirst({
                where: {
                    applicationId: id,
                    status: "PAID",
                    type: "INITIAL",
                },
            })

            if (paidInitialPayment) {
                const now = new Date()
                const billingEnd = new Date(now)
                billingEnd.setDate(billingEnd.getDate() + 30)
                const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

                await prisma.payment.update({
                    where: { id: paidInitialPayment.id },
                    data: {
                        billingStart: now,
                        billingEnd: billingEnd,
                        billingMonth: billingMonth,
                    },
                })
            }

            try {
                await sendSMS(
                    application.phone,
                    `ScholarsPass: Your transport pass application for ${currentApplication.route.name} has been approved! Your pass is now active.`
                )
            } catch (smsError) {
                console.error("[SMS_ERROR] Failed to send approval SMS:", smsError)
            }
        }

        if (status === "REJECTED") {
            // Auto-refund via SSLCommerz
            const paidPayment = currentApplication.payments[0]
            let refundSuccess = false

            if (paidPayment && paidPayment.transactionId) {
                try {
                    const refundResult = await initiateRefund({
                        bankTranId: paidPayment.transactionId,
                        refundAmount: paidPayment.amount.toString(),
                        refundRemarks: reason || "Application rejected by admin",
                    })

                    await prisma.payment.update({
                        where: { id: paidPayment.id },
                        data: {
                            status: "REFUNDED",
                            refundId: refundResult.refund_ref_id || null,
                            refundedAt: new Date(),
                        },
                    })
                    refundSuccess = true
                } catch (refundError) {
                    console.error("[REFUND_ERROR]", refundError)
                    // Still reject the application even if refund fails
                    // Admin can handle refund manually
                }
            }

            await prisma.notification.create({
                data: {
                    userId: application.userId,
                    title: "Application Rejected",
                    message: refundSuccess
                        ? "Your transport application has been rejected. A refund has been initiated."
                        : "Your transport application has been rejected.",
                },
            })
        }

        if (application.user?.email) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000"
            
            if (status === "APPROVED") {
                await sendEmail({
                    from: "ScholarsPass <no-reply@divupstudio.online>",
                    to: [application.user.email],
                    subject: "Your Transport Pass Application Has Been Approved!",
                    html: renderEmailTemplate({
                        title: "Application Approved",
                        greetingName: application.fullName,
                        bodyHtml: `
                          <p>We are pleased to inform you that your transport pass application for the route <strong>${currentApplication.route.name}</strong> has been approved.</p>
                          <p>Your transport pass is now active and ready for verification. You can log in to your dashboard to view your pass and scan your QR code.</p>
                          <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                            <p style="margin: 0; color: #047857;"><strong>Status:</strong> Approved & Active</p>
                          </div>
                          <p style="margin-top: 16px;">
                            <a href="${baseUrl}/dashboard" style="display: inline-block; background: #5C60DB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
                          </p>
                        `,
                    }),
                })
            }

            if (status === "REJECTED") {
                const paidPayment = currentApplication.payments[0]
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
                          ${paidPayment ? `<div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
                            <p style="margin: 0; color: #1d4ed8;"><strong>Refund:</strong> A refund of ৳${paidPayment.amount.toLocaleString()} has been initiated. It may take 7–10 business days to process.</p>
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

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { resend, renderEmailTemplate } from "@/lib/email"

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

        const application = await prisma.transportApplication.update({
            where: { id },
            data: { status },
            include: {
                user: true,
            },
        })

        if (application.user?.email) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000"
            if (status === "REJECTED") {
                await resend.emails.send({
                    from: "Scholars Transit Hub <no-reply@divupstudio.online>",
                    to: [application.user.email],
                    subject: "Your Transport Pass Application Was Rejected",
                    html: renderEmailTemplate({
                        title: "Application Rejected",
                        greetingName: application.fullName,
                        bodyHtml: `
                          <p>We regret to inform you that your transport pass application has been rejected.</p>
                          ${reason ? `<div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
                            <p style="margin: 0; color: #b91c1c;"><strong>Reason:</strong> ${reason}</p>
                          </div>` : ""}
                          <p>If you believe this is a mistake or need assistance, please contact us.</p>
                          <p style="margin-top: 12px;">
                            <a href="${baseUrl}/dashboard" style="color: #5C60DB; text-decoration: underline;">Go to your dashboard</a>
                          </p>
                        `,
                    }),
                })
            }

            if (status === "WAITLIST") {
                await resend.emails.send({
                    from: "Scholars Transit Hub <no-reply@divupstudio.online>",
                    to: [application.user.email],
                    subject: "Your Transport Pass Application Is on the Waitlist",
                    html: renderEmailTemplate({
                        title: "Application Waitlisted",
                        greetingName: application.fullName,
                        bodyHtml: `
                          <p>Your transport pass application has been moved to the waitlist.</p>
                          <p>We will notify you as soon as a seat becomes available or your application status changes.</p>
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

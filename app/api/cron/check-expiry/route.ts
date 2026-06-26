import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { renderEmailTemplate, sendEmail } from "@/lib/email"
import { sendSMS } from "@/lib/sms"

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this automatically for cron jobs)
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000"

    // Find all approved applications with their latest PAID payment
    const applications = await prisma.transportApplication.findMany({
      where: {
        status: "APPROVED",
        applicantType: "STUDENT",
      },
      include: {
        user: {
          select: { email: true, name: true },
        },
        route: {
          select: { name: true, fees: true },
        },
        payments: {
          where: { status: "PAID", billingEnd: { not: null } },
          orderBy: { billingEnd: "desc" },
          take: 1,
        },
      },
    })

    let reminded7 = 0
    let reminded3 = 0
    let expired = 0

    for (const app of applications) {
      const latestPayment = app.payments[0]
      if (!latestPayment?.billingEnd) continue

      const billingEnd = new Date(latestPayment.billingEnd)
      const daysUntilExpiry = Math.ceil((billingEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // 7 days before expiry
      if (daysUntilExpiry === 7) {
        reminded7++
        const message = `ScholarsPass: Your transport pass expires in 7 days (${billingEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}). Renew now to avoid interruption.`

        await prisma.notification.create({
          data: {
            userId: app.userId,
            title: "Pass Expiring Soon",
            message: `Your transport pass expires in 7 days. Renew now to keep your pass active.`,
          },
        })

        if (app.user.email) {
          await sendEmail({
            from: "ScholarsPass <no-reply@divupstudio.online>",
            to: [app.user.email],
            subject: "Your Transport Pass Expires in 7 Days",
            html: renderEmailTemplate({
              title: "Pass Renewal Reminder",
              greetingName: app.fullName,
              bodyHtml: `
                <p>Your transport pass for <strong>${app.route.name}</strong> will expire on <strong>${billingEnd.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</strong>.</p>
                <p>Renew now to continue using the transport service without interruption.</p>
                <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p style="margin: 0; color: #1d4ed8;"><strong>Monthly fee:</strong> ৳${app.route.fees.toLocaleString()}</p>
                </div>
                <p style="margin-top: 12px;">
                  <a href="${baseUrl}/dashboard" style="display: inline-block; background: #5C60DB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Renew Pass</a>
                </p>
              `,
            }),
          })
        }

        await sendSMS(app.phone, message)
      }

      // 3 days before expiry
      if (daysUntilExpiry === 3) {
        reminded3++
        const message = `ScholarsPass: URGENT - Your transport pass expires in 3 days! Renew now at ${baseUrl}/dashboard to avoid losing access.`

        await prisma.notification.create({
          data: {
            userId: app.userId,
            title: "Pass Expiring in 3 Days!",
            message: "Your transport pass expires in 3 days. Renew immediately to avoid losing access.",
          },
        })

        if (app.user.email) {
          await sendEmail({
            from: "ScholarsPass <no-reply@divupstudio.online>",
            to: [app.user.email],
            subject: "⚠️ Your Transport Pass Expires in 3 Days",
            html: renderEmailTemplate({
              title: "Urgent: Pass Expiring Soon",
              greetingName: app.fullName,
              bodyHtml: `
                <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 0 0 16px;">
                  <p style="margin: 0; color: #b91c1c;"><strong>Your transport pass expires in 3 days!</strong></p>
                </div>
                <p>Your pass for <strong>${app.route.name}</strong> will expire on <strong>${billingEnd.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</strong>.</p>
                <p>After expiry, your pass will be deactivated and you won't be able to use the transport service.</p>
                <p style="margin-top: 16px;">
                  <a href="${baseUrl}/dashboard" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Renew Now — ৳${app.route.fees.toLocaleString()}</a>
                </p>
              `,
            }),
          })
        }

        await sendSMS(app.phone, message)
      }

      // Expired today (daysUntilExpiry === 0 or already past)
      if (daysUntilExpiry === 0) {
        expired++
        const message = `ScholarsPass: Your transport pass has expired. Your pass is now inactive. Renew at ${baseUrl}/dashboard to reactivate.`

        await prisma.notification.create({
          data: {
            userId: app.userId,
            title: "Pass Expired",
            message: "Your transport pass has expired and is now inactive. Renew to reactivate.",
          },
        })

        if (app.user.email) {
          await sendEmail({
            from: "ScholarsPass <no-reply@divupstudio.online>",
            to: [app.user.email],
            subject: "Your Transport Pass Has Expired",
            html: renderEmailTemplate({
              title: "Pass Expired",
              greetingName: app.fullName,
              bodyHtml: `
                <p>Your transport pass for <strong>${app.route.name}</strong> has expired and is now <strong>inactive</strong>.</p>
                <p>To continue using the transport service, please renew your pass.</p>
                <p style="margin-top: 16px;">
                  <a href="${baseUrl}/dashboard" style="display: inline-block; background: #5C60DB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Renew Pass — ৳${app.route.fees.toLocaleString()}</a>
                </p>
              `,
            }),
          })
        }

        await sendSMS(app.phone, message)
      }
    }

    return NextResponse.json({
      success: true,
      processed: applications.length,
      reminded7days: reminded7,
      reminded3days: reminded3,
      expired: expired,
    })
  } catch (error) {
    console.error("[CRON_CHECK_EXPIRY]", error)
    return NextResponse.json({ error: "Failed to process expiry checks" }, { status: 500 })
  }
}

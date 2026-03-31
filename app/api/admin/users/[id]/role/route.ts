import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { renderEmailTemplate, sendEmail } from "@/lib/email"



const roleSchema = z.object({
    role: z.enum(["USER", "ADMIN", "BANNED"]),
})

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const { id } = await params
        const json = await req.json()
        const body = roleSchema.parse(json)

        const user = await prisma.user.findUnique({
            where: {
                id: id,
            },
        })

        if (!user) {
            return new NextResponse("User not found", { status: 404 })
        }

        await prisma.user.update({
            where: {
                id: id,
            },
            data: {
                role: body.role,
            },
        })

        // Send email notification
        try {
            await sendEmail({
                from: 'ScholarsPass <no-reply@divupstudio.online>',
                to: [user.email],
                subject: 'Your ScholarsPass Account Role Has Been Updated',
                html: renderEmailTemplate({
                    title: "Account Role Updated",
                    greetingName: user.name,
                    bodyHtml: `
                      <p>Your account role in <strong>ScholarsPass</strong> has been updated by an administrator.</p>
                      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0;">New Role: <span style="font-weight: bold; color: #5C60DB;">${body.role}</span></p>
                      </div>
                      <p>If you have any questions about this change, please contact the system administrator.</p>
                    `,
                }),
            });
        } catch (emailError) {
            console.error("Failed to send role update notification email:", emailError);
            // We don't return an error here because the role update itself was successful
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 })
        }

        return new NextResponse(null, { status: 500 })
    }
}

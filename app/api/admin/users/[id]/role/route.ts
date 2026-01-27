import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { resend } from "@/lib/email"



const roleSchema = z.object({
    role: z.enum(["USER", "ADMIN", "SUPERVISOR"]),
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
            await resend.emails.send({
                from: 'Scholars Transit Hub <no-reply@divupstudio.online>',
                to: [user.email],
                subject: 'Your Account Role has been Updated',
                html: `
                  <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <img src="https://res.cloudinary.com/dweqw3mgx/image/upload/v1769302905/Scholars_Transit_Hub_Logo-Light_ldnwlf.png" alt="Scholars Transit Hub" style="height: 50px; width: auto;" />
                    </div>
                    <h2 style="color: #5C60DB; text-align: center;">Role Updated</h2>
                    <p>Hello ${user.name},</p>
                    <p>Your system role at <strong>Scholars Transit Hub</strong> has been updated by an administrator.</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0;">New Role: <span style="font-weight: bold; color: #5C60DB;">${body.role}</span></p>
                    </div>
                    <p>If you have any questions about this change, please contact system support.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #6b7280;">&copy; ${new Date().getFullYear()} Scholars Transit Hub. All rights reserved.</p>
                  </div>
                `,
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

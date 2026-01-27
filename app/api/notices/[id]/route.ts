import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { z } from "zod"

const noticeSchema = z.object({
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    type: z.enum(["INFO", "WARNING", "SUCCESS", "DANGER"]).optional(),
    target: z.enum(["ALL", "ROLE", "SPECIFIC"]).optional(),
    targetRoles: z.array(z.enum(["ADMIN", "SUPERVISOR", "USER"])).optional(),
    targetUsers: z.array(z.string()).optional(),
    isPublished: z.boolean().optional(),
    isPinned: z.boolean().optional(),
    expiryDate: z.string().nullable().optional().transform(v => v ? (isNaN(Date.parse(v)) ? null : new Date(v)) : null),
})

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    try {
        const json = await req.json()
        const body = noticeSchema.parse(json)

        const notice = await prisma.notice.update({
            where: { id },
            data: body
        })

        return NextResponse.json(notice)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.flatten() }, { status: 400 })
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    try {
        await prisma.notice.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Notice deletion error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

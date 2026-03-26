import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { z } from "zod"

const noticeSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    type: z.enum(["INFO", "WARNING", "SUCCESS", "DANGER"]),
    target: z.enum(["ALL", "ROLE", "SPECIFIC"]),
    targetRoles: z.array(z.enum(["ADMIN", "USER"])).optional(),
    targetUsers: z.array(z.string()).optional(),
    isPublished: z.boolean().default(false),
    isPinned: z.boolean().default(false),
    expiryDate: z.string().nullable().optional().transform(v => v ? new Date(v) : null),
})

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = session.user
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get("mode") // 'admin' for management, default for user view

    if (mode === "admin" && user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (mode === "admin") {
        const notices = await prisma.notice.findMany({
            orderBy: [
                { isPinned: 'desc' },
                { createdAt: 'desc' }
            ],
            include: {
                createdBy: {
                    select: { name: true, email: true }
                }
            }
        })
        return NextResponse.json(notices)
    }

    // User view: Filter by role, specific user, published, and not expired
    const now = new Date()
    const notices = await prisma.notice.findMany({
        where: {
            isPublished: true,
            OR: [
                { expiryDate: null },
                { expiryDate: { gt: now } }
            ],
            AND: [
                {
                    OR: [
                        { target: "ALL" },
                        {
                            AND: [
                                { target: "ROLE" },
                                { targetRoles: { has: user.role as any } }
                            ]
                        },
                        {
                            AND: [
                                { target: "SPECIFIC" },
                                { targetUsers: { has: user.id } }
                            ]
                        }
                    ]
                }
            ]
        },
        orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' }
        ],
        include: {
            userNotices: {
                where: { userId: user.id }
            }
        }
    })

    // Format to include isRead status
    const formattedNotices = notices.map((notice: any) => ({
        ...notice,
        isRead: notice.userNotices.length > 0 ? notice.userNotices[0].isRead : false,
        readAt: notice.userNotices.length > 0 ? notice.userNotices[0].readAt : null,
        userNotices: undefined
    }))

    return NextResponse.json(formattedNotices)
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const json = await req.json()
        const body = noticeSchema.parse(json)

        const notice = await prisma.notice.create({
            data: {
                ...body,
                createdById: session.user.id
            }
        })

        return NextResponse.json(notice)
    } catch (error) {
        console.error("Notice creation error:", error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.flatten() }, { status: 400 })
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

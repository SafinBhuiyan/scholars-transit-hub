import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const userId = session.user.id

    try {
        const userNotice = await prisma.userNotice.upsert({
            where: {
                noticeId_userId: {
                    noticeId: id,
                    userId: userId
                }
            },
            update: {
                isRead: true,
                readAt: new Date()
            },
            create: {
                noticeId: id,
                userId: userId,
                isRead: true,
                readAt: new Date()
            }
        })

        return NextResponse.json(userNotice)
    } catch (error) {
        console.error("Mark as read error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

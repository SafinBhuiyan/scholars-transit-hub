import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    try {
        const notice = await prisma.notice.findUnique({
            where: { id }
        })

        if (!notice) {
            return NextResponse.json({ error: "Notice not found" }, { status: 404 })
        }

        const updated = await prisma.notice.update({
            where: { id },
            data: { isPublished: !notice.isPublished }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("Notice publish toggle error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

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
        const { status } = body

        if (!status || !["WAITLIST", "APPROVED", "REJECTED"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 })
        }

        const { id } = await params

        const application = await prisma.transportApplication.update({
            where: { id },
            data: { status },
        })

        return NextResponse.json({ application })
    } catch (error) {
        console.error("Error updating application status:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { z } from "zod"
import prisma from "@/lib/prisma"

const reorderSchema = z.object({
    routeId: z.string(),
    pickupIds: z.array(z.string()),
})

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const json = await req.json()
        const { routeId, pickupIds } = reorderSchema.parse(json)

        // Transaction to update all orders
        await prisma.$transaction(
            pickupIds.map((id, index) =>
                prisma.pickupPoint.update({
                    where: { id, routeId },
                    data: { order: index }
                })
            )
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 })
        }

        console.error("[PICKUPS_REORDER]", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { z } from "zod"
import prisma from "@/lib/prisma"

const pickupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    landmark: z.string().optional(),
})

export async function POST(
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

        const { id: routeId } = await params
        const json = await req.json()
        const body = pickupSchema.parse(json)

        // Find the current max order
        const lastPickup = await prisma.pickupPoint.findFirst({
            where: { routeId },
            orderBy: { order: 'desc' },
            select: { order: true }
        })

        const nextOrder = (lastPickup?.order ?? -1) + 1

        const pickup = await prisma.pickupPoint.create({
            data: {
                ...body,
                routeId,
                order: nextOrder
            }
        })

        return NextResponse.json(pickup)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 })
        }

        console.error("[PICKUP_POST]", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

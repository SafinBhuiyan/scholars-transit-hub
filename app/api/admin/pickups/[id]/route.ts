import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { z } from "zod"
import prisma from "@/lib/prisma"

const pickupUpdateSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    landmark: z.string().optional(),
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
        const body = pickupUpdateSchema.parse(json)

        const pickup = await prisma.pickupPoint.update({
            where: { id },
            data: body
        })

        return NextResponse.json(pickup)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 })
        }

        console.error("[PICKUP_PATCH]", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function DELETE(
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

        const pickup = await prisma.pickupPoint.findUnique({
            where: { id },
            select: { routeId: true, order: true }
        })

        if (!pickup) {
            return new NextResponse("Pickup point not found", { status: 404 })
        }

        await prisma.pickupPoint.delete({
            where: { id }
        })

        // Reorder remaining points
        await prisma.pickupPoint.updateMany({
            where: {
                routeId: pickup.routeId,
                order: { gt: pickup.order }
            },
            data: {
                order: { decrement: 1 }
            }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[PICKUP_DELETE]", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

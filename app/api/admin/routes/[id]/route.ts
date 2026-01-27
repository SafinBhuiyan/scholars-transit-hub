import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { z } from "zod"
import prisma from "@/lib/prisma"

const routeUpdateSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    capacity: z.number().int().positive("Capacity must be positive").optional(),
    startTime: z.string().min(1, "Start time is required").optional(),
    returnTime: z.string().min(1, "Return time is required").optional(),
    isActive: z.boolean().optional(),
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
        const body = routeUpdateSchema.parse(json)

        const route = await prisma.route.update({
            where: { id },
            data: body
        })

        return NextResponse.json(route)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 })
        }

        console.error("[ROUTE_PATCH]", error)
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

        await prisma.route.delete({
            where: { id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[ROUTE_DELETE]", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

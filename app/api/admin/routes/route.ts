import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { z } from "zod"
import prisma from "@/lib/prisma"

const routeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    capacity: z.number().int().positive("Capacity must be positive"),
    fees: z.number().int().min(0, "Fees cannot be negative").default(0),
    startTime: z.string().min(1, "Start time is required"),
    returnTime: z.string().min(1, "Return time is required"),
    isActive: z.boolean().default(true),
})

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const routes = await prisma.route.findMany({
            include: {
                pickupPoints: {
                    orderBy: {
                        order: 'asc'
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(routes)
    } catch (error) {
        console.error("[ROUTES_GET]", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const json = await req.json()
        const body = routeSchema.parse(json)

        const route = await prisma.route.create({
            data: {
                ...body
            }
        })

        return NextResponse.json(route)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 })
        }

        console.error("[ROUTES_POST]", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

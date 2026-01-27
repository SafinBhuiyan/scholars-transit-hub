import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { z } from "zod"
import prisma from "@/lib/prisma"

const routeContextSchema = z.object({
    params: z.object({
        id: z.string(),
    }),
})

const roleSchema = z.object({
    role: z.enum(["USER", "ADMIN", "SUPERVISOR"]),
})

export async function PATCH(
    req: NextRequest,
    context: z.infer<typeof routeContextSchema>
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const { params } = routeContextSchema.parse(context)
        const json = await req.json()
        const body = roleSchema.parse(json)

        const user = await prisma.user.findUnique({
            where: {
                id: params.id,
            },
        })

        if (!user) {
            return new NextResponse("User not found", { status: 404 })
        }

        await prisma.user.update({
            where: {
                id: params.id,
            },
            data: {
                role: body.role,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 })
        }

        return new NextResponse(null, { status: 500 })
    }
}

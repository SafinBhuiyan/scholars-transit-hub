import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim() || ""

  const where = q
    ? {
        status: "APPROVED" as const,
        OR: [
          { id: { contains: q, mode: "insensitive" as const } },
          { fullName: { contains: q, mode: "insensitive" as const } },
          { department: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q, mode: "insensitive" as const } },
          { studentId: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {
        status: "APPROVED" as const,
      }

  const applications = await prisma.transportApplication.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: q ? 24 : 12,
    include: {
      route: {
        select: { name: true },
      },
      pickupPoint: {
        select: { name: true },
      },
    },
  })

  return NextResponse.json(applications)
}

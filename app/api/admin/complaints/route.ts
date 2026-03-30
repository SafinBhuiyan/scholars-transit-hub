import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { ComplaintStatus, ComplaintType } from "@prisma/client"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  return session
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const query = searchParams.get("q")?.trim()

    const complaints = await prisma.complaint.findMany({
      where: {
        ...(status && status !== "ALL" ? { status: status as ComplaintStatus } : {}),
        ...(type && type !== "ALL" ? { type: type as ComplaintType } : {}),
        ...(query
          ? {
              OR: [
                { subject: { contains: query, mode: "insensitive" } },
                { message: { contains: query, mode: "insensitive" } },
                { user: { name: { contains: query, mode: "insensitive" } } },
                { user: { email: { contains: query, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      orderBy: [
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        statusUpdatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      complaints: complaints.map((complaint) => ({
        id: complaint.id,
        type: complaint.type,
        status: complaint.status,
        subject: complaint.subject,
        message: complaint.message,
        adminResponse: complaint.adminResponse,
        resolvedAt: complaint.resolvedAt?.toISOString() ?? null,
        statusUpdatedAt: complaint.statusUpdatedAt?.toISOString() ?? null,
        createdAt: complaint.createdAt.toISOString(),
        updatedAt: complaint.updatedAt.toISOString(),
        user: complaint.user,
        statusUpdatedBy: complaint.statusUpdatedBy,
      })),
    })
  } catch (error) {
    console.error("Admin complaint list error:", error)
    return NextResponse.json({ error: "Failed to load complaints" }, { status: 500 })
  }
}

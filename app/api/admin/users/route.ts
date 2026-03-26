import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim() || ""
  const role = searchParams.get("role")
  const offset = Number(searchParams.get("offset") || 0)
  const limit = Math.min(Number(searchParams.get("limit") || 20), 50)

  const where: Prisma.UserWhereInput = {
    role: {
      in: ["USER", "ADMIN", "BANNED"],
    },
  }

  if (role && role !== "ALL") {
    where.role = role as "USER" | "ADMIN" | "BANNED"
  }

  if (q) {
    where.AND = [
      {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
    ]
  }

  const rows = await prisma.user.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip: offset,
    take: limit + 1,
  })

  const hasMore = rows.length > limit
  const users = rows.slice(0, limit).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role as "ADMIN" | "USER" | "BANNED",
    joinDate: `${user.createdAt.getDate()} ${user.createdAt.toLocaleString("en-US", { month: "short" })}, ${user.createdAt.getFullYear()}`,
  }))

  return NextResponse.json({
    users,
    hasMore,
    nextOffset: offset + users.length,
  })
}

import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { ensureDefaultFilesDocCategories } from "@/lib/files-doc-categories"
import prisma from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  return session
}

export async function GET() {
  try {
    const session = await requireAdmin()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureDefaultFilesDocCategories()

    const categories = await prisma.filesDocCategory.findMany({
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Failed to fetch file categories:", error)
    return NextResponse.json({ error: "Failed to fetch file categories" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const name = String(body.name || "").trim()

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const existing = await prisma.filesDocCategory.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 })
    }

    const category = await prisma.filesDocCategory.create({
      data: { name },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Failed to create file category:", error)
    return NextResponse.json({ error: "Failed to create file category" }, { status: 500 })
  }
}

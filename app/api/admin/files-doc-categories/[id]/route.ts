import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { defaultFilesDocCategories } from "@/lib/files-doc-categories"
import prisma from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  return session
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const name = String(body.name || "").trim()

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const category = await prisma.filesDocCategory.findUnique({
      where: { id },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    const duplicate = await prisma.filesDocCategory.findFirst({
      where: {
        id: { not: id },
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    })

    if (duplicate) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 })
    }

    const [, updatedCategory] = await prisma.$transaction([
      prisma.filesDoc.updateMany({
        where: { category: category.name },
        data: { category: name },
      }),
      prisma.filesDocCategory.update({
        where: { id },
        data: { name },
      }),
    ])

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error("Failed to update file category:", error)
    return NextResponse.json({ error: "Failed to update file category" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    const category = await prisma.filesDocCategory.findUnique({
      where: { id },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    const inUseCount = await prisma.filesDoc.count({
      where: { category: category.name },
    })

    if (inUseCount > 0) {
      return NextResponse.json(
        { error: "This category is assigned to existing files. Reassign or remove those files first." },
        { status: 400 }
      )
    }

    if (defaultFilesDocCategories.includes(category.name)) {
      const remainingDefaults = await prisma.filesDocCategory.count({
        where: {
          name: {
            in: defaultFilesDocCategories,
          },
        },
      })

      if (remainingDefaults <= 1) {
        return NextResponse.json(
          { error: "At least one document category must remain." },
          { status: 400 }
        )
      }
    }

    await prisma.filesDocCategory.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete file category:", error)
    return NextResponse.json({ error: "Failed to delete file category" }, { status: 500 })
  }
}

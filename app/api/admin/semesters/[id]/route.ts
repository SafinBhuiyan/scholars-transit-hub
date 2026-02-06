import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, startDate, endDate } = body

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: "Name, start date, and end date are required" }, { status: 400 })
    }

    const parsedStartDate = new Date(startDate)
    const parsedEndDate = new Date(endDate)

    if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
      return NextResponse.json({ error: "Invalid date values" }, { status: 400 })
    }

    if (parsedStartDate > parsedEndDate) {
      return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 })
    }

    const semester = await prisma.semester.update({
      where: { id },
      data: {
        name,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
      },
    })

    return NextResponse.json(semester)
  } catch (error) {
    console.error("Failed to update semester:", error)
    return NextResponse.json({ error: "Failed to update semester" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await prisma.semester.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete semester:", error)
    return NextResponse.json({ error: "Failed to delete semester" }, { status: 500 })
  }
}

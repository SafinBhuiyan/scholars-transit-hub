import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const semesters = await prisma.semester.findMany({
      orderBy: {
        startDate: "desc",
      },
    })

    return NextResponse.json(semesters)
  } catch (error) {
    console.error("Failed to fetch semesters:", error)
    return NextResponse.json({ error: "Failed to fetch semesters" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    const semester = await prisma.semester.create({
      data: {
        name,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
      },
    })

    return NextResponse.json(semester, { status: 201 })
  } catch (error) {
    console.error("Failed to create semester:", error)
    return NextResponse.json({ error: "Failed to create semester" }, { status: 500 })
  }
}

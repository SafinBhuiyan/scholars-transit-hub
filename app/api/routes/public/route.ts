import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      where: {
        isActive: true,
      },
      include: {
        pickupPoints: {
          where: {
            isActive: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ routes })
  } catch (error) {
    console.error("Error fetching routes:", error)
    return NextResponse.json(
      { error: "Failed to fetch routes" },
      { status: 500 }
    )
  }
}

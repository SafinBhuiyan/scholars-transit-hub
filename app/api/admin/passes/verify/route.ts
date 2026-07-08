import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { getPassState } from "@/lib/pass"

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { applicationId } = body

    if (!applicationId) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 })
    }

    const application = await prisma.transportApplication.findUnique({
      where: { id: applicationId },
      include: {
        route: true,
        pickupPoint: true,
        user: {
          select: {
            image: true,
            name: true,
            email: true,
          }
        },
        payments: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 })
    }

    const passState = getPassState(application as any)

    return NextResponse.json({
      isValid: passState.isPassActive,
      passId: passState.passId,
      fullName: application.fullName,
      studentId: application.studentId,
      department: application.department,
      applicantType: application.applicantType,
      phone: application.phone,
      routeName: application.route.name,
      pickupPointName: application.pickupPoint.name,
      avatarUrl: application.user?.image || null,
      expiryDate: passState.billingEnd,
      status: application.status,
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

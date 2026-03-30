import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { ComplaintStatus, ComplaintType } from "@prisma/client"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { canUserSeeComplaint, sendComplaintCreatedEmails } from "@/lib/complaints"
import prisma from "@/lib/prisma"

const complaintCreateSchema = z.object({
  type: z.nativeEnum(ComplaintType),
  subject: z.string().trim().min(5, "Subject must be at least 5 characters").max(120),
  message: z.string().trim().min(20, "Message must be at least 20 characters").max(3000),
})

async function requireUserSession() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || !canUserSeeComplaint(session.user.role)) {
    return null
  }

  return session
}

export async function GET() {
  try {
    const session = await requireUserSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const complaints = await prisma.complaint.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
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
        statusUpdatedBy: complaint.statusUpdatedBy,
      })),
    })
  } catch (error) {
    console.error("Complaint list error:", error)
    return NextResponse.json({ error: "Failed to load complaints" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireUserSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = complaintCreateSchema.parse(await request.json())

    const complaint = await prisma.complaint.create({
      data: {
        userId: session.user.id,
        type: payload.type,
        status: ComplaintStatus.OPEN,
        subject: payload.subject,
        message: payload.message,
      },
    })

    void sendComplaintCreatedEmails({
      complaintId: complaint.id,
      subject: complaint.subject,
      type: complaint.type,
      message: complaint.message,
      userName: session.user.name,
      userEmail: session.user.email,
    }).catch((error) => {
      console.error("Complaint email error:", error)
    })

    return NextResponse.json(
      {
        complaint: {
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
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Complaint create error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to submit complaint" }, { status: 500 })
  }
}

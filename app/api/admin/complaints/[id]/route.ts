import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { ComplaintStatus } from "@prisma/client"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { sendComplaintStatusEmail } from "@/lib/complaints"
import prisma from "@/lib/prisma"

const complaintUpdateSchema = z.object({
  status: z.nativeEnum(ComplaintStatus),
  adminResponse: z.string().trim().max(3000).nullable().optional(),
})

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  return session
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const payload = complaintUpdateSchema.parse(await request.json())

    const existingComplaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!existingComplaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    const nextAdminResponse =
      payload.adminResponse === undefined ? existingComplaint.adminResponse : payload.adminResponse || null

    const complaint = await prisma.complaint.update({
      where: { id },
      data: {
        status: payload.status,
        adminResponse: nextAdminResponse,
        statusUpdatedAt: new Date(),
        statusUpdatedById: session.user.id,
        resolvedAt:
          payload.status === ComplaintStatus.RESOLVED || payload.status === ComplaintStatus.CLOSED
            ? existingComplaint.resolvedAt ?? new Date()
            : null,
      },
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

    void sendComplaintStatusEmail({
      complaintId: complaint.id,
      subject: complaint.subject,
      type: complaint.type,
      status: complaint.status,
      adminResponse: complaint.adminResponse,
      userName: existingComplaint.user.name,
      userEmail: existingComplaint.user.email,
    }).catch((error) => {
      console.error("Complaint status email error:", error)
    })

    return NextResponse.json({
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
        user: complaint.user,
        statusUpdatedBy: complaint.statusUpdatedBy,
      },
    })
  } catch (error) {
    console.error("Complaint update error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to update complaint" }, { status: 500 })
  }
}

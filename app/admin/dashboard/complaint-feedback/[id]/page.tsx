import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AdminComplaintReviewForm } from "@/components/complaints/admin-complaint-review-form"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export default async function ComplaintFeedbackReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const { id } = await params
  const complaint = await prisma.complaint.findUnique({
    where: { id },
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

  if (!complaint) {
    redirect("/admin/dashboard/complaint-feedback")
  }

  return (
    <AdminComplaintReviewForm
      complaint={{
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
      }}
    />
  )
}

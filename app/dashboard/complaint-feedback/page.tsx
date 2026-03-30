import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { UserComplaintsView } from "@/components/complaints/user-complaints-view"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export default async function ComplaintFeedbackUserPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/login")
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

  return (
    <UserComplaintsView
      initialComplaints={complaints.map((complaint) => ({
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
      }))}
    />
  )
}

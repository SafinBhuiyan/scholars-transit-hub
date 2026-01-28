import prisma from "@/lib/prisma"
import { UserNoticesList } from "@/components/notices/user-notices-list"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function UserNoticesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session || session.user.role !== "USER") {
    redirect("/login")
  }

  const now = new Date()
  const notices = await prisma.notice.findMany({
    where: {
      isPublished: true,
      OR: [
        { expiryDate: null },
        { expiryDate: { gte: now } }
      ]
    },
    orderBy: [
      { isPinned: "desc" },
      { createdAt: "desc" }
    ],
    include: {
      createdBy: {
        select: { name: true }
      }
    }
  })

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notices</h1>
        <p className="text-muted-foreground">View system announcements and alerts.</p>
      </div>
      
      <UserNoticesList data={notices} />
    </div>
  )
}

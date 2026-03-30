import prisma from "@/lib/prisma"
import { UserNoticesList } from "@/components/notices/user-notices-list"
import { auth } from "@/lib/auth"
import { getUserNoticeWhere } from "@/lib/notices"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function UserNoticesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session || session.user.role !== "USER") {
    redirect("/login")
  }

  const notices = await prisma.notice.findMany({
    where: getUserNoticeWhere(session.user.id, "USER"),
    orderBy: [
      { isPinned: "desc" },
      { createdAt: "desc" }
    ],
    include: {
      createdBy: {
        select: { name: true }
      },
      userNotices: {
        where: { userId: session.user.id },
      },
    }
  })

  const formattedNotices = notices.map((notice) => ({
    ...notice,
    isRead: notice.userNotices.length > 0 ? notice.userNotices[0].isRead : false,
    readAt: notice.userNotices.length > 0 ? notice.userNotices[0].readAt : null,
    userNotices: undefined,
  }))

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notices</h1>
        <p className="text-muted-foreground">View system announcements and alerts.</p>
      </div>
      
      <UserNoticesList data={formattedNotices} />
    </div>
  )
}

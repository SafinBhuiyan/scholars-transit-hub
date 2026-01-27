import prisma from "@/lib/prisma"
import { NoticesTable } from "@/components/notices/notices-table"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function AdminNoticesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const notices = await prisma.notice.findMany({
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
        <p className="text-muted-foreground">Manage system-wide alerts and announcements.</p>
      </div>
      
      <NoticesTable data={notices} />
    </div>
  )
}

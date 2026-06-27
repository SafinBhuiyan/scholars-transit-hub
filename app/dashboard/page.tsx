import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { getUserNoticeWhere } from "@/lib/notices"
import { getPassQrSvg, getPassState } from "@/lib/pass"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserDashboardHub } from "@/components/user-dashboard-hub"
import { formatDateShort } from "@/lib/utils"

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session) {
    return null
  }

  const application = await prisma.transportApplication.findFirst({
    where: { userId: session.user.id },
    include: {
      route: true,
      pickupPoint: true,
      payments: {
        orderBy: { createdAt: "desc" }
      }
    }
  })

  const notices = await prisma.notice.findMany({
    where: getUserNoticeWhere(session.user.id, "USER"),
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
    take: 4,
  })

  const files = await prisma.filesDoc.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 6,
    select: {
      id: true,
      fileName: true,
      originalName: true,
      url: true,
      category: true,
      format: true,
      createdAt: true,
    },
  })

  const routes = await prisma.route.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      capacity: true,
      fees: true,
      startTime: true,
      returnTime: true,
      pickupPoints: {
        where: {
          isActive: true,
        },
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
          name: true,
          landmark: true,
        },
      },
    },
  })

  const pass = application
    ? {
        ...getPassState(application),
        qrCodeSvg: await getPassQrSvg(application, session.user.id, 196),
      }
    : null

  const applicantTypeLabel = application
    ? application.applicantType === "STUDENT"
      ? "Student"
      : application.applicantType === "ACADEMIC"
        ? "Academic Staff"
        : "Administrative Staff"
    : "User"

  const studentMeta = application?.studentId
    ? `(${application.studentId}${application.batch ? ` | ${application.batch}` : ""})`
    : application?.batch
      ? `Batch (${application.batch} Batch)`
      : null

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      {!application ? (
        <Card className="min-h-[24vh] overflow-hidden border-primary/15 bg-linear-to-r from-primary/8 via-card to-card">
          <CardContent className="flex h-full min-h-[24vh] flex-col justify-center gap-5 p-6 sm:p-8">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-medium text-primary">Get Started</p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Apply for your transport pass
              </h1>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                Submit your route, pickup point, and verification details to request access to the university transport service.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard/apply">Apply for Transport</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <UserDashboardHub
        pass={
          pass
            ? {
                isActive: pass.isPassActive,
                passId: pass.passId,
                qrCodeSvg: pass.qrCodeSvg,
                holderName: application?.fullName || session.user.name,
                applicantType: applicantTypeLabel,
                routeName: application?.route.name || "Not assigned",
                pickupPointName: application?.pickupPoint.name || "Not assigned",
                issuedOn: pass.billingStart
                  ? formatDateShort(pass.billingStart)
                  : formatDateShort(pass.passIssuedAt),
                expiresOn: pass.billingEnd
                  ? formatDateShort(pass.billingEnd)
                  : "Not set",
                billingEnd: pass.billingEnd?.toISOString() || null,
                studentMeta,
              }
            : null
        }
        notices={notices.map((notice) => ({
          id: notice.id,
          title: notice.title,
          content: notice.content,
          type: notice.type,
          target: notice.target,
          isPinned: notice.isPinned,
          isPublished: notice.isPublished,
          createdAt: notice.createdAt.toISOString(),
          expiryDate: notice.expiryDate?.toISOString() || null,
          createdBy: notice.createdBy,
        }))}
        files={files.map((file) => ({
          id: file.id,
          fileName: file.fileName,
          originalName: file.originalName,
          url: file.url,
          category: file.category,
          format: file.format,
          createdAt: file.createdAt.toISOString(),
        }))}
        routes={routes}
      />
    </div>
  )
}

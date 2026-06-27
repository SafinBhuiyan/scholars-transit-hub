import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import {
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconCreditCard,
  IconId,
  IconMapPin,
  IconRoute,
  IconUser,
} from "@tabler/icons-react"

import { auth } from "@/lib/auth"
import { PassPrintButton } from "@/components/pass-print-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDateShort, formatTimeShort } from "@/lib/utils"
import { getPassQrSvg, getPassState } from "@/lib/pass"
import prisma from "@/lib/prisma"

function formatApplicantType(type: "STUDENT" | "ACADEMIC" | "ADMINISTRATIVE") {
  if (type === "STUDENT") return "Student"
  if (type === "ACADEMIC") return "Academic Staff"
  return "Administrative Staff"
}

export default async function StudentPassPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/login")
  }

  const application = await prisma.transportApplication.findFirst({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      route: true,
      pickupPoint: true,
      payments: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  if (!application) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">My Transport Pass</h1>
          <p className="text-muted-foreground">Your active transport pass will appear here after application approval.</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-start gap-4 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <IconId className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No application found</p>
              <p className="text-sm text-muted-foreground">
                Apply for a transport pass first and this page will show your issued pass once it is ready.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/apply">Apply for Transport</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { isStudent, latestActivePayment, hasPaidRequirement, isApproved, isPassActive, passId, passIssuedAt, billingStart, billingEnd } =
    getPassState(application)
  const qrCodeSvg = await getPassQrSvg(application, session.user.id, 220)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">My Transport Pass</h1>
          <p className="text-muted-foreground">
            Your issued pass, route assignment, and verification QR are available here.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {isPassActive ? <PassPrintButton /> : null}
          <Button variant="outline" asChild>
            <Link href="/dashboard/payments">Open Payments</Link>
          </Button>
        </div>
      </div>

      {!isPassActive ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconAlertCircle className="h-5 w-5 text-amber-600" />
              Pass not active yet
            </CardTitle>
            <CardDescription>
              Your transport pass will become available once the required approval and payment steps are completed.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 grid-cols-2 md:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">Application status</p>
              <p className="mt-1 font-medium">{application.status}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">Payment status</p>
              <p className="mt-1 font-medium">
                {isStudent
                  ? latestActivePayment
                    ? "Paid"
                    : application.payments.some((payment) => payment.status === "PENDING")
                      ? "Payment pending"
                      : "Awaiting payment request"
                  : "No payment required"}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 col-span-2 md:col-span-1">
              <p className="text-xs text-muted-foreground">Next step</p>
              <p className="mt-1 font-medium">
                {!isApproved ? "Wait for admin approval" : !hasPaidRequirement ? "Complete payment" : "Pass is being prepared"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <Card className="print:shadow-none print:ring-0">
          <CardHeader className="gap-4 border-b">
            <div className="flex flex-col gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <Avatar className="h-12 w-12 shrink-0 sm:h-14 sm:w-14">
                  <AvatarImage src={session.user.image || undefined} alt={application.fullName} />
                  <AvatarFallback>
                    <IconUser className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1">
                  <CardTitle className="text-xl leading-tight break-words sm:text-2xl">
                    {application.fullName}
                  </CardTitle>
                  <CardDescription className="break-words">
                    {formatApplicantType(application.applicantType)}
                    {application.batch ? ` • ${application.batch} Batch` : ""}
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  <IconCheck className="mr-1 h-3 w-3" />
                  Active Pass
                </Badge>
                <Badge variant="outline" className="max-w-full">
                  <IconId className="mr-1 h-3 w-3" />
                  <span className="break-all">{passId}</span>
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="mt-1 font-medium">{application.department}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Student ID</p>
                <p className="mt-1 font-medium">{application.studentId || "Not provided"}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4 col-span-2 lg:col-span-1">
                <p className="text-xs text-muted-foreground">Issued on</p>
                <p className="mt-1 font-medium">
                  {billingStart ? formatDateShort(billingStart) : formatDateShort(passIssuedAt)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <IconRoute className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">Route details</p>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned route</p>
                    <p className="font-medium">{application.route.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Morning trip</p>
                    <p className="font-medium">{formatTimeShort(application.route.startTime)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Return trip</p>
                    <p className="font-medium">{formatTimeShort(application.route.returnTime)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <IconMapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">Pickup details</p>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Pickup point</p>
                    <p className="font-medium">{application.pickupPoint.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Landmark</p>
                    <p className="font-medium">{application.pickupPoint.landmark || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Application date</p>
                    <p className="font-medium">{formatDateShort(application.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
              Carry this pass when using the university transport service. The QR contains the pass reference used during verification.
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <Card className="print:shadow-none print:ring-0 md:col-span-2 xl:col-span-1">
            <CardHeader>
              <CardTitle>Verification QR</CardTitle>
              <CardDescription>Use this code during transport pass checks.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {qrCodeSvg ? (
                <div
                  className="rounded-xl border bg-white p-4 shadow-sm"
                  dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                />
              ) : (
                <div className="flex h-[252px] w-[252px] items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 text-center text-sm text-muted-foreground">
                  QR will be available once your pass becomes active.
                </div>
              )}

              <div className="w-full rounded-lg border bg-muted/20 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Pass reference</span>
                  <span className="font-mono text-xs font-medium">{passId}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pass status</CardTitle>
              <CardDescription>Current approval and activation details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Application</span>
                <Badge variant="outline">{application.status}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Payment</span>
                <Badge variant="outline">
                  {isStudent ? (latestActivePayment ? "Paid" : "Pending") : "Not required"}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Last updated</span>
                <span className="font-medium">{formatDateShort(application.updatedAt)}</span>
              </div>
              {latestActivePayment?.paidAt ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Payment confirmed</span>
                  <span className="font-medium">{formatDateShort(latestActivePayment.paidAt)}</span>
                </div>
              ) : null}
              {billingEnd ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Expires on</span>
                  <span className="font-medium">{formatDateShort(billingEnd)}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need help?</CardTitle>
              <CardDescription>Use the existing dashboard flows if anything changes.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard/apply">
                  <IconClock className="mr-2 h-4 w-4" />
                  View Application
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/payments">
                  <IconCreditCard className="mr-2 h-4 w-4" />
                  View Payments
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

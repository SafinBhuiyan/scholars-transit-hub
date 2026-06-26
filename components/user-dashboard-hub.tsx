"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  IconBell,
  IconCalendar,
  IconClock,
  IconCurrencyTaka,
  IconEye,
  IconId,
  IconFileDescription,
  IconMapPin,
  IconPinned,
  IconRoute,
  IconUsers,
  IconAlertCircle,
  IconLoader,
} from "@tabler/icons-react"

import { NoticeViewDialog } from "@/components/notices/notice-view-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateShort, formatTimeShort } from "@/lib/utils"
import { toast } from "sonner"

const PdfPreview = dynamic(() => import("@/components/pdf-preview").then((mod) => mod.PdfPreview), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl bg-muted/20 p-1.5">
      <div className="aspect-210/297 w-full rounded-lg bg-background">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  ),
})

type DashboardNotice = {
  id: string
  title: string
  content: string
  type: "INFO" | "WARNING" | "SUCCESS" | "DANGER"
  target: "ALL" | "ROLE" | "SPECIFIC"
  isPinned: boolean
  isPublished: boolean
  createdAt: string
  expiryDate: string | null
  createdBy?: {
    name: string
  } | null
}

type DashboardFile = {
  id: string
  fileName: string
  originalName: string
  url: string
  category: string
  format: string
  createdAt: string
}

type DashboardPass = {
  isActive: boolean
  passId: string
  qrCodeSvg: string | null
  holderName: string
  applicantType: string
  routeName: string
  pickupPointName: string
  issuedOn: string
  expiresOn: string
  billingEnd: string | null
  studentMeta: string | null
}

type DashboardRoute = {
  id: string
  name: string
  capacity: number
  fees: number
  startTime: string
  returnTime: string
  pickupPoints: Array<{
    id: string
    name: string
    landmark: string | null
  }>
}

function getNoticeTone(type: DashboardNotice["type"]) {
  if (type === "SUCCESS") return "bg-primary/10 text-primary border-primary/20"
  if (type === "WARNING") return "bg-amber-500/10 text-amber-700 border-amber-500/20"
  if (type === "DANGER") return "bg-destructive/10 text-destructive border-destructive/20"
  return "bg-muted text-muted-foreground border-border"
}

export function UserDashboardHub({
  notices,
  files,
  pass,
  routes,
}: {
  notices: DashboardNotice[]
  files: DashboardFile[]
  pass: DashboardPass | null
  routes: DashboardRoute[]
}) {
  const [selectedNotice, setSelectedNotice] = React.useState<DashboardNotice | null>(null)
  const [selectedFile, setSelectedFile] = React.useState<DashboardFile | null>(null)
  const [isRenewing, setIsRenewing] = React.useState(false)

  const handleRenew = async () => {
    try {
      setIsRenewing(true)
      const response = await fetch("/api/payments/renew", {
        method: "POST",
      })
      const result = (await response.json()) as { error?: string; paymentUrl?: string; invoiceId?: string }

      if (!response.ok) throw new Error(result.error || "Failed to initiate renewal")

      if (result.paymentUrl) {
        toast.success("Redirecting to payment gateway...")
        window.location.href = result.paymentUrl
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to renew pass")
      setIsRenewing(false)
    }
  }

  const isExpiringSoon = pass?.billingEnd 
    ? Math.ceil((new Date(pass.billingEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 7
    : false

  const isExpired = pass?.billingEnd 
    ? new Date(pass.billingEnd) < new Date()
    : false

  return (
    <div className="grid gap-6">
      {pass ? (
        <section className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">Pass QR</h2>
              <p className="text-sm text-muted-foreground">Quick access to your transport pass verification code.</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/pass">View Pass Details</Link>
            </Button>
          </div>

          <Card>
            <CardContent className="py-6">
              <div className="grid gap-6 lg:grid-cols-[204px_minmax(0,820px)] lg:items-start lg:justify-start">
                <div className="flex items-start justify-center lg:justify-start">
                  <div className="inline-flex self-start rounded-xl border bg-white p-2 shadow-sm">
                    {pass.qrCodeSvg ? (
                      <div
                        className="h-[188px] w-[188px] shrink-0 overflow-hidden [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
                        dangerouslySetInnerHTML={{ __html: pass.qrCodeSvg }}
                      />
                    ) : (
                      <div className="flex h-[188px] w-[188px] items-center justify-center rounded-lg border border-dashed bg-muted/30 px-4 text-center text-xs text-muted-foreground">
                        QR will be available once your pass becomes active.
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-w-0 space-y-4 text-center lg:max-w-[820px] lg:text-left">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                      <Badge variant="outline" className={pass.isActive ? "bg-primary/10 text-primary border-primary/20" : ""}>
                        {pass.isActive ? "Active Pass" : "Pass Pending"}
                      </Badge>
                      <Badge variant="outline" className="max-w-full">
                        <IconId className="mr-1 h-3 w-3 shrink-0" />
                        <span className="break-all">{pass.passId}</span>
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold leading-tight">{pass.holderName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {pass.applicantType} transport pass
                      </p>
                      {pass.studentMeta ? (
                        <p className="text-sm text-muted-foreground">
                          {pass.studentMeta}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Assigned route</p>
                      <p className="mt-1 font-medium leading-snug">{pass.routeName}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Pickup point</p>
                      <p className="mt-1 font-medium leading-snug">{pass.pickupPointName}</p>
                    </div>
                  </div>

                  {pass.applicantType === "Student" && (
                    <div className={`mt-4 rounded-lg border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isExpired ? "bg-destructive/5 border-destructive/20" :
                      isExpiringSoon ? "bg-amber-500/5 border-amber-500/20" : "bg-muted/10"
                    }`}>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Billing Status</p>
                        <p className="text-sm text-muted-foreground">
                          {isExpired ? (
                            <span className="text-destructive inline-flex items-center gap-1">
                              <IconAlertCircle className="h-4 w-4" />
                              Pass expired on {pass.expiresOn}
                            </span>
                          ) : isExpiringSoon ? (
                            <span className="text-amber-600 inline-flex items-center gap-1">
                              <IconAlertCircle className="h-4 w-4" />
                              Expiring soon on {pass.expiresOn}
                            </span>
                          ) : (
                            <span>Active until {pass.expiresOn}</span>
                          )}
                        </p>
                      </div>
                      
                      {(isExpired || isExpiringSoon) && (
                        <Button 
                          onClick={handleRenew} 
                          disabled={isRenewing}
                          variant={isExpired ? "destructive" : "default"}
                          className="w-full sm:w-auto shrink-0"
                        >
                          {isRenewing ? (
                            <><IconLoader className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                          ) : (
                            "Renew Pass"
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">Available Routes</h2>
            <p className="text-sm text-muted-foreground">Browse active routes, trip times, and pickup points before you apply.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/apply">Apply Now</Link>
          </Button>
        </div>

        {routes.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <IconRoute className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">No active routes available</p>
                <p className="text-sm text-muted-foreground">Transport routes and pickup points will appear here once the admin publishes them.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {routes.map((route) => (
              <Card key={route.id} className="min-w-0">
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base leading-snug">{route.name}</CardTitle>
                      <CardDescription>{route.capacity} seats available on this route</CardDescription>
                      {route.fees > 0 && (
                        <p className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                          <IconCurrencyTaka className="h-4 w-4" />
                          {route.fees.toLocaleString()} Tk / month
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {route.pickupPoints.length} stops
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <IconClock className="h-3 w-3" />
                        Morning trip
                      </p>
                      <p className="mt-1 font-medium">{formatTimeShort(route.startTime)}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <IconClock className="h-3 w-3" />
                        Return trip
                      </p>
                      <p className="mt-1 font-medium">{formatTimeShort(route.returnTime)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="inline-flex items-center gap-2 text-sm font-medium">
                      <IconMapPin className="h-4 w-4 text-muted-foreground" />
                      Pickup points
                    </p>

                    {route.pickupPoints.length === 0 ? (
                      <div className="rounded-lg border border-dashed bg-muted/10 p-3 text-sm text-muted-foreground">
                        No pickup points have been added to this route yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {route.pickupPoints.map((pickupPoint, index) => (
                          <div
                            key={pickupPoint.id}
                            className="flex items-start gap-3 rounded-lg border bg-background p-3"
                          >
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium leading-snug">{pickupPoint.name}</p>
                              {pickupPoint.landmark ? (
                                <p className="text-sm text-muted-foreground">{pickupPoint.landmark}</p>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">Latest Notices</h2>
            <p className="text-sm text-muted-foreground">Important announcements and updates for your account.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/notices">View All</Link>
          </Button>
        </div>

        {notices.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <IconBell className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">No notices yet</p>
                <p className="text-sm text-muted-foreground">New notices will appear here when they are published.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {notices.map((notice) => (
              <Card key={notice.id} className="min-w-0">
                <CardHeader className="gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={getNoticeTone(notice.type)}>
                      {notice.type}
                    </Badge>
                    {notice.isPinned ? (
                      <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                        <IconPinned className="mr-1 h-3 w-3" />
                        Pinned
                      </Badge>
                    ) : null}
                  </div>
                  <CardTitle className="line-clamp-2 text-base leading-snug">{notice.title}</CardTitle>
                  <CardDescription className="line-clamp-3 min-h-3.75rem">
                    {notice.content}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <IconUsers className="h-3 w-3" />
                      {notice.target}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <IconCalendar className="h-3 w-3" />
                      {formatDateShort(notice.createdAt)}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedNotice(notice)}
                  >
                    <IconEye className="mr-2 h-4 w-4" />
                    View Notice
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">Files & Docs</h2>
            <p className="text-sm text-muted-foreground">Official PDFs, schedules, contacts, maps, and reports.</p>
          </div>
        </div>

        {files.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <IconFileDescription className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">No files available</p>
                <p className="text-sm text-muted-foreground">Admin-uploaded documents will appear here once they are available.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="flex flex-1 flex-col gap-2.5 p-3">
                  <div className="relative">
                    <Badge
                      variant="secondary"
                      className="absolute left-3 top-3 z-10 border-transparent bg-background/90 text-[10px] uppercase tracking-[0.18em] text-foreground/80 shadow-sm backdrop-blur"
                    >
                      {file.category}
                    </Badge>

                    <PdfPreview fileUrl={file.url} format={file.format} />
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-2">
                    <div className="space-y-1.5">
                      <h3
                        className="text-[13px] font-bold leading-snug wrap-break-word transition-colors group-hover:text-primary sm:text-sm"
                        title={file.originalName || file.fileName}
                      >
                        {file.originalName || file.fileName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground/70">
                        <span>{file.format.toUpperCase()} document</span>
                        <span className="hidden text-border sm:inline">•</span>
                        <span>{formatDateShort(file.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/30 bg-muted/5 p-2.5 transition-colors group-hover:bg-muted/20">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-full border-border/40 bg-background/50 px-2 text-[11px] shadow-sm transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                    onClick={() => setSelectedFile(file)}
                  >
                    <IconEye className="h-3 w-3" />
                    View File
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <NoticeViewDialog
        open={!!selectedNotice}
        onOpenChange={(open) => {
          if (!open) setSelectedNotice(null)
        }}
        notice={selectedNotice}
      />

      <Dialog
        open={!!selectedFile}
        onOpenChange={(open) => {
          if (!open) setSelectedFile(null)
        }}
      >
        <DialogContent className="flex h-[90vh] max-h-[90vh] w-[90vw] max-w-3xl flex-col">
          <DialogHeader>
            <DialogTitle>{selectedFile?.originalName || selectedFile?.fileName || "Preview"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-muted/20">
            <div className="aspect-210/297 w-full max-w-[210mm]">
              {selectedFile ? (
                <PdfPreview fileUrl={selectedFile.url} format={selectedFile.format} />
              ) : null}
            </div>
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  )
}

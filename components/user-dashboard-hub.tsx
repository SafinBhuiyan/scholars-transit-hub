"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  IconBell,
  IconCalendar,
  IconEye,
  IconId,
  IconFileDescription,
  IconPinned,
  IconUsers,
} from "@tabler/icons-react"

import { NoticeViewDialog } from "@/components/notices/notice-view-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateShort } from "@/lib/utils"

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
  studentMeta: string | null
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
}: {
  notices: DashboardNotice[]
  files: DashboardFile[]
  pass: DashboardPass | null
}) {
  const [selectedNotice, setSelectedNotice] = React.useState<DashboardNotice | null>(null)
  const [selectedFile, setSelectedFile] = React.useState<DashboardFile | null>(null)

  return (
    <div className="grid gap-6">
      {pass ? (
        <section className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
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
              <div className="grid gap-6 lg:grid-cols-[168px_minmax(0,1fr)]">
                <div className="flex justify-center lg:justify-start">
                  <div className="inline-flex rounded-xl border bg-white p-3 shadow-sm">
                    {pass.qrCodeSvg ? (
                      <div
                        className="h-140px w-140px shrink-0 [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
                        dangerouslySetInnerHTML={{ __html: pass.qrCodeSvg }}
                      />
                    ) : (
                      <div className="flex h-140px w-140px items-center justify-center rounded-lg border border-dashed bg-muted/30 px-4 text-center text-xs text-muted-foreground">
                        QR will be available once your pass becomes active.
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-w-0 space-y-4 text-center lg:text-left">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                      <Badge variant="outline" className={pass.isActive ? "bg-primary/10 text-primary border-primary/20" : ""}>
                        {pass.isActive ? "Active Pass" : "Pass Pending"}
                      </Badge>
                      <Badge variant="outline">
                        <IconId className="mr-1 h-3 w-3" />
                        {pass.passId}
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
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Issued on</p>
                      <p className="mt-1 font-medium">{pass.issuedOn}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Expired on</p>
                      <p className="mt-1 font-medium">{pass.expiresOn}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Show this QR during pass verification or open the full pass page for the complete pass details.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

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

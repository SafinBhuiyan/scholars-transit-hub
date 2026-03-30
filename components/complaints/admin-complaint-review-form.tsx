"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ComplaintStatus } from "@prisma/client"
import { IconArrowLeft, IconLoader, IconMail } from "@tabler/icons-react"
import { toast } from "sonner"

import {
  complaintStatusOptions,
  getComplaintStatusLabel,
  getComplaintStatusTone,
  getComplaintTypeLabel,
  getComplaintTypeTone,
} from "@/lib/complaints"
import { formatDateShort } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { AdminComplaintItem } from "@/components/complaints/types"

export function AdminComplaintReviewForm({
  complaint: initialComplaint,
}: {
  complaint: AdminComplaintItem
}) {
  const [complaint, setComplaint] = React.useState(initialComplaint)
  const [draftStatus, setDraftStatus] = React.useState<ComplaintStatus>(initialComplaint.status)
  const [draftResponse, setDraftResponse] = React.useState(initialComplaint.adminResponse ?? "")
  const [isSaving, setIsSaving] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    setComplaint(initialComplaint)
    setDraftStatus(initialComplaint.status)
    setDraftResponse(initialComplaint.adminResponse ?? "")
  }, [initialComplaint])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/complaints/${complaint.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: draftStatus,
          adminResponse: draftResponse,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.formErrors?.[0] || data.error || "Failed to update complaint")
      }

      setComplaint(data.complaint)
      setDraftStatus(data.complaint.status)
      setDraftResponse(data.complaint.adminResponse ?? "")
      toast.success("Complaint updated and email alert sent.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update complaint.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/admin/dashboard/complaint-feedback" className="inline-flex items-center gap-1 hover:text-foreground">
              <IconArrowLeft className="h-3.5 w-3.5" />
              Back to complaints
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Complaint Review</h1>
          <p className="max-w-3xl text-muted-foreground">
            Review the full complaint details, update the status, and send a response without being constrained by a modal.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={getComplaintTypeTone(complaint.type)}>
            {getComplaintTypeLabel(complaint.type)}
          </Badge>
          <Badge variant="outline" className={getComplaintStatusTone(complaint.status)}>
            {getComplaintStatusLabel(complaint.status)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <Card className="h-fit">
          <CardHeader className="border-b">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={complaint.user.image ?? undefined} alt={complaint.user.name} />
                <AvatarFallback>{complaint.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="text-xl leading-tight break-words">{complaint.subject}</CardTitle>
                <CardDescription className="break-words">
                  {complaint.user.name} • {complaint.user.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-none border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="mt-1 font-medium">{formatDateShort(complaint.createdAt)}</p>
              </div>
              <div className="rounded-none border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Last updated</p>
                <p className="mt-1 font-medium">{formatDateShort(complaint.updatedAt)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={getComplaintTypeTone(complaint.type)}>
                  {getComplaintTypeLabel(complaint.type)}
                </Badge>
                <Badge variant="outline" className={getComplaintStatusTone(complaint.status)}>
                  {getComplaintStatusLabel(complaint.status)}
                </Badge>
              </div>
              <div className="rounded-none border bg-background p-4">
                <p className="text-xs font-medium text-muted-foreground">Complaint details</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground">{complaint.message}</p>
              </div>
            </div>

            {complaint.adminResponse ? (
              <div className="rounded-none border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-medium text-primary">Current admin response</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{complaint.adminResponse}</p>
              </div>
            ) : (
              <div className="rounded-none border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                No admin response has been saved yet.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="h-fit">
            <CardHeader className="border-b">
              <CardTitle className="text-base">Review Details</CardTitle>
              <CardDescription>Update the status and response from this page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <div className="flex flex-wrap gap-2">
                  {complaintStatusOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={draftStatus === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDraftStatus(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="admin-response">
                  Admin response
                </label>
                <Textarea
                  id="admin-response"
                  value={draftResponse}
                  onChange={(event) => setDraftResponse(event.target.value)}
                  placeholder="Write the update or resolution details that should be emailed to the user."
                  className="min-h-64"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Reference ID</p>
                  <p className="mt-1 break-all font-mono text-xs">{complaint.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Submitted by</p>
                  <p className="mt-1 font-medium">{complaint.user.name}</p>
                  <p className="text-xs text-muted-foreground">{complaint.user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status updated by</p>
                  <p className="mt-1 font-medium">
                    {complaint.statusUpdatedBy?.name || "Not updated yet"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status updated at</p>
                  <p className="mt-1 font-medium">
                    {complaint.statusUpdatedAt ? formatDateShort(complaint.statusUpdatedAt) : "Awaiting review"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Resolved at</p>
                  <p className="mt-1 font-medium">
                    {complaint.resolvedAt ? formatDateShort(complaint.resolvedAt) : "Not resolved yet"}
                  </p>
                </div>
              </div>

              <div className="rounded-none border bg-muted/15 p-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <IconMail className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Saving this update will notify <span className="font-medium text-foreground">{complaint.user.email}</span>.
                  </p>
                </div>
              </div>

              <Button className="w-full" onClick={() => void handleSave()} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <IconLoader className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Update"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

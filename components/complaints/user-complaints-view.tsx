"use client"

import * as React from "react"
import { IconAlertCircle, IconChecks, IconLoader, IconMessage, IconRefresh } from "@tabler/icons-react"
import { ComplaintStatus, ComplaintType } from "@prisma/client"
import { toast } from "sonner"

import {
  complaintStatusOptions,
  complaintTypeOptions,
  getComplaintStatusLabel,
  getComplaintStatusTone,
  getComplaintTypeLabel,
  getComplaintTypeTone,
} from "@/lib/complaints"
import { formatDateShort } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type ComplaintItem = {
  id: string
  type: ComplaintType
  status: ComplaintStatus
  subject: string
  message: string
  adminResponse: string | null
  resolvedAt: string | null
  statusUpdatedAt: string | null
  createdAt: string
  updatedAt: string
  statusUpdatedBy?: {
    id: string
    name: string
    email: string
  } | null
}

export function UserComplaintsView({ initialComplaints }: { initialComplaints: ComplaintItem[] }) {
  const [complaints, setComplaints] = React.useState(initialComplaints)
  const [type, setType] = React.useState<ComplaintType>("COMPLAINT")
  const [subject, setSubject] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const refreshComplaints = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch("/api/complaints")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load complaints")
      }

      setComplaints(data.complaints)
    } catch (error) {
      toast.error("Couldn't refresh complaint updates right now.")
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          subject,
          message,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.formErrors?.[0] || data.error || "Failed to submit")
      }

      setComplaints((current) => [data.complaint, ...current])
      setSubject("")
      setMessage("")
      setType("COMPLAINT")
      toast.success("Your message has been submitted to the transport team.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit your message.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Complaint / Feedback</h1>
        <p className="text-muted-foreground">
          Share transport issues, service feedback, or suggestions and track status updates from the admin team.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit a new message</CardTitle>
          <CardDescription>
            Use this form for route problems, service concerns, or improvement ideas. You’ll receive status updates by email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Message type</p>
              <div className="flex flex-wrap gap-2">
                {complaintTypeOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={type === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setType(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="complaint-subject">
                  Subject
                </label>
                <Input
                  id="complaint-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Example: Bus delayed on Route 01"
                  maxLength={120}
                  required
                />
              </div>

              <div className="rounded-none border bg-muted/20 px-3 py-2">
                <p className="text-xs text-muted-foreground">Current status after submit</p>
                <div className="mt-2">
                  <Badge variant="outline" className={getComplaintStatusTone("OPEN")}>
                    {getComplaintStatusLabel("OPEN")}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="complaint-message">
                Details
              </label>
              <Textarea
                id="complaint-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Describe the issue, route, pickup point, timing, and anything the transport team should know."
                className="min-h-32"
                maxLength={3000}
                required
              />
              <p className="text-[11px] text-muted-foreground">{message.length}/3000 characters</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Use this for transport-related matters only. For urgent help, contact the emergency number from the sidebar.
              </p>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-fit">
                {isSubmitting ? (
                  <>
                    <IconLoader className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <IconMessage />
                    Submit Message
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">Your history</h2>
            <p className="text-sm text-muted-foreground">Check status, admin responses, and the latest activity on your submissions.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refreshComplaints()} disabled={isRefreshing}>
            {isRefreshing ? <IconLoader className="animate-spin" /> : <IconRefresh />}
            Refresh
          </Button>
        </div>

        {complaints.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <IconAlertCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">No submissions yet</p>
                <p className="text-sm text-muted-foreground">Your complaints, feedback, and suggestions will appear here once submitted.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {complaints.map((complaint) => (
              <Card key={complaint.id}>
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={getComplaintTypeTone(complaint.type)}>
                      {getComplaintTypeLabel(complaint.type)}
                    </Badge>
                    <Badge variant="outline" className={getComplaintStatusTone(complaint.status)}>
                      {getComplaintStatusLabel(complaint.status)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-base leading-snug">{complaint.subject}</CardTitle>
                    <CardDescription>
                      Submitted on {formatDateShort(complaint.createdAt)}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-none border bg-muted/15 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Your message</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{complaint.message}</p>
                  </div>

                  {complaint.adminResponse ? (
                    <div className="rounded-none border border-primary/20 bg-primary/5 p-3">
                      <div className="flex items-center gap-2">
                        <IconChecks className="h-4 w-4 text-primary" />
                        <p className="text-xs font-medium text-primary">Admin response</p>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{complaint.adminResponse}</p>
                    </div>
                  ) : (
                    <div className="rounded-none border border-dashed bg-muted/10 p-3 text-sm text-muted-foreground">
                      No admin response yet. We’ll email you when there’s an update.
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-none border bg-background p-3">
                      <p className="text-xs text-muted-foreground">Last status update</p>
                      <p className="mt-1 font-medium">
                        {complaint.statusUpdatedAt ? formatDateShort(complaint.statusUpdatedAt) : "Awaiting review"}
                      </p>
                    </div>
                    <div className="rounded-none border bg-background p-3">
                      <p className="text-xs text-muted-foreground">Resolved on</p>
                      <p className="mt-1 font-medium">
                        {complaint.resolvedAt ? formatDateShort(complaint.resolvedAt) : "Not resolved yet"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

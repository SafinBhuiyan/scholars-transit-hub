import { ComplaintStatus, ComplaintType } from "@prisma/client"

import { resend, renderEmailTemplate } from "@/lib/email"

export const complaintTypeOptions = [
  { value: "COMPLAINT", label: "Complaint" },
  { value: "FEEDBACK", label: "Feedback" },
  { value: "SUGGESTION", label: "Suggestion" },
] satisfies Array<{ value: ComplaintType; label: string }>

export const complaintStatusOptions = [
  { value: "OPEN", label: "Open" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
] satisfies Array<{ value: ComplaintStatus; label: string }>

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function getComplaintTypeLabel(type: ComplaintType) {
  return complaintTypeOptions.find((option) => option.value === type)?.label ?? type
}

export function getComplaintStatusLabel(status: ComplaintStatus) {
  return complaintStatusOptions.find((option) => option.value === status)?.label ?? status
}

export function getComplaintStatusTone(status: ComplaintStatus) {
  if (status === "RESOLVED") {
    return "bg-green-500/15 text-green-700 border-green-500/25"
  }

  if (status === "CLOSED") {
    return "bg-slate-500/15 text-slate-700 border-slate-500/25"
  }

  if (status === "IN_REVIEW") {
    return "bg-amber-500/15 text-amber-700 border-amber-500/25"
  }

  return "bg-blue-500/15 text-blue-700 border-blue-500/25"
}

export function getComplaintTypeTone(type: ComplaintType) {
  if (type === "FEEDBACK") {
    return "bg-green-500/15 text-green-700 border-green-500/25"
  }

  if (type === "SUGGESTION") {
    return "bg-purple-500/15 text-purple-700 border-purple-500/25"
  }

  return "bg-red-500/15 text-red-700 border-red-500/25"
}

function getComplaintAlertRecipients() {
  return (process.env.COMPLAINT_ALERT_EMAILS || process.env.ADMIN_ALERT_EMAILS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
}

export async function sendComplaintCreatedEmails({
  complaintId,
  subject,
  type,
  message,
  userName,
  userEmail,
}: {
  complaintId: string
  subject: string
  type: ComplaintType
  message: string
  userName: string
  userEmail: string
}) {
  const resendClient = resend

  if (!process.env.RESEND_API_KEY || !resendClient) return

  const adminRecipients = getComplaintAlertRecipients()
  const safeSubject = escapeHtml(subject)
  const safeMessage = escapeHtml(message)
  const safeComplaintId = escapeHtml(complaintId)
  const safeUserName = escapeHtml(userName)
  const safeUserEmail = escapeHtml(userEmail)

  const jobs: Promise<unknown>[] = [
    resendClient.emails.send({
      from: "ScholarsPass <no-reply@divupstudio.online>",
      to: [userEmail],
      subject: `We've received your ${getComplaintTypeLabel(type).toLowerCase()}`,
      text: `Your ${getComplaintTypeLabel(type).toLowerCase()} "${subject}" has been received. Reference ID: ${complaintId}.`,
      html: renderEmailTemplate({
        title: `${getComplaintTypeLabel(type)} Received`,
        greetingName: userName,
        bodyHtml: `
          <p>We have received your ${getComplaintTypeLabel(type).toLowerCase()} and shared it with the transport team.</p>
          <p><strong>Reference ID:</strong> ${safeComplaintId}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <p><strong>Current status:</strong> ${getComplaintStatusLabel("OPEN")}</p>
          <div style="margin-top: 16px; padding: 16px; border-radius: 8px; background: #f8fafc; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; font-weight: 600;">Submitted message</p>
            <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
          </div>
        `,
      }),
    }),
  ]

  if (adminRecipients.length > 0) {
    jobs.push(
      resendClient.emails.send({
        from: "ScholarsPass <no-reply@divupstudio.online>",
        to: adminRecipients,
        subject: `New ${getComplaintTypeLabel(type)} submitted`,
        text: `A new ${getComplaintTypeLabel(type).toLowerCase()} was submitted by ${userName} (${userEmail}). Reference ID: ${complaintId}. Subject: ${subject}.`,
        html: renderEmailTemplate({
          title: `New ${getComplaintTypeLabel(type)}`,
          greetingName: "Transport Team",
          bodyHtml: `
            <p>A new ${getComplaintTypeLabel(type).toLowerCase()} has been submitted through ScholarsPass.</p>
            <p><strong>Reference ID:</strong> ${safeComplaintId}</p>
            <p><strong>Submitted by:</strong> ${safeUserName} (${safeUserEmail})</p>
            <p><strong>Subject:</strong> ${safeSubject}</p>
            <div style="margin-top: 16px; padding: 16px; border-radius: 8px; background: #f8fafc; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; font-weight: 600;">Message</p>
              <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
            </div>
          `,
        }),
      })
    )
  }

  await Promise.allSettled(jobs)
}

export async function sendComplaintStatusEmail({
  complaintId,
  subject,
  type,
  status,
  adminResponse,
  userName,
  userEmail,
}: {
  complaintId: string
  subject: string
  type: ComplaintType
  status: ComplaintStatus
  adminResponse: string | null
  userName: string
  userEmail: string
}) {
  const resendClient = resend

  if (!process.env.RESEND_API_KEY || !resendClient) return
  const safeSubject = escapeHtml(subject)
  const safeComplaintId = escapeHtml(complaintId)
  const safeResponse = adminResponse ? escapeHtml(adminResponse) : null

  await resendClient.emails.send({
    from: "ScholarsPass <no-reply@divupstudio.online>",
    to: [userEmail],
    subject: `Update on your ${getComplaintTypeLabel(type).toLowerCase()}`,
    text: `Your ${getComplaintTypeLabel(type).toLowerCase()} "${subject}" is now ${getComplaintStatusLabel(status)}. Reference ID: ${complaintId}.${adminResponse ? ` Response: ${adminResponse}` : ""}`,
    html: renderEmailTemplate({
      title: `${getComplaintTypeLabel(type)} Updated`,
      greetingName: userName,
      bodyHtml: `
        <p>There is an update on your ${getComplaintTypeLabel(type).toLowerCase()}.</p>
        <p><strong>Reference ID:</strong> ${safeComplaintId}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <p><strong>Current status:</strong> ${getComplaintStatusLabel(status)}</p>
        ${
          safeResponse
            ? `
              <div style="margin-top: 16px; padding: 16px; border-radius: 8px; background: #f8fafc; border: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; font-weight: 600;">Admin response</p>
                <p style="margin: 0; white-space: pre-wrap;">${safeResponse}</p>
              </div>
            `
            : ""
        }
      `,
    }),
  })
}

export function canUserSeeComplaint(role: string | null | undefined) {
  return role === "USER" || role === "ADMIN"
}

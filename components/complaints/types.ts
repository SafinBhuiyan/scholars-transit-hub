import { ComplaintStatus, ComplaintType } from "@prisma/client"

export type ComplaintUser = {
  id: string
  name: string
  email: string
  image?: string | null
}

export type ComplaintStatusUpdatedBy = {
  id: string
  name: string
  email: string
} | null

export type AdminComplaintItem = {
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
  user: ComplaintUser
  statusUpdatedBy?: ComplaintStatusUpdatedBy
}

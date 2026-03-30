"use client"

import * as React from "react"
import Link from "next/link"
import { IconMessage, IconSearch } from "@tabler/icons-react"
import { ComplaintType } from "@prisma/client"

import {
  complaintTypeOptions,
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
import { Input } from "@/components/ui/input"
import type { AdminComplaintItem } from "@/components/complaints/types"

export function AdminComplaintsView({ initialComplaints }: { initialComplaints: AdminComplaintItem[] }) {
  const [complaints] = React.useState(initialComplaints)
  const [typeFilter, setTypeFilter] = React.useState<ComplaintType | "ALL">("ALL")
  const [query, setQuery] = React.useState("")

  const filteredComplaints = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return complaints.filter((complaint) => {
      if (typeFilter !== "ALL" && complaint.type !== typeFilter) return false
      if (!normalizedQuery) return true

      return [
        complaint.subject,
        complaint.message,
        complaint.user.name,
        complaint.user.email,
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [complaints, query, typeFilter])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Complaint / Feedback</h1>
        <p className="text-muted-foreground">
          Review user-reported issues, respond to feedback, and keep students updated with status emails.
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by subject, message, or user..."
            className="pl-9"
          />
        </div>

      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={typeFilter === "ALL" ? "default" : "outline"} size="sm" onClick={() => setTypeFilter("ALL")}>
          All types
        </Button>
        {complaintTypeOptions.map((option) => (
          <Button
            key={option.value}
            variant={typeFilter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {filteredComplaints.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            No complaint or feedback records match the current filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filteredComplaints.map((complaint) => (
            <Card key={complaint.id}>
              <CardHeader className="gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar size="lg">
                      <AvatarImage src={complaint.user.image ?? undefined} alt={complaint.user.name} />
                      <AvatarFallback>{complaint.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-base leading-snug">{complaint.subject}</CardTitle>
                      <CardDescription className="truncate">{complaint.user.name} • {complaint.user.email}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Badge variant="outline" className={getComplaintTypeTone(complaint.type)}>
                      {getComplaintTypeLabel(complaint.type)}
                    </Badge>
                    <Badge variant="outline" className={getComplaintStatusTone(complaint.status)}>
                      {getComplaintStatusLabel(complaint.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {complaint.message}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-none border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="mt-1 font-medium">{formatDateShort(complaint.createdAt)}</p>
                  </div>
                  <div className="rounded-none border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Last updated</p>
                    <p className="mt-1 font-medium">{formatDateShort(complaint.updatedAt)}</p>
                  </div>
                </div>

                {complaint.adminResponse ? (
                  <div className="rounded-none border border-primary/20 bg-primary/5 p-3">
                    <p className="text-xs font-medium text-primary">Current admin response</p>
                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-6">{complaint.adminResponse}</p>
                  </div>
                ) : null}

                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/admin/dashboard/complaint-feedback/${complaint.id}`}>
                    <IconMessage />
                    Review & Update
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { IconCamera, IconCheck, IconClock, IconLoader, IconMapPin, IconPhone, IconRoute, IconSearch, IconUser } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatDateShort } from "@/lib/utils"
import { toast } from "sonner"

type PassRecord = {
  id: string
  fullName: string
  department: string
  applicantType: "STUDENT" | "ACADEMIC" | "ADMINISTRATIVE"
  studentId: string | null
  phone: string
  status: "WAITLIST" | "APPROVED" | "REJECTED"
  createdAt: string
  route: { name: string } | null
  pickupPoint: { name: string } | null
}

export default function PassesPage() {
  const [query, setQuery] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<PassRecord[]>([])

  const loadPasses = React.useCallback(async (q = "") => {
    setLoading(true)
    try {
      const url = q ? `/api/admin/passes?q=${encodeURIComponent(q)}` : "/api/admin/passes"
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to load passes")
      }
      const data = await response.json()
      setResults(data)
    } catch {
      toast.error("We couldn't load the pass records right now.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadPasses()
  }, [loadPasses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await loadPasses(query.trim())
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Scan Pass</h1>
          <p className="text-muted-foreground">
            Look up approved transport passes by student ID, application ID, name, department, or phone number.
          </p>
        </div>
        <Button asChild className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/95">
          <Link href="/admin/dashboard/passes/scanner" className="flex items-center gap-1.5 font-semibold">
            <IconCamera className="h-4 w-4" />
            Open Camera Scanner
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <IconCamera className="h-5 w-5" />
            Pass Lookup
          </CardTitle>
          <CardDescription>
            Search a pass record before manually verifying the rider.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <IconSearch className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, student ID, phone, or application ID"
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={loading} className="sm:w-auto">
              {loading ? <IconLoader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Scan / Lookup
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((record) => (
          <Card key={record.id} className="overflow-hidden">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate text-lg">{record.fullName}</CardTitle>
                  <CardDescription className="mt-1">
                    {record.applicantType === "STUDENT" ? "Student" : record.applicantType === "ACADEMIC" ? "Academic Staff" : "Administrative Staff"}
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={record.status === "APPROVED" ? "bg-primary/15 text-primary border-primary/25" : "bg-muted text-muted-foreground border-border"}
                >
                  {record.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <IconUser className="h-4 w-4 text-muted-foreground" />
                <span>{record.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconRoute className="h-4 w-4 text-muted-foreground" />
                <span>{record.route?.name || "No route assigned"}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconMapPin className="h-4 w-4 text-muted-foreground" />
                <span>{record.pickupPoint?.name || "No pickup point"}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconPhone className="h-4 w-4 text-muted-foreground" />
                <span>{record.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-muted-foreground" />
                <span>{record.studentId || "Student ID not provided"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconClock className="h-4 w-4" />
                <span>{formatDateShort(record.createdAt)}</span>
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
                Pass ID: <span className="font-mono font-medium">{record.id}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && results.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <IconCamera className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No approved passes found</p>
            <p className="text-sm text-muted-foreground">
              Try searching by name, student ID, phone, or application ID.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

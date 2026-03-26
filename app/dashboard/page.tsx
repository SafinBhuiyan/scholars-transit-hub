import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

import data from "./data.json"

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
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  })

  const stats = [
    {
      label: "Application Status",
      value: application?.status || "N/A",
      description: "Current state of your request",
      trend: application?.status === "APPROVED" ? "Approved" : application?.status === "WAITLIST" ? "In Process" : "Not Started",
      trendValue: application?.status === "APPROVED" ? "+100%" : "0%",
      trendDirection: (application?.status === "APPROVED" ? "up" : application?.status === "WAITLIST" ? "neutral" : "down") as any
    },
    {
      label: "Assigned Route",
      value: application?.route.name || "None",
      description: application?.route ? `Morning: ${application.route.startTime}` : "No route assigned",
      trend: application?.route ? "Route Active" : "Pending",
      trendDirection: "neutral" as any
    },
    {
      label: "Pickup Point",
      value: application?.pickupPoint.name || "None",
      description: application?.pickupPoint.landmark || "Point of boarding",
      trend: "Verified",
      trendDirection: "up" as any
    },
    {
      label: "Recent Payment",
      value: application?.payments[0] ? `${application.payments[0].amount} BDT` : "0 BDT",
      description: application?.payments[0]?.paidAt ? `Paid on ${new Date(application.payments[0].paidAt).toLocaleDateString()}` : "No payments found",
      trend: application?.payments[0]?.status === "PAID" ? "Confirmed" : "Missing",
      trendDirection: (application?.payments[0]?.status === "PAID" ? "up" : "down") as any
    }
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <SectionCards stats={stats} />
      <ChartAreaInteractive />
      <DataTable data={data} />
    </div>
  )
}

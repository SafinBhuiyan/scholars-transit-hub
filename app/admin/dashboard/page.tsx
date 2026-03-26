import prisma from "@/lib/prisma"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

import data from "../../dashboard/data.json"

export default async function AdminDashboardPage() {
  const [
    totalApplications,
    pendingApplications,
    totalRevenue,
    totalUsers
  ] = await Promise.all([
    prisma.transportApplication.count(),
    prisma.transportApplication.count({ where: { status: "WAITLIST" } }),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true }
    }),
    prisma.user.count()
  ])

  const stats = [
    {
      label: "Total Applications",
      value: totalApplications,
      description: "Lifetime applications",
      trend: "System growth",
      trendValue: "+5%",
      trendDirection: "up" as const,
    },
    {
      label: "Pending Review",
      value: pendingApplications,
      description: "Waitlisted applications",
      trend: pendingApplications > 0 ? "Action required" : "All cleared",
      trendDirection: pendingApplications > 0 ? ("down" as const) : ("neutral" as const),
    },
    {
      label: "Total Revenue",
      value: `${(totalRevenue._sum.amount || 0).toLocaleString()} BDT`,
      description: "From paid passes",
      trend: "Live revenue",
      trendValue: "+12%",
      trendDirection: "up" as const,
    },
    {
      label: "Active Users",
      value: totalUsers,
      description: "Users in system",
      trend: "User base",
      trendValue: "+2%",
      trendDirection: "up" as const,
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
import prisma from "@/lib/prisma"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { ApplicationsTable } from "@/components/applications-table"
import { SectionCards } from "@/components/section-cards"

export default async function AdminDashboardPage() {
  const [
    totalApplications,
    pendingApplications,
    totalRevenue,
    totalUsers,
    approvedApplications,
    semesters,
    applications
  ] = await Promise.all([
    prisma.transportApplication.count(),
    prisma.transportApplication.count({ where: { status: "WAITLIST" } }),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true }
    }),
    prisma.user.count(),
    prisma.transportApplication.findMany({
      where: { status: "APPROVED" },
      select: { routeId: true },
    }),
    prisma.semester.findMany({
      orderBy: { startDate: "desc" },
    }),
    prisma.transportApplication.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        route: { include: { pickupPoints: true } },
        user: true,
        pickupPoint: true,
      },
    })
  ])

  const approvedCountByRoute = approvedApplications.reduce((acc, app) => {
    acc[app.routeId] = (acc[app.routeId] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const formattedApplications = applications.map((application) => {
    const pickupPoint = application.route.pickupPoints.find(
      (point) => point.id === application.pickupPointId
    )

    const approvedCount = approvedCountByRoute[application.routeId] || 0
    const totalCapacity = application.route.capacity
    const leftCapacity = Math.max(0, totalCapacity - approvedCount)

    return {
      id: application.id,
      fullName: application.fullName,
      userImage: application.user?.image || "",
      applicantType: application.applicantType,
      department: application.department,
      batch: application.batch,
      studentId: application.studentId,
      phone: application.phone,
      phoneVerified: application.phoneVerified,
      routeName: application.route.name,
      pickupPointName: pickupPoint?.name || "Unknown",
      status: application.status,
      appliedDate: `${application.createdAt.getDate()} ${application.createdAt.toLocaleString("en-US", { month: "short" })}, ${application.createdAt.getFullYear()}`,
      idCardUrl: application.idCardUrl,
      routeCapacity: application.route.capacity,
      leftCapacity: leftCapacity,
    }
  })

  const stats = [
    {
      label: "Total Applications",
      value: totalApplications,
      description: "Lifetime applications",
      trend: "System growth",
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
      trendDirection: "up" as const,
    },
    {
      label: "Active Users",
      value: totalUsers,
      description: "Users in system",
      trend: "User base",
      trendDirection: "up" as const,
    }
  ]

  return (
    <div className="flex flex-1 flex-col gap-6">
      <SectionCards stats={stats} />
      <ChartAreaInteractive />
      <ApplicationsTable
        hideToolbar={true}
        data={formattedApplications}
        semesters={semesters.map((semester) => ({
          id: semester.id,
          name: semester.name,
          startDate: semester.startDate.toISOString(),
          endDate: semester.endDate.toISOString(),
        }))}
      />
    </div>
  )
}
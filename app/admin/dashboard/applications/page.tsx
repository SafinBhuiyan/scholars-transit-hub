import prisma from "@/lib/prisma"
import { ApplicationsTable } from "@/components/applications-table"

export default async function ApplicationsPage() {
  // Get all approved applications to calculate route capacities
  const approvedApplications = await prisma.transportApplication.findMany({
    where: {
      status: "APPROVED",
    },
    select: {
      routeId: true,
    },
  })

  // Count approved applications per route
  const approvedCountByRoute = approvedApplications.reduce((acc, app) => {
    acc[app.routeId] = (acc[app.routeId] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const applications = await prisma.transportApplication.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      route: {
        include: {
          pickupPoints: true,
        },
      },
      user: true,
    },
  })

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

  return (
    <div className="flex flex-1 flex-col gap-6">
      <ApplicationsTable data={formattedApplications} />
    </div>
  )
}

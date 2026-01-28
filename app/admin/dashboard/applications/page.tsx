import prisma from "@/lib/prisma"
import { ApplicationsTable } from "@/components/applications-table"

export default async function ApplicationsPage() {
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
    },
  })

  const formattedApplications = applications.map((application) => {
    const pickupPoint = application.route.pickupPoints.find(
      (point) => point.id === application.pickupPointId
    )

    return {
      id: application.id,
      fullName: application.fullName,
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
    }
  })

  return (
    <div className="flex flex-1 flex-col gap-6">
      <ApplicationsTable data={formattedApplications} />
    </div>
  )
}

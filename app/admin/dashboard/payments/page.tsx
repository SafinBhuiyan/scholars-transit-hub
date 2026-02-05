import prisma from "@/lib/prisma"
import { PaymentsTable } from "@/components/payments-table"

export default async function PaymentsPage() {
  const payments = await prisma.payment.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      application: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          route: {
            select: {
              id: true,
              name: true,
            },
          },
          pickupPoint: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  const formattedPayments = payments.map((payment) => ({
    id: payment.id,
    applicationId: payment.applicationId,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    method: payment.method,
    transactionId: payment.transactionId,
    reference: payment.reference,
    paidAt: payment.paidAt?.toISOString() || null,
    requestedAt: payment.requestedAt.toISOString(),
    notes: payment.notes,
    application: {
      fullName: payment.application.fullName,
      department: payment.application.department,
      applicantType: payment.application.applicantType,
      user: {
        name: payment.application.user.name,
        email: payment.application.user.email,
        image: payment.application.user.image,
      },
      route: {
        name: payment.application.route.name,
      },
      pickupPoint: {
        name: payment.application.pickupPoint.name,
      },
    },
  }))

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PaymentsTable data={formattedPayments} />
    </div>
  )
}

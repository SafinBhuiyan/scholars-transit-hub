import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { StudentPaymentsView } from "@/components/student-payments-view"

export default async function StudentPaymentsPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/login")
  }

  // Get user's application
  const application = await prisma.transportApplication.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      route: true,
      pickupPoint: true,
      payments: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  if (!application) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Manage your transport pass payments</p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No application found. Please apply for a transport pass first.</p>
        </div>
      </div>
    )
  }

  const formattedPayments = application.payments.map((payment) => ({
    id: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    method: payment.method,
    invoiceId: payment.invoiceId,
    transactionId: payment.transactionId,
    senderNumber: payment.senderNumber,
    paidAt: payment.paidAt?.toISOString() || null,
    requestedAt: payment.requestedAt.toISOString(),
    notes: payment.notes,
  }))

  console.log("Student Payments Data:", {
    applicationId: application.id,
    fullName: application.fullName,
    paymentsCount: formattedPayments.length,
    payments: formattedPayments,
  })

  return (
    <div className="flex flex-1 flex-col gap-6">
      <StudentPaymentsView
        application={{
          id: application.id,
          fullName: application.fullName,
          applicantType: application.applicantType,
          department: application.department,
          batch: application.batch,
          studentId: application.studentId,
          status: application.status,
          route: {
            name: application.route.name,
          },
          pickupPoint: {
            name: application.pickupPoint.name,
          },
        }}
        payments={formattedPayments}
      />
    </div>
  )
}

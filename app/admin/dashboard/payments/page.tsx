import prisma from "@/lib/prisma"
import { PaymentsTable } from "@/components/payments-table"
import { verifyPayment } from "@/lib/uddoktapay"

export default async function PaymentsPage() {
  const pendingWithInvoice = await prisma.payment.findMany({
    where: {
      status: "PENDING",
      invoiceId: { not: null },
    },
    select: {
      id: true,
      invoiceId: true,
    },
    take: 25,
  })

  for (const payment of pendingWithInvoice) {
    try {
      if (!payment.invoiceId) continue
      const result = await verifyPayment(payment.invoiceId)
      const gatewayStatus = result.data?.status?.toUpperCase()

      let nextStatus: "PENDING" | "PAID" | "FAILED" = "PENDING"
      if (gatewayStatus === "COMPLETED") nextStatus = "PAID"
      if (gatewayStatus === "FAILED") nextStatus = "FAILED"

      let paymentMethod: "BKASH" | "NAGAD" | "ROCKET" | "CARD" | "BANK_TRANSFER" | null = null
      if (result.data?.payment_method) {
        const method = result.data.payment_method.toUpperCase()
        if (["BKASH", "NAGAD", "ROCKET", "CARD", "BANK_TRANSFER"].includes(method)) {
          paymentMethod = method as any
        }
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: nextStatus,
          transactionId: result.data?.transaction_id || null,
          method: paymentMethod,
          senderNumber: result.data?.sender_number || null,
          paidAt: nextStatus === "PAID" && result.data?.date ? new Date(result.data.date) : null,
        },
      })
    } catch (error) {
      console.error("Failed to sync payment:", payment.id, error)
    }
  }

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
    invoiceId: payment.invoiceId,
    invoiceNumber: payment.invoiceNumber,
    paymentUrl: payment.paymentUrl,
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

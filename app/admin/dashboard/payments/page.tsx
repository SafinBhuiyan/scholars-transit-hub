import prisma from "@/lib/prisma"
import { PaymentsTable } from "@/components/payments-table"
import { queryPaymentByTransactionId } from "@/lib/sslcommerz"

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
      const result = await queryPaymentByTransactionId(payment.invoiceId)
      const gatewayPayment = result.element?.[0]
      const gatewayStatus = gatewayPayment?.status?.toUpperCase()

      let nextStatus: "PENDING" | "PAID" | "FAILED" = "PENDING"
      if (gatewayStatus === "VALID" || gatewayStatus === "VALIDATED") nextStatus = "PAID"
      if (gatewayStatus === "FAILED") nextStatus = "FAILED"

      const paymentMethod = gatewayPayment?.card_type ? "CARD" : null

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: nextStatus,
          transactionId: gatewayPayment?.bank_tran_id || gatewayPayment?.val_id || null,
          method: paymentMethod,
          senderNumber: null,
          paidAt: nextStatus === "PAID" && gatewayPayment?.tran_date ? new Date(gatewayPayment.tran_date) : null,
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

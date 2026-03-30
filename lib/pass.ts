import QRCode from "qrcode"

type PassApplication = {
  id: string
  createdAt: Date
  updatedAt: Date
  status: "WAITLIST" | "APPROVED" | "REJECTED"
  applicantType: "STUDENT" | "ACADEMIC" | "ADMINISTRATIVE"
  fullName: string
  route: {
    name: string
  }
  pickupPoint: {
    name: string
  }
  payments: Array<{
    status: "PENDING" | "PAID" | "FAILED" | "REFUNDED"
    paidAt: Date | null
  }>
}

export function getPassId(application: Pick<PassApplication, "id" | "createdAt">) {
  return `STH-${application.createdAt.getFullYear()}-${application.id.slice(-6).toUpperCase()}`
}

export function getPassState(application: PassApplication) {
  const isStudent = application.applicantType === "STUDENT"
  const latestPaidPayment = application.payments.find((payment) => payment.status === "PAID") ?? null
  const hasPaidRequirement = !isStudent || Boolean(latestPaidPayment)
  const isApproved = application.status === "APPROVED"
  const isPassActive = isApproved && hasPaidRequirement
  const passIssuedAt = latestPaidPayment?.paidAt ?? application.updatedAt
  const passId = getPassId(application)

  return {
    isStudent,
    latestPaidPayment,
    hasPaidRequirement,
    isApproved,
    isPassActive,
    passIssuedAt,
    passId,
  }
}

export function getPassQrPayload(application: PassApplication, userId: string) {
  const { passId, passIssuedAt } = getPassState(application)

  return JSON.stringify({
    passId,
    applicationId: application.id,
    userId,
    fullName: application.fullName,
    applicantType: application.applicantType,
    route: application.route.name,
    pickupPoint: application.pickupPoint.name,
    issuedAt: passIssuedAt.toISOString(),
  })
}

export async function getPassQrSvg(application: PassApplication, userId: string, width = 220) {
  const { isPassActive } = getPassState(application)

  if (!isPassActive) return null

  return QRCode.toString(getPassQrPayload(application, userId), {
    type: "svg",
    width,
    margin: 1,
    errorCorrectionLevel: "M",
    color: {
      dark: "#111111",
      light: "#FFFFFF",
    },
  })
}

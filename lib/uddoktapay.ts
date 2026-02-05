// UddoktaPay Payment Gateway Integration

const UDDOKTAPAY_API_KEY = process.env.UDDOKTAPAY_API_KEY!
const UDDOKTAPAY_BASE_URL = process.env.UDDOKTAPAY_BASE_URL!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export interface CheckoutRequest {
    amount: string
    fullName: string
    email: string
    invoiceNumber: string
    paymentType: string
    redirectUrl: string
    cancelUrl: string
    webhookUrl: string
    metadata?: {
        applicationId: string
        userId: string
        semester: string
    }
}

export interface CheckoutResponse {
    status: boolean
    message: string
    payment_url?: string
    invoice_id?: string
}

export interface VerifyPaymentResponse {
    status: boolean
    message: string
    data?: {
        invoice_id: string
        amount: string
        transaction_id: string
        payment_method: string
        sender_number: string
        date: string
        status: string
    }
}

export interface RefundRequest {
    invoiceId: string
}

export interface RefundResponse {
    status: boolean
    message: string
}

/**
 * Create a payment checkout session
 */
export async function createCheckout(data: CheckoutRequest): Promise<CheckoutResponse> {
    try {
        // Transform data to match UddoktaPay API expectations
        const payload = {
            full_name: data.fullName,
            email: data.email,
            amount: data.amount,
            metadata: data.metadata,
            redirect_url: data.redirectUrl,
            return_type: "GET",
            cancel_url: data.cancelUrl,
            webhook_url: data.webhookUrl,
        }

        console.log("UddoktaPay checkout payload:", payload)

        const response = await fetch(`${UDDOKTAPAY_BASE_URL}/checkout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "RT-UDDOKTAPAY-API-KEY": UDDOKTAPAY_API_KEY,
            },
            body: JSON.stringify(payload),
        })

        const result = await response.json()
        console.log("UddoktaPay checkout response:", result)
        return result
    } catch (error) {
        console.error("UddoktaPay checkout error:", error)
        throw new Error("Failed to create payment checkout")
    }
}

/**
 * Verify payment status
 */
export async function verifyPayment(invoiceId: string): Promise<VerifyPaymentResponse> {
    try {
        const response = await fetch(`${UDDOKTAPAY_BASE_URL}/verify-payment`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "RT-UDDOKTAPAY-API-KEY": UDDOKTAPAY_API_KEY,
            },
            body: JSON.stringify({ invoice_id: invoiceId }),
        })

        const result = await response.json()
        return result
    } catch (error) {
        console.error("UddoktaPay verify error:", error)
        throw new Error("Failed to verify payment")
    }
}

/**
 * Refund a payment
 */
export async function refundPayment(invoiceId: string): Promise<RefundResponse> {
    try {
        const response = await fetch(`${UDDOKTAPAY_BASE_URL}/refund-payment`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "RT-UDDOKTAPAY-API-KEY": UDDOKTAPAY_API_KEY,
            },
            body: JSON.stringify({ invoice_id: invoiceId }),
        })

        const result = await response.json()
        return result
    } catch (error) {
        console.error("UddoktaPay refund error:", error)
        throw new Error("Failed to refund payment")
    }
}

/**
 * Generate unique invoice number
 */
export function generateInvoiceNumber(applicationId: string): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return `STH-${applicationId.slice(0, 8).toUpperCase()}-${timestamp}-${random}`
}

/**
 * Get payment redirect URLs
 */
export function getPaymentUrls(applicationId: string) {
    return {
        redirectUrl: `${APP_URL}/dashboard/payment/success?applicationId=${applicationId}`,
        cancelUrl: `${APP_URL}/dashboard/payment/cancel?applicationId=${applicationId}`,
        webhookUrl: `${APP_URL}/api/webhooks/uddoktapay`,
    }
}

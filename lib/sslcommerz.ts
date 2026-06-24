const SSLCOMMERZ_STORE_ID = process.env.SSLCOMMERZ_STORE_ID || ""
const SSLCOMMERZ_STORE_PASSWORD =
  process.env.SSLCOMMERZ_STORE_PASSWORD ||
  process.env.SSLCOMMERZ_STORE_SECRET_KEY ||
  ""

// Set SSLCOMMERZ_IS_LIVE=true in .env to switch to the live gateway
const IS_LIVE = process.env.SSLCOMMERZ_IS_LIVE === "true"
const SSLCOMMERZ_BASE_URL = IS_LIVE
  ? "https://securepay.sslcommerz.com"
  : "https://sandbox.sslcommerz.com"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

const INITIATE_ENDPOINT = `${SSLCOMMERZ_BASE_URL}/gwprocess/v4/api.php`
const VALIDATION_ENDPOINT = `${SSLCOMMERZ_BASE_URL}/validator/api/validationserverAPI.php`
const TRANSACTION_QUERY_ENDPOINT = `${SSLCOMMERZ_BASE_URL}/validator/api/merchantTransIDvalidationAPI.php`

export interface SSLCommerzInitiateRequest {
  amount: string
  currency?: string
  tranId: string
  fullName: string
  email: string
  phone?: string
  applicationId: string
  productName?: string
}

export interface SSLCommerzInitiateResponse {
  status: string
  failedreason?: string
  sessionkey?: string
  GatewayPageURL?: string
  gatewayPageURL?: string
  redirectGatewayURL?: string
  redirectGatewayURLFailed?: string
  directPaymentURLBank?: string
  directPaymentURLCard?: string
}

export interface SSLCommerzValidationResponse {
  status?: string
  tran_id?: string
  val_id?: string
  amount?: string
  currency?: string
  bank_tran_id?: string
  card_type?: string
  card_issuer?: string
  card_brand?: string
  card_issuer_country?: string
  tran_date?: string
  value_a?: string
  value_b?: string
  value_c?: string
  value_d?: string
  error?: string
}

export interface SSLCommerzTransactionQueryResponse {
  APIConnect?: string
  no_of_trans_found?: number
  element?: SSLCommerzValidationResponse[]
}

function requireCredentials() {
  if (!SSLCOMMERZ_STORE_ID || !SSLCOMMERZ_STORE_PASSWORD) {
    throw new Error("SSLCommerz credentials are not configured")
  }
}

function getPaymentUrls(applicationId: string) {
  return {
    successUrl: `${APP_URL}/api/payments/success?applicationId=${applicationId}`,
    failUrl: `${APP_URL}/api/payments/fail?applicationId=${applicationId}`,
    cancelUrl: `${APP_URL}/api/payments/cancel?applicationId=${applicationId}`,
  }
}

export function generateInvoiceNumber(applicationId: string): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `STH-${applicationId.slice(0, 8).toUpperCase()}-${timestamp}-${random}`
}

export async function initiatePayment(
  data: SSLCommerzInitiateRequest
): Promise<SSLCommerzInitiateResponse> {
  requireCredentials()

  const { successUrl, failUrl, cancelUrl } = getPaymentUrls(data.applicationId)
  const payload = new URLSearchParams({
    store_id: SSLCOMMERZ_STORE_ID,
    store_passwd: SSLCOMMERZ_STORE_PASSWORD,
    total_amount: data.amount,
    currency: data.currency || "BDT",
    tran_id: data.tranId,
    success_url: successUrl,
    fail_url: failUrl,
    cancel_url: cancelUrl,
    cus_name: data.fullName,
    cus_email: data.email,
    cus_add1: "Not provided",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    cus_phone: data.phone || "Not provided",
    shipping_method: "NO",
    product_name: data.productName || "Transport Pass Payment",
    product_category: "Transport",
    product_profile: "non-physical-goods",
    value_a: data.applicationId,
  })

  const response = await fetch(INITIATE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload.toString(),
  })

  const result = (await response.json()) as SSLCommerzInitiateResponse

  if (!response.ok) {
    throw new Error(result.failedreason || "Failed to initiate SSLCommerz payment")
  }

  return result
}

export async function validatePayment(
  valId: string
): Promise<SSLCommerzValidationResponse> {
  requireCredentials()

  const params = new URLSearchParams({
    val_id: valId,
    store_id: SSLCOMMERZ_STORE_ID,
    store_passwd: SSLCOMMERZ_STORE_PASSWORD,
    v: "1",
    format: "json",
  })

  const response = await fetch(`${VALIDATION_ENDPOINT}?${params.toString()}`, {
    method: "GET",
  })

  const result = (await response.json()) as SSLCommerzValidationResponse

  if (!response.ok) {
    throw new Error(result.error || "Failed to validate SSLCommerz payment")
  }

  return result
}

export async function queryPaymentByTransactionId(
  tranId: string
): Promise<SSLCommerzTransactionQueryResponse> {
  requireCredentials()

  const params = new URLSearchParams({
    tran_id: tranId,
    store_id: SSLCOMMERZ_STORE_ID,
    store_passwd: SSLCOMMERZ_STORE_PASSWORD,
    v: "1",
    format: "json",
  })

  const response = await fetch(`${TRANSACTION_QUERY_ENDPOINT}?${params.toString()}`, {
    method: "GET",
  })

  const result = (await response.json()) as SSLCommerzTransactionQueryResponse

  if (!response.ok) {
    throw new Error("Failed to query SSLCommerz transaction")
  }

  return result
}

export function getGatewayUrl(response: SSLCommerzInitiateResponse) {
  return response.GatewayPageURL || response.gatewayPageURL || null
}

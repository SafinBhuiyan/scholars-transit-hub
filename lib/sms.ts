// MRAM SMS API configuration
const SMS_API_URL = "https://msg.mram.com.bd/smsapi"
const SMS_API_KEY = process.env.SMS_API_KEY
const SENDER_ID = process.env.SMS_SENDER_ID

export async function sendSMS(phone: string, message: string): Promise<boolean> {
  try {
    if (!SMS_API_KEY || !SENDER_ID) {
      console.warn("SMS credentials not configured, skipping SMS")
      return false
    }

    // Format phone number
    let formattedPhone = phone.replace(/\D/g, "")
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "88" + formattedPhone
    } else if (!formattedPhone.startsWith("88")) {
      formattedPhone = "88" + formattedPhone
    }

    const url = `${SMS_API_URL}?api_key=${SMS_API_KEY}&type=text&contacts=${formattedPhone}&senderid=${SENDER_ID}&msg=${encodeURIComponent(message)}`

    const response = await fetch(url, { method: "GET" })
    const responseText = await response.text()

    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      if (response.ok) {
        return true
      }
      console.error("SMS API returned non-JSON response with error status:", response.status)
      return false
    }

    if (data?.status === "success" || data?.status_code === 200 || response.ok) {
      return true
    }

    console.error("SMS API Error:", data)
    return false
  } catch (error) {
    console.error("SMS Send Error:", error)
    return false
  }
}

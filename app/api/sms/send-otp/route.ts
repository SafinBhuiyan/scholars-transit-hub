import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import crypto from "crypto"

// MRAM SMS API configuration
const SMS_API_URL = "https://msg.mram.com.bd/smsapi"
const SMS_API_KEY = process.env.SMS_API_KEY
const SENDER_ID = process.env.SMS_SENDER_ID

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

async function sendSMS(phone: string, message: string): Promise<boolean> {
  try {
    // Clean phone number - remove any non-digits except leading +
    const cleanPhone = phone.replace(/[^\d+]/g, "")

    // Ensure phone has country code
    const formattedPhone = cleanPhone.startsWith("+880")
      ? cleanPhone
      : cleanPhone.startsWith("880")
        ? `+${cleanPhone}`
        : cleanPhone.startsWith("01")
          ? `+88${cleanPhone}`
          : cleanPhone

    const url = `${SMS_API_URL}?api_key=${SMS_API_KEY}&type=text&contacts=${formattedPhone}&senderid=${SENDER_ID}&msg=${encodeURIComponent(message)}`

    console.log("Sending SMS to:", formattedPhone)
    console.log("SMS URL:", url)

    const response = await fetch(url, {
      method: "GET",
    })

    console.log("SMS Response Status:", response.status)

    // Get response text first to handle both JSON and plain text responses
    const responseText = await response.text()
    console.log("SMS Response Body:", responseText)

    // Try to parse as JSON, if fails, treat as plain text
    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      // If not JSON, check if response was successful based on status code
      if (response.ok) {
        console.log("SMS sent successfully (non-JSON response)")
        return true
      }
      console.error("SMS API returned non-JSON response with error status:", response.status)
      return false
    }

    // MRAM API response format: { code: number, message: string }
    // Also handle other possible success codes
    if (data.code === 202 || data.code === 200 || data.code === 1000 || data.status === "success" || data.success === true) {
      console.log("SMS sent successfully")
      return true
    }

    console.error("SMS API Error:", data)
    return false
  } catch (error) {
    console.error("SMS Send Error:", error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      )
    }

    // Generate OTP
    const otp = generateOTP()

    // Store OTP in database with 10 minute expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Clean phone for storage
    const cleanPhone = phone.replace(/[^\d]/g, "")
    const identifier = `otp_${cleanPhone}`

    // Delete any existing OTP for this phone
    await prisma.verification.deleteMany({
      where: { identifier: { startsWith: `otp_${cleanPhone}` } },
    })

    // Create new OTP
    await prisma.verification.create({
      data: {
        identifier,
        value: otp,
        expiresAt,
      },
    })

    // Send OTP via SMS
    const message = `Your Scholars Transit Hub verification code is ${otp}. It expires in 10 minutes.`
    const smsSent = await sendSMS(phone, message)

    // For development: return OTP in response if SMS fails
    const isDev = process.env.NODE_ENV === "development"

    if (!smsSent && !isDev) {
      return NextResponse.json(
        { error: "Failed to send OTP. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      // Only include OTP in dev mode for testing
      ...(isDev && !smsSent && { otp }),
    })
  }
  catch (error) {
    console.error("OTP Send Error:", error)
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    )
  }
}

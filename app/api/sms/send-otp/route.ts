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

    const response = await fetch(url, {
      method: "GET",
    })

    const data = await response.json()

    // MRAM API response format: { code: number, message: string }
    if (data.code === 202 || data.code === 200) {
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
    const message = `Your Scholars Transit Hub verification code is: ${otp}. This code expires in 1 minutes.`
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

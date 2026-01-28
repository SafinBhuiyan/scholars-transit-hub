import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
    try {
        const { phone, otp } = await request.json()

        if (!phone || !otp) {
            return NextResponse.json(
                { error: "Phone number and OTP are required" },
                { status: 400 }
            )
        }

        // Clean phone for lookup
        const cleanPhone = phone.replace(/[^\d]/g, "")

        // Find the stored OTP
        const verification = await prisma.verification.findFirst({
            where: { identifier: `otp_${cleanPhone}` },
        })

        if (!verification) {
            return NextResponse.json(
                { error: "OTP not found. Please request a new OTP." },
                { status: 400 }
            )
        }

        // Check if OTP has expired
        if (new Date() > verification.expiresAt) {
            await prisma.verification.deleteMany({
                where: { identifier: `otp_${cleanPhone}` },
            })
            return NextResponse.json(
                { error: "OTP has expired. Please request a new OTP." },
                { status: 400 }
            )
        }

        // Verify OTP
        if (verification.value !== otp) {
            return NextResponse.json(
                { error: "Invalid OTP. Please try again." },
                { status: 400 }
            )
        }

        // OTP is valid - delete it to prevent reuse
        await prisma.verification.deleteMany({
            where: { identifier: `otp_${cleanPhone}` },
        })

        return NextResponse.json({
            success: true,
            message: "Phone number verified successfully",
        })
    } catch (error) {
        console.error("OTP Verification Error:", error)
        return NextResponse.json(
            { error: "Failed to verify OTP" },
            { status: 500 }
        )
    }
}

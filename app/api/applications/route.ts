import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() })

        if (!session || session.user.role !== "USER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const {
            applicantType,
            fullName,
            department,
            batch,
            studentId,
            phone,
            phoneVerified,
            idCardUrl,
            routeId,
            pickupPointId,
        } = body

        // Validate required fields based on applicant type
        if (!applicantType || !fullName || !department || !phone || !phoneVerified || !idCardUrl || !routeId || !pickupPointId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        if (applicantType === "STUDENT" && (!batch || !studentId)) {
            return NextResponse.json({ error: "Batch and Student ID are required for students" }, { status: 400 })
        }

        // Check if student ID is already used by another application
        if (applicantType === "STUDENT" && studentId) {
            const existingStudentId = await prisma.transportApplication.findFirst({
                where: {
                    studentId: studentId
                }
            })

            if (existingStudentId) {
                return NextResponse.json({ error: "This Student ID is already registered for a transport pass" }, { status: 400 })
            }
        }

        // Check if user already has a pending or approved application
        const existingApplication = await prisma.transportApplication.findFirst({
            where: {
                userId: session.user.id,
                status: { in: ["WAITLIST", "APPROVED"] }
            }
        })

        if (existingApplication) {
            return NextResponse.json({ error: "You already have an active application" }, { status: 400 })
        }

        const application = await prisma.transportApplication.create({
            data: {
                userId: session.user.id,
                applicantType,
                fullName,
                department,
                batch,
                studentId,
                phone,
                phoneVerified,
                idCardUrl,
                routeId,
                pickupPointId,
                status: "WAITLIST",
            },
            include: {
                route: true,
            }
        })

        return NextResponse.json({ application }, { status: 201 })
    } catch (error) {
        console.error("Error creating application:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() })

        if (!session || session.user.role !== "USER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const application = await prisma.transportApplication.findFirst({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            include: {
                route: {
                    include: {
                        pickupPoints: {
                            where: { isActive: true },
                            orderBy: { order: "asc" }
                        }
                    }
                }
            }
        })

        return NextResponse.json({ application })
    } catch (error) {
        console.error("Error fetching application:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { applicationId, amount, notes } = body;

        if (!applicationId || !amount) {
            return NextResponse.json(
                { error: "Application ID and amount are required" },
                { status: 400 }
            );
        }

        // Verify application exists and is approved
        const application = await prisma.transportApplication.findUnique({
            where: { id: applicationId },
            include: {
                user: true,
            },
        });

        if (!application) {
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            );
        }

        if (application.status !== "APPROVED") {
            return NextResponse.json(
                { error: "Only approved applications can have payment requests" },
                { status: 400 }
            );
        }

        // Check if payment already exists
        const existingPayment = await prisma.payment.findFirst({
            where: {
                applicationId,
                status: {
                    in: ["PENDING", "PAID"],
                },
            },
        });

        if (existingPayment) {
            return NextResponse.json(
                { error: "Payment request already exists for this application" },
                { status: 400 }
            );
        }

        // Create payment request
        const payment = await prisma.payment.create({
            data: {
                applicationId,
                amount: parseFloat(amount),
                notes,
                status: "PENDING",
            },
            include: {
                application: {
                    include: {
                        user: true,
                        route: true,
                        pickupPoint: true,
                    },
                },
            },
        });

        return NextResponse.json(payment);
    } catch (error) {
        console.error("Failed to create payment:", error);
        return NextResponse.json(
            { error: "Failed to create payment request" },
            { status: 500 }
        );
    }
}

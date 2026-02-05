import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { verifyPayment } from "@/lib/uddoktapay";

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { invoiceId } = body;

        if (!invoiceId) {
            return NextResponse.json(
                { error: "Invoice ID is required" },
                { status: 400 }
            );
        }

        // Get payment by invoice ID
        const payment = await prisma.payment.findUnique({
            where: { invoiceId },
            include: {
                application: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!payment) {
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        // Verify user owns this payment
        if (payment.application.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify payment with UddoktaPay
        const verifyResponse = await verifyPayment(invoiceId);

        if (!verifyResponse.status || !verifyResponse.data) {
            return NextResponse.json({
                success: false,
                message: verifyResponse.message || "Payment verification failed",
                status: "PENDING",
            });
        }

        const paymentData = verifyResponse.data;

        // Determine payment method from UddoktaPay response
        let paymentMethod: "BKASH" | "NAGAD" | "ROCKET" | "CARD" | null = null;
        if (paymentData.payment_method) {
            const method = paymentData.payment_method.toUpperCase();
            if (["BKASH", "NAGAD", "ROCKET", "CARD"].includes(method)) {
                paymentMethod = method as any;
            }
        }

        // Update payment status
        const updatedPayment = await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: paymentData.status === "COMPLETED" ? "PAID" : "PENDING",
                transactionId: paymentData.transaction_id,
                method: paymentMethod,
                senderNumber: paymentData.sender_number,
                paidAt: paymentData.status === "COMPLETED" ? new Date(paymentData.date) : null,
            },
        });

        return NextResponse.json({
            success: true,
            payment: updatedPayment,
            status: updatedPayment.status,
        });
    } catch (error: any) {
        console.error("Failed to verify payment:", error);
        return NextResponse.json(
            { error: error.message || "Failed to verify payment" },
            { status: 500 }
        );
    }
}

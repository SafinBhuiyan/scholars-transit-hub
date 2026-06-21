import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { queryPaymentByTransactionId } from "@/lib/sslcommerz";

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
}

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

        const verifyResponse = await queryPaymentByTransactionId(invoiceId);
        const paymentData = verifyResponse.element?.[0];

        if (verifyResponse.APIConnect !== "DONE" || !paymentData) {
            return NextResponse.json({
                success: false,
                message: "Payment verification failed",
                status: "PENDING",
            });
        }

        const gatewayStatus = paymentData.status?.toUpperCase();
        const nextStatus = gatewayStatus === "VALID" || gatewayStatus === "VALIDATED"
            ? "PAID"
            : gatewayStatus === "FAILED"
                ? "FAILED"
                : "PENDING";

        const wasPaid = payment.status === "PAID";
        const updatedPayment = await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: nextStatus,
                transactionId: paymentData.bank_tran_id || paymentData.val_id || null,
                method: paymentData.card_type ? "CARD" : null,
                senderNumber: null,
                paidAt: nextStatus === "PAID" && paymentData.tran_date ? new Date(paymentData.tran_date) : null,
            },
        });

        if (nextStatus === "PAID" && !wasPaid) {
            await prisma.notification.create({
                data: {
                    userId: payment.application.userId,
                    title: "Payment Successful",
                    message: "Your transport pass is now active.",
                },
            });
        }

        return NextResponse.json({
            success: true,
            payment: updatedPayment,
            status: updatedPayment.status,
        });
    } catch (error: unknown) {
        console.error("Failed to verify payment:", error);
        return NextResponse.json(
            { error: getErrorMessage(error, "Failed to verify payment") },
            { status: 500 }
        );
    }
}

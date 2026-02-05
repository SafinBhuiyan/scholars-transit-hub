import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log("UddoktaPay Webhook received:", body);

        const {
            invoice_id,
            transaction_id,
            amount,
            payment_method,
            sender_number,
            date,
            status,
        } = body;

        if (!invoice_id) {
            return NextResponse.json(
                { error: "Invoice ID is required" },
                { status: 400 }
            );
        }

        // Find payment by invoice ID
        const payment = await prisma.payment.findUnique({
            where: { invoiceId: invoice_id },
        });

        if (!payment) {
            console.error("Payment not found for invoice:", invoice_id);
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        // Determine payment method
        let paymentMethod: "BKASH" | "NAGAD" | "ROCKET" | "CARD" | null = null;
        if (payment_method) {
            const method = payment_method.toUpperCase();
            if (["BKASH", "NAGAD", "ROCKET", "CARD"].includes(method)) {
                paymentMethod = method as any;
            }
        }

        // Update payment status
        const updatedPayment = await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: status === "COMPLETED" ? "PAID" : status === "FAILED" ? "FAILED" : "PENDING",
                transactionId: transaction_id,
                method: paymentMethod,
                senderNumber: sender_number,
                paidAt: status === "COMPLETED" ? new Date(date) : null,
            },
        });

        console.log("Payment updated via webhook:", {
            paymentId: updatedPayment.id,
            status: updatedPayment.status,
            transactionId: transaction_id,
        });

        return NextResponse.json({
            success: true,
            message: "Webhook processed successfully",
        });
    } catch (error: any) {
        console.error("Webhook processing error:", error);
        return NextResponse.json(
            { error: error.message || "Webhook processing failed" },
            { status: 500 }
        );
    }
}

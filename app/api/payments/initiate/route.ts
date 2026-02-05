import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createCheckout, generateInvoiceNumber, getPaymentUrls } from "@/lib/uddoktapay";

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { paymentId } = body;

        if (!paymentId) {
            return NextResponse.json(
                { error: "Payment ID is required" },
                { status: 400 }
            );
        }

        // Get payment details
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
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

        // Check if payment is already paid
        if (payment.status === "PAID") {
            return NextResponse.json(
                { error: "Payment already completed" },
                { status: 400 }
            );
        }

        // Check if applicant is a student (only students need to pay)
        if (payment.application.applicantType !== "STUDENT") {
            return NextResponse.json(
                { error: "Only students need to make payment. Academic and administrative staff get free passes." },
                { status: 400 }
            );
        }

        // Generate invoice number if not exists
        let invoiceNumber = payment.invoiceId;
        if (!invoiceNumber) {
            invoiceNumber = generateInvoiceNumber(payment.applicationId);

            // Update payment with invoice number
            await prisma.payment.update({
                where: { id: paymentId },
                data: { invoiceId: invoiceNumber },
            });
        }

        // Get payment URLs
        const { redirectUrl, cancelUrl, webhookUrl } = getPaymentUrls(payment.applicationId);

        // Create checkout session with UddoktaPay
        const checkoutResponse = await createCheckout({
            amount: payment.amount.toString(),
            fullName: payment.application.fullName,
            email: payment.application.user.email,
            invoiceNumber: invoiceNumber,
            paymentType: "Transport Pass Payment",
            redirectUrl,
            cancelUrl,
            webhookUrl,
            metadata: {
                applicationId: payment.applicationId,
                userId: payment.application.userId,
                semester: payment.notes || "",
            },
        });

        if (!checkoutResponse.status || !checkoutResponse.payment_url) {
            throw new Error(checkoutResponse.message || "Failed to create checkout session");
        }

        return NextResponse.json({
            success: true,
            paymentUrl: checkoutResponse.payment_url,
            invoiceId: invoiceNumber,
        });
    } catch (error: any) {
        console.error("Failed to initiate payment:", error);
        return NextResponse.json(
            { error: error.message || "Failed to initiate payment" },
            { status: 500 }
        );
    }
}

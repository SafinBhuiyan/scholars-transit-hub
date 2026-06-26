import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateInvoiceNumber, getGatewayUrl, initiatePayment } from "@/lib/sslcommerz";

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
                        route: true,
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

        // SSLCommerz uses tran_id as the merchant transaction reference.
        let invoiceId = payment.invoiceId;
        const invoiceNumber = payment.invoiceNumber || invoiceId || generateInvoiceNumber(payment.applicationId);
        if (!invoiceId) {
            invoiceId = invoiceNumber;
            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    invoiceId,
                    invoiceNumber,
                },
            });
        }

        const checkoutResponse = await initiatePayment({
            amount: payment.amount.toString(),
            currency: payment.currency,
            fullName: payment.application.fullName,
            email: payment.application.user.email,
            phone: payment.application.phone,
            tranId: invoiceId,
            applicationId: payment.applicationId,
            productName: `Transport Pass Payment - ${payment.application.route.name}`,
        });
        const gatewayUrl = getGatewayUrl(checkoutResponse);

        if (checkoutResponse.status !== "SUCCESS" || !gatewayUrl) {
            throw new Error(checkoutResponse.failedreason || "Failed to create checkout session");
        }

        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                paymentUrl: gatewayUrl,
                invoiceId,
                invoiceNumber,
            },
        });

        return NextResponse.json({
            success: true,
            paymentUrl: gatewayUrl,
            invoiceId,
        });
    } catch (error: unknown) {
        console.error("Failed to initiate payment:", error);
        return NextResponse.json(
            { error: getErrorMessage(error, "Failed to initiate payment") },
            { status: 500 }
        );
    }
}

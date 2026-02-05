import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, method, transactionId, reference, notes, amount } = body;

        // Validate payment exists
        const existingPayment = await prisma.payment.findUnique({
            where: { id },
        });

        if (!existingPayment) {
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        // Update payment
        const updateData: any = {
            updatedAt: new Date(),
        };

        if (status) updateData.status = status;
        if (method) updateData.method = method;
        if (transactionId !== undefined) updateData.transactionId = transactionId;
        if (reference !== undefined) updateData.reference = reference;
        if (notes !== undefined) updateData.notes = notes;
        if (amount !== undefined) updateData.amount = amount;

        // If marking as paid, set paidAt timestamp
        if (status === "PAID" && existingPayment.status !== "PAID") {
            updateData.paidAt = new Date();
        }

        const payment = await prisma.payment.update({
            where: { id },
            data: updateData,
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
        console.error("Failed to update payment:", error);
        return NextResponse.json(
            { error: "Failed to update payment" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await prisma.payment.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete payment:", error);
        return NextResponse.json(
            { error: "Failed to delete payment" },
            { status: 500 }
        );
    }
}

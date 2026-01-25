import prisma from "@/lib/prisma"; // Wait, I need to check where prisma is
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Only delete if the user exists and is NOT verified
        const user = await prisma.user.findUnique({
            where: { email },
            select: { emailVerified: true },
        });

        if (user && !user.emailVerified) {
            await prisma.user.delete({
                where: { email },
            });
            return NextResponse.json({ success: true, message: "Unverified user deleted successfully" });
        }

        return NextResponse.json({ success: false, message: "User not found or already verified" }, { status: 404 });
    } catch (error) {
        console.error("Error deleting unverified user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

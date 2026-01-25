import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";

const secret = process.env.RESEND_WEBHOOK_SECRET;

export async function POST(request: Request) {
    if (!secret) {
        console.error("RESEND_WEBHOOK_SECRET is not defined");
        return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const payload = await request.text();
    const headerList = await headers();
    const svix_id = headerList.get("svix-id");
    const svix_timestamp = headerList.get("svix-timestamp");
    const svix_signature = headerList.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
    }

    const wh = new Webhook(secret);

    let evt: any;

    try {
        evt = wh.verify(payload, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch (err) {
        console.error("Webhook verification failed:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const { type, data } = evt;

    console.log(`--- VERIFIED RESEND WEBHOOK RECEIVED: ${type} ---`);

    // Only process if we have an email address
    const email = data?.to?.[0] || data?.email;
    if (!email) {
        return NextResponse.json({ received: true });
    }

    switch (type) {
        case "email.delivered":
            console.log(`Email successfully delivered to: ${email}`);
            break;

        case "email.bounced":
            console.log(`Email BOUNCED for: ${email}. The address might be invalid.`);
            break;

        case "email.complained":
            console.log(`Email SPAM COMPLAINT from: ${email}`);
            break;

        default:
            console.log(`Unhandled event type: ${type}`);
    }

    return NextResponse.json({ received: true });
}

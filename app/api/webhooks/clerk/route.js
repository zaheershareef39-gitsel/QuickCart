import { Webhook } from "svix";
import { inngest } from "@/config/inngest";

export async function POST(req) {
    if (!process.env.CLERK_WEBHOOK_SECRET) {
        console.error("[Webhook Error] CLERK_WEBHOOK_SECRET is not configured in .env");
        return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const payload = await req.json();
    const headers = {
        "svix-id": req.headers.get("svix-id"),
        "svix-timestamp": req.headers.get("svix-timestamp"),
        "svix-signature": req.headers.get("svix-signature"),
    };

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    try {
        const evt = wh.verify(payload, headers);
        console.log("[Clerk Webhook] Event received:", evt.type, "- User ID:", evt.data.id);

        // Send event to Inngest
        const result = await inngest.send({
            name: `clerk.${evt.type}`,
            data: evt.data,
        });
        console.log("[Inngest] Event sent successfully");

        return Response.json({ success: true });
    } catch (err) {
        console.error("[Webhook Error] Verification/Processing failed:", err.message);
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
}

import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature") as string;

    let event: Stripe.Event;

    try {
        if (!webhookSecret) {
            console.error("STRIPE_WEBHOOK_SECRET is not set");
            return new Response("Webhook configuration error", { status: 500 });
        }
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook Signature Error: ${err.message}`);
        return new Response("Invalid signature", { status: 400 });
    }

    // 1. Checkout Success
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata || {};
        const requestId = meta.request_id;

        if (!requestId) {
            console.error("? Missing request_id in metadata.");
            return new Response("Missing request_id", { status: 200 });
        }

        // IDEMPOTENCY CHECK
        const { data: existingRequest } = await supabase
            .from("requests")
            .select("is_paid, id")
            .eq("id", requestId)
            .single();

        if (existingRequest?.is_paid) {
            console.log(`[Webhook] Request ${requestId} already processed. Skipping.`);
            return new Response("Idempotent Success", { status: 200 });
        }

        console.log(`?? Processing Payment for Request ID: ${requestId}`);

        const { data: updatedReq, error: updateError } = await supabase
            .from("requests")
            .update({
                is_paid: true,
                status: "pending",
                stripe_payment_id: session.payment_intent as string,
                stripe_session_id: session.id
            })
            .eq("id", requestId)
            .select()
            .single();

        if (updateError) {
            console.error("? Failed to update request:", updateError);
            return new Response("Update Failed", { status: 200 });
        }

        // Scoped Lead Logic (Multi-Tenant)
        if (updatedReq && updatedReq.requester_phone) {
            const { data: eventData } = await supabase
                .from("events")
                .select("user_id")
                .eq("id", updatedReq.event_id)
                .single();

            const djId = eventData?.user_id;

            if (djId) {
                const amount = updatedReq.amount_paid;
                const email = updatedReq.requester_email || session.customer_details?.email;

                // Find Lead for THIS DJ
                const { data: existingLead } = await supabase
                    .from("leads")
                    .select("*")
                    .eq("user_id", djId)
                    .eq("phone", updatedReq.requester_phone)
                    .maybeSingle();

                if (existingLead) {
                    await supabase.from("leads").update({
                        total_spent: (Number(existingLead.total_spent) || 0) + amount,
                        request_count: (existingLead.request_count || 0) + 1,
                        last_seen_at: new Date().toISOString(),
                        email
                    }).eq("id", existingLead.id);
                } else {
                    await supabase.from("leads").insert({
                        user_id: djId,
                        name: updatedReq.requester_name,
                        phone: updatedReq.requester_phone,
                        email,
                        total_spent: amount,
                        request_count: 1,
                        first_seen_at: new Date().toISOString(),
                        last_seen_at: new Date().toISOString()
                    });
                }
            }
        }
    }

    // 2. Refund Handling
    else if (event.type === "charge.refunded") {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        const { error } = await supabase.from("requests")
            .update({ status: "refunded", is_paid: false })
            .eq("stripe_payment_id", paymentIntentId);

        if (error) console.error("Failed to process refund", error);
    }

    return new Response("Received", { status: 200 });
}

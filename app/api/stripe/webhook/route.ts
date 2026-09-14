import { adminData as supabase } from "@/lib/supabase-admin";
import { headers } from "next/headers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

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
            // 5xx, NOT 200. A 200 tells Stripe the event was handled and it
            // never retries — the fan's card was charged and the request stayed
            // unpaid in our database, invisible to the DJ. A 500 puts the event
            // back in Stripe's retry queue, and the idempotency check above
            // makes the replay safe.
            console.error("[Webhook] Failed to mark request paid:", updateError.message);
            return new Response("Update Failed", { status: 500 });
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

                // The lead row is a nice-to-have built on top of an already
                // successful payment, so its failure must not fail the webhook
                // and trigger a retry of the payment write. It IS logged —
                // a silently dropped lead looks identical to a DJ with no fans.
                if (existingLead) {
                    const { error: leadErr } = await supabase.from("leads").update({
                        total_spent: (Number(existingLead.total_spent) || 0) + amount,
                        request_count: (existingLead.request_count || 0) + 1,
                        last_seen_at: new Date().toISOString(),
                        email
                    }).eq("id", existingLead.id);
                    if (leadErr) console.error("[Webhook] Lead update failed:", leadErr.message);
                } else {
                    const { error: leadErr } = await supabase.from("leads").insert({
                        user_id: djId,
                        name: updatedReq.requester_name,
                        phone: updatedReq.requester_phone,
                        email,
                        total_spent: amount,
                        request_count: 1,
                        first_seen_at: new Date().toISOString(),
                        last_seen_at: new Date().toISOString()
                    });
                    if (leadErr) console.error("[Webhook] Lead insert failed:", leadErr.message);
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

        if (error) {
            console.error("[Webhook] Failed to process refund:", error.message);
            return new Response("Update Failed", { status: 500 });
        }
    }

    // 3. Connect onboarding state.
    //
    // Without this, the ONLY thing that ever set stripe_onboarding_complete was
    // the DJ physically landing back on the return URL. Close the tab at the end
    // of Stripe's flow — or finish verification hours later, which is the normal
    // case — and the flag stayed 0 forever, so checkout kept telling every fan
    // "This DJ hasn't set up payments yet" for a DJ who was fully set up.
    else if (event.type === "account.updated") {
        const account = event.data.object as Stripe.Account;
        const ready = Boolean(account.charges_enabled && account.payouts_enabled);

        // The live column is INTEGER — write 1/0, not a boolean.
        const { error } = await supabase.from("dj_profiles")
            .update({ stripe_onboarding_complete: ready ? 1 : 0 })
            .eq("stripe_account_id", account.id);

        if (error) {
            console.error("[Webhook] account.updated write failed:", error.message);
            return new Response("Update Failed", { status: 500 });
        }
    }

    return new Response("Received", { status: 200 });
}

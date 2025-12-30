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
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Signature Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};
    const requestId = meta.request_id; // Using request_id from Draft Flow

    if (!requestId) {
        console.error("? Missing request_id in metadata. Fallback needed?");
        return new Response("Missing request_id", { status: 200 }); 
    }

    console.log(`?? Payment Received for Request ID: ${requestId}`);

    // 1. UNLOCK the Request (is_paid = true)
    const { data: updatedReq, error: updateError } = await supabase
        .from("requests")
        .update({
            is_paid: true, 
             // We keep status as 'pending' so it appears in the "Incoming Queue" 
             // (Dashboard filters for status='pending')
            status: "pending", 
            stripe_payment_id: session.payment_intent as string,
            stripe_session_id: session.id
        })
        .eq("id", requestId)
        .select()
        .single();
    
    if (updateError) {
        console.error("? Failed to update request:", updateError);
         if (updateError.code === '42703') { 
            console.error("CRITICAL: Schema Mismatch - is_paid/status column missing.");
         }
        // Force successful response to Stripe so it doesn't retry indefinitely
        return new Response("Update Failed", { status: 200 }); 
    }

    console.log("? Request Unlocked (Paid)");

    // 2. Upsert Lead
    if (updatedReq && updatedReq.requester_phone) {
        const { data: existingLead } = await supabase
            .from("leads")
            .select("*")
            .eq("phone", updatedReq.requester_phone)
            .single();

        const amount = updatedReq.amount_paid;

        if (existingLead) {
            await supabase.from("leads").update({
                total_spent: (Number(existingLead.total_spent) || 0) + amount,
                request_count: (existingLead.request_count || 0) + 1,
                last_seen_at: new Date().toISOString(),
                email: existingLead.email || updatedReq.requester_email || session.customer_details?.email
            }).eq("id", existingLead.id);
        } else {
            await supabase.from("leads").insert({
                name: updatedReq.requester_name,
                phone: updatedReq.requester_phone,
                email: updatedReq.requester_email || session.customer_details?.email,
                total_spent: amount,
                request_count: 1,
                first_seen_at: new Date().toISOString(),
                last_seen_at: new Date().toISOString()
            });
        }
    }
  }

  return new Response("Received", { status: 200 });
}

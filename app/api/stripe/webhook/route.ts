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

  // 1. Checkout Success
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};
    const requestId = meta.request_id;

    if (!requestId) {
        console.error("? Missing request_id in metadata.");
        return new Response("Missing request_id", { status: 200 }); 
    }

    console.log(`?? Payment Received for Request ID: ${requestId}`);

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

    // Upsert Lead logic (omitted for brevity in this critical fix, but functionality remains if needed - actually I should keep it for full integrity)
    // Re-adding Lead Upsert for completeness
    if (updatedReq && updatedReq.requester_phone) {
        const { data: existingLead } = await supabase.from("leads").select("*").eq("phone", updatedReq.requester_phone).single();
         const amount = updatedReq.amount_paid;
         const email = updatedReq.requester_email || session.customer_details?.email;
         if(existingLead) {
             await supabase.from("leads").update({ 
                 total_spent: (Number(existingLead.total_spent) || 0) + amount, 
                 request_count: (existingLead.request_count || 0) + 1,
                 last_seen_at: new Date().toISOString(),
                 email
             }).eq("id", existingLead.id);
         } else {
             await supabase.from("leads").insert({
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
  
  // 2. Refund Handling (Revenue Assurance)
  else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;
      
      console.log(`Refund detected for PI: ${paymentIntentId}`);

      const { error } = await supabase.from("requests")
        .update({ status: "refunded", is_paid: false })
        .eq("stripe_payment_id", paymentIntentId);
      
      if(error) console.error("Failed to process refund", error);
  }

  return new Response("Received", { status: 200 });
}

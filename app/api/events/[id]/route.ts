import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "API Deprecated. Use Supabase Client SDK for RLS compliance." }, 
    { status: 410 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: "API Deprecated. Use Supabase Client SDK for RLS compliance." }, 
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "API Deprecated. Use Supabase Client SDK for RLS compliance." }, 
    { status: 410 }
  );
}

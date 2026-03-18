import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyAdmin(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(auth.replace("Bearer ", ""));
  if (error || !user) return null;
  const { data: prof } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single();
  if (!prof || prof.role !== "super_admin") return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [ordersRes, servicesRes, villasRes] = await Promise.all([
    supabaseAdmin
      .from("service_orders")
      .select("*, services(name,price,price_type), villas(name)")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("services")
      .select("*, villas(name)")
      .order("name"),
    supabaseAdmin.from("villas").select("id,name").order("name"),
  ]);

  if (ordersRes.error) return NextResponse.json({ error: ordersRes.error.message }, { status: 500 });
  if (servicesRes.error) return NextResponse.json({ error: servicesRes.error.message }, { status: 500 });

  return NextResponse.json({
    orders:   ordersRes.data   ?? [],
    services: servicesRes.data ?? [],
    villas:   villasRes.data   ?? [],
  });
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { villa_id, name, description, price, price_type, currency, min_persons, max_persons, advance_notice_hours } = body;
  if (!villa_id || !name || price == null) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const { data, error } = await supabaseAdmin.from("services").insert({
    villa_id, name, description: description ?? null, price: Number(price),
    price_type: price_type ?? "per_person", currency: currency ?? "USD",
    min_persons: min_persons ?? 1, max_persons: max_persons ?? null,
    advance_notice_hours: advance_notice_hours ?? 24,
    is_active: true, category: null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, order_status, is_active } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (order_status !== undefined) {
    const updateData: Record<string, unknown> = { order_status };
    if (order_status === "confirmed") {
      updateData.confirmed_by = user.id;
      updateData.confirmed_at = new Date().toISOString();
    }
    const { error } = await supabaseAdmin.from("service_orders").update(updateData).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (is_active !== undefined) {
    const { error } = await supabaseAdmin.from("services").update({ is_active }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

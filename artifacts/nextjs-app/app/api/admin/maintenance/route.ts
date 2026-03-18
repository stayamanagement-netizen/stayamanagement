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

  const { data, error } = await supabaseAdmin
    .from("maintenance")
    .select("*, villas(name), profiles!maintenance_reported_by_fkey(full_name)")
    .order("created_at", { ascending: false });

  if (error) {
    const { data: data2, error: err2 } = await supabaseAdmin
      .from("maintenance")
      .select("*, villas(name), profiles!reported_by(full_name)")
      .order("created_at", { ascending: false });
    if (err2) return NextResponse.json({ error: err2.message }, { status: 500 });
    return NextResponse.json(data2 ?? []);
  }
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status } = body;
  if (!id || !status) return NextResponse.json({ error: "Missing id or status" }, { status: 400 });

  const updateData: Record<string, unknown> = { status };
  if (status === "resolved") {
    updateData.resolved_at  = new Date().toISOString();
    updateData.resolved_by  = user.id;
  }

  const { error } = await supabaseAdmin.from("maintenance").update(updateData).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

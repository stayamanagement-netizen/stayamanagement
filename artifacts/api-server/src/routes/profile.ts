import { Router, type IRouter } from "express";
import { createClient } from "@supabase/supabase-js";

const router: IRouter = Router();

router.post("/auth/profile", async (req, res) => {
  try {
    const { userId } = req.body as { userId?: string };

    if (!userId || typeof userId !== "string") {
      res.status(400).json({ error: "Missing userId" });
      return;
    }

    const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
    const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

    if (!supabaseUrl || !serviceRoleKey) {
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: profile, error } = await adminClient
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      res.status(404).json({ error: "Profile not found", detail: error?.message });
      return;
    }

    res.json({ profile });
  } catch (err) {
    console.error("[api/auth/profile] exception:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

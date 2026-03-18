"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Profile { id: string; full_name: string | null; role: string; }
interface Booking {
  id: string; villa_id: string | null; villa_name: string | null; guest_name: string | null;
  check_in: string | null; check_out: string | null; status: string | null;
  num_guests: number | null; booking_reference: string | null; ota_channel: string | null;
  total_amount: number | null;
}
interface Villa {
  id: string; name: string | null; location: string | null; country: string | null;
  address: string | null; google_maps_url: string | null; wifi_name: string | null;
  wifi_password: string | null; check_in_instructions: string | null; house_rules: string | null;
  parking_instructions: string | null; manager_name: string | null; manager_phone: string | null;
}

/* ── helpers ──────────────────────────────────────────── */
function fmtDateLong(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
}
function nights(a: string | null, b: string | null) {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

const NAV = [
  { icon: "🏠", label: "Home",      href: "/dashboard/guest" },
  { icon: "🛎️", label: "Services",  href: "/dashboard/guest/services" },
  { icon: "💬", label: "Messages",  href: "/dashboard/guest/messages" },
  { icon: "📋", label: "My Booking",href: "/dashboard/guest/booking" },
  { icon: "🚨", label: "Emergency", href: "/dashboard/guest/emergency", red: true },
];

function BottomNav() {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #EDE6D6", display: "flex", zIndex: 100, boxShadow: "0 -2px 16px rgba(44,44,44,.08)" }}>
      {NAV.map(n => {
        const active = n.href === "/dashboard/guest" ? path === n.href : path.startsWith(n.href);
        return (
          <button key={n.label} onClick={() => window.location.href = n.href}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 4px 10px", gap: 3, border: "none", background: "transparent", cursor: "pointer", minHeight: 62 }}>
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 500, color: n.red ? "#C62828" : active ? "#C9A84C" : "#9E8E6A", letterSpacing: ".02em", fontFamily: "Inter,sans-serif" }}>{n.label}</span>
            {active && <div style={{ width: 20, height: 2.5, borderRadius: 2, background: n.red ? "#C62828" : "#C9A84C", marginTop: 1 }} />}
          </button>
        );
      })}
    </nav>
  );
}

const INFO_ITEMS = [
  { icon: "📍", key: "address",               label: "Villa Address" },
  { icon: "🔑", key: "check_in_instructions", label: "Check-in Instructions" },
  { icon: "📶", key: "wifi",                  label: "WiFi Details" },
  { icon: "🏠", key: "house_rules",           label: "House Rules" },
  { icon: "🚗", key: "parking_instructions",  label: "Parking" },
  { icon: "📞", key: "emergency_contact",     label: "Emergency Contact" },
];

export default function GuestDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [villa, setVilla]     = useState<Villa | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // ── Auth + magic link (single sequential effect — no race condition) ─────────
  // We handle the hash token first (await setSession), THEN check for a user,
  // THEN fetch the profile with a 3-second timeout so the dashboard always shows.
  useEffect(() => {
    (async () => {
      // Step 1: exchange hash token if this is a magic-link landing
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });
        window.history.replaceState({}, "", "/dashboard/guest");
      }

      // Step 2: confirm we have a user (session should be set by now)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/"; return; }

      // Step 3: fetch profile with 3-second timeout — show dashboard regardless
      const fetchProfile = () =>
        supabase.from("profiles").select("id,full_name,role").eq("id", user.id).single()
          .then(r => r.data);
      const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 3000));
      const profData = await Promise.race([fetchProfile(), timeoutPromise]);
      const prof: Profile = profData ?? { id: user.id, full_name: null, role: "guest" };

      // Step 4: redirect non-guests to their own dashboard
      if (prof.role === "super_admin")   { window.location.href = "/dashboard/admin/";   return; }
      if (prof.role === "villa_owner")   { window.location.href = "/dashboard/owner/";   return; }
      if (prof.role === "villa_manager") { window.location.href = "/dashboard/manager/"; return; }

      setProfile(prof);
      setAuthReady(true); // show dashboard immediately — don't wait for booking data

      // Step 5: fetch booking + villa in the background (non-blocking)
      void (async () => {
        try {
          const { data: bk } = await supabase.from("bookings")
            .select("id,villa_id,villa_name,guest_name,check_in,check_out,status,num_guests,booking_reference,ota_channel,total_amount")
            .eq("guest_user_id", user.id)
            .in("status", ["confirmed","checked_in","pending"])
            .order("check_in", { ascending: false }).limit(1).maybeSingle();
          if (bk) {
            setBooking(bk as Booking);
            if (bk.villa_id) {
              const { data: v } = await supabase.from("villas").select("*").eq("id", bk.villa_id).single();
              if (v) setVilla(v as Villa);
            }
          }
        } catch { /* best-effort — dashboard already visible */ }
      })();
    })();
  }, []);

  const guestFirst = profile?.full_name?.split(" ")[0] ?? "Guest";
  const villaName  = villa?.name ?? booking?.villa_name ?? "Your Villa";
  const nightCount = nights(booking?.check_in ?? null, booking?.check_out ?? null);

  function getInfoContent(key: string): React.ReactNode {
    if (!villa) return <span style={{ color: "#C4B89A" }}>Contact your manager for details.</span>;
    switch (key) {
      case "address": return villa.address
        ? <div>
            <p style={{ fontSize: 14, color: "#2C2C2C", lineHeight: 1.6, marginBottom: 10 }}>{villa.address}</p>
            {villa.google_maps_url && <a href={villa.google_maps_url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#4285F4", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>🗺️ Open in Google Maps</a>}
          </div>
        : <span style={{ color: "#C4B89A" }}>Address not set — ask your manager.</span>;
      case "check_in_instructions": return villa.check_in_instructions
        ? <p style={{ fontSize: 14, color: "#2C2C2C", lineHeight: 1.7, whiteSpace: "pre-line" }}>{villa.check_in_instructions}</p>
        : <span style={{ color: "#C4B89A" }}>Contact your manager for check-in instructions.</span>;
      case "wifi": return (villa.wifi_name || villa.wifi_password)
        ? <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {villa.wifi_name && <div style={{ background: "#F5F0E8", borderRadius: 10, padding: "12px 16px" }}><div style={{ fontSize: 10.5, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 4 }}>Network Name</div><div style={{ fontSize: 15, fontWeight: 700, color: "#2C2C2C" }}>{villa.wifi_name}</div></div>}
            {villa.wifi_password && <div style={{ background: "#F5F0E8", borderRadius: 10, padding: "12px 16px" }}><div style={{ fontSize: 10.5, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 4 }}>Password</div><div style={{ fontSize: 15, fontWeight: 700, color: "#C9A84C", fontFamily: "monospace" }}>{villa.wifi_password}</div></div>}
          </div>
        : <span style={{ color: "#C4B89A" }}>WiFi details not available — ask your manager.</span>;
      case "house_rules": return villa.house_rules
        ? <p style={{ fontSize: 14, color: "#2C2C2C", lineHeight: 1.7, whiteSpace: "pre-line" }}>{villa.house_rules}</p>
        : <span style={{ color: "#C4B89A" }}>House rules not set — ask your manager.</span>;
      case "parking_instructions": return villa.parking_instructions
        ? <p style={{ fontSize: 14, color: "#2C2C2C", lineHeight: 1.7, whiteSpace: "pre-line" }}>{villa.parking_instructions}</p>
        : <span style={{ color: "#C4B89A" }}>Parking info not available — ask your manager.</span>;
      case "emergency_contact": return (villa.manager_name || villa.manager_phone)
        ? <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {villa.manager_name && <div style={{ fontSize: 14, color: "#2C2C2C" }}><strong>Manager:</strong> {villa.manager_name}</div>}
            {villa.manager_phone && <a href={`tel:${villa.manager_phone}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, background: "linear-gradient(135deg,#1E7A48,#2D8A57)", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>📞 Call {villa.manager_phone}</a>}
          </div>
        : <span style={{ color: "#C4B89A" }}>Emergency contact not set.</span>;
      default: return null;
    }
  }

  if (!authReady) return (
    <>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#F5F0E8}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #EDE6D6", borderTop: "3px solid #C9A84C", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Inter,sans-serif;background:#F5F0E8;color:#2C2C2C}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#DDD5C0;border-radius:10px}
        .info-card{cursor:pointer;transition:box-shadow .2s,transform .15s}
        .info-card:hover{box-shadow:0 4px 16px rgba(44,44,44,.1)!important;transform:translateY(-1px)}
      `}</style>
      <div style={{ minHeight: "100vh", background: "#F5F0E8", paddingBottom: 80 }}>

        {/* Top bar */}
        <header style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 20px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(44,44,44,.05)", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#C9A84C,#B8913A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏡</div>
            <div>
              <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 14, fontWeight: 700, color: "#2C2C2C" }}>Staya <span style={{ color: "#C9A84C" }}>Guest Portal</span></div>
              {villa && <div style={{ fontSize: 10.5, color: "#9E8E6A", letterSpacing: ".06em" }}>{villa.location ?? ""}</div>}
            </div>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "transparent", color: "#7A6A50", fontSize: 12, cursor: "pointer" }}>
            Sign Out
          </button>
        </header>

        <main style={{ maxWidth: 540, margin: "0 auto", padding: "28px 16px 24px", animation: "fadeUp .35s ease both" }}>

          {/* Hero welcome */}
          <div style={{ background: "linear-gradient(135deg,#2C1E0F,#3D2B17)", borderRadius: 20, padding: "28px 24px", marginBottom: 20, boxShadow: "0 8px 32px rgba(44,28,10,.25)" }}>
            <div style={{ fontSize: 13, color: "rgba(201,168,76,.75)", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Welcome to</div>
            <h1 style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{villaName} 🌴</h1>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.65)", lineHeight: 1.5 }}>We&apos;re delighted to have you, <strong style={{ color: "#C9A84C" }}>{guestFirst}</strong></p>
          </div>

          {/* Booking summary card */}
          {booking ? (
            <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #EDE6D6", padding: "20px 22px", marginBottom: 20, boxShadow: "0 4px 16px rgba(44,44,44,.07)" }}>
              <div style={{ fontSize: 10.5, color: "#C9A84C", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 14 }}>Your Reservation</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div style={{ background: "#F5F0E8", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4 }}>Check-In</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#2C2C2C", lineHeight: 1.4 }}>{fmtDateLong(booking.check_in)}</div>
                </div>
                <div style={{ background: "#F5F0E8", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4 }}>Check-Out</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#2C2C2C", lineHeight: 1.4 }}>{fmtDateLong(booking.check_out)}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 80, background: "#FDFAF5", borderRadius: 10, padding: "10px 14px", border: "1px solid #EDE6D6" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#9E8E6A", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>Nights</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#2C2C2C", fontFamily: "Playfair Display,Georgia,serif" }}>{nightCount}</div>
                </div>
                {booking.num_guests && (
                  <div style={{ flex: 1, minWidth: 80, background: "#FDFAF5", borderRadius: 10, padding: "10px 14px", border: "1px solid #EDE6D6" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9E8E6A", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>Guests</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#2C2C2C", fontFamily: "Playfair Display,Georgia,serif" }}>{booking.num_guests}</div>
                  </div>
                )}
                {booking.booking_reference && (
                  <div style={{ flex: 2, minWidth: 140, background: "#FDFAF5", borderRadius: 10, padding: "10px 14px", border: "1px solid #EDE6D6" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9E8E6A", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>Reference</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#C9A84C", fontFamily: "monospace" }}>{booking.booking_reference}</div>
                  </div>
                )}
              </div>
              {booking.ota_channel && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "#9E8E6A" }}>Booked via</span>
                  <span style={{ padding: "3px 10px", borderRadius: 20, background: "#F5F0E8", border: "1px solid #EDE6D6", fontSize: 11.5, fontWeight: 700, color: "#4A3B27" }}>{booking.ota_channel}</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #EDE6D6", padding: 32, textAlign: "center", marginBottom: 20, color: "#C4B89A" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏡</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No active booking found</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>Contact your host if this is unexpected.</div>
            </div>
          )}

          {/* Quick info cards */}
          <h2 style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 18, fontWeight: 700, color: "#2C2C2C", marginBottom: 12 }}>Villa Information</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {INFO_ITEMS.map(item => {
              const isOpen = expanded === item.key;
              return (
                <div key={item.key} className="info-card" onClick={() => setExpanded(isOpen ? null : item.key)}
                  style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${isOpen ? "#C9A84C" : "#EDE6D6"}`, overflow: "hidden", boxShadow: isOpen ? "0 4px 16px rgba(201,168,76,.12)" : "0 2px 6px rgba(44,44,44,.04)" }}>
                  <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: isOpen ? "#FFF8E6" : "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#2C2C2C" }}>{item.label}</span>
                    </div>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#C4B89A" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                  {isOpen && (
                    <div style={{ padding: "0 18px 18px", borderTop: "1px solid #F0EBE0" }}>
                      <div style={{ paddingTop: 14 }}>{getInfoContent(item.key)}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Emergency quick-access */}
          <button onClick={() => window.location.href = "/dashboard/guest/emergency/"}
            style={{ width: "100%", padding: "18px 24px", borderRadius: 16, border: "none", background: "linear-gradient(135deg,#C62828,#B71C1C)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, boxShadow: "0 6px 24px rgba(198,40,40,.3)", fontFamily: "Inter,sans-serif" }}>
            <span style={{ fontSize: 22 }}>🚨</span> Emergency Assistance
          </button>
          <p style={{ textAlign: "center", fontSize: 12, color: "#9E8E6A", marginTop: 10 }}>For urgent assistance only — response within 5–10 minutes</p>
        </main>

        <BottomNav />
      </div>
    </>
  );
}

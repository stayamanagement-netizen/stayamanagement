"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Booking { id: string; villa_id: string | null; villa_name: string | null; }
interface Villa { manager_name: string | null; manager_phone: string | null; }

const ALERT_TYPES = [
  { key: "medical",  icon: "🏥", label: "Medical Emergency" },
  { key: "security", icon: "🔒", label: "Security Issue" },
  { key: "fire",     icon: "🔥", label: "Fire" },
  { key: "flood",    icon: "💧", label: "Flood / Water Damage" },
  { key: "accident", icon: "⚠️", label: "Accident" },
  { key: "other",    icon: "📋", label: "Other Urgent Issue" },
];

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
            <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 500, color: n.red ? "#C62828" : active ? "#C9A84C" : "#9E8E6A", fontFamily: "Inter,sans-serif" }}>{n.label}</span>
            {active && <div style={{ width: 20, height: 2.5, borderRadius: 2, background: n.red ? "#C62828" : "#C9A84C", marginTop: 1 }} />}
          </button>
        );
      })}
    </nav>
  );
}

export default function GuestEmergencyPage() {
  const [booking, setBooking]   = useState<Booking | null>(null);
  const [villa, setVilla]       = useState<Villa | null>(null);
  const [profile, setProfile]   = useState<{ full_name: string | null } | null>(null);
  const [userId, setUserId]     = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [alertType, setAlertType]   = useState("");
  const [description, setDesc]      = useState("");
  const [location, setLocation]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      try {
        const { data: profData } = await supabase.from("profiles").select("id,full_name,role").eq("id", user.id).single();
        const prof = profData ?? null;
        if (!prof) { window.location.href = "/"; return; }
        if (prof.role === "super_admin")   { window.location.href = "/dashboard/admin/";   return; }
        if (prof.role === "villa_owner")   { window.location.href = "/dashboard/owner/";   return; }
        if (prof.role === "villa_manager") { window.location.href = "/dashboard/manager/"; return; }
        setProfile(prof); setUserId(user.id);
        const { data: bk } = await supabase.from("bookings")
          .select("id,villa_id,villa_name").eq("guest_user_id", user.id)
          .in("status", ["confirmed","checked_in","pending"])
          .order("check_in", { ascending: false }).limit(1).maybeSingle();
        if (bk) {
          setBooking(bk as Booking);
          setLocation(bk.villa_name ?? "Villa");
          if (bk.villa_id) {
            const { data: v } = await supabase.from("villas").select("manager_name,manager_phone").eq("id", bk.villa_id).single();
            if (v) setVilla(v as Villa);
          }
        }
        setAuthReady(true);
      } catch { window.location.href = "/"; }
    });
  }, []);

  async function sendAlert() {
    if (!alertType) { setError("Please select an emergency type."); return; }
    if (!description.trim()) { setError("Please describe the situation."); return; }
    setError(null);
    setSubmitting(true);
    try {
      const { error: dbErr } = await supabase.from("emergency_alerts").insert([{
        villa_id:    booking?.villa_id ?? null,
        villa_name:  booking?.villa_name ?? location,
        booking_id:  booking?.id ?? null,
        guest_name:  profile?.full_name ?? "Guest",
        alert_type:  alertType,
        description: description.trim(),
        location:    location.trim(),
        status:      "active",
        reported_by: userId ?? null,
      }]);
      if (dbErr) throw dbErr;
      setSubmitted(true);
    } catch { setError("Failed to send alert. Please try again or call your manager directly."); }
    finally { setSubmitting(false); }
  }

  if (!authReady) return (
    <>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#FFF0F0}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #FFCDD2", borderTop: "3px solid #C62828", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Inter,sans-serif;background:#FFF5F5;color:#2C2C2C}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#FFCDD2;border-radius:10px}
        textarea,input{font-family:Inter,sans-serif}
        .type-btn{
          display:flex;align-items:center;gap:10px;padding:14px 16px;
          border-radius:14px;border:2px solid #FFE0E0;background:#fff;
          cursor:pointer;transition:all .15s;text-align:left;width:100%;
          font-family:Inter,sans-serif;font-size:14px;color:#4A3B27;font-weight:500;
        }
        .type-btn:hover{border-color:#F48A8A;background:#FFF5F5}
        .type-btn.sel{border-color:#C62828;background:#FFF0F0;color:#C62828;font-weight:700}
      `}</style>
      <div style={{ minHeight: "100vh", background: "#FFF5F5", paddingBottom: 90 }}>

        {/* Red header */}
        <header style={{ background: "linear-gradient(135deg,#C62828,#B71C1C)", padding: "0 20px", height: 64, display: "flex", alignItems: "center", gap: 14, boxShadow: "0 4px 16px rgba(198,40,40,.3)", position: "sticky", top: 0, zIndex: 50 }}>
          <button onClick={() => window.location.href = "/dashboard/guest/"} style={{ border: "none", background: "rgba(255,255,255,.2)", cursor: "pointer", fontSize: 16, width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>←</button>
          <div>
            <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 17, fontWeight: 700, color: "#fff" }}>Emergency Assistance</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.75)" }}>Our team responds within 5–10 minutes</div>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 28, animation: "pulse 2s ease-in-out infinite" }}>🚨</span>
        </header>

        <main style={{ maxWidth: 540, margin: "0 auto", padding: "24px 16px", animation: "fadeUp .35s ease both" }}>

          {submitted ? (
            /* ── SUCCESS ── */
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#EDFAF3", border: "3px solid #2D8A57", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 48 }}>✅</div>
              <h2 style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 26, fontWeight: 700, color: "#1E7A48", marginBottom: 12 }}>Alert Sent!</h2>
              <p style={{ fontSize: 15, color: "#2C2C2C", lineHeight: 1.7, marginBottom: 6, fontWeight: 500 }}>Your villa manager and our team have been notified immediately.</p>
              <p style={{ fontSize: 13.5, color: "#4A3B27", lineHeight: 1.7, marginBottom: 28 }}>Please stay calm and remain in a safe location.</p>

              <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #EDE6D6", padding: "20px 22px", marginBottom: 20, boxShadow: "0 4px 16px rgba(44,44,44,.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Expected Response Time</div>
                <div style={{ fontSize: 30, fontWeight: 700, color: "#C9A84C", fontFamily: "Playfair Display,Georgia,serif" }}>5 – 10 minutes</div>
              </div>

              {villa?.manager_phone && (
                <div style={{ marginBottom: 20 }}>
                  {villa.manager_name && <p style={{ fontSize: 13.5, color: "#4A3B27", marginBottom: 12, fontWeight: 500 }}>Manager: <strong>{villa.manager_name}</strong></p>}
                  <a href={`tel:${villa.manager_phone}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "16px 24px", borderRadius: 14, background: "linear-gradient(135deg,#1E7A48,#2D8A57)", color: "#fff", fontSize: 16, fontWeight: 700, textDecoration: "none", boxShadow: "0 6px 20px rgba(30,122,72,.3)" }}>
                    📞 Call Villa Manager Now · {villa.manager_phone}
                  </a>
                </div>
              )}

              <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 14, padding: "14px 18px", marginBottom: 20 }}>
                <div style={{ fontSize: 13.5, color: "#C62828", fontWeight: 700, marginBottom: 4 }}>Life-threatening emergency?</div>
                <div style={{ fontSize: 13, color: "#4A3B27", marginBottom: 10 }}>Also call local emergency services immediately.</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <a href="tel:112" style={{ flex: 1, textAlign: "center", padding: "10px", borderRadius: 10, background: "#C62828", color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>📞 112</a>
                  <a href="tel:911" style={{ flex: 1, textAlign: "center", padding: "10px", borderRadius: 10, background: "#C62828", color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>📞 911</a>
                </div>
              </div>

              <button onClick={() => window.location.href = "/dashboard/guest/"}
                style={{ padding: "13px 28px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#C62828,#B71C1C)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>
                Return to Home
              </button>
            </div>

          ) : (
            /* ── FORM ── */
            <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 60, marginBottom: 10, animation: "pulse 2s ease-in-out infinite" }}>🚨</div>
                <h1 style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 24, fontWeight: 700, color: "#C62828", marginBottom: 6 }}>Emergency Assistance</h1>
                <p style={{ fontSize: 14, color: "#4A3B27", lineHeight: 1.6 }}>Our team will respond within <strong>5–10 minutes</strong>.<br/>For life-threatening emergencies, call <strong>112</strong> or <strong>911</strong> immediately.</p>
              </div>

              {/* Alert type */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#C62828", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>Select Emergency Type <span style={{ color: "#C62828" }}>*</span></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {ALERT_TYPES.map(t => (
                    <button key={t.key} className={`type-btn${alertType === t.key ? " sel" : ""}`} onClick={() => setAlertType(t.key)}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{t.icon}</span>
                      <span style={{ fontSize: 13.5 }}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#C62828", letterSpacing: ".08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Describe the Situation <span>*</span></label>
                <textarea value={description} onChange={e => setDesc(e.target.value)}
                  placeholder="Describe your situation clearly — what happened, who is affected, any injuries…"
                  rows={5}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: "2px solid #FFCDD2", fontSize: 14, color: "#2C2C2C", background: "#fff", resize: "vertical", outline: "none", lineHeight: 1.6 }}
                  onFocus={e => e.currentTarget.style.borderColor = "#C62828"}
                  onBlur={e => e.currentTarget.style.borderColor = "#FFCDD2"} />
              </div>

              {/* Location */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#C62828", letterSpacing: ".08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Your Location</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="Villa name, room, or area…"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: "2px solid #FFCDD2", fontSize: 14, color: "#2C2C2C", background: "#fff", outline: "none" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#C62828"}
                  onBlur={e => e.currentTarget.style.borderColor = "#FFCDD2"} />
              </div>

              {error && (
                <div style={{ marginBottom: 16, padding: "11px 16px", background: "#FFF0F0", border: "1.5px solid #FFCDD2", borderRadius: 12, fontSize: 13.5, color: "#C62828", fontWeight: 500 }}>{error}</div>
              )}

              {/* Submit */}
              <button onClick={sendAlert} disabled={submitting}
                style={{ width: "100%", padding: "18px 24px", borderRadius: 16, border: "none", background: submitting ? "#E88" : "linear-gradient(135deg,#C62828,#B71C1C)", color: "#fff", fontSize: 18, fontWeight: 700, cursor: submitting ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, boxShadow: "0 8px 28px rgba(198,40,40,.35)", marginBottom: 16, fontFamily: "Inter,sans-serif" }}>
                {submitting
                  ? <><div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin .6s linear infinite" }} /> Sending Alert…</>
                  : <><span style={{ fontSize: 22 }}>🚨</span> Send Emergency Alert</>
                }
              </button>

              {villa?.manager_phone && (
                <a href={`tel:${villa.manager_phone}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px 24px", borderRadius: 14, border: "2px solid #C62828", background: "#fff", color: "#C62828", fontSize: 15, fontWeight: 700, textDecoration: "none", marginBottom: 16 }}>
                  📞 Call Manager Now · {villa.manager_phone}
                </a>
              )}

              <p style={{ textAlign: "center", fontSize: 12, color: "#9E8E6A", lineHeight: 1.6 }}>
                This will immediately notify your villa manager and the Staya team.<br/>
                For life-threatening emergencies, also call <strong>112</strong> or <strong>911</strong>.
              </p>
            </>
          )}
        </main>

        <BottomNav />
      </div>
    </>
  );
}

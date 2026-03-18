"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}

const P = {
  home:    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  cal:     "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  msg:     "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  doc:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  chart:   "M18 20V10 M12 20V4 M6 20v-6",
  gear:    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  logout:  "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  lock:    "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0-2-2z M17 11V7a5 5 0 0 0-10 0v4",
  check:   "M5 13l4 4L19 7",
  eye:     "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  eyeOff:  "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24 M1 1l22 22",
  villa:   "M3 22h18 M4 22V9l8-7 8 7v13 M9 22V16h6v6 M9 10h.01 M15 10h.01",
};

const NAV = [
  { label: "Dashboard",         icon: P.home,  href: "/dashboard/owner" },
  { label: "My Villas",         icon: P.villa, href: "/dashboard/owner/villa" },
  { label: "Bookings",          icon: P.cal,   href: "/dashboard/owner/bookings" },
  { label: "Messages",          icon: P.msg,   href: "/dashboard/owner/messages" },
  { label: "Owner Statements",  icon: P.doc,   href: "/dashboard/owner/statements" },
  { label: "Performance",       icon: P.chart, href: "/dashboard/owner/performance" },
  { label: "Settings",          icon: P.gear,  href: "/dashboard/owner/settings" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#7A6A55", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 7 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", border: "1.5px solid #E0D5C5", borderRadius: 9,
  fontSize: 14, fontFamily: "Inter,sans-serif", color: "#2C1E0F", background: "#FAF7F2",
  outline: "none", transition: "border-color .15s",
};

function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid #F5F0E8" }}>
      <div>
        <div style={{ fontSize: 13.5, color: "#3D2E1A", fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: "#9E8E6A", marginTop: 2 }}>{sub}</div>}
      </div>
      <button onClick={() => onChange(!checked)}
        style={{ width: 42, height: 24, borderRadius: 12, border: "none", background: checked ? "#C9A84C" : "#DDD5C0", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0, marginLeft: 16 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: checked ? 21 : 3, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.15)" }} />
      </button>
    </div>
  );
}

export default function OwnerSettingsPage() {
  const [userId,    setUserId]    = useState<string | null>(null);
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [villas,    setVillas]    = useState<{ name: string }[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [pwNew,     setPwNew]     = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving,  setPwSaving]  = useState(false);
  const [showPw,    setShowPw]    = useState(false);
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  const [notifs, setNotifs] = useState({
    newBooking:      true,
    guestCheckIn:    true,
    revenueReport:   true,
    maintenanceCost: false,
    ownerStatement:  true,
    monthlyReport:   true,
  });

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      const { data: prof } = await supabase.from("profiles").select("full_name,email,phone,role").eq("id", user.id).single();
      if (!prof || prof.role !== "villa_owner") { window.location.href = "/"; return; }
      setUserId(user.id);
      setName(prof.full_name ?? "");
      setEmail(prof.email ?? user.email ?? "");
      setPhone(prof.phone ?? "");
      const { data: ownedVillas } = await supabase.from("villas").select("name").eq("owner_id", user.id);
      setVillas(ownedVillas ?? []);
      setLoading(false);
    });
  }, []);

  async function saveProfile() {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: name.trim(), phone: phone.trim() }).eq("id", userId);
    if (error) showToast("Failed to save profile", false);
    else showToast("Profile saved ✓");
    setSaving(false);
  }

  async function changePassword() {
    if (!pwNew || !pwConfirm) return;
    if (pwNew !== pwConfirm) { showToast("Passwords do not match", false); return; }
    if (pwNew.length < 8)    { showToast("Password must be at least 8 characters", false); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwNew });
    if (error) showToast(error.message, false);
    else { showToast("Password changed ✓"); setPwNew(""); setPwConfirm(""); }
    setPwSaving(false);
  }

  const path = typeof window !== "undefined" ? window.location.pathname : "";

  if (loading) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#F5F0E8", fontFamily: "Inter,sans-serif", color: "#9E8E6A" }}>Loading…</div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F5F0E8", fontFamily: "Inter,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .nav-item{display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:10px;border:none;background:none;color:#A0906E;cursor:pointer;width:100%;text-align:left;font-size:13px;font-weight:500;transition:all .15s}
        .nav-item:hover{background:#F5F0E8;color:#4A3B27}
        .nav-item.active{background:linear-gradient(135deg,#C9A84C20,#C9A84C10);color:#4A3B27;font-weight:600;border-left:3px solid #C9A84C;padding-left:13px}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#DDD5C0;border-radius:10px}
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .toast{position:fixed;bottom:28px;right:28px;padding:12px 20px;border-radius:10px;font-size:13.5px;font-weight:600;z-index:9999;animation:fadein .25s ease;box-shadow:0 4px 20px rgba(0,0,0,.14)}
        input:focus{border-color:#C9A84C!important}
      `}</style>

      {toast && <div className="toast" style={{ background: toast.ok ? "#2D8A57" : "#C62828", color: "#fff" }}>{toast.msg}</div>}

      {/* Sidebar */}
      <aside style={{ width: 220, background: "#2C1E0F", display: "flex", flexDirection: "column", padding: "20px 12px", gap: 2, flexShrink: 0 }}>
        <div style={{ padding: "4px 12px 20px", borderBottom: "1px solid #3D2E1A", marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#C9A84C", fontFamily: "'Playfair Display',serif" }}>Staya</div>
          <div style={{ fontSize: 10, color: "#7A6A55", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }}>Management</div>
        </div>
        {NAV.map(item => {
          const isActive = item.href !== null && (item.href === "/dashboard/owner" ? path === item.href : path.startsWith(item.href));
          return (
            <button key={item.label} className={`nav-item${isActive ? " active" : ""}`}
              onClick={() => { if (item.href) window.location.href = item.href; }}>
              <span style={{ color: isActive ? "#C9A84C" : "#A0906E" }}><Ic d={item.icon} size={15} /></span>
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <button className="nav-item" onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}>
          <Ic d={P.logout} size={15} /><span>Sign Out</span>
        </button>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 28px", height: 58, display: "flex", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "Playfair Display,serif", fontSize: 18, fontWeight: 700, color: "#2C1E0F" }}>Settings</div>
            <div style={{ fontSize: 12, color: "#9E8E6A" }}>Manage your account and notification preferences</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
          <div style={{ maxWidth: 640 }}>

            {/* Profile header */}
            <div style={{ background: "linear-gradient(135deg,#2C1E0F,#4A3B27)", borderRadius: 16, padding: "24px 28px", marginBottom: 20, display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#2C1E0F", flexShrink: 0, fontFamily: "Playfair Display,serif" }}>
                {name.charAt(0).toUpperCase() || "O"}
              </div>
              <div>
                <div style={{ fontFamily: "Playfair Display,serif", fontSize: 18, fontWeight: 700, color: "#fff" }}>{name || "Owner"}</div>
                <div style={{ fontSize: 12, color: "#C9A84C", marginTop: 2 }}>Villa Owner</div>
                {villas.length > 0 && (
                  <div style={{ fontSize: 12, color: "#A0906E", marginTop: 1 }}>
                    🏠 {villas.map(v => v.name).join(", ")}
                  </div>
                )}
              </div>
            </div>

            {/* Profile */}
            <div style={{ background: "#fff", border: "1px solid #EDE6D6", borderRadius: 16, padding: "24px 28px", marginBottom: 20 }}>
              <div style={{ fontFamily: "Playfair Display,serif", fontSize: 16, fontWeight: 700, color: "#2C1E0F", marginBottom: 4 }}>Profile Information</div>
              <div style={{ fontSize: 12.5, color: "#9E8E6A", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #F0EAD9" }}>Update your personal details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                <Field label="Full Name">
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
                </Field>
                <Field label="Email Address">
                  <input value={email} readOnly style={{ ...inputStyle, background: "#F5F0E8", color: "#9E8E6A", cursor: "not-allowed" }} />
                  <div style={{ fontSize: 11, color: "#C4B89A", marginTop: 4 }}>Contact admin to change email</div>
                </Field>
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label="Phone Number">
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" style={inputStyle} />
                  </Field>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={saveProfile} disabled={saving}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 24px", borderRadius: 10, border: "none", background: saving ? "#E0D5C5" : "#C9A84C", color: saving ? "#9E8E6A" : "#2C1E0F", cursor: saving ? "default" : "pointer", fontSize: 14, fontWeight: 700 }}>
                  {saving ? "Saving…" : <><Ic d={P.check} size={14} />Save Changes</>}
                </button>
              </div>
            </div>

            {/* Password */}
            <div style={{ background: "#fff", border: "1px solid #EDE6D6", borderRadius: 16, padding: "24px 28px", marginBottom: 20 }}>
              <div style={{ fontFamily: "Playfair Display,serif", fontSize: 16, fontWeight: 700, color: "#2C1E0F", marginBottom: 4 }}>Change Password</div>
              <div style={{ fontSize: 12.5, color: "#9E8E6A", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #F0EAD9" }}>Keep your account secure</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                <Field label="New Password">
                  <div style={{ position: "relative" }}>
                    <input type={showPw ? "text" : "password"} value={pwNew} onChange={e => setPwNew(e.target.value)}
                      placeholder="Min. 8 characters" style={{ ...inputStyle, paddingRight: 42 }} />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9E8E6A" }}>
                      <Ic d={showPw ? P.eyeOff : P.eye} size={16} />
                    </button>
                  </div>
                </Field>
                <Field label="Confirm Password">
                  <input type={showPw ? "text" : "password"} value={pwConfirm} onChange={e => setPwConfirm(e.target.value)}
                    placeholder="Re-enter new password" style={{ ...inputStyle, borderColor: pwConfirm && pwNew !== pwConfirm ? "#C62828" : "#E0D5C5" }} />
                  {pwConfirm && pwNew !== pwConfirm && <div style={{ fontSize: 11, color: "#C62828", marginTop: 4 }}>Passwords do not match</div>}
                </Field>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={changePassword} disabled={pwSaving || !pwNew || !pwConfirm || pwNew !== pwConfirm}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 24px", borderRadius: 10, border: "none", background: (!pwNew || !pwConfirm || pwNew !== pwConfirm || pwSaving) ? "#E0D5C5" : "#2C1E0F", color: (!pwNew || !pwConfirm || pwNew !== pwConfirm || pwSaving) ? "#9E8E6A" : "#fff", cursor: (!pwNew || !pwConfirm || pwNew !== pwConfirm || pwSaving) ? "default" : "pointer", fontSize: 14, fontWeight: 700 }}>
                  <Ic d={P.lock} size={14} />{pwSaving ? "Updating…" : "Update Password"}
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div style={{ background: "#fff", border: "1px solid #EDE6D6", borderRadius: 16, padding: "24px 28px", marginBottom: 20 }}>
              <div style={{ fontFamily: "Playfair Display,serif", fontSize: 16, fontWeight: 700, color: "#2C1E0F", marginBottom: 4 }}>Notification Preferences</div>
              <div style={{ fontSize: 12.5, color: "#9E8E6A", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #F0EAD9" }}>Stay informed about your villas</div>
              <Toggle checked={notifs.newBooking}      onChange={v => setNotifs(p => ({ ...p, newBooking: v }))}      label="New booking confirmed" sub="When a new guest books your villa" />
              <Toggle checked={notifs.guestCheckIn}    onChange={v => setNotifs(p => ({ ...p, guestCheckIn: v }))}    label="Guest check-in notifications" sub="When guests arrive at your villa" />
              <Toggle checked={notifs.revenueReport}   onChange={v => setNotifs(p => ({ ...p, revenueReport: v }))}   label="Revenue updates" sub="Weekly revenue summaries" />
              <Toggle checked={notifs.maintenanceCost} onChange={v => setNotifs(p => ({ ...p, maintenanceCost: v }))} label="Maintenance cost alerts" sub="When maintenance exceeds budget thresholds" />
              <Toggle checked={notifs.ownerStatement}  onChange={v => setNotifs(p => ({ ...p, ownerStatement: v }))}  label="Owner statement ready" sub="Monthly financial statement available" />
              <Toggle checked={notifs.monthlyReport}   onChange={v => setNotifs(p => ({ ...p, monthlyReport: v }))}   label="Monthly performance report" sub="Occupancy, revenue and guest satisfaction" />
              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => showToast("Notification preferences saved ✓")}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 24px", borderRadius: 10, border: "none", background: "#C9A84C", color: "#2C1E0F", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
                  <Ic d={P.check} size={14} />Save Preferences
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

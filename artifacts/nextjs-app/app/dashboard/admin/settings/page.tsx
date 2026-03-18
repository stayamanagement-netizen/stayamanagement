"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}

const P = {
  home:    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  villa:   "M3 22h18 M4 22V9l8-7 8 7v13 M9 22V16h6v6 M9 10h.01 M15 10h.01",
  cal:     "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  channel: "M22 12h-4l-3 9L9 3l-3 9H2",
  msg:     "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  cash:    "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  wrench:  "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  service: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  doc:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  pay:     "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z",
  cog:     "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  logout:  "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  lock:    "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M17 11V7a5 5 0 0 0-10 0v4",
  user:    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  bell:    "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
  check:   "M5 13l4 4L19 7",
  eye:     "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  eyeOff:  "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24 M1 1l22 22",
};

const NAV = [
  { label: "Dashboard",        icon: P.home,    href: "/dashboard/admin" },
  { label: "Villas",           icon: P.villa,   href: "/dashboard/admin/villas" },
  { label: "Bookings",         icon: P.cal,     href: "/dashboard/admin/bookings" },
  { label: "Channel Manager",  icon: P.channel, href: "/dashboard/admin/channel-manager" },
  { label: "Messages",         icon: P.msg,     href: "/dashboard/admin/messages" },
  { label: "Petty Cash",       icon: P.cash,    href: "/dashboard/admin/petty-cash" },
  { label: "Maintenance",      icon: P.wrench,  href: "/dashboard/admin/maintenance" },
  { label: "Services",         icon: P.service, href: "/dashboard/admin/services" },
  { label: "Owner Statements", icon: P.doc,     href: null },
  { label: "Payments",         icon: P.pay,     href: "/dashboard/admin/payments" },
  { label: "Settings",         icon: P.cog,     href: "/dashboard/admin/settings" },
];

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #EDE6D6", borderRadius: 16, padding: "24px 28px", marginBottom: 20 }}>
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #F0EAD9" }}>
        <div style={{ fontFamily: "Playfair Display,serif", fontSize: 16, fontWeight: 700, color: "#2C1E0F" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12.5, color: "#9E8E6A", marginTop: 3 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

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

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F5F0E8" }}>
      <span style={{ fontSize: 13.5, color: "#3D2E1A" }}>{label}</span>
      <button onClick={() => onChange(!checked)}
        style={{ width: 42, height: 24, borderRadius: 12, border: "none", background: checked ? "#C9A84C" : "#DDD5C0", cursor: "pointer", position: "relative", transition: "background .2s" }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: checked ? 21 : 3, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.15)" }} />
      </button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [userId,    setUserId]    = useState<string | null>(null);
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew,     setPwNew]     = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving,  setPwSaving]  = useState(false);
  const [showPw,    setShowPw]    = useState(false);
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  const [notifs, setNotifs] = useState({
    newBooking:       true,
    expenseSubmitted: true,
    maintenanceUrgent: true,
    guestMessage:     true,
    paymentReceived:  true,
    weeklyReport:     false,
  });

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      const { data: prof } = await supabase.from("profiles").select("full_name,email,phone,role").eq("id", user.id).single();
      if (!prof || prof.role !== "super_admin") { window.location.href = "/"; return; }
      setUserId(user.id);
      setName(prof.full_name ?? "");
      setEmail(prof.email ?? user.email ?? "");
      setPhone(prof.phone ?? "");
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
    else { showToast("Password changed ✓"); setPwCurrent(""); setPwNew(""); setPwConfirm(""); }
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
          const isActive = item.href !== null && (item.href === "/dashboard/admin" ? path === item.href : path.startsWith(item.href));
          return (
            <button key={item.label} className={`nav-item${isActive ? " active" : ""}`}
              onClick={() => { if (item.href) window.location.href = item.href; }}
              style={{ opacity: item.href ? 1 : 0.4, cursor: item.href ? "pointer" : "default" }}>
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
            <div style={{ fontSize: 12, color: "#9E8E6A" }}>Manage your account and platform preferences</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
          <div style={{ maxWidth: 680 }}>

            {/* Avatar + name header */}
            <div style={{ background: "linear-gradient(135deg,#2C1E0F,#4A3B27)", borderRadius: 16, padding: "24px 28px", marginBottom: 20, display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: "#2C1E0F", flexShrink: 0, fontFamily: "Playfair Display,serif" }}>
                {name.charAt(0).toUpperCase() || "A"}
              </div>
              <div>
                <div style={{ fontFamily: "Playfair Display,serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>{name || "Admin"}</div>
                <div style={{ fontSize: 12.5, color: "#C9A84C", marginTop: 3 }}>Super Admin</div>
                <div style={{ fontSize: 12, color: "#A0906E", marginTop: 1 }}>{email}</div>
              </div>
            </div>

            {/* Profile section */}
            <Section title="Profile Information" subtitle="Update your personal details">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                <Field label="Full Name">
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                    style={inputStyle} />
                </Field>
                <Field label="Email Address">
                  <input value={email} readOnly
                    style={{ ...inputStyle, background: "#F5F0E8", color: "#9E8E6A", cursor: "not-allowed" }} />
                  <div style={{ fontSize: 11, color: "#C4B89A", marginTop: 4 }}>Email cannot be changed here</div>
                </Field>
                <Field label="Phone Number">
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000"
                    style={inputStyle} />
                </Field>
                <Field label="Role">
                  <input value="Super Administrator" readOnly
                    style={{ ...inputStyle, background: "#F5F0E8", color: "#9E8E6A", cursor: "not-allowed" }} />
                </Field>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                <button onClick={saveProfile} disabled={saving}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 24px", borderRadius: 10, border: "none", background: saving ? "#E0D5C5" : "#C9A84C", color: saving ? "#9E8E6A" : "#2C1E0F", cursor: saving ? "default" : "pointer", fontSize: 14, fontWeight: 700, transition: "all .15s" }}>
                  {saving ? "Saving…" : <><Ic d={P.check} size={14} />Save Changes</>}
                </button>
              </div>
            </Section>

            {/* Password section */}
            <Section title="Change Password" subtitle="Use a strong password of at least 8 characters">
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
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                <button onClick={changePassword} disabled={pwSaving || !pwNew || !pwConfirm || pwNew !== pwConfirm}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 24px", borderRadius: 10, border: "none", background: (!pwNew || !pwConfirm || pwNew !== pwConfirm || pwSaving) ? "#E0D5C5" : "#2C1E0F", color: (!pwNew || !pwConfirm || pwNew !== pwConfirm || pwSaving) ? "#9E8E6A" : "#fff", cursor: (!pwNew || !pwConfirm || pwNew !== pwConfirm || pwSaving) ? "default" : "pointer", fontSize: 14, fontWeight: 700, transition: "all .15s" }}>
                  <Ic d={P.lock} size={14} />{pwSaving ? "Updating…" : "Update Password"}
                </button>
              </div>
            </Section>

            {/* Notifications */}
            <Section title="Notification Preferences" subtitle="Choose which events trigger notifications">
              <Toggle checked={notifs.newBooking}       onChange={v => setNotifs(p => ({ ...p, newBooking: v }))}       label="New booking received" />
              <Toggle checked={notifs.expenseSubmitted} onChange={v => setNotifs(p => ({ ...p, expenseSubmitted: v }))} label="Expense submitted for approval" />
              <Toggle checked={notifs.maintenanceUrgent}onChange={v => setNotifs(p => ({ ...p, maintenanceUrgent: v }))} label="Urgent maintenance reported" />
              <Toggle checked={notifs.guestMessage}     onChange={v => setNotifs(p => ({ ...p, guestMessage: v }))}     label="New guest message" />
              <Toggle checked={notifs.paymentReceived}  onChange={v => setNotifs(p => ({ ...p, paymentReceived: v }))}  label="Payment received" />
              <Toggle checked={notifs.weeklyReport}     onChange={v => setNotifs(p => ({ ...p, weeklyReport: v }))}     label="Weekly summary report" />
              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => showToast("Notification preferences saved ✓")}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 24px", borderRadius: 10, border: "none", background: "#C9A84C", color: "#2C1E0F", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
                  <Ic d={P.check} size={14} />Save Preferences
                </button>
              </div>
            </Section>

            {/* Danger zone */}
            <Section title="Platform Information" subtitle="Platform details and version info">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Platform", value: "Staya Management" },
                  { label: "Version",  value: "1.0.0" },
                  { label: "Currency", value: "USD" },
                  { label: "Timezone", value: Intl.DateTimeFormat().resolvedOptions().timeZone },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "#FAF7F2", borderRadius: 10, padding: "12px 16px", border: "1px solid #EDE6D6" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#9E8E6A", textTransform: "uppercase", letterSpacing: 0.7 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#2C1E0F", marginTop: 4 }}>{value}</div>
                  </div>
                ))}
              </div>
            </Section>

          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/* ─── types ──────────────────────────────────────────────────────────────────── */
interface Villa { id: string; name: string | null; }
interface PaymentRule {
  id?: string;
  villa_name: string;
  deposit_percentage: number;
  deposit_due_days: number;
  balance_due_days: number;
  stripe_enabled: boolean;
  bank_transfer_enabled: boolean;
  reminder_14: boolean;
  reminder_7: boolean;
  reminder_3: boolean;
  reminder_1: boolean;
  block_checkin: boolean;
  bank_name: string;
  account_name: string;
  account_number: string;
  swift_code: string;
}

const DEFAULT_RULE: Omit<PaymentRule, "villa_name"> = {
  deposit_percentage: 30, deposit_due_days: 3, balance_due_days: 30,
  stripe_enabled: true, bank_transfer_enabled: true,
  reminder_14: true, reminder_7: true, reminder_3: true, reminder_1: false,
  block_checkin: false,
  bank_name: "", account_name: "", account_number: "", swift_code: "",
};

/* ─── SVG paths ──────────────────────────────────────────────────────────────── */
const P = {
  home:    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  villa:   "M3 22h18 M4 22V9l8-7 8 7v13 M9 22V16h6v6 M9 10h.01 M15 10h.01",
  cal:     "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  channel: "M22 12h-4l-3 9L9 3l-3 9H2",
  msg:     "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  cash:    "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  wrench:  "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  service: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  doc:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  pay:     "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z",
  cog:     "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  logout:  "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  check:   "M20 6L9 17l-5-5",
  back:    "M19 12H5 M12 5l-7 7 7 7",
  bank:    "M3 21h18 M3 10h18 M5 6l7-3 7 3 M4 10v11 M20 10v11 M8 14v3 M12 14v3 M16 14v3",
};

const NAV = [
  { label: "Dashboard",        icon: P.home,    href: "/dashboard/admin" },
  { label: "Villas",           icon: P.villa,   href: "/dashboard/admin/villas" },
  { label: "Bookings",         icon: P.cal,     href: null },
  { label: "Channel Manager",  icon: P.channel, href: null },
  { label: "Messages",         icon: P.msg,     href: null },
  { label: "Petty Cash",       icon: P.cash,    href: "/dashboard/admin/petty-cash" },
  { label: "Maintenance",      icon: P.wrench,  href: "/dashboard/admin/maintenance" },
  { label: "Services",         icon: P.service, href: "/dashboard/admin/services" },
  { label: "Owner Statements", icon: P.doc,     href: null },
  { label: "Payments",         icon: P.pay,     href: "/dashboard/admin/payments" },
  { label: "Settings",         icon: P.cog,     href: "/dashboard/admin/settings" },
];

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((seg, i) => <path key={i} d={i === 0 ? seg : "M" + seg} />)}
    </svg>
  );
}

/* ─── toggle ─────────────────────────────────────────────────────────────────── */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 42, height: 23, borderRadius: 12, background: on ? "#C9A84C" : "#DDD5C0", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
      <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: on ? 22 : 3, transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)" }} />
    </div>
  );
}

/* ─── section card ───────────────────────────────────────────────────────────── */
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EDE6D6", boxShadow: "0 1px 8px rgba(44,30,10,.05)", overflow: "hidden" }}>
      <div style={{ padding: "16px 22px", borderBottom: "1px solid #F0EBE0", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FBF6EA", display: "flex", alignItems: "center", justifyContent: "center", color: "#C9A84C" }}><Ic d={icon} size={15} /></div>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#2C2C2C", fontFamily: "Playfair Display,Georgia,serif" }}>{title}</span>
      </div>
      <div style={{ padding: "20px 22px" }}>{children}</div>
    </div>
  );
}

/* ─── field ──────────────────────────────────────────────────────────────────── */
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1.5px solid #DDD5C0", borderRadius: 8, fontSize: 13, fontFamily: "Inter,sans-serif", color: "#2C2C2C", background: "#FDFBF7", outline: "none", boxSizing: "border-box" };
const labelStyle: React.CSSProperties = { fontSize: 11.5, fontWeight: 600, color: "#7A6A50", letterSpacing: ".04em", fontFamily: "Inter,sans-serif", marginBottom: 5, display: "block" };

/* ─── main ───────────────────────────────────────────────────────────────────── */
export default function PaymentRulesPage() {
  const [villas, setVillas] = useState<Villa[]>([]);
  const [selectedVilla, setSelectedVilla] = useState<string>("");
  const [rule, setRule] = useState<Omit<PaymentRule, "villa_name">>(DEFAULT_RULE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);

  function set<K extends keyof typeof rule>(key: K, val: (typeof rule)[K]) {
    setRule(r => ({ ...r, [key]: val }));
  }

  const fetchVillas = useCallback(async () => {
    const { data } = await supabase.from("villas").select("id, name").order("name");
    setVillas((data ?? []) as Villa[]);
    if ((data ?? []).length > 0) setSelectedVilla((data![0] as Villa).name ?? "");
  }, []);

  const fetchRule = useCallback(async (villaName: string) => {
    if (!villaName) return;
    setLoading(true);
    try {
      const { data } = await supabase.from("villa_payment_rules").select("*").eq("villa_name", villaName).limit(1);
      if (data && data.length > 0) {
        const r = data[0] as PaymentRule;
        setRule({
          id: r.id,
          deposit_percentage: r.deposit_percentage ?? 30,
          deposit_due_days: r.deposit_due_days ?? 3,
          balance_due_days: r.balance_due_days ?? 30,
          stripe_enabled: r.stripe_enabled ?? true,
          bank_transfer_enabled: r.bank_transfer_enabled ?? true,
          reminder_14: r.reminder_14 ?? true,
          reminder_7: r.reminder_7 ?? true,
          reminder_3: r.reminder_3 ?? true,
          reminder_1: r.reminder_1 ?? false,
          block_checkin: r.block_checkin ?? false,
          bank_name: r.bank_name ?? "",
          account_name: r.account_name ?? "",
          account_number: r.account_number ?? "",
          swift_code: r.swift_code ?? "",
        } as Omit<PaymentRule, "villa_name">);
      } else {
        setRule({ ...DEFAULT_RULE });
      }
    } catch { setRule({ ...DEFAULT_RULE }); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVillas();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      supabase.from("profiles").select("id,full_name,role").eq("id", user.id).single()
        .then(({ data }) => { if (data) setProfile(data as any); }, () => {});
    });
  }, [fetchVillas]);

  useEffect(() => { if (selectedVilla) fetchRule(selectedVilla); }, [selectedVilla, fetchRule]);

  async function handleSave() {
    if (!selectedVilla) { setError("Please select a villa."); return; }
    setSaving(true); setError(null); setSaved(false);
    try {
      const payload: PaymentRule = { ...rule, villa_name: selectedVilla };
      const { error: err } = await supabase.from("villa_payment_rules").upsert([payload], { onConflict: "villa_name" });
      if (err) throw err;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save. Please try again.");
    }
    setSaving(false);
  }

  const initials = profile?.full_name ? profile.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() : "A";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F5F0E8", fontFamily: "Inter,sans-serif" }}>
      <style>{`
        *{box-sizing:border-box;}
        .nav-item{display:flex;align-items:center;gap:10px;width:100%;padding:9px 18px;border:none;background:transparent;color:#7A6A50;font-size:13px;font-family:Inter,sans-serif;cursor:pointer;text-align:left;border-left:3px solid transparent;transition:all .15s;}
        .nav-item:hover{background:#F5F0E8;color:#4A3B27;}
        .nav-item.active{background:#FBF6EA;color:#2C2C2C;border-left:3px solid #C9A84C;font-weight:600;}
        input:focus,select:focus,textarea:focus{border-color:#C9A84C!important;}
        @media(max-width:768px){
          .sidebar{width:52px!important;}
          .sidebar-label,.sidebar-section-label,.sidebar-user-name,.sidebar-user-role{display:none!important;}
          .nav-item{padding:10px 0!important;justify-content:center;}
          .nav-item .nav-icon{margin:0!important;}
          .sidebar-user{justify-content:center!important;padding:10px 0!important;}
          .content-area{padding:16px!important;}
          .form-grid{grid-template-columns:1fr!important;}
          .rules-layout{grid-template-columns:1fr!important;}
        }
        @media(min-width:769px) and (max-width:1024px){.rules-layout{grid-template-columns:1fr!important;}}
      `}</style>

      {/* sidebar */}
      <aside className="sidebar" style={{ width: 210, background: "#2C1E0F", minHeight: "100vh", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", zIndex: 100, overflow: "hidden" }}>
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>
          </div>
          <div className="sidebar-label">
            <div style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 700, fontFamily: "Playfair Display,Georgia,serif" }}>Staya</div>
            <div style={{ color: "#C4B89A", fontSize: 9.5, letterSpacing: ".15em", textTransform: "uppercase" }}>Management</div>
          </div>
        </div>
        <nav style={{ padding: "12px 0", flex: 1, overflowY: "auto" }}>
          <div className="sidebar-section-label" style={{ fontSize: 9.5, color: "#C4B89A", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, padding: "0 18px", marginBottom: 6 }}>Main Menu</div>
          {NAV.map(item => {
            const isActive = item.label === "Payments";
            return (
              <button key={item.label} className={`nav-item${isActive ? " active" : ""}`} onClick={() => { if (item.href) window.location.href = item.href; }}>
                <span className="nav-icon" style={{ color: isActive ? "#C9A84C" : "#A0906E", flexShrink: 0 }}><Ic d={item.icon} size={15} /></span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-user" style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials}</div>
          <div className="sidebar-user-name" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#F5F0E8", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile?.full_name ?? "Admin"}</div>
            <div className="sidebar-user-role" style={{ color: "#C9A84C", fontSize: 10.5, fontWeight: 600 }}>Super Admin</div>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} style={{ background: "none", border: "none", cursor: "pointer", color: "#A0906E", padding: 4 }}><Ic d={P.logout} size={14} /></button>
        </div>
      </aside>

      {/* main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* topbar */}
        <header style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 28px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => window.location.href = "/dashboard/admin/payments/"} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "#F5F0E8", color: "#7A6A50", fontSize: 12.5, fontWeight: 600, fontFamily: "Inter,sans-serif", cursor: "pointer" }}>
              <Ic d={P.back} size={13} /> Payments
            </button>
            <span style={{ color: "#C4B89A" }}>/</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#2C2C2C", fontFamily: "Inter,sans-serif" }}>Payment Rules</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#F5F0E8", borderRadius: 20, padding: "5px 12px 5px 6px" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>{initials}</div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#4A3B27", fontFamily: "Inter,sans-serif" }}>Admin</span>
          </div>
        </header>

        {/* content */}
        <main className="content-area" style={{ padding: "28px 28px 60px", flex: 1 }}>
          {/* header */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", fontWeight: 700 }}>Payment Rules</h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9E8E6A" }}>Configure per-villa payment schedules, methods, and reminders</p>
          </div>

          {/* villa selector */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EDE6D6", padding: "18px 22px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#4A3B27", fontFamily: "Inter,sans-serif", whiteSpace: "nowrap" }}>Configure rules for:</div>
            <select value={selectedVilla} onChange={e => setSelectedVilla(e.target.value)}
              style={{ padding: "9px 14px", border: "1.5px solid #DDD5C0", borderRadius: 8, fontSize: 13.5, fontFamily: "Inter,sans-serif", color: "#2C2C2C", background: "#FDFBF7", cursor: "pointer", outline: "none", minWidth: 220 }}>
              <option value="">— Select a villa —</option>
              {villas.map(v => <option key={v.id} value={v.name ?? ""}>{v.name}</option>)}
            </select>
            {loading && <div style={{ width: 18, height: 18, border: "2.5px solid #EDE6D6", borderTopColor: "#C9A84C", borderRadius: "50%", animation: "spin .7s linear infinite" }} />}
            {villas.length === 0 && <span style={{ fontSize: 12.5, color: "#9E8E6A" }}>No villas found — add a villa first.</span>}
          </div>

          {selectedVilla && (
            <div className="rules-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

              {/* Deposit & Balance */}
              <Section title="Deposit & Balance Schedule" icon={P.pay}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Deposit Percentage (%)</label>
                    <input type="number" min={0} max={100} style={inputStyle} value={rule.deposit_percentage}
                      onChange={e => set("deposit_percentage", parseInt(e.target.value) || 0)} />
                    <div style={{ fontSize: 11.5, color: "#9E8E6A", marginTop: 4, fontFamily: "Inter,sans-serif" }}>Percentage of total booking charged as deposit</div>
                  </div>
                  <div>
                    <label style={labelStyle}>Deposit Due Within (days of booking)</label>
                    <input type="number" min={0} style={inputStyle} value={rule.deposit_due_days}
                      onChange={e => set("deposit_due_days", parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Balance Due (days before check-in)</label>
                    <input type="number" min={0} style={inputStyle} value={rule.balance_due_days}
                      onChange={e => set("balance_due_days", parseInt(e.target.value) || 0)} />
                  </div>
                </div>
              </Section>

              {/* Payment Methods */}
              <Section title="Payment Methods" icon={P.cog}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {([
                    { key: "stripe_enabled" as const, label: "Stripe", desc: "Accept online card payments via Stripe" },
                    { key: "bank_transfer_enabled" as const, label: "Bank Transfer", desc: "Accept direct bank transfers" },
                  ]).map(({ key, label, desc }) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#F5F0E8", borderRadius: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C", fontFamily: "Inter,sans-serif" }}>{label}</div>
                        <div style={{ fontSize: 11.5, color: "#9E8E6A", fontFamily: "Inter,sans-serif" }}>{desc}</div>
                      </div>
                      <Toggle on={rule[key]} onChange={v => set(key, v)} />
                    </div>
                  ))}

                  <div style={{ marginTop: 4 }}>
                    <label style={{ ...labelStyle, marginBottom: 10 }}>Auto-send Reminders</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {([
                        { key: "reminder_14" as const, label: "14 days" },
                        { key: "reminder_7" as const, label: "7 days" },
                        { key: "reminder_3" as const, label: "3 days" },
                        { key: "reminder_1" as const, label: "1 day" },
                      ]).map(({ key, label }) => (
                        <label key={key} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${rule[key] ? "#C9A84C" : "#DDD5C0"}`, background: rule[key] ? "#FBF6EA" : "#FDFBF7", cursor: "pointer", transition: "all .15s" }}>
                          <input type="checkbox" checked={rule[key]} onChange={e => set(key, e.target.checked)} style={{ display: "none" }} />
                          <div style={{ width: 14, height: 14, borderRadius: 4, border: `2px solid ${rule[key] ? "#C9A84C" : "#C4B89A"}`, background: rule[key] ? "#C9A84C" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {rule[key] && <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                          </div>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: rule[key] ? "#2C2C2C" : "#9E8E6A", fontFamily: "Inter,sans-serif" }}>{label} before</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#FFF0F0", borderRadius: 10, border: "1px solid #FFCDD2" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C", fontFamily: "Inter,sans-serif" }}>Block Check-in if Unpaid</div>
                      <div style={{ fontSize: 11.5, color: "#9E8E6A", fontFamily: "Inter,sans-serif" }}>Prevent check-in when no confirmed payment</div>
                    </div>
                    <Toggle on={rule.block_checkin} onChange={v => set("block_checkin", v)} />
                  </div>
                </div>
              </Section>

              {/* Bank Account Details - full width */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Section title="Bank Account Details" icon={P.bank}>
                  <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                    {([
                      { key: "bank_name" as const, label: "Bank Name", placeholder: "e.g. Bank Central Asia" },
                      { key: "account_name" as const, label: "Account Name", placeholder: "e.g. PT Staya Management" },
                      { key: "account_number" as const, label: "Account Number", placeholder: "e.g. 1234567890" },
                      { key: "swift_code" as const, label: "SWIFT / BIC Code", placeholder: "e.g. CENAIDJA" },
                    ]).map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label style={labelStyle}>{label}</label>
                        <input style={inputStyle} value={rule[key] as string} onChange={e => set(key, e.target.value)} placeholder={placeholder} />
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            </div>
          )}

          {/* save bar */}
          {selectedVilla && (
            <div style={{ position: "sticky", bottom: 0, background: "rgba(245,240,232,.95)", backdropFilter: "blur(8px)", borderTop: "1px solid #EDE6D6", marginTop: 24, padding: "14px 0", display: "flex", gap: 12, alignItems: "center", justifyContent: "flex-end" }}>
              {error && <span style={{ fontSize: 12.5, color: "#C62828", fontFamily: "Inter,sans-serif" }}>{error}</span>}
              {saved && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#1E7A48", fontFamily: "Inter,sans-serif" }}>
                  <Ic d={P.check} size={14} /> Rules saved successfully
                </div>
              )}
              <button onClick={handleSave} disabled={saving}
                style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: saving ? "#E8D89A" : "#C9A84C", color: "#fff", fontSize: 13.5, fontWeight: 700, fontFamily: "Inter,sans-serif", cursor: saving ? "wait" : "pointer", boxShadow: "0 2px 8px rgba(201,168,76,.3)" }}>
                {saving ? "Saving…" : "Save Rules"}
              </button>
            </div>
          )}
        </main>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

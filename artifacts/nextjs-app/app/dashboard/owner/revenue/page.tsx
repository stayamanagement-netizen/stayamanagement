"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Profile { id: string; full_name: string | null; role: string; }

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}
function Skel({ w = "100%", h = 14 }: { w?: string | number; h?: number }) {
  return <div style={{ width: w, height: h, borderRadius: 6, background: "linear-gradient(90deg,#EDE6D6 25%,#F5EFE3 50%,#EDE6D6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />;
}
function fmtMoney(n: number, cur = "USD") {
  if (cur === "IDR") return `Rp ${n.toLocaleString("id-ID")}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
}

const P = {
  home:   "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  villa:  "M3 22h18 M4 22V9l8-7 8 7v13 M9 22V16h6v6 M9 10h.01 M15 10h.01",
  cal:    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  chart:  "M18 20V10 M12 20V4 M6 20v-6",
  doc:    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  wallet: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  wrench: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  gear:   "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  dl:     "M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
};
const NAV = [
  { label: "Dashboard",          icon: P.home,   href: "/dashboard/owner" },
  { label: "My Villa",           icon: P.villa,  href: "/dashboard/owner/villa" },
  { label: "Bookings",           icon: P.cal,    href: "/dashboard/owner/bookings" },
  { label: "Revenue & Reports",  icon: P.chart,  href: "/dashboard/owner/revenue" },
  { label: "Monthly Statements", icon: P.doc,    href: "/dashboard/owner/statements" },
  { label: "Petty Cash",         icon: P.wallet, href: "/dashboard/owner/petty-cash" },
  { label: "Maintenance",        icon: P.wrench, href: "/dashboard/owner/maintenance" },
  { label: "Settings",           icon: P.gear,   href: null },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function OwnerRevenuePage() {
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [villaId, setVillaId]   = useState<string | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading]   = useState(false);

  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear,  setSelYear]  = useState(now.getFullYear());

  const [grossRevenue,      setGrossRevenue]      = useState<number | null>(null);
  const [mgmtFee,           setMgmtFee]           = useState<number | null>(null);
  const [pettyCashDeduct,   setPettyCashDeduct]   = useState<number | null>(null);
  const [maintDeduct,       setMaintDeduct]       = useState<number | null>(null);
  const [netPayout,         setNetPayout]         = useState<number | null>(null);

  /* auth */
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      try {
        const { data: profData } = await supabase.from("profiles").select("id,full_name,role").eq("id", user.id).single();
        const prof: Profile | null = profData ?? null;
        if (!prof) { window.location.href = "/"; return; }
        if (prof.role === "super_admin")   { window.location.href = "/dashboard/admin";   return; }
        if (prof.role === "villa_manager") { window.location.href = "/dashboard/manager"; return; }
        if (prof.role === "guest")         { window.location.href = "/dashboard/guest";   return; }
        if (prof.role !== "villa_owner") { window.location.href = "/"; return; }
        setProfile(prof);
        const { data: ov } = await supabase.from("villa_owners").select("villa_id").eq("owner_id", user.id).single();
        if (ov?.villa_id) {
          setVillaId(ov.villa_id);
          const { data: v } = await supabase.from("villas").select("currency").eq("id", ov.villa_id).single();
          if (v?.currency) setCurrency(v.currency);
        }
      } catch { window.location.href = "/"; }
    });
  }, []);

  /* fetch revenue data for selected month */
  useEffect(() => {
    if (!villaId) return;
    (async () => {
      setLoading(true);
      setGrossRevenue(null); setMgmtFee(null); setPettyCashDeduct(null); setMaintDeduct(null); setNetPayout(null);
      try {
        const start = `${selYear}-${String(selMonth + 1).padStart(2, "0")}-01`;
        const end   = new Date(selYear, selMonth + 1, 0).toISOString().slice(0, 10);

        const [{ data: pays }, { data: petty }, { data: maints }] = await Promise.all([
          supabase.from("payments").select("amount").eq("villa_id", villaId).eq("status", "confirmed").gte("created_at", start).lte("created_at", end),
          supabase.from("petty_cash").select("amount").eq("villa_id", villaId).eq("status", "approved").gte("created_at", start).lte("created_at", end),
          supabase.from("maintenance_issues").select("cost").eq("villa_id", villaId).gte("created_at", start).lte("created_at", end),
        ]);

        const gross   = (pays   ?? []).reduce((s: number, r: { amount: number | null }) => s + (r.amount ?? 0), 0);
        const pettyT  = (petty  ?? []).reduce((s: number, r: { amount: number | null }) => s + (r.amount ?? 0), 0);
        const maintT  = (maints ?? []).reduce((s: number, r: { cost:   number | null }) => s + (r.cost   ?? 0), 0);
        const mgmt    = gross * 0.20;
        const net     = gross - mgmt - pettyT - maintT;

        setGrossRevenue(gross); setMgmtFee(mgmt);
        setPettyCashDeduct(pettyT); setMaintDeduct(maintT); setNetPayout(net);
      } catch {} finally { setLoading(false); }
    })();
  }, [villaId, selMonth, selYear]);

  const ownerName = profile?.full_name ?? "Owner";
  const initStr = ownerName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const years = [now.getFullYear() - 1, now.getFullYear()];

  function DeductRow({ label, amount, color = "#9B2C2C" }: { label: string; amount: number | null; color?: string }) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid #F5F0E8" }}>
        <span style={{ fontSize: 13.5, color: "#4A3B27" }}>{label}</span>
        {amount == null ? <Skel w={80} h={14} /> : <span style={{ fontSize: 14, fontWeight: 700, color }}>−{fmtMoney(amount, currency)}</span>}
      </div>
    );
  }

  const sidebar = (
    <div className="owner-sidebar">
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={P.villa} size={17} /></div>
        <div><div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Playfair Display,Georgia,serif" }}>Staya</div><div style={{ fontSize: 9.5, color: "#C9A84C", letterSpacing: ".1em", textTransform: "uppercase" }}>Management</div></div>
      </div>
      <div style={{ padding: "14px 12px", flex: 1 }}>
        {NAV.map(item => {
          const active = path === item.href || (item.href && item.href !== "/dashboard/owner" && path.startsWith(item.href));
          return <div key={item.label} onClick={() => item.href && (window.location.href = item.href)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, marginBottom: 2, cursor: item.href ? "pointer" : "default", background: active ? "rgba(201,168,76,.18)" : "transparent", color: active ? "#C9A84C" : item.href ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.3)", opacity: item.href ? 1 : 0.5, transition: "all .15s" }}><Ic d={item.icon} size={15} /><span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400 }}>{item.label}</span></div>;
        })}
      </div>
      <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, color: "#fff" }}>{initStr}</div>
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ownerName}</div><div style={{ fontSize: 10, color: "rgba(201,168,76,.7)" }}>Villa Owner</div></div>
        <div style={{ cursor: "pointer", color: "rgba(255,255,255,.4)" }} onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}><Ic d={P.logout} size={14} /></div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{background:#F5F0E8;font-family:Inter,sans-serif}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}.owner-sidebar{width:220px;background:#2C1E0F;display:flex;flex-direction:column;min-height:100vh;position:fixed;top:0;left:0;z-index:100}.owner-content{margin-left:220px;flex:1}@media(max-width:900px){.owner-sidebar{width:180px}.owner-content{margin-left:180px}}@media(max-width:640px){.owner-sidebar{display:none}.owner-content{margin-left:0}}`}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        {sidebar}
        <div className="owner-content">
          <div style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 28px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
            <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C2C2C" }}>Staya Management</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{initStr}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C" }}>{ownerName}</span>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "transparent", color: "#7A6A50", fontSize: 12, cursor: "pointer" }}><Ic d={P.logout} size={13} /> Logout</button>
            </div>
          </div>

          <main style={{ padding: "28px 28px 48px", maxWidth: 900, margin: "0 auto" }}>
            {/* header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 26, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", fontWeight: 700 }}>Revenue & Reports</h1>
                <p style={{ fontSize: 13, color: "#9E8E6A", marginTop: 4 }}>Monthly breakdown — your villa only</p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #DDD5C0", background: "#fff", fontSize: 13, color: "#2C2C2C", cursor: "pointer", outline: "none" }}>
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #DDD5C0", background: "#fff", fontSize: 13, color: "#2C2C2C", cursor: "pointer", outline: "none" }}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1.5px solid #C9A84C", background: "#C9A84C", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  <Ic d={P.dl} size={14} /> Download PDF
                </button>
              </div>
            </div>

            {/* selected period label */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", overflow: "hidden", marginBottom: 24 }}>
              <div style={{ padding: "14px 24px", background: "#FDFBF7", borderBottom: "1px solid #EDE6D6" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#2C2C2C", fontFamily: "Playfair Display,Georgia,serif" }}>{MONTHS[selMonth]} {selYear}</span>
                <span style={{ fontSize: 12, color: "#9E8E6A", marginLeft: 10 }}>Revenue Report</span>
              </div>

              {/* gross revenue */}
              <div style={{ padding: "20px 24px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 14, borderBottom: "2px solid #EDE6D6" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#9E8E6A", fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 4 }}>Gross Revenue</div>
                    <div style={{ fontSize: 11.5, color: "#C4B89A" }}>All confirmed payments</div>
                  </div>
                  {loading || grossRevenue == null ? <Skel w={120} h={28} /> : (
                    <div style={{ fontSize: 26, fontWeight: 700, color: "#1E7A48", fontFamily: "Playfair Display,Georgia,serif" }}>{fmtMoney(grossRevenue, currency)}</div>
                  )}
                </div>
              </div>

              {/* deductions */}
              <div style={{ padding: "0 24px" }}>
                <div style={{ fontSize: 11, color: "#9E8E6A", fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase", padding: "14px 0 8px" }}>Deductions</div>
                <DeductRow label="Management Fee (20%)"    amount={loading ? null : mgmtFee} />
                <DeductRow label="Petty Cash Expenses"     amount={loading ? null : pettyCashDeduct} />
                <DeductRow label="Maintenance Costs"       amount={loading ? null : maintDeduct} />
              </div>

              {/* net payout */}
              <div style={{ margin: "0 24px 24px", marginTop: 8, background: "linear-gradient(135deg,#2C1E0F,#4A3320)", borderRadius: 12, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, color: "rgba(201,168,76,.75)", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4 }}>Net Payout</div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.45)" }}>After all deductions</div>
                </div>
                {loading || netPayout == null ? <Skel w={140} h={32} /> : (
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#C9A84C", fontFamily: "Playfair Display,Georgia,serif" }}>{fmtMoney(Math.max(0, netPayout), currency)}</div>
                )}
              </div>
            </div>

            {/* breakdown table */}
            {!loading && grossRevenue != null && (
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", overflow: "hidden" }}>
                <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #EDE6D6" }}>
                  <h2 style={{ fontSize: 15.5, fontWeight: 700, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C" }}>Breakdown Summary</h2>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>
                      {["Item", "Amount", "% of Gross"].map(h => <th key={h} style={{ padding: "10px 22px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "#9E8E6A", letterSpacing: ".07em", textTransform: "uppercase", borderBottom: "1px solid #EDE6D6", background: "#FDFAF5" }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {[
                        { item: "Gross Revenue",     amount: grossRevenue,    pct: 100,    color: "#1E7A48" },
                        { item: "Management Fee",    amount: -(mgmtFee ?? 0), pct: -20,   color: "#9B2C2C" },
                        { item: "Petty Cash",        amount: -(pettyCashDeduct ?? 0), pct: grossRevenue > 0 ? -((pettyCashDeduct ?? 0) / grossRevenue * 100) : 0, color: "#9B2C2C" },
                        { item: "Maintenance",       amount: -(maintDeduct ?? 0), pct: grossRevenue > 0 ? -((maintDeduct ?? 0) / grossRevenue * 100) : 0, color: "#9B2C2C" },
                        { item: "Net Payout",        amount: netPayout ?? 0,  pct: grossRevenue > 0 ? ((netPayout ?? 0) / grossRevenue * 100) : 0, color: "#C9A84C" },
                      ].map((row, i) => (
                        <tr key={row.item} style={{ background: i === 4 ? "#FDFBF7" : i % 2 === 0 ? "#fff" : "#FDFAF5", borderTop: i === 4 ? "2px solid #EDE6D6" : "none" }}>
                          <td style={{ padding: "12px 22px", fontSize: 13, fontWeight: i === 4 ? 700 : 500, color: "#2C2C2C" }}>{row.item}</td>
                          <td style={{ padding: "12px 22px", fontSize: 13.5, fontWeight: 700, color: row.color }}>{row.amount >= 0 ? fmtMoney(row.amount, currency) : `−${fmtMoney(Math.abs(row.amount), currency)}`}</td>
                          <td style={{ padding: "12px 22px", fontSize: 13, color: row.pct >= 0 ? "#1E7A48" : "#9B2C2C", fontWeight: 600 }}>{row.pct >= 0 ? "+" : ""}{row.pct.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

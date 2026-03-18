"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Profile { id: string; full_name: string | null; role: string; }
interface Statement {
  id: string; month: number | null; year: number | null;
  gross_revenue: number | null; management_fee: number | null;
  petty_cash_deductions: number | null; maintenance_deductions: number | null;
  net_payout: number | null; status: string | null; created_at: string | null;
}

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}
function Skel({ w = "100%", h = 14 }: { w?: string | number; h?: number }) {
  return <div style={{ width: w, height: h, borderRadius: 6, background: "linear-gradient(90deg,#EDE6D6 25%,#F5EFE3 50%,#EDE6D6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />;
}
function fmtMoney(n: number | null, cur = "USD") {
  if (n == null) return "—";
  if (cur === "IDR") return `Rp ${n.toLocaleString("id-ID")}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
}
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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
  eye:    "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
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

function StatBadge({ s }: { s: string | null }) {
  const m: Record<string, [string, string, string]> = {
    draft:  ["#F5F0E8", "#7A6A50", "#C4B89A"],
    sent:   ["#EEF4FF", "#2B4BA0", "#3B63C9"],
    paid:   ["#EDFAF3", "#1E7A48", "#2D8A57"],
  };
  const [bg, color, dot] = m[(s ?? "draft").toLowerCase()] ?? m.draft;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: bg, color, fontSize: 11.5, fontWeight: 700 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: dot }} />{(s ?? "Draft").replace(/\b\w/g, c => c.toUpperCase())}</span>;
}

/* ── detail modal ─────────────────────────────────────────────────────────── */
function DetailModal({ s, cur, onClose }: { s: Statement; cur: string; onClose: () => void }) {
  const totalDeduct = (s.management_fee ?? 0) + (s.petty_cash_deductions ?? 0) + (s.maintenance_deductions ?? 0);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,28,10,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(44,28,10,.25)" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #EDE6D6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 18, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C" }}>Statement — {MONTHS[(s.month ?? 1) - 1]} {s.year}</h2>
            <div style={{ marginTop: 4 }}><StatBadge s={s.status} /></div>
          </div>
          <button onClick={onClose} style={{ background: "#F5F0E8", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#7A6A50", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          {[
            { label: "Gross Revenue",         value: fmtMoney(s.gross_revenue, cur),            color: "#1E7A48" },
            { label: "Management Fee (20%)",  value: `−${fmtMoney(s.management_fee, cur)}`,     color: "#9B2C2C" },
            { label: "Petty Cash Deductions", value: `−${fmtMoney(s.petty_cash_deductions, cur)}`, color: "#9B2C2C" },
            { label: "Maintenance Costs",     value: `−${fmtMoney(s.maintenance_deductions, cur)}`, color: "#9B2C2C" },
            { label: "Total Deductions",      value: `−${fmtMoney(totalDeduct, cur)}`,           color: "#9B2C2C" },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F5F0E8" }}>
              <span style={{ fontSize: 13, color: "#7A6A50" }}>{r.label}</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: r.color }}>{r.value}</span>
            </div>
          ))}
          <div style={{ background: "linear-gradient(135deg,#2C1E0F,#4A3320)", borderRadius: 10, padding: "14px 18px", marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(201,168,76,.8)", letterSpacing: ".04em", textTransform: "uppercase" }}>Net Payout</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#C9A84C", fontFamily: "Playfair Display,Georgia,serif" }}>{fmtMoney(s.net_payout, cur)}</span>
          </div>
        </div>
        <div style={{ padding: "12px 24px 20px", borderTop: "1px solid #EDE6D6", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 22px", borderRadius: 8, border: "1.5px solid #DDD5C0", background: "transparent", color: "#7A6A50", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function OwnerStatementsPage() {
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [villaId, setVillaId]     = useState<string | null>(null);
  const [currency, setCurrency]   = useState("USD");
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading]     = useState(true);
  const [viewing, setViewing]     = useState<Statement | null>(null);

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
        if (!ov?.villa_id) { setLoading(false); return; }
        setVillaId(ov.villa_id);
        const { data: v } = await supabase.from("villas").select("currency").eq("id", ov.villa_id).single();
        if (v?.currency) setCurrency(v.currency);
        const { data: stmts } = await supabase.from("owner_statements")
          .select("*").eq("villa_id", ov.villa_id)
          .order("year", { ascending: false }).order("month", { ascending: false });
        setStatements((stmts ?? []) as Statement[]);
      } catch { window.location.href = "/"; }
      finally { setLoading(false); }
    });
  }, []);

  const ownerName = profile?.full_name ?? "Owner";
  const initStr = ownerName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const path = typeof window !== "undefined" ? window.location.pathname : "";

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

          <main style={{ padding: "28px 28px 48px" }}>
            <div style={{ marginBottom: 26 }}>
              <h1 style={{ fontSize: 26, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", fontWeight: 700 }}>Monthly Statements</h1>
              <p style={{ fontSize: 13, color: "#9E8E6A", marginTop: 4 }}>All statements for your villa</p>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", overflow: "hidden" }}>
              {loading ? (
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>{[...Array(4)].map((_, i) => <Skel key={i} />)}</div>
              ) : statements.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center", color: "#C4B89A" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                  <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "Playfair Display,Georgia,serif", marginBottom: 4 }}>No statements yet</div>
                  <div style={{ fontSize: 13 }}>Statements will appear here once generated by your manager.</div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>
                      {["Period", "Gross Revenue", "Deductions", "Net Payout", "Status", ""].map(h => (
                        <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "#9E8E6A", letterSpacing: ".07em", textTransform: "uppercase", borderBottom: "1px solid #EDE6D6", background: "#FDFAF5", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {statements.map((s, i) => {
                        const totalDeduct = (s.management_fee ?? 0) + (s.petty_cash_deductions ?? 0) + (s.maintenance_deductions ?? 0);
                        return (
                          <tr key={s.id} style={{ background: i % 2 === 0 ? "#fff" : "#FDFAF5" }}>
                            <td style={{ padding: "13px 20px", fontSize: 13.5, fontWeight: 700, color: "#2C2C2C", fontFamily: "Playfair Display,Georgia,serif", whiteSpace: "nowrap" }}>
                              {s.month ? MONTHS[s.month - 1] : "—"} {s.year}
                            </td>
                            <td style={{ padding: "13px 20px", fontSize: 13, fontWeight: 600, color: "#1E7A48" }}>{fmtMoney(s.gross_revenue, currency)}</td>
                            <td style={{ padding: "13px 20px", fontSize: 13, fontWeight: 600, color: "#9B2C2C" }}>−{fmtMoney(totalDeduct, currency)}</td>
                            <td style={{ padding: "13px 20px", fontSize: 14, fontWeight: 700, color: "#C9A84C", fontFamily: "Playfair Display,Georgia,serif" }}>{fmtMoney(s.net_payout, currency)}</td>
                            <td style={{ padding: "13px 20px" }}><StatBadge s={s.status} /></td>
                            <td style={{ padding: "13px 20px" }}>
                              <button onClick={() => setViewing(s)}
                                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, border: "1.5px solid #C9A84C", background: "transparent", color: "#C9A84C", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                <Ic d={P.eye} size={13} /> View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      {viewing && <DetailModal s={viewing} cur={currency} onClose={() => setViewing(null)} />}
    </>
  );
}

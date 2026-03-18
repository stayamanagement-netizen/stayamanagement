"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/* ─── types ──────────────────────────────────────────────────────────────────── */
interface Profile { id: string; full_name: string | null; role: string; }
interface Villa { id: string; name: string | null; location: string | null; country: string | null; currency: string | null; }
interface Booking { id: string; check_in: string | null; check_out: string | null; status: string | null; total_amount: number | null; ota_channel: string | null; guest_name: string | null; }
interface MonthBar { label: string; amount: number; }
interface PettyRow { category: string; total: number; }
interface MaintIssue { id: string; title: string | null; category: string | null; priority: string | null; status: string | null; }

/* ─── helpers ────────────────────────────────────────────────────────────────── */
function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}
function Skel({ w = "100%", h = 14 }: { w?: string | number; h?: number }) {
  return <div style={{ width: w, height: h, borderRadius: 6, background: "linear-gradient(90deg,#EDE6D6 25%,#F5EFE3 50%,#EDE6D6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />;
}
function fmtDate(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }
function fmtMoney(n: number, cur = "USD") { if (cur === "IDR") return `Rp ${n.toLocaleString("id-ID")}`; return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n); }
function getInitials(name: string | null) { if (!name) return "?"; return name.trim().split(" ").map(w => w[0] ?? "").slice(0, 2).join("").toUpperCase(); }
function nights(a: string | null, b: string | null) { if (!a || !b) return "—"; return String(Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))); }

/* ─── nav ────────────────────────────────────────────────────────────────────── */
const P = {
  home:    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  villa:   "M3 22h18 M4 22V9l8-7 8 7v13 M9 22V16h6v6 M9 10h.01 M15 10h.01",
  cal:     "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  chart:   "M18 20V10 M12 20V4 M6 20v-6",
  doc:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  wallet:  "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  wrench:  "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  gear:    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  logout:  "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
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

function SBadge({ s }: { s: string | null }) {
  const m: Record<string, [string, string, string]> = {
    confirmed:   ["#EDFAF3", "#1E7A48", "#2D8A57"], pending: ["#FFF8E6", "#7A5210", "#C9A84C"],
    cancelled:   ["#FFF0F0", "#9B2C2C", "#C53030"], checked_in: ["#EEF4FF", "#2B4BA0", "#3B63C9"],
    open:        ["#FFF8E6", "#7A5210", "#C9A84C"],  resolved: ["#EDFAF3", "#1E7A48", "#2D8A57"],
    high:        ["#FFF0F0", "#9B2C2C", "#C53030"],  medium: ["#FFF8E6", "#7A5210", "#C9A84C"],
    low:         ["#F5F0E8", "#7A6A50", "#C4B89A"],
  };
  const [bg, color, dot] = m[(s ?? "").toLowerCase()] ?? ["#F0EBE0", "#7A6A4F", "#C4B89A"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, background: bg, color, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: dot }} />
      {(s ?? "—").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
}

function Sidebar({ name, initStr, cur }: { name: string; initStr: string; cur: string }) {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  return (
    <div className="owner-sidebar">
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={P.villa} size={17} /></div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Playfair Display,Georgia,serif" }}>Staya</div>
          <div style={{ fontSize: 9.5, color: "#C9A84C", letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "Inter,sans-serif" }}>Management</div>
        </div>
      </div>
      <div style={{ padding: "14px 12px", flex: 1 }}>
        <div style={{ fontSize: 9.5, color: "rgba(201,168,76,.55)", letterSpacing: ".09em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", paddingLeft: 8, marginBottom: 6 }}>Main Menu</div>
        {NAV.map(item => {
          const active = path === item.href || (item.href && item.href !== "/dashboard/owner" && path.startsWith(item.href));
          return (
            <div key={item.label} onClick={() => item.href && (window.location.href = item.href)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, marginBottom: 2, cursor: item.href ? "pointer" : "default", background: active ? "rgba(201,168,76,.18)" : "transparent", color: active ? "#C9A84C" : item.href ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.3)", opacity: item.href ? 1 : 0.5, transition: "all .15s" }}>
              <Ic d={item.icon} size={15} /><span style={{ fontSize: 12.5, fontFamily: "Inter,sans-serif", fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initStr}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
          <div style={{ fontSize: 10, color: "rgba(201,168,76,.7)" }}>Villa Owner</div>
        </div>
        <div style={{ cursor: "pointer", color: "rgba(255,255,255,.4)" }} onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}><Ic d={P.logout} size={14} /></div>
      </div>
    </div>
  );
}

/* ─── main ───────────────────────────────────────────────────────────────────── */
export default function OwnerDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [villa, setVilla]     = useState<Villa | null>(null);
  const [villaId, setVillaId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [revenueMonth, setRevenueMonth] = useState(0);
  const [occupancy, setOccupancy]       = useState(0);
  const [upcomingCnt, setUpcomingCnt]   = useState(0);
  const [maintCnt, setMaintCnt]         = useState(0);
  const [statsLoading, setSL]           = useState(true);

  const [bars, setBars]       = useState<MonthBar[]>([]);
  const [chartLoading, setCL] = useState(true);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bkLoading, setBKL]     = useState(true);

  const [petty, setPetty]   = useState<PettyRow[]>([]);
  const [pLoading, setPL]   = useState(true);

  const [maint, setMaint]   = useState<MaintIssue[]>([]);
  const [mLoading, setML]   = useState(true);

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
        setProfile(prof); setAuthReady(true);
      } catch { window.location.href = "/"; }
    });
  }, []);

  /* fetch villa */
  const fetchVilla = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const { data: ov } = await supabase.from("villa_owners").select("villa_id").eq("owner_id", user.id).single();
      if (!ov?.villa_id) return;
      setVillaId(ov.villa_id);
      const { data: v } = await supabase.from("villas").select("id,name,location,country,currency").eq("id", ov.villa_id).single();
      if (v) setVilla(v as Villa);
    } catch {}
  }, []);

  useEffect(() => { if (authReady) fetchVilla(); }, [authReady, fetchVilla]);

  /* stats */
  useEffect(() => {
    if (!villaId) return;
    (async () => {
      setSL(true);
      try {
        const now = new Date();
        const ms  = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const me  = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59).toISOString();
        const td  = now.toISOString().slice(0, 10);
        const d30 = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
        const [{ data: pays }, { data: bks }, { data: upcoming }, { data: maints }] = await Promise.all([
          supabase.from("payments").select("amount").eq("villa_id", villaId).eq("status", "confirmed").gte("created_at", ms).lte("created_at", me),
          supabase.from("bookings").select("check_in,check_out,status").eq("villa_id", villaId).in("status", ["confirmed", "checked_in"]),
          supabase.from("bookings").select("id").eq("villa_id", villaId).gte("check_in", td).lte("check_in", d30),
          supabase.from("maintenance_issues").select("id").eq("villa_id", villaId).eq("status", "open"),
        ]);
        setRevenueMonth((pays ?? []).reduce((s: number, r: { amount: number | null }) => s + (r.amount ?? 0), 0));
        setUpcomingCnt((upcoming ?? []).length); setMaintCnt((maints ?? []).length);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        let n = 0;
        for (const b of (bks ?? [])) {
          if (!b.check_in || !b.check_out) continue;
          const ci = new Date(b.check_in), co = new Date(b.check_out);
          const mS = new Date(now.getFullYear(), now.getMonth(), 1), mE = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          const s = ci < mS ? mS : ci, e = co > mE ? mE : co;
          if (e > s) n += Math.ceil((e.getTime() - s.getTime()) / 86400000);
        }
        setOccupancy(Math.min(100, Math.round((n / daysInMonth) * 100)));
      } catch {} finally { setSL(false); }
    })();
  }, [villaId]);

  /* chart */
  useEffect(() => {
    if (!villaId) return;
    (async () => {
      setCL(true);
      try {
        const now = new Date(); const result: MonthBar[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const start = d.toISOString().slice(0, 7) + "-01";
          const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
          const { data } = await supabase.from("payments").select("amount").eq("villa_id", villaId).eq("status", "confirmed").gte("created_at", start).lte("created_at", end);
          result.push({ label: d.toLocaleDateString("en-US", { month: "short" }), amount: (data ?? []).reduce((s: number, r: { amount: number | null }) => s + (r.amount ?? 0), 0) });
        }
        setBars(result);
      } catch {} finally { setCL(false); }
    })();
  }, [villaId]);

  /* bookings */
  useEffect(() => {
    if (!villaId) return;
    (async () => {
      setBKL(true);
      try {
        const td = new Date().toISOString().slice(0, 10);
        const { data } = await supabase.from("bookings").select("id,check_in,check_out,status,total_amount,ota_channel,guest_name").eq("villa_id", villaId).gte("check_in", td).order("check_in", { ascending: true }).limit(5);
        setBookings((data ?? []) as Booking[]);
      } catch {} finally { setBKL(false); }
    })();
  }, [villaId]);

  /* petty */
  useEffect(() => {
    if (!villaId) return;
    (async () => {
      setPL(true);
      try {
        const now = new Date();
        const ms = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const me = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59).toISOString();
        const { data } = await supabase.from("petty_cash").select("category,amount").eq("villa_id", villaId).gte("created_at", ms).lte("created_at", me);
        const g: Record<string, number> = {};
        for (const r of (data ?? [])) { const c = r.category ?? "Other"; g[c] = (g[c] ?? 0) + (r.amount ?? 0); }
        setPetty(Object.entries(g).map(([category, total]) => ({ category, total })));
      } catch {} finally { setPL(false); }
    })();
  }, [villaId]);

  /* maintenance */
  useEffect(() => {
    if (!villaId) return;
    (async () => {
      setML(true);
      try {
        const { data } = await supabase.from("maintenance_issues").select("id,title,category,priority,status").eq("villa_id", villaId).eq("status", "open").order("created_at", { ascending: false }).limit(6);
        setMaint((data ?? []) as MaintIssue[]);
      } catch {} finally { setML(false); }
    })();
  }, [villaId]);

  const cur = villa?.currency ?? "USD";
  const ownerName = profile?.full_name ?? "Owner";
  const initStr = getInitials(ownerName);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const maxBar = Math.max(...bars.map(b => b.amount), 1);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{background:#F5F0E8;font-family:Inter,sans-serif}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#DDD5C0;border-radius:10px}.owner-sidebar{width:220px;background:#2C1E0F;display:flex;flex-direction:column;min-height:100vh;position:fixed;top:0;left:0;z-index:100}.owner-content{margin-left:220px;flex:1}@media(max-width:900px){.owner-sidebar{width:180px}.owner-content{margin-left:180px}}@media(max-width:640px){.owner-sidebar{display:none}.owner-content{margin-left:0}}`}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar name={ownerName} initStr={initStr} cur={cur} />
        <div className="owner-content">
          {/* topbar */}
          <div style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 28px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
            <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C2C2C" }}>Staya Management</div>
            <div style={{ fontSize: 12.5, color: "#9E8E6A", fontStyle: "italic" }}>{today}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{initStr}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C" }}>{ownerName}</span>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "transparent", color: "#7A6A50", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                <Ic d={P.logout} size={13} /> Logout
              </button>
            </div>
          </div>

          <main style={{ padding: "28px 28px 48px" }}>
            {/* welcome */}
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", fontWeight: 700 }}>Welcome back, {ownerName.split(" ")[0]} 👋</h1>
              {villa && <p style={{ fontSize: 13, color: "#9E8E6A", marginTop: 4 }}>{villa.name}{villa.location ? ` · ${villa.location}` : ""}{villa.country ? `, ${villa.country}` : ""}</p>}
              {!villa && authReady && <p style={{ fontSize: 13, color: "#C4B89A", marginTop: 4 }}>No villa linked to your account yet.</p>}
            </div>

            {/* stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16, marginBottom: 26 }}>
              {[
                { label: "Revenue This Month", val: statsLoading ? null : fmtMoney(revenueMonth, cur), icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", ic: "#1E7A48", bg: "#EDFAF3", bd: "#B0E8CB" },
                { label: "Occupancy Rate",    val: statsLoading ? null : `${occupancy}%`,              icon: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z", ic: "#C9A84C", bg: "#FFF8E6", bd: "#F5D875" },
                { label: "Upcoming (30d)",    val: statsLoading ? null : String(upcomingCnt),          icon: P.cal,    ic: "#2B4BA0", bg: "#EEF4FF", bd: "#C0D2F8" },
                { label: "Open Maintenance",  val: statsLoading ? null : String(maintCnt),             icon: P.wrench, ic: "#9B2C2C", bg: "#FFF0F0", bd: "#FFCDD2" },
              ].map(c => (
                <div key={c.label} style={{ background: "#fff", borderRadius: 14, padding: "20px 20px 16px", border: "1px solid #EDE6D6", boxShadow: "0 2px 8px rgba(44,30,10,.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <span style={{ fontSize: 11.5, color: "#9E8E6A", fontWeight: 500 }}>{c.label}</span>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: c.bg, border: `1px solid ${c.bd}`, display: "flex", alignItems: "center", justifyContent: "center", color: c.ic }}><Ic d={c.icon} size={15} /></div>
                  </div>
                  {c.val == null ? <Skel w={80} h={28} /> : <div style={{ fontSize: 24, fontWeight: 700, color: "#2C2C2C", fontFamily: "Playfair Display,Georgia,serif" }}>{c.val}</div>}
                </div>
              ))}
            </div>

            {/* bar chart */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", padding: "20px 24px 24px", marginBottom: 24 }}>
              <h2 style={{ fontSize: 15.5, fontWeight: 700, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", marginBottom: 3 }}>Revenue — Last 6 Months</h2>
              <p style={{ fontSize: 11.5, color: "#9E8E6A", marginBottom: 18 }}>Confirmed payments for your villa</p>
              {chartLoading ? (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 120 }}>{[...Array(6)].map((_, i) => <Skel key={i} w={`${100 / 6}%`} h={40 + i * 12} />)}</div>
              ) : (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 140 }}>
                  {bars.map(b => {
                    const pct = (b.amount / maxBar) * 100;
                    return (
                      <div key={b.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#C9A84C", textAlign: "center" }}>{b.amount > 0 ? fmtMoney(b.amount, cur) : ""}</span>
                        <div style={{ width: "100%", height: `${Math.max(pct * 1.15, b.amount > 0 ? 6 : 2)}%`, background: "linear-gradient(to top,#C9A84C,#E8C97A)", borderRadius: "5px 5px 0 0", opacity: b.amount > 0 ? 1 : 0.25, minHeight: 3 }} />
                        <span style={{ fontSize: 11, color: "#9E8E6A" }}>{b.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* upcoming bookings */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", overflow: "hidden", marginBottom: 24 }}>
              <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #EDE6D6" }}>
                <h2 style={{ fontSize: 15.5, fontWeight: 700, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C" }}>Upcoming Bookings</h2>
                <p style={{ fontSize: 11.5, color: "#9E8E6A", marginTop: 2 }}>Next 5 reservations · Guest names are private</p>
              </div>
              {bkLoading ? (
                <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 10 }}>{[...Array(3)].map((_, i) => <Skel key={i} />)}</div>
              ) : bookings.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#C4B89A", fontSize: 13 }}>No upcoming bookings.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>{["Guest", "Check-In", "Check-Out", "Nights", "Amount", "OTA", "Status"].map(h => (
                      <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "#9E8E6A", letterSpacing: ".07em", textTransform: "uppercase", borderBottom: "1px solid #EDE6D6", background: "#FDFAF5", whiteSpace: "nowrap" }}>{h}</th>
                    ))}</tr></thead>
                    <tbody>{bookings.map((b, i) => (
                      <tr key={b.id} style={{ background: i % 2 === 0 ? "#fff" : "#FDFAF5" }}>
                        <td style={{ padding: "11px 18px" }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#F5F0E8", border: "1.5px solid #EDE6D6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, color: "#7A6A50" }}>{getInitials(b.guest_name)}</div>
                        </td>
                        <td style={{ padding: "11px 18px", fontSize: 12.5, color: "#2C2C2C" }}>{fmtDate(b.check_in)}</td>
                        <td style={{ padding: "11px 18px", fontSize: 12.5, color: "#2C2C2C" }}>{fmtDate(b.check_out)}</td>
                        <td style={{ padding: "11px 18px", fontSize: 12.5, fontWeight: 600, color: "#2C2C2C" }}>{nights(b.check_in, b.check_out)}</td>
                        <td style={{ padding: "11px 18px", fontSize: 12.5, fontWeight: 700, color: "#C9A84C" }}>{b.total_amount != null ? fmtMoney(b.total_amount, cur) : "—"}</td>
                        <td style={{ padding: "11px 18px", fontSize: 12, color: "#7A6A50" }}>{b.ota_channel ?? "Direct"}</td>
                        <td style={{ padding: "11px 18px" }}><SBadge s={b.status} /></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>

            {/* petty + maintenance */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* petty cash */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", overflow: "hidden" }}>
                <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #EDE6D6" }}>
                  <h2 style={{ fontSize: 15.5, fontWeight: 700, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C" }}>Petty Cash This Month</h2>
                  <p style={{ fontSize: 11.5, color: "#9E8E6A", marginTop: 2 }}>Totals by category — no individual amounts</p>
                </div>
                {pLoading ? <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>{[...Array(3)].map((_, i) => <Skel key={i} />)}</div>
                  : petty.length === 0 ? <div style={{ padding: 32, textAlign: "center", color: "#C4B89A", fontSize: 13 }}>No petty cash this month.</div>
                  : (
                    <div style={{ padding: "8px 20px 4px" }}>
                      {petty.map((r, i) => (
                        <div key={r.category} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < petty.length - 1 ? "1px solid #F5F0E8" : "none" }}>
                          <span style={{ fontSize: 13, color: "#4A3B27" }}>{r.category}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#9B2C2C" }}>−{fmtMoney(r.total, cur)}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 8px", borderTop: "1.5px solid #EDE6D6", marginTop: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C" }}>Total</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#9B2C2C" }}>−{fmtMoney(petty.reduce((s, r) => s + r.total, 0), cur)}</span>
                      </div>
                    </div>
                  )}
              </div>

              {/* maintenance */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", overflow: "hidden" }}>
                <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #EDE6D6" }}>
                  <h2 style={{ fontSize: 15.5, fontWeight: 700, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C" }}>Open Maintenance</h2>
                  <p style={{ fontSize: 11.5, color: "#9E8E6A", marginTop: 2 }}>Status only — no cost details</p>
                </div>
                {mLoading ? <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>{[...Array(3)].map((_, i) => <Skel key={i} />)}</div>
                  : maint.length === 0 ? <div style={{ padding: 32, textAlign: "center", color: "#C4B89A", fontSize: 13 }}>No open issues 🎉</div>
                  : (
                    <div style={{ padding: "4px 0" }}>
                      {maint.map(m => (
                        <div key={m.id} style={{ padding: "10px 20px", borderBottom: "1px solid #F5F0E8", display: "flex", flexDirection: "column", gap: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C" }}>{m.title ?? "—"}</span>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {m.category && <span style={{ fontSize: 10.5, color: "#9E8E6A", background: "#F5F0E8", padding: "2px 8px", borderRadius: 10 }}>{m.category}</span>}
                            <SBadge s={m.priority} /><SBadge s={m.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

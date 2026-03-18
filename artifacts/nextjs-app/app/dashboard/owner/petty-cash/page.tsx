"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";

interface Profile { id: string; full_name: string | null; role: string; }
interface PettyRow {
  id: string; category: string | null; description: string | null;
  amount: number | null; currency: string | null; date: string | null;
  status: string | null; created_at: string | null; submitted_by: string | null;
  submitter_name?: string | null;
}

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}
function Skel({ h = 14 }: { h?: number }) {
  return <div style={{ height: h, borderRadius: 6, background: "linear-gradient(90deg,#EDE6D6 25%,#F5EFE3 50%,#EDE6D6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />;
}
function ini(n: string | null) { if (!n) return "?"; return n.trim().split(" ").map(w => w[0] ?? "").slice(0, 2).join("").toUpperCase(); }
function fmtD(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
function fmtAmt(n: number | null, cur = "USD") {
  if (n == null) return "—";
  if (cur === "IDR") return `Rp ${n.toLocaleString("id-ID")}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
}
function getISOWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const thu = new Date(d); thu.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yStart = new Date(thu.getFullYear(), 0, 1);
  const week = Math.ceil(((thu.getTime() - yStart.getTime()) / 86400000 + 1) / 7);
  return `${thu.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
function weekLabel(yw: string): string {
  const [y, w] = yw.split("-W");
  const jan1 = new Date(Number(y), 0, 1);
  const daysToMon = (8 - jan1.getDay()) % 7 || 7;
  const mon = new Date(jan1); mon.setDate(jan1.getDate() + daysToMon + (Number(w) - 2) * 7);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(mon)} – ${fmt(sun)}, ${y}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Cleaning supplies": "#1A6B96", "Maintenance & repairs": "#9B2C2C",
  "Garden & pool": "#1E7A48", "Guest supplies": "#5A3EA0",
  "Groceries": "#7A5210", "Utilities": "#2B4BA0", "Other": "#7A6A50",
};

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
  user:   "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  down:   "M19 9l-7 7-7-7",
  up:     "M5 15l7-7 7 7",
  print:  "M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z",
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
const YEARS_BACK = 2;

export default function OwnerPettyCashPage() {
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [villaId, setVillaId]     = useState<string | null>(null);
  const [villaName, setVillaName] = useState<string | null>(null);
  const [currency, setCurrency]   = useState("USD");
  const [authReady, setAuthReady] = useState(false);
  const [rows, setRows]           = useState<PettyRow[]>([]);
  const [loading, setLoading]     = useState(true);

  /* filter controls */
  const now = new Date();
  const [filterMode, setFilterMode] = useState<"month" | "all">("month");
  const [selMonth, setSelMonth]     = useState(now.getMonth());
  const [selYear,  setSelYear]      = useState(now.getFullYear());
  const years = Array.from({ length: YEARS_BACK + 1 }, (_, i) => now.getFullYear() - i);

  /* tab */
  const [tab, setTab]           = useState<"weekly" | "accountant" | "category">("weekly");
  const [expandedKey, setExpKey] = useState<string | null>(null);

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
        if (prof.role !== "villa_owner")   { window.location.href = "/"; return; }
        setProfile(prof);
        const { data: ov } = await supabase.from("villa_owners").select("villa_id").eq("owner_id", user.id).single();
        if (!ov?.villa_id) { setAuthReady(true); return; }
        setVillaId(ov.villa_id);
        const { data: v } = await supabase.from("villas").select("name,currency").eq("id", ov.villa_id).single();
        if (v) { setVillaName(v.name ?? null); if (v.currency) setCurrency(v.currency); }
        setAuthReady(true);
      } catch { window.location.href = "/"; }
    });
  }, []);

  const fetchRows = useCallback(async () => {
    if (!villaId) return;
    setLoading(true);
    try {
      let query = supabase.from("petty_cash")
        .select("id,category,description,amount,currency,date,status,created_at,submitted_by")
        .eq("villa_id", villaId)
        .order("date", { ascending: false });

      if (filterMode === "month") {
        const start = `${selYear}-${String(selMonth + 1).padStart(2, "0")}-01`;
        const end   = new Date(selYear, selMonth + 1, 0).toISOString().slice(0, 10);
        query = query.gte("date", start).lte("date", end);
      } else {
        query = query.limit(500);
      }

      const { data } = await query;
      const fetched = (data ?? []) as PettyRow[];

      /* fetch submitter names */
      const ids = [...new Set(fetched.map(r => r.submitted_by).filter(Boolean))] as string[];
      let profileMap: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id,full_name").in("id", ids);
        profileMap = Object.fromEntries((profs ?? []).map(p => [p.id, p.full_name ?? "Unknown"]));
      }
      setRows(fetched.map(r => ({ ...r, submitter_name: r.submitted_by ? (profileMap[r.submitted_by] ?? "Unknown") : "Unknown" })));
    } catch {} finally { setLoading(false); }
  }, [villaId, filterMode, selMonth, selYear]);

  useEffect(() => { if (authReady && villaId) fetchRows(); }, [authReady, villaId, filterMode, selMonth, selYear, fetchRows]);

  /* ── derived data ─────────────────────────────────────────────────────────── */
  const approvedRows = useMemo(() => rows.filter(r => r.status === "approved"), [rows]);
  const pendingRows  = useMemo(() => rows.filter(r => r.status === "pending"), [rows]);
  const totalApproved = useMemo(() => approvedRows.reduce((s, r) => s + (r.amount ?? 0), 0), [approvedRows]);
  const totalPending  = useMemo(() => pendingRows.reduce((s, r) => s + (r.amount ?? 0), 0), [pendingRows]);

  /* weekly */
  const weeklyData = useMemo(() => {
    const map: Record<string, { total: number; approved: number; count: number; rows: PettyRow[] }> = {};
    rows.forEach(r => {
      if (!r.date) return;
      const wk = getISOWeek(r.date);
      if (!map[wk]) map[wk] = { total: 0, approved: 0, count: 0, rows: [] };
      map[wk].total += r.amount ?? 0;
      if (r.status === "approved") map[wk].approved += r.amount ?? 0;
      map[wk].count++;
      map[wk].rows.push(r);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [rows]);

  /* by accountant */
  const accountantData = useMemo(() => {
    const map: Record<string, { name: string; total: number; approved: number; pending: number; count: number; rows: PettyRow[] }> = {};
    rows.forEach(r => {
      const key  = r.submitted_by ?? "unknown";
      const name = r.submitter_name ?? "Unknown";
      if (!map[key]) map[key] = { name, total: 0, approved: 0, pending: 0, count: 0, rows: [] };
      map[key].total += r.amount ?? 0;
      if (r.status === "approved") map[key].approved += r.amount ?? 0;
      if (r.status === "pending")  map[key].pending  += r.amount ?? 0;
      map[key].count++; map[key].rows.push(r);
    });
    return Object.entries(map).sort(([, a], [, b]) => b.total - a.total);
  }, [rows]);

  /* by category */
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    approvedRows.forEach(r => { const c = r.category ?? "Other"; map[c] = (map[c] ?? 0) + (r.amount ?? 0); });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [approvedRows]);
  const maxCat = useMemo(() => Math.max(...categoryData.map(([, v]) => v), 1), [categoryData]);

  const ownerName = profile?.full_name ?? "Owner";
  const initStr   = ini(ownerName);
  const path      = typeof window !== "undefined" ? window.location.pathname : "";

  if (!authReady) return (
    <>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#F5F0E8}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
        <div style={{ width:32, height:32, border:"3px solid #EDE6D6", borderTop:"3px solid #C9A84C", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}body{background:#F5F0E8;font-family:Inter,sans-serif}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#DDD5C0;border-radius:10px}
        select,input{font-family:Inter,sans-serif;outline:none}
        .owner-sidebar{width:220px;background:#2C1E0F;display:flex;flex-direction:column;min-height:100vh;position:fixed;top:0;left:0;z-index:100}
        .owner-content{margin-left:220px;flex:1}
        .row-expand{cursor:pointer;transition:background .15s}.row-expand:hover{background:#FDFBF7!important}
        .tab-btn:hover{background:rgba(201,168,76,.07)!important}
        @media(max-width:640px){.owner-sidebar{display:none}.owner-content{margin-left:0}}
      `}</style>
      <div style={{ display:"flex", minHeight:"100vh" }}>

        {/* Sidebar */}
        <div className="owner-sidebar">
          <div style={{ padding:"24px 20px 16px", borderBottom:"1px solid rgba(255,255,255,.07)", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"#C9A84C", display:"flex", alignItems:"center", justifyContent:"center" }}><Ic d={P.villa} size={17} /></div>
            <div><div style={{ fontSize:13, fontWeight:700, color:"#fff", fontFamily:"Playfair Display,Georgia,serif" }}>Staya</div><div style={{ fontSize:9.5, color:"#C9A84C", letterSpacing:".1em", textTransform:"uppercase" }}>Management</div></div>
          </div>
          <div style={{ padding:"14px 12px", flex:1 }}>
            {NAV.map(item => {
              const active = path === item.href || (!!item.href && item.href !== "/dashboard/owner" && path.startsWith(item.href));
              return (
                <div key={item.label} onClick={() => item.href && (window.location.href = item.href)}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderRadius:8, marginBottom:2, cursor:item.href?"pointer":"default", background:active?"rgba(201,168,76,.18)":"transparent", color:active?"#C9A84C":item.href?"rgba(255,255,255,.72)":"rgba(255,255,255,.3)", opacity:item.href?1:0.5, transition:"all .15s" }}>
                  <Ic d={item.icon} size={15} /><span style={{ fontSize:12.5, fontWeight:active?600:400 }}>{item.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ padding:"12px 14px", borderTop:"1px solid rgba(255,255,255,.07)", display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"#C9A84C", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10.5, fontWeight:700, color:"#fff", flexShrink:0 }}>{initStr}</div>
            <div style={{ minWidth:0, flex:1 }}><div style={{ fontSize:12, fontWeight:600, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ownerName}</div><div style={{ fontSize:10, color:"rgba(201,168,76,.7)" }}>Villa Owner</div></div>
            <div style={{ cursor:"pointer", color:"rgba(255,255,255,.4)" }} onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}><Ic d={P.logout} size={14} /></div>
          </div>
        </div>

        {/* Main */}
        <div className="owner-content">
          <div style={{ background:"#fff", borderBottom:"1px solid #EDE6D6", padding:"0 24px", height:58, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
            <div style={{ fontFamily:"Playfair Display,Georgia,serif", fontSize:15, fontWeight:700, color:"#2C2C2C" }}>Petty Cash Report</div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:"50%", background:"#C9A84C", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff" }}>{initStr}</div>
              <span style={{ fontSize:13, fontWeight:600, color:"#2C2C2C" }}>{ownerName}</span>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, border:"1.5px solid #EDE6D6", background:"transparent", color:"#7A6A50", fontSize:12, cursor:"pointer" }}><Ic d={P.logout} size={13} /> Logout</button>
            </div>
          </div>

          <main style={{ padding:"28px 24px 48px", maxWidth:1000, margin:"0 auto", animation:"fadeUp .3s ease both" }}>

            {/* Header + filters */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
              <div>
                <h1 style={{ fontSize:24, fontFamily:"Playfair Display,Georgia,serif", color:"#2C2C2C", fontWeight:700 }}>Petty Cash Report</h1>
                <p style={{ fontSize:13, color:"#9E8E6A", marginTop:4 }}>{villaName ?? "Your villa"} — expense report by week, category & accountant</p>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                <select value={filterMode} onChange={e => setFilterMode(e.target.value as "month" | "all")}
                  style={{ padding:"8px 12px", borderRadius:8, border:"1.5px solid #DDD5C0", background:"#fff", fontSize:13, color:"#2C2C2C", cursor:"pointer" }}>
                  <option value="month">Filter by month</option>
                  <option value="all">All time</option>
                </select>
                {filterMode === "month" && <>
                  <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}
                    style={{ padding:"8px 12px", borderRadius:8, border:"1.5px solid #DDD5C0", background:"#fff", fontSize:13, color:"#2C2C2C", cursor:"pointer" }}>
                    {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </select>
                  <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}
                    style={{ padding:"8px 12px", borderRadius:8, border:"1.5px solid #DDD5C0", background:"#fff", fontSize:13, color:"#2C2C2C", cursor:"pointer" }}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </>}
              </div>
            </div>

            {/* KPI cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
              {[
                { label:"Approved",      val:fmtAmt(totalApproved, currency),       color:"#1E7A48", bg:"#EDFAF3", border:"#B0E8CB" },
                { label:"Pending",       val:fmtAmt(totalPending, currency),        color:"#92680A", bg:"#FFF8E6", border:"#F5D875" },
                { label:"Total entries", val:String(rows.length),                   color:"#2B4BA0", bg:"#F0F4FF", border:"#C5D0F0" },
                { label:"Accountants",   val:String(accountantData.length),         color:"#4A3B27", bg:"#F5F0E8", border:"#EDE6D6" },
              ].map(k => (
                <div key={k.label} style={{ background:k.bg, borderRadius:13, padding:"16px 18px", border:`1.5px solid ${k.border}` }}>
                  <div style={{ fontSize:10.5, color:k.color, fontWeight:600, letterSpacing:".06em", textTransform:"uppercase", marginBottom:6 }}>{k.label}</div>
                  <div style={{ fontSize:22, fontWeight:700, color:k.color, fontFamily:"Playfair Display,Georgia,serif" }}>{k.val}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display:"flex", gap:4, marginBottom:20, background:"#fff", borderRadius:12, padding:4, border:"1px solid #EDE6D6", width:"fit-content", boxShadow:"0 2px 8px rgba(44,44,44,.04)" }}>
              {([["weekly","By Week"],["accountant","By Accountant"],["category","By Category"]] as const).map(([t,label]) => (
                <button key={t} className="tab-btn" onClick={() => { setTab(t); setExpKey(null); }}
                  style={{ padding:"7px 18px", borderRadius:9, border:"none", fontSize:13, fontWeight:tab===t?700:500, cursor:"pointer", fontFamily:"Inter,sans-serif", transition:"all .18s", background:tab===t?"#2C1E0F":"transparent", color:tab===t?"#C9A84C":"#7A6A50" }}>
                  {label}
                </button>
              ))}
            </div>

            {/* ══ TAB: By Week ══════════════════════════════════════════════════ */}
            {tab === "weekly" && (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {loading ? [...Array(3)].map((_,i)=><Skel key={i} h={60}/>) :
                 weeklyData.length === 0 ? (
                  <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE6D6", padding:"48px 24px", textAlign:"center", color:"#C4B89A", fontSize:13 }}>
                    <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
                    No expenses found for this period.
                  </div>
                ) : weeklyData.map(([wk, d]) => {
                  const isOpen = expandedKey === wk;
                  return (
                    <div key={wk} style={{ background:"#fff", borderRadius:14, border:"1px solid #EDE6D6", overflow:"hidden", boxShadow:"0 2px 8px rgba(44,44,44,.05)" }}>
                      <div className="row-expand" onClick={() => setExpKey(isOpen ? null : wk)}
                        style={{ padding:"16px 22px", display:"flex", alignItems:"center", gap:16, background:isOpen?"#FDFBF7":"#fff" }}>
                        {/* Week badge */}
                        <div style={{ background:"#2C1E0F", borderRadius:10, padding:"6px 12px", flexShrink:0 }}>
                          <div style={{ fontSize:10, color:"rgba(201,168,76,.65)", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>Week</div>
                          <div style={{ fontSize:18, fontWeight:700, color:"#C9A84C", fontFamily:"Playfair Display,Georgia,serif", lineHeight:1 }}>{wk.split("-W")[1]}</div>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13.5, fontWeight:700, color:"#2C2C2C" }}>{weekLabel(wk)}</div>
                          <div style={{ display:"flex", gap:14, marginTop:5, flexWrap:"wrap" }}>
                            <span style={{ fontSize:11.5, color:"#1E7A48", fontWeight:600 }}>✓ {fmtAmt(d.approved, currency)} approved</span>
                            <span style={{ fontSize:11.5, color:"#9E8E6A" }}>{d.count} entr{d.count!==1?"ies":"y"}</span>
                            {/* accountants */}
                            <span style={{ fontSize:11.5, color:"#9E8E6A" }}>
                              by {[...new Set(d.rows.map(r=>r.submitter_name).filter(Boolean))].join(", ")}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0 }}>
                          <div style={{ fontSize:20, fontWeight:700, color:"#C9A84C", fontFamily:"Playfair Display,Georgia,serif" }}>{fmtAmt(d.total, currency)}</div>
                          <div style={{ fontSize:11, color:"#9E8E6A", marginTop:2 }}>total (all statuses)</div>
                        </div>
                        <div style={{ color:"#C4B89A", flexShrink:0 }}><Ic d={isOpen?P.up:P.down} size={16}/></div>
                      </div>

                      {isOpen && (
                        <div style={{ borderTop:"1px solid #EDE6D6" }}>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 140px 120px 110px 100px", padding:"8px 22px", background:"#FDFAF5", fontSize:10.5, fontWeight:700, color:"#9E8E6A", letterSpacing:".06em", textTransform:"uppercase" }}>
                            <span>Category / Description</span><span>Submitted by</span><span>Date</span><span style={{ textAlign:"right" }}>Amount</span><span style={{ textAlign:"center" }}>Status</span>
                          </div>
                          {d.rows.map((r, i) => {
                            const sc = ({ pending:["#FFF8E6","#92680A"], approved:["#EDFAF3","#1E7A48"], rejected:["#FFF0F0","#C62828"] } as Record<string,[string,string]>)[r.status??""] ?? ["#F0EBE0","#7A6A50"];
                            return (
                              <div key={r.id} style={{ display:"grid", gridTemplateColumns:"1fr 140px 120px 110px 100px", padding:"11px 22px", borderTop:i>0?"1px solid #F5F0E8":"none", alignItems:"center" }}>
                                <div>
                                  <div style={{ fontSize:13, fontWeight:600, color:"#2C2C2C" }}>{r.category ?? "—"}</div>
                                  {r.description && <div style={{ fontSize:11.5, color:"#9E8E6A", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:240 }}>{r.description}</div>}
                                </div>
                                <div style={{ fontSize:12, color:"#4A3B27", fontWeight:500 }}>{r.submitter_name ?? "—"}</div>
                                <div style={{ fontSize:12, color:"#9E8E6A" }}>{fmtD(r.date)}</div>
                                <div style={{ textAlign:"right", fontSize:13, fontWeight:700, color:"#C9A84C" }}>{fmtAmt(r.amount, r.currency ?? "USD")}</div>
                                <div style={{ textAlign:"center" }}>
                                  <span style={{ background:sc[0], color:sc[1], fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:20 }}>{(r.status ?? "—").replace(/\b\w/g,c=>c.toUpperCase())}</span>
                                </div>
                              </div>
                            );
                          })}
                          <div style={{ padding:"12px 22px", borderTop:"1px solid #EDE6D6", background:"linear-gradient(135deg,#2C1E0F,#3D2B17)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ fontSize:12, color:"rgba(201,168,76,.7)" }}>Week {wk.split("-W")[1]} total (approved)</span>
                            <span style={{ fontSize:18, fontWeight:700, color:"#C9A84C", fontFamily:"Playfair Display,Georgia,serif" }}>{fmtAmt(d.approved, currency)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══ TAB: By Accountant ════════════════════════════════════════════ */}
            {tab === "accountant" && (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {loading ? [...Array(2)].map((_,i)=><Skel key={i} h={80}/>) :
                 accountantData.length === 0 ? (
                  <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE6D6", padding:"48px 24px", textAlign:"center", color:"#C4B89A", fontSize:13 }}>No data for this period.</div>
                ) : accountantData.map(([uid, d]) => {
                  const isOpen = expandedKey === uid;
                  return (
                    <div key={uid} style={{ background:"#fff", borderRadius:14, border:"1px solid #EDE6D6", overflow:"hidden", boxShadow:"0 2px 8px rgba(44,44,44,.05)" }}>
                      <div className="row-expand" onClick={() => setExpKey(isOpen ? null : uid)}
                        style={{ padding:"16px 22px", display:"flex", alignItems:"center", gap:16, background:isOpen?"#FDFBF7":"#fff" }}>
                        <div style={{ width:44, height:44, borderRadius:"50%", background:"#2C1E0F", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#C9A84C", flexShrink:0 }}>{ini(d.name)}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:"#2C2C2C" }}>{d.name}</div>
                          <div style={{ fontSize:11.5, color:"#9E8E6A", marginTop:3 }}>{d.count} submission{d.count!==1?"s":""}</div>
                        </div>
                        <div style={{ display:"flex", gap:24, alignItems:"center", marginRight:8 }}>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontSize:10.5, color:"#1E7A48", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>Approved</div>
                            <div style={{ fontSize:17, fontWeight:700, color:"#1E7A48", fontFamily:"Playfair Display,Georgia,serif" }}>{fmtAmt(d.approved, currency)}</div>
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontSize:10.5, color:"#92680A", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>Pending</div>
                            <div style={{ fontSize:17, fontWeight:700, color:"#92680A", fontFamily:"Playfair Display,Georgia,serif" }}>{fmtAmt(d.pending, currency)}</div>
                          </div>
                        </div>
                        <div style={{ color:"#C4B89A", flexShrink:0 }}><Ic d={isOpen?P.up:P.down} size={16}/></div>
                      </div>

                      {isOpen && (
                        <div style={{ borderTop:"1px solid #EDE6D6" }}>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 100px 140px 110px 100px", padding:"8px 22px", background:"#FDFAF5", fontSize:10.5, fontWeight:700, color:"#9E8E6A", letterSpacing:".06em", textTransform:"uppercase" }}>
                            <span>Category</span><span>Week</span><span>Date</span><span style={{ textAlign:"right" }}>Amount</span><span style={{ textAlign:"center" }}>Status</span>
                          </div>
                          {d.rows.map((r, i) => {
                            const sc = ({ pending:["#FFF8E6","#92680A"], approved:["#EDFAF3","#1E7A48"], rejected:["#FFF0F0","#C62828"] } as Record<string,[string,string]>)[r.status??""] ?? ["#F0EBE0","#7A6A50"];
                            return (
                              <div key={r.id} style={{ display:"grid", gridTemplateColumns:"1fr 100px 140px 110px 100px", padding:"11px 22px", borderTop:i>0?"1px solid #F5F0E8":"none", alignItems:"center" }}>
                                <div>
                                  <div style={{ fontSize:13, fontWeight:600, color:"#2C2C2C" }}>{r.category ?? "—"}</div>
                                  {r.description && <div style={{ fontSize:11.5, color:"#9E8E6A", marginTop:2 }}>{r.description}</div>}
                                </div>
                                <div style={{ fontSize:12, color:"#4A3B27" }}>{r.date ? `Wk ${getISOWeek(r.date).split("-W")[1]}` : "—"}</div>
                                <div style={{ fontSize:12, color:"#9E8E6A" }}>{fmtD(r.date)}</div>
                                <div style={{ textAlign:"right", fontSize:13, fontWeight:700, color:"#C9A84C" }}>{fmtAmt(r.amount, r.currency ?? "USD")}</div>
                                <div style={{ textAlign:"center" }}>
                                  <span style={{ background:sc[0], color:sc[1], fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:20 }}>{(r.status ?? "—").replace(/\b\w/g,c=>c.toUpperCase())}</span>
                                </div>
                              </div>
                            );
                          })}
                          <div style={{ padding:"12px 22px", borderTop:"1px solid #EDE6D6", background:"#FDFBF7", display:"flex", justifyContent:"space-between" }}>
                            <span style={{ fontSize:12, color:"#9E8E6A" }}>Total approved by {d.name}</span>
                            <span style={{ fontSize:16, fontWeight:700, color:"#1E7A48", fontFamily:"Playfair Display,Georgia,serif" }}>{fmtAmt(d.approved, currency)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══ TAB: By Category ══════════════════════════════════════════════ */}
            {tab === "category" && (
              <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE6D6", boxShadow:"0 2px 10px rgba(44,44,44,.05)", padding:"24px 28px" }}>
                <h2 style={{ fontSize:15, fontWeight:700, fontFamily:"Playfair Display,Georgia,serif", color:"#2C2C2C", marginBottom:4 }}>Spending by Category</h2>
                <p style={{ fontSize:11.5, color:"#9E8E6A", marginBottom:22 }}>Approved expenses only — {filterMode==="month" ? `${MONTHS[selMonth]} ${selYear}` : "all time"}</p>
                {loading ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>{[...Array(5)].map((_,i)=><Skel key={i} h={36}/>)}</div>
                ) : categoryData.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"40px 0", color:"#C4B89A", fontSize:13 }}>
                    <div style={{ fontSize:36, marginBottom:12 }}>💳</div>
                    No approved expenses for this period.
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    {categoryData.map(([cat, amt]) => {
                      const pct = (amt / maxCat) * 100;
                      const col = CATEGORY_COLORS[cat] ?? "#7A6A50";
                      const sharePct = totalApproved > 0 ? Math.round((amt / totalApproved) * 100) : 0;
                      return (
                        <div key={cat}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7, alignItems:"center" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <span style={{ width:10, height:10, borderRadius:"50%", background:col, flexShrink:0 }} />
                              <span style={{ fontSize:13.5, fontWeight:600, color:"#2C2C2C" }}>{cat}</span>
                              <span style={{ fontSize:11, color:"#C4B89A", background:"#F5F0E8", padding:"1px 7px", borderRadius:12 }}>{sharePct}%</span>
                            </div>
                            <span style={{ fontSize:14, fontWeight:700, color:col }}>{fmtAmt(amt, currency)}</span>
                          </div>
                          <div style={{ height:9, borderRadius:5, background:"#F0EBE0", overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${pct}%`, background:col, borderRadius:5, transition:"width .5s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ marginTop:8, paddingTop:16, borderTop:"2px solid #EDE6D6", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:14, fontWeight:700, color:"#2C2C2C" }}>Total Approved</span>
                      <span style={{ fontSize:22, fontWeight:700, color:"#1E7A48", fontFamily:"Playfair Display,Georgia,serif" }}>{fmtAmt(totalApproved, currency)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <p style={{ fontSize:11.5, color:"#C4B89A", marginTop:18, textAlign:"center" }}>
              🔒 Read-only view. Expense submissions are managed by your villa manager.
            </p>
          </main>
        </div>
      </div>
    </>
  );
}

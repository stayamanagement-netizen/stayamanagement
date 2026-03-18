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

const CATEGORIES = ["Cleaning supplies","Maintenance & repairs","Garden & pool","Guest supplies","Groceries","Utilities","Other"];
const CURRENCIES  = ["USD","EUR","GBP","IDR","AUD","SGD"];

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}
function Skel({ w = "100%", h = 14 }: { w?: string | number; h?: number }) {
  return <div style={{ width: w, height: h, borderRadius: 6, background: "linear-gradient(90deg,#EDE6D6 25%,#F5EFE3 50%,#EDE6D6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />;
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

const P = {
  home:   "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  villa:  "M3 22h18 M4 22V9l8-7 8 7v13 M9 22V16h6v6 M9 10h.01 M15 10h.01",
  cal:    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  chat:   "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  wallet: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  wrench: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  star:   "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  gear:   "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  plus:   "M12 5v14 M5 12h14",
  x:      "M18 6L6 18 M6 6l12 12",
  img:    "M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  chart:  "M18 20V10 M12 20V4 M6 20v-6",
  user:   "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  filter: "M3 4h18M7 8h10M11 12h2",
  down:   "M19 9l-7 7-7-7",
  up:     "M5 15l7-7 7 7",
};
const P_ALERT = "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z";
const NAV = [
  { label: "Dashboard",      icon: P.home,   href: "/dashboard/manager" },
  { label: "My Villa",       icon: P.villa,  href: "/dashboard/manager/villa" },
  { label: "Bookings",       icon: P.cal,    href: "/dashboard/manager/bookings" },
  { label: "Guest Messages", icon: P.chat,   href: "/dashboard/manager/messages" },
  { label: "Petty Cash",     icon: P.wallet, href: "/dashboard/manager/petty-cash" },
  { label: "Maintenance",    icon: P.wrench, href: "/dashboard/manager/maintenance" },
  { label: "Services",       icon: P.star,   href: "/dashboard/manager/services" },
  { label: "Emergencies",    icon: P_ALERT,  href: "/dashboard/manager/emergencies" },
  { label: "Settings",       icon: P.gear,   href: "/dashboard/manager/settings" },
];

const STATUS_CFG: Record<string, [string, string, string]> = {
  pending:  ["#FFF8E6", "#7A5210", "#C9A84C"],
  approved: ["#EDFAF3", "#1E7A48", "#2D8A57"],
  rejected: ["#FFF0F0", "#9B2C2C", "#C53030"],
};
function StatusBadge({ s }: { s: string | null }) {
  const [bg, color, dot] = STATUS_CFG[(s ?? "").toLowerCase()] ?? ["#F0EBE0","#7A6A4F","#C4B89A"];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:20, background:bg, color, fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:dot }} />
      {(s ?? "—").replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
}

const inpStyle: React.CSSProperties = { width:"100%", padding:"9px 12px", borderRadius:9, border:"1.5px solid #EDE6D6", background:"#FDFAF5", fontSize:13, color:"#2C2C2C", outline:"none", fontFamily:"Inter,sans-serif" };
const selStyle: React.CSSProperties = { ...inpStyle, appearance:"none" };

export default function PettyCashPage() {
  const [profile, setProfile]       = useState<Profile | null>(null);
  const [villaId, setVillaId]       = useState<string | null>(null);
  const [userId, setUserId]         = useState<string | null>(null);
  const [authReady, setAuthReady]   = useState(false);

  /* my submissions */
  const [myRows, setMyRows]         = useState<PettyRow[]>([]);
  /* all villa rows (for report) */
  const [allRows, setAllRows]       = useState<PettyRow[]>([]);
  const [loading, setLoading]       = useState(true);

  const [tab, setTab]               = useState<"submit" | "weekly" | "accountant">("submit");
  const [showModal, setShowModal]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg]     = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  const [form, setForm] = useState({ category:"", description:"", amount:"", currency:"USD", date:new Date().toISOString().slice(0,10), receipt_url:"" });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      try {
        const { data: profData } = await supabase.from("profiles").select("id,full_name,role").eq("id", user.id).single();
        const prof: Profile | null = profData ?? null;
        if (!prof) { window.location.href = "/"; return; }
        if (prof.role === "super_admin") { window.location.href = "/dashboard/admin"; return; }
        if (prof.role === "villa_owner") { window.location.href = "/dashboard/owner"; return; }
        if (prof.role !== "villa_manager") { window.location.href = "/"; return; }
        setProfile(prof); setUserId(user.id); setAuthReady(true);
      } catch { window.location.href = "/"; }
    });
  }, []);

  const fetchVilla = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: vm } = await supabase.from("villa_managers").select("villa_id").eq("manager_id", user.id).single();
    if (vm?.villa_id) setVillaId(vm.villa_id);
  }, []);

  useEffect(() => { if (authReady) fetchVilla(); }, [authReady, fetchVilla]);

  const fetchRows = useCallback(async () => {
    if (!villaId || !userId) return;
    setLoading(true);
    try {
      /* My submissions */
      const { data: mine } = await supabase.from("petty_cash")
        .select("id,category,description,amount,currency,date,status,created_at,submitted_by")
        .eq("villa_id", villaId).eq("submitted_by", userId)
        .order("created_at", { ascending: false }).limit(100);
      setMyRows((mine ?? []) as PettyRow[]);

      /* All villa submissions + submitter names */
      const { data: all } = await supabase.from("petty_cash")
        .select("id,category,description,amount,currency,date,status,created_at,submitted_by")
        .eq("villa_id", villaId)
        .order("date", { ascending: false }).limit(200);
      const rows = (all ?? []) as PettyRow[];

      /* Fetch submitter names */
      const ids = [...new Set(rows.map(r => r.submitted_by).filter(Boolean))] as string[];
      let profileMap: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id,full_name").in("id", ids);
        profileMap = Object.fromEntries((profs ?? []).map(p => [p.id, p.full_name ?? "Unknown"]));
      }
      setAllRows(rows.map(r => ({ ...r, submitter_name: r.submitted_by ? (profileMap[r.submitted_by] ?? "Unknown") : "Unknown" })));
    } catch {} finally { setLoading(false); }
  }, [villaId, userId]);

  useEffect(() => { if (villaId && userId) fetchRows(); }, [villaId, userId, fetchRows]);

  /* ── weekly grouping (use 'date' field not created_at) ───────────────────── */
  const weeklyData = useMemo(() => {
    const map: Record<string, { total: number; count: number; rows: PettyRow[] }> = {};
    allRows.forEach(r => {
      if (!r.date) return;
      const wk = getISOWeek(r.date);
      if (!map[wk]) map[wk] = { total: 0, count: 0, rows: [] };
      if (r.status !== "rejected") map[wk].total += r.amount ?? 0;
      map[wk].count++;
      map[wk].rows.push(r);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [allRows]);

  /* ── by accountant grouping ────────────────────────────────────────────────── */
  const accountantData = useMemo(() => {
    const map: Record<string, { name: string; total: number; approved: number; pending: number; count: number; rows: PettyRow[] }> = {};
    allRows.forEach(r => {
      const key = r.submitted_by ?? "unknown";
      const name = r.submitter_name ?? "Unknown";
      if (!map[key]) map[key] = { name, total: 0, approved: 0, pending: 0, count: 0, rows: [] };
      if (r.status !== "rejected") map[key].total += r.amount ?? 0;
      if (r.status === "approved") map[key].approved += r.amount ?? 0;
      if (r.status === "pending")  map[key].pending  += r.amount ?? 0;
      map[key].count++; map[key].rows.push(r);
    });
    return Object.entries(map).sort(([, a], [, b]) => b.total - a.total);
  }, [allRows]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setReceiptName(`Uploading ${file.name}…`);
    setErrorMsg("");
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/upload-receipt", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      set("receipt_url", json.url);
      setReceiptName(file.name);
    } catch (err) {
      setReceiptName("");
      setErrorMsg("Receipt upload failed: " + (err instanceof Error ? err.message : "unknown error"));
    }
  };

  const handleSubmit = async () => {
    if (!form.category || !form.amount || !villaId || !userId) { setErrorMsg("Please fill in Category and Amount."); return; }
    setSubmitting(true); setErrorMsg("");
    try {
      const { error } = await supabase.from("petty_cash").insert({
        villa_id: villaId, submitted_by: userId, category: form.category,
        description: form.description || null, amount: parseFloat(form.amount),
        currency: form.currency, date: form.date, receipt_url: form.receipt_url || null, status: "pending",
      });
      if (error) throw error;
      setShowModal(false);
      setForm({ category:"", description:"", amount:"", currency:"USD", date:new Date().toISOString().slice(0,10), receipt_url:"" });
      setReceiptName("");
      setSuccessMsg("Expense submitted!"); setTimeout(() => setSuccessMsg(""), 4000);
      fetchRows();
    } catch { setErrorMsg("Failed to submit. Please try again."); } finally { setSubmitting(false); }
  };

  const mgr = profile?.full_name ?? "Manager";
  const todayStr = new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  const defaultCur = myRows[0]?.currency ?? "USD";

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
        input:focus,select:focus,textarea:focus{border-color:#C9A84C!important;box-shadow:0 0 0 3px rgba(201,168,76,.12)}
        .mgr-sidebar{width:220px;background:#2C1E0F;display:flex;flex-direction:column;min-height:100vh;position:fixed;top:0;left:0;z-index:100}
        .mgr-content{margin-left:220px;flex:1}
        .week-row{cursor:pointer;transition:background .15s}.week-row:hover{background:#FDFBF7!important}
        .tab-btn:hover{background:rgba(201,168,76,.07)!important}
        @media(max-width:640px){.mgr-sidebar{display:none}.mgr-content{margin-left:0}}
      `}</style>
      <div style={{ display:"flex", minHeight:"100vh" }}>

        {/* Sidebar */}
        <div className="mgr-sidebar">
          <div style={{ padding:"24px 20px 16px", borderBottom:"1px solid rgba(255,255,255,.07)", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"#C9A84C", display:"flex", alignItems:"center", justifyContent:"center" }}><Ic d={P.villa} size={17} /></div>
            <div><div style={{ fontSize:13, fontWeight:700, color:"#fff", fontFamily:"Playfair Display,Georgia,serif" }}>Staya</div><div style={{ fontSize:9.5, color:"#C9A84C", letterSpacing:".1em", textTransform:"uppercase" }}>Management</div></div>
          </div>
          <div style={{ padding:"14px 12px", flex:1 }}>
            <div style={{ fontSize:9.5, color:"rgba(201,168,76,.55)", letterSpacing:".09em", textTransform:"uppercase", paddingLeft:8, marginBottom:6 }}>Main Menu</div>
            {NAV.map(item => {
              const active = typeof window !== "undefined" && (window.location.pathname === item.href || (!!item.href && item.href !== "/dashboard/manager" && window.location.pathname.startsWith(item.href)));
              return (
                <div key={item.label} onClick={() => item.href && (window.location.href = item.href)}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderRadius:8, marginBottom:2, cursor:item.href ? "pointer" : "default", background:active ? "rgba(201,168,76,.18)" : "transparent", color:active ? "#C9A84C" : item.href ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.3)", opacity:item.href ? 1 : 0.5, transition:"all .15s" }}>
                  <Ic d={item.icon} size={15} /><span style={{ fontSize:12.5, fontWeight:active ? 600 : 400 }}>{item.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ padding:"12px 14px", borderTop:"1px solid rgba(255,255,255,.07)", display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"#C9A84C", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10.5, fontWeight:700, color:"#fff", flexShrink:0 }}>{ini(mgr)}</div>
            <div style={{ minWidth:0, flex:1 }}><div style={{ fontSize:12, fontWeight:600, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{mgr}</div><div style={{ fontSize:10, color:"rgba(201,168,76,.7)" }}>Villa Manager</div></div>
            <div style={{ cursor:"pointer", color:"rgba(255,255,255,.4)" }} onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}><Ic d={P.logout} size={14} /></div>
          </div>
        </div>

        {/* Main */}
        <div className="mgr-content">
          <div style={{ background:"#fff", borderBottom:"1px solid #EDE6D6", padding:"0 28px", height:58, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
            <div style={{ fontFamily:"Playfair Display,Georgia,serif", fontSize:15, fontWeight:700, color:"#2C2C2C" }}>Petty Cash</div>
            <div style={{ fontSize:12.5, color:"#9E8E6A", fontStyle:"italic" }}>{todayStr}</div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:"50%", background:"#C9A84C", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff" }}>{ini(mgr)}</div>
              <span style={{ fontSize:13, fontWeight:600, color:"#2C2C2C" }}>{mgr}</span>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, border:"1.5px solid #EDE6D6", background:"transparent", color:"#7A6A50", fontSize:12, fontWeight:500, cursor:"pointer" }}>
                <Ic d={P.logout} size={13} /> Logout
              </button>
            </div>
          </div>

          <main style={{ padding:"28px 28px 48px", maxWidth:960, animation:"fadeUp .3s ease both" }}>

            {/* Page header */}
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
              <div>
                <h1 style={{ fontSize:24, fontFamily:"Playfair Display,Georgia,serif", color:"#2C2C2C", fontWeight:700 }}>Petty Cash</h1>
                <p style={{ fontSize:13, color:"#9E8E6A", marginTop:4 }}>Submit expenses and view weekly reports</p>
              </div>
              {tab === "submit" && (
                <button onClick={() => { setShowModal(true); setErrorMsg(""); }}
                  style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 20px", borderRadius:10, border:"none", background:"#C9A84C", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px rgba(201,168,76,.35)" }}>
                  <Ic d={P.plus} size={15} /> Submit Expense
                </button>
              )}
            </div>

            {successMsg && (
              <div style={{ marginBottom:18, padding:"12px 18px", borderRadius:10, background:"#EDFAF3", border:"1px solid #B0E8CB", color:"#1E7A48", fontSize:13, fontWeight:600 }}>✓ {successMsg}</div>
            )}

            {/* Tabs */}
            <div style={{ display:"flex", gap:4, marginBottom:22, background:"#fff", borderRadius:12, padding:4, border:"1px solid #EDE6D6", width:"fit-content", boxShadow:"0 2px 8px rgba(44,44,44,.04)" }}>
              {([["submit","My Expenses"],["weekly","Weekly Report"],["accountant","By Accountant"]] as const).map(([t, label]) => (
                <button key={t} className="tab-btn" onClick={() => setTab(t)}
                  style={{ padding:"7px 18px", borderRadius:9, border:"none", fontSize:13, fontWeight:tab===t?700:500, cursor:"pointer", fontFamily:"Inter,sans-serif", transition:"all .18s", background:tab===t ? "#2C1E0F" : "transparent", color:tab===t ? "#C9A84C" : "#7A6A50" }}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── TAB: My Expenses ─────────────────────────────────────────────── */}
            {tab === "submit" && (
              <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE6D6", boxShadow:"0 2px 10px rgba(44,44,44,.05)", overflow:"hidden" }}>
                <div style={{ padding:"16px 22px 12px", borderBottom:"1px solid #EDE6D6" }}>
                  <h2 style={{ fontSize:14.5, fontWeight:700, fontFamily:"Playfair Display,Georgia,serif", color:"#2C2C2C" }}>My Submissions</h2>
                  <p style={{ fontSize:11, color:"#9E8E6A", marginTop:1 }}>Your expense claims and their approval status</p>
                </div>
                {loading ? (
                  <div style={{ padding:"16px 22px", display:"flex", flexDirection:"column", gap:10 }}>{[...Array(4)].map((_, i) => <Skel key={i} />)}</div>
                ) : myRows.length === 0 ? (
                  <div style={{ padding:48, textAlign:"center" }}>
                    <div style={{ width:50, height:50, borderRadius:"50%", background:"#F5F0E8", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", color:"#C4B89A" }}><Ic d={P.wallet} size={22} /></div>
                    <p style={{ color:"#C4B89A", fontSize:13 }}>No expenses submitted yet.</p>
                  </div>
                ) : (
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead><tr>{["Date","Category","Description","Amount","Status"].map(h => (
                        <th key={h} style={{ padding:"9px 20px", textAlign:"left", fontSize:10.5, fontWeight:600, color:"#9E8E6A", letterSpacing:".07em", textTransform:"uppercase", borderBottom:"1px solid #EDE6D6", background:"#FDFAF5", whiteSpace:"nowrap" }}>{h}</th>
                      ))}</tr></thead>
                      <tbody>{myRows.map((r, i) => (
                        <tr key={r.id} style={{ background:i%2===0?"#fff":"#FDFAF5" }}>
                          <td style={{ padding:"11px 20px", fontSize:12.5, color:"#2C2C2C", whiteSpace:"nowrap" }}>{fmtD(r.date)}</td>
                          <td style={{ padding:"11px 20px", fontSize:12.5, color:"#2C2C2C" }}>{r.category ?? "—"}</td>
                          <td style={{ padding:"11px 20px", fontSize:12, color:"#7A6A50", maxWidth:240 }}>
                            <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.description || <span style={{ color:"#C4B89A" }}>No description</span>}</div>
                          </td>
                          <td style={{ padding:"11px 20px", fontSize:12.5, fontWeight:600, color:"#2C2C2C", whiteSpace:"nowrap" }}>{fmtAmt(r.amount, r.currency ?? "USD")}</td>
                          <td style={{ padding:"11px 20px" }}><StatusBadge s={r.status} /></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: Weekly Report ───────────────────────────────────────────── */}
            {tab === "weekly" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {/* KPI strip */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
                  {[
                    { label:"Total (approved)", val:fmtAmt(allRows.filter(r=>r.status==="approved").reduce((s,r)=>s+(r.amount??0),0), defaultCur), color:"#1E7A48" },
                    { label:"Pending review",   val:String(allRows.filter(r=>r.status==="pending").length)+" entries", color:"#92680A" },
                    { label:"Weeks with spend", val:String(weeklyData.length), color:"#2B4BA0" },
                  ].map(k => (
                    <div key={k.label} style={{ background:"#fff", borderRadius:14, border:"1px solid #EDE6D6", padding:"16px 20px", boxShadow:"0 2px 8px rgba(44,44,44,.05)" }}>
                      <div style={{ fontSize:11, color:"#9E8E6A", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", marginBottom:6 }}>{k.label}</div>
                      <div style={{ fontSize:20, fontWeight:700, color:k.color, fontFamily:"Playfair Display,Georgia,serif" }}>{k.val}</div>
                    </div>
                  ))}
                </div>

                {/* Weekly accordion */}
                {loading ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>{[...Array(4)].map((_,i)=><Skel key={i} h={56}/>)}</div>
                ) : weeklyData.length === 0 ? (
                  <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE6D6", padding:48, textAlign:"center", color:"#C4B89A", fontSize:13 }}>No expenses recorded yet.</div>
                ) : weeklyData.map(([wk, d]) => {
                  const isOpen = expandedWeek === wk;
                  const approvedAmt = d.rows.filter(r=>r.status==="approved").reduce((s,r)=>s+(r.amount??0),0);
                  return (
                    <div key={wk} style={{ background:"#fff", borderRadius:14, border:"1px solid #EDE6D6", overflow:"hidden", boxShadow:"0 2px 8px rgba(44,44,44,.05)" }}>
                      <div className="week-row" onClick={() => setExpandedWeek(isOpen ? null : wk)}
                        style={{ padding:"16px 20px", display:"flex", alignItems:"center", gap:14, background:isOpen ? "#FDFBF7" : "#fff" }}>
                        <div style={{ width:40, height:40, borderRadius:10, background:"#2C1E0F", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#C9A84C" }}>
                          <Ic d={P.chart} size={18} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13.5, fontWeight:700, color:"#2C2C2C" }}>Week {wk.split("-W")[1]} · {wk.split("-W")[0]}</div>
                          <div style={{ fontSize:11.5, color:"#9E8E6A", marginTop:2 }}>{weekLabel(wk)}</div>
                        </div>
                        <div style={{ textAlign:"right", marginRight:8 }}>
                          <div style={{ fontSize:16, fontWeight:700, color:"#C9A84C", fontFamily:"Playfair Display,Georgia,serif" }}>{fmtAmt(approvedAmt, defaultCur)}</div>
                          <div style={{ fontSize:11, color:"#9E8E6A", marginTop:2 }}>{d.count} entr{d.count!==1?"ies":"y"}</div>
                        </div>
                        <div style={{ color:"#C4B89A" }}><Ic d={isOpen ? P.up : P.down} size={16} /></div>
                      </div>

                      {isOpen && (
                        <div style={{ borderTop:"1px solid #EDE6D6" }}>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 120px 140px 120px 100px", padding:"8px 20px", background:"#FDFAF5", fontSize:10.5, fontWeight:700, color:"#9E8E6A", letterSpacing:".06em", textTransform:"uppercase" }}>
                            <span>Category / Description</span><span>Submitted by</span><span>Date</span><span style={{ textAlign:"right" }}>Amount</span><span style={{ textAlign:"center" }}>Status</span>
                          </div>
                          {d.rows.map((r, i) => (
                            <div key={r.id} style={{ display:"grid", gridTemplateColumns:"1fr 120px 140px 120px 100px", padding:"11px 20px", borderTop:i>0?"1px solid #F5F0E8":"none", alignItems:"center" }}>
                              <div>
                                <div style={{ fontSize:13, fontWeight:600, color:"#2C2C2C" }}>{r.category ?? "—"}</div>
                                {r.description && <div style={{ fontSize:11.5, color:"#9E8E6A", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:220 }}>{r.description}</div>}
                              </div>
                              <div style={{ fontSize:12, color:"#4A3B27", fontWeight:500 }}>{r.submitter_name ?? "—"}</div>
                              <div style={{ fontSize:12, color:"#9E8E6A" }}>{fmtD(r.date)}</div>
                              <div style={{ textAlign:"right", fontSize:13, fontWeight:700, color:"#C9A84C" }}>{fmtAmt(r.amount, r.currency ?? "USD")}</div>
                              <div style={{ textAlign:"center" }}><StatusBadge s={r.status} /></div>
                            </div>
                          ))}
                          <div style={{ padding:"12px 20px", borderTop:"1px solid #EDE6D6", background:"#FDFBF7", display:"flex", justifyContent:"flex-end", alignItems:"center", gap:24 }}>
                            <span style={{ fontSize:12, color:"#9E8E6A" }}>Week total (approved)</span>
                            <span style={{ fontSize:17, fontWeight:700, color:"#1E7A48", fontFamily:"Playfair Display,Georgia,serif" }}>{fmtAmt(approvedAmt, defaultCur)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── TAB: By Accountant ───────────────────────────────────────────── */}
            {tab === "accountant" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {loading ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>{[...Array(3)].map((_,i)=><Skel key={i} h={80}/>)}</div>
                ) : accountantData.length === 0 ? (
                  <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE6D6", padding:48, textAlign:"center", color:"#C4B89A", fontSize:13 }}>No data available.</div>
                ) : accountantData.map(([uid, d]) => {
                  const isOpen = expandedWeek === uid;
                  return (
                    <div key={uid} style={{ background:"#fff", borderRadius:14, border:"1px solid #EDE6D6", overflow:"hidden", boxShadow:"0 2px 8px rgba(44,44,44,.05)" }}>
                      <div className="week-row" onClick={() => setExpandedWeek(isOpen ? null : uid)}
                        style={{ padding:"16px 20px", display:"flex", alignItems:"center", gap:14, background:isOpen ? "#FDFBF7" : "#fff" }}>
                        <div style={{ width:40, height:40, borderRadius:"50%", background:"#2C1E0F", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#C9A84C", flexShrink:0 }}>
                          {ini(d.name)}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:"#2C2C2C" }}>{d.name}</div>
                          <div style={{ fontSize:11.5, color:"#9E8E6A", marginTop:2 }}>{d.count} submission{d.count!==1?"s":""}</div>
                        </div>
                        <div style={{ display:"flex", gap:20, alignItems:"center", marginRight:8 }}>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontSize:10, color:"#1E7A48", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>Approved</div>
                            <div style={{ fontSize:15, fontWeight:700, color:"#1E7A48" }}>{fmtAmt(d.approved, defaultCur)}</div>
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontSize:10, color:"#92680A", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>Pending</div>
                            <div style={{ fontSize:15, fontWeight:700, color:"#92680A" }}>{fmtAmt(d.pending, defaultCur)}</div>
                          </div>
                        </div>
                        <div style={{ color:"#C4B89A" }}><Ic d={isOpen ? P.up : P.down} size={16} /></div>
                      </div>

                      {isOpen && (
                        <div style={{ borderTop:"1px solid #EDE6D6" }}>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 140px 120px 100px", padding:"8px 20px", background:"#FDFAF5", fontSize:10.5, fontWeight:700, color:"#9E8E6A", letterSpacing:".06em", textTransform:"uppercase" }}>
                            <span>Category / Description</span><span>Week</span><span style={{ textAlign:"right" }}>Amount</span><span style={{ textAlign:"center" }}>Status</span>
                          </div>
                          {d.rows.map((r, i) => (
                            <div key={r.id} style={{ display:"grid", gridTemplateColumns:"1fr 140px 120px 100px", padding:"11px 20px", borderTop:i>0?"1px solid #F5F0E8":"none", alignItems:"center" }}>
                              <div>
                                <div style={{ fontSize:13, fontWeight:600, color:"#2C2C2C" }}>{r.category ?? "—"}</div>
                                <div style={{ fontSize:11.5, color:"#9E8E6A", marginTop:2 }}>{fmtD(r.date)}{r.description ? ` · ${r.description}` : ""}</div>
                              </div>
                              <div style={{ fontSize:12, color:"#4A3B27" }}>{r.date ? `Wk ${getISOWeek(r.date).split("-W")[1]}` : "—"}</div>
                              <div style={{ textAlign:"right", fontSize:13, fontWeight:700, color:"#C9A84C" }}>{fmtAmt(r.amount, r.currency ?? "USD")}</div>
                              <div style={{ textAlign:"center" }}><StatusBadge s={r.status} /></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Submit modal */}
      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(44,30,10,.55)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:500, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(44,30,10,.25)" }}>
            <div style={{ padding:"22px 26px 16px", borderBottom:"1px solid #EDE6D6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <h2 style={{ fontSize:17, fontFamily:"Playfair Display,Georgia,serif", fontWeight:700, color:"#2C2C2C" }}>Submit New Expense</h2>
                <p style={{ fontSize:11.5, color:"#9E8E6A", marginTop:2 }}>This will be sent to admin for approval</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width:30, height:30, borderRadius:"50%", border:"1.5px solid #EDE6D6", background:"#F5F0E8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#7A6A50" }}><Ic d={P.x} size={14} /></button>
            </div>
            <div style={{ padding:"20px 26px 26px", display:"flex", flexDirection:"column", gap:16 }}>
              {errorMsg && <div style={{ padding:"10px 14px", borderRadius:9, background:"#FFF0F0", border:"1px solid #FFCDD2", color:"#9B2C2C", fontSize:12.5 }}>{errorMsg}</div>}
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:"#7A6A50", display:"block", marginBottom:6, letterSpacing:".04em", textTransform:"uppercase" }}>Category *</label>
                <select value={form.category} onChange={e => set("category", e.target.value)} style={selStyle}>
                  <option value="">Select a category…</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:"#7A6A50", display:"block", marginBottom:6, letterSpacing:".04em", textTransform:"uppercase" }}>Description</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} placeholder="Brief description…" style={{ ...inpStyle, resize:"vertical" }} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:10 }}>
                <div>
                  <label style={{ fontSize:11.5, fontWeight:600, color:"#7A6A50", display:"block", marginBottom:6, letterSpacing:".04em", textTransform:"uppercase" }}>Amount *</label>
                  <input type="number" min={0} step="0.01" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="0.00" style={inpStyle} />
                </div>
                <div>
                  <label style={{ fontSize:11.5, fontWeight:600, color:"#7A6A50", display:"block", marginBottom:6, letterSpacing:".04em", textTransform:"uppercase" }}>Currency</label>
                  <select value={form.currency} onChange={e => set("currency", e.target.value)} style={{ ...selStyle, width:90 }}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:"#7A6A50", display:"block", marginBottom:6, letterSpacing:".04em", textTransform:"uppercase" }}>Date</label>
                <input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inpStyle} />
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:"#7A6A50", display:"block", marginBottom:6, letterSpacing:".04em", textTransform:"uppercase" }}>Receipt Photo (optional)</label>
                <label style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:9, border:"1.5px dashed #DDD5C0", background:"#FDFAF5", cursor:"pointer" }}>
                  <Ic d={P.img} size={16} />
                  <span style={{ fontSize:12.5, color:receiptName ? "#2C2C2C" : "#9E8E6A" }}>{receiptName || "Click to upload receipt…"}</span>
                  <input type="file" accept="image/*" style={{ display:"none" }} onChange={handleFileChange} />
                </label>
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:4 }}>
                <button onClick={() => setShowModal(false)} style={{ padding:"10px 20px", borderRadius:10, border:"1.5px solid #EDE6D6", background:"transparent", color:"#7A6A50", fontSize:13, fontWeight:500, cursor:"pointer" }}>Cancel</button>
                <button onClick={handleSubmit} disabled={submitting} style={{ padding:"10px 24px", borderRadius:10, border:"none", background:submitting?"#E8C97A":"#C9A84C", color:"#fff", fontSize:13, fontWeight:700, cursor:submitting?"default":"pointer", boxShadow:"0 4px 14px rgba(201,168,76,.3)" }}>
                  {submitting ? "Submitting…" : "Submit Expense"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

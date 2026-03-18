"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Profile { id: string; full_name: string | null; role: string; }
interface MaintIssue {
  id: string; title: string | null; category: string | null; priority: string | null;
  status: string | null; description: string | null;
  reported_by: string | null; created_at: string | null; resolved_at: string | null;
}

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}
function Skel({ w = "100%", h = 14 }: { w?: string | number; h?: number }) {
  return <div style={{ width: w, height: h, borderRadius: 6, background: "linear-gradient(90deg,#EDE6D6 25%,#F5EFE3 50%,#EDE6D6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />;
}
function ini(n: string | null) { if (!n) return "?"; return n.trim().split(" ").map(w => w[0] ?? "").slice(0, 2).join("").toUpperCase(); }
function fmtDate(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
function timeAgo(d: string | null) { if (!d) return ""; const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000); if (s < 3600) return `${Math.floor(s/60)}m ago`; if (s < 86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`; }

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

const PRIORITY_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  high:   { bg: "#FFF0F0", color: "#9B2C2C", border: "#FFCDD2" },
  medium: { bg: "#FFF8E6", color: "#7A5210", border: "#F5D875" },
  low:    { bg: "#F5F0E8", color: "#7A6A50", border: "#DDD5C0" },
};
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  open:        { bg: "#FFF8E6", color: "#7A5210" },
  in_progress: { bg: "#EEF4FF", color: "#2B4BA0" },
  resolved:    { bg: "#EDFAF3", color: "#1E7A48" },
  closed:      { bg: "#F4F4F4", color: "#555"    },
};

type FilterType = "all" | "open" | "in_progress" | "resolved";

export default function OwnerMaintenancePage() {
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [villaId, setVillaId]     = useState<string | null>(null);
  const [villaName, setVillaName] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [issues, setIssues]       = useState<MaintIssue[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<FilterType>("open");
  const [expanded, setExpanded]   = useState<string | null>(null);

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
        if (!ov?.villa_id) { setAuthReady(true); return; }
        setVillaId(ov.villa_id);
        const { data: v } = await supabase.from("villas").select("name").eq("id", ov.villa_id).single();
        if (v) setVillaName(v.name ?? null);
        setAuthReady(true);
      } catch { window.location.href = "/"; }
    });
  }, []);

  const fetchIssues = useCallback(async () => {
    if (!villaId) return;
    setLoading(true);
    try {
      let q = supabase.from("maintenance_issues")
        .select("id,title,category,priority,status,description,reported_by,created_at,resolved_at")
        .eq("villa_id", villaId)
        .order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data } = await q.limit(50);
      setIssues((data ?? []) as MaintIssue[]);
    } catch {} finally { setLoading(false); }
  }, [villaId, filter]);

  useEffect(() => { if (authReady && villaId) fetchIssues(); }, [authReady, villaId, filter, fetchIssues]);

  const ownerName   = profile?.full_name ?? "Owner";
  const initStr     = ini(ownerName);
  const path        = typeof window !== "undefined" ? window.location.pathname : "";

  const openCnt     = issues.filter(i => i.status === "open").length;
  const inProgCnt   = issues.filter(i => i.status === "in_progress").length;
  const resolvedCnt = issues.filter(i => i.status === "resolved").length;

  if (!authReady) return (
    <>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#F5F0E8}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #EDE6D6", borderTop: "3px solid #C9A84C", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#F5F0E8;font-family:Inter,sans-serif}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#DDD5C0;border-radius:10px}
        .owner-sidebar{width:220px;background:#2C1E0F;display:flex;flex-direction:column;min-height:100vh;position:fixed;top:0;left:0;z-index:100}
        .owner-content{margin-left:220px;flex:1}
        @media(max-width:900px){
          .owner-sidebar{width:180px}
          .owner-content{margin-left:180px}
        }
        @media(max-width:640px){
          .owner-sidebar{display:none}
          .owner-content{margin-left:0}
        }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>

        <div className="owner-sidebar">
          <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={P.villa} size={17} /></div>
            <div><div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Playfair Display,Georgia,serif" }}>Staya</div><div style={{ fontSize: 9.5, color: "#C9A84C", letterSpacing: ".1em", textTransform: "uppercase" }}>Management</div></div>
          </div>
          <div style={{ padding: "14px 12px", flex: 1 }}>
            {NAV.map(item => {
              const active = path === item.href || (!!item.href && item.href !== "/dashboard/owner" && path.startsWith(item.href));
              return (
                <div key={item.label} onClick={() => item.href && (window.location.href = item.href)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, marginBottom: 2, cursor: item.href ? "pointer" : "default", background: active ? "rgba(201,168,76,.18)" : "transparent", color: active ? "#C9A84C" : item.href ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.3)", opacity: item.href ? 1 : 0.5, transition: "all .15s" }}>
                  <Ic d={item.icon} size={15} /><span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400 }}>{item.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initStr}</div>
            <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ownerName}</div><div style={{ fontSize: 10, color: "rgba(201,168,76,.7)" }}>Villa Owner</div></div>
            <div style={{ cursor: "pointer", color: "rgba(255,255,255,.4)" }} onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}><Ic d={P.logout} size={14} /></div>
          </div>
        </div>

        <div className="owner-content">
          <div style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
            <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C2C2C" }}>Staya Management</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{initStr}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C" }}>{ownerName}</span>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "transparent", color: "#7A6A50", fontSize: 12, cursor: "pointer" }}><Ic d={P.logout} size={13} /> Logout</button>
            </div>
          </div>

          <main style={{ padding: "28px 24px 48px" }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", fontWeight: 700 }}>Maintenance</h1>
              <p style={{ fontSize: 13, color: "#9E8E6A", marginTop: 4 }}>{villaName ?? "Your villa"} — issue status overview</p>
            </div>

            {/* Summary cards — NO cost shown */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Open Issues",  val: String(openCnt),     bg: "#FFF8E6", color: "#7A5210", border: "#F5D875" },
                { label: "In Progress",  val: String(inProgCnt),   bg: "#EEF4FF", color: "#2B4BA0", border: "#C0D2F8" },
                { label: "Resolved",     val: String(resolvedCnt), bg: "#EDFAF3", color: "#1E7A48", border: "#B0E8CB" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "14px 18px", border: `1.5px solid ${s.border}` }}>
                  <div style={{ fontSize: 11, color: s.color, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "Playfair Display,Georgia,serif" }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {([
                { key: "open",        label: "Open" },
                { key: "in_progress", label: "In Progress" },
                { key: "resolved",    label: "Resolved" },
                { key: "all",         label: "All" },
              ] as { key: FilterType; label: string }[]).map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${filter===f.key?"#C9A84C":"#EDE6D6"}`, background: filter===f.key?"#FFF8E6":"#fff", color: filter===f.key?"#7A5210":"#6B5C3E", fontSize: 12, fontWeight: filter===f.key?700:500, cursor: "pointer" }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Issues list — NO cost shown */}
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{[...Array(4)].map((_, i) => <Skel key={i} h={72} />)}</div>
            ) : issues.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", padding: 60, textAlign: "center", color: "#C4B89A" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔧</div>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "Playfair Display,Georgia,serif", marginBottom: 4 }}>No {filter === "all" ? "" : filter.replace("_"," ")} issues</div>
                <div style={{ fontSize: 13 }}>Your villa is in good shape.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {issues.map(issue => {
                  const pSt = PRIORITY_STYLE[issue.priority ?? "low"] ?? PRIORITY_STYLE.low;
                  const sSt = STATUS_STYLE[issue.status ?? "open"] ?? STATUS_STYLE.open;
                  const isExp = expanded === issue.id;
                  return (
                    <div key={issue.id} style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #EDE6D6", boxShadow: "0 2px 8px rgba(44,44,44,.04)", overflow: "hidden", animation: "fadeUp .3s ease both" }}>
                      <div style={{ padding: "14px 20px", display: "flex", alignItems: "flex-start", gap: 14, cursor: "pointer" }} onClick={() => setExpanded(isExp ? null : issue.id)}>
                        <div style={{ width: 4, height: 40, borderRadius: 2, background: pSt.color, flexShrink: 0, marginTop: 2 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginBottom: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#2C2C2C" }}>{issue.title ?? "Untitled Issue"}</span>
                            {issue.category && <span style={{ fontSize: 11, color: "#9E8E6A", background: "#F5F0E8", padding: "2px 8px", borderRadius: 20 }}>{issue.category}</span>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: pSt.color, background: pSt.bg, padding: "2px 8px", borderRadius: 20, border: `1px solid ${pSt.border}` }}>
                              {(issue.priority ?? "low").replace(/\b\w/g, c => c.toUpperCase())} Priority
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: sSt.color, background: sSt.bg, padding: "2px 8px", borderRadius: 20 }}>
                              {(issue.status ?? "open").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                            <span style={{ fontSize: 11, color: "#C4B89A" }}>{timeAgo(issue.created_at)}</span>
                          </div>
                        </div>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#C4B89A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExp ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0, marginTop: 4 }}><path d="M6 9l6 6 6-6"/></svg>
                      </div>

                      {isExp && (
                        <div style={{ padding: "0 20px 18px 38px", borderTop: "1px solid #F0EBE0" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14, marginTop: 16 }}>
                            <div>
                              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4 }}>Reported</div>
                              <div style={{ fontSize: 13, color: "#2C2C2C" }}>{fmtDate(issue.created_at)}</div>
                            </div>
                            {issue.reported_by && (
                              <div>
                                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4 }}>Reported By</div>
                                <div style={{ fontSize: 13, color: "#2C2C2C" }}>{issue.reported_by}</div>
                              </div>
                            )}
                            {issue.resolved_at && (
                              <div>
                                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4 }}>Resolved</div>
                                <div style={{ fontSize: 13, color: "#1E7A48" }}>{fmtDate(issue.resolved_at)}</div>
                              </div>
                            )}
                          </div>
                          {issue.description && (
                            <div style={{ marginTop: 14 }}>
                              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>Description</div>
                              <p style={{ fontSize: 13.5, color: "#2C2C2C", lineHeight: 1.65, background: "#FDFAF5", padding: "12px 16px", borderRadius: 10, border: "1px solid #EDE6D6" }}>{issue.description}</p>
                            </div>
                          )}
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
    </>
  );
}

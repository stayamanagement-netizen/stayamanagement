"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Profile { id: string; full_name: string | null; role: string; }
interface Alert {
  id: string;
  villa_name: string | null;
  guest_name: string | null;
  alert_type: string | null;
  description: string | null;
  location: string | null;
  status: string | null;
  created_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by_name: string | null;
  resolved_at: string | null;
  resolved_by_name: string | null;
  resolution_notes: string | null;
}
interface VillaManager { user_id: string; full_name: string | null; }
interface Note { id: string; written_by_name: string | null; written_by_role: string | null; note: string; created_at: string | null; }

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}
function ini(n: string | null) { if (!n) return "?"; return n.trim().split(" ").map(w => w[0] ?? "").slice(0,2).join("").toUpperCase(); }

const P = {
  home:   "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  villa:  "M3 22h18 M4 22V9l8-7 8 7v13 M9 22V16h6v6",
  cal:    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  chat:   "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  wallet: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  wrench: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  star:   "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  gear:   "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  alert:  "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  check:  "M20 6L9 17l-5-5",
  send:   "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5",
};

const TYPE_ICONS: Record<string, string>  = { medical:"🏥", security:"🔒", fire:"🔥", flood:"💧", accident:"⚠️", other:"📋" };
const TYPE_LABELS: Record<string, string> = { medical:"Medical Emergency", security:"Security Issue", fire:"Fire", flood:"Flood / Water Damage", accident:"Accident", other:"Other Urgent Issue" };

function timeAgo(d: string | null) {
  if (!d) return "—";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`;
}
function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
}
const SS: Record<string, { bg:string; color:string; border:string; label:string }> = {
  active:       { bg:"#FFF0F0", color:"#C62828", border:"#FFCDD2", label:"Active"       },
  acknowledged: { bg:"#FFF8E6", color:"#7A5210", border:"#F5D875", label:"Acknowledged" },
  resolved:     { bg:"#EDFAF3", color:"#1E7A48", border:"#B0E8CB", label:"Resolved"     },
};

const NAV_ITEMS = [
  { label: "Dashboard",      icon: P.home,   href: "/dashboard/manager" },
  { label: "My Villa",       icon: P.villa,  href: "/dashboard/manager/villa" },
  { label: "Bookings",       icon: P.cal,    href: "/dashboard/manager/bookings" },
  { label: "Guest Messages", icon: P.chat,   href: "/dashboard/manager/messages" },
  { label: "Petty Cash",     icon: P.wallet, href: "/dashboard/manager/petty-cash" },
  { label: "Maintenance",    icon: P.wrench, href: "/dashboard/manager/maintenance" },
  { label: "Services",       icon: P.star,   href: "/dashboard/manager/services" },
  { label: "Emergencies",    icon: P.alert,  href: "/dashboard/manager/emergencies" },
  { label: "Settings",       icon: P.gear,   href: "/dashboard/manager/settings" },
];

function Sidebar({ name, initStr, activeCount }: { name: string; initStr: string; activeCount: number }) {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  return (
    <div className="mgr-sidebar">
      <div style={{ padding:"24px 20px 16px", borderBottom:"1px solid rgba(255,255,255,.07)", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:34, height:34, borderRadius:9, background:"#C9A84C", display:"flex", alignItems:"center", justifyContent:"center" }}><Ic d={P.villa} size={17}/></div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"#fff", fontFamily:"Playfair Display,Georgia,serif" }}>Staya</div>
          <div style={{ fontSize:9.5, color:"#C9A84C", letterSpacing:".1em", textTransform:"uppercase" }}>Management</div>
        </div>
      </div>
      <div style={{ padding:"14px 12px", flex:1 }}>
        <div style={{ fontSize:9.5, color:"rgba(201,168,76,.55)", letterSpacing:".09em", textTransform:"uppercase", paddingLeft:8, marginBottom:6 }}>Main Menu</div>
        {NAV_ITEMS.map(item => {
          const active = path === item.href || (!!item.href && item.href !== "/dashboard/manager" && path.startsWith(item.href));
          const isEmergency = item.label === "Emergencies";
          return (
            <div key={item.label} onClick={() => item.href && (window.location.href = item.href)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderRadius:8, marginBottom:2, cursor:item.href?"pointer":"default", background:active?"rgba(201,168,76,.18)":"transparent", color:active?"#C9A84C":isEmergency&&activeCount>0?"#FF8A80":item.href?"rgba(255,255,255,.72)":"rgba(255,255,255,.3)", opacity:item.href?1:0.5, transition:"all .15s" }}>
              <Ic d={item.icon} size={15}/>
              <span style={{ fontSize:12.5, fontWeight:active?600:400, flex:1 }}>{item.label}</span>
              {isEmergency && activeCount > 0 && (
                <span style={{ background:"#C62828", color:"#fff", fontSize:10, fontWeight:700, padding:"1px 7px", borderRadius:10, minWidth:18, textAlign:"center", animation:"pulse 1.5s ease infinite" }}>
                  {activeCount}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ padding:"12px 14px", borderTop:"1px solid rgba(255,255,255,.07)", display:"flex", alignItems:"center", gap:9 }}>
        <div style={{ width:28, height:28, borderRadius:"50%", background:"#C9A84C", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10.5, fontWeight:700, color:"#fff", flexShrink:0 }}>{initStr}</div>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ fontSize:12, fontWeight:600, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
          <div style={{ fontSize:10, color:"rgba(201,168,76,.7)" }}>Villa Manager</div>
        </div>
        <div style={{ cursor:"pointer", color:"rgba(255,255,255,.4)" }} onClick={async () => { await supabase.auth.signOut(); window.location.href="/"; }}><Ic d={P.logout} size={14}/></div>
      </div>
    </div>
  );
}

export default function ManagerEmergenciesPage() {
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [villaId, setVillaId]   = useState<string | null>(null);
  const [villaName, setVillaName] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [alerts, setAlerts]     = useState<Alert[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<"all"|"active"|"acknowledged"|"resolved">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acking, setAcking]     = useState<string | null>(null);
  const [villaManagers, setVillaManagers] = useState<VillaManager[]>([]);
  const [notes, setNotes]       = useState<Record<string, Note[]>>({});
  const [noteText, setNoteText] = useState<Record<string, string>>({});
  const [noteSaving, setNoteSaving] = useState<string | null>(null);

  /* auth guard */
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      try {
        const { data: profData } = await supabase.from("profiles").select("id,full_name,role").eq("id", user.id).single();
        const prof: Profile | null = profData ?? null;
        if (!prof) { window.location.href = "/"; return; }
        if (prof.role === "super_admin")   { window.location.href = "/dashboard/admin";   return; }
        if (prof.role === "villa_owner")   { window.location.href = "/dashboard/owner";   return; }
        if (prof.role !== "villa_manager") { window.location.href = "/"; return; }
        setProfile(prof);
        /* get villa */
        const { data: vm } = await supabase.from("villa_managers").select("villa_id").eq("manager_id", user.id).single();
        if (!vm?.villa_id) { setAuthReady(true); return; }
        setVillaId(vm.villa_id);
        const { data: v } = await supabase.from("villas").select("id,name").eq("id", vm.villa_id).single();
        if (v) setVillaName(v.name ?? null);
        /* fetch other managers for this villa */
        const { data: allVm } = await supabase.from("villa_managers").select("manager_id").eq("villa_id", vm.villa_id);
        if (allVm?.length) {
          const ids = allVm.map((r: { manager_id: string }) => r.manager_id).filter((id: string) => id !== user.id);
          if (ids.length) {
            const { data: pr } = await supabase.from("profiles").select("id,full_name").in("id", ids);
            setVillaManagers((pr ?? []).map((p: { id: string; full_name: string | null }) => ({ user_id: p.id, full_name: p.full_name })));
          }
        }
        setAuthReady(true);
      } catch { window.location.href="/"; }
    });
  }, []);

  const fetchAlerts = useCallback(async () => {
    if (!villaId) return;
    const { data } = await supabase.from("emergency_alerts")
      .select("id,villa_name,guest_name,alert_type,description,location,status,created_at,acknowledged_at,acknowledged_by_name,resolved_at,resolved_by_name,resolution_notes")
      .eq("villa_id", villaId)
      .order("created_at", { ascending: false });
    setAlerts((data ?? []) as Alert[]);
    setLoading(false);
  }, [villaId]);

  useEffect(() => { if (villaId) { fetchAlerts(); } }, [villaId, fetchAlerts]);

  /* real-time subscription */
  useEffect(() => {
    if (!villaId) return;
    const ch = supabase.channel("em_manager_page")
      .on("postgres_changes", { event:"*", schema:"public", table:"emergency_alerts", filter:`villa_id=eq.${villaId}` }, () => fetchAlerts())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [villaId, fetchAlerts]);

  const fetchNotes = useCallback(async (alertId: string) => {
    try {
      const { data } = await supabase.from("emergency_notes")
        .select("id,written_by_name,written_by_role,note,created_at")
        .eq("emergency_id", alertId)
        .order("created_at", { ascending: true });
      setNotes(prev => ({ ...prev, [alertId]: (data ?? []) as Note[] }));
    } catch { setNotes(prev => ({ ...prev, [alertId]: [] })); }
  }, []);

  function toggleExpand(a: Alert) {
    if (expanded === a.id) { setExpanded(null); return; }
    setExpanded(a.id);
    fetchNotes(a.id);
  }

  async function acknowledge(a: Alert) {
    setAcking(a.id);
    await supabase.from("emergency_alerts").update({
      status: "acknowledged",
      acknowledged_at: new Date().toISOString(),
      acknowledged_by_name: profile?.full_name ?? "Manager",
    }).eq("id", a.id);
    await fetchAlerts();
    setAcking(null);
  }

  async function addNote(alertId: string) {
    const text = (noteText[alertId] ?? "").trim();
    if (!text) return;
    setNoteSaving(alertId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("emergency_notes").insert([{
        emergency_id: alertId,
        written_by: user?.id ?? null,
        written_by_name: profile?.full_name ?? "Manager",
        written_by_role: "villa_manager",
        note: text,
      }]);
      setNoteText(p => ({ ...p, [alertId]: "" }));
      await fetchNotes(alertId);
    } catch {}
    setNoteSaving(null);
  }

  const activeCount = alerts.filter(a => a.status === "active").length;
  const displayed = filter === "all" ? alerts : alerts.filter(a => a.status === filter);
  const mgr = profile?.full_name ?? "Manager";

  if (!authReady) return (
    <>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#F5F0E8}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
        <div style={{ width:32, height:32, border:"3px solid #EDE6D6", borderTop:"3px solid #C9A84C", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#F5F0E8;font-family:Inter,sans-serif}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#DDD5C0;border-radius:10px}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .field-label{font-size:10.5px;font-weight:700;color:#9E8E6A;letter-spacing:.06em;text-transform:uppercase;margin-bottom:5px}
        .note-row{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #F0EBE0}
        .note-row:last-child{border-bottom:none}
        .mgr-sidebar{width:220px;background:#2C1E0F;display:flex;flex-direction:column;min-height:100vh;position:fixed;top:0;left:0;z-index:100}
        .mgr-content{margin-left:220px;flex:1}
        @media(max-width:900px){.mgr-sidebar{width:180px}.mgr-content{margin-left:180px}}
        @media(max-width:640px){.mgr-sidebar{display:none}.mgr-content{margin-left:0}}
      `}</style>

      <div style={{ display:"flex", minHeight:"100vh" }}>
        <Sidebar name={mgr} initStr={ini(mgr)} activeCount={activeCount}/>

        <div className="mgr-content">
          {/* Top bar */}
          <div style={{ background:"#fff", borderBottom:"1px solid #EDE6D6", padding:"0 28px", height:58, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ color:activeCount>0?"#C62828":"#C9A84C", animation:activeCount>0?"pulse 1.5s ease infinite":"none" }}><Ic d={P.alert} size={18}/></div>
              <span style={{ fontFamily:"Playfair Display,Georgia,serif", fontSize:16, fontWeight:700, color:"#2C2C2C" }}>Emergency Alerts {villaName ? `— ${villaName}` : ""}</span>
              {activeCount > 0 && <span style={{ background:"#C62828", color:"#fff", fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:10 }}>{activeCount} active</span>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:"50%", background:"#C9A84C", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff" }}>{ini(mgr)}</div>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href="/"; }}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, border:"1.5px solid #EDE6D6", background:"transparent", color:"#7A6A50", fontSize:12, fontWeight:500, cursor:"pointer" }}>
                <Ic d={P.logout} size={13}/> Logout
              </button>
            </div>
          </div>

          <main style={{ padding:"28px 28px 48px" }}>

            {/* Summary cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
              {[
                { label:"Active",       val:activeCount, bg:"#FFF0F0", color:"#C62828", border:"#FFCDD2" },
                { label:"Acknowledged", val:alerts.filter(a=>a.status==="acknowledged").length, bg:"#FFF8E6", color:"#7A5210", border:"#F5D875" },
                { label:"Resolved",     val:alerts.filter(a=>a.status==="resolved").length,     bg:"#EDFAF3", color:"#1E7A48", border:"#B0E8CB" },
              ].map(s => (
                <div key={s.label} style={{ background:s.bg, borderRadius:14, padding:"16px 20px", border:`1.5px solid ${s.border}`, textAlign:"center" }}>
                  <div style={{ fontFamily:"Playfair Display,Georgia,serif", fontSize:30, fontWeight:700, color:s.color }}>{s.val}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:s.color, marginTop:3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Co-managers */}
            {villaManagers.length > 0 && (
              <div style={{ background:"#fff", borderRadius:12, border:"1px solid #EDE6D6", padding:"14px 18px", marginBottom:20, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                <span style={{ fontSize:11.5, color:"#9E8E6A", fontWeight:600 }}>Team on this villa:</span>
                {villaManagers.map(m => (
                  <div key={m.user_id} style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 11px", borderRadius:20, background:"#F5F0E8", border:"1px solid #EDE6D6" }}>
                    <div style={{ width:20, height:20, borderRadius:"50%", background:"#C9A84C", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8.5, fontWeight:700, color:"#fff" }}>
                      {(m.full_name ?? "?").split(" ").map((w:string)=>w[0]).slice(0,2).join("").toUpperCase()}
                    </div>
                    <span style={{ fontSize:12, color:"#4A3B27", fontWeight:500 }}>{m.full_name ?? "Manager"}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Filter tabs */}
            <div style={{ display:"flex", gap:8, marginBottom:20 }}>
              {(["all","active","acknowledged","resolved"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding:"7px 14px", borderRadius:8, border:`1.5px solid ${filter===f?"#C9A84C":"#EDE6D6"}`, background:filter===f?"#FFF8E6":"#fff", color:filter===f?"#7A5210":"#6B5C3E", fontSize:12, fontWeight:filter===f?700:500, cursor:"pointer", textTransform:"capitalize" }}>
                  {f}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ display:"flex", justifyContent:"center", padding:60 }}>
                <div style={{ width:28, height:28, border:"3px solid #EDE6D6", borderTop:"3px solid #C9A84C", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
              </div>
            ) : displayed.length === 0 ? (
              <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE6D6", padding:48, textAlign:"center", color:"#C4B89A", fontSize:14 }}>
                No {filter==="all"?"":filter} alerts for {villaName ?? "your villa"}.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {displayed.map(a => {
                  const st = SS[a.status ?? "active"] ?? SS.active;
                  const isExp = expanded === a.id;
                  const alertNotes = notes[a.id] ?? null;

                  return (
                    <div key={a.id} style={{ background:"#fff", borderRadius:16, border:`1.5px solid ${a.status==="active"?"#FFCDD2":"#EDE6D6"}`, boxShadow:a.status==="active"?"0 4px 20px rgba(198,40,40,.1)":"0 2px 8px rgba(44,44,44,.04)", animation:"fadeUp .3s ease both", overflow:"hidden" }}>

                      {/* Summary row */}
                      <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", gap:14, cursor:"pointer" }} onClick={() => toggleExpand(a)}>
                        <div style={{ fontSize:26, flexShrink:0 }}>{TYPE_ICONS[a.alert_type??""]} </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:9, flexWrap:"wrap", marginBottom:3 }}>
                            <span style={{ fontSize:14, fontWeight:700, color:"#2C2C2C" }}>{TYPE_LABELS[a.alert_type??""] ?? a.alert_type}</span>
                            <span style={{ fontSize:11.5, color:"#C4B89A" }}>{timeAgo(a.created_at)}</span>
                          </div>
                          <p style={{ fontSize:12.5, color:"#6B5C3E", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:isExp?"normal":"nowrap" }}>
                            {a.description ?? "—"}
                          </p>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                          <span style={{ padding:"4px 12px", borderRadius:20, background:st.bg, color:st.color, border:`1px solid ${st.border}`, fontSize:11.5, fontWeight:700 }}>{st.label}</span>
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#C4B89A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ transform:isExp?"rotate(180deg)":"none", transition:"transform .2s" }}><path d="M6 9l6 6 6-6"/></svg>
                        </div>
                      </div>

                      {/* Expanded panel */}
                      {isExp && (
                        <div style={{ padding:"0 20px 22px", borderTop:"1px solid #F0EBE0" }}>

                          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:14, marginTop:16 }}>
                            <div><div className="field-label">Guest</div><div style={{ fontSize:13, color:"#2C2C2C", fontWeight:500 }}>{a.guest_name ?? "—"}</div></div>
                            <div><div className="field-label">Location</div><div style={{ fontSize:13, color:"#2C2C2C", fontWeight:500 }}>{a.location ?? "—"}</div></div>
                            <div><div className="field-label">Reported</div><div style={{ fontSize:12, color:"#6B5C3E" }}>{fmt(a.created_at)}</div></div>
                            {a.acknowledged_at && (
                              <div>
                                <div className="field-label">Acknowledged</div>
                                <div style={{ fontSize:12, color:"#7A5210" }}>{fmt(a.acknowledged_at)}</div>
                                {a.acknowledged_by_name && <div style={{ fontSize:11, color:"#9E8E6A", marginTop:2 }}>by {a.acknowledged_by_name}</div>}
                              </div>
                            )}
                            {a.resolved_at && (
                              <div>
                                <div className="field-label">Resolved</div>
                                <div style={{ fontSize:12, color:"#1E7A48" }}>{fmt(a.resolved_at)}</div>
                                {a.resolved_by_name && <div style={{ fontSize:11, color:"#9E8E6A", marginTop:2 }}>by {a.resolved_by_name}</div>}
                              </div>
                            )}
                          </div>

                          {a.description && (
                            <div style={{ marginTop:14 }}>
                              <div className="field-label">Description</div>
                              <p style={{ fontSize:13.5, color:"#2C2C2C", lineHeight:1.65, background:"#FDFAF5", padding:"12px 16px", borderRadius:10, border:"1px solid #EDE6D6", marginTop:6 }}>{a.description}</p>
                            </div>
                          )}

                          {a.resolution_notes && (
                            <div style={{ marginTop:14 }}>
                              <div className="field-label" style={{ color:"#1E7A48" }}>Resolution Notes</div>
                              <p style={{ fontSize:13, color:"#2C2C2C", lineHeight:1.65, background:"#EDFAF3", padding:"12px 16px", borderRadius:10, border:"1px solid #B0E8CB", marginTop:6 }}>{a.resolution_notes}</p>
                            </div>
                          )}

                          {/* Admin-only resolve notice */}
                          {(a.status === "active" || a.status === "acknowledged") && (
                            <div style={{ marginTop:14, padding:"10px 14px", background:"#FDFAF5", border:"1px solid #EDE6D6", borderRadius:9, fontSize:12, color:"#9E8E6A", display:"flex", alignItems:"center", gap:8 }}>
                              🔒 Only an admin can resolve emergencies. You can acknowledge and add notes.
                            </div>
                          )}

                          {/* Actions */}
                          {a.status === "active" && (
                            <div style={{ marginTop:14 }}>
                              <button onClick={() => acknowledge(a)} disabled={acking===a.id}
                                style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:9, border:"1.5px solid #F5D875", background:"#FFF8E6", color:"#7A5210", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                                {acking===a.id ? <div style={{ width:11, height:11, border:"2px solid #7A5210", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .6s linear infinite" }}/> : <Ic d={P.check} size={13}/>}
                                Acknowledge Alert
                              </button>
                            </div>
                          )}

                          {/* Internal notes */}
                          <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid #F0EBE0" }}>
                            <div style={{ fontSize:13, fontWeight:700, color:"#2C2C2C", marginBottom:12 }}>Internal Notes</div>
                            {alertNotes === null ? (
                              <div style={{ fontSize:12.5, color:"#C4B89A", marginBottom:12 }}>Loading…</div>
                            ) : alertNotes.length === 0 ? (
                              <div style={{ fontSize:12.5, color:"#C4B89A", marginBottom:12 }}>No notes yet.</div>
                            ) : (
                              <div style={{ marginBottom:14 }}>
                                {alertNotes.map(n => (
                                  <div key={n.id} className="note-row">
                                    <div style={{ width:28, height:28, borderRadius:"50%", background:"#F5F0E8", border:"1.5px solid #EDE6D6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9.5, fontWeight:700, color:"#7A6A50", flexShrink:0 }}>
                                      {(n.written_by_name ?? "?").split(" ").map((w:string)=>w[0]).slice(0,2).join("").toUpperCase()}
                                    </div>
                                    <div style={{ flex:1, minWidth:0 }}>
                                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                                        <span style={{ fontSize:12.5, fontWeight:600, color:"#2C2C2C" }}>{n.written_by_name ?? "Unknown"}</span>
                                        {n.written_by_role && <span style={{ fontSize:10, color:"#C9A84C", fontWeight:600, background:"#FFF8E6", padding:"1px 6px", borderRadius:10, textTransform:"capitalize" }}>{n.written_by_role.replace("_"," ")}</span>}
                                        <span style={{ fontSize:10.5, color:"#C4B89A", marginLeft:"auto" }}>{timeAgo(n.created_at)}</span>
                                      </div>
                                      <p style={{ fontSize:13, color:"#4A3B27", lineHeight:1.6 }}>{n.note}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div style={{ display:"flex", gap:9, alignItems:"flex-end" }}>
                              <textarea
                                value={noteText[a.id] ?? ""}
                                onChange={e => setNoteText(p => ({ ...p, [a.id]: e.target.value }))}
                                onKeyDown={e => { if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); addNote(a.id); } }}
                                placeholder="Add an internal note… (Enter to send)"
                                rows={2}
                                style={{ flex:1, padding:"9px 12px", border:"1.5px solid #DDD5C0", borderRadius:9, fontSize:13, fontFamily:"Inter,sans-serif", color:"#2C2C2C", background:"#FDFBF7", resize:"none", lineHeight:1.55, outline:"none", boxSizing:"border-box" }}
                              />
                              <button onClick={() => addNote(a.id)} disabled={noteSaving===a.id||!(noteText[a.id]??"").trim()}
                                style={{ padding:"9px 14px", borderRadius:9, border:"none", background:noteSaving===a.id||!(noteText[a.id]??"").trim()?"#EDE6D6":"#C9A84C", color:"#fff", cursor:noteSaving===a.id||!(noteText[a.id]??"").trim()?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                {noteSaving===a.id ? <div style={{ width:13, height:13, border:"2px solid rgba(255,255,255,.4)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin .6s linear infinite" }}/> : <Ic d={P.send} size={15}/>}
                              </button>
                            </div>
                          </div>

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

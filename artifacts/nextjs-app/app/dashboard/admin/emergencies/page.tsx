"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface Alert {
  id: string;
  villa_id: string | null;
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
interface Villa { id: string; name: string | null; }

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}
const P = {
  back:   "M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18",
  alert:  "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  check:  "M4.5 12.75l6 6 9-13.5",
  logout: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9",
  send:   "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5",
  user:   "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  filter: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z",
};
const TYPE_ICONS: Record<string, string> = { medical:"🏥", security:"🔒", fire:"🔥", flood:"💧", accident:"⚠️", other:"📋" };
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

export default function EmergenciesPage() {
  const [profile, setProfile]   = useState<{ id: string; full_name: string | null } | null>(null);
  const [alerts, setAlerts]     = useState<Alert[]>([]);
  const [villas, setVillas]     = useState<Villa[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<"all"|"active"|"acknowledged"|"resolved">("all");
  const [villaFilter, setVillaFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolving, setResolving] = useState(false);
  const [acking, setAcking]     = useState<string | null>(null);
  /* per-alert managers cache */
  const [managers, setManagers] = useState<Record<string, VillaManager[]>>({});
  /* per-alert notes cache */
  const [notes, setNotes]       = useState<Record<string, Note[]>>({});
  const [noteText, setNoteText] = useState<Record<string, string>>({});
  const [noteSaving, setNoteSaving] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    const { data } = await supabase
      .from("emergency_alerts")
      .select("id,villa_id,villa_name,guest_name,alert_type,description,location,status,created_at,acknowledged_at,acknowledged_by_name,resolved_at,resolved_by_name,resolution_notes")
      .order("created_at", { ascending: false });
    setAlerts((data ?? []) as Alert[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    /* load current user */
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      supabase.from("profiles").select("id,full_name,role").eq("id", user.id).single()
        .then(({ data }) => { if (data) setProfile(data as any); }, () => {});
    });
    fetchAlerts();
    supabase.from("villas").select("id,name").order("name").then(({ data }) => setVillas((data ?? []) as Villa[]));
  }, [fetchAlerts]);

  /* real-time subscription */
  useEffect(() => {
    const ch = supabase.channel("em_admin_page")
      .on("postgres_changes", { event:"*", schema:"public", table:"emergency_alerts" }, () => fetchAlerts())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchAlerts]);

  /* fetch managers for a villa when alert is expanded */
  const fetchManagers = useCallback(async (villaId: string) => {
    if (managers[villaId]) return;
    try {
      const { data: vm } = await supabase.from("villa_managers").select("user_id").eq("villa_id", villaId);
      if (!vm?.length) { setManagers(p => ({ ...p, [villaId]: [] })); return; }
      const ids = vm.map((r: { user_id: string }) => r.user_id);
      const { data: pr } = await supabase.from("profiles").select("id,full_name").in("id", ids);
      const mgrs = (pr ?? []).map((p: { id: string; full_name: string | null }) => ({ user_id: p.id, full_name: p.full_name }));
      setManagers(prev => ({ ...prev, [villaId]: mgrs }));
    } catch { setManagers(p => ({ ...p, [villaId]: [] })); }
  }, [managers]);

  /* fetch notes for an alert */
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
    if (a.villa_id) fetchManagers(a.villa_id);
    fetchNotes(a.id);
  }

  async function acknowledge(a: Alert) {
    setAcking(a.id);
    await supabase.from("emergency_alerts").update({
      status: "acknowledged",
      acknowledged_at: new Date().toISOString(),
      acknowledged_by_name: profile?.full_name ?? "Admin",
    }).eq("id", a.id);
    await fetchAlerts();
    setAcking(null);
  }

  async function resolve(a: Alert) {
    setResolving(true);
    await supabase.from("emergency_alerts").update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      resolved_by_name: profile?.full_name ?? "Admin",
      resolution_notes: resolveNotes.trim() || null,
    }).eq("id", a.id);
    setResolveId(null); setResolveNotes(""); setResolving(false);
    await fetchAlerts();
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
        written_by_name: profile?.full_name ?? "Admin",
        written_by_role: "super_admin",
        note: text,
      }]);
      setNoteText(p => ({ ...p, [alertId]: "" }));
      await fetchNotes(alertId);
    } catch {}
    setNoteSaving(null);
  }

  const activeCount = alerts.filter(a => a.status === "active").length;
  const ackCount    = alerts.filter(a => a.status === "acknowledged").length;
  const resCount    = alerts.filter(a => a.status === "resolved").length;

  const displayed = alerts
    .filter(a => filter === "all" || a.status === filter)
    .filter(a => villaFilter === "all" || a.villa_id === villaFilter);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',sans-serif;background:#F5F0E8;color:#2C2C2C}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#DDD5C0;border-radius:10px}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes flashBg{0%,100%{background:#FFF0F0}50%{background:#FFE0E0}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .field-label{font-size:10.5px;font-weight:700;color:#9E8E6A;letter-spacing:.06em;text-transform:uppercase;margin-bottom:5px}
        .note-row{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #F0EBE0}
        .note-row:last-child{border-bottom:none}
        select{font-family:'Inter',sans-serif;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239E8E6A' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;background-size:14px;padding-right:32px!important;}
      `}</style>

      <div style={{ minHeight:"100vh", background:"#F5F0E8" }}>

        {/* Header */}
        <header style={{ background:"#fff", borderBottom:"1px solid #EDE6D6", padding:"0 28px", height:62, display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 2px 8px rgba(44,44,44,.05)", position:"sticky", top:0, zIndex:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <button onClick={() => window.location.href="/dashboard/admin/"} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 13px", borderRadius:8, border:"1.5px solid #EDE6D6", background:"transparent", color:"#7A6A50", fontSize:12.5, fontWeight:500, cursor:"pointer" }}>
              <Ic d={P.back} size={13} /> Back
            </button>
            <div style={{ width:1, height:22, background:"#EDE6D6" }} />
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ color:"#C62828", animation: activeCount > 0 ? "pulse 1.5s ease infinite" : "none" }}><Ic d={P.alert} size={20} /></div>
              <span style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:18, fontWeight:700, color:"#2C2C2C" }}>Emergency Alerts</span>
              {activeCount > 0 && <span style={{ background:"#C62828", color:"#fff", fontSize:12, fontWeight:700, padding:"2px 9px", borderRadius:10, animation:"pulse 1.5s ease infinite" }}>{activeCount}</span>}
            </div>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href="/"; }}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, border:"1.5px solid #E8E0D0", background:"transparent", color:"#6B5C3E", fontSize:12.5, fontWeight:500, cursor:"pointer" }}>
            <Ic d={P.logout} size={13} /> Logout
          </button>
        </header>

        <main style={{ maxWidth:960, margin:"0 auto", padding:"28px 20px 60px" }}>

          {/* Summary cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
            {[
              { label:"Active",       val:activeCount, bg:"#FFF0F0", color:"#C62828", border:"#FFCDD2" },
              { label:"Acknowledged", val:ackCount,    bg:"#FFF8E6", color:"#7A5210", border:"#F5D875" },
              { label:"Resolved",     val:resCount,    bg:"#EDFAF3", color:"#1E7A48", border:"#B0E8CB" },
            ].map(s => (
              <div key={s.label} style={{ background:s.bg, borderRadius:14, padding:"16px 20px", border:`1.5px solid ${s.border}`, textAlign:"center" }}>
                <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:30, fontWeight:700, color:s.color }}>{s.val}</div>
                <div style={{ fontSize:12, fontWeight:600, color:s.color, marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ display:"flex", gap:6 }}>
              {(["all","active","acknowledged","resolved"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding:"7px 14px", borderRadius:8, border:`1.5px solid ${filter===f?"#C9A84C":"#EDE6D6"}`, background:filter===f?"#FFF8E6":"#fff", color:filter===f?"#7A5210":"#6B5C3E", fontSize:12, fontWeight:filter===f?700:500, cursor:"pointer", textTransform:"capitalize" }}>
                  {f}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:"auto" }}>
              <Ic d={P.filter} size={14} />
              <select value={villaFilter} onChange={e => setVillaFilter(e.target.value)}
                style={{ padding:"7px 14px", borderRadius:8, border:"1.5px solid #EDE6D6", background:"#fff", color:"#2C2C2C", fontSize:12.5, cursor:"pointer", outline:"none" }}>
                <option value="all">All Villas</option>
                {villas.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:60 }}>
              <div style={{ width:28, height:28, border:"3px solid #EDE6D6", borderTop:"3px solid #C9A84C", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE6D6", padding:48, textAlign:"center", color:"#C4B89A", fontSize:14 }}>
              No {filter==="all"?"":filter} alerts{villaFilter!=="all"?" for this villa":""}.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {displayed.map(a => {
                const st = SS[a.status ?? "active"] ?? SS.active;
                const isExp = expanded === a.id;
                const isResv = resolveId === a.id;
                const villaManagers = a.villa_id ? (managers[a.villa_id] ?? null) : [];
                const alertNotes = notes[a.id] ?? null;

                return (
                  <div key={a.id} style={{ background:"#fff", borderRadius:16, border:`1.5px solid ${a.status==="active"?"#FFCDD2":"#EDE6D6"}`, boxShadow:a.status==="active"?"0 4px 20px rgba(198,40,40,.1)":"0 2px 8px rgba(44,44,44,.04)", animation:"fadeUp .3s ease both", overflow:"hidden" }}>

                    {/* Summary row — click to expand */}
                    <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", gap:14, cursor:"pointer" }} onClick={() => toggleExpand(a)}>
                      <div style={{ fontSize:28, flexShrink:0 }}>{TYPE_ICONS[a.alert_type??""]} </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:9, flexWrap:"wrap", marginBottom:3 }}>
                          <span style={{ fontSize:14.5, fontWeight:700, color:"#2C2C2C" }}>{a.villa_name ?? "—"}</span>
                          <span style={{ fontSize:12.5, color:"#9E8E6A" }}>·</span>
                          <span style={{ fontSize:12.5, color:"#9E8E6A" }}>{TYPE_LABELS[a.alert_type ?? ""] ?? a.alert_type}</span>
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
                      <div style={{ padding:"0 20px 24px", borderTop:"1px solid #F0EBE0" }}>

                        {/* Details grid */}
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:14, marginTop:18 }}>
                          <div><div className="field-label">Guest</div><div style={{ fontSize:13.5, color:"#2C2C2C", fontWeight:500 }}>{a.guest_name ?? "—"}</div></div>
                          <div><div className="field-label">Location</div><div style={{ fontSize:13.5, color:"#2C2C2C", fontWeight:500 }}>{a.location ?? "—"}</div></div>
                          <div><div className="field-label">Reported</div><div style={{ fontSize:12.5, color:"#6B5C3E" }}>{fmt(a.created_at)}</div></div>
                          {a.acknowledged_at && (
                            <div>
                              <div className="field-label">Acknowledged</div>
                              <div style={{ fontSize:12.5, color:"#7A5210" }}>{fmt(a.acknowledged_at)}</div>
                              {a.acknowledged_by_name && <div style={{ fontSize:11.5, color:"#9E8E6A", marginTop:2 }}>by {a.acknowledged_by_name}</div>}
                            </div>
                          )}
                          {a.resolved_at && (
                            <div>
                              <div className="field-label">Resolved</div>
                              <div style={{ fontSize:12.5, color:"#1E7A48" }}>{fmt(a.resolved_at)}</div>
                              {a.resolved_by_name && <div style={{ fontSize:11.5, color:"#9E8E6A", marginTop:2 }}>by {a.resolved_by_name}</div>}
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <div style={{ marginTop:16 }}>
                          <div className="field-label">Description</div>
                          <p style={{ fontSize:13.5, color:"#2C2C2C", lineHeight:1.65, background:"#FDFAF5", padding:"12px 16px", borderRadius:10, border:"1px solid #EDE6D6", marginTop:6 }}>{a.description ?? "—"}</p>
                        </div>

                        {/* Assigned managers */}
                        <div style={{ marginTop:16 }}>
                          <div className="field-label" style={{ marginBottom:8 }}>Assigned Managers for {a.villa_name}</div>
                          {villaManagers === null ? (
                            <div style={{ fontSize:12.5, color:"#C4B89A" }}>Loading…</div>
                          ) : villaManagers.length === 0 ? (
                            <div style={{ fontSize:12.5, color:"#C4B89A" }}>No managers assigned to this villa.</div>
                          ) : (
                            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                              {villaManagers.map(m => (
                                <div key={m.user_id} style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 12px", borderRadius:20, background:"#F5F0E8", border:"1px solid #EDE6D6" }}>
                                  <div style={{ width:22, height:22, borderRadius:"50%", background:"#C9A84C", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#fff" }}>
                                    {(m.full_name ?? "?").split(" ").map((w:string) => w[0]).slice(0,2).join("").toUpperCase()}
                                  </div>
                                  <span style={{ fontSize:12.5, color:"#4A3B27", fontWeight:500 }}>{m.full_name ?? "Manager"}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Resolution notes (if resolved) */}
                        {a.resolution_notes && (
                          <div style={{ marginTop:16 }}>
                            <div className="field-label" style={{ color:"#1E7A48" }}>Resolution Notes</div>
                            <p style={{ fontSize:13, color:"#2C2C2C", lineHeight:1.65, background:"#EDFAF3", padding:"12px 16px", borderRadius:10, border:"1px solid #B0E8CB", marginTop:6 }}>{a.resolution_notes}</p>
                          </div>
                        )}

                        {/* Resolve form */}
                        {isResv && (
                          <div style={{ marginTop:14 }}>
                            <div className="field-label">Resolution Notes (optional)</div>
                            <textarea value={resolveNotes} onChange={e => setResolveNotes(e.target.value)} placeholder="Describe how the issue was resolved…" rows={3}
                              style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #DDD5C0", borderRadius:8, fontSize:13, fontFamily:"'Inter',sans-serif", color:"#2C2C2C", background:"#FDFBF7", resize:"vertical", lineHeight:1.6, outline:"none", boxSizing:"border-box", marginTop:6 }} />
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display:"flex", gap:9, marginTop:16, flexWrap:"wrap" }}>
                          {a.status === "active" && (
                            <button onClick={() => acknowledge(a)} disabled={acking===a.id}
                              style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:9, border:"1.5px solid #F5D875", background:"#FFF8E6", color:"#7A5210", fontSize:12.5, fontWeight:700, cursor:"pointer" }}>
                              {acking===a.id ? <div style={{ width:11, height:11, border:"2px solid #7A5210", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .6s linear infinite" }}/> : <Ic d={P.check} size={13}/>}
                              Acknowledge
                            </button>
                          )}
                          {(a.status==="active"||a.status==="acknowledged") && !isResv && (
                            <button onClick={() => { setResolveId(a.id); setResolveNotes(""); }}
                              style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:9, border:"1.5px solid #B0E8CB", background:"#EDFAF3", color:"#1E7A48", fontSize:12.5, fontWeight:700, cursor:"pointer" }}>
                              <Ic d={P.check} size={13}/> Resolve
                            </button>
                          )}
                          {isResv && (
                            <>
                              <button onClick={() => resolve(a)} disabled={resolving}
                                style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 18px", borderRadius:9, border:"none", background:"#1E7A48", color:"#fff", fontSize:12.5, fontWeight:700, cursor:"pointer" }}>
                                {resolving ? <div style={{ width:11, height:11, border:"2px solid rgba(255,255,255,.4)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin .6s linear infinite" }}/> : <Ic d={P.check} size={13}/>}
                                Confirm Resolve
                              </button>
                              <button onClick={() => setResolveId(null)}
                                style={{ padding:"8px 14px", borderRadius:9, border:"1.5px solid #EDE6D6", background:"transparent", color:"#7A6A50", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>
                                Cancel
                              </button>
                            </>
                          )}
                        </div>

                        {/* Internal notes thread */}
                        <div style={{ marginTop:22, paddingTop:18, borderTop:"1px solid #F0EBE0" }}>
                          <div style={{ fontSize:13, fontWeight:700, color:"#2C2C2C", marginBottom:12 }}>Internal Notes</div>
                          {alertNotes === null ? (
                            <div style={{ fontSize:12.5, color:"#C4B89A", marginBottom:12 }}>Loading notes…</div>
                          ) : alertNotes.length === 0 ? (
                            <div style={{ fontSize:12.5, color:"#C4B89A", marginBottom:12 }}>No notes yet. Add the first one below.</div>
                          ) : (
                            <div style={{ marginBottom:14 }}>
                              {alertNotes.map(n => (
                                <div key={n.id} className="note-row">
                                  <div style={{ width:30, height:30, borderRadius:"50%", background:"#F5F0E8", border:"1.5px solid #EDE6D6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#7A6A50", flexShrink:0 }}>
                                    {(n.written_by_name ?? "?").split(" ").map((w:string)=>w[0]).slice(0,2).join("").toUpperCase()}
                                  </div>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                                      <span style={{ fontSize:12.5, fontWeight:600, color:"#2C2C2C" }}>{n.written_by_name ?? "Unknown"}</span>
                                      {n.written_by_role && <span style={{ fontSize:10.5, color:"#C9A84C", fontWeight:600, background:"#FFF8E6", padding:"1px 7px", borderRadius:10, textTransform:"capitalize" }}>{n.written_by_role.replace("_"," ")}</span>}
                                      <span style={{ fontSize:11, color:"#C4B89A", marginLeft:"auto" }}>{timeAgo(n.created_at)}</span>
                                    </div>
                                    <p style={{ fontSize:13, color:"#4A3B27", lineHeight:1.6 }}>{n.note}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Add note */}
                          <div style={{ display:"flex", gap:9, alignItems:"flex-end" }}>
                            <textarea
                              value={noteText[a.id] ?? ""}
                              onChange={e => setNoteText(p => ({ ...p, [a.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); addNote(a.id); } }}
                              placeholder="Add an internal note… (Enter to send)"
                              rows={2}
                              style={{ flex:1, padding:"9px 12px", border:"1.5px solid #DDD5C0", borderRadius:9, fontSize:13, fontFamily:"'Inter',sans-serif", color:"#2C2C2C", background:"#FDFBF7", resize:"none", lineHeight:1.55, outline:"none", boxSizing:"border-box" }}
                            />
                            <button onClick={() => addNote(a.id)} disabled={noteSaving===a.id||!(noteText[a.id]??"").trim()}
                              style={{ padding:"9px 14px", borderRadius:9, border:"none", background: noteSaving===a.id||!(noteText[a.id]??"").trim() ? "#EDE6D6" : "#C9A84C", color:"#fff", cursor: noteSaving===a.id||!(noteText[a.id]??"").trim() ? "default" : "pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
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
    </>
  );
}

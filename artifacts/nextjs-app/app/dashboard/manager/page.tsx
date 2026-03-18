"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Profile { id: string; full_name: string | null; role: string; }
interface Villa { id: string; name: string | null; location: string | null; country: string | null; }
interface Booking { id: string; guest_name: string | null; check_in: string | null; check_out: string | null; status: string | null; num_guests: number | null; special_requests: string | null; check_in_time: string | null; ota_channel: string | null; }
interface ServiceOrder { id: string; service_name: string | null; service_date: string | null; service_time: string | null; num_persons: number | null; status: string | null; guest_name: string | null; }
interface MsgRow { id: string; guest_name: string | null; content: string | null; ota_channel: string | null; created_at: string | null; }
interface EmergencyAlert { id: string; villa_name: string | null; alert_type: string | null; description: string | null; created_at: string | null; status: string | null; }

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}
function Skel({ w = "100%", h = 14 }: { w?: string | number; h?: number }) {
  return <div style={{ width: w, height: h, borderRadius: 6, background: "linear-gradient(90deg,#EDE6D6 25%,#F5EFE3 50%,#EDE6D6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />;
}
function ini(n: string | null) { if (!n) return "?"; return n.trim().split(" ").map(w => w[0] ?? "").slice(0, 2).join("").toUpperCase(); }
function fmtD(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }

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
  arrow:  "M5 12h14 M12 5l7 7-7 7",
  check:  "M20 6L9 17l-5-5",
  arrIn:  "M5 12h14 M12 5l7 7-7 7",
  arrOut: "M19 12H5 M12 19l-7-7 7-7",
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
  { label: "Emergencies",    icon: P_ALERT,  href: "/dashboard/manager/emergencies", isEmergency: true },
  { label: "Settings",       icon: P.gear,   href: "/dashboard/manager/settings" },
];

function Sidebar({ name, initStr, emergencyCount = 0 }: { name: string; initStr: string; emergencyCount?: number }) {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  return (
    <div className="mgr-sidebar">
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={P.villa} size={17} /></div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Playfair Display,Georgia,serif" }}>Staya</div>
          <div style={{ fontSize: 9.5, color: "#C9A84C", letterSpacing: ".1em", textTransform: "uppercase" }}>Management</div>
        </div>
      </div>
      <div style={{ padding: "14px 12px", flex: 1 }}>
        <div style={{ fontSize: 9.5, color: "rgba(201,168,76,.55)", letterSpacing: ".09em", textTransform: "uppercase", paddingLeft: 8, marginBottom: 6 }}>Main Menu</div>
        {NAV.map(item => {
          const active = path === item.href || (!!item.href && item.href !== "/dashboard/manager" && path.startsWith(item.href));
          const isEm = (item as { isEmergency?: boolean }).isEmergency;
          return (
            <div key={item.label} onClick={() => item.href && (window.location.href = item.href)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, marginBottom: 2, cursor: item.href ? "pointer" : "default", background: active ? "rgba(201,168,76,.18)" : "transparent", color: active ? "#C9A84C" : isEm && emergencyCount > 0 ? "#FF8A80" : item.href ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.3)", opacity: item.href ? 1 : 0.5, transition: "all .15s" }}>
              <Ic d={item.icon} size={15} />
              <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, flex: 1 }}>{item.label}</span>
              {isEm && emergencyCount > 0 && (
                <span style={{ background: "#C62828", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10, minWidth: 18, textAlign: "center" }}>{emergencyCount}</span>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initStr}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
          <div style={{ fontSize: 10, color: "rgba(201,168,76,.7)" }}>Villa Manager</div>
        </div>
        <div style={{ cursor: "pointer", color: "rgba(255,255,255,.4)" }} onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}><Ic d={P.logout} size={14} /></div>
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [villa, setVilla]         = useState<Villa | null>(null);
  const [villaId, setVillaId]     = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [checkIns, setCheckIns]   = useState<Booking[]>([]);
  const [checkOuts, setCheckOuts] = useState<Booking[]>([]);
  const [services, setServices]   = useState<ServiceOrder[]>([]);
  const [msgs, setMsgs]           = useState<MsgRow[]>([]);
  const [maintCnt, setMaintCnt]   = useState(0);
  const [loading, setLoading]     = useState(true);
  const [emergencies, setEmergencies] = useState<EmergencyAlert[]>([]);
  const [ackingId, setAckingId]   = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      try {
        const { data: profData } = await supabase.from("profiles").select("id,full_name,role").eq("id", user.id).single();
        const prof: Profile | null = profData ?? null;
        if (!prof) { window.location.href = "/"; return; }
        if (prof.role === "super_admin") { window.location.href = "/dashboard/admin";   return; }
        if (prof.role === "villa_owner") { window.location.href = "/dashboard/owner";   return; }
        if (prof.role === "guest")       { window.location.href = "/dashboard/guest";   return; }
        if (prof.role !== "villa_manager") { window.location.href = "/"; return; }
        setProfile(prof); setAuthReady(true);
      } catch { window.location.href = "/"; }
    });
  }, []);

  const fetchVilla = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: vm } = await supabase.from("villa_managers").select("villa_id").eq("manager_id", user.id).single();
    if (!vm?.villa_id) return;
    setVillaId(vm.villa_id);
    const { data: v } = await supabase.from("villas").select("id,name,location,country").eq("id", vm.villa_id).single();
    if (v) setVilla(v as Villa);
  }, []);

  useEffect(() => { if (authReady) fetchVilla(); }, [authReady, fetchVilla]);

  useEffect(() => {
    if (!villaId) return;
    (async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const [{ data: ins }, { data: outs }, { data: svcs }, { data: messages }, { data: maints }, { data: emData }] = await Promise.all([
          supabase.from("bookings").select("id,guest_name,check_in,check_out,status,num_guests,special_requests,check_in_time,ota_channel").eq("villa_id", villaId).eq("check_in", today).in("status", ["confirmed", "pending"]),
          supabase.from("bookings").select("id,guest_name,check_in,check_out,status,num_guests,ota_channel").eq("villa_id", villaId).eq("check_out", today).in("status", ["confirmed", "checked_in"]),
          supabase.from("service_orders").select("id,service_name,service_date,service_time,num_persons,status,guest_name").eq("villa_id", villaId).eq("status", "pending").order("service_date", { ascending: true }).limit(5),
          supabase.from("messages").select("id,guest_name,content,ota_channel,created_at,is_read").eq("villa_id", villaId).eq("is_read", false).order("created_at", { ascending: false }).limit(5),
          supabase.from("maintenance_issues").select("id").eq("villa_id", villaId).eq("status", "open"),
          supabase.from("emergency_alerts").select("id,villa_name,alert_type,description,created_at,status").eq("villa_id", villaId).in("status", ["active", "acknowledged"]).order("created_at", { ascending: false }),
        ]);
        setCheckIns((ins ?? []) as Booking[]);
        setCheckOuts((outs ?? []) as Booking[]);
        setServices((svcs ?? []) as ServiceOrder[]);
        setMsgs((messages ?? []) as MsgRow[]);
        setMaintCnt((maints ?? []).length);
        setEmergencies((emData ?? []) as EmergencyAlert[]);
      } catch {} finally { setLoading(false); }
    })();
  }, [villaId]);

  /* real-time subscription for emergencies */
  const fetchEmergencies = useCallback(async () => {
    if (!villaId) return;
    const { data } = await supabase.from("emergency_alerts")
      .select("id,villa_name,alert_type,description,created_at,status")
      .eq("villa_id", villaId)
      .in("status", ["active", "acknowledged"])
      .order("created_at", { ascending: false });
    setEmergencies((data ?? []) as EmergencyAlert[]);
  }, [villaId]);

  useEffect(() => {
    if (!villaId) return;
    const ch = supabase.channel("em_mgr_dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "emergency_alerts", filter: `villa_id=eq.${villaId}` }, () => fetchEmergencies())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [villaId, fetchEmergencies]);

  const updateSvc = async (id: string, status: string) => {
    await supabase.from("service_orders").update({ status }).eq("id", id);
    setServices(prev => prev.filter(s => s.id !== id));
  };

  async function acknowledgeEmergency(id: string) {
    setAckingId(id);
    await supabase.from("emergency_alerts").update({ status: "acknowledged", acknowledged_at: new Date().toISOString() }).eq("id", id);
    setEmergencies(prev => prev.map(e => e.id === id ? { ...e, status: "acknowledged" } : e));
    setAckingId(null);
  }

  const mgr = profile?.full_name ?? "Manager";
  const initStr = ini(mgr);
  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (!authReady) return (
    <>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#F5F0E8}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #EDE6D6", borderTop: "3px solid #C9A84C", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      </div>
    </>
  );

  const ScheduleCard = ({ title, subtitle, rows, iconD, ic, bg, bd }: { title: string; subtitle: string; rows: Booking[]; iconD: string; ic: string; bg: string; bd: string }) => (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #EDE6D6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 14.5, fontWeight: 700, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C" }}>{title}</h2>
          <p style={{ fontSize: 11, color: "#9E8E6A", marginTop: 1 }}>{subtitle}</p>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: ic }}><Ic d={iconD} size={14} /></div>
      </div>
      {loading
        ? <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>{[...Array(2)].map((_, i) => <Skel key={i} />)}</div>
        : rows.length === 0
          ? <div style={{ padding: 28, textAlign: "center", color: "#C4B89A", fontSize: 12 }}>None today.</div>
          : rows.map(b => (
            <div key={b.id} style={{ padding: "12px 20px", borderBottom: "1px solid #F5F0E8", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: bg, border: `1.5px solid ${bd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: ic, flexShrink: 0 }}>{ini(b.guest_name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#2C2C2C" }}>Guest {ini(b.guest_name)}</span>
                  {b.num_guests != null && <span style={{ fontSize: 11, color: "#9E8E6A" }}>· {b.num_guests} guest{b.num_guests !== 1 ? "s" : ""}</span>}
                  {b.check_in_time && <span style={{ fontSize: 11, color: "#9E8E6A" }}>· {b.check_in_time}</span>}
                  {b.ota_channel && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 20, background: "#F5F0E8", color: "#7A6A50", fontWeight: 600 }}>{b.ota_channel}</span>}
                </div>
                {b.special_requests && <p style={{ fontSize: 11, color: "#7A6A50", marginTop: 2, fontStyle: "italic" }}>📝 {b.special_requests}</p>}
              </div>
            </div>
          ))
      }
    </div>
  );

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{background:#F5F0E8;font-family:Inter,sans-serif}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes flash{0%,100%{background:#FFF0F0}50%{background:#FFE0E0}}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#DDD5C0;border-radius:10px}.mgr-sidebar{width:220px;background:#2C1E0F;display:flex;flex-direction:column;min-height:100vh;position:fixed;top:0;left:0;z-index:100}.mgr-content{margin-left:220px;flex:1}@media(max-width:900px){.mgr-sidebar{width:180px}.mgr-content{margin-left:180px}}@media(max-width:640px){.mgr-sidebar{display:none}.mgr-content{margin-left:0}}`}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar name={mgr} initStr={initStr} emergencyCount={emergencies.filter(e => e.status === "active").length} />
        <div className="mgr-content">
          <div style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 28px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
            <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C2C2C" }}>Staya <span style={{ color: "#C9A84C" }}>Management</span></div>
            <div style={{ fontSize: 12.5, color: "#9E8E6A", fontStyle: "italic" }}>{todayStr}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{initStr}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C" }}>{mgr}</span>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "transparent", color: "#7A6A50", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                <Ic d={P.logout} size={13} /> Logout
              </button>
            </div>
          </div>

          <main style={{ padding: "28px 28px 48px" }}>

            {/* ── EMERGENCY BANNER ─────────────────────────────────────────── */}
            {emergencies.length > 0 && (
              <div style={{ marginBottom: 22, display: "flex", flexDirection: "column", gap: 8 }}>
                {emergencies.map(em => {
                  const isActive = em.status === "active";
                  const typeLabels: Record<string, string> = { medical: "Medical Emergency", security: "Security Issue", fire: "Fire", flood: "Flood / Water Damage", accident: "Accident", other: "Other Urgent Issue" };
                  const typeIcons: Record<string, string> = { medical: "🏥", security: "🔒", fire: "🔥", flood: "💧", accident: "⚠️", other: "📋" };
                  const tAgo = (d: string | null) => { if (!d) return ""; const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000); if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s / 60)}m ago`; return `${Math.floor(s / 3600)}h ago`; };
                  return (
                    <div key={em.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", borderRadius: 12, border: `2px solid ${isActive ? "#FFCDD2" : "#F5D875"}`, animation: isActive ? "flash 2.5s ease infinite" : "none", background: isActive ? "#FFF5F5" : "#FFFBF0", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{typeIcons[em.alert_type ?? "other"] ?? "🚨"}</span>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#C62828" }}>🚨 EMERGENCY ALERT</span>
                          <span style={{ fontSize: 12.5, color: "#7A5210" }}>— {typeLabels[em.alert_type ?? "other"] ?? em.alert_type}</span>
                          <span style={{ fontSize: 11, color: "#C4B89A" }}>{tAgo(em.created_at)}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "#6B5C3E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 340 }}>{em.description ?? "—"}</p>
                      </div>
                      {isActive && (
                        <button onClick={() => acknowledgeEmergency(em.id)} disabled={ackingId === em.id}
                          style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #F5D875", background: "#FFF8E6", color: "#7A5210", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif", flexShrink: 0 }}>
                          {ackingId === em.id ? "…" : "Acknowledge"}
                        </button>
                      )}
                      {!isActive && (
                        <span style={{ padding: "5px 12px", borderRadius: 20, background: "#FFF8E6", color: "#7A5210", border: "1px solid #F5D875", fontSize: 11.5, fontWeight: 700, flexShrink: 0 }}>Acknowledged</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", fontWeight: 700 }}>Welcome, {mgr.split(" ")[0]} 👋</h1>
              {villa
                ? <p style={{ fontSize: 13, color: "#9E8E6A", marginTop: 4 }}>{villa.name}{villa.location ? ` · ${villa.location}` : ""}{villa.country ? `, ${villa.country}` : ""}</p>
                : <p style={{ fontSize: 13, color: "#C4B89A", marginTop: 4 }}>No villa linked to your account yet. Contact admin.</p>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16, marginBottom: 26 }}>
              {[
                { label: "Today's Check-ins",       val: loading ? null : String(checkIns.length),  icon: P.arrIn,  ic: "#1E7A48", bg: "#EDFAF3", bd: "#B0E8CB" },
                { label: "Today's Check-outs",      val: loading ? null : String(checkOuts.length), icon: P.arrOut, ic: "#7A5210", bg: "#FFF8E6", bd: "#F5D875" },
                { label: "Pending Service Orders",  val: loading ? null : String(services.length),  icon: P.star,   ic: "#2B4BA0", bg: "#EEF4FF", bd: "#C0D2F8" },
                { label: "Open Maintenance Issues", val: loading ? null : String(maintCnt),         icon: P.wrench, ic: "#9B2C2C", bg: "#FFF0F0", bd: "#FFCDD2" },
              ].map(c => (
                <div key={c.label} style={{ background: "#fff", borderRadius: 14, padding: "20px 20px 16px", border: "1px solid #EDE6D6", boxShadow: "0 2px 8px rgba(44,30,10,.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <span style={{ fontSize: 11.5, color: "#9E8E6A", fontWeight: 500, lineHeight: 1.3 }}>{c.label}</span>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: c.bg, border: `1px solid ${c.bd}`, display: "flex", alignItems: "center", justifyContent: "center", color: c.ic, flexShrink: 0, marginLeft: 8 }}><Ic d={c.icon} size={15} /></div>
                  </div>
                  {c.val == null ? <Skel w={60} h={28} /> : <div style={{ fontSize: 32, fontWeight: 700, color: "#2C2C2C", fontFamily: "Playfair Display,Georgia,serif" }}>{c.val}</div>}
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 22 }}>
              <ScheduleCard title="Today's Arrivals" subtitle="Guests checking in today" rows={checkIns} iconD={P.arrIn} ic="#1E7A48" bg="#EDFAF3" bd="#B0E8CB" />
              <ScheduleCard title="Today's Departures" subtitle="Guests checking out today" rows={checkOuts} iconD={P.arrOut} ic="#7A5210" bg="#FFF8E6" bd="#F5D875" />
            </div>

            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", overflow: "hidden", marginBottom: 22 }}>
              <div style={{ padding: "16px 22px 12px", borderBottom: "1px solid #EDE6D6" }}>
                <h2 style={{ fontSize: 14.5, fontWeight: 700, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C" }}>Pending Service Orders</h2>
                <p style={{ fontSize: 11, color: "#9E8E6A", marginTop: 1 }}>Guest service requests awaiting your action</p>
              </div>
              {loading
                ? <div style={{ padding: "14px 22px", display: "flex", flexDirection: "column", gap: 10 }}>{[...Array(2)].map((_, i) => <Skel key={i} />)}</div>
                : services.length === 0
                  ? <div style={{ padding: 32, textAlign: "center", color: "#C4B89A", fontSize: 12 }}>No pending service orders.</div>
                  : <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr>{["Service", "Date", "Time", "Persons", "Guest", "Actions"].map(h => (
                        <th key={h} style={{ padding: "9px 18px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "#9E8E6A", letterSpacing: ".07em", textTransform: "uppercase", borderBottom: "1px solid #EDE6D6", background: "#FDFAF5", whiteSpace: "nowrap" }}>{h}</th>
                      ))}</tr></thead>
                      <tbody>{services.map((s, i) => (
                        <tr key={s.id} style={{ background: i % 2 === 0 ? "#fff" : "#FDFAF5" }}>
                          <td style={{ padding: "11px 18px", fontSize: 12.5, fontWeight: 600, color: "#2C2C2C" }}>{s.service_name ?? "—"}</td>
                          <td style={{ padding: "11px 18px", fontSize: 12.5, color: "#2C2C2C" }}>{fmtD(s.service_date)}</td>
                          <td style={{ padding: "11px 18px", fontSize: 12.5, color: "#2C2C2C" }}>{s.service_time ?? "—"}</td>
                          <td style={{ padding: "11px 18px", fontSize: 12.5, color: "#2C2C2C" }}>{s.num_persons ?? "—"}</td>
                          <td style={{ padding: "11px 18px" }}>
                            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#EEF4FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#2B4BA0" }}>{ini(s.guest_name)}</div>
                          </td>
                          <td style={{ padding: "11px 18px" }}>
                            <div style={{ display: "flex", gap: 7 }}>
                              <button onClick={() => updateSvc(s.id, "confirmed")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, border: "none", background: "#EDFAF3", color: "#1E7A48", fontSize: 11, fontWeight: 600, cursor: "pointer" }}><Ic d={P.check} size={11} /> Confirm</button>
                              <button onClick={() => updateSvc(s.id, "completed")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, border: "none", background: "#EEF4FF", color: "#2B4BA0", fontSize: 11, fontWeight: 600, cursor: "pointer" }}><Ic d={P.check} size={11} /> Complete</button>
                            </div>
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
              }
            </div>

            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", overflow: "hidden" }}>
              <div style={{ padding: "16px 22px 12px", borderBottom: "1px solid #EDE6D6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ fontSize: 14.5, fontWeight: 700, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C" }}>Unread Guest Messages</h2>
                  <p style={{ fontSize: 11, color: "#9E8E6A", marginTop: 1 }}>Latest messages from guests</p>
                </div>
                <button onClick={() => window.location.href = "/dashboard/manager/messages/"} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "transparent", color: "#7A6A50", fontSize: 11.5, fontWeight: 500, cursor: "pointer" }}>
                  View All <Ic d={P.arrow} size={12} />
                </button>
              </div>
              {loading
                ? <div style={{ padding: "14px 22px", display: "flex", flexDirection: "column", gap: 10 }}>{[...Array(2)].map((_, i) => <Skel key={i} />)}</div>
                : msgs.length === 0
                  ? <div style={{ padding: 32, textAlign: "center", color: "#C4B89A", fontSize: 12 }}>No unread messages.</div>
                  : msgs.map((m, i) => (
                    <div key={m.id} style={{ padding: "12px 22px", borderBottom: i < msgs.length - 1 ? "1px solid #F5F0E8" : "none", display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EEF4FF", border: "1.5px solid #C0D2F8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#2B4BA0", flexShrink: 0 }}>{ini(m.guest_name)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#2C2C2C" }}>Guest {ini(m.guest_name)}</span>
                          {m.ota_channel && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: "#F5F0E8", color: "#7A6A50", fontWeight: 600 }}>{m.ota_channel}</span>}
                          <span style={{ fontSize: 10.5, color: "#C4B89A", marginLeft: "auto" }}>{fmtD(m.created_at)}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "#7A6A50", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.content ?? "—"}</p>
                      </div>
                      <button onClick={() => window.location.href = "/dashboard/manager/messages/"} style={{ padding: "5px 12px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "transparent", color: "#7A6A50", fontSize: 11, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>Reply</button>
                    </div>
                  ))
              }
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Profile { id: string; full_name: string | null; role: string; }
interface Booking {
  id: string; guest_name: string | null; check_in: string | null; check_out: string | null;
  status: string | null; num_guests: number | null; special_requests: string | null;
  check_in_time: string | null; ota_channel: string | null;
}

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}
function Skel({ h = 72 }: { h?: number }) {
  return <div style={{ height: h, borderRadius: 12, background: "linear-gradient(90deg,#EDE6D6 25%,#F5EFE3 50%,#EDE6D6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />;
}
function ini(n: string | null) { if (!n) return "?"; return n.trim().split(" ").map(w => w[0] ?? "").slice(0, 2).join("").toUpperCase(); }
function fmtD(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
function nighDiff(ci: string | null, co: string | null) {
  if (!ci || !co) return null;
  const n = Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000);
  return n > 0 ? n : null;
}

const P_ALERT = "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z";
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
  users:  "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  arrIn:  "M5 12h14 M12 5l7 7-7 7",
  arrOut: "M19 12H5 M12 19l-7-7 7-7",
};

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

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  confirmed:  { bg: "#EEF4FF", color: "#2B4BA0" },
  checked_in: { bg: "#EDFAF3", color: "#1E7A48" },
  checked_out:{ bg: "#F4F4F4", color: "#555" },
  cancelled:  { bg: "#FFF0F0", color: "#9B2C2C" },
  pending:    { bg: "#FFF8E6", color: "#7A5210" },
};
const OTA_COLORS: Record<string, { bg: string; color: string }> = {
  airbnb:  { bg: "#FFF0F0", color: "#FF5A5F" },
  booking: { bg: "#EEF2FF", color: "#003580" },
  direct:  { bg: "#F0FBF4", color: "#1E7A48" },
  vrbo:    { bg: "#EEF4FF", color: "#1A6B96" },
};

type FilterType = "upcoming" | "active" | "all";

export default function ManagerBookingsPage() {
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [villaId, setVillaId]     = useState<string | null>(null);
  const [villaName, setVillaName] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<FilterType>("upcoming");
  const [expanded, setExpanded]   = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      try {
        const { data: prof } = await supabase.from("profiles").select("id,full_name,role").eq("id", user.id).single();
        if (!prof) { window.location.href = "/"; return; }
        if (prof.role === "super_admin") { window.location.href = "/dashboard/admin";   return; }
        if (prof.role === "villa_owner") { window.location.href = "/dashboard/owner";   return; }
        if (prof.role === "guest")       { window.location.href = "/dashboard/guest";   return; }
        if (prof.role !== "villa_manager") { window.location.href = "/"; return; }
        setProfile(prof);
        const { data: vm } = await supabase.from("villa_managers").select("villa_id").eq("manager_id", user.id).single();
        if (!vm?.villa_id) { setAuthReady(true); return; }
        setVillaId(vm.villa_id);
        const { data: v } = await supabase.from("villas").select("name").eq("id", vm.villa_id).single();
        if (v) setVillaName(v.name ?? null);
        setAuthReady(true);
      } catch { window.location.href = "/"; }
    });
  }, []);

  const fetchBookings = useCallback(async () => {
    if (!villaId) return;
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    try {
      let q = supabase.from("bookings")
        .select("id,guest_name,check_in,check_out,status,num_guests,special_requests,check_in_time,ota_channel")
        .eq("villa_id", villaId)
        .order("check_in", { ascending: true });
      if (filter === "upcoming") q = q.gte("check_in", today).neq("status", "cancelled");
      else if (filter === "active") q = q.lte("check_in", today).gte("check_out", today);
      const { data } = await q.limit(50);
      setBookings((data ?? []) as Booking[]);
    } catch {} finally { setLoading(false); }
  }, [villaId, filter]);

  useEffect(() => { if (authReady && villaId) fetchBookings(); }, [authReady, villaId, filter, fetchBookings]);

  const ownerName = profile?.full_name ?? "Manager";
  const initStr   = ini(ownerName);
  const path      = typeof window !== "undefined" ? window.location.pathname : "";
  const today     = new Date().toISOString().slice(0, 10);

  const checkInToday  = bookings.filter(b => b.check_in?.slice(0, 10) === today);
  const checkOutToday = bookings.filter(b => b.check_out?.slice(0, 10) === today);

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
        .mgr-sidebar{width:220px;background:#2C1E0F;display:flex;flex-direction:column;min-height:100vh;position:fixed;top:0;left:0;z-index:100}
        .mgr-content{margin-left:220px;flex:1}
        @media(max-width:900px){.mgr-sidebar{width:180px}.mgr-content{margin-left:180px}}
        @media(max-width:640px){.mgr-sidebar{display:none}.mgr-content{margin-left:0}}
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>

        <div className="mgr-sidebar">
          <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={P.villa} size={17} /></div>
            <div><div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Playfair Display,Georgia,serif" }}>Staya</div><div style={{ fontSize: 9.5, color: "#C9A84C", letterSpacing: ".1em", textTransform: "uppercase" }}>Management</div></div>
          </div>
          <div style={{ padding: "14px 12px", flex: 1 }}>
            {NAV.map(item => {
              const active = path === item.href || (!!item.href && item.href !== "/dashboard/manager" && path.startsWith(item.href));
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
            <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ownerName}</div><div style={{ fontSize: 10, color: "rgba(201,168,76,.7)" }}>Villa Manager</div></div>
            <div style={{ cursor: "pointer", color: "rgba(255,255,255,.4)" }} onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}><Ic d={P.logout} size={14} /></div>
          </div>
        </div>

        <div className="mgr-content">
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
              <h1 style={{ fontSize: 26, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", fontWeight: 700 }}>Bookings</h1>
              <p style={{ fontSize: 13, color: "#9E8E6A", marginTop: 4 }}>{villaName ?? "Your villa"} — view-only reservation schedule</p>
            </div>

            {/* Today's summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Check-ins Today",  val: String(checkInToday.length),  icon: P.arrIn,  bg: "#EDFAF3", color: "#1E7A48", border: "#B0E8CB" },
                { label: "Check-outs Today", val: String(checkOutToday.length), icon: P.arrOut, bg: "#FFF8E6", color: "#7A5210", border: "#F5D875" },
                { label: "Total Shown",      val: String(bookings.length),       icon: P.cal,    bg: "#F5F0E8", color: "#4A3B27", border: "#EDE6D6" },
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
                { key: "upcoming", label: "Upcoming" },
                { key: "active",   label: "Active Stays" },
                { key: "all",      label: "All" },
              ] as { key: FilterType; label: string }[]).map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${filter===f.key?"#C9A84C":"#EDE6D6"}`, background: filter===f.key?"#FFF8E6":"#fff", color: filter===f.key?"#7A5210":"#6B5C3E", fontSize: 12, fontWeight: filter===f.key?700:500, cursor: "pointer" }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Bookings list */}
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{[...Array(4)].map((_, i) => <Skel key={i} />)}</div>
            ) : bookings.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", padding: 60, textAlign: "center", color: "#C4B89A" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "Playfair Display,Georgia,serif", marginBottom: 4 }}>No {filter === "all" ? "" : filter} bookings</div>
                <div style={{ fontSize: 13 }}>No reservations found for this filter.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {bookings.map(b => {
                  const st   = STATUS_STYLE[b.status ?? "confirmed"] ?? STATUS_STYLE.confirmed;
                  const ota  = OTA_COLORS[(b.ota_channel ?? "direct").toLowerCase()] ?? OTA_COLORS.direct;
                  const nts  = nighDiff(b.check_in, b.check_out);
                  const isCI = b.check_in?.slice(0, 10) === today;
                  const isCO = b.check_out?.slice(0, 10) === today;
                  const isExp = expanded === b.id;
                  return (
                    <div key={b.id} style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${isCI ? "#B0E8CB" : isCO ? "#F5D875" : "#EDE6D6"}`, boxShadow: "0 2px 8px rgba(44,44,44,.04)", overflow: "hidden", animation: "fadeUp .3s ease both" }}>
                      <div style={{ padding: "14px 20px", display: "flex", alignItems: "flex-start", gap: 14, cursor: "pointer" }} onClick={() => setExpanded(isExp ? null : b.id)}>
                        {/* Guest avatar */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>{ini(b.guest_name)}</div>
                          {(isCI || isCO) && (
                            <div style={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: "50%", background: isCI ? "#1E7A48" : "#7A5210", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Ic d={isCI ? P.arrIn : P.arrOut} size={7} />
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginBottom: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#2C2C2C" }}>{b.guest_name ?? "Guest"}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: "2px 9px", borderRadius: 20 }}>
                              {(b.status ?? "confirmed").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                            {b.ota_channel && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: ota.color, background: ota.bg, padding: "2px 9px", borderRadius: 20 }}>
                                {b.ota_channel.replace(/\b\w/g, c => c.toUpperCase())}
                              </span>
                            )}
                            {isCI && <span style={{ fontSize: 11, fontWeight: 700, color: "#1E7A48", background: "#EDFAF3", padding: "2px 9px", borderRadius: 20 }}>Check-in Today</span>}
                            {isCO && <span style={{ fontSize: 11, fontWeight: 700, color: "#7A5210", background: "#FFF8E6", padding: "2px 9px", borderRadius: 20 }}>Check-out Today</span>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: "#6B5C3E" }}><strong>In:</strong> {fmtD(b.check_in)}</span>
                            <span style={{ fontSize: 12, color: "#6B5C3E" }}><strong>Out:</strong> {fmtD(b.check_out)}</span>
                            {nts && <span style={{ fontSize: 12, color: "#9E8E6A" }}>{nts} night{nts !== 1 ? "s" : ""}</span>}
                            {b.num_guests != null && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6B5C3E" }}>
                                <Ic d={P.users} size={12} />{b.num_guests} guest{b.num_guests !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#C4B89A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExp ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0, marginTop: 4 }}><path d="M6 9l6 6 6-6"/></svg>
                      </div>
                      {isExp && (
                        <div style={{ padding: "0 20px 18px 76px", borderTop: "1px solid #F0EBE0" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14, marginTop: 16 }}>
                            {b.check_in_time && (
                              <div>
                                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4 }}>Check-in Time</div>
                                <div style={{ fontSize: 13, color: "#2C2C2C" }}>{b.check_in_time}</div>
                              </div>
                            )}
                            {b.num_guests != null && (
                              <div>
                                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4 }}>Guests</div>
                                <div style={{ fontSize: 13, color: "#2C2C2C" }}>{b.num_guests} person{b.num_guests !== 1 ? "s" : ""}</div>
                              </div>
                            )}
                          </div>
                          {b.special_requests && (
                            <div style={{ marginTop: 14 }}>
                              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>Special Requests</div>
                              <p style={{ fontSize: 13.5, color: "#2C2C2C", lineHeight: 1.65, background: "#FFF8E6", padding: "12px 16px", borderRadius: 10, border: "1px solid #F5D875" }}>{b.special_requests}</p>
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

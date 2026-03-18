"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Profile { id: string; full_name: string | null; role: string; }
interface Booking {
  id: string; guest_name: string | null; check_in: string | null; check_out: string | null;
  status: string | null; total_amount: number | null; ota_channel: string | null;
  num_guests: number | null; created_at: string | null;
}

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}
function Skel({ w = "100%", h = 14 }: { w?: string | number; h?: number }) {
  return <div style={{ width: w, height: h, borderRadius: 6, background: "linear-gradient(90deg,#EDE6D6 25%,#F5EFE3 50%,#EDE6D6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />;
}
function ini(n: string | null) { if (!n) return "?"; return n.trim().split(" ").map(w => w[0] ?? "").slice(0, 2).join("").toUpperCase(); }
function fmtDate(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
function fmtMoney(n: number | null, cur = "USD") { if (n == null) return "—"; if (cur === "IDR") return `Rp ${n.toLocaleString("id-ID")}`; return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n); }
function nights(a: string | null, b: string | null) { if (!a || !b) return "—"; return String(Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))); }

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

const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  confirmed:   { bg: "#EDFAF3", color: "#1E7A48", dot: "#2D8A57" },
  pending:     { bg: "#FFF8E6", color: "#7A5210", dot: "#C9A84C" },
  cancelled:   { bg: "#FFF0F0", color: "#9B2C2C", dot: "#C53030" },
  checked_in:  { bg: "#EEF4FF", color: "#2B4BA0", dot: "#3B63C9" },
  checked_out: { bg: "#F4F4F4", color: "#555",    dot: "#999"    },
  completed:   { bg: "#EDFAF3", color: "#1E7A48", dot: "#2D8A57" },
};

type StatusFilter = "all" | "upcoming" | "confirmed" | "checked_in" | "checked_out" | "cancelled";

export default function OwnerBookingsPage() {
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [villaId, setVillaId]   = useState<string | null>(null);
  const [villaName, setVillaName] = useState<string | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [authReady, setAuthReady] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<StatusFilter>("upcoming");

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
        const { data: v } = await supabase.from("villas").select("name,currency").eq("id", ov.villa_id).single();
        if (v) { setVillaName(v.name ?? null); if (v.currency) setCurrency(v.currency); }
        setAuthReady(true);
      } catch { window.location.href = "/"; }
    });
  }, []);

  const fetchBookings = useCallback(async () => {
    if (!villaId) return;
    setLoading(true);
    try {
      let q = supabase.from("bookings")
        .select("id,guest_name,check_in,check_out,status,total_amount,ota_channel,num_guests,created_at")
        .eq("villa_id", villaId)
        .order("check_in", { ascending: false });
      if (filter === "upcoming") {
        const td = new Date().toISOString().slice(0, 10);
        q = q.gte("check_in", td).in("status", ["confirmed", "pending", "checked_in"]);
      } else if (filter !== "all") {
        q = q.eq("status", filter);
      }
      const { data } = await q.limit(60);
      setBookings((data ?? []) as Booking[]);
    } catch {} finally { setLoading(false); }
  }, [villaId, filter]);

  useEffect(() => { if (authReady && villaId) fetchBookings(); }, [authReady, villaId, filter, fetchBookings]);

  const ownerName = profile?.full_name ?? "Owner";
  const initStr = ini(ownerName);
  const path = typeof window !== "undefined" ? window.location.pathname : "";

  const totalRevenue = bookings.reduce((s, b) => s + (b.total_amount ?? 0), 0);
  const confirmedCnt = bookings.filter(b => b.status === "confirmed" || b.status === "checked_in").length;

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
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:#DDD5C0;border-radius:10px}
        .owner-sidebar{width:220px;background:#2C1E0F;display:flex;flex-direction:column;min-height:100vh;position:fixed;top:0;left:0;z-index:100}
        .owner-content{margin-left:220px;flex:1}
        @media(max-width:900px){.owner-sidebar{width:180px}.owner-content{margin-left:180px}}
        @media(max-width:640px){.owner-sidebar{display:none}.owner-content{margin-left:0}}
        .trow:hover td{background:#FDFAF5!important}
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>

        {/* Sidebar */}
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
          {/* Top bar */}
          <div style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 28px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
            <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C2C2C" }}>Staya Management</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{initStr}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C" }}>{ownerName}</span>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "transparent", color: "#7A6A50", fontSize: 12, cursor: "pointer" }}><Ic d={P.logout} size={13} /> Logout</button>
            </div>
          </div>

          <main style={{ padding: "28px 28px 48px" }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", fontWeight: 700 }}>Bookings</h1>
              <p style={{ fontSize: 13, color: "#9E8E6A", marginTop: 4 }}>{villaName ?? "Your villa"} — guest names are shown as initials for privacy</p>
            </div>

            {/* Summary chips */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Showing", val: String(bookings.length), sub: "bookings", bg: "#F5F0E8", color: "#4A3B27", border: "#EDE6D6" },
                { label: "Confirmed / Active", val: String(confirmedCnt), sub: "bookings", bg: "#EDFAF3", color: "#1E7A48", border: "#B0E8CB" },
                { label: "Total Revenue", val: fmtMoney(totalRevenue, currency), sub: "in this view", bg: "#FFF8E6", color: "#7A5210", border: "#F5D875" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "14px 18px", border: `1.5px solid ${s.border}` }}>
                  <div style={{ fontSize: 11, color: s.color, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "Playfair Display,Georgia,serif" }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: s.color, opacity: .65, marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {([
                { key: "upcoming",    label: "Upcoming" },
                { key: "all",         label: "All" },
                { key: "confirmed",   label: "Confirmed" },
                { key: "checked_in",  label: "Checked In" },
                { key: "checked_out", label: "Checked Out" },
                { key: "cancelled",   label: "Cancelled" },
              ] as { key: StatusFilter; label: string }[]).map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${filter===f.key?"#C9A84C":"#EDE6D6"}`, background: filter===f.key?"#FFF8E6":"#fff", color: filter===f.key?"#7A5210":"#6B5C3E", fontSize: 12, fontWeight: filter===f.key?700:500, cursor: "pointer" }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Table */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", overflow: "hidden", animation: "fadeUp .3s ease both" }}>
              {loading ? (
                <div style={{ padding: "24px 22px", display: "flex", flexDirection: "column", gap: 12 }}>{[...Array(5)].map((_, i) => <Skel key={i} />)}</div>
              ) : bookings.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center", color: "#C4B89A" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
                  <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "Playfair Display,Georgia,serif", marginBottom: 4 }}>No bookings found</div>
                  <div style={{ fontSize: 13 }}>Try a different filter.</div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>
                      {["Guest", "Check-In", "Check-Out", "Nights", "Guests", "Amount", "OTA", "Status"].map(h => (
                        <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "#9E8E6A", letterSpacing: ".07em", textTransform: "uppercase", borderBottom: "1px solid #EDE6D6", background: "#FDFAF5", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {bookings.map((b, i) => {
                        const st = STATUS_STYLE[b.status ?? ""] ?? { bg: "#F0EBE0", color: "#7A6A4F", dot: "#C4B89A" };
                        return (
                          <tr key={b.id} className="trow" style={{ background: i % 2 === 0 ? "#fff" : "#FDFAF5" }}>
                            <td style={{ padding: "12px 18px" }}>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#F5F0E8", border: "1.5px solid #EDE6D6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#7A6A50" }}>{ini(b.guest_name)}</div>
                            </td>
                            <td style={{ padding: "12px 18px", fontSize: 12.5, color: "#2C2C2C", fontWeight: 500 }}>{fmtDate(b.check_in)}</td>
                            <td style={{ padding: "12px 18px", fontSize: 12.5, color: "#2C2C2C" }}>{fmtDate(b.check_out)}</td>
                            <td style={{ padding: "12px 18px", fontSize: 12.5, fontWeight: 700, color: "#2C2C2C" }}>{nights(b.check_in, b.check_out)}</td>
                            <td style={{ padding: "12px 18px", fontSize: 12.5, color: "#2C2C2C" }}>{b.num_guests ?? "—"}</td>
                            <td style={{ padding: "12px 18px", fontSize: 13, fontWeight: 700, color: "#C9A84C", fontFamily: "Playfair Display,Georgia,serif" }}>{fmtMoney(b.total_amount, currency)}</td>
                            <td style={{ padding: "12px 18px" }}>
                              {b.ota_channel ? <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#F5F0E8", color: "#7A6A50", fontWeight: 600 }}>{b.ota_channel}</span> : <span style={{ color: "#C4B89A", fontSize: 12 }}>—</span>}
                            </td>
                            <td style={{ padding: "12px 18px" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: st.bg, color: st.color, fontSize: 11.5, fontWeight: 700 }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot }} />
                                {(b.status ?? "—").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <p style={{ fontSize: 11.5, color: "#C4B89A", marginTop: 14, textAlign: "center" }}>
              🔒 Guest names are shown as initials only. Contact your manager for full guest details.
            </p>
          </main>
        </div>
      </div>
    </>
  );
}

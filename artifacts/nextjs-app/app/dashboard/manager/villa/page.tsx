"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Profile { id: string; full_name: string | null; role: string; }
interface Villa {
  id: string; name: string | null; location: string | null; country: string | null;
  bedrooms: number | null; bathrooms: number | null; max_guests: number | null;
  pool: boolean | null; description: string | null; currency: string | null;
  ota_airbnb: boolean | null; ota_booking: boolean | null; ota_vrbo: boolean | null; ota_expedia: boolean | null;
}

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}
function Skel({ h = 20 }: { h?: number }) {
  return <div style={{ height: h, borderRadius: 6, background: "linear-gradient(90deg,#EDE6D6 25%,#F5EFE3 50%,#EDE6D6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />;
}
function ini(n: string | null) { if (!n) return "?"; return n.trim().split(" ").map(w => w[0] ?? "").slice(0, 2).join("").toUpperCase(); }

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
  pin:    "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  bed:    "M2 4v16 M2 8h18a2 2 0 0 1 2 2v10 M2 17h20 M6 8v9",
  users:  "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
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

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ display: "flex", gap: 12, paddingBottom: 14, borderBottom: "1px solid #F0EBE0" }}>
      <div style={{ width: 140, fontSize: 11.5, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".04em", textTransform: "uppercase", paddingTop: 2, flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#2C2C2C", flex: 1 }}>{value ?? "—"}</div>
    </div>
  );
}

export default function ManagerVillaPage() {
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [villa, setVilla]         = useState<Villa | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading]     = useState(true);

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
        if (!vm?.villa_id) { setAuthReady(true); setLoading(false); return; }
        const { data: v } = await supabase.from("villas")
          .select("id,name,location,country,bedrooms,bathrooms,max_guests,pool,description,currency,ota_airbnb,ota_booking,ota_vrbo,ota_expedia")
          .eq("id", vm.villa_id).single();
        if (v) setVilla(v as Villa);
        setAuthReady(true); setLoading(false);
      } catch { window.location.href = "/"; }
    });
  }, []);

  const ownerName = profile?.full_name ?? "Manager";
  const initStr   = ini(ownerName);
  const path      = typeof window !== "undefined" ? window.location.pathname : "";

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

          <main style={{ padding: "28px 24px 48px", maxWidth: 720, margin: "0 auto" }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 26, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", fontWeight: 700 }}>My Villa</h1>
              <p style={{ fontSize: 13, color: "#9E8E6A", marginTop: 4 }}>Property details for your assigned villa</p>
            </div>

            {loading ? (
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
                {[...Array(6)].map((_, i) => <Skel key={i} />)}
              </div>
            ) : !villa ? (
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", padding: 60, textAlign: "center", color: "#C4B89A" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🏡</div>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "Playfair Display,Georgia,serif" }}>No villa assigned</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Contact your administrator to be assigned to a villa.</div>
              </div>
            ) : (
              <>
                {/* Villa header card */}
                <div style={{ background: "#2C1E0F", borderRadius: 16, padding: "24px 28px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Ic d={P.villa} size={26} />
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "Playfair Display,Georgia,serif", marginBottom: 4 }}>{villa.name ?? "Villa"}</div>
                    {(villa.location || villa.country) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "rgba(201,168,76,.8)" }}>
                        <Ic d={P.pin} size={13} />{[villa.location, villa.country].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12, marginBottom: 20 }}>
                  {[
                    { label: "Bedrooms",    val: villa.bedrooms  != null ? String(villa.bedrooms)  : "—", icon: P.bed },
                    { label: "Bathrooms",   val: villa.bathrooms != null ? String(villa.bathrooms) : "—", icon: P.bed },
                    { label: "Max Guests",  val: villa.max_guests != null ? String(villa.max_guests) : "—", icon: P.users },
                    { label: "Pool",        val: villa.pool ? "Yes" : villa.pool === false ? "No" : "—", icon: P.villa },
                  ].map(s => (
                    <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #EDE6D6", textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "#9E8E6A", fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#2C2C2C", fontFamily: "Playfair Display,Georgia,serif" }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Details card */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
                  <h2 style={{ fontSize: 15.5, fontWeight: 700, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", marginBottom: 4 }}>Property Details</h2>
                  <InfoRow label="Villa Name"  value={villa.name} />
                  <InfoRow label="Location"    value={villa.location} />
                  <InfoRow label="Country"     value={villa.country} />
                  <InfoRow label="Currency"    value={villa.currency} />
                  {villa.description && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 8 }}>Description</div>
                      <p style={{ fontSize: 13.5, color: "#4A3B27", lineHeight: 1.7, background: "#FDFAF5", padding: "14px 18px", borderRadius: 10, border: "1px solid #EDE6D6" }}>{villa.description}</p>
                    </div>
                  )}
                </div>

                {/* OTA channels */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", padding: "24px 28px", marginTop: 16 }}>
                  <h2 style={{ fontSize: 15.5, fontWeight: 700, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", marginBottom: 16 }}>Active Sales Channels</h2>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {[
                      { key: "ota_airbnb",   label: "Airbnb",   active: villa.ota_airbnb,   color: "#FF5A5F" },
                      { key: "ota_booking",  label: "Booking",  active: villa.ota_booking,  color: "#003580" },
                      { key: "ota_vrbo",     label: "Vrbo",     active: villa.ota_vrbo,     color: "#1A6B96" },
                      { key: "ota_expedia",  label: "Expedia",  active: villa.ota_expedia,  color: "#FFC72C" },
                    ].map(ch => (
                      <div key={ch.key} style={{ padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: ch.active ? ch.color + "18" : "#F5F5F5", color: ch.active ? ch.color : "#C4B89A", border: `1.5px solid ${ch.active ? ch.color + "40" : "#EDE6D6"}` }}>
                        {ch.active ? "✓ " : "○ "}{ch.label}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

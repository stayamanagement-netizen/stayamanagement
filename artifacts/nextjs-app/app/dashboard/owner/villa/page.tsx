"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Profile { id: string; full_name: string | null; role: string; }
interface Villa {
  id: string; name: string | null; location: string | null; country: string | null;
  bedrooms: number | null; capacity: number | null; currency: string | null;
  description: string | null; is_active: boolean | null;
  base_rate: number | null;
  rate_low_season: number | null; rate_mid_season: number | null;
  rate_high_season: number | null; rate_super_high_season: number | null;
  ota_airbnb: boolean | null; ota_booking: boolean | null;
  ota_vrbo: boolean | null; ota_expedia: boolean | null;
  has_spare_bed: boolean | null;
  max_spare_beds: number | null;
  spare_bed_description: string | null;
  spare_bed_rate_low_season: number | null;
  spare_bed_rate_mid_season: number | null;
  spare_bed_rate_high_season: number | null;
  spare_bed_rate_super_high_season: number | null;
}

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}
function Skel({ w = "100%", h = 14 }: { w?: string | number; h?: number }) {
  return <div style={{ width: w, height: h, borderRadius: 6, background: "linear-gradient(90deg,#EDE6D6 25%,#F5EFE3 50%,#EDE6D6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />;
}
function fmtMoney(n: number | null, cur = "USD") {
  if (n == null) return "—";
  if (cur === "IDR") return `Rp ${n.toLocaleString("id-ID")}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
}

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
  pin:     "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  bed:     "M3 9l.9-2.7A2 2 0 0 1 5.8 5h12.4a2 2 0 0 1 1.9 1.3L21 9H3zM1 9h22v5a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9zM4 16v2m16-2v2",
  users:   "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  globe:   "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  img:     "M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
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

const AMENITIES = ["Private Pool","Air Conditioning","Wi-Fi","Full Kitchen","BBQ Area","Beach Access","Garden View","Daily Cleaning","In-Villa Chef","Airport Transfer","Yoga Deck","Security 24/7"];

export default function OwnerVillaPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [villa, setVilla]     = useState<Villa | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

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

  useEffect(() => {
    if (!authReady) return;
    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: ov } = await supabase.from("villa_owners").select("villa_id").eq("owner_id", user.id).single();
        if (!ov?.villa_id) return;
        const { data: v } = await supabase.from("villas").select("*").eq("id", ov.villa_id).single();
        if (v) setVilla(v as Villa);
      } catch {} finally { setLoading(false); }
    })();
  }, [authReady]);

  const ownerName = profile?.full_name ?? "Owner";
  const initStr = ownerName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const cur = villa?.currency ?? "USD";
  const path = typeof window !== "undefined" ? window.location.pathname : "";

  const SEASONAL = [
    { label: "💚 Low Season",        key: "rate_low_season" as const,        hint: "Off-peak" },
    { label: "🟡 Mid Season",        key: "rate_mid_season" as const,        hint: "Shoulder" },
    { label: "🟠 High Season",       key: "rate_high_season" as const,       hint: "Peak period" },
    { label: "🔴 Super High Season", key: "rate_super_high_season" as const,  hint: "Holidays & events" },
  ];
  const OTAS = [
    { key: "ota_airbnb" as const,  label: "Airbnb",   color: "#FF5A5F" },
    { key: "ota_booking" as const, label: "Booking",  color: "#003580" },
    { key: "ota_vrbo" as const,    label: "Vrbo",     color: "#1A6B96" },
    { key: "ota_expedia" as const, label: "Expedia",  color: "#FFC72C" },
  ];

  const sidebar = (
    <div className="owner-sidebar">
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={P.villa} size={17} /></div>
        <div><div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Playfair Display,Georgia,serif" }}>Staya</div><div style={{ fontSize: 9.5, color: "#C9A84C", letterSpacing: ".1em", textTransform: "uppercase" }}>Management</div></div>
      </div>
      <div style={{ padding: "14px 12px", flex: 1 }}>
        {NAV.map(item => {
          const active = path === item.href || (item.href && item.href !== "/dashboard/owner" && path.startsWith(item.href));
          return (
            <div key={item.label} onClick={() => item.href && (window.location.href = item.href)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, marginBottom: 2, cursor: item.href ? "pointer" : "default", background: active ? "rgba(201,168,76,.18)" : "transparent", color: active ? "#C9A84C" : item.href ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.3)", opacity: item.href ? 1 : 0.5, transition: "all .15s" }}>
              <Ic d={item.icon} size={15} /><span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, color: "#fff" }}>{initStr}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ownerName}</div>
          <div style={{ fontSize: 10, color: "rgba(201,168,76,.7)" }}>Villa Owner</div>
        </div>
        <div style={{ cursor: "pointer", color: "rgba(255,255,255,.4)" }} onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}><Ic d={P.logout} size={14} /></div>
      </div>
    </div>
  );

  function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid #F5F0E8" }}>
        <span style={{ fontSize: 12.5, color: "#9E8E6A", fontWeight: 500, minWidth: 140 }}>{label}</span>
        <span style={{ fontSize: 13, color: "#2C2C2C", fontWeight: 600, textAlign: "right" }}>{value ?? "—"}</span>
      </div>
    );
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{background:#F5F0E8;font-family:Inter,sans-serif}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}.owner-sidebar{width:220px;background:#2C1E0F;display:flex;flex-direction:column;min-height:100vh;position:fixed;top:0;left:0;z-index:100}.owner-content{margin-left:220px;flex:1}@media(max-width:900px){.owner-sidebar{width:180px}.owner-content{margin-left:180px}}@media(max-width:640px){.owner-sidebar{display:none}.owner-content{margin-left:0}}`}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        {sidebar}
        <div className="owner-content">
          <div style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 28px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
            <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C2C2C" }}>Staya Management</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{initStr}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C" }}>{ownerName}</span>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "transparent", color: "#7A6A50", fontSize: 12, cursor: "pointer" }}>
                <Ic d={P.logout} size={13} /> Logout
              </button>
            </div>
          </div>

          <main style={{ padding: "28px 28px 48px" }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", fontWeight: 700 }}>My Villa</h1>
              <p style={{ fontSize: 13, color: "#9E8E6A", marginTop: 4 }}>Property details — view only</p>
            </div>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{[...Array(4)].map((_, i) => <Skel key={i} h={60} />)}</div>
            ) : !villa ? (
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", padding: 48, textAlign: "center", color: "#C4B89A", fontSize: 14 }}>No villa linked to your account yet.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* photo placeholder */}
                <div style={{ gridColumn: "1 / -1", background: "linear-gradient(135deg,#EDE6D6,#DDD0B8)", borderRadius: 16, height: 220, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, border: "1px solid #DDD5C0" }}>
                  <div style={{ color: "#C4B89A" }}><Ic d={P.img} size={40} /></div>
                  <div style={{ fontSize: 14, color: "#C4B89A", fontWeight: 600 }}>Photo Gallery</div>
                  <div style={{ fontSize: 12, color: "#C4B89A" }}>Photos will appear here once uploaded</div>
                </div>

                {/* villa details */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <h2 style={{ fontSize: 19, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", fontWeight: 700 }}>{villa.name ?? "—"}</h2>
                      {(villa.location || villa.country) && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, color: "#9E8E6A", fontSize: 12.5 }}>
                          <Ic d={P.pin} size={12} />{[villa.location, villa.country].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </div>
                    <span style={{ padding: "4px 12px", borderRadius: 20, background: villa.is_active ? "#EDFAF3" : "#F5F0E8", color: villa.is_active ? "#1E7A48" : "#9E8E6A", fontSize: 11, fontWeight: 700, border: `1px solid ${villa.is_active ? "#B0E8CB" : "#DDD5C0"}` }}>
                      {villa.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <InfoRow label="Bedrooms" value={villa.bedrooms ? `${villa.bedrooms} bedroom${villa.bedrooms !== 1 ? "s" : ""}` : "—"} />
                  <InfoRow label="Max Capacity" value={villa.capacity ? `${villa.capacity} guests` : "—"} />
                  <InfoRow label="Currency" value={villa.currency ?? "—"} />
                  <InfoRow label="Base Rate" value={villa.base_rate != null ? <>{fmtMoney(villa.base_rate, cur)}<span style={{ fontSize: 11, color: "#9E8E6A", fontWeight: 400 }}>/night</span></> : "—"} />
                  {villa.description && (
                    <div style={{ marginTop: 14, padding: "12px 14px", background: "#FDFBF7", borderRadius: 10, border: "1px solid #EDE6D6", fontSize: 13, color: "#4A3B27", lineHeight: 1.6 }}>{villa.description}</div>
                  )}
                </div>

                {/* seasonal rates */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", overflow: "hidden" }}>
                  <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #EDE6D6" }}>
                    <h2 style={{ fontSize: 15.5, fontWeight: 700, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C" }}>Seasonal Rates</h2>
                    <p style={{ fontSize: 11.5, color: "#9E8E6A", marginTop: 2 }}>Nightly pricing by season</p>
                  </div>
                  <div style={{ padding: "8px 0" }}>
                    {SEASONAL.map((s, i) => (
                      <div key={s.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 22px", borderBottom: i < 3 ? "1px solid #F5F0E8" : "none" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C" }}>{s.label}</div>
                          <div style={{ fontSize: 11, color: "#9E8E6A", marginTop: 1 }}>{s.hint}</div>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: villa[s.key] != null ? "#C9A84C" : "#C4B89A" }}>
                          {villa[s.key] != null ? <>{fmtMoney(villa[s.key]!, cur)}<span style={{ fontSize: 11, fontWeight: 400, color: "#9E8E6A" }}>/night</span></> : "Not set"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* OTA channels */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", padding: "20px 22px" }}>
                  <h2 style={{ fontSize: 15.5, fontWeight: 700, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", marginBottom: 4 }}>OTA Channels</h2>
                  <p style={{ fontSize: 11.5, color: "#9E8E6A", marginBottom: 16 }}>Connected booking platforms</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {OTAS.map(ota => {
                      const on = !!villa[ota.key];
                      return (
                        <div key={ota.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${on ? ota.color + "44" : "#EDE6D6"}`, background: on ? ota.color + "0D" : "#FDFBF7" }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: on ? ota.color : "#DDD5C0", border: `2px solid ${on ? ota.color : "#C4B89A"}` }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: on ? "#2C2C2C" : "#9E8E6A" }}>{ota.label}</span>
                          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: on ? "#1E7A48" : "#C4B89A" }}>{on ? "Connected" : "Not linked"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* spare bed */}
                {villa.has_spare_bed && (
                  <div style={{ gridColumn: "1 / -1", background: "#fff", borderRadius: 16, border: "1.5px solid #F5D875", boxShadow: "0 2px 10px rgba(44,44,44,.05)", overflow: "hidden" }}>
                    <div style={{ padding: "16px 22px 12px", background: "#FFF8E6", borderBottom: "1px solid #F5D875", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>🛏️</span>
                      <div>
                        <h2 style={{ fontSize: 15.5, fontWeight: 700, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C" }}>Spare Bed Available</h2>
                        {villa.spare_bed_description && <p style={{ fontSize: 12, color: "#7A5210", marginTop: 2 }}>{villa.spare_bed_description}</p>}
                      </div>
                      {villa.max_spare_beds && (
                        <span style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 20, background: "#FFF8E6", border: "1px solid #F5D875", fontSize: 12, fontWeight: 700, color: "#7A5210" }}>
                          Max {villa.max_spare_beds} bed{villa.max_spare_beds !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: "8px 0" }}>
                      {[
                        { label: "💚 Low Season",        val: villa.spare_bed_rate_low_season },
                        { label: "🟡 Mid Season",        val: villa.spare_bed_rate_mid_season },
                        { label: "🟠 High Season",       val: villa.spare_bed_rate_high_season },
                        { label: "🔴 Super High Season", val: villa.spare_bed_rate_super_high_season },
                      ].map((r, i, arr) => (
                        <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 22px", borderBottom: i < arr.length - 1 ? "1px solid #F5F0E8" : "none" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C" }}>{r.label}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: r.val != null ? "#C9A84C" : "#C4B89A" }}>
                            {r.val != null ? <>{fmtMoney(r.val, cur)}<span style={{ fontSize: 11, fontWeight: 400, color: "#9E8E6A" }}>/night</span></> : "Not set"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* amenities */}
                <div style={{ gridColumn: "1 / -1", background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", padding: "20px 22px" }}>
                  <h2 style={{ fontSize: 15.5, fontWeight: 700, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", marginBottom: 4 }}>Amenities</h2>
                  <p style={{ fontSize: 11.5, color: "#9E8E6A", marginBottom: 16 }}>Standard features of your villa</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {AMENITIES.map(a => (
                      <span key={a} style={{ padding: "6px 14px", borderRadius: 20, background: "#F5F0E8", border: "1px solid #EDE6D6", fontSize: 12.5, color: "#4A3B27", fontWeight: 500 }}>✓ {a}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

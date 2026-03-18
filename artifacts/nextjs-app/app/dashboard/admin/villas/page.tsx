"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/* ─── types ─────────────────────────────────────────────────────────────────── */
interface Villa {
  id: string;
  name: string | null;
  location: string | null;
  country: string | null;
  bedrooms: number | null;
  capacity: number | null;
  base_rate: number | null;
  rate_low_season: number | null;
  rate_mid_season: number | null;
  rate_high_season: number | null;
  rate_super_high_season: number | null;
  currency: string | null;
  description: string | null;
  is_active: boolean | null;
  ota_airbnb: boolean | null;
  ota_booking: boolean | null;
  ota_vrbo: boolean | null;
  ota_expedia: boolean | null;
  has_spare_bed: boolean | null;
  max_spare_beds: number | null;
  spare_bed_description: string | null;
  spare_bed_rate_low_season: number | null;
  spare_bed_rate_mid_season: number | null;
  spare_bed_rate_high_season: number | null;
  spare_bed_rate_super_high_season: number | null;
}
interface BookingRow {
  check_in: string | null;
  check_out: string | null;
  status: string | null;
}
type VillaForm = Omit<Villa, "id">;

const EMPTY_FORM: VillaForm = {
  name: "", location: "", country: "", bedrooms: 2, capacity: 4,
  base_rate: null, rate_low_season: null, rate_mid_season: null, rate_high_season: null, rate_super_high_season: null,
  currency: "USD", description: "",
  is_active: true, ota_airbnb: false, ota_booking: false, ota_vrbo: false, ota_expedia: false,
  has_spare_bed: false, max_spare_beds: null, spare_bed_description: null,
  spare_bed_rate_low_season: null, spare_bed_rate_mid_season: null,
  spare_bed_rate_high_season: null, spare_bed_rate_super_high_season: null,
};

/* ─── SVG icon paths ────────────────────────────────────────────────────────── */
const P = {
  home:   "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  villa:  "M3 22h18 M4 22V9l8-7 8 7v13 M9 22V16h6v6 M9 10h.01 M15 10h.01",
  cal:    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  channel:"M22 12h-4l-3 9L9 3l-3 9H2",
  msg:    "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  cash:   "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  wrench: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  service:"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  doc:    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  pay:    "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z",
  cog:    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  plus:   "M12 5v14M5 12h14",
  edit:   "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  eye:    "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  close:  "M18 6L6 18M6 6l12 12",
  bed:    "M3 9l.9-2.7A2 2 0 0 1 5.8 5h12.4a2 2 0 0 1 1.9 1.3L21 9H3zM1 9h22v5a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9zM4 16v2m16-2v2",
  users:  "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  pin:    "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
};

const NAV = [
  { label: "Dashboard",       icon: P.home,    href: "/dashboard/admin" },
  { label: "Villas",          icon: P.villa,   href: "/dashboard/admin/villas" },
  { label: "Bookings",        icon: P.cal,     href: "/dashboard/admin/bookings" },
  { label: "Channel Manager", icon: P.channel, href: "/dashboard/admin/channel-manager" },
  { label: "Messages",        icon: P.msg,     href: "/dashboard/admin/messages" },
  { label: "Petty Cash",      icon: P.cash,    href: "/dashboard/admin/petty-cash" },
  { label: "Maintenance",     icon: P.wrench,  href: "/dashboard/admin/maintenance" },
  { label: "Services",        icon: P.service, href: "/dashboard/admin/services" },
  { label: "Owner Statements",icon: P.doc,     href: null },
  { label: "Payments",        icon: P.pay,     href: "/dashboard/admin/payments" },
  { label: "Settings",        icon: P.cog,     href: "/dashboard/admin/settings" },
];

const OTA_CHANNELS = [
  { key: "ota_airbnb",  label: "Airbnb",       color: "#FF5A5F" },
  { key: "ota_booking", label: "Booking",       color: "#003580" },
  { key: "ota_vrbo",    label: "Vrbo",          color: "#1A6B96" },
  { key: "ota_expedia", label: "Expedia",       color: "#FFC72C" },
] as const;

const CURRENCIES = ["USD", "EUR", "AUD", "SGD", "IDR"];

/* ─── helpers ───────────────────────────────────────────────────────────────── */
function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((seg, i) => (
        <path key={i} d={i === 0 ? seg : "M" + seg} />
      ))}
    </svg>
  );
}

function fmt(amount: number | null, currency: string | null) {
  if (amount == null) return "—";
  const c = currency ?? "USD";
  if (c === "IDR") return `Rp ${amount.toLocaleString("id-ID")}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(amount);
}

function calcOccupancy(bookings: BookingRow[]): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const relevant = bookings.filter(b =>
    ["confirmed", "checked_in", "checked_out"].includes(b.status ?? "")
  );
  let nights = 0;
  for (const b of relevant) {
    const ci = new Date(b.check_in ?? "");
    const co = new Date(b.check_out ?? "");
    const start = ci < monthStart ? monthStart : ci;
    const end   = co > monthEnd   ? monthEnd   : co;
    if (end > start) nights += Math.ceil((end.getTime() - start.getTime()) / 86400000);
  }
  return Math.min(100, Math.round((nights / daysInMonth) * 100));
}

/* ─── mini components ───────────────────────────────────────────────────────── */
function OccupancyBar({ pct }: { pct: number }) {
  const color = pct >= 70 ? "#1E7A48" : pct >= 40 ? "#C9A84C" : "#A0906E";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#9E8E6A", fontFamily: "Inter,sans-serif" }}>Occupancy this month</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "Inter,sans-serif" }}>{pct}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: "#EDE6D6", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width .4s ease" }} />
      </div>
    </div>
  );
}

function OtaDots({ villa }: { villa: Villa }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {OTA_CHANNELS.map(ch => {
        const connected = !!villa[ch.key as keyof Villa];
        return (
          <div key={ch.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: connected ? ch.color : "transparent",
              border: `2px solid ${connected ? ch.color : "#C4B89A"}`,
              transition: "all .2s",
            }} />
            <span style={{ fontSize: 9, color: connected ? "#4A3B27" : "#C4B89A", fontFamily: "Inter,sans-serif", fontWeight: 600, letterSpacing: ".02em" }}>{ch.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── villa card ────────────────────────────────────────────────────────────── */
function VillaCard({ villa, occ, onEdit }: { villa: Villa; occ: number; onEdit: (v: Villa) => void }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "22px 22px 18px",
      boxShadow: "0 2px 12px rgba(44,30,10,.07)", display: "flex", flexDirection: "column", gap: 14,
      border: "1px solid #EDE6D6", transition: "box-shadow .2s, transform .2s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 24px rgba(44,30,10,.12)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(44,30,10,.07)"; (e.currentTarget as HTMLDivElement).style.transform = ""; }}
    >
      {/* header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {villa.name ?? "Untitled"}
          </h3>
          {(villa.location || villa.country) && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              <span style={{ color: "#C9A84C" }}><Ic d={P.pin} size={12} /></span>
              <span style={{ fontSize: 12, color: "#9E8E6A", fontFamily: "Inter,sans-serif" }}>
                {[villa.location, villa.country].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
        </div>
        <span style={{
          fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", fontFamily: "Inter,sans-serif",
          padding: "3px 10px", borderRadius: 20,
          background: villa.is_active ? "#EDFAF3" : "#F5F0E8",
          color: villa.is_active ? "#1E7A48" : "#9E8E6A",
          border: `1px solid ${villa.is_active ? "#B0E8CB" : "#DDD5C0"}`,
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
          {villa.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* stats row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#F5F0E8", borderRadius: 8, padding: "5px 10px" }}>
          <span style={{ color: "#C9A84C" }}><Ic d={P.bed} size={13} /></span>
          <span style={{ fontSize: 12, color: "#4A3B27", fontFamily: "Inter,sans-serif", fontWeight: 600 }}>{villa.bedrooms ?? "—"} bed{villa.bedrooms !== 1 ? "s" : ""}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#F5F0E8", borderRadius: 8, padding: "5px 10px" }}>
          <span style={{ color: "#C9A84C" }}><Ic d={P.users} size={13} /></span>
          <span style={{ fontSize: 12, color: "#4A3B27", fontFamily: "Inter,sans-serif", fontWeight: 600 }}>Max {villa.capacity ?? "—"}</span>
        </div>
      </div>

      {/* seasonal pricing */}
      <div style={{ background: "#FDFBF7", border: "1px solid #EDE6D6", borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ fontSize: 10, color: "#C4B89A", fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 2 }}>Seasonal Rates</div>
        {[
          { label: "Low Season",        emoji: "💚", val: villa.rate_low_season },
          { label: "Mid Season",        emoji: "🟡", val: villa.rate_mid_season },
          { label: "High Season",       emoji: "🟠", val: villa.rate_high_season },
          { label: "Super High Season", emoji: "🔴", val: villa.rate_super_high_season },
        ].map(row => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#7A6A50", fontFamily: "Inter,sans-serif" }}>{row.emoji} {row.label}</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: row.val != null ? "#2C2C2C" : "#C4B89A", fontFamily: "Inter,sans-serif" }}>
              {row.val != null ? <>{fmt(row.val, villa.currency)}<span style={{ fontSize: 10, fontWeight: 500, color: "#9E8E6A" }}>/night</span></> : "—"}
            </span>
          </div>
        ))}
      </div>

      {/* occupancy */}
      <OccupancyBar pct={occ} />

      {/* OTA channels */}
      <div>
        <div style={{ fontSize: 10, color: "#C4B89A", fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 6, fontFamily: "Inter,sans-serif" }}>OTA Channels</div>
        <OtaDots villa={villa} />
      </div>

      {/* spare bed badge */}
      {villa.has_spare_bed && (
        <div style={{ display: "flex" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "#FFF8E6", border: "1px solid #F5D875", fontSize: 11.5, fontWeight: 600, color: "#7A5210" }}>
            🛏️ +Spare bed available
          </span>
        </div>
      )}

      {/* actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
        <button onClick={() => onEdit(villa)} style={{
          flex: 1, padding: "8px 0", borderRadius: 8, border: "1.5px solid #C9A84C",
          background: "transparent", color: "#C9A84C", fontSize: 12.5, fontWeight: 600,
          fontFamily: "Inter,sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          transition: "background .15s, color .15s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#C9A84C"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#C9A84C"; }}
        >
          <Ic d={P.edit} size={13} /> Edit
        </button>
        <button style={{
          flex: 1, padding: "8px 0", borderRadius: 8, border: "1.5px solid #EDE6D6",
          background: "#F5F0E8", color: "#7A6A50", fontSize: 12.5, fontWeight: 600,
          fontFamily: "Inter,sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          transition: "border-color .15s, color .15s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#C9A84C"; (e.currentTarget as HTMLButtonElement).style.color = "#C9A84C"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#EDE6D6"; (e.currentTarget as HTMLButtonElement).style.color = "#7A6A50"; }}
        >
          <Ic d={P.eye} size={13} /> View
        </button>
      </div>
    </div>
  );
}

/* ─── iCal sync section ─────────────────────────────────────────────────────── */
const ICAL_CHANNELS = [
  { key: "airbnb",      label: "Airbnb",       color: "#FF5A5F", bg: "#FFF0F0", placeholder: "https://www.airbnb.com/calendar/ical/…" },
  { key: "booking_com", label: "Booking.com",  color: "#003580", bg: "#EEF2FF", placeholder: "https://ical.booking.com/…" },
  { key: "vrbo",        label: "Vrbo",         color: "#1A6B96", bg: "#EEF4FF", placeholder: "https://www.vrbo.com/icalendar/…" },
  { key: "expedia",     label: "Expedia",      color: "#D7910A", bg: "#FFF8E6", placeholder: "https://www.expedia.com/…" },
] as const;

type ICalKey = typeof ICAL_CHANNELS[number]["key"];

function getICalData(villaId: string) {
  try {
    const raw = localStorage.getItem(`staya_ical_${villaId}`);
    return raw ? JSON.parse(raw) as Record<string, { url: string; lastSynced: string | null }> : {};
  } catch { return {}; }
}
function setICalData(villaId: string, data: Record<string, { url: string; lastSynced: string | null }>) {
  try { localStorage.setItem(`staya_ical_${villaId}`, JSON.stringify(data)); } catch {}
}
function fmtSynced(ts: string | null) {
  if (!ts) return null;
  const d = new Date(ts);
  const now = new Date();
  const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.round(diffMin / 60)}h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function ICalSection({ villaId }: { villaId: string }) {
  const [data, setData] = useState<Record<string, { url: string; lastSynced: string | null }>>(() => getICalData(villaId));
  const [syncing, setSyncing] = useState<Record<ICalKey, boolean>>({ airbnb: false, booking_com: false, vrbo: false, expedia: false });

  function updateUrl(key: ICalKey, url: string) {
    const next = { ...data, [key]: { url, lastSynced: data[key]?.lastSynced ?? null } };
    setData(next);
    setICalData(villaId, next);
  }

  async function syncNow(key: ICalKey) {
    const url = data[key]?.url;
    if (!url?.trim()) return;
    setSyncing(s => ({ ...s, [key]: true }));
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
    const next = { ...data, [key]: { url, lastSynced: new Date().toISOString() } };
    setData(next);
    setICalData(villaId, next);
    setSyncing(s => ({ ...s, [key]: false }));
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#7A6A50", letterSpacing: ".05em", textTransform: "uppercase", fontFamily: "Inter,sans-serif" }}>
          iCal Import (Channel Sync)
        </div>
        <div style={{ flex: 1, height: 1, background: "#EDE6D6" }} />
      </div>
      <div style={{ background: "#EEF4FF", borderRadius: 10, padding: "10px 13px", border: "1px solid #C0D2F8", marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 8 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#2B4BA0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p style={{ fontSize: 11.5, color: "#2B4BA0", margin: 0, lineHeight: 1.6, fontFamily: "Inter,sans-serif" }}>
          Paste each channel's iCal export URL — bookings will be imported automatically. URLs are stored per-browser. Click <strong>Sync Now</strong> to pull the latest calendar.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ICAL_CHANNELS.map(ch => {
          const entry = data[ch.key] ?? { url: "", lastSynced: null };
          const isSync = syncing[ch.key];
          const synced = fmtSynced(entry.lastSynced);
          return (
            <div key={ch.key} style={{ border: `1.5px solid ${entry.url ? ch.color + "55" : "#DDD5C0"}`, borderRadius: 10, overflow: "hidden", transition: "border-color .2s" }}>
              {/* header row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: entry.url ? ch.bg : "#FAFAFA", borderBottom: "1px solid #EDE6D6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: ch.color }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#2C2C2C", fontFamily: "Inter,sans-serif" }}>{ch.label}</span>
                  {synced && (
                    <span style={{ fontSize: 10.5, color: "#1E7A48", background: "#EDFAF3", padding: "2px 7px", borderRadius: 10, fontFamily: "Inter,sans-serif" }}>
                      ✓ Synced {synced}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => syncNow(ch.key as ICalKey)}
                  disabled={!entry.url?.trim() || isSync}
                  style={{
                    padding: "4px 12px", borderRadius: 6, border: "none",
                    background: (!entry.url?.trim() || isSync) ? "#EDE6D6" : ch.color,
                    color: (!entry.url?.trim() || isSync) ? "#C4B89A" : "#fff",
                    fontSize: 11.5, fontWeight: 700, cursor: entry.url?.trim() && !isSync ? "pointer" : "default",
                    display: "flex", alignItems: "center", gap: 5, transition: "all .15s", fontFamily: "Inter,sans-serif",
                  }}
                >
                  {isSync
                    ? <><svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ animation: "spin .7s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Syncing…</>
                    : <>↻ Sync Now</>
                  }
                </button>
              </div>
              {/* URL input */}
              <div style={{ padding: "10px 12px", background: "#fff" }}>
                <input
                  type="url"
                  value={entry.url}
                  onChange={e => updateUrl(ch.key as ICalKey, e.target.value)}
                  placeholder={ch.placeholder}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #DDD5C0", borderRadius: 8, fontSize: 12, fontFamily: "monospace", color: "#2C2C2C", background: "#FDFBF7", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── modal ─────────────────────────────────────────────────────────────────── */
function VillaModal({ mode, initial, onClose, onSaved }: {
  mode: "add" | "edit";
  initial: VillaForm & { id?: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<VillaForm & { id?: string }>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof VillaForm>(key: K, val: VillaForm[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    if (!form.name?.trim()) { setError("Villa name is required."); return; }
    setSaving(true); setError(null);
    const payload = {
      name: form.name?.trim() ?? null,
      location: form.location?.trim() || null,
      country: form.country?.trim() || null,
      bedrooms: form.bedrooms ?? null,
      capacity: form.capacity ?? null,
      base_rate: form.base_rate ?? null,
      rate_low_season: form.rate_low_season ?? null,
      rate_mid_season: form.rate_mid_season ?? null,
      rate_high_season: form.rate_high_season ?? null,
      rate_super_high_season: form.rate_super_high_season ?? null,
      currency: form.currency ?? "USD",
      description: form.description?.trim() || null,
      is_active: form.is_active ?? true,
      ota_airbnb: form.ota_airbnb ?? false,
      ota_booking: form.ota_booking ?? false,
      ota_vrbo: form.ota_vrbo ?? false,
      ota_expedia: form.ota_expedia ?? false,
      has_spare_bed: form.has_spare_bed ?? false,
      max_spare_beds: form.has_spare_bed ? (form.max_spare_beds ?? null) : null,
      spare_bed_description: form.has_spare_bed ? (form.spare_bed_description?.trim() || null) : null,
      spare_bed_rate_low_season: form.has_spare_bed ? (form.spare_bed_rate_low_season ?? null) : null,
      spare_bed_rate_mid_season: form.has_spare_bed ? (form.spare_bed_rate_mid_season ?? null) : null,
      spare_bed_rate_high_season: form.has_spare_bed ? (form.spare_bed_rate_high_season ?? null) : null,
      spare_bed_rate_super_high_season: form.has_spare_bed ? (form.spare_bed_rate_super_high_season ?? null) : null,
    };
    let err = null;
    if (mode === "edit" && form.id) {
      const res = await supabase.from("villas").update(payload).eq("id", form.id);
      err = res.error;
    } else {
      const res = await supabase.from("villas").insert([payload]);
      err = res.error;
    }
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", border: "1.5px solid #DDD5C0", borderRadius: 8,
    fontSize: 13, fontFamily: "Inter,sans-serif", color: "#2C2C2C", background: "#FDFBF7",
    outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11.5, fontWeight: 600, color: "#7A6A50", letterSpacing: ".04em",
    fontFamily: "Inter,sans-serif", marginBottom: 5, display: "block",
  };
  const fieldStyle: React.CSSProperties = { display: "flex", flexDirection: "column" };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(44,28,10,.45)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 640,
        maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(44,28,10,.25)",
        display: "flex", flexDirection: "column",
      }}>
        {/* modal header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #EDE6D6", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1, borderRadius: "16px 16px 0 0" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 19, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C" }}>
              {mode === "add" ? "Add New Villa" : "Edit Villa"}
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9E8E6A", fontFamily: "Inter,sans-serif" }}>
              {mode === "add" ? "Enter the details for your new property" : "Update the property details"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "#F5F0E8", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7A6A50" }}>
            <Ic d={P.close} size={15} />
          </button>
        </div>

        {/* form body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* row 1 */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Villa Name *</label>
            <input style={inputStyle} value={form.name ?? ""} onChange={e => set("name", e.target.value)} placeholder="e.g. Villa Serenity" />
          </div>

          {/* row 2: location + country */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Location</label>
              <input style={inputStyle} value={form.location ?? ""} onChange={e => set("location", e.target.value)} placeholder="e.g. Seminyak, Bali" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Country</label>
              <input style={inputStyle} value={form.country ?? ""} onChange={e => set("country", e.target.value)} placeholder="e.g. Indonesia" />
            </div>
          </div>

          {/* row 3: bedrooms + capacity */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Bedrooms</label>
              <input type="number" min={1} style={inputStyle} value={form.bedrooms ?? ""} onChange={e => set("bedrooms", parseInt(e.target.value) || 1)} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Max Capacity (guests)</label>
              <input type="number" min={1} style={inputStyle} value={form.capacity ?? ""} onChange={e => set("capacity", parseInt(e.target.value) || 1)} />
            </div>
          </div>

          {/* row 4: currency */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Currency</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={form.currency ?? "USD"} onChange={e => set("currency", e.target.value)}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* seasonal pricing */}
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", letterSpacing: ".04em", fontFamily: "Inter,sans-serif", marginBottom: 10 }}>Seasonal Pricing (/night)</div>
            <div style={{ background: "#FDFBF7", border: "1.5px solid #EDE6D6", borderRadius: 10, overflow: "hidden" }}>
              {([
                { key: "rate_low_season",        label: "💚 Low Season",        hint: "Off-peak, lowest demand" },
                { key: "rate_mid_season",        label: "🟡 Mid Season",        hint: "Shoulder period" },
                { key: "rate_high_season",       label: "🟠 High Season",       hint: "Peak travel period" },
                { key: "rate_super_high_season", label: "🔴 Super High Season", hint: "Holidays & peak events" },
              ] as const).map((row, i) => (
                <div key={row.key} style={{ display: "grid", gridTemplateColumns: "1fr 160px", alignItems: "center", gap: 0, borderBottom: i < 3 ? "1px solid #EDE6D6" : "none" }}>
                  <div style={{ padding: "10px 14px", borderRight: "1px solid #EDE6D6" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C", fontFamily: "Inter,sans-serif" }}>{row.label}</div>
                    <div style={{ fontSize: 11, color: "#9E8E6A", fontFamily: "Inter,sans-serif", marginTop: 1 }}>{row.hint}</div>
                  </div>
                  <div style={{ padding: "0 12px", display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="number" min={0} step={1}
                      placeholder="—"
                      style={{ ...inputStyle, textAlign: "right", border: "none", background: "transparent", padding: "10px 4px", fontSize: 14, fontWeight: 700, width: "100%" }}
                      value={form[row.key] ?? ""}
                      onChange={e => set(row.key, e.target.value === "" ? null : (parseFloat(e.target.value) || 0))}
                    />
                    <span style={{ fontSize: 11, color: "#9E8E6A", fontFamily: "Inter,sans-serif", whiteSpace: "nowrap" }}>/night</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* spare bed section */}
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", letterSpacing: ".04em", fontFamily: "Inter,sans-serif", marginBottom: 10 }}>Spare Bed</div>
            {/* toggle row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: form.has_spare_bed ? "#FFF8E6" : "#F5F0E8", borderRadius: form.has_spare_bed ? "10px 10px 0 0" : 10, border: "1.5px solid #EDE6D6", borderBottom: form.has_spare_bed ? "none" : "1.5px solid #EDE6D6", transition: "all .2s" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C", fontFamily: "Inter,sans-serif" }}>🛏️ Spare bed available?</div>
                <div style={{ fontSize: 11.5, color: "#9E8E6A", fontFamily: "Inter,sans-serif", marginTop: 1 }}>Offer additional sleeping arrangements for guests</div>
              </div>
              <div onClick={() => set("has_spare_bed", !form.has_spare_bed)} style={{ width: 44, height: 24, borderRadius: 12, background: form.has_spare_bed ? "#C9A84C" : "#DDD5C0", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: form.has_spare_bed ? 23 : 3, transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)" }} />
              </div>
            </div>

            {/* conditional fields */}
            {form.has_spare_bed && (
              <div style={{ border: "1.5px solid #EDE6D6", borderTop: "none", borderRadius: "0 0 10px 10px", background: "#FDFBF7", padding: "14px 14px 10px", display: "flex", flexDirection: "column", gap: 12 }}>
                {/* max + description row */}
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12 }}>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Max spare beds</label>
                    <input type="number" min={1} max={10} style={inputStyle} value={form.max_spare_beds ?? ""} onChange={e => set("max_spare_beds", e.target.value === "" ? null : parseInt(e.target.value) || 1)} placeholder="e.g. 2" />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Description</label>
                    <input style={inputStyle} value={form.spare_bed_description ?? ""} onChange={e => set("spare_bed_description", e.target.value || null)} placeholder="e.g. Extra mattress, rollaway bed, baby cot available on request" />
                  </div>
                </div>

                {/* spare bed seasonal rates */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#9E8E6A", letterSpacing: ".04em", fontFamily: "Inter,sans-serif", marginBottom: 8, textTransform: "uppercase" }}>Spare Bed Nightly Rates</div>
                  <div style={{ background: "#fff", border: "1px solid #EDE6D6", borderRadius: 8, overflow: "hidden" }}>
                    {([
                      { key: "spare_bed_rate_low_season",        label: "💚 Low Season",        hint: "Off-peak" },
                      { key: "spare_bed_rate_mid_season",        label: "🟡 Mid Season",        hint: "Shoulder" },
                      { key: "spare_bed_rate_high_season",       label: "🟠 High Season",       hint: "Peak period" },
                      { key: "spare_bed_rate_super_high_season", label: "🔴 Super High Season", hint: "Holidays & events" },
                    ] as const).map((row, i) => (
                      <div key={row.key} style={{ display: "grid", gridTemplateColumns: "1fr 150px", alignItems: "center", borderBottom: i < 3 ? "1px solid #EDE6D6" : "none" }}>
                        <div style={{ padding: "9px 12px", borderRight: "1px solid #EDE6D6" }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#2C2C2C", fontFamily: "Inter,sans-serif" }}>{row.label}</div>
                          <div style={{ fontSize: 10.5, color: "#9E8E6A", fontFamily: "Inter,sans-serif", marginTop: 1 }}>{row.hint}</div>
                        </div>
                        <div style={{ padding: "0 10px", display: "flex", alignItems: "center", gap: 5 }}>
                          <input type="number" min={0} step={1} placeholder="—"
                            style={{ ...inputStyle, textAlign: "right", border: "none", background: "transparent", padding: "9px 4px", fontSize: 13.5, fontWeight: 700, width: "100%" }}
                            value={form[row.key] ?? ""}
                            onChange={e => set(row.key, e.target.value === "" ? null : (parseFloat(e.target.value) || 0))}
                          />
                          <span style={{ fontSize: 10.5, color: "#9E8E6A", whiteSpace: "nowrap" }}>/night</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* description */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical", lineHeight: 1.5 }} value={form.description ?? ""} onChange={e => set("description", e.target.value)} placeholder="A short description of the villa..." />
          </div>

          {/* OTA channels */}
          <div>
            <label style={{ ...labelStyle, marginBottom: 10 }}>OTA Channels</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {OTA_CHANNELS.map(ch => {
                const val = !!form[ch.key as keyof VillaForm];
                return (
                  <label key={ch.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${val ? ch.color : "#DDD5C0"}`, cursor: "pointer", background: val ? `${ch.color}10` : "#FDFBF7", transition: "all .15s" }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: val ? ch.color : "transparent", border: `2px solid ${val ? ch.color : "#C4B89A"}`, flexShrink: 0 }} />
                    <input type="checkbox" style={{ display: "none" }} checked={val} onChange={e => set(ch.key as keyof VillaForm, e.target.checked as never)} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: val ? "#2C2C2C" : "#9E8E6A", fontFamily: "Inter,sans-serif" }}>{ch.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* iCal sync section — edit mode only */}
          {mode === "edit" && form.id && (
            <ICalSection villaId={form.id} />
          )}

          {/* active toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#F5F0E8", borderRadius: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C", fontFamily: "Inter,sans-serif" }}>Active</div>
              <div style={{ fontSize: 11.5, color: "#9E8E6A", fontFamily: "Inter,sans-serif" }}>Show this villa in the system and accept bookings</div>
            </div>
            <div onClick={() => set("is_active", !form.is_active)} style={{
              width: 44, height: 24, borderRadius: 12,
              background: form.is_active ? "#C9A84C" : "#DDD5C0",
              cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3, left: form.is_active ? 23 : 3,
                transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)",
              }} />
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 8, fontSize: 12.5, color: "#C62828", fontFamily: "Inter,sans-serif" }}>
              {error}
            </div>
          )}
        </div>

        {/* modal footer */}
        <div style={{ padding: "14px 24px 20px", borderTop: "1px solid #EDE6D6", display: "flex", gap: 10, justifyContent: "flex-end", position: "sticky", bottom: 0, background: "#fff", borderRadius: "0 0 16px 16px" }}>
          <button onClick={onClose} style={{ padding: "9px 22px", borderRadius: 8, border: "1.5px solid #DDD5C0", background: "transparent", color: "#7A6A50", fontSize: 13, fontWeight: 600, fontFamily: "Inter,sans-serif", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "9px 26px", borderRadius: 8, border: "none", background: saving ? "#E8D89A" : "#C9A84C", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "Inter,sans-serif", cursor: saving ? "wait" : "pointer", transition: "background .15s" }}>
            {saving ? "Saving…" : mode === "add" ? "Add Villa" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── skeleton card ─────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "22px 22px 18px", border: "1px solid #EDE6D6", display: "flex", flexDirection: "column", gap: 14 }}>
      {[80, 60, 40, 20].map(w => (
        <div key={w} style={{ height: 12, width: `${w}%`, background: "#EDE6D6", borderRadius: 6, animation: "shimmer 1.5s infinite" }} />
      ))}
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
    </div>
  );
}

/* ─── main page ─────────────────────────────────────────────────────────────── */
export default function VillasPage() {
  const [villas, setVillas] = useState<Villa[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | { mode: "add" | "edit"; data: VillaForm & { id?: string } }>(null);
  const [sidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, bRes] = await Promise.all([
        supabase.from("villas").select("*").order("name"),
        supabase.from("bookings").select("check_in, check_out, status"),
      ]);
      if (vRes.error) console.error("villas error:", vRes.error.message);
      if (bRes.error) console.error("bookings error:", bRes.error.message);
      setVillas((vRes.data ?? []) as Villa[]);
      setBookings((bRes.data ?? []) as BookingRow[]);
    } catch (e) {
      console.error("fetchData error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      supabase.from("profiles").select("id,full_name,role").eq("id", user.id).single()
        .then(({ data }) => { if (data) setProfile(data as any); }, () => {});
    });
  }, [fetchData]);

  function openAdd() { setModal({ mode: "add", data: { ...EMPTY_FORM } }); }
  function openEdit(v: Villa) {
    setModal({ mode: "edit", data: {
      id: v.id, name: v.name, location: v.location, country: v.country,
      bedrooms: v.bedrooms, capacity: v.capacity, base_rate: v.base_rate,
      rate_low_season: v.rate_low_season, rate_mid_season: v.rate_mid_season,
      rate_high_season: v.rate_high_season, rate_super_high_season: v.rate_super_high_season,
      currency: v.currency ?? "USD", description: v.description, is_active: v.is_active ?? true,
      ota_airbnb: v.ota_airbnb ?? false, ota_booking: v.ota_booking ?? false,
      ota_vrbo: v.ota_vrbo ?? false, ota_expedia: v.ota_expedia ?? false,
      has_spare_bed: v.has_spare_bed ?? false,
      max_spare_beds: v.max_spare_beds ?? null,
      spare_bed_description: v.spare_bed_description ?? null,
      spare_bed_rate_low_season: v.spare_bed_rate_low_season ?? null,
      spare_bed_rate_mid_season: v.spare_bed_rate_mid_season ?? null,
      spare_bed_rate_high_season: v.spare_bed_rate_high_season ?? null,
      spare_bed_rate_super_high_season: v.spare_bed_rate_super_high_season ?? null,
    }});
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "A";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F5F0E8", fontFamily: "Inter,sans-serif" }}>
      <style>{`
        *{box-sizing:border-box;}
        .nav-item{display:flex;align-items:center;gap:10px;width:100%;padding:9px 18px;border:none;background:transparent;color:#7A6A50;font-size:13px;font-family:Inter,sans-serif;cursor:pointer;text-align:left;border-left:3px solid transparent;transition:all .15s;}
        .nav-item:hover{background:#F5F0E8;color:#4A3B27;}
        .nav-item.active{background:#FBF6EA;color:#2C2C2C;border-left:3px solid #C9A84C;font-weight:600;}
        .nav-item.active .nav-icon{color:#C9A84C;}
        @media(max-width:768px){
          .sidebar{width:52px!important;}
          .sidebar-label,.sidebar-section-label,.sidebar-user-name,.sidebar-user-role{display:none!important;}
          .nav-item{padding:10px 0!important;justify-content:center;}
          .nav-item .nav-icon{margin:0!important;}
          .sidebar-user{justify-content:center!important;padding:10px 0!important;}
          .content-area{padding:16px!important;}
          .page-header{flex-direction:column!important;align-items:flex-start!important;gap:12px!important;}
          .villas-grid{grid-template-columns:1fr!important;}
        }
        @media(min-width:769px) and (max-width:1024px){
          .villas-grid{grid-template-columns:repeat(2,1fr)!important;}
        }
        @keyframes shimmer{0%,100%{opacity:1}50%{opacity:.45}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* ── sidebar ── */}
      <aside className="sidebar" style={{
        width: sidebarCollapsed ? 52 : 210, background: "#2C1E0F", minHeight: "100vh",
        display: "flex", flexDirection: "column", flexShrink: 0,
        position: "sticky", top: 0, height: "100vh", zIndex: 100,
        transition: "width .25s ease", overflow: "hidden",
      }}>
        {/* logo */}
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" />
            </svg>
          </div>
          <div className="sidebar-label">
            <div style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 700, fontFamily: "Playfair Display,Georgia,serif", letterSpacing: ".02em" }}>Staya</div>
            <div style={{ color: "#C4B89A", fontSize: 9.5, letterSpacing: ".15em", textTransform: "uppercase" }}>Management</div>
          </div>
        </div>

        {/* nav */}
        <nav style={{ padding: "12px 0", flex: 1, overflowY: "auto" }}>
          <div className="sidebar-section-label" style={{ fontSize: 9.5, color: "#C4B89A", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, padding: "0 18px", marginBottom: 6 }}>Main Menu</div>
          {NAV.map(item => {
            const isActive = item.label === "Villas";
            return (
              <button key={item.label} className={`nav-item${isActive ? " active" : ""}`}
                onClick={() => { if (item.href) window.location.href = item.href; }}
              >
                <span className="nav-icon" style={{ color: isActive ? "#C9A84C" : "#A0906E", flexShrink: 0 }}>
                  <Ic d={item.icon} size={15} />
                </span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* user */}
        <div className="sidebar-user" style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials}</div>
          <div className="sidebar-user-name" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#F5F0E8", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile?.full_name ?? "Admin"}</div>
            <div className="sidebar-user-role" style={{ color: "#C9A84C", fontSize: 10.5, fontWeight: 600 }}>Super Admin</div>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} style={{ background: "none", border: "none", cursor: "pointer", color: "#A0906E", padding: 4 }}>
            <Ic d={P.logout} size={14} />
          </button>
        </div>
      </aside>

      {/* ── main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* topbar */}
        <header style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 28px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#FBF6EA", display: "flex", alignItems: "center", justifyContent: "center", color: "#C9A84C" }}>
              <Ic d={P.villa} size={17} />
            </div>
            <div>
              <span style={{ fontSize: 16, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", fontWeight: 700 }}>Staya </span>
              <span style={{ fontSize: 16, fontFamily: "Playfair Display,Georgia,serif", color: "#C9A84C", fontWeight: 700 }}>Management</span>
            </div>
          </div>
          <span style={{ fontSize: 12, color: "#C9A84C", fontStyle: "italic", fontFamily: "Playfair Display,Georgia,serif", display: "none" }} className="top-date">{today}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#F5F0E8", borderRadius: 20, padding: "5px 12px 5px 6px" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>{initials}</div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "#4A3B27", fontFamily: "Inter,sans-serif" }}>Admin</span>
            </div>
          </div>
        </header>

        {/* content */}
        <main className="content-area" style={{ padding: "28px 28px 40px", flex: 1 }}>
          {/* page header */}
          <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", fontWeight: 700 }}>Villas</h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9E8E6A" }}>Manage your properties</p>
            </div>
            <button onClick={openAdd} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "10px 20px",
              background: "#C9A84C", color: "#fff", border: "none", borderRadius: 10,
              fontSize: 13.5, fontWeight: 700, fontFamily: "Inter,sans-serif", cursor: "pointer",
              boxShadow: "0 2px 8px rgba(201,168,76,.35)", transition: "background .15s, transform .1s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#B8942F"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#C9A84C"; }}
            >
              <Ic d={P.plus} size={15} /> Add New Villa
            </button>
          </div>

          {/* villas count */}
          {!loading && (
            <div style={{ marginBottom: 20, fontSize: 13, color: "#9E8E6A" }}>
              {villas.length} {villas.length === 1 ? "villa" : "villas"} · {villas.filter(v => v.is_active).length} active
            </div>
          )}

          {/* grid */}
          {loading ? (
            <div className="villas-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : villas.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: "#EDE6D6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#C9A84C" }}>
                <Ic d={P.villa} size={28} />
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 18, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C" }}>No villas yet</h3>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#9E8E6A" }}>Add your first property to get started.</p>
              <button onClick={openAdd} style={{ padding: "10px 24px", background: "#C9A84C", color: "#fff", border: "none", borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
                Add New Villa
              </button>
            </div>
          ) : (
            <div className="villas-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
              {villas.map(v => (
                <VillaCard key={v.id} villa={v} occ={calcOccupancy(bookings)} onEdit={openEdit} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* modal */}
      {modal && (
        <VillaModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchData(); }}
        />
      )}
    </div>
  );
}

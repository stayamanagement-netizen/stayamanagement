"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";

/* ─── interfaces ────────────────────────────────────────────────────────────── */
interface Profile { id: string; full_name: string | null; role: string; }
interface Villa {
  id: string; name: string | null; currency: string | null;
  rate_low_season: number | null; rate_mid_season: number | null;
  rate_high_season: number | null; rate_super_high_season: number | null;
  base_rate: number | null; has_spare_bed: boolean | null;
  spare_bed_rate_low_season: number | null; spare_bed_rate_mid_season: number | null;
  spare_bed_rate_high_season: number | null; spare_bed_rate_super_high_season: number | null;
}
/* Real bookings table columns from Supabase:
   id, villa_id, guest_id, guest_name, guest_email,
   check_in, check_out, nights, total_amount, currency,
   ota_channel, ota_booking_id, status, is_paid, notes, created_at */
interface Booking {
  id: string;
  villa_id: string | null;
  villa_name: string | null;       // resolved from villas join
  guest_name: string | null;
  guest_email: string | null;
  check_in: string | null;
  check_out: string | null;
  nights: number | null;
  total_amount: number | null;
  currency: string | null;
  ota_channel: string | null;
  ota_booking_id: string | null;
  status: string | null;
  is_paid: boolean | null;
  notes: string | null;
  created_at: string | null;
}
interface BookingForm {
  villa_id: string;
  guest_name: string;
  guest_email: string;
  num_guests: number;
  check_in: string;
  check_out: string;
  ota_channel: string;
  ota_booking_id: string;
  notes: string;
}
interface Toast { msg: string; type: "success" | "error"; }

/* ─── constants ─────────────────────────────────────────────────────────────── */
const OTA_CHANNELS = ["Airbnb", "Booking.com", "Vrbo", "Expedia", "Direct", "Other"];
const DIRECT_CHANNELS = ["direct"] as const; // Only lowercase values accepted by DB constraint
const OTA_COLORS: Record<string, { bg: string; color: string }> = {
  "airbnb":      { bg: "#FFF0F0", color: "#FF5A5F" },
  "booking.com": { bg: "#EEF2FF", color: "#003580" },
  "vrbo":        { bg: "#EEF4FF", color: "#1A6B96" },
  "expedia":     { bg: "#FFF8E6", color: "#7A5210" },
  "direct":      { bg: "#EDFAF3", color: "#1E7A48" },
  "other":       { bg: "#F4F4F4", color: "#555" },
};
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  confirmed:   { bg: "#EDFAF3", color: "#1E7A48" },
  pending:     { bg: "#FFF8E6", color: "#7A5210" },
  cancelled:   { bg: "#FFF0F0", color: "#9B2C2C" },
  checked_in:  { bg: "#EEF4FF", color: "#2B4BA0" },
  checked_out: { bg: "#F4F4F4", color: "#555" },
  completed:   { bg: "#EDFAF3", color: "#1E7A48" },
};

/* ─── icon paths ─────────────────────────────────────────────────────────────── */
const P_ALERT = "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z";
const P = {
  home:    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  villa:   "M3 22h18 M4 22V9l8-7 8 7v13 M9 22V16h6v6 M9 10h.01 M15 10h.01",
  cal:     "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  channel: "M22 12h-4l-3 9L9 3l-3 9H2",
  msg:     "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  cash:    "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  wrench:  "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  service: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  doc:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  pay:     "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z",
  cog:     "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  logout:  "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  plus:    "M12 5v14M5 12h14",
  eye:     "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  close:   "M18 6L6 18M6 6l12 12",
  search:  "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  grid:    "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  check:   "M20 6L9 17l-5-5",
  note:    "M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  money:   "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  mail:    "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  link:    "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  arrLeft: "M19 12H5 M12 19l-7-7 7-7",
  arrRight:"M5 12h14 M12 5l7 7-7 7",
};

const NAV = [
  { label: "Dashboard",       icon: P.home,    href: "/dashboard/admin" },
  { label: "Villas",          icon: P.villa,   href: "/dashboard/admin/villas" },
  { label: "Bookings",        icon: P.cal,     href: "/dashboard/admin/bookings" },
  { label: "Channel Manager", icon: P.channel, href: "/dashboard/admin/channel-manager" },
  { label: "Messages",        icon: P.msg,     href: "/dashboard/admin/messages" },
  { label: "Petty Cash",      icon: P.cash,    href: "/dashboard/admin/petty-cash" },
  { label: "Maintenance",     icon: P.wrench,  href: "/dashboard/admin/maintenance" },
  { label: "Emergencies",     icon: P_ALERT,   href: "/dashboard/admin/emergencies", isAlert: true },
  { label: "Services",        icon: P.service, href: "/dashboard/admin/services" },
  { label: "Owner Statements",icon: P.doc,     href: null },
  { label: "Payments",        icon: P.pay,     href: "/dashboard/admin/payments" },
  { label: "Settings",        icon: P.cog,     href: "/dashboard/admin/settings" },
];

/* ─── helpers ───────────────────────────────────────────────────────────────── */
function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}
function Skel({ h = 40 }: { h?: number }) {
  return <div style={{ height: h, borderRadius: 8, background: "linear-gradient(90deg,#EDE6D6 25%,#F5EFE3 50%,#EDE6D6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />;
}
function ini(n: string | null) { if (!n) return "??"; return n.trim().split(" ").map(w => w[0] ?? "").slice(0, 2).join("").toUpperCase(); }
function fmtD(d: string | null) { if (!d) return "—"; return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
function fmtDShort(d: string | null) { if (!d) return "—"; return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }
function calcNights(a: string | null, b: string | null) { if (!a || !b) return 0; return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)); }
function fmtAmt(n: number | null, cur = "USD") {
  if (n == null) return "—";
  if (cur === "IDR") return `Rp ${n.toLocaleString("id-ID")}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
}
function fmtId(id: string) { return `#${id.slice(0, 8).toUpperCase()}`; }
function otaKey(ch: string | null) { return (ch ?? "direct").toLowerCase(); }
function seasonForMonth(month: number): "low" | "mid" | "high" | "super_high" {
  if ([12, 1].includes(month)) return "super_high";
  if ([7, 8].includes(month)) return "high";
  if ([6, 9, 10].includes(month)) return "mid";
  return "low";
}
function calcRate(villa: Villa | null, checkIn: string, checkOut: string): { nights: number; ratePerNight: number; total: number; season: string; currency: string } {
  if (!villa || !checkIn || !checkOut) return { nights: 0, ratePerNight: 0, total: 0, season: "—", currency: "USD" };
  const n = calcNights(checkIn, checkOut);
  const month = new Date(checkIn + "T00:00:00").getMonth() + 1;
  const season = seasonForMonth(month);
  const seasonLabel = { low: "Low Season", mid: "Mid Season", high: "High Season", super_high: "Peak Season" }[season];
  const rateMap = { low: villa.rate_low_season, mid: villa.rate_mid_season, high: villa.rate_high_season, super_high: villa.rate_super_high_season };
  const ratePerNight = rateMap[season] ?? villa.base_rate ?? 0;
  const total = ratePerNight * n;
  return { nights: n, ratePerNight, total, season: seasonLabel, currency: villa.currency ?? "USD" };
}

/* ─── badge components ──────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string | null }) {
  const s = STATUS_COLORS[(status ?? "").toLowerCase()] ?? { bg: "#F0EBE0", color: "#7A6A4F" };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color, fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap" }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color }} />{(status ?? "—").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>;
}
function PayBadge({ isPaid }: { isPaid: boolean | null }) {
  const paid = isPaid === true;
  return <span style={{ padding: "3px 10px", borderRadius: 20, background: paid ? "#EDFAF3" : "#FFF0F0", color: paid ? "#1E7A48" : "#9B2C2C", fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap" }}>{paid ? "Paid" : "Unpaid"}</span>;
}
function OtaBadge({ channel }: { channel: string | null }) {
  const k = otaKey(channel);
  const s = OTA_COLORS[k] ?? OTA_COLORS.other;
  return <span style={{ padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color, fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap" }}>{channel || "—"}</span>;
}

/* ─── rate breakdown display ────────────────────────────────────────────────── */
function RateBreakdown({ villa, checkIn, checkOut }: { villa: Villa | null; checkIn: string; checkOut: string }) {
  if (!villa || !checkIn || !checkOut || checkIn >= checkOut) return null;
  const r = calcRate(villa, checkIn, checkOut);
  if (r.nights === 0) return null;
  return (
    <div style={{ background: "#FFF8E6", borderRadius: 10, padding: "12px 16px", border: "1px solid #F5D875", marginTop: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#7A5210", letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 8 }}>{r.season} — Rate Breakdown</div>
      <div style={{ fontSize: 13, color: "#4A3B27", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>{r.nights} nights × {fmtAmt(r.ratePerNight, r.currency)}/night</span><span style={{ fontWeight: 600 }}>{fmtAmt(r.ratePerNight * r.nights, r.currency)}</span></div>
        <div style={{ borderTop: "1px solid #F5D875", paddingTop: 6, marginTop: 4, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14, color: "#2C2C2C" }}><span>Total</span><span style={{ color: "#C9A84C" }}>{fmtAmt(r.total, r.currency)}</span></div>
      </div>
    </div>
  );
}

const EMPTY_FORM: BookingForm = {
  villa_id: "", guest_name: "", guest_email: "", num_guests: 2,
  check_in: "", check_out: "", ota_channel: "direct", ota_booking_id: "", notes: "",
};

/* ─── main component ─────────────────────────────────────────────────────────── */
export default function AdminBookingsPage() {
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [villas, setVillas]       = useState<Villa[]>([]);
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState<Toast | null>(null);

  // filters
  const [search, setSearch]       = useState("");
  const [statusF, setStatusF]     = useState("all");
  const [otaF, setOtaF]           = useState("all");
  const [villaF, setVillaF]       = useState("all");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");

  // view
  const [view, setView]           = useState<"table" | "calendar">("table");
  const [calMonth, setCalMonth]   = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; });

  // modals
  const [detailId, setDetailId]   = useState<string | null>(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [form, setForm]           = useState<BookingForm>(EMPTY_FORM);
  const [noteText, setNoteText]   = useState("");
  const [savingNote, setSavingNote] = useState(false);

  /* ── toast helper ── */
  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  /* ── auth ── */
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      const { data: prof } = await supabase.from("profiles").select("id,full_name,role").eq("id", user.id).single();
      if (!prof || prof.role !== "super_admin") { window.location.href = "/dashboard/admin"; return; }
      setProfile(prof); setAuthReady(true);
    });
  }, []);

  /* ── fetch villas ── */
  const fetchVillas = useCallback(async () => {
    const { data } = await supabase.from("villas")
      .select("id,name,currency,rate_low_season,rate_mid_season,rate_high_season,rate_super_high_season,base_rate,has_spare_bed,spare_bed_rate_low_season,spare_bed_rate_mid_season,spare_bed_rate_high_season,spare_bed_rate_super_high_season")
      .eq("is_active", true).order("name");
    setVillas((data ?? []) as Villa[]);
  }, []);

  /* ── fetch bookings ── */
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      // Use left join (no !inner) so bookings without a matched villa still appear
      let q = supabase.from("bookings").select(`
        id, villa_id, guest_name, guest_email,
        check_in, check_out, nights,
        total_amount, currency, ota_channel, ota_booking_id,
        status, is_paid, notes, created_at,
        villas(name)
      `).order("check_in", { ascending: false }).limit(200);

      if (statusF !== "all") q = q.eq("status", statusF);
      if (otaF    !== "all") q = q.ilike("ota_channel", otaF);
      if (villaF  !== "all") q = q.eq("villa_id", villaF);
      if (dateFrom) q = q.gte("check_in", dateFrom);
      if (dateTo)   q = q.lte("check_in", dateTo);

      const { data, error } = await q;
      if (error) {
        console.error("[Bookings] fetch error:", error);
        showToast(`Fetch error: ${error.message}`, "error");
        return;
      }
      const rows = (data ?? []).map((b: Record<string, unknown>) => ({
        ...b,
        villa_name: (b.villas as { name: string | null } | null)?.name ?? null,
      })) as Booking[];
      setBookings(rows);
    } catch (err) {
      console.error("[Bookings] unexpected fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [statusF, otaF, villaF, dateFrom, dateTo]);

  useEffect(() => { if (authReady) { fetchVillas(); fetchBookings(); } }, [authReady, fetchVillas, fetchBookings]);

  /* ── computed ── */
  const filtered = useMemo(() => {
    if (!search) return bookings;
    const q = search.toLowerCase();
    return bookings.filter(b =>
      (b.guest_name ?? "").toLowerCase().includes(q) ||
      (b.villa_name ?? "").toLowerCase().includes(q) ||
      (b.ota_booking_id ?? "").toLowerCase().includes(q)
    );
  }, [bookings, search]);

  const stats = useMemo(() => ({
    total:     filtered.length,
    confirmed: filtered.filter(b => b.status === "confirmed").length,
    pending:   filtered.filter(b => b.status === "pending").length,
    revenue:   filtered.reduce((acc, b) => acc + (b.total_amount ?? 0), 0),
  }), [filtered]);

  const detail     = useMemo(() => filtered.find(b => b.id === detailId) ?? null, [filtered, detailId]);
  const formVilla  = useMemo(() => villas.find(v => v.id === form.villa_id) ?? null, [form.villa_id, villas]);
  const ratePreview = useMemo(() => form.check_in && form.check_out && formVilla ? calcRate(formVilla, form.check_in, form.check_out) : null, [form.check_in, form.check_out, formVilla]);

  /* ── calendar helpers ── */
  const calDays = useMemo(() => {
    const [y, m] = calMonth.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => `${calMonth}-${String(i+1).padStart(2,"0")}`);
  }, [calMonth]);

  const calBookings = useMemo(() => {
    const [y, m] = calMonth.split("-").map(Number);
    const start = `${calMonth}-01`;
    const end   = `${calMonth}-${new Date(y, m, 0).getDate()}`;
    return bookings.filter(b =>
      b.check_in && b.check_out &&
      b.check_in <= end && b.check_out >= start &&
      b.status !== "cancelled"
    );
  }, [bookings, calMonth]);

  /* ── update status ── */
  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) { console.error("[Bookings] status update error:", error); showToast(error.message, "error"); return; }
    showToast(`Booking marked as ${status.replace(/_/g, " ")}`);
    fetchBookings();
  }

  /* ── save note ── */
  async function saveNote() {
    if (!detailId || !noteText.trim()) return;
    setSavingNote(true);
    const { error } = await supabase.from("bookings").update({ notes: noteText }).eq("id", detailId);
    setSavingNote(false);
    if (error) { console.error("[Bookings] note save error:", error); showToast(error.message, "error"); return; }
    showToast("Note saved");
    fetchBookings();
  }

  /* ── save booking ── */
  async function saveBooking() {
    if (!form.villa_id || !form.guest_name || !form.check_in || !form.check_out) return;
    setSaving(true);
    try {
      const n = calcNights(form.check_in, form.check_out);
      const rate = ratePreview;
      const payload = {
        villa_id:       form.villa_id,
        guest_name:     form.guest_name.trim(),
        guest_email:    form.guest_email.trim() || null,
        check_in:       form.check_in,
        check_out:      form.check_out,
        nights:         n,
        total_amount:   rate ? rate.total : null,
        currency:       formVilla?.currency ?? "USD",
        ota_channel:    form.ota_channel || null,
        ota_booking_id: form.ota_booking_id.trim() || null,
        notes:          form.notes.trim() || null,
        status:         "confirmed",
        is_paid:        false,
      };

      console.log("[Bookings] inserting payload:", payload);

      const { data, error } = await supabase.from("bookings").insert(payload).select().single();

      if (error) {
        console.error("[Bookings] insert error:", error);
        showToast(`Save failed: ${error.message}`, "error");
        return;
      }

      console.log("[Bookings] insert success:", data);
      showToast("Booking saved successfully!");
      setShowAdd(false);
      setForm(EMPTY_FORM);
      await fetchBookings();
    } catch (err) {
      console.error("[Bookings] unexpected save error:", err);
      showToast("Unexpected error. Check console.", "error");
    } finally {
      setSaving(false);
    }
  }

  const ownerName = profile?.full_name ?? "Admin";
  const path      = typeof window !== "undefined" ? window.location.pathname : "";

  if (!authReady) return (
    <>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#F5F0E8}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #EDE6D6", borderTop: "3px solid #C9A84C", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
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
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:#DDD5C0;border-radius:10px}
        input,select,textarea{font-family:Inter,sans-serif}
        input:focus,select:focus,textarea:focus{border-color:#C9A84C!important;box-shadow:0 0 0 3px rgba(201,168,76,.12);outline:none}
        .adm-sidebar{width:210px;background:#2C1E0F;display:flex;flex-direction:column;min-height:100vh;position:fixed;top:0;left:0;z-index:100}
        .adm-content{margin-left:210px;flex:1;min-height:100vh}
        .sidebar-label{display:block}
        .sidebar-section-label{display:block}
        .bk-table{width:100%;border-collapse:collapse}
        .bk-table th{padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#9E8E6A;letter-spacing:.06em;text-transform:uppercase;background:#FDFAF5;border-bottom:1px solid #EDE6D6;white-space:nowrap}
        .bk-table td{padding:13px 14px;font-size:13px;color:#2C2C2C;border-bottom:1px solid #F0EBE0;vertical-align:middle}
        .bk-table tr:hover td{background:#FDFAF5;cursor:pointer}
        .cal-cell{padding:3px 2px;font-size:10px;text-align:center;border-right:1px solid #EDE6D6;min-width:28px;height:32px;vertical-align:top}
        .cal-block{height:28px;border-radius:4px;display:flex;align-items:center;padding:0 4px;font-size:9.5px;font-weight:600;overflow:hidden;white-space:nowrap}
        @media(max-width:900px){.adm-sidebar{width:56px}.adm-content{margin-left:56px}.sidebar-label,.sidebar-section-label{display:none}}
        @media(max-width:640px){.adm-sidebar{display:none}.adm-content{margin-left:0}}
      `}</style>

      {/* ── toast ── */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.type === "success" ? "#1E7A48" : "#9B2C2C", color: "#fff", padding: "12px 20px", borderRadius: 12, fontSize: 13.5, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,.18)", animation: "slideDown .25s ease", maxWidth: 340 }}>
          {toast.type === "success" ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}

      <div style={{ display: "flex" }}>
        {/* ── sidebar ── */}
        <div className="adm-sidebar">
          <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic d={P.villa} size={16} /></div>
            <div className="sidebar-label"><div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", fontFamily: "Playfair Display,Georgia,serif" }}>Staya</div><div style={{ fontSize: 9, color: "#C9A84C", letterSpacing: ".1em", textTransform: "uppercase" }}>Management</div></div>
          </div>
          <div style={{ padding: "12px 10px", flex: 1, overflowY: "auto" }}>
            <div className="sidebar-section-label" style={{ fontSize: 9.5, color: "rgba(201,168,76,.55)", letterSpacing: ".09em", textTransform: "uppercase", paddingLeft: 8, marginBottom: 6 }}>Main Menu</div>
            {NAV.map(item => {
              const active = path === item.href || (!!item.href && item.href !== "/dashboard/admin" && path.startsWith(item.href));
              return (
                <div key={item.label} onClick={() => item.href && (window.location.href = item.href)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, marginBottom: 1, cursor: item.href ? "pointer" : "default", background: active ? "rgba(201,168,76,.18)" : "transparent", color: active ? "#C9A84C" : item.isAlert ? "rgba(255,100,80,.8)" : item.href ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.3)", opacity: item.href ? 1 : 0.5 }}>
                  <Ic d={item.icon} size={15} /><span className="sidebar-label" style={{ fontSize: 12.5, fontWeight: active ? 600 : 400 }}>{item.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{ini(ownerName)}</div>
            <div className="sidebar-label" style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ownerName}</div><div style={{ fontSize: 10, color: "rgba(201,168,76,.7)" }}>Super Admin</div></div>
            <div style={{ cursor: "pointer", color: "rgba(255,255,255,.4)" }} onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}><Ic d={P.logout} size={14} /></div>
          </div>
        </div>

        <div className="adm-content">
          {/* ── topbar ── */}
          <div style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
            <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 14.5, fontWeight: 700, color: "#2C2C2C" }}>Staya Management</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, color: "#fff" }}>{ini(ownerName)}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C" }}>{ownerName}</span>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "transparent", color: "#7A6A50", fontSize: 12, cursor: "pointer" }}><Ic d={P.logout} size={12} /> Logout</button>
            </div>
          </div>

          <main style={{ padding: "24px 24px 60px" }}>
            {/* ── header ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 24, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", fontWeight: 700 }}>Bookings <span style={{ fontSize: 16, color: "#9E8E6A", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>({stats.total})</span></h1>
                <p style={{ fontSize: 13, color: "#9E8E6A", marginTop: 2 }}>All villa reservations — search, filter and manage</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ display: "flex", border: "1.5px solid #EDE6D6", borderRadius: 8, overflow: "hidden" }}>
                  {(["table","calendar"] as const).map(v => (
                    <button key={v} onClick={() => setView(v)} style={{ padding: "7px 14px", border: "none", background: view === v ? "#C9A84C" : "#fff", color: view === v ? "#fff" : "#7A6A50", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                      <Ic d={v === "table" ? P.grid : P.cal} size={13} />{v === "table" ? "Table" : "Calendar"}
                    </button>
                  ))}
                </div>
                <button onClick={() => { setShowAdd(true); setForm(EMPTY_FORM); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "#C9A84C", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  <Ic d={P.plus} size={14} /> Add Booking
                </button>
              </div>
            </div>

            {/* ── stats row ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Total Bookings", val: String(stats.total),     icon: P.cal,   bg: "#F5F0E8", color: "#4A3B27", border: "#EDE6D6" },
                { label: "Confirmed",      val: String(stats.confirmed),  icon: P.check, bg: "#EDFAF3", color: "#1E7A48", border: "#B0E8CB" },
                { label: "Pending",        val: String(stats.pending),    icon: P.note,  bg: "#FFF8E6", color: "#7A5210", border: "#F5D875" },
                { label: "Revenue Shown",  val: fmtAmt(stats.revenue),   icon: P.money, bg: "#EEF4FF", color: "#2B4BA0", border: "#C0D2F8" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "14px 16px", border: `1.5px solid ${s.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ color: s.color }}><Ic d={s.icon} size={14} /></div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: s.color, letterSpacing: ".04em", textTransform: "uppercase" }}>{s.label}</div>
                  </div>
                  <div style={{ fontSize: s.label === "Revenue Shown" ? 16 : 22, fontWeight: 700, color: s.color, fontFamily: "Playfair Display,Georgia,serif" }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* ── filter bar ── */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EDE6D6", padding: "14px 16px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F5F0E8", borderRadius: 8, padding: "7px 12px", flex: "1 1 180px", minWidth: 160 }}>
                <Ic d={P.search} size={14} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guest, villa or ref…" style={{ border: "none", background: "transparent", fontSize: 13, color: "#2C2C2C", outline: "none", width: "100%" }} />
              </div>
              <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "#fff", fontSize: 12, color: "#4A3B27", cursor: "pointer" }}>
                {["all","confirmed","pending","cancelled","checked_in","checked_out"].map(s => <option key={s} value={s}>{s === "all" ? "All Status" : s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
              <select value={otaF} onChange={e => setOtaF(e.target.value)} style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "#fff", fontSize: 12, color: "#4A3B27", cursor: "pointer" }}>
                <option value="all">All OTA</option>
                {OTA_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={villaF} onChange={e => setVillaF(e.target.value)} style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "#fff", fontSize: 12, color: "#4A3B27", cursor: "pointer" }}>
                <option value="all">All Villas</option>
                {villas.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "#fff", fontSize: 12, color: "#4A3B27" }} />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "#fff", fontSize: 12, color: "#4A3B27" }} />
              {(search || statusF !== "all" || otaF !== "all" || villaF !== "all" || dateFrom || dateTo) && (
                <button onClick={() => { setSearch(""); setStatusF("all"); setOtaF("all"); setVillaF("all"); setDateFrom(""); setDateTo(""); }} style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "#fff", color: "#C9A84C", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Clear</button>
              )}
            </div>

            {/* ── table view ── */}
            {view === "table" && (
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", overflow: "hidden" }}>
                {loading ? (
                  <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>{[...Array(5)].map((_,i) => <Skel key={i} />)}</div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: 60, textAlign: "center", color: "#C4B89A" }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
                    <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "Playfair Display,Georgia,serif" }}>No bookings found</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting filters or add a new booking.</div>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="bk-table">
                      <thead>
                        <tr>
                          <th>Booking ID</th><th>Guest</th><th>Villa</th><th>Check-in</th>
                          <th>Check-out</th><th>Nights</th><th>OTA</th><th>Amount</th>
                          <th>Status</th><th>Payment</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(b => (
                          <tr key={b.id} onClick={() => { setDetailId(b.id); setNoteText(b.notes ?? ""); }}>
                            <td style={{ fontFamily: "monospace", fontSize: 11.5, color: "#9E8E6A" }}>{fmtId(b.id)}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{ini(b.guest_name)}</div>
                                <div>
                                  <div style={{ fontWeight: 600 }}>{b.guest_name ?? "—"}</div>
                                  {b.guest_email && <div style={{ fontSize: 11, color: "#9E8E6A" }}>{b.guest_email}</div>}
                                </div>
                              </div>
                            </td>
                            <td style={{ color: "#7A6A50" }}>{b.villa_name ?? "—"}</td>
                            <td>{fmtDShort(b.check_in)}</td>
                            <td>{fmtDShort(b.check_out)}</td>
                            <td style={{ textAlign: "center" }}>{(b.nights ?? calcNights(b.check_in, b.check_out)) || "—"}</td>
                            <td><OtaBadge channel={b.ota_channel} /></td>
                            <td style={{ fontWeight: 600 }}>{fmtAmt(b.total_amount, b.currency ?? "USD")}</td>
                            <td><StatusBadge status={b.status} /></td>
                            <td><PayBadge isPaid={b.is_paid} /></td>
                            <td onClick={e => e.stopPropagation()}>
                              <div style={{ display: "flex", gap: 5 }}>
                                <button onClick={() => { setDetailId(b.id); setNoteText(b.notes ?? ""); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1.5px solid #EDE6D6", background: "#fff", color: "#7A6A50", fontSize: 11.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Ic d={P.eye} size={12} /> View</button>
                                {b.status === "pending" && <button onClick={() => updateStatus(b.id, "confirmed")} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#C9A84C", color: "#fff", fontSize: 11.5, cursor: "pointer" }}>Confirm</button>}
                                {b.status !== "cancelled" && <button onClick={() => updateStatus(b.id, "cancelled")} style={{ padding: "4px 10px", borderRadius: 6, border: "1.5px solid #FFF0F0", background: "#FFF0F0", color: "#9B2C2C", fontSize: 11.5, cursor: "pointer" }}>Cancel</button>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── calendar view ── */}
            {view === "calendar" && (
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #EDE6D6", display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={() => { const [y,m] = calMonth.split("-").map(Number); const d = new Date(y, m-2, 1); setCalMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`); }} style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "#fff", cursor: "pointer" }}><Ic d={P.arrLeft} size={14} /></button>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#2C2C2C", fontFamily: "Playfair Display,Georgia,serif", minWidth: 140, textAlign: "center" }}>
                    {new Date(calMonth + "-01T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                  <button onClick={() => { const [y,m] = calMonth.split("-").map(Number); const d = new Date(y, m, 1); setCalMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`); }} style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "#fff", cursor: "pointer" }}><Ic d={P.arrRight} size={14} /></button>
                  <button onClick={() => { const d = new Date(); setCalMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px solid #C9A84C", background: "#FFF8E6", color: "#7A5210", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>Today</button>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", minWidth: "100%" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "8px 14px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#9E8E6A", background: "#FDFAF5", borderBottom: "1px solid #EDE6D6", position: "sticky", left: 0, zIndex: 5, whiteSpace: "nowrap", minWidth: 130 }}>Villa</th>
                        {calDays.map(day => {
                          const d = new Date(day + "T00:00:00");
                          const isToday = day === new Date().toISOString().slice(0,10);
                          return (
                            <th key={day} style={{ padding: "6px 2px", textAlign: "center", fontSize: 10.5, fontWeight: isToday ? 700 : 500, color: isToday ? "#C9A84C" : "#9E8E6A", background: isToday ? "#FFF8E6" : "#FDFAF5", borderBottom: "1px solid #EDE6D6", borderRight: "1px solid #EDE6D6", minWidth: 28, width: 28 }}>
                              <div>{d.toLocaleDateString("en-US",{weekday:"short"}).slice(0,1)}</div>
                              <div style={{ fontFamily: "Inter,sans-serif", fontSize: 11, fontWeight: 700 }}>{d.getDate()}</div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {villas.map(villa => (
                        <tr key={villa.id}>
                          <td style={{ padding: "6px 14px", fontSize: 12.5, fontWeight: 600, color: "#2C2C2C", borderBottom: "1px solid #EDE6D6", position: "sticky", left: 0, background: "#fff", zIndex: 4, whiteSpace: "nowrap" }}>{villa.name ?? "—"}</td>
                          {calDays.map(day => {
                            const bk = calBookings.find(b => b.villa_id === villa.id && b.check_in && b.check_out && b.check_in <= day && b.check_out > day);
                            const ota = bk ? otaKey(bk.ota_channel) : "";
                            const col = bk ? (OTA_COLORS[ota] ?? OTA_COLORS.other) : null;
                            const isStart = bk && bk.check_in === day;
                            return (
                              <td key={day} className="cal-cell" onClick={() => bk ? (setDetailId(bk.id), setNoteText(bk.notes ?? "")) : setShowAdd(true)} style={{ background: bk ? col!.bg : "transparent", borderRight: "1px solid #EDE6D6", borderBottom: "1px solid #EDE6D6", cursor: bk ? "pointer" : "default" }}>
                                {isStart && bk && (
                                  <div className="cal-block" style={{ background: col!.color, color: "#fff" }} title={`${bk.guest_name} — ${bk.ota_channel}`}>
                                    {ini(bk.guest_name)}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      {villas.length === 0 && (
                        <tr><td colSpan={calDays.length + 1} style={{ padding: 40, textAlign: "center", color: "#C4B89A", fontSize: 13 }}>No active villas found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: "10px 20px", borderTop: "1px solid #EDE6D6", display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {Object.entries(OTA_COLORS).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: v.color }} />
                      <span style={{ color: "#7A6A50" }}>{k.charAt(0).toUpperCase() + k.slice(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          BOOKING DETAIL MODAL
      ══════════════════════════════════════════════ */}
      {detailId && detail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setDetailId(null)}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 600, maxHeight: "90vh", overflow: "auto", animation: "fadeUp .2s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #EDE6D6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 10.5, color: "#9E8E6A", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 3 }}>{fmtId(detail.id)}</div>
                <h2 style={{ fontSize: 19, fontFamily: "Playfair Display,Georgia,serif", fontWeight: 700, color: "#2C2C2C" }}>{detail.guest_name ?? "Booking Detail"}</h2>
              </div>
              <button onClick={() => setDetailId(null)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #EDE6D6", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={P.close} size={14} /></button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                <StatusBadge status={detail.status} />
                <PayBadge isPaid={detail.is_paid} />
                <OtaBadge channel={detail.ota_channel} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                {[
                  { label: "Villa",        val: detail.villa_name },
                  { label: "OTA Ref",      val: detail.ota_booking_id || "—" },
                  { label: "Check-in",     val: fmtD(detail.check_in) },
                  { label: "Check-out",    val: fmtD(detail.check_out) },
                  { label: "Nights",       val: String(detail.nights ?? calcNights(detail.check_in, detail.check_out)) },
                  { label: "Total Amount", val: fmtAmt(detail.total_amount, detail.currency ?? "USD") },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 3 }}>{f.label}</div>
                    <div style={{ fontSize: 14, color: "#2C2C2C", fontWeight: 500 }}>{f.val ?? "—"}</div>
                  </div>
                ))}
              </div>

              {detail.guest_email && (
                <div style={{ background: "#F5F0E8", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>Guest Contact</div>
                  <span style={{ fontSize: 13, color: "#4A3B27" }}>✉ {detail.guest_email}</span>
                </div>
              )}

              {/* Timeline */}
              <div style={{ background: "#FDFAF5", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Booking Timeline</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Booking Created", done: true, date: detail.created_at?.slice(0,10) },
                    { label: "Confirmed",        done: ["confirmed","checked_in","checked_out","completed"].includes(detail.status ?? ""), date: null },
                    { label: "Payment Received", done: detail.is_paid === true, date: null },
                    { label: "Guest Check-in",   done: ["checked_in","checked_out","completed"].includes(detail.status ?? ""), date: detail.check_in },
                    { label: "Guest Check-out",  done: ["checked_out","completed"].includes(detail.status ?? ""), date: detail.check_out },
                  ].map((ev, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: ev.done ? "#C9A84C" : "#EDE6D6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {ev.done && <Ic d={P.check} size={10} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: ev.done ? 600 : 400, color: ev.done ? "#2C2C2C" : "#9E8E6A" }}>{ev.label}</div>
                        {ev.date && <div style={{ fontSize: 11, color: "#9E8E6A" }}>{fmtD(ev.date)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>Internal Notes</div>
                {detail.notes && <div style={{ fontSize: 13, color: "#4A3B27", background: "#FFF8E6", padding: "10px 14px", borderRadius: 10, marginBottom: 8, border: "1px solid #F5D875" }}>{detail.notes}</div>}
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} placeholder="Add internal note…" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #DDD5C0", background: "#FDFAF5", fontSize: 13, color: "#2C2C2C", resize: "vertical" }} />
                <button onClick={saveNote} disabled={savingNote || !noteText.trim()} style={{ marginTop: 6, padding: "7px 16px", borderRadius: 8, border: "none", background: "#C9A84C", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: savingNote ? 0.6 : 1 }}>
                  {savingNote ? "Saving…" : "Save Note"}
                </button>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 16, borderTop: "1px solid #EDE6D6" }}>
                {detail.status === "pending" && (
                  <button onClick={() => updateStatus(detail.id, "confirmed")} style={{ flex: 1, padding: "9px 16px", borderRadius: 8, border: "none", background: "#C9A84C", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Ic d={P.check} size={14} /> Confirm Booking</button>
                )}
                {detail.status === "confirmed" && (
                  <button onClick={() => updateStatus(detail.id, "checked_in")} style={{ flex: 1, padding: "9px 16px", borderRadius: 8, border: "none", background: "#2B4BA0", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Mark Checked In</button>
                )}
                {detail.status === "checked_in" && (
                  <button onClick={() => updateStatus(detail.id, "checked_out")} style={{ flex: 1, padding: "9px 16px", borderRadius: 8, border: "none", background: "#1E7A48", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Mark Checked Out</button>
                )}
                <button style={{ padding: "9px 14px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "#fff", color: "#7A6A50", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Ic d={P.mail} size={13} /> Send Email</button>
                <button style={{ padding: "9px 14px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "#fff", color: "#7A6A50", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Ic d={P.link} size={13} /> Payment Link</button>
                {detail.status !== "cancelled" && (
                  <button onClick={() => updateStatus(detail.id, "cancelled")} style={{ padding: "9px 14px", borderRadius: 8, border: "1.5px solid #FFF0F0", background: "#FFF0F0", color: "#9B2C2C", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          ADD BOOKING MODAL
      ══════════════════════════════════════════════ */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowAdd(false)}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 540, maxHeight: "90vh", overflow: "auto", animation: "fadeUp .2s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #EDE6D6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 19, fontFamily: "Playfair Display,Georgia,serif", fontWeight: 700, color: "#2C2C2C" }}>Add New Booking</h2>
              <button onClick={() => setShowAdd(false)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #EDE6D6", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={P.close} size={14} /></button>
            </div>
            <div style={{ padding: "20px 24px" }}>

              {/* Guest */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Guest Information</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", marginBottom: 4 }}>Guest Name *</div>
                  <input type="text" value={form.guest_name} onChange={e => setForm(p => ({...p, guest_name: e.target.value}))} placeholder="Full name" style={{ width: "100%", padding: "9px 14px", borderRadius: 10, border: "1.5px solid #DDD5C0", background: "#FDFAF5", fontSize: 13, color: "#2C2C2C" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", marginBottom: 4 }}>Guest Email</div>
                  <input type="email" value={form.guest_email} onChange={e => setForm(p => ({...p, guest_email: e.target.value}))} placeholder="email@example.com" style={{ width: "100%", padding: "9px 14px", borderRadius: 10, border: "1.5px solid #DDD5C0", background: "#FDFAF5", fontSize: 13, color: "#2C2C2C" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", marginBottom: 4 }}>Number of Guests</div>
                  <input type="number" min={1} max={30} value={form.num_guests} onChange={e => setForm(p => ({...p, num_guests: +e.target.value}))} style={{ width: "100%", padding: "9px 14px", borderRadius: 10, border: "1.5px solid #DDD5C0", background: "#FDFAF5", fontSize: 13, color: "#2C2C2C" }} />
                </div>
              </div>

              {/* Stay */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Stay Details</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", marginBottom: 4 }}>Villa *</div>
                  <select value={form.villa_id} onChange={e => setForm(p => ({...p, villa_id: e.target.value}))} style={{ width: "100%", padding: "9px 14px", borderRadius: 10, border: "1.5px solid #DDD5C0", background: "#FDFAF5", fontSize: 13, color: "#2C2C2C" }}>
                    <option value="">Select villa…</option>
                    {villas.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", marginBottom: 4 }}>Check-in *</div>
                    <input type="date" value={form.check_in} onChange={e => setForm(p => ({...p, check_in: e.target.value}))} style={{ width: "100%", padding: "9px 14px", borderRadius: 10, border: "1.5px solid #DDD5C0", background: "#FDFAF5", fontSize: 13, color: "#2C2C2C" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", marginBottom: 4 }}>Check-out *</div>
                    <input type="date" value={form.check_out} min={form.check_in} onChange={e => setForm(p => ({...p, check_out: e.target.value}))} style={{ width: "100%", padding: "9px 14px", borderRadius: 10, border: "1.5px solid #DDD5C0", background: "#FDFAF5", fontSize: 13, color: "#2C2C2C" }} />
                  </div>
                </div>
                {form.check_in && form.check_out && form.check_in < form.check_out && (
                  <div style={{ fontSize: 12.5, color: "#9E8E6A", fontStyle: "italic" }}>
                    {calcNights(form.check_in, form.check_out)} nights
                  </div>
                )}
                {/* Live rate breakdown */}
                {formVilla && form.check_in && form.check_out && form.check_in < form.check_out && (
                  <RateBreakdown villa={formVilla} checkIn={form.check_in} checkOut={form.check_out} />
                )}
              </div>

              {/* Channel */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Channel</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {/* iCal sync notice */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 14px", background: "#EEF4FF", borderRadius: 10, border: "1px solid #C0D2F8" }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#2B4BA0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p style={{ fontSize: 12, color: "#2B4BA0", margin: 0, lineHeight: 1.5 }}>
                    <strong>OTA bookings sync automatically via iCal</strong> — only add Direct bookings here. Airbnb, Booking.com, Vrbo and Expedia reservations are imported automatically.
                  </p>
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", marginBottom: 4 }}>Booking Channel</div>
                  <select value={form.ota_channel} onChange={e => setForm(p => ({...p, ota_channel: e.target.value}))} style={{ width: "100%", padding: "9px 14px", borderRadius: 10, border: "1.5px solid #DDD5C0", background: "#FDFAF5", fontSize: 13, color: "#2C2C2C" }}>
                    <option value="direct">Direct</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", marginBottom: 4 }}>OTA Booking Reference</div>
                  <input type="text" value={form.ota_booking_id} onChange={e => setForm(p => ({...p, ota_booking_id: e.target.value}))} placeholder="e.g. HM-ABC123456" style={{ width: "100%", padding: "9px 14px", borderRadius: 10, border: "1.5px solid #DDD5C0", background: "#FDFAF5", fontSize: 13, color: "#2C2C2C" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", marginBottom: 4 }}>Notes</div>
                  <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} rows={3} placeholder="Special requests, internal notes…" style={{ width: "100%", padding: "9px 14px", borderRadius: 10, border: "1.5px solid #DDD5C0", background: "#FDFAF5", fontSize: 13, color: "#2C2C2C", resize: "vertical" }} />
                </div>
              </div>

              {/* Save */}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={saveBooking} disabled={saving || !form.villa_id || !form.guest_name || !form.check_in || !form.check_out || form.check_in >= form.check_out}
                  style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#C9A84C", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: saving || !form.villa_id || !form.guest_name || !form.check_in || !form.check_out || form.check_in >= form.check_out ? 0.55 : 1 }}>
                  {saving ? "Saving…" : `Save Booking${ratePreview ? ` — ${fmtAmt(ratePreview.total, ratePreview.currency)}` : ""}`}
                </button>
                <button onClick={() => setShowAdd(false)} style={{ padding: "11px 20px", borderRadius: 10, border: "1.5px solid #EDE6D6", background: "#fff", color: "#7A6A50", fontSize: 14, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

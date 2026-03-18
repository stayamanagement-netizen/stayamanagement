"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Profile { id: string; full_name: string | null; role: string; }
interface Booking {
  id: string; guest_name: string | null; villa_name: string | null;
  check_in: string | null; check_out: string | null; status: string | null;
  total_amount: number | null; ota_channel: string | null;
}
interface PettyCash {
  id: string; villa_name: string | null; submitted_by: string | null;
  category: string | null; amount: number | null;
  created_at: string | null; status: string | null;
}
interface ServiceOrder {
  id: string; guest_name: string | null; villa_name: string | null;
  service_name: string | null; service_date: string | null;
  amount: number | null; status: string | null;
}
interface CheckinAlert {
  id: string; guest_name: string | null; check_in: string | null;
  total_amount: number | null; status: string | null;
}
interface Stats {
  totalVillas: number; activeBookings: number; revenueThisMonth: number;
  pendingPettyCash: number; openMaintenance: number; unreadMessages: number;
  activeEmergencies: number;
}
interface EmergencyAlert {
  id: string; villa_name: string | null; alert_type: string | null;
  description: string | null; created_at: string | null; status: string | null;
}

/* ─── tiny icon helper ─────────────────────────────────────────────────────── */
function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

/* ─── paths ────────────────────────────────────────────────────────────────── */
const P = {
  home:    "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  villa:   "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z",
  cal:     "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
  sync:    "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
  chat:    "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z",
  wallet:  "M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6m18 0V5.25A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25V6",
  tools:   "M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z",
  star:    "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
  doc:     "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  card:    "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z",
  gear:    "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  logout:  "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9",
  check:   "M4.5 12.75l6 6 9-13.5",
  xmark:   "M6 18L18 6M6 6l12 12",
  user:    "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
};

const P_ALERT = "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z";

/* ─── nav items ────────────────────────────────────────────────────────────── */
const NAV = [
  { label: "Dashboard",        icon: P.home   },
  { label: "Villas",           icon: P.villa  },
  { label: "Bookings",         icon: P.cal    },
  { label: "Channel Manager",  icon: P.sync   },
  { label: "Messages",         icon: P.chat,   badge: "unreadMessages"   },
  { label: "Petty Cash",       icon: P.wallet, badge: "pendingPettyCash" },
  { label: "Maintenance",      icon: P.tools,  badge: "openMaintenance"  },
  { label: "Emergencies",      icon: P_ALERT,  badge: "activeEmergencies", emergencyBadge: true },
  { label: "Services",         icon: P.star   },
  { label: "Owner Statements", icon: P.doc    },
  { label: "Payments",         icon: P.card   },
  { label: "Settings",         icon: P.gear   },
];

/* ─── status badge ─────────────────────────────────────────────────────────── */
function Badge({ status }: { status: string | null }) {
  const s = (status ?? "").toLowerCase();
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    confirmed:   { bg: "#EDFAF3", color: "#1E7A48", dot: "#2D8A57", label: "Confirmed"   },
    pending:     { bg: "#FFF8E6", color: "#7A5210", dot: "#C9A84C", label: "Pending"     },
    cancelled:   { bg: "#FFF0F0", color: "#9B2C2C", dot: "#C53030", label: "Cancelled"   },
    checked_in:  { bg: "#EEF4FF", color: "#2B4BA0", dot: "#3B63C9", label: "Checked In"  },
    checked_out: { bg: "#F4F4F4", color: "#555",    dot: "#999",    label: "Checked Out" },
    approved:    { bg: "#EDFAF3", color: "#1E7A48", dot: "#2D8A57", label: "Approved"    },
    rejected:    { bg: "#FFF0F0", color: "#9B2C2C", dot: "#C53030", label: "Rejected"    },
    completed:   { bg: "#EDFAF3", color: "#1E7A48", dot: "#2D8A57", label: "Completed"   },
    open:        { bg: "#FFF8E6", color: "#7A5210", dot: "#C9A84C", label: "Open"        },
  };
  const st = map[s] ?? { bg: "#F0EBE0", color: "#7A6A4F", dot: "#C4B89A", label: status ?? "—" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: st.bg, color: st.color, fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, flexShrink: 0 }} />
      {st.label}
    </span>
  );
}

/* ─── shimmer skeleton ─────────────────────────────────────────────────────── */
function Skel({ w = "100%", h = 15 }: { w?: string | number; h?: number }) {
  return (
    <div style={{ width: w, height: h, borderRadius: 6, background: "linear-gradient(90deg,#EDE6D6 25%,#F5EFE3 50%,#EDE6D6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
  );
}

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── table wrapper ────────────────────────────────────────────────────────── */
function TableCard({ title, subtitle, onViewAll, loading, empty, children }: {
  title: string; subtitle: string; onViewAll: () => void;
  loading: boolean; empty: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", overflow: "hidden", marginBottom: 20 }}>
      <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #EDE6D6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 15.5, fontWeight: 700, color: "#2C2C2C" }}>{title}</h2>
          <p style={{ fontSize: 11.5, color: "#9E8E6A", marginTop: 2 }}>{subtitle}</p>
        </div>
        <button onClick={onViewAll} style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #E8E0D0", background: "transparent", color: "#6B5C3E", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "all .15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#C9A84C"; (e.currentTarget as HTMLButtonElement).style.color = "#C9A84C"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#E8E0D0"; (e.currentTarget as HTMLButtonElement).style.color = "#6B5C3E"; }}>
          View All
        </button>
      </div>
      {loading ? (
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 11 }}>
          {[...Array(4)].map((_, i) => <Skel key={i} />)}
        </div>
      ) : empty ? (
        <div style={{ padding: 44, textAlign: "center", color: "#C4B89A", fontSize: 13 }}>No records found.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>{children}</div>
      )}
    </div>
  );
}

const TH = ({ children }: { children: string }) => (
  <th style={{ padding: "10px 18px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "#9E8E6A", letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid #EDE6D6", whiteSpace: "nowrap", background: "#FDFAF5" }}>
    {children}
  </th>
);

/* ─── main component ───────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [activePage, setActivePage] = useState("Dashboard");

  const [stats, setStats]         = useState<Stats>({ totalVillas: 0, activeBookings: 0, revenueThisMonth: 0, pendingPettyCash: 0, openMaintenance: 0, unreadMessages: 0, activeEmergencies: 0 });
  const [emergencies, setEmergencies] = useState<EmergencyAlert[]>([]);
  const [ackingId, setAckingId]   = useState<string | null>(null);
  const [statsLoading, setSL]     = useState(true);
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [bookingsLoading, setBL]  = useState(true);
  const [petty, setPetty]         = useState<PettyCash[]>([]);
  const [pettyLoading, setPL]     = useState(true);
  const [pettyUpdating, setPU]    = useState<string | null>(null);
  const [services, setServices]   = useState<ServiceOrder[]>([]);
  const [servicesLoading, setServL] = useState(true);
  const [checkinAlerts, setCheckinAlerts] = useState<CheckinAlert[]>([]);
  const [reminderModal, setReminderModal] = useState<CheckinAlert | null>(null);
  const [reminderText, setReminderText] = useState("");
  const [reminderSending, setReminderSending] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);

  /* ── load current user name (best-effort, no redirect) ─────────────────── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      supabase.from("profiles").select("id,full_name,role").eq("id", user.id).single()
        .then(({ data }) => { if (data) setProfile(data as Profile); }, () => {});
    });
  }, []);

  /* ── fetch stats ────────────────────────────────────────────────────────── */
  const fetchStats = useCallback(async () => {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const [v, ab, rev, pc, mt, msg, em, emData] = await Promise.all([
      supabase.from("villas").select("id", { count: "exact", head: true }),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
      supabase.from("bookings").select("total_amount").gte("created_at", monthStart).in("status", ["confirmed", "checked_in", "checked_out"]),
      supabase.from("petty_cash").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("maintenance_requests").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false),
      supabase.from("emergency_alerts").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("emergency_alerts").select("id,villa_name,alert_type,description,created_at,status").in("status", ["active", "acknowledged"]).order("created_at", { ascending: false }),
    ]);
    const revenue = (rev.data ?? []).reduce((s: number, b: { total_amount: number | null }) => s + (b.total_amount ?? 0), 0);
    setStats({ totalVillas: v.count ?? 0, activeBookings: ab.count ?? 0, revenueThisMonth: revenue, pendingPettyCash: pc.count ?? 0, openMaintenance: mt.count ?? 0, unreadMessages: msg.count ?? 0, activeEmergencies: em.count ?? 0 });
    setEmergencies((emData.data ?? []) as EmergencyAlert[]);
    setSL(false);
  }, []);

  const fetchBookings = useCallback(async () => {
    const { data } = await supabase.from("bookings")
      .select("id,guest_name,villa_name,check_in,check_out,status,total_amount,ota_channel")
      .order("created_at", { ascending: false }).limit(10);
    setBookings(data ?? []); setBL(false);
  }, []);

  const fetchPetty = useCallback(async () => {
    const { data } = await supabase.from("petty_cash")
      .select("id,villa_name,submitted_by,category,amount,created_at,status")
      .order("created_at", { ascending: false }).limit(5);
    setPetty(data ?? []); setPL(false);
  }, []);

  const fetchServices = useCallback(async () => {
    const { data } = await supabase.from("service_orders")
      .select("id,guest_name,villa_name,service_name,service_date,amount,status")
      .order("service_date", { ascending: false }).limit(5);
    setServices(data ?? []); setServL(false);
  }, []);

  const fetchCheckinAlerts = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const in7 = new Date(); in7.setDate(in7.getDate() + 7);
    const in7Str = in7.toISOString().split("T")[0];
    try {
      const { data: bData } = await supabase.from("bookings")
        .select("id,guest_name,check_in,total_amount,status")
        .gte("check_in", today).lte("check_in", in7Str);
      const upcoming = (bData ?? []) as CheckinAlert[];
      try {
        const names = upcoming.map(b => b.guest_name).filter(Boolean) as string[];
        if (names.length === 0) { setCheckinAlerts(upcoming); return; }
        const { data: pData } = await supabase.from("payments")
          .select("guest_name,status").in("guest_name", names).eq("status", "confirmed");
        const paidNames = new Set((pData ?? []).map((p: { guest_name: string | null }) => p.guest_name));
        setCheckinAlerts(upcoming.filter(b => !paidNames.has(b.guest_name)));
      } catch { setCheckinAlerts(upcoming); }
    } catch { setCheckinAlerts([]); }
  }, []);

  useEffect(() => {
    fetchStats(); fetchBookings(); fetchPetty(); fetchServices(); fetchCheckinAlerts();
  }, [fetchStats, fetchBookings, fetchPetty, fetchServices, fetchCheckinAlerts]);

  /* real-time subscription — re-fetch stats (& emergencies) on any change */
  useEffect(() => {
    const ch = supabase.channel("em_admin_dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "emergency_alerts" }, () => fetchStats())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchStats]);

  async function updatePetty(id: string, newStatus: "approved" | "rejected") {
    setPU(id);
    await supabase.from("petty_cash").update({ status: newStatus }).eq("id", id);
    await Promise.all([fetchPetty(), fetchStats()]);
    setPU(null);
  }

  async function acknowledgeEmergency(id: string) {
    setAckingId(id);
    await supabase.from("emergency_alerts").update({ status: "acknowledged", acknowledged_at: new Date().toISOString() }).eq("id", id);
    await fetchStats();
    setAckingId(null);
  }

  async function logout() { await supabase.auth.signOut(); window.location.href = "/"; }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const STAT_CARDS = [
    { label: "Total Villas",            value: stats.totalVillas,      icon: P.villa,  icolor: "#3D6CB0", ibg: "#EEF3FB" },
    { label: "Active Bookings",         value: stats.activeBookings,   icon: P.cal,    icolor: "#1E7A48", ibg: "#EDFAF3" },
    { label: "Revenue This Month",      value: `$${stats.revenueThisMonth.toLocaleString()}`, icon: P.card, icolor: "#A07820", ibg: "#FFF8E6" },
    { label: "Pending Petty Cash",      value: stats.pendingPettyCash, icon: P.wallet, icolor: "#B87A1A", ibg: "#FFF3DC" },
    { label: "Open Maintenance Issues", value: stats.openMaintenance,  icon: P.tools,  icolor: "#9B2C2C", ibg: "#FFF0F0" },
    { label: "Unread Messages",         value: stats.unreadMessages,   icon: P.chat,   icolor: "#5A3EA0", ibg: "#F3EEFF" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Inter',sans-serif;background:#F5F0E8;color:#2C2C2C;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#D4C9B0;border-radius:10px;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes flash{0%,100%{background:#FFF0F0}50%{background:#FFE0E0}}

        .nav-item{
          display:flex;align-items:center;gap:10px;width:100%;
          padding:9px 14px 9px 16px;border:none;background:transparent;
          color:#7A6A52;font-family:'Inter',sans-serif;font-size:13px;font-weight:400;
          cursor:pointer;text-align:left;transition:background .15s,color .15s;
          position:relative;white-space:nowrap;border-radius:0;
          border-left:3px solid transparent;
        }
        .nav-item:hover{background:#F5F0E8;color:#4A3B27;}
        .nav-item.active{
          background:#FDFAF5;color:#2C2C2C;font-weight:600;
          border-left:3px solid #C9A84C;
        }
        .nav-item.active .nav-icon{color:#C9A84C;}

        .stat-card{
          background:#fff;border-radius:14px;padding:20px 20px 16px;
          border:1px solid #EDE6D6;box-shadow:0 2px 8px rgba(44,44,44,.05);
          cursor:default;transition:box-shadow .2s,transform .2s;
          animation:fadeUp .3s ease both;
        }
        .stat-card:hover{box-shadow:0 6px 22px rgba(44,44,44,.10);transform:translateY(-2px);}

        .trow td{transition:background .1s;}
        .trow:hover td{background:#FDFAF5!important;}

        .action-btn{
          display:inline-flex;align-items:center;gap:4px;
          padding:5px 11px;border-radius:7px;border:1.5px solid;
          font-family:'Inter',sans-serif;font-size:11.5px;font-weight:600;
          cursor:pointer;transition:all .15s;
        }
        .action-btn.approve{border-color:#B6DFC5;color:#1E7A48;background:#EDFAF3;}
        .action-btn.approve:hover{background:#D4F5E4;border-color:#1E7A48;}
        .action-btn.reject{border-color:#F5C0C0;color:#9B2C2C;background:#FFF0F0;}
        .action-btn.reject:hover{background:#FFE0E0;border-color:#9B2C2C;}
        .action-btn:disabled{opacity:.45;cursor:not-allowed;}

        .logout-btn{
          display:flex;align-items:center;gap:6px;
          padding:8px 14px;border-radius:8px;
          border:1.5px solid #E8E0D0;background:transparent;
          color:#6B5C3E;font-size:12.5px;font-weight:500;
          cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s;white-space:nowrap;
        }
        .logout-btn:hover{background:#FFF8F0;border-color:#C9A84C;color:#C9A84C;}

        @media(max-width:900px){
          .sidebar-label,.sidebar-section-label,.nav-badge,.sidebar-user-info{display:none!important;}
          .sidebar{width:58px!important;}
          .nav-item{padding:10px 0!important;justify-content:center;}
          .nav-item .nav-icon{margin:0!important;}
          .topbar-date{display:none!important;}
        }
      `}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F5F0E8" }}>

        {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
        <aside className="sidebar" style={{ width: 230, flexShrink: 0, background: "#fff", borderRight: "1px solid #EDE6D6", display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto", boxShadow: "2px 0 10px rgba(44,44,44,.05)", zIndex: 20 }}>

          {/* logo */}
          <div style={{ padding: "20px 16px 18px", borderBottom: "1px solid #EDE6D6", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#C9A84C,#B8913A)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0, boxShadow: "0 3px 8px rgba(201,168,76,.35)" }}>
              <Ic d={P.home} size={18} />
            </div>
            <div className="sidebar-label">
              <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 14, fontWeight: 700, color: "#2C2C2C", lineHeight: 1.25 }}>Staya</div>
              <div style={{ fontSize: 9.5, color: "#9E8E6A", letterSpacing: "0.1em", textTransform: "uppercase" }}>Management</div>
            </div>
          </div>

          {/* nav */}
          <nav style={{ padding: "12px 0", flex: 1 }}>
            <div className="sidebar-section-label" style={{ fontSize: 9.5, color: "#C4B89A", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, padding: "0 18px", marginBottom: 6 }}>Main Menu</div>
            {NAV.map(item => {
              const badgeVal = item.badge ? stats[item.badge as keyof Stats] as number : 0;
              const isActive = activePage === item.label;
              return (
                <button key={item.label} className={`nav-item${isActive ? " active" : ""}`} onClick={() => {
                  if (item.label === "Villas")           { window.location.href = "/dashboard/admin/villas/";           return; }
                  if (item.label === "Bookings")         { window.location.href = "/dashboard/admin/bookings";          return; }
                  if (item.label === "Channel Manager")  { window.location.href = "/dashboard/admin/channel-manager";  return; }
                  if (item.label === "Messages")         { window.location.href = "/dashboard/admin/messages";          return; }
                  if (item.label === "Payments")         { window.location.href = "/dashboard/admin/payments/";         return; }
                  if (item.label === "Emergencies")      { window.location.href = "/dashboard/admin/emergencies/";      return; }
                  if (item.label === "Petty Cash")       { window.location.href = "/dashboard/admin/petty-cash";        return; }
                  if (item.label === "Maintenance")      { window.location.href = "/dashboard/admin/maintenance";       return; }
                  if (item.label === "Settings")         { window.location.href = "/dashboard/admin/settings";          return; }
                  setActivePage(item.label);
                }}>
                  <span className="nav-icon" style={{ color: isActive ? "#C9A84C" : "#A0906E" }}>
                    <Ic d={item.icon} size={15} />
                  </span>
                  <span className="sidebar-label">{item.label}</span>
                  {item.badge && badgeVal > 0 && (
                    <span className="nav-badge" style={{ marginLeft: "auto", background: (item as { emergencyBadge?: boolean }).emergencyBadge ? "#C62828" : "#C9A84C", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10, minWidth: 20, textAlign: "center", animation: (item as { emergencyBadge?: boolean }).emergencyBadge ? "pulse 1.5s ease infinite" : "none" }}>
                      {badgeVal}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* user pill */}
          <div style={{ padding: "12px 12px", borderTop: "1px solid #EDE6D6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 10, background: "#FDFAF5" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#C9A84C,#B8913A)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {(profile?.full_name ?? "A").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="sidebar-user-info" style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#2C2C2C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.full_name ?? "Admin"}</div>
                <div style={{ fontSize: 10, color: "#C9A84C", fontWeight: 500 }}>Super Admin</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN AREA ─────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

          {/* ── TOP NAVBAR ─────────────────────────────────────────────────── */}
          <header style={{ height: 62, background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, boxShadow: "0 2px 8px rgba(44,44,44,.05)", zIndex: 10 }}>
            {/* left */}
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ color: "#C9A84C" }}><Ic d={P.home} size={20} /></div>
              <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontWeight: 700, color: "#2C2C2C", letterSpacing: "0.01em" }}>
                Staya <span style={{ color: "#C9A84C" }}>Management</span>
              </span>
            </div>

            {/* center: date */}
            <div className="topbar-date" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#9E8E6A", fontStyle: "italic" }}>
              {today}
            </div>

            {/* right */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 8, background: "#FDFAF5", border: "1px solid #EDE6D6" }}>
                <div style={{ color: "#C9A84C" }}><Ic d={P.user} size={14} /></div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#2C2C2C" }}>Admin</span>
              </div>
              <button className="logout-btn" onClick={logout}>
                <Ic d={P.logout} size={14} /> Logout
              </button>
            </div>
          </header>

          {/* ── SCROLLABLE CONTENT ─────────────────────────────────────────── */}
          <main style={{ flex: 1, overflowY: "auto", padding: "24px 24px 56px" }}>

            {/* ── EMERGENCY BANNER ───────────────────────────────────────────── */}
            {emergencies.length > 0 && (
              <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {emergencies.map(em => {
                  const isActive = em.status === "active";
                  const typeLabels: Record<string, string> = { medical: "Medical Emergency", security: "Security Issue", fire: "Fire", flood: "Flood / Water Damage", accident: "Accident", other: "Other Urgent Issue" };
                  const typeIcons: Record<string, string> = { medical: "🏥", security: "🔒", fire: "🔥", flood: "💧", accident: "⚠️", other: "📋" };
                  const timeAgo = (d: string | null) => {
                    if (!d) return ""; const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
                    if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s / 60)}m ago`;
                    return `${Math.floor(s / 3600)}h ago`;
                  };
                  return (
                    <div key={em.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", borderRadius: 12, border: `2px solid ${isActive ? "#FFCDD2" : "#F5D875"}`, animation: isActive ? "flash 2.5s ease infinite" : "none", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{typeIcons[em.alert_type ?? "other"] ?? "🚨"}</span>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 800, color: "#C62828", fontFamily: "'Inter',sans-serif" }}>🚨 EMERGENCY ALERT</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#2C2C2C" }}>— {em.villa_name ?? "Villa"}</span>
                          <span style={{ fontSize: 12.5, color: "#7A5210" }}>— {typeLabels[em.alert_type ?? "other"] ?? em.alert_type}</span>
                          <span style={{ fontSize: 11.5, color: "#C4B89A" }}>{timeAgo(em.created_at)}</span>
                        </div>
                        <p style={{ fontSize: 12.5, color: "#6B5C3E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 420 }}>{em.description ?? "—"}</p>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        {isActive && (
                          <button onClick={() => acknowledgeEmergency(em.id)} disabled={ackingId === em.id}
                            style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #F5D875", background: "#FFF8E6", color: "#7A5210", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                            {ackingId === em.id ? "…" : "Acknowledge"}
                          </button>
                        )}
                        <button onClick={() => window.location.href = "/dashboard/admin/emergencies/"}
                          style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#C62828", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                          Resolve →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* page heading */}
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 22, fontWeight: 700, color: "#2C2C2C", marginBottom: 3 }}>Dashboard Overview</h1>
              <p style={{ fontSize: 12.5, color: "#9E8E6A" }}>Welcome back, {profile?.full_name ?? "Admin"}. Here&apos;s what&apos;s happening today.</p>
            </div>

            {/* ── STAT CARDS ─────────────────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(195px,1fr))", gap: 14, marginBottom: 24 }}>
              {STAT_CARDS.map((c, i) => (
                <div key={c.label} className="stat-card" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: c.ibg, color: c.icolor, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                    <Ic d={c.icon} size={19} />
                  </div>
                  {statsLoading
                    ? <Skel h={28} w={80} />
                    : <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 700, color: "#2C2C2C", lineHeight: 1 }}>{c.value}</div>
                  }
                  <div style={{ fontSize: 11.5, color: "#9E8E6A", marginTop: 5, fontWeight: 500 }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* ── CHECK-IN PAYMENT ALERTS ─────────────────────────────────────── */}
            {checkinAlerts.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#C62828" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "#2C2C2C", fontFamily: "'Playfair Display',Georgia,serif" }}>Upcoming Check-ins — Payment Unverified</span>
                  <span style={{ background: "#FFF0F0", color: "#C62828", border: "1px solid #FFCDD2", borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700, fontFamily: "Inter,sans-serif" }}>{checkinAlerts.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {checkinAlerts.map(a => (
                    <div key={a.id} style={{ background: "#FFF5F5", border: "1.5px solid #FFCDD2", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#C62828" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#2C2C2C", fontFamily: "Inter,sans-serif" }}>{a.guest_name ?? "Guest"}</div>
                        <div style={{ fontSize: 12, color: "#9E8E6A", fontFamily: "Inter,sans-serif" }}>
                          Check-in: <strong>{a.check_in ? new Date(a.check_in).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</strong>
                        </div>
                      </div>
                      {a.total_amount != null && (
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#C62828", fontFamily: "Inter,sans-serif" }}>
                          ${a.total_amount.toLocaleString()}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          const tmpl = `Dear ${a.guest_name ?? "Guest"},\n\nYour payment for your upcoming check-in on ${a.check_in ? new Date(a.check_in).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "your arrival date"} has not been confirmed.\n\nPlease complete your payment of ${a.total_amount ? "$" + a.total_amount.toLocaleString() : "the outstanding amount"} at your earliest convenience.\n\nThank you,\nStaya Management`;
                          setReminderText(tmpl);
                          setReminderSent(false);
                          setReminderModal(a);
                        }}
                        style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#C62828", color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "Inter,sans-serif", cursor: "pointer", whiteSpace: "nowrap" }}>
                        Send Reminder
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── RECENT BOOKINGS ──────────────────────────────────────────────── */}
            <TableCard title="Recent Bookings" subtitle="Latest 10 reservations across all villas"
              onViewAll={() => window.location.href = "/dashboard/admin/bookings"} loading={bookingsLoading} empty={bookings.length === 0}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Guest Name", "Villa", "Check-in", "Check-out", "OTA", "Amount", "Status"].map(h => <TH key={h}>{h}</TH>)}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, i) => (
                    <tr key={b.id} className="trow" style={{ borderBottom: i < bookings.length - 1 ? "1px solid #F0EBE0" : "none" }}>
                      <td style={{ padding: "13px 18px", fontSize: 13.5, fontWeight: 500, color: "#2C2C2C" }}>{b.guest_name ?? "—"}</td>
                      <td style={{ padding: "13px 18px", fontSize: 13, color: "#6B5C3E" }}>{b.villa_name ?? "—"}</td>
                      <td style={{ padding: "13px 18px", fontSize: 12.5, color: "#6B5C3E", whiteSpace: "nowrap" }}>{fmt(b.check_in)}</td>
                      <td style={{ padding: "13px 18px", fontSize: 12.5, color: "#6B5C3E", whiteSpace: "nowrap" }}>{fmt(b.check_out)}</td>
                      <td style={{ padding: "13px 18px" }}>
                        {b.ota_channel
                          ? <span style={{ fontSize: 12, color: "#5A4A2E", background: "#F5F0E8", padding: "3px 9px", borderRadius: 6, fontWeight: 500 }}>{b.ota_channel}</span>
                          : <span style={{ fontSize: 12, color: "#C4B89A" }}>Direct</span>}
                      </td>
                      <td style={{ padding: "13px 18px", fontSize: 13.5, fontWeight: 600, color: "#2C2C2C", whiteSpace: "nowrap" }}>
                        {b.total_amount != null ? `$${Number(b.total_amount).toLocaleString()}` : "—"}
                      </td>
                      <td style={{ padding: "13px 18px" }}><Badge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableCard>

            {/* ── RECENT PETTY CASH ─────────────────────────────────────────────── */}
            <TableCard title="Recent Petty Cash Requests" subtitle="Latest submissions — approve or reject pending items"
              onViewAll={() => setActivePage("Petty Cash")} loading={pettyLoading} empty={petty.length === 0}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Villa", "Submitted By", "Category", "Amount", "Date", "Status", "Actions"].map(h => <TH key={h}>{h}</TH>)}
                  </tr>
                </thead>
                <tbody>
                  {petty.map((p, i) => {
                    const isPending = (p.status ?? "").toLowerCase() === "pending";
                    const isUpd = pettyUpdating === p.id;
                    return (
                      <tr key={p.id} className="trow" style={{ borderBottom: i < petty.length - 1 ? "1px solid #F0EBE0" : "none" }}>
                        <td style={{ padding: "13px 18px", fontSize: 13, fontWeight: 500, color: "#2C2C2C" }}>{p.villa_name ?? "—"}</td>
                        <td style={{ padding: "13px 18px", fontSize: 13, color: "#6B5C3E" }}>{p.submitted_by ?? "—"}</td>
                        <td style={{ padding: "13px 18px" }}>
                          {p.category
                            ? <span style={{ fontSize: 12, color: "#5A4A2E", background: "#F5F0E8", padding: "3px 9px", borderRadius: 6, fontWeight: 500 }}>{p.category}</span>
                            : <span style={{ color: "#C4B89A" }}>—</span>}
                        </td>
                        <td style={{ padding: "13px 18px", fontSize: 13.5, fontWeight: 600, color: "#2C2C2C", whiteSpace: "nowrap" }}>
                          {p.amount != null ? `$${Number(p.amount).toLocaleString()}` : "—"}
                        </td>
                        <td style={{ padding: "13px 18px", fontSize: 12.5, color: "#6B5C3E", whiteSpace: "nowrap" }}>{fmt(p.created_at)}</td>
                        <td style={{ padding: "13px 18px" }}><Badge status={p.status} /></td>
                        <td style={{ padding: "13px 18px" }}>
                          {isPending ? (
                            <div style={{ display: "flex", gap: 7 }}>
                              <button className="action-btn approve" disabled={isUpd} onClick={() => updatePetty(p.id, "approved")}>
                                {isUpd
                                  ? <div style={{ width: 11, height: 11, border: "1.5px solid #1E7A48", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .6s linear infinite" }} />
                                  : <><svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d={P.check} /></svg>Approve</>}
                              </button>
                              <button className="action-btn reject" disabled={isUpd} onClick={() => updatePetty(p.id, "rejected")}>
                                {isUpd
                                  ? <div style={{ width: 11, height: 11, border: "1.5px solid #9B2C2C", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .6s linear infinite" }} />
                                  : <><svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d={P.xmark} /></svg>Reject</>}
                              </button>
                            </div>
                          ) : <span style={{ fontSize: 12, color: "#C4B89A" }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableCard>

            {/* ── RECENT SERVICE ORDERS ─────────────────────────────────────────── */}
            <TableCard title="Recent Service Orders" subtitle="Latest guest service requests across all villas"
              onViewAll={() => setActivePage("Services")} loading={servicesLoading} empty={services.length === 0}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Guest", "Villa", "Service", "Date", "Amount", "Status"].map(h => <TH key={h}>{h}</TH>)}
                  </tr>
                </thead>
                <tbody>
                  {services.map((s, i) => (
                    <tr key={s.id} className="trow" style={{ borderBottom: i < services.length - 1 ? "1px solid #F0EBE0" : "none" }}>
                      <td style={{ padding: "13px 18px", fontSize: 13.5, fontWeight: 500, color: "#2C2C2C" }}>{s.guest_name ?? "—"}</td>
                      <td style={{ padding: "13px 18px", fontSize: 13, color: "#6B5C3E" }}>{s.villa_name ?? "—"}</td>
                      <td style={{ padding: "13px 18px" }}>
                        {s.service_name
                          ? <span style={{ fontSize: 12.5, color: "#5A4A2E", background: "#F5F0E8", padding: "3px 9px", borderRadius: 6, fontWeight: 500 }}>{s.service_name}</span>
                          : <span style={{ color: "#C4B89A" }}>—</span>}
                      </td>
                      <td style={{ padding: "13px 18px", fontSize: 12.5, color: "#6B5C3E", whiteSpace: "nowrap" }}>{fmt(s.service_date)}</td>
                      <td style={{ padding: "13px 18px", fontSize: 13.5, fontWeight: 600, color: "#2C2C2C", whiteSpace: "nowrap" }}>
                        {s.amount != null ? `$${Number(s.amount).toLocaleString()}` : "—"}
                      </td>
                      <td style={{ padding: "13px 18px" }}><Badge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableCard>

          </main>
        </div>
      </div>

      {/* ── Check-in reminder modal ─────────────────────────────────────────── */}
      {reminderModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(44,28,10,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => e.target === e.currentTarget && setReminderModal(null)}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 500, boxShadow: "0 20px 60px rgba(44,28,10,.25)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #EDE6D6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C" }}>Send Payment Reminder</h2>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9E8E6A", fontFamily: "Inter,sans-serif" }}>To: {reminderModal.guest_name}</p>
              </div>
              <button onClick={() => setReminderModal(null)} style={{ background: "#F5F0E8", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7A6A50" }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: "18px 24px" }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", letterSpacing: ".04em", fontFamily: "Inter,sans-serif", marginBottom: 6, display: "block" }}>Email Template</label>
              <textarea value={reminderText} onChange={e => setReminderText(e.target.value)} rows={8}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #DDD5C0", borderRadius: 8, fontSize: 13, fontFamily: "Inter,sans-serif", color: "#2C2C2C", background: "#FDFBF7", resize: "vertical", lineHeight: 1.6, outline: "none", boxSizing: "border-box" }} />
              {reminderSent && (
                <div style={{ marginTop: 8, padding: "8px 12px", background: "#EDFAF3", border: "1px solid #B0E8CB", borderRadius: 8, fontSize: 12.5, color: "#1E7A48", fontFamily: "Inter,sans-serif" }}>
                  ✓ Reminder sent and logged.
                </div>
              )}
            </div>
            <div style={{ padding: "12px 24px 20px", borderTop: "1px solid #EDE6D6", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setReminderModal(null)} style={{ padding: "9px 20px", borderRadius: 8, border: "1.5px solid #DDD5C0", background: "transparent", color: "#7A6A50", fontSize: 13, fontWeight: 600, fontFamily: "Inter,sans-serif", cursor: "pointer" }}>Cancel</button>
              <button onClick={async () => {
                setReminderSending(true);
                try { await supabase.from("payment_reminders").insert([{ payment_id: reminderModal.id, template_text: reminderText, sent_at: new Date().toISOString() }]); } catch {}
                setReminderSending(false); setReminderSent(true);
                setTimeout(() => setReminderModal(null), 1500);
              }} disabled={reminderSending || reminderSent}
                style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: reminderSending || reminderSent ? "#E8D89A" : "#C9A84C", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "Inter,sans-serif", cursor: reminderSending || reminderSent ? "default" : "pointer" }}>
                {reminderSent ? "Sent ✓" : reminderSending ? "Sending…" : "Send Reminder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

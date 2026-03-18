"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/* ─── types ──────────────────────────────────────────────────────────────────── */
interface Villa   { id: string; name: string | null; }
interface Booking {
  id: string; villa_id: string | null; guest_name: string | null;
  guest_email: string | null; ota_channel: string | null; status: string | null;
  check_in: string | null; check_out: string | null;
}
interface Message {
  id: string; booking_id: string; sender_name: string | null;
  sender_role: string | null; content: string | null;
  created_at: string; is_guest: boolean | null; is_read: boolean | null;
}

/* ─── OTA config ─────────────────────────────────────────────────────────────── */
const OTA: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  airbnb:  { label: "Airbnb",      color: "#FF5A5F", bg: "#FFF0F0", emoji: "🔴" },
  booking: { label: "Booking.com", color: "#003580", bg: "#EEF2FF", emoji: "🔵" },
  vrbo:    { label: "Vrbo",        color: "#1A6B96", bg: "#EEF4FF", emoji: "🟢" },
  expedia: { label: "Expedia",     color: "#D7910A", bg: "#FFF8E6", emoji: "🟡" },
  direct:  { label: "Direct",      color: "#2D8A57", bg: "#EDFAF3", emoji: "⚪" },
};
const OTA_KEYS = ["all", "airbnb", "booking", "vrbo", "expedia", "direct"] as const;

/* ─── icon helper ─────────────────────────────────────────────────────────────── */
function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} style={{ flexShrink: 0 }}>
      {d.split(" M").map((seg, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={i === 0 ? seg : "M" + seg} />)}
    </svg>
  );
}
const P = {
  home:    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  villa:   "M3 22h18 M4 22V9l8-7 8 7v13 M9 22V16h6v6 M9 10h.01 M15 10h.01",
  cal:     "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  channel: "M22 12h-4l-3 9L9 3l-3 9H2",
  msg:     "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  cash:    "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  wrench:  "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  service: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  doc:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  pay:     "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z",
  cog:     "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  logout:  "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  send:    "M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z",
  search:  "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  sync:    "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  check:   "M5 13l4 4L19 7",
};

const NAV = [
  { label: "Dashboard",        icon: P.home,    href: "/dashboard/admin" },
  { label: "Villas",           icon: P.villa,   href: "/dashboard/admin/villas" },
  { label: "Bookings",         icon: P.cal,     href: "/dashboard/admin/bookings" },
  { label: "Channel Manager",  icon: P.channel, href: "/dashboard/admin/channel-manager" },
  { label: "Messages",         icon: P.msg,     href: "/dashboard/admin/messages" },
  { label: "Petty Cash",       icon: P.cash,    href: "/dashboard/admin/petty-cash" },
  { label: "Maintenance",      icon: P.wrench,  href: "/dashboard/admin/maintenance" },
  { label: "Services",         icon: P.service, href: "/dashboard/admin/services" },
  { label: "Owner Statements", icon: P.doc,     href: null },
  { label: "Payments",         icon: P.pay,     href: "/dashboard/admin/payments" },
  { label: "Settings",         icon: P.cog,     href: "/dashboard/admin/settings" },
];

/* ─── formatters ─────────────────────────────────────────────────────────────── */
function fmtDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTimeShort(ts: string) {
  const d = new Date(ts), now = new Date();
  const diff = Math.round((now.getTime() - d.getTime()) / 60000);
  if (diff < 1)    return "Just now";
  if (diff < 60)   return `${diff}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  if (diff < 2880) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function fmtTimeFull(ts: string) {
  return new Date(ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
function fmtDaySep(ts: string) {
  const d = new Date(ts), now = new Date();
  const diff = Math.round((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}
function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
}

/* ─── component ──────────────────────────────────────────────────────────────── */
export default function AdminMessagesPage() {
  const [showTemplates, setShowTemplates] = useState(false);
  const [adminName,    setAdminName]    = useState("Manager");
  const [adminId,      setAdminId]      = useState<string | null>(null);
  const [villas,       setVillas]       = useState<Villa[]>([]);
  const [bookings,     setBookings]     = useState<Booking[]>([]);
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [unreadMap,    setUnreadMap]    = useState<Record<string, number>>({});
  const [lastMsgMap,   setLastMsgMap]   = useState<Record<string, Message | null>>({});

  const [loading,      setLoading]      = useState(true);
  const [msgLoading,   setMsgLoading]   = useState(false);
  const [sending,      setSending]      = useState(false);

  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [villaFilter,  setVillaFilter]  = useState("all");
  const [otaFilter,    setOtaFilter]    = useState("all");
  const [search,       setSearch]       = useState("");
  const [inputText,    setInputText]    = useState("");
  const [schemaError,  setSchemaError]  = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  /* ─── auth + initial data load ─── */
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      const { data: prof } = await supabase.from("profiles")
        .select("full_name,role").eq("id", user.id).single();
      if (!prof || !["super_admin","villa_manager","villa_owner"].includes(prof.role ?? "")) {
        window.location.href = "/"; return;
      }
      setAdminName(prof.full_name ?? "Manager");
      setAdminId(user.id);
      await loadData();
    });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [vRes, bRes] = await Promise.all([
      supabase.from("villas").select("id,name").order("name"),
      supabase.from("bookings")
        .select("id,villa_id,guest_name,guest_email,ota_channel,status,check_in,check_out")
        .neq("status", "cancelled")
        .order("check_in", { ascending: false }),
    ]);
    const vs = (vRes.data ?? []) as Villa[];
    const bs = (bRes.data ?? []) as Booking[];
    setVillas(vs);
    setBookings(bs);

    // Load unread counts + last message per booking
    if (bs.length > 0) {
      const bids = bs.map(b => b.id);
      const { data: msgs, error } = await supabase.from("messages")
        .select("id,booking_id,sender_name,content,created_at,is_guest,is_read")
        .in("booking_id", bids)
        .order("created_at", { ascending: false });

      if (error?.message?.includes("does not exist")) {
        setSchemaError(true);
        setLoading(false);
        return;
      }

      const uMap: Record<string, number> = {};
      const lMap: Record<string, Message | null> = {};
      for (const m of (msgs ?? []) as Message[]) {
        if (!lMap[m.booking_id]) lMap[m.booking_id] = m;
        if (m.is_guest && !m.is_read) {
          uMap[m.booking_id] = (uMap[m.booking_id] ?? 0) + 1;
        }
      }
      setUnreadMap(uMap);
      setLastMsgMap(lMap);
    }
    setLoading(false);
  }, []);

  /* ─── load messages for selected booking ─── */
  const loadMessages = useCallback(async (bookingId: string) => {
    setMsgLoading(true);
    const { data, error } = await supabase.from("messages")
      .select("id,booking_id,sender_name,sender_role,content,created_at,is_guest,is_read")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error?.message?.includes("does not exist")) { setSchemaError(true); }
    setMessages((data ?? []) as Message[]);
    setMsgLoading(false);

    // Mark guest messages as read
    await supabase.from("messages")
      .update({ is_read: true })
      .eq("booking_id", bookingId)
      .eq("is_guest", true)
      .eq("is_read", false);

    setUnreadMap(prev => ({ ...prev, [bookingId]: 0 }));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  /* ─── real-time subscription for open conversation ─── */
  useEffect(() => {
    if (!selectedId) return;
    const ch = supabase.channel(`admin_msgs_${selectedId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `booking_id=eq.${selectedId}`,
      }, payload => {
        const m = payload.new as Message;
        setMessages(prev => [...prev, m]);
        setLastMsgMap(prev => ({ ...prev, [selectedId]: m }));
        // If it's a guest message, mark it read immediately (admin is looking)
        if (m.is_guest) {
          supabase.from("messages").update({ is_read: true }).eq("id", m.id);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedId]);

  /* ─── real-time: unread badge updates for ALL bookings ─── */
  useEffect(() => {
    if (bookings.length === 0) return;
    const ch = supabase.channel("admin_msgs_all")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
      }, payload => {
        const m = payload.new as Message;
        if (!m.is_guest) return; // Only guest messages bump unread
        setLastMsgMap(prev => ({ ...prev, [m.booking_id]: m }));
        if (m.booking_id !== selectedId) {
          setUnreadMap(prev => ({ ...prev, [m.booking_id]: (prev[m.booking_id] ?? 0) + 1 }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [bookings.length, selectedId]);

  /* ─── scroll to bottom ─── */
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [messages]);

  /* ─── send message ─── */
  async function sendMessage() {
    if (!selectedId || !inputText.trim() || !adminId) return;
    setSending(true);
    const booking = bookings.find(b => b.id === selectedId);
    const text = inputText.trim();
    setInputText("");
    const { error } = await supabase.from("messages").insert([{
      booking_id:  selectedId,
      villa_id:    booking?.villa_id ?? null,
      sender_id:   adminId,
      sender_name: adminName,
      sender_role: "super_admin",
      sender_type: "host",
      body:        text,
      content:     text,
      channel:     booking?.ota_channel ?? "direct",
      is_guest:    false,
      is_read:     true,
      admin_notified: false,
    }]);
    if (error) {
      if (error.message.includes("does not exist")) setSchemaError(true);
      setInputText(text);
    }
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  /* ─── filtered list ─── */
  const totalUnread = Object.values(unreadMap).reduce((s, n) => s + n, 0);

  const filtered = bookings.filter(b => {
    if (villaFilter !== "all" && b.villa_id !== villaFilter) return false;
    if (otaFilter   !== "all" && b.ota_channel !== otaFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const v = villas.find(v => v.id === b.villa_id);
      if (!b.guest_name?.toLowerCase().includes(q) &&
          !b.guest_email?.toLowerCase().includes(q) &&
          !v?.name?.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    const ta = lastMsgMap[a.id]?.created_at ?? a.check_in ?? "";
    const tb = lastMsgMap[b.id]?.created_at ?? b.check_in ?? "";
    return tb.localeCompare(ta);
  });

  const selBooking = bookings.find(b => b.id === selectedId) ?? null;
  const selVilla   = villas.find(v => v.id === selBooking?.villa_id) ?? null;
  const selOta     = OTA[selBooking?.ota_channel ?? "direct"] ?? OTA.direct;

  /* ─── date separators ─── */
  function renderMessages() {
    const nodes: React.ReactNode[] = [];
    let lastDay = "";
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (!m.created_at) continue;
      const day = fmtDaySep(m.created_at);
      if (day !== lastDay) {
        lastDay = day;
        nodes.push(
          <div key={`sep_${i}`} style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 10px" }}>
            <div style={{ flex: 1, height: 1, background: "#E0D5C5" }} />
            <span style={{ fontSize: 11, color: "#A0906E", fontWeight: 600 }}>{day}</span>
            <div style={{ flex: 1, height: 1, background: "#E0D5C5" }} />
          </div>
        );
      }
      const isHost = !m.is_guest;
      nodes.push(
        <div key={m.id} style={{ display: "flex", flexDirection: isHost ? "row-reverse" : "row", gap: 8, alignItems: "flex-end", margin: "3px 0" }}>
          {!isHost && (
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: selOta.bg, color: selOta.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {initials(m.sender_name)}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: isHost ? "flex-end" : "flex-start", gap: 3, maxWidth: "72%" }}>
            <div style={{ fontSize: 10.5, color: "#A0906E" }}>
              {isHost ? adminName : (m.sender_name ?? "Guest")}
            </div>
            <div style={{
              padding: "10px 14px", borderRadius: isHost ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: isHost ? "#C9A84C" : "#fff",
              color: isHost ? "#fff" : "#3D2E1A",
              fontSize: 13.5, lineHeight: 1.55, wordBreak: "break-word",
              boxShadow: isHost ? "none" : "0 1px 4px rgba(0,0,0,.08)",
              border: isHost ? "none" : "1px solid #EDE6D6",
            }}>
              {m.content}
            </div>
            <div style={{ fontSize: 10.5, color: "#B0A090" }}>{fmtTimeFull(m.created_at)}</div>
          </div>
        </div>
      );
    }
    return nodes;
  }

  /* ─── JSX ────────────────────────────────────────────────────────────────────── */
  return (
    <div style={{ display: "flex", height: "100vh", background: "#F5F0E8", fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .nav-item{display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:10px;border:none;background:none;color:#A0906E;cursor:pointer;width:100%;text-align:left;font-size:13px;font-weight:500;transition:all .15s}
        .nav-item:hover{background:#F5F0E8;color:#4A3B27}
        .nav-item.active{background:linear-gradient(135deg,#C9A84C20,#C9A84C10);color:#4A3B27;font-weight:600;border-left:3px solid #C9A84C;padding-left:13px}
        .nav-item.active .ni{color:#C9A84C}
        .conv{padding:14px 16px;border-bottom:1px solid #F0E8DC;cursor:pointer;transition:background .15s;display:flex;gap:12px;align-items:flex-start}
        .conv:hover{background:#F9F6F0}
        .conv.sel{background:#FFF8ED;border-left:3px solid #C9A84C;padding-left:13px}
        .pill{padding:5px 12px;border-radius:99px;border:1.5px solid #E0D5C5;background:#fff;color:#7A6A55;font-size:11.5px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap}
        .pill.on{background:#C9A84C;border-color:#C9A84C;color:#fff}
        .pill:hover:not(.on){border-color:#C9A84C;color:#C9A84C}
        .ota{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:99px;font-size:10.5px;font-weight:700}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#DDD5C0;border-radius:10px}
        textarea{font-family:inherit}
      `}</style>

      {/* ── left nav ── */}
      <aside style={{ width: 220, background: "#2C1E0F", display: "flex", flexDirection: "column", padding: "20px 12px", gap: 2, flexShrink: 0 }}>
        <div style={{ padding: "4px 12px 20px", borderBottom: "1px solid #3D2E1A", marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#C9A84C", fontFamily: "'Playfair Display',serif" }}>Staya</div>
          <div style={{ fontSize: 10, color: "#7A6A55", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }}>Management</div>
        </div>
        {NAV.map(item => {
          const isActive = item.label === "Messages";
          return (
            <button key={item.label} className={`nav-item${isActive ? " active" : ""}`}
              onClick={() => { if (item.href) window.location.href = item.href; }}>
              <span className="ni" style={{ color: isActive ? "#C9A84C" : "#A0906E" }}><Ic d={item.icon} size={15} /></span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.label === "Messages" && totalUnread > 0 && (
                <span style={{ background: "#C9A84C", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 99 }}>{totalUnread}</span>
              )}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <button className="nav-item" onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}>
          <Ic d={P.logout} size={15} /><span>Sign Out</span>
        </button>
      </aside>

      {/* ── conversation list ── */}
      <div style={{ width: 340, background: "#fff", display: "flex", flexDirection: "column", borderRight: "1px solid #E8DFD0", flexShrink: 0 }}>
        <div style={{ padding: "18px 16px 12px", borderBottom: "1px solid #F0E8DC" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#2C1E0F", fontFamily: "'Playfair Display',serif" }}>
                Messages
                {totalUnread > 0 && (
                  <span style={{ marginLeft: 8, background: "#FF5A5F", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 99, verticalAlign: "middle" }}>{totalUnread}</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#A0906E", marginTop: 2 }}>{filtered.length} conversation{filtered.length !== 1 ? "s" : ""}</div>
            </div>
            <button title="Refresh" style={{ border: "1px solid #E0D5C5", background: "#fff", borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: "#7A6A55" }} onClick={loadData}>
              <Ic d={P.sync} size={15} />
            </button>
          </div>

          {/* search */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#B0A090" }}><Ic d={P.search} size={14} /></span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search guest or villa…"
              style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1px solid #E0D5C5", borderRadius: 8, fontSize: 13, outline: "none", background: "#FAF7F2", color: "#3D2E1A" }} />
          </div>

          {/* villa filter */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 }}>
            <button className={`pill${villaFilter === "all" ? " on" : ""}`} onClick={() => setVillaFilter("all")}>All Villas</button>
            {villas.map(v => (
              <button key={v.id} className={`pill${villaFilter === v.id ? " on" : ""}`} onClick={() => setVillaFilter(v.id)}>{v.name}</button>
            ))}
          </div>

          {/* OTA filter */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, marginTop: 6 }}>
            {OTA_KEYS.map(key => {
              const cfg = key === "all" ? null : OTA[key];
              return (
                <button key={key} className={`pill${otaFilter === key ? " on" : ""}`}
                  onClick={() => setOtaFilter(key)}
                  style={otaFilter === key && cfg ? { background: cfg.color, borderColor: cfg.color } : {}}>
                  {key === "all" ? "All OTAs" : `${cfg?.emoji} ${cfg?.label}`}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {schemaError ? (
            <div style={{ padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🗄️</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#4A3B27", marginBottom: 6 }}>Database migration needed</div>
              <div style={{ fontSize: 12, color: "#A0906E", lineHeight: 1.6 }}>
                Run the SQL migration in your Supabase SQL Editor to enable messaging.
              </div>
            </div>
          ) : loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "#A0906E", fontSize: 13 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#A0906E", fontSize: 13 }}>No conversations found.</div>
          ) : filtered.map(b => {
            const villa   = villas.find(v => v.id === b.villa_id);
            const lastMsg = lastMsgMap[b.id];
            const unread  = unreadMap[b.id] ?? 0;
            const ota     = OTA[b.ota_channel ?? "direct"] ?? OTA.direct;
            const isSel   = selectedId === b.id;
            return (
              <div key={b.id} className={`conv${isSel ? " sel" : ""}`}
                onClick={() => setSelectedId(b.id)}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: ota.bg, color: ota.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0, border: `2px solid ${ota.color}30` }}>
                  {initials(b.guest_name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
                    <div style={{ fontWeight: unread > 0 ? 700 : 600, color: "#2C1E0F", fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {b.guest_name ?? "Unknown Guest"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                      {lastMsg && <span style={{ fontSize: 11, color: "#B0A090", whiteSpace: "nowrap" }}>{fmtTimeShort(lastMsg.created_at)}</span>}
                      {unread > 0 && (
                        <span style={{ background: "#C9A84C", color: "#fff", fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{unread}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                    <span style={{ fontSize: 11, color: "#7A6A55", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🏡 {villa?.name ?? "—"}</span>
                    <span style={{ color: "#D0C5B5" }}>·</span>
                    <span className="ota" style={{ background: ota.bg, color: ota.color }}>{ota.emoji} {ota.label}</span>
                  </div>
                  {lastMsg && (
                    <div style={{ fontSize: 12, color: unread > 0 ? "#4A3B27" : "#A0906E", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: unread > 0 ? 600 : 400 }}>
                      {lastMsg.is_guest ? "" : "You: "}{lastMsg.content}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "#B0A090", marginTop: 3 }}>
                    {fmtDate(b.check_in)} → {fmtDate(b.check_out)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── chat panel ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#FAF7F2" }}>
        {!selBooking ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40 }}>
            <div style={{ width: 72, height: 72, background: "#F0E8DC", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#C9A84C" }}>
              <Ic d={P.msg} size={32} />
            </div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: "#2C1E0F", fontWeight: 700 }}>Select a conversation</div>
            <div style={{ color: "#A0906E", fontSize: 13.5, textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>
              Messages you send here appear instantly in the guest&apos;s portal. Guest replies show up in real-time.
            </div>
            {/* OTA counts */}
            <div style={{ background: "#fff", border: "1px solid #E8DFD0", borderRadius: 12, padding: "14px 20px", maxWidth: 400, width: "100%", marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#7A6A55", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Bookings by Channel</div>
              {Object.entries(OTA).filter(([k]) => k !== "direct").concat([["direct", OTA.direct]]).map(([key, cfg]) => {
                const count = bookings.filter(b => (b.ota_channel ?? "direct") === key).length;
                const uTotal = bookings.filter(b => (b.ota_channel ?? "direct") === key).reduce((s, b) => s + (unreadMap[b.id] ?? 0), 0);
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid #F0E8DC" }}>
                    <span className="ota" style={{ background: cfg.bg, color: cfg.color }}>{cfg.emoji} {cfg.label}</span>
                    <span style={{ flex: 1, fontSize: 11, color: "#A0906E" }}>{count} booking{count !== 1 ? "s" : ""}</span>
                    {uTotal > 0 && <span style={{ background: "#FF5A5F", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99 }}>{uTotal} unread</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* chat header */}
            <div style={{ padding: "14px 20px", background: "#fff", borderBottom: "1px solid #E8DFD0", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: selOta.bg, color: selOta.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, border: `2px solid ${selOta.color}30` }}>
                {initials(selBooking.guest_name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "#2C1E0F", fontSize: 15 }}>{selBooking.guest_name ?? "Unknown Guest"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#7A6A55" }}>🏡 {selVilla?.name}</span>
                  <span className="ota" style={{ background: selOta.bg, color: selOta.color }}>{selOta.emoji} {selOta.label}</span>
                  <span style={{ fontSize: 12, color: "#A0906E" }}>{fmtDate(selBooking.check_in)} → {fmtDate(selBooking.check_out)}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#2D8A57", background: "#EDFAF3", padding: "5px 10px", borderRadius: 20, fontWeight: 600 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2D8A57", display: "inline-block" }} />
                  Live
                </div>
                <button title="View booking" style={{ border: "1px solid #E0D5C5", background: "#fff", borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: "#7A6A55" }}
                  onClick={() => window.location.href = "/dashboard/admin/bookings"}>
                  <Ic d={P.cal} size={15} />
                </button>
              </div>
            </div>

            {/* booking info bar */}
            <div style={{ background: "#FFF8ED", borderBottom: "1px solid #F0E4C8", padding: "8px 20px", display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[
                { label: "Status",    val: selBooking.status ?? "—" },
                { label: "Check-in",  val: fmtDate(selBooking.check_in) },
                { label: "Check-out", val: fmtDate(selBooking.check_out) },
                { label: "Email",     val: selBooking.guest_email ?? "—" },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: "#A0906E", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 12.5, color: "#3D2E1A", fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>

            {/* messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column" }}>
              {msgLoading ? (
                <div style={{ textAlign: "center", color: "#A0906E", fontSize: 13, padding: 32 }}>Loading messages…</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", color: "#A0906E", fontSize: 13, padding: 48 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>💬</div>
                  No messages yet. Send the first message — the guest will see it immediately in their portal.
                </div>
              ) : renderMessages()}
              <div ref={bottomRef} />
            </div>

            {/* compose */}
            <div style={{ background: "#fff", borderTop: "1px solid #E8DFD0", padding: "12px 20px" }}>
              {schemaError && (
                <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "#9B2C2C" }}>
                  ⚠️ Run the SQL migration in Supabase to enable message storage.
                </div>
              )}
              {/* Quick templates */}
              <div style={{ position: "relative", marginBottom: 8 }}>
                <button onClick={() => setShowTemplates(t => !t)}
                  style={{ fontSize: 11.5, color: "#7A6A55", background: "#F5F0E8", border: "1px solid #E0D5C5", borderRadius: 7, padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontWeight: 500 }}>
                  ⚡ Quick Reply <span style={{ fontSize: 9, marginTop: 1 }}>▼</span>
                </button>
                {showTemplates && (
                  <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, background: "#fff", border: "1px solid #E0D5C5", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,.12)", zIndex: 50, minWidth: 280, overflow: "hidden" }}>
                    {[
                      { label: "Thank you for booking!", text: `Dear ${selBooking?.guest_name?.split(" ")[0] ?? "Guest"}, thank you for your booking! We are delighted to welcome you to ${selVilla?.name ?? "our villa"}. We will be in touch with full check-in details shortly. 🏡` },
                      { label: "Check-in instructions", text: `Check-in is at 2:00 PM. Our team will greet you at the villa. The WiFi password and access codes will be provided upon arrival. Please let us know your estimated arrival time!` },
                      { label: "Your villa is ready! ✓", text: `Great news — ${selVilla?.name ?? "your villa"} is all prepared and ready for your arrival. Everything has been set up to ensure a comfortable and luxurious stay. We look forward to welcoming you!` },
                      { label: "Safe travels!", text: `We hope you had a wonderful stay at ${selVilla?.name ?? "our villa"}! Safe travels, and we look forward to welcoming you back soon. Please take a moment to leave us a review — it means a lot to us! 🌟` },
                      { label: "Housekeeping schedule", text: `Housekeeping visits daily between 10:00 AM and 1:00 PM. Please leave the key at the front desk or let us know if you prefer a different time. Let us know if you need any extra towels or amenities!` },
                    ].map(t => (
                      <button key={t.label} onClick={() => { setInputText(t.text); setShowTemplates(false); setTimeout(() => inputRef.current?.focus(), 50); }}
                        style={{ width: "100%", textAlign: "left", padding: "10px 14px", border: "none", background: "transparent", cursor: "pointer", fontSize: 12.5, color: "#3D2E1A", borderBottom: "1px solid #F0E8DC", fontFamily: "inherit" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#FFF8ED")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea ref={inputRef} value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={`Reply to ${selBooking?.guest_name ?? "guest"} via ${selOta.label}… (Enter to send)`}
                  rows={2}
                  style={{ flex: 1, border: "1.5px solid #E0D5C5", borderRadius: 10, padding: "10px 14px", fontSize: 13.5, resize: "none", outline: "none", fontFamily: "inherit", background: "#FAF7F2", color: "#3D2E1A", lineHeight: 1.5 }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <button onClick={sendMessage} disabled={sending || !inputText.trim() || schemaError}
                    style={{ background: sending || !inputText.trim() || schemaError ? "#E0D5C5" : "#C9A84C", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", cursor: sending || !inputText.trim() || schemaError ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 5, transition: "background .15s", whiteSpace: "nowrap" }}>
                    <Ic d={P.send} size={13} /> Send via {selOta.label}
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#B0A090", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                <Ic d={P.check} size={11} /> Guest receives this message instantly in their portal
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

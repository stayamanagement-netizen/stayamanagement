"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface Profile  { id: string; full_name: string | null; role: string; }
interface Booking  { id: string; guest_name: string | null; guest_email: string | null; ota_channel: string | null; check_in: string | null; check_out: string | null; status: string | null; villa_id: string | null; }
interface Message  { id: string; booking_id: string; sender_name: string | null; sender_role: string | null; content: string | null; body: string | null; created_at: string; is_guest: boolean | null; is_read: boolean | null; }

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}
function Skel({ w = "100%", h = 14 }: { w?: string | number; h?: number }) {
  return <div style={{ width: w, height: h, borderRadius: 6, background: "linear-gradient(90deg,#EDE6D6 25%,#F5EFE3 50%,#EDE6D6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />;
}
function ini(n: string | null) { if (!n) return "?"; return n.trim().split(" ").map(w => w[0] ?? "").slice(0, 2).join("").toUpperCase(); }
function fmtDT(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
function fmtD(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }
function fmtAgo(d: string | null) {
  if (!d) return "—";
  const diff = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  if (diff < 2880) return "Yesterday";
  return fmtD(d);
}

const OTA: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  airbnb:  { label: "Airbnb",      color: "#FF5A5F", bg: "#FFF0F0", emoji: "🔴" },
  booking: { label: "Booking.com", color: "#003580", bg: "#EEF2FF", emoji: "🔵" },
  vrbo:    { label: "Vrbo",        color: "#1A6B96", bg: "#EEF4FF", emoji: "🟢" },
  expedia: { label: "Expedia",     color: "#D7910A", bg: "#FFF8E6", emoji: "🟡" },
  direct:  { label: "Direct",      color: "#2D8A57", bg: "#EDFAF3", emoji: "⚪" },
};

const QUICK_REPLIES = [
  { label: "Thank you for booking!", text: "Thank you for your booking! We are so excited to welcome you. We will be in touch with full check-in details closer to your arrival date. 🏡" },
  { label: "Check-in instructions", text: "Check-in is at 2:00 PM. Our team will be at the villa to greet you. The WiFi password and access details will be provided on arrival. Please share your estimated arrival time!" },
  { label: "Your villa is ready ✓", text: "Great news — your villa is all prepared and ready for your arrival! Everything has been set up to ensure a wonderful stay. We look forward to welcoming you." },
  { label: "Safe travels!", text: "We hope you had a wonderful stay! Safe travels home, and we truly hope to welcome you back again soon. Please feel free to leave us a review — it means a lot! 🌟" },
  { label: "Housekeeping schedule", text: "Housekeeping visits daily between 10:00 AM and 1:00 PM. Please leave the key at the front entrance or let us know if you prefer a different time. Do not hesitate to request extra towels or amenities!" },
];

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
  send:   "M22 2L11 13 M22 2L15 22l-4-9-9-4 22-7z",
  search: "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  sync:   "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  check:  "M5 13l4 4L19 7",
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
  { label: "Emergencies",    icon: P_ALERT,  href: "/dashboard/manager/emergencies" },
  { label: "Settings",       icon: P.gear,   href: "/dashboard/manager/settings" },
];

function Sidebar({ name, unreadCount, unreadBadge }: { name: string; unreadCount: number; unreadBadge?: number }) {
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
          const isMsgs = item.label === "Guest Messages";
          return (
            <div key={item.label} onClick={() => item.href && (window.location.href = item.href)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, marginBottom: 2, cursor: item.href ? "pointer" : "default", background: active ? "rgba(201,168,76,.18)" : "transparent", color: active ? "#C9A84C" : item.href ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.3)", opacity: item.href ? 1 : 0.5, transition: "all .15s" }}>
              <Ic d={item.icon} size={15} />
              <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, flex: 1 }}>{item.label}</span>
              {isMsgs && unreadCount > 0 && (
                <span style={{ background: "#FF5A5F", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 99, minWidth: 18, textAlign: "center" }}>{unreadCount}</span>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{ini(name)}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
          <div style={{ fontSize: 10, color: "rgba(201,168,76,.7)" }}>Villa Manager</div>
        </div>
        <div style={{ cursor: "pointer", color: "rgba(255,255,255,.4)" }} onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}><Ic d={P.logout} size={14} /></div>
      </div>
    </div>
  );
}

export default function ManagerMessagesPage() {
  const [profile, setProfile]         = useState<Profile | null>(null);
  const [villaId, setVillaId]         = useState<string | null>(null);
  const [villaName, setVillaName]     = useState<string>("My Villa");
  const [authReady, setAuthReady]     = useState(false);

  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [lastMsgMap, setLastMsgMap]   = useState<Record<string, Message | null>>({});
  const [unreadMap, setUnreadMap]     = useState<Record<string, number>>({});
  const [bookingsLoading, setBL]      = useState(true);

  const [selected, setSelected]       = useState<Booking | null>(null);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [msgsLoading, setML]          = useState(false);

  const [reply, setReply]             = useState("");
  const [sending, setSending]         = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [search, setSearch]           = useState("");

  const bottomRef  = useRef<HTMLDivElement>(null);
  const replyRef   = useRef<HTMLTextAreaElement>(null);

  /* ── auth ── */
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      try {
        const { data: prof } = await supabase.from("profiles").select("id,full_name,role").eq("id", user.id).single();
        if (!prof) { window.location.href = "/"; return; }
        if (prof.role === "super_admin") { window.location.href = "/dashboard/admin"; return; }
        if (prof.role === "villa_owner") { window.location.href = "/dashboard/owner"; return; }
        if (prof.role !== "villa_manager") { window.location.href = "/"; return; }
        setProfile(prof); setAuthReady(true);
      } catch { window.location.href = "/"; }
    });
  }, []);

  /* ── get villa for manager ── */
  const fetchVilla = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: vm } = await supabase.from("villa_managers").select("villa_id, villas(name)").eq("manager_id", user.id).single();
    if (vm?.villa_id) {
      setVillaId(vm.villa_id);
      const vn = (vm as { villas?: { name?: string | null } }).villas?.name;
      if (vn) setVillaName(vn);
    }
  }, []);

  useEffect(() => { if (authReady) fetchVilla(); }, [authReady, fetchVilla]);

  /* ── load bookings + latest messages ── */
  const loadBookings = useCallback(async () => {
    if (!villaId) return;
    setBL(true);
    const { data: bks } = await supabase.from("bookings")
      .select("id,guest_name,guest_email,ota_channel,check_in,check_out,status,villa_id")
      .eq("villa_id", villaId)
      .neq("status", "cancelled")
      .order("check_in", { ascending: false });

    const bs = (bks ?? []) as Booking[];
    setBookings(bs);

    if (bs.length > 0) {
      const bids = bs.map(b => b.id);
      const { data: msgs } = await supabase.from("messages")
        .select("id,booking_id,sender_name,sender_role,content,body,created_at,is_guest,is_read")
        .in("booking_id", bids)
        .order("created_at", { ascending: false });

      const lMap: Record<string, Message | null> = {};
      const uMap: Record<string, number> = {};
      for (const m of (msgs ?? []) as Message[]) {
        if (!lMap[m.booking_id]) lMap[m.booking_id] = m;
        if (m.is_guest && !m.is_read) {
          uMap[m.booking_id] = (uMap[m.booking_id] ?? 0) + 1;
        }
      }
      setLastMsgMap(lMap);
      setUnreadMap(uMap);
    }
    setBL(false);
  }, [villaId]);

  useEffect(() => { if (villaId) loadBookings(); }, [villaId, loadBookings]);

  /* ── open conversation ── */
  const openConversation = async (booking: Booking) => {
    setSelected(booking);
    setML(true);
    const { data } = await supabase.from("messages")
      .select("id,booking_id,sender_name,sender_role,content,body,created_at,is_guest,is_read")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: true })
      .limit(200);
    setMessages((data ?? []) as Message[]);
    setML(false);

    // Mark guest messages read
    await supabase.from("messages").update({ is_read: true }).eq("booking_id", booking.id).eq("is_guest", true).eq("is_read", false);
    setUnreadMap(prev => ({ ...prev, [booking.id]: 0 }));

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  /* ── real-time for open conversation ── */
  useEffect(() => {
    if (!selected) return;
    const ch = supabase.channel(`mgr_msgs_${selected.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `booking_id=eq.${selected.id}` }, payload => {
        const m = payload.new as Message;
        setMessages(prev => [...prev, m]);
        setLastMsgMap(prev => ({ ...prev, [selected.id]: m }));
        if (m.is_guest) supabase.from("messages").update({ is_read: true }).eq("id", m.id);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selected]);

  /* ── real-time: unread badges for all bookings ── */
  useEffect(() => {
    if (!villaId) return;
    const ch = supabase.channel("mgr_msgs_all")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, payload => {
        const m = payload.new as Message;
        if (!m.is_guest) return;
        setLastMsgMap(prev => ({ ...prev, [m.booking_id]: m }));
        if (m.booking_id !== selected?.id) {
          setUnreadMap(prev => ({ ...prev, [m.booking_id]: (prev[m.booking_id] ?? 0) + 1 }));
        }
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [villaId, selected?.id]);

  useEffect(() => {
    if (messages.length > 0) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  }, [messages.length]);

  /* ── send reply ── */
  const sendReply = async () => {
    const text = reply.trim();
    if (!text || !selected || !villaId || !profile) return;
    setSending(true);
    setReply("");
    const { error } = await supabase.from("messages").insert({
      booking_id:     selected.id,
      villa_id:       villaId,
      sender_id:      profile.id,
      sender_name:    profile.full_name ?? "Villa Manager",
      sender_role:    "villa_manager",
      sender_type:    "host",
      body:           text,
      content:        text,
      channel:        selected.ota_channel ?? "direct",
      is_guest:       false,
      is_read:        true,
      admin_notified: false,
    });
    if (error) setReply(text);
    setSending(false);
    setTimeout(() => replyRef.current?.focus(), 100);
  };

  const totalUnread = Object.values(unreadMap).reduce((s, n) => s + n, 0);

  const filtered = bookings.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (b.guest_name?.toLowerCase().includes(q) || b.guest_email?.toLowerCase().includes(q));
  }).sort((a, b) => {
    const ta = lastMsgMap[a.id]?.created_at ?? a.check_in ?? "";
    const tb = lastMsgMap[b.id]?.created_at ?? b.check_in ?? "";
    return tb.localeCompare(ta);
  });

  const selOta = OTA[selected?.ota_channel ?? "direct"] ?? OTA.direct;
  const mgr = profile?.full_name ?? "Manager";

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
        textarea:focus{outline:none;border-color:#C9A84C!important;box-shadow:0 0 0 3px rgba(201,168,76,.12)}
        .mgr-sidebar{width:220px;background:#2C1E0F;display:flex;flex-direction:column;min-height:100vh;position:fixed;top:0;left:0;z-index:100}
        .mgr-content{margin-left:220px;flex:1}
        .conv-row{padding:12px 16px;border-bottom:1px solid #F5F0E8;cursor:pointer;transition:background .12s}
        .conv-row:hover{background:#FFF8E6}
        @media(max-width:900px){.mgr-sidebar{width:180px}.mgr-content{margin-left:180px}}
        @media(max-width:640px){.mgr-sidebar{display:none}.mgr-content{margin-left:0}}
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar name={mgr} unreadCount={totalUnread} />

        <div className="mgr-content" style={{ display: "flex", flexDirection: "column" }}>
          {/* top bar */}
          <div style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 28px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
            <div>
              <span style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C2C2C" }}>Guest Messages</span>
              {totalUnread > 0 && <span style={{ marginLeft: 8, background: "#FF5A5F", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 99 }}>{totalUnread} unread</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={loadBookings} style={{ border: "1px solid #E0D5C5", background: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#7A6A50", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                <Ic d={P.sync} size={13} /> Refresh
              </button>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "transparent", color: "#7A6A50", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                <Ic d={P.logout} size={13} /> Logout
              </button>
            </div>
          </div>

          {/* split panel */}
          <div style={{ display: "flex", flex: 1, height: "calc(100vh - 58px)", overflow: "hidden", padding: "20px", gap: 20 }}>

            {/* LEFT: conversation list */}
            <div style={{ width: 320, flexShrink: 0, background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #EDE6D6" }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#2C2C2C", marginBottom: 8 }}>
                  Inbox — {villaName}
                  <span style={{ fontWeight: 400, color: "#9E8E6A", fontSize: 12, marginLeft: 6 }}>{filtered.length} booking{filtered.length !== 1 ? "s" : ""}</span>
                </div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#B0A090" }}><Ic d={P.search} size={13} /></span>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search guest…"
                    style={{ width: "100%", padding: "7px 10px 7px 30px", border: "1px solid #E0D5C5", borderRadius: 8, fontSize: 12.5, outline: "none", background: "#FAF7F2", color: "#3D2E1A" }} />
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto" }}>
                {bookingsLoading ? (
                  <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {[...Array(4)].map((_, i) => <Skel key={i} h={54} />)}
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: 32, textAlign: "center", color: "#C4B89A", fontSize: 12.5 }}>
                    {search ? "No guests match your search." : "No bookings found for your villa."}
                  </div>
                ) : filtered.map(b => {
                  const unread   = unreadMap[b.id] ?? 0;
                  const lastMsg  = lastMsgMap[b.id];
                  const isSel    = selected?.id === b.id;
                  const ota      = OTA[b.ota_channel ?? "direct"] ?? OTA.direct;
                  return (
                    <div key={b.id} className="conv-row"
                      onClick={() => openConversation(b)}
                      style={{ background: isSel ? "#FFF8E6" : unread > 0 ? "#FDFAF5" : "#fff", borderLeft: isSel ? "3px solid #C9A84C" : unread > 0 ? "3px solid #E8C97A" : "3px solid transparent", paddingLeft: isSel || unread > 0 ? 13 : 16 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: ota.bg, color: ota.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0, border: `2px solid ${ota.color}30` }}>
                          {ini(b.guest_name)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <span style={{ fontSize: 13, fontWeight: unread > 0 ? 700 : 600, color: "#2C2C2C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>
                              {b.guest_name ?? "Unknown Guest"}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                              {lastMsg && <span style={{ fontSize: 10.5, color: "#C4B89A" }}>{fmtAgo(lastMsg.created_at)}</span>}
                              {unread > 0 && <span style={{ background: "#C9A84C", color: "#fff", fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{unread}</span>}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                            <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 20, background: ota.bg, color: ota.color, fontWeight: 700 }}>{ota.emoji} {ota.label}</span>
                            <span style={{ fontSize: 10.5, color: "#A0906E" }}>{fmtD(b.check_in)} → {fmtD(b.check_out)}</span>
                          </div>
                          {lastMsg && (
                            <div style={{ fontSize: 11.5, color: unread > 0 ? "#4A3B27" : "#A0906E", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: unread > 0 ? 600 : 400 }}>
                              {lastMsg.is_guest ? "" : "You: "}{lastMsg.content ?? lastMsg.body ?? "—"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: conversation / chat */}
            <div style={{ flex: 1, background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
              {!selected ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 40, color: "#C4B89A" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", color: "#D4C4A0" }}>
                    <Ic d={P.chat} size={28} />
                  </div>
                  <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 18, fontWeight: 700, color: "#4A3B27" }}>Select a conversation</div>
                  <div style={{ fontSize: 13, color: "#A0906E", textAlign: "center", maxWidth: 300, lineHeight: 1.6 }}>
                    Choose a guest from the inbox to read and reply to their messages. All messages are filtered to {villaName}.
                  </div>
                  {/* OTA sync info */}
                  <div style={{ background: "#FFF8E6", border: "1px solid #F0E4C8", borderRadius: 12, padding: "14px 18px", maxWidth: 360, width: "100%", marginTop: 8 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#7A6A55", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>OTA Sync Status</div>
                    {Object.entries(OTA).filter(([k]) => k !== "direct").map(([key, cfg]) => {
                      const hasBookings = bookings.some(b => (b.ota_channel ?? "direct") === key);
                      return (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: "1px solid #F0E4C8" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.emoji} {cfg.label}</span>
                          <span style={{ flex: 1 }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: hasBookings ? "#2D8A57" : "#A0906E", background: hasBookings ? "#EDFAF3" : "#F5F0E8", padding: "2px 8px", borderRadius: 20 }}>
                            {hasBookings ? "● Connected" : "○ No bookings"}
                          </span>
                        </div>
                      );
                    })}
                    <div style={{ fontSize: 11, color: "#A0906E", marginTop: 10, lineHeight: 1.6 }}>
                      Messages from Airbnb, Booking.com, Vrbo and Expedia appear here automatically once iCal sync is configured.
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* conversation header */}
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid #EDE6D6", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: selOta.bg, color: selOta.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, border: `2px solid ${selOta.color}30`, flexShrink: 0 }}>
                      {ini(selected.guest_name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#2C2C2C" }}>{selected.guest_name ?? "Unknown Guest"}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: selOta.bg, color: selOta.color, fontWeight: 700 }}>{selOta.emoji} {selOta.label}</span>
                        <span style={{ fontSize: 12, color: "#A0906E" }}>{fmtD(selected.check_in)} → {fmtD(selected.check_out)}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#7A6A55", background: "#F5F0E8", padding: "2px 8px", borderRadius: 20 }}>{selected.status}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#2D8A57", background: "#EDFAF3", padding: "5px 10px", borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2D8A57", display: "inline-block" }} /> Live
                    </div>
                  </div>

                  {/* booking info bar */}
                  <div style={{ background: "#FFF8ED", borderBottom: "1px solid #F0E4C8", padding: "8px 20px", display: "flex", gap: 24, flexWrap: "wrap", flexShrink: 0 }}>
                    {[
                      { label: "Status",    val: selected.status ?? "—" },
                      { label: "Check-in",  val: fmtD(selected.check_in) },
                      { label: "Check-out", val: fmtD(selected.check_out) },
                      { label: "Email",     val: selected.guest_email ?? "—" },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <div style={{ fontSize: 10, color: "#A0906E", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>{label}</div>
                        <div style={{ fontSize: 12, color: "#3D2E1A", fontWeight: 600 }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* messages */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column" }}>
                    {msgsLoading ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[...Array(4)].map((_, i) => <Skel key={i} h={50} />)}</div>
                    ) : messages.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "48px 20px", color: "#A0906E" }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>💬</div>
                        <div style={{ fontSize: 14, fontFamily: "Playfair Display,Georgia,serif", fontWeight: 700, color: "#4A3B27", marginBottom: 6 }}>No messages yet</div>
                        <div style={{ fontSize: 13 }}>Send a message — it will appear in the guest&apos;s portal instantly.</div>
                      </div>
                    ) : (
                      <>
                        {messages.map((m, i) => {
                          const isHost = !m.is_guest;
                          const text   = m.content ?? m.body ?? "";
                          const prevM  = messages[i - 1];
                          const showDateSep = !prevM || new Date(m.created_at).toDateString() !== new Date(prevM.created_at).toDateString();
                          return (
                            <div key={m.id}>
                              {showDateSep && (
                                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 10px" }}>
                                  <div style={{ flex: 1, height: 1, background: "#EDE6D6" }} />
                                  <span style={{ fontSize: 11, color: "#A0906E", fontWeight: 600 }}>
                                    {new Date(m.created_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                                  </span>
                                  <div style={{ flex: 1, height: 1, background: "#EDE6D6" }} />
                                </div>
                              )}
                              <div style={{ display: "flex", flexDirection: isHost ? "row-reverse" : "row", gap: 8, alignItems: "flex-end", marginBottom: 8 }}>
                                {!isHost && (
                                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: selOta.bg, color: selOta.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                    {ini(m.sender_name)}
                                  </div>
                                )}
                                <div style={{ display: "flex", flexDirection: "column", alignItems: isHost ? "flex-end" : "flex-start", maxWidth: "72%", gap: 3 }}>
                                  {!isHost && <div style={{ fontSize: 10.5, color: "#A0906E", fontWeight: 600 }}>{m.sender_name ?? "Guest"}</div>}
                                  {isHost && <div style={{ fontSize: 10.5, color: "#A0906E", fontWeight: 600 }}>{m.sender_name ?? mgr} · {m.sender_role === "super_admin" ? "Admin" : "Manager"}</div>}
                                  <div style={{ padding: "10px 14px", borderRadius: isHost ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: isHost ? "#C9A84C" : "#F5F0E8", color: isHost ? "#fff" : "#2C2C2C", fontSize: 13.5, lineHeight: 1.55, wordBreak: "break-word" }}>
                                    {text}
                                  </div>
                                  <div style={{ fontSize: 10.5, color: "#B0A090" }}>{fmtDT(m.created_at)}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={bottomRef} />
                      </>
                    )}
                  </div>

                  {/* compose */}
                  <div style={{ borderTop: "1px solid #EDE6D6", padding: "12px 20px", flexShrink: 0, background: "#fff" }}>
                    {/* quick reply templates */}
                    <div style={{ position: "relative", marginBottom: 8 }}>
                      <button onClick={() => setShowTemplates(t => !t)}
                        style={{ fontSize: 11.5, color: "#7A6A55", background: "#F5F0E8", border: "1px solid #E0D5C5", borderRadius: 7, padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontWeight: 500 }}>
                        ⚡ Quick Reply <span style={{ fontSize: 9, marginTop: 1 }}>▼</span>
                      </button>
                      {showTemplates && (
                        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, background: "#fff", border: "1px solid #E0D5C5", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,.12)", zIndex: 50, minWidth: 280, overflow: "hidden" }}>
                          {QUICK_REPLIES.map(t => (
                            <button key={t.label} onClick={() => { setReply(t.text); setShowTemplates(false); setTimeout(() => replyRef.current?.focus(), 50); }}
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
                      <textarea
                        ref={replyRef}
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                        placeholder={`Reply to ${selected.guest_name ?? "guest"} via ${selOta.label}… (Enter to send)`}
                        rows={2}
                        style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #EDE6D6", background: "#FDFAF5", fontSize: 13.5, color: "#2C2C2C", resize: "none", fontFamily: "Inter,sans-serif", lineHeight: 1.5 }}
                      />
                      <button onClick={sendReply} disabled={sending || !reply.trim()}
                        style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: sending || !reply.trim() ? "#DDD5C0" : "#C9A84C", color: "#fff", fontSize: 13, fontWeight: 700, cursor: sending || !reply.trim() ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: sending || !reply.trim() ? "none" : "0 4px 12px rgba(201,168,76,.35)", flexShrink: 0, whiteSpace: "nowrap", transition: "all .15s" }}>
                        <Ic d={P.send} size={14} /> {sending ? "Sending…" : `Send via ${selOta.label}`}
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: "#B0A090", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <Ic d={P.check} size={11} /> Reply visible to guest instantly · Admin will be notified
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

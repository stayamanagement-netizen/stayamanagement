"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Booking { id: string; villa_id: string | null; ota_channel: string | null; }
interface Message { id: string; booking_id: string; sender_name: string | null; sender_role: string | null; content: string | null; created_at: string; is_guest: boolean | null; }

const NAV = [
  { icon: "🏠", label: "Home",      href: "/dashboard/guest" },
  { icon: "🛎️", label: "Services",  href: "/dashboard/guest/services" },
  { icon: "💬", label: "Messages",  href: "/dashboard/guest/messages" },
  { icon: "📋", label: "My Booking",href: "/dashboard/guest/booking" },
  { icon: "🚨", label: "Emergency", href: "/dashboard/guest/emergency", red: true },
];

function BottomNav() {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #EDE6D6", display: "flex", zIndex: 100, boxShadow: "0 -2px 16px rgba(44,44,44,.08)" }}>
      {NAV.map(n => {
        const active = n.href === "/dashboard/guest" ? path === n.href : path.startsWith(n.href);
        return (
          <button key={n.label} onClick={() => window.location.href = n.href}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 4px 10px", gap: 3, border: "none", background: "transparent", cursor: "pointer", minHeight: 62 }}>
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 500, color: n.red ? "#C62828" : active ? "#C9A84C" : "#9E8E6A", fontFamily: "Inter,sans-serif" }}>{n.label}</span>
            {active && <div style={{ width: 20, height: 2.5, borderRadius: 2, background: n.red ? "#C62828" : "#C9A84C", marginTop: 1 }} />}
          </button>
        );
      })}
    </nav>
  );
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
function fmtDay(d: string) {
  const dt = new Date(d);
  const today = new Date();
  if (dt.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (dt.toDateString() === yesterday.toDateString()) return "Yesterday";
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function groupByDay(msgs: Message[]) {
  const groups: { day: string; msgs: Message[] }[] = [];
  for (const m of msgs) {
    const d = fmtDay(m.created_at);
    const last = groups[groups.length - 1];
    if (last && last.day === d) last.msgs.push(m);
    else groups.push({ day: d, msgs: [m] });
  }
  return groups;
}

export default function GuestMessagesPage() {
  const [booking, setBooking]   = useState<Booking | null>(null);
  const [profile, setProfile]   = useState<{ full_name: string | null } | null>(null);
  const [userId, setUserId]     = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading]   = useState(true);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      try {
        const { data: profData } = await supabase.from("profiles").select("id,full_name,role").eq("id", user.id).single();
        const prof = profData ?? null;
        if (!prof) { window.location.href = "/"; return; }
        if (prof.role === "super_admin")   { window.location.href = "/dashboard/admin/";   return; }
        if (prof.role === "villa_owner")   { window.location.href = "/dashboard/owner/";   return; }
        if (prof.role === "villa_manager") { window.location.href = "/dashboard/manager/"; return; }
        setProfile(prof); setUserId(user.id);
        const { data: bk } = await supabase.from("bookings")
          .select("id,villa_id,ota_channel").eq("guest_id", user.id)
          .in("status", ["confirmed","checked_in","pending"])
          .order("check_in", { ascending: false }).limit(1).maybeSingle();
        if (bk) setBooking(bk as Booking);
        setAuthReady(true);
      } catch { window.location.href = "/"; }
    });
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!booking) return;
    setLoading(true);
    try {
      const { data } = await supabase.from("messages")
        .select("id,booking_id,sender_name,sender_role,content,created_at,is_guest")
        .eq("booking_id", booking.id)
        .order("created_at", { ascending: true }).limit(100);
      setMessages((data ?? []) as Message[]);
    } catch {} finally { setLoading(false); }
  }, [booking]);

  useEffect(() => { if (authReady && booking) fetchMessages(); }, [authReady, booking, fetchMessages]);

  /* real-time */
  useEffect(() => {
    if (!booking) return;
    const ch = supabase.channel("guest_msgs_" + booking.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `booking_id=eq.${booking.id}` }, payload => {
        setMessages(prev => [...prev, payload.new as Message]);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [booking]);

  /* auto-scroll */
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || !booking || !userId) return;
    setSending(true);
    setInput("");
    try {
      await supabase.from("messages").insert([{
        booking_id: booking.id, villa_id: booking.villa_id,
        sender_id: userId, sender_name: profile?.full_name ?? "Guest",
        sender_role: "guest", sender_type: "guest",
        body: text, content: text, is_guest: true, is_read: false,
      }]);
    } catch { setInput(text); }
    finally { setSending(false); }
  }

  const groups = groupByDay(messages);

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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Inter,sans-serif;background:#F5F0E8;color:#2C2C2C}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#DDD5C0;border-radius:10px}
        textarea{font-family:Inter,sans-serif}
      `}</style>
      <div style={{ minHeight: "100vh", background: "#F5F0E8", display: "flex", flexDirection: "column" }}>

        <header style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 20px", height: 58, display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 8px rgba(44,44,44,.05)", position: "sticky", top: 0, zIndex: 50, flexShrink: 0 }}>
          <button onClick={() => window.location.href = "/dashboard/guest/"} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center" }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C2C2C" }}>Messages</div>
            <div style={{ fontSize: 10.5, color: "#9E8E6A" }}>
              Villa Team{booking?.ota_channel ? <span style={{ marginLeft: 6, padding: "1px 7px", borderRadius: 20, background: "#F5F0E8", fontSize: 10, fontWeight: 600, color: "#7A6A50" }}>{booking.ota_channel}</span> : ""}
            </div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#2C1E0F,#4A3320)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏡</div>
        </header>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", maxWidth: 540, width: "100%", margin: "0 auto", paddingBottom: 140 }}>
          {!booking ? (
            <div style={{ textAlign: "center", padding: "60px 16px", color: "#C4B89A", fontSize: 13 }}>No active booking found to load messages.</div>
          ) : loading ? (
            <div style={{ textAlign: "center", padding: "60px 16px", color: "#C4B89A" }}>Loading messages…</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 16px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#4A3B27", fontFamily: "Playfair Display,Georgia,serif", marginBottom: 6 }}>Start a conversation</div>
              <div style={{ fontSize: 13, color: "#9E8E6A", lineHeight: 1.6 }}>Send us a message and our villa team will reply shortly.</div>
            </div>
          ) : (
            groups.map(g => (
              <div key={g.day}>
                <div style={{ textAlign: "center", margin: "16px 0 10px" }}>
                  <span style={{ fontSize: 11, color: "#9E8E6A", background: "#EDE6D6", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>{g.day}</span>
                </div>
                {g.msgs.map(m => {
                  const isMe = !!m.is_guest;
                  return (
                    <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 10 }}>
                      {!isMe && (
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#2C1E0F,#4A3320)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginRight: 8, marginTop: 2, flexShrink: 0 }}>🏡</div>
                      )}
                      <div style={{ maxWidth: "72%" }}>
                        {!isMe && <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9E8E6A", marginBottom: 3 }}>{m.sender_name ?? "Villa Team"}{m.sender_role && m.sender_role !== "guest" ? <span style={{ marginLeft: 4, color: "#C9A84C" }}>· {m.sender_role.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</span> : ""}</div>}
                        <div style={{ padding: "10px 14px", borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: isMe ? "linear-gradient(135deg,#C9A84C,#B8913A)" : "#fff", color: isMe ? "#fff" : "#2C2C2C", fontSize: 13.5, lineHeight: 1.55, boxShadow: "0 1px 4px rgba(44,44,44,.08)", border: isMe ? "none" : "1px solid #EDE6D6" }}>
                          {m.content}
                        </div>
                        <div style={{ fontSize: 10.5, color: "#C4B89A", marginTop: 3, textAlign: isMe ? "right" : "left" }}>{fmtTime(m.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ position: "fixed", bottom: 62, left: 0, right: 0, background: "#fff", borderTop: "1px solid #EDE6D6", padding: "10px 16px", boxShadow: "0 -2px 10px rgba(44,44,44,.06)", zIndex: 90 }}>
          <div style={{ maxWidth: 540, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              style={{ flex: 1, padding: "10px 14px", borderRadius: 14, border: "1.5px solid #DDD5C0", fontSize: 14, color: "#2C2C2C", background: "#FDFBF7", resize: "none", outline: "none", lineHeight: 1.4, maxHeight: 100, overflowY: "auto" }}
            />
            <button onClick={sendMessage} disabled={sending || !input.trim()}
              style={{ width: 42, height: 42, borderRadius: 12, border: "none", background: sending || !input.trim() ? "#EDE6D6" : "linear-gradient(135deg,#C9A84C,#B8913A)", cursor: sending || !input.trim() ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .15s" }}>
              {sending
                ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin .6s linear infinite" }} />
                : <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
              }
            </button>
          </div>
        </div>

        <BottomNav />
      </div>
    </>
  );
}

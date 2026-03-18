"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Booking { id: string; villa_id: string | null; }

const SVC_ICONS: Record<string, string> = {
  "Breakfast": "🍳", "Scooter": "🛵", "Surf": "🏄", "Yoga": "🧘",
  "Boat": "⛵", "Grocery": "🛒", "Snorkeling": "🤿", "Diving": "🐠",
};
function svcIcon(name: string) {
  for (const k of Object.keys(SVC_ICONS)) { if (name.startsWith(k)) return SVC_ICONS[k]; }
  return "🛎️";
}

interface DbService {
  id: string; villa_id: string; name: string; description: string | null;
  price: number; currency: string; price_type: string;
  min_persons: number; max_persons: number; is_active: boolean;
}
interface Order {
  id: string; service_id: string | null; scheduled_date: string | null;
  scheduled_time: string | null; persons: number | null;
  total_amount: number | null; order_status: string | null; created_at: string;
  services: { name: string } | { name: string }[] | null;
}

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

function today() { return new Date().toISOString().slice(0, 10); }
function fmtDate(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }

export default function GuestServicesPage() {
  const [booking, setBooking]       = useState<Booking | null>(null);
  const [userId, setUserId]         = useState<string | null>(null);
  const [guestName, setGuestName]   = useState<string>("");
  const [authReady, setAuthReady]   = useState(false);
  const [services, setServices]     = useState<DbService[]>([]);
  const [orders, setOrders]         = useState<Order[]>([]);
  const [ordersLoading, setOL]      = useState(true);

  /* modal */
  const [selected, setSelected]     = useState<DbService | null>(null);
  const [date, setDate]             = useState(today());
  const [time, setTime]             = useState("09:00");
  const [persons, setPersons]       = useState(2);
  const [notes, setNotes]           = useState("");
  const [submitting, setSub]        = useState(false);
  const [success, setSuccess]       = useState(false);
  const [err, setErr]               = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      try {
        const { data: prof } = await supabase.from("profiles").select("id,full_name,role").eq("id", user.id).single();
        if (!prof) { window.location.href = "/"; return; }
        if (prof.role === "super_admin")   { window.location.href = "/dashboard/admin/";   return; }
        if (prof.role === "villa_owner")   { window.location.href = "/dashboard/owner/";   return; }
        if (prof.role === "villa_manager") { window.location.href = "/dashboard/manager/"; return; }
        setUserId(user.id);
        setGuestName(prof.full_name ?? "Guest");

        /* booking — use guest_id (not guest_user_id) */
        const { data: bk } = await supabase.from("bookings")
          .select("id,villa_id").eq("guest_id", user.id)
          .in("status", ["confirmed", "checked_in", "pending"])
          .order("check_in", { ascending: false }).limit(1).maybeSingle();
        if (bk) {
          setBooking(bk as Booking);
          /* fetch services for this villa */
          const { data: svcs } = await supabase.from("services")
            .select("id,villa_id,name,description,price,currency,price_type,min_persons,max_persons,is_active")
            .eq("villa_id", bk.villa_id).eq("is_active", true).order("name");
          setServices((svcs ?? []) as DbService[]);
        }
        setAuthReady(true);
      } catch { window.location.href = "/"; }
    });
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!booking) return;
    setOL(true);
    try {
      const { data } = await supabase.from("service_orders")
        .select("id,service_id,scheduled_date,scheduled_time,persons,total_amount,order_status,created_at,services(name)")
        .eq("booking_id", booking.id).order("created_at", { ascending: false }).limit(20);
      setOrders((data ?? []) as Order[]);
    } catch {} finally { setOL(false); }
  }, [booking]);

  useEffect(() => { if (authReady && booking) fetchOrders(); }, [authReady, booking, fetchOrders]);

  function openModal(svc: DbService) {
    setSelected(svc);
    setDate(today()); setTime("09:00");
    setPersons(Math.max(svc.min_persons ?? 1, 1));
    setNotes(""); setErr(null); setSuccess(false);
  }
  function closeModal() { if (!submitting) setSelected(null); }

  async function confirmOrder() {
    if (!selected || !booking || !userId) return;
    setErr(null); setSub(true);
    try {
      const { error } = await supabase.from("service_orders").insert([{
        booking_id:       booking.id,
        villa_id:         booking.villa_id,
        guest_id:         userId,
        guest_name:       guestName,
        service_id:       selected.id,
        scheduled_date:   date,
        scheduled_time:   time,
        persons:          persons,
        quantity:         1,
        special_requests: notes.trim() || null,
        total_amount:     selected.price * persons,
        currency:         selected.currency ?? "USD",
        order_status:     "pending",
        payment_status:   "unpaid",
      }]);
      if (error) throw error;
      setSuccess(true);
      fetchOrders();
    } catch (e) {
      setErr("Failed to submit order. Please try again.");
      console.error(e);
    }
    finally { setSub(false); }
  }

  const totalPrice = selected ? selected.price * persons : 0;
  const STATUS_COLOR: Record<string, string> = { pending: "#C9A84C", confirmed: "#1E7A48", cancelled: "#C62828", completed: "#1E7A48" };
  const perLabel = (pt: string) => pt === "per_day" ? "per day" : "per person";

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
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#DDD5C0;border-radius:10px}
        .svc-card{cursor:pointer;transition:box-shadow .2s,transform .15s}
        .svc-card:hover{box-shadow:0 6px 20px rgba(44,44,44,.12)!important;transform:translateY(-2px)}
        input,select,textarea{font-family:Inter,sans-serif}
      `}</style>
      <div style={{ minHeight: "100vh", background: "#F5F0E8", paddingBottom: 80 }}>

        <header style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 20px", height: 58, display: "flex", alignItems: "center", boxShadow: "0 2px 8px rgba(44,44,44,.05)", position: "sticky", top: 0, zIndex: 50, gap: 14 }}>
          <button onClick={() => window.location.href = "/dashboard/guest/"} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 20, padding: 4, display: "flex", alignItems: "center" }}>←</button>
          <div>
            <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C2C2C" }}>Enhance Your Stay</div>
            <div style={{ fontSize: 10.5, color: "#9E8E6A" }}>Order services delivered to your villa</div>
          </div>
        </header>

        <main style={{ maxWidth: 540, margin: "0 auto", padding: "24px 16px", animation: "fadeUp .35s ease both" }}>

          {/* No booking warning */}
          {!booking && (
            <div style={{ background: "#FFF8E7", border: "1px solid #F0D080", borderRadius: 12, padding: "14px 18px", marginBottom: 20, fontSize: 13.5, color: "#7A5C10" }}>
              No active booking found. Services can be booked once you have a confirmed reservation.
            </div>
          )}

          {/* Service cards */}
          {services.length === 0 && booking && (
            <div style={{ textAlign: "center", color: "#C4B89A", fontSize: 13, padding: "32px 0" }}>No services available for your villa.</div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
            {services.map(svc => (
              <div key={svc.id} className="svc-card" onClick={() => booking && openModal(svc)}
                style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #EDE6D6", padding: "18px 16px", boxShadow: "0 2px 8px rgba(44,44,44,.05)", display: "flex", flexDirection: "column", gap: 8, opacity: booking ? 1 : 0.6 }}>
                <div style={{ fontSize: 28, marginBottom: 2 }}>{svcIcon(svc.name)}</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#2C2C2C", lineHeight: 1.3 }}>{svc.name}</div>
                <div style={{ fontSize: 11.5, color: "#9E8E6A", lineHeight: 1.5, flex: 1 }}>{svc.description}</div>
                <div style={{ fontSize: 12, color: "#C9A84C", fontWeight: 700, marginBottom: 6 }}>${svc.price} {perLabel(svc.price_type)}</div>
                <button disabled={!booking} style={{ width: "100%", padding: "9px", borderRadius: 10, border: "none", background: booking ? "linear-gradient(135deg,#C9A84C,#B8913A)" : "#DDD5C0", color: "#fff", fontSize: 13, fontWeight: 700, cursor: booking ? "pointer" : "default", fontFamily: "Inter,sans-serif" }}>Book Now</button>
              </div>
            ))}
          </div>

          {/* My orders */}
          <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #EDE6D6" }}>
              <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 16, fontWeight: 700, color: "#2C2C2C" }}>My Service Orders</div>
            </div>
            {ordersLoading ? (
              <div style={{ padding: 24, textAlign: "center", color: "#C4B89A" }}>Loading…</div>
            ) : orders.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#C4B89A", fontSize: 13 }}>No orders yet — book a service above!</div>
            ) : (
              <div>
                {orders.map((o, i) => (
                  <div key={o.id} style={{ padding: "14px 20px", borderBottom: i < orders.length - 1 ? "1px solid #F0EBE0" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#2C2C2C" }}>{(Array.isArray(o.services) ? o.services[0]?.name : o.services?.name) ?? "Service"}</div>
                      <div style={{ fontSize: 12, color: "#9E8E6A", marginTop: 2 }}>{fmtDate(o.scheduled_date)}{o.scheduled_time ? ` · ${o.scheduled_time}` : ""}{o.persons ? ` · ${o.persons} person${o.persons !== 1 ? "s" : ""}` : ""}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#C9A84C" }}>${o.total_amount?.toFixed(0) ?? "—"}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[o.order_status ?? ""] ?? "#9E8E6A", marginTop: 2, textTransform: "capitalize" }}>{o.order_status ?? "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        <BottomNav />
      </div>

      {/* Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(44,30,10,.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(4px)" }}
          onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 540, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 -10px 48px rgba(44,30,10,.25)", animation: "fadeUp .25s ease both" }}>
            <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid #EDE6D6", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 26, marginBottom: 4 }}>{svcIcon(selected.name)}</div>
                <h2 style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 19, fontWeight: 700, color: "#2C2C2C" }}>{selected.name}</h2>
                <p style={{ fontSize: 12.5, color: "#9E8E6A", marginTop: 3 }}>{selected.description}</p>
              </div>
              {!success && <button onClick={closeModal} style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #EDE6D6", background: "#F5F0E8", cursor: "pointer", fontSize: 18, color: "#7A6A50", flexShrink: 0 }}>×</button>}
            </div>

            {success ? (
              <div style={{ padding: "36px 24px 40px", textAlign: "center" }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
                <h3 style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 20, fontWeight: 700, color: "#2C2C2C", marginBottom: 8 }}>Order Confirmed!</h3>
                <p style={{ fontSize: 13.5, color: "#4A3B27", lineHeight: 1.6, marginBottom: 24 }}>Your {selected.name} request has been sent to the villa team. We&apos;ll confirm shortly.</p>
                <button onClick={() => setSelected(null)} style={{ padding: "11px 28px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#C9A84C,#B8913A)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>Done</button>
              </div>
            ) : (
              <div style={{ padding: "20px 22px 28px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Date</label>
                    <input type="date" value={date} min={today()} onChange={e => setDate(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #DDD5C0", fontSize: 14, color: "#2C2C2C", background: "#FDFBF7", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Time</label>
                    <input type="time" value={time} onChange={e => setTime(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #DDD5C0", fontSize: 14, color: "#2C2C2C", background: "#FDFBF7", outline: "none" }} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                    {selected.price_type === "per_day" ? "Number of Days" : "Number of Persons"}
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button onClick={() => setPersons(Math.max(selected.min_persons ?? 1, persons - 1))}
                      style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #EDE6D6", background: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#4A3B27" }}>−</button>
                    <span style={{ fontSize: 22, fontWeight: 700, color: "#2C2C2C", minWidth: 28, textAlign: "center" }}>{persons}</span>
                    <button onClick={() => setPersons(Math.min(selected.max_persons ?? 20, persons + 1))}
                      style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #EDE6D6", background: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#4A3B27" }}>+</button>
                    <span style={{ fontSize: 13, color: "#9E8E6A", marginLeft: 4 }}>${selected.price} × {persons}</span>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Special Requests</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special requirements, dietary needs, preferences…" rows={3}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #DDD5C0", fontSize: 13.5, color: "#2C2C2C", background: "#FDFBF7", resize: "vertical", outline: "none", lineHeight: 1.5 }} />
                </div>

                <div style={{ background: "linear-gradient(135deg,#2C1E0F,#3D2B17)", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: "rgba(201,168,76,.8)", fontWeight: 600 }}>Total Price</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: "#C9A84C", fontFamily: "Playfair Display,Georgia,serif" }}>${totalPrice}</span>
                </div>

                {err && <div style={{ marginBottom: 12, padding: "9px 14px", background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 8, fontSize: 13, color: "#C62828" }}>{err}</div>}

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={closeModal} style={{ flex: 1, padding: "13px", borderRadius: 12, border: "1.5px solid #EDE6D6", background: "transparent", color: "#7A6A50", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>Cancel</button>
                  <button onClick={confirmOrder} disabled={submitting}
                    style={{ flex: 2, padding: "13px", borderRadius: 12, border: "none", background: submitting ? "#DDD5C0" : "linear-gradient(135deg,#C9A84C,#B8913A)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: submitting ? "default" : "pointer", fontFamily: "Inter,sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {submitting ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin .6s linear infinite" }} /> Confirming…</> : "✓ Confirm & Request"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

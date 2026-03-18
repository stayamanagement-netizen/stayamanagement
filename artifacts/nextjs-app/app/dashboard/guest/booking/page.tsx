"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Booking {
  id: string; villa_id: string | null; villa_name: string | null; guest_name: string | null;
  check_in: string | null; check_out: string | null; status: string | null;
  total_amount: number | null; num_guests: number | null;
  booking_reference: string | null; ota_channel: string | null; created_at: string | null;
}
interface Payment { id: string; amount: number | null; status: string | null; payment_method: string | null; created_at: string | null; }
interface Villa { currency: string | null; manager_phone: string | null; manager_name: string | null; }

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

function fmtDate(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
function fmtDateShort(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
function fmtMoney(n: number | null, cur = "USD") { if (n == null) return "—"; if (cur === "IDR") return `Rp ${n.toLocaleString("id-ID")}`; return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n); }
function nights(a: string | null, b: string | null) { if (!a || !b) return 0; return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)); }

export default function GuestBookingPage() {
  const [booking, setBooking]   = useState<Booking | null>(null);
  const [villa, setVilla]       = useState<Villa | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading]   = useState(true);

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

        const { data: bk } = await supabase.from("bookings")
          .select("id,villa_id,villa_name,guest_name,check_in,check_out,status,total_amount,num_guests,booking_reference,ota_channel,created_at")
          .eq("guest_user_id", user.id)
          .in("status", ["confirmed","checked_in","pending","completed"])
          .order("check_in", { ascending: false }).limit(1).maybeSingle();
        if (bk) {
          setBooking(bk as Booking);
          const [{ data: v }, { data: pays }] = await Promise.all([
            bk.villa_id ? supabase.from("villas").select("currency,manager_phone,manager_name").eq("id", bk.villa_id).single() : Promise.resolve({ data: null }),
            supabase.from("payments").select("id,amount,status,payment_method,created_at").eq("booking_id", bk.id).order("created_at", { ascending: false }),
          ]);
          if (v) setVilla(v as Villa);
          setPayments((pays ?? []) as Payment[]);
        }
        setAuthReady(true);
      } catch { window.location.href = "/"; }
      finally { setLoading(false); }
    });
  }, []);

  const cur = villa?.currency ?? "USD";
  const nightCount = nights(booking?.check_in ?? null, booking?.check_out ?? null);
  const paidTotal = payments.filter(p => p.status === "confirmed").reduce((s, p) => s + (p.amount ?? 0), 0);
  const outstanding = (booking?.total_amount ?? 0) - paidTotal;
  const hasPending = outstanding > 0 && (booking?.status === "confirmed" || booking?.status === "pending");

  function getTimeline() {
    const steps: { icon: string; label: string; sub?: string; done: boolean; active?: boolean }[] = [];
    const now = new Date();
    const ci = booking?.check_in ? new Date(booking.check_in) : null;
    const co = booking?.check_out ? new Date(booking.check_out) : null;
    const booked = !!booking;
    const paid   = paidTotal >= (booking?.total_amount ?? 0) && booking?.total_amount;
    const checkedIn = booking?.status === "checked_in" || (ci && now >= ci);
    const checkedOut = booking?.status === "completed" || (co && now > co);
    steps.push({ icon: "📋", label: "Booking Confirmed",   sub: booking?.created_at ? fmtDateShort(booking.created_at) : undefined, done: booked });
    steps.push({ icon: "💳", label: "Payment Received",    sub: paid ? fmtMoney(paidTotal, cur) : "Awaiting payment", done: !!paid, active: hasPending });
    steps.push({ icon: "🏡", label: "Check-In",            sub: fmtDate(booking?.check_in ?? null), done: !!checkedIn, active: !checkedIn && !!booked && !!paid });
    steps.push({ icon: "👋", label: "Check-Out",           sub: fmtDate(booking?.check_out ?? null), done: !!checkedOut });
    return steps;
  }

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
      `}</style>
      <div style={{ minHeight: "100vh", background: "#F5F0E8", paddingBottom: 90 }}>

        <header style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 20px", height: 58, display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 8px rgba(44,44,44,.05)", position: "sticky", top: 0, zIndex: 50 }}>
          <button onClick={() => window.location.href = "/dashboard/guest/"} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center" }}>←</button>
          <div>
            <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C2C2C" }}>My Booking</div>
            <div style={{ fontSize: 10.5, color: "#9E8E6A" }}>Full reservation details</div>
          </div>
        </header>

        <main style={{ maxWidth: 540, margin: "0 auto", padding: "24px 16px", animation: "fadeUp .35s ease both" }}>
          {!booking && !loading ? (
            <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #EDE6D6", padding: 48, textAlign: "center", color: "#C4B89A" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
              <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "Playfair Display,Georgia,serif" }}>No booking found</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Contact your host if you believe this is an error.</div>
            </div>
          ) : booking && (
            <>
              {/* Main booking card */}
              <div style={{ background: "linear-gradient(135deg,#2C1E0F,#3D2B17)", borderRadius: 20, padding: "22px 22px", marginBottom: 18, boxShadow: "0 8px 32px rgba(44,28,10,.25)" }}>
                <div style={{ fontSize: 11, color: "rgba(201,168,76,.7)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>Your Reservation at</div>
                <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 21, fontWeight: 700, color: "#fff", marginBottom: 12 }}>{booking.villa_name ?? "Villa"}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontSize: 9.5, color: "rgba(201,168,76,.65)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>Check-In</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>{fmtDate(booking.check_in)}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontSize: 9.5, color: "rgba(201,168,76,.65)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>Check-Out</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>{fmtDate(booking.check_out)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                  {[
                    { l: "Nights", v: String(nightCount) },
                    { l: "Guests", v: String(booking.num_guests ?? "—") },
                  ].map(i => (
                    <div key={i.l} style={{ flex: 1, background: "rgba(255,255,255,.08)", borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ fontSize: 9.5, color: "rgba(201,168,76,.65)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 2 }}>{i.l}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#C9A84C", fontFamily: "Playfair Display,Georgia,serif" }}>{i.v}</div>
                    </div>
                  ))}
                  {booking.ota_channel && (
                    <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,.08)", borderRadius: 10 }}>
                      <div>
                        <div style={{ fontSize: 9.5, color: "rgba(201,168,76,.65)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 2 }}>Platform</div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>{booking.ota_channel}</div>
                      </div>
                    </div>
                  )}
                </div>
                {booking.booking_reference && (
                  <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(255,255,255,.06)", borderRadius: 10, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "rgba(201,168,76,.65)", textTransform: "uppercase", letterSpacing: ".07em" }}>Reference</span>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "#C9A84C", fontFamily: "monospace" }}>{booking.booking_reference}</span>
                  </div>
                )}
              </div>

              {/* Payment section */}
              <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #EDE6D6", overflow: "hidden", marginBottom: 18, boxShadow: "0 2px 10px rgba(44,44,44,.06)" }}>
                <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #EDE6D6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 16, fontWeight: 700 }}>Payment Status</div>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: outstanding > 0 ? "#FFF8E6" : "#EDFAF3", color: outstanding > 0 ? "#7A5210" : "#1E7A48", border: `1px solid ${outstanding > 0 ? "#F5D875" : "#B0E8CB"}` }}>
                    {outstanding > 0 ? "⚠️ Balance Due" : "✅ Paid in Full"}
                  </span>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F5F0E8" }}>
                    <span style={{ fontSize: 13.5, color: "#4A3B27" }}>Total Booking Amount</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#2C2C2C" }}>{fmtMoney(booking.total_amount, cur)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F5F0E8" }}>
                    <span style={{ fontSize: 13.5, color: "#4A3B27" }}>Amount Paid</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1E7A48" }}>{fmtMoney(paidTotal, cur)}</span>
                  </div>
                  {outstanding > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#2C2C2C" }}>Outstanding Balance</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#C62828", fontFamily: "Playfair Display,Georgia,serif" }}>{fmtMoney(outstanding, cur)}</span>
                    </div>
                  )}
                </div>

                {hasPending && (
                  <div style={{ padding: "0 20px 20px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Pay Now</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <button style={{ padding: "14px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#635BFF,#4B44CC)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "Inter,sans-serif" }}>
                        💳 Pay with Card (Stripe)
                      </button>
                      <button onClick={() => window.location.href = "/dashboard/guest/messages/"}
                        style={{ padding: "14px 20px", borderRadius: 12, border: "1.5px solid #EDE6D6", background: "#FDFBF7", color: "#4A3B27", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "Inter,sans-serif" }}>
                        🏦 Bank Transfer — Contact Manager
                      </button>
                    </div>
                  </div>
                )}

                {payments.length > 0 && (
                  <div style={{ borderTop: "1px solid #EDE6D6", padding: "14px 20px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Payment History</div>
                    {payments.map(p => (
                      <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F5F0E8" }}>
                        <div>
                          <div style={{ fontSize: 13, color: "#2C2C2C", fontWeight: 500 }}>{p.payment_method?.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase()) ?? "Payment"}</div>
                          <div style={{ fontSize: 11, color: "#9E8E6A", marginTop: 1 }}>{fmtDateShort(p.created_at)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: p.status === "confirmed" ? "#1E7A48" : "#C9A84C" }}>{fmtMoney(p.amount, cur)}</div>
                          <div style={{ fontSize: 11, color: p.status === "confirmed" ? "#1E7A48" : "#C9A84C", fontWeight: 600, textTransform: "capitalize" }}>{p.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Booking timeline */}
              <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #EDE6D6", padding: "18px 20px", marginBottom: 18, boxShadow: "0 2px 10px rgba(44,44,44,.06)" }}>
                <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Booking Timeline</div>
                {getTimeline().map((step, i, arr) => (
                  <div key={step.label} style={{ display: "flex", gap: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: step.done ? "#EDFAF3" : step.active ? "#FFF8E6" : "#F5F0E8", border: `2px solid ${step.done ? "#2D8A57" : step.active ? "#C9A84C" : "#EDE6D6"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{step.icon}</div>
                      {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: step.done ? "#B0E8CB" : "#EDE6D6", minHeight: 20, margin: "4px 0" }} />}
                    </div>
                    <div style={{ paddingBottom: i < arr.length - 1 ? 18 : 0 }}>
                      <div style={{ fontSize: 14, fontWeight: step.done || step.active ? 700 : 500, color: step.done ? "#1E7A48" : step.active ? "#7A5210" : "#9E8E6A", marginTop: 8 }}>{step.label} {step.done ? "✅" : step.active ? "🔜" : ""}</div>
                      {step.sub && <div style={{ fontSize: 12, color: "#9E8E6A", marginTop: 2 }}>{step.sub}</div>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Manager contact */}
              {villa?.manager_phone && (
                <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #EDE6D6", padding: "18px 20px", boxShadow: "0 2px 10px rgba(44,44,44,.06)" }}>
                  <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Need Help?</div>
                  <p style={{ fontSize: 13.5, color: "#4A3B27", marginBottom: 14, lineHeight: 1.6 }}>Your villa manager is available to assist you with any questions.</p>
                  <a href={`tel:${villa.manager_phone}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "13px 20px", borderRadius: 12, background: "linear-gradient(135deg,#1E7A48,#2D8A57)", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                    📞 Call {villa.manager_name ?? "Manager"}{villa.manager_phone ? ` · ${villa.manager_phone}` : ""}
                  </a>
                </div>
              )}
            </>
          )}
        </main>

        <BottomNav />
      </div>
    </>
  );
}

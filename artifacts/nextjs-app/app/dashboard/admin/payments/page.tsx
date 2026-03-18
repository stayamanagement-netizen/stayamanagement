"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/* ─── types ──────────────────────────────────────────────────────────────────── */
interface Payment {
  id: string;
  guest_name: string | null;
  villa_name: string | null;
  check_in: string | null;
  amount: number | null;
  type: string | null;
  method: string | null;
  due_date: string | null;
  status: string | null;
  created_at: string | null;
}
interface PaymentAllocation {
  gross_amount: number;
  management_fee_amount: number;
  management_fee_pct: number;
  net_owner_amount: number;
}
interface Summary {
  collectedThisMonth: number;
  pending: number;
  overdue: number;
  upcomingUnpaid: number;
}

/* ─── SVG paths ──────────────────────────────────────────────────────────────── */
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
  check:   "M20 6L9 17l-5-5",
  bell:    "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
  eye:     "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  close:   "M18 6L6 18M6 6l12 12",
  alert:   "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  dollar:  "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  clock:   "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2",
  cog2:    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
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

/* ─── helpers ────────────────────────────────────────────────────────────────── */
function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((seg, i) => <path key={i} d={i === 0 ? seg : "M" + seg} />)}
    </svg>
  );
}

function fmtCurrency(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function isOverdue(p: Payment) {
  if (p.status === "confirmed") return false;
  if (!p.due_date) return false;
  return new Date(p.due_date) < new Date();
}
function effectiveStatus(p: Payment) {
  if (p.status === "confirmed") return "confirmed";
  if (isOverdue(p)) return "overdue";
  return p.status ?? "pending";
}

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  pending:   { bg: "#FFF8E8", color: "#B8860B", border: "#F0D070", label: "Pending" },
  confirmed: { bg: "#EDFAF3", color: "#1E7A48", border: "#B0E8CB", label: "Confirmed" },
  overdue:   { bg: "#FFF0F0", color: "#C62828", border: "#FFCDD2", label: "Overdue"  },
};
const TYPE_STYLES: Record<string, string> = {
  deposit: "#3D6CB0", balance: "#7B4F8E", full: "#1E7A48",
};
const METHOD_STYLES: Record<string, { bg: string; color: string }> = {
  stripe:        { bg: "#EEF1FF", color: "#5469D4" },
  bank_transfer: { bg: "#F0F4F8", color: "#4A6A8C" },
};

/* ─── status badge ───────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap", fontFamily: "Inter,sans-serif" }}>
      {s.label}
    </span>
  );
}

/* ─── reminder modal ─────────────────────────────────────────────────────────── */
function ReminderModal({ payment, onClose, onSent }: { payment: Payment; onClose: () => void; onSent: () => void }) {
  const template = `Dear ${payment.guest_name ?? "Guest"},\n\nYour payment of ${fmtCurrency(payment.amount)} for ${payment.villa_name ?? "your villa"} is due on ${fmtDate(payment.due_date)}. Please complete your payment to confirm your check-in on ${fmtDate(payment.check_in)}.\n\nThank you,\nStaya Management`;
  const [text, setText] = useState(template);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    setSending(true);
    try {
      await supabase.from("payment_reminders").insert([{
        payment_id: payment.id,
        template_text: text,
        sent_at: new Date().toISOString(),
      }]);
    } catch { /* table may not exist yet */ }
    setSending(false);
    setSent(true);
    setTimeout(() => { onSent(); }, 1200);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,28,10,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(44,28,10,.25)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #EDE6D6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C" }}>Send Payment Reminder</h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9E8E6A", fontFamily: "Inter,sans-serif" }}>To: {payment.guest_name} · {payment.villa_name}</p>
          </div>
          <button onClick={onClose} style={{ background: "#F5F0E8", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7A6A50" }}>
            <Ic d={P.close} size={15} />
          </button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", fontFamily: "Inter,sans-serif" }}>Email Template</label>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={9}
            style={{ padding: "10px 12px", border: "1.5px solid #DDD5C0", borderRadius: 8, fontSize: 13, fontFamily: "Inter,sans-serif", color: "#2C2C2C", background: "#FDFBF7", resize: "vertical", lineHeight: 1.6, outline: "none" }} />
          {sent && <div style={{ padding: "8px 12px", background: "#EDFAF3", border: "1px solid #B0E8CB", borderRadius: 8, fontSize: 12.5, color: "#1E7A48", fontFamily: "Inter,sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            <Ic d={P.check} size={14} /> Reminder sent and logged successfully.
          </div>}
        </div>
        <div style={{ padding: "14px 24px 20px", borderTop: "1px solid #EDE6D6", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, border: "1.5px solid #DDD5C0", background: "transparent", color: "#7A6A50", fontSize: 13, fontWeight: 600, fontFamily: "Inter,sans-serif", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSend} disabled={sending || sent} style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: sending || sent ? "#E8D89A" : "#C9A84C", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "Inter,sans-serif", cursor: sending || sent ? "default" : "pointer" }}>
            {sent ? "Sent ✓" : sending ? "Sending…" : "Send Reminder"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── view / allocation modal ────────────────────────────────────────────────── */
function ViewModal({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const gross = payment.amount ?? 0;
  const fee = Math.round(gross * 0.2);
  const net = gross - fee;
  const effStatus = effectiveStatus(payment);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,28,10,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(44,28,10,.25)" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #EDE6D6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C" }}>Payment Detail</h2>
          <button onClick={onClose} style={{ background: "#F5F0E8", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7A6A50" }}>
            <Ic d={P.close} size={15} />
          </button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            ["Guest", payment.guest_name ?? "—"],
            ["Villa", payment.villa_name ?? "—"],
            ["Check-in", fmtDate(payment.check_in)],
            ["Due Date", fmtDate(payment.due_date)],
            ["Type", payment.type ?? "—"],
            ["Method", payment.method ?? "—"],
          ].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid #F5F0E8" }}>
              <span style={{ fontSize: 12.5, color: "#9E8E6A", fontFamily: "Inter,sans-serif" }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C", fontFamily: "Inter,sans-serif" }}>{val}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12.5, color: "#9E8E6A", fontFamily: "Inter,sans-serif" }}>Status</span>
            <StatusBadge status={effStatus} />
          </div>

          {effStatus === "confirmed" && (
            <div style={{ marginTop: 8, background: "#F5F0E8", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#7A6A50", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10, fontFamily: "Inter,sans-serif" }}>Payment Allocation (20% Mgmt Fee)</div>
              {[
                ["Gross Amount", fmtCurrency(gross), "#2C2C2C"],
                ["Management Fee (20%)", `– ${fmtCurrency(fee)}`, "#C62828"],
                ["Net to Owner", fmtCurrency(net), "#1E7A48"],
              ].map(([label, val, color]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, color: "#7A6A50", fontFamily: "Inter,sans-serif" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "Inter,sans-serif" }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: "14px 24px 20px", borderTop: "1px solid #EDE6D6", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: "#C9A84C", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "Inter,sans-serif", cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── mark as paid confirm modal ─────────────────────────────────────────────── */
function MarkPaidModal({ payment, onClose, onDone }: { payment: Payment; onClose: () => void; onDone: () => void }) {
  const gross = payment.amount ?? 0;
  const fee = Math.round(gross * 0.2);
  const net = gross - fee;
  const [saving, setSaving] = useState(false);

  async function confirm() {
    setSaving(true);
    try {
      await supabase.from("payments").update({ status: "confirmed" }).eq("id", payment.id);
      await supabase.from("payment_allocations").insert([{
        payment_id: payment.id,
        gross_amount: gross,
        management_fee_pct: 20,
        management_fee_amount: fee,
        net_owner_amount: net,
      }]);
    } catch { /* tables may not exist */ }
    setSaving(false);
    onDone();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,28,10,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(44,28,10,.25)", padding: "24px 24px 20px" }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 18, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C" }}>Mark as Paid</h2>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#9E8E6A", fontFamily: "Inter,sans-serif" }}>Confirm payment from <strong>{payment.guest_name}</strong> for <strong>{payment.villa_name}</strong>.</p>
        <div style={{ background: "#F5F0E8", borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#7A6A50", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8, fontFamily: "Inter,sans-serif" }}>Allocation Preview</div>
          {[["Gross", fmtCurrency(gross)], ["Management Fee (20%)", `– ${fmtCurrency(fee)}`], ["Net to Owner", fmtCurrency(net)]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12.5, color: "#7A6A50", fontFamily: "Inter,sans-serif" }}>{l}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C", fontFamily: "Inter,sans-serif" }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, border: "1.5px solid #DDD5C0", background: "transparent", color: "#7A6A50", fontSize: 13, fontWeight: 600, fontFamily: "Inter,sans-serif", cursor: "pointer" }}>Cancel</button>
          <button onClick={confirm} disabled={saving} style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: saving ? "#E8D89A" : "#1E7A48", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "Inter,sans-serif", cursor: saving ? "wait" : "pointer" }}>
            {saving ? "Saving…" : "Confirm & Allocate"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── summary card ───────────────────────────────────────────────────────────── */
function SumCard({ label, value, icon, bg, color, isBig }: { label: string; value: string | number; icon: string; bg: string; color: string; isBig?: boolean }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #EDE6D6", boxShadow: "0 1px 6px rgba(44,30,10,.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: isBig ? 26 : 22, fontWeight: 700, color: "#2C2C2C", lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 11.5, color: "#9E8E6A", marginTop: 5, fontFamily: "Inter,sans-serif", fontWeight: 500 }}>{label}</div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ic d={icon} size={18} />
        </div>
      </div>
    </div>
  );
}

/* ─── main page ──────────────────────────────────────────────────────────────── */
export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "overdue">("all");
  const [summary, setSummary] = useState<Summary>({ collectedThisMonth: 0, pending: 0, overdue: 0, upcomingUnpaid: 0 });
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [reminderTarget, setReminderTarget] = useState<Payment | null>(null);
  const [viewTarget, setViewTarget] = useState<Payment | null>(null);
  const [markPaidTarget, setMarkPaidTarget] = useState<Payment | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data, error } = await supabase.from("payments").select("*").order("due_date", { ascending: true });
      if (error) { console.error("payments:", error.message); setPayments([]); setLoading(false); return; }
      const rows = (data ?? []) as Payment[];
      setPayments(rows);
      const today = new Date();
      const in7 = new Date(); in7.setDate(today.getDate() + 7);
      setSummary({
        collectedThisMonth: rows.filter(p => p.status === "confirmed" && p.created_at && p.created_at >= monthStart).reduce((s, p) => s + (p.amount ?? 0), 0),
        pending: rows.filter(p => p.status === "pending" && !isOverdue(p)).length,
        overdue: rows.filter(p => isOverdue(p)).length,
        upcomingUnpaid: rows.filter(p => p.status !== "confirmed" && p.check_in && new Date(p.check_in) <= in7 && new Date(p.check_in) >= today).length,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchPayments();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      supabase.from("profiles").select("id,full_name,role").eq("id", user.id).single()
        .then(({ data }) => { if (data) setProfile(data as any); }, () => {});
    });
  }, [fetchPayments]);

  const initials = profile?.full_name ? profile.full_name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "A";

  const filtered = payments.filter(p => {
    if (filter === "all") return true;
    if (filter === "overdue") return isOverdue(p);
    if (filter === "pending") return p.status === "pending" && !isOverdue(p);
    return p.status === filter;
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F5F0E8", fontFamily: "Inter,sans-serif" }}>
      <style>{`
        *{box-sizing:border-box;}
        .nav-item{display:flex;align-items:center;gap:10px;width:100%;padding:9px 18px;border:none;background:transparent;color:#7A6A50;font-size:13px;font-family:Inter,sans-serif;cursor:pointer;text-align:left;border-left:3px solid transparent;transition:all .15s;}
        .nav-item:hover{background:#F5F0E8;color:#4A3B27;}
        .nav-item.active{background:#FBF6EA;color:#2C2C2C;border-left:3px solid #C9A84C;font-weight:600;}
        .nav-item.active .nav-icon{color:#C9A84C;}
        .trow:hover td{background:#FDFBF7;}
        .filter-tab{padding:7px 18px;border-radius:20px;border:1.5px solid transparent;font-size:12.5px;font-weight:600;font-family:Inter,sans-serif;cursor:pointer;transition:all .15s;}
        .filter-tab.active{background:#C9A84C;color:#fff;border-color:#C9A84C;}
        .filter-tab:not(.active){background:#fff;color:#7A6A50;border-color:#DDD5C0;}
        .filter-tab:not(.active):hover{border-color:#C9A84C;color:#C9A84C;}
        .action-btn{padding:5px 11px;border-radius:7px;font-size:11.5px;font-weight:600;font-family:Inter,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:4px;border:1.5px solid;transition:all .15s;white-space:nowrap;}
        @media(max-width:768px){
          .sidebar{width:52px!important;}
          .sidebar-label,.sidebar-section-label,.sidebar-user-name,.sidebar-user-role{display:none!important;}
          .nav-item{padding:10px 0!important;justify-content:center;}
          .nav-item .nav-icon{margin:0!important;}
          .sidebar-user{justify-content:center!important;padding:10px 0!important;}
          .content-area{padding:16px!important;}
          .page-header{flex-direction:column!important;align-items:flex-start!important;gap:12px!important;}
          .sum-grid{grid-template-columns:repeat(2,1fr)!important;}
          .table-wrap{overflow-x:auto;}
        }
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* ── sidebar ── */}
      <aside className="sidebar" style={{ width: 210, background: "#2C1E0F", minHeight: "100vh", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", zIndex: 100, overflow: "hidden" }}>
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>
          </div>
          <div className="sidebar-label">
            <div style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 700, fontFamily: "Playfair Display,Georgia,serif" }}>Staya</div>
            <div style={{ color: "#C4B89A", fontSize: 9.5, letterSpacing: ".15em", textTransform: "uppercase" }}>Management</div>
          </div>
        </div>
        <nav style={{ padding: "12px 0", flex: 1, overflowY: "auto" }}>
          <div className="sidebar-section-label" style={{ fontSize: 9.5, color: "#C4B89A", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, padding: "0 18px", marginBottom: 6 }}>Main Menu</div>
          {NAV.map(item => {
            const isActive = item.label === "Payments";
            return (
              <button key={item.label} className={`nav-item${isActive ? " active" : ""}`} onClick={() => { if (item.href) window.location.href = item.href; }}>
                <span className="nav-icon" style={{ color: isActive ? "#C9A84C" : "#A0906E", flexShrink: 0 }}><Ic d={item.icon} size={15} /></span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-user" style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials}</div>
          <div className="sidebar-user-name" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#F5F0E8", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile?.full_name ?? "Admin"}</div>
            <div className="sidebar-user-role" style={{ color: "#C9A84C", fontSize: 10.5, fontWeight: 600 }}>Super Admin</div>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} style={{ background: "none", border: "none", cursor: "pointer", color: "#A0906E", padding: 4 }}><Ic d={P.logout} size={14} /></button>
        </div>
      </aside>

      {/* ── main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* topbar */}
        <header style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 28px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#FBF6EA", display: "flex", alignItems: "center", justifyContent: "center", color: "#C9A84C" }}><Ic d={P.pay} size={17} /></div>
            <div>
              <span style={{ fontSize: 16, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", fontWeight: 700 }}>Staya </span>
              <span style={{ fontSize: 16, fontFamily: "Playfair Display,Georgia,serif", color: "#C9A84C", fontWeight: 700 }}>Management</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => window.location.href = "/dashboard/admin/payments/rules/"} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1.5px solid #DDD5C0", background: "#fff", color: "#7A6A50", fontSize: 12.5, fontWeight: 600, fontFamily: "Inter,sans-serif", cursor: "pointer" }}>
              <Ic d={P.cog} size={13} /> Payment Rules
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#F5F0E8", borderRadius: 20, padding: "5px 12px 5px 6px" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>{initials}</div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "#4A3B27", fontFamily: "Inter,sans-serif" }}>Admin</span>
            </div>
          </div>
        </header>

        {/* content */}
        <main className="content-area" style={{ padding: "28px 28px 48px", flex: 1 }}>
          {/* page header */}
          <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", fontWeight: 700 }}>Payments</h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9E8E6A" }}>Track and manage all villa payments</p>
            </div>
          </div>

          {/* summary cards */}
          <div className="sum-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
            <SumCard label="Collected This Month" value={fmtCurrency(summary.collectedThisMonth)} icon={P.dollar} bg="#EDFAF3" color="#1E7A48" isBig />
            <SumCard label="Pending Payments" value={summary.pending} icon={P.clock} bg="#FFF8E8" color="#B8860B" />
            <SumCard label="Overdue Payments" value={summary.overdue} icon={P.alert} bg="#FFF0F0" color="#C62828" />
            <SumCard label="Upcoming Check-ins Unpaid" value={summary.upcomingUnpaid} icon={P.bell} bg="#F0EFFF" color="#7B4F8E" />
          </div>

          {/* filter tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
            {(["all", "pending", "confirmed", "overdue"] as const).map(f => (
              <button key={f} className={`filter-tab${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== "all" && (
                  <span style={{ marginLeft: 6, background: filter === f ? "rgba(255,255,255,.3)" : "#EDE6D6", borderRadius: 10, padding: "0 6px", fontSize: 11 }}>
                    {f === "overdue" ? payments.filter(p => isOverdue(p)).length : payments.filter(p => p.status === f && (f !== "pending" || !isOverdue(p))).length}
                  </span>
                )}
              </button>
            ))}
            <div style={{ marginLeft: "auto", fontSize: 12.5, color: "#9E8E6A", alignSelf: "center" }}>
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* table */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EDE6D6", boxShadow: "0 2px 12px rgba(44,30,10,.06)", overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <div style={{ width: 32, height: 32, border: "3px solid #EDE6D6", borderTopColor: "#C9A84C", borderRadius: "50%", animation: "spin .7s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ color: "#9E8E6A", fontSize: 13 }}>Loading payments…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "60px 24px", textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "#EDE6D6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "#C9A84C" }}>
                  <Ic d={P.pay} size={24} />
                </div>
                <h3 style={{ margin: "0 0 6px", fontSize: 17, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C" }}>No payments found</h3>
                <p style={{ margin: 0, fontSize: 13, color: "#9E8E6A" }}>{filter === "all" ? "No payments have been recorded yet." : `No ${filter} payments.`}</p>
              </div>
            ) : (
              <div className="table-wrap" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                  <thead>
                    <tr style={{ background: "#F5F0E8" }}>
                      {["Guest Name", "Villa", "Check-in", "Amount", "Type", "Method", "Due Date", "Status", "Actions"].map(h => (
                        <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9E8E6A", letterSpacing: ".07em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, i) => {
                      const effStatus = effectiveStatus(p);
                      const typeColor = TYPE_STYLES[p.type ?? ""] ?? "#7A6A50";
                      const mStyle = METHOD_STYLES[p.method ?? ""] ?? { bg: "#F5F0E8", color: "#7A6A50" };
                      return (
                        <tr key={p.id} className="trow" style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F0EBE0" : "none", transition: "background .1s" }}>
                          <td style={{ padding: "13px 14px", fontSize: 13.5, fontWeight: 600, color: "#2C2C2C", whiteSpace: "nowrap" }}>{p.guest_name ?? "—"}</td>
                          <td style={{ padding: "13px 14px", fontSize: 13, color: "#6B5C3E", whiteSpace: "nowrap" }}>{p.villa_name ?? "—"}</td>
                          <td style={{ padding: "13px 14px", fontSize: 12.5, color: "#6B5C3E", whiteSpace: "nowrap" }}>{fmtDate(p.check_in)}</td>
                          <td style={{ padding: "13px 14px", fontSize: 13.5, fontWeight: 700, color: "#2C2C2C", whiteSpace: "nowrap" }}>{fmtCurrency(p.amount)}</td>
                          <td style={{ padding: "13px 14px" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: `${typeColor}15`, color: typeColor, fontFamily: "Inter,sans-serif" }}>{p.type ?? "—"}</span>
                          </td>
                          <td style={{ padding: "13px 14px" }}>
                            {p.method ? (
                              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: mStyle.bg, color: mStyle.color, fontFamily: "Inter,sans-serif" }}>
                                {p.method === "bank_transfer" ? "Bank Transfer" : p.method === "stripe" ? "Stripe" : p.method}
                              </span>
                            ) : "—"}
                          </td>
                          <td style={{ padding: "13px 14px", fontSize: 12.5, color: effStatus === "overdue" ? "#C62828" : "#6B5C3E", fontWeight: effStatus === "overdue" ? 700 : 400, whiteSpace: "nowrap" }}>{fmtDate(p.due_date)}</td>
                          <td style={{ padding: "13px 14px" }}><StatusBadge status={effStatus} /></td>
                          <td style={{ padding: "13px 14px" }}>
                            <div style={{ display: "flex", gap: 5, flexWrap: "nowrap" }}>
                              {effStatus !== "confirmed" && (
                                <button className="action-btn" onClick={() => setMarkPaidTarget(p)}
                                  style={{ background: "#EDFAF3", color: "#1E7A48", borderColor: "#B0E8CB" }}>
                                  <Ic d={P.check} size={11} /> Paid
                                </button>
                              )}
                              <button className="action-btn" onClick={() => setReminderTarget(p)}
                                style={{ background: "#FFF8E8", color: "#B8860B", borderColor: "#F0D070" }}>
                                <Ic d={P.bell} size={11} /> Remind
                              </button>
                              <button className="action-btn" onClick={() => setViewTarget(p)}
                                style={{ background: "#F5F0E8", color: "#7A6A50", borderColor: "#DDD5C0" }}>
                                <Ic d={P.eye} size={11} /> View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {reminderTarget && <ReminderModal payment={reminderTarget} onClose={() => setReminderTarget(null)} onSent={() => setReminderTarget(null)} />}
      {viewTarget    && <ViewModal    payment={viewTarget}    onClose={() => setViewTarget(null)} />}
      {markPaidTarget && <MarkPaidModal payment={markPaidTarget} onClose={() => setMarkPaidTarget(null)} onDone={() => { setMarkPaidTarget(null); fetchPayments(); }} />}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Service {
  id: string;
  villa_id: string | null;
  name: string;
  category: string | null;
  description: string | null;
  price: number | null;
  currency: string | null;
  price_type: string | null;
  min_persons: number | null;
  max_persons: number | null;
  advance_notice_hours: number | null;
  is_active: boolean | null;
  villas: { name: string | null } | null;
}

interface ServiceOrder {
  id: string;
  booking_id: string | null;
  villa_id: string | null;
  service_id: string | null;
  guest_id: string | null;
  guest_name: string | null;
  quantity: number | null;
  persons: number | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  special_requests: string | null;
  total_amount: number | null;
  currency: string | null;
  payment_status: string | null;
  order_status: string | null;
  notes: string | null;
  created_at: string;
  services: { name: string | null; price: number | null; price_type: string | null } | null;
  villas: { name: string | null } | null;
}

interface Villa { id: string; name: string; }

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
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
  cog:     "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  logout:  "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  plus:    "M12 5v14 M5 12h14",
  check:   "M20 6L9 17l-5-5",
  x:       "M18 6L6 18 M6 6l12 12",
  user:    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  clock:   "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2",
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

const ORDER_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "#FFF8E6", color: "#92680A",  label: "Pending" },
  confirmed: { bg: "#EDFAF3", color: "#1E7A48",  label: "Confirmed" },
  completed: { bg: "#EEF2FF", color: "#3730A3",  label: "Completed" },
  cancelled: { bg: "#FFF0F0", color: "#C62828",  label: "Cancelled" },
};

const SVC_ICON: Record<string, string> = {
  Breakfast: "🍳", Scooter: "🛵", Surf: "🏄", Yoga: "🧘", Boat: "⛵",
  Grocery: "🛒", Snorkeling: "🤿", Diving: "🐠", Island: "⛵",
};
function svcIcon(name: string | null) {
  if (!name) return "🛎️";
  for (const k of Object.keys(SVC_ICON)) { if (name.includes(k)) return SVC_ICON[k]; }
  return "🛎️";
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtMoney(n: number | null, currency = "USD") {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

const EMPTY_FORM = { villa_id: "", name: "", description: "", price: "", price_type: "per_person", currency: "USD", min_persons: "1", max_persons: "", advance_notice_hours: "24" };

export default function AdminServicesPage() {
  const [token,      setToken]      = useState<string | null>(null);
  const [orders,     setOrders]     = useState<ServiceOrder[]>([]);
  const [services,   setServices]   = useState<Service[]>([]);
  const [villas,     setVillas]     = useState<Villa[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [loadErr,    setLoadErr]    = useState<string | null>(null);
  const [updating,   setUpdating]   = useState<string | null>(null);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);
  const [tab,        setTab]        = useState<"catalog" | "orders">("orders");
  const [showAddSvc, setShowAddSvc] = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);

  const [statusFilter, setStatusFilter] = useState("all");
  const [villaFilter,  setVillaFilter]  = useState("all");
  const [search,       setSearch]       = useState("");

  const path = typeof window !== "undefined" ? window.location.pathname : "";

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      const { data: sess } = await supabase.auth.getSession();
      const jwt = sess.session?.access_token ?? null;
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (!prof || prof.role !== "super_admin") { window.location.href = "/"; return; }
      setToken(jwt);
    });
  }, []);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadErr(null);
    const res = await fetch("/api/admin/services", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setLoadErr(err.error ?? `Error ${res.status}`);
      setLoading(false);
      return;
    }
    const { orders: o, services: s, villas: v } = await res.json();
    setOrders(o);
    setServices(s);
    setVillas(v);
    setLoading(false);
  }, [token]);

  useEffect(() => { if (token) loadData(); }, [token, loadData]);

  async function updateOrderStatus(id: string, order_status: string) {
    if (!token) return;
    setUpdating(id);
    const res = await fetch("/api/admin/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, order_status }),
    });
    if (!res.ok) showToast("Failed to update", false);
    else {
      showToast(`Order ${order_status}`);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, order_status } : o));
    }
    setUpdating(null);
  }

  async function toggleService(id: string, is_active: boolean) {
    if (!token) return;
    const res = await fetch("/api/admin/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, is_active }),
    });
    if (!res.ok) showToast("Failed to update", false);
    else {
      showToast(is_active ? "Service activated" : "Service deactivated");
      setServices(prev => prev.map(s => s.id === id ? { ...s, is_active } : s));
    }
  }

  async function addService() {
    if (!token || !form.villa_id || !form.name || !form.price) return;
    setSaving(true);
    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        villa_id: form.villa_id, name: form.name, description: form.description || null,
        price: parseFloat(form.price), price_type: form.price_type, currency: form.currency,
        min_persons: parseInt(form.min_persons) || 1,
        max_persons: form.max_persons ? parseInt(form.max_persons) : null,
        advance_notice_hours: parseInt(form.advance_notice_hours) || 24,
      }),
    });
    if (!res.ok) { showToast("Failed to add service", false); setSaving(false); return; }
    showToast("Service added ✓");
    setForm(EMPTY_FORM);
    setShowAddSvc(false);
    await loadData();
    setSaving(false);
  }

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== "all" && o.order_status !== statusFilter) return false;
    if (villaFilter  !== "all" && o.villa_id     !== villaFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!o.guest_name?.toLowerCase().includes(q) &&
          !o.services?.name?.toLowerCase().includes(q) &&
          !o.villas?.name?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalRevenue    = orders.filter(o => o.order_status !== "cancelled").reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const pendingCount    = orders.filter(o => o.order_status === "pending").length;
  const completedCount  = orders.filter(o => o.order_status === "completed" || o.order_status === "confirmed").length;

  const servicesByVilla = villas.map(v => ({
    villa: v,
    svcs: services.filter(s => s.villa_id === v.id),
  }));

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F5F0E8", fontFamily: "Inter,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .nav-item{display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:10px;border:none;background:none;color:#A0906E;cursor:pointer;width:100%;text-align:left;font-size:13px;font-weight:500;transition:all .15s}
        .nav-item:hover{background:#F5F0E8;color:#4A3B27}
        .nav-item.active{background:linear-gradient(135deg,#C9A84C20,#C9A84C10);color:#4A3B27;font-weight:600;border-left:3px solid #C9A84C;padding-left:13px}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#DDD5C0;border-radius:10px}
        select,input,textarea{font-family:Inter,sans-serif}
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .toast{position:fixed;bottom:28px;right:28px;padding:12px 20px;border-radius:10px;font-size:13.5px;font-weight:600;z-index:9999;animation:fadein .25s ease;box-shadow:0 4px 20px rgba(0,0,0,.14)}
        .tbl-row:hover{background:#FFF8ED!important}
        input:focus,select:focus,textarea:focus{outline:none;border-color:#C9A84C!important}
        .act-btn:hover{opacity:.85!important}
      `}</style>

      {toast && (
        <div className="toast" style={{ background: toast.ok ? "#2D8A57" : "#C62828", color: "#fff" }}>
          {toast.msg}
        </div>
      )}

      {/* Add Service Modal */}
      {showAddSvc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontFamily: "Playfair Display,serif", fontSize: 20, fontWeight: 700, color: "#2C1E0F", marginBottom: 6 }}>Add New Service</div>
            <div style={{ fontSize: 13, color: "#9E8E6A", marginBottom: 22 }}>Add a service to a villa&apos;s catalog</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Villa *", key: "villa_id", type: "select", opts: villas.map(v => ({ value: v.id, label: v.name })) },
                { label: "Service Name *", key: "name", type: "text", placeholder: "e.g. Surf Lessons" },
                { label: "Description", key: "description", type: "textarea", placeholder: "Brief description..." },
                { label: "Price (USD) *", key: "price", type: "number", placeholder: "0.00" },
                { label: "Price Type", key: "price_type", type: "select", opts: [{ value: "per_person", label: "Per Person" }, { value: "per_day", label: "Per Day" }, { value: "flat", label: "Flat Rate" }] },
                { label: "Min Persons", key: "min_persons", type: "number", placeholder: "1" },
                { label: "Max Persons", key: "max_persons", type: "number", placeholder: "Optional" },
                { label: "Advance Notice (hours)", key: "advance_notice_hours", type: "number", placeholder: "24" },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 11.5, color: "#7A6A55", fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.7 }}>{f.label}</div>
                  {f.type === "select" ? (
                    <select value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #E0D5C5", borderRadius: 9, fontSize: 13, color: "#3D2E1A", background: "#FAF7F2" }}>
                      {f.key === "villa_id" && <option value="">Select villa...</option>}
                      {f.opts?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} rows={2}
                      style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #E0D5C5", borderRadius: 9, fontSize: 13, color: "#3D2E1A", background: "#FAF7F2", resize: "vertical" }} />
                  ) : (
                    <input type={f.type} value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #E0D5C5", borderRadius: 9, fontSize: 13, color: "#3D2E1A", background: "#FAF7F2" }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
              <button onClick={() => { setShowAddSvc(false); setForm(EMPTY_FORM); }}
                style={{ padding: "9px 20px", borderRadius: 9, border: "1.5px solid #E0D5C5", background: "#fff", color: "#7A6A55", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={addService} disabled={saving || !form.villa_id || !form.name || !form.price}
                style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: form.villa_id && form.name && form.price ? "#C9A84C" : "#E0D5C5", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                {saving ? "Adding…" : "Add Service"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside style={{ width: 220, background: "#2C1E0F", display: "flex", flexDirection: "column", padding: "20px 12px", gap: 2, flexShrink: 0 }}>
        <div style={{ padding: "4px 12px 20px", borderBottom: "1px solid #3D2E1A", marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#C9A84C", fontFamily: "'Playfair Display',serif" }}>Staya</div>
          <div style={{ fontSize: 10, color: "#7A6A55", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }}>Management</div>
        </div>
        {NAV.map(item => {
          const isActive = item.href !== null && (item.href === "/dashboard/admin" ? path === item.href : path.startsWith(item.href!));
          return (
            <button key={item.label} className={`nav-item${isActive ? " active" : ""}`}
              onClick={() => { if (item.href) window.location.href = item.href; }}
              style={{ opacity: item.href ? 1 : 0.4, cursor: item.href ? "pointer" : "default" }}>
              <span style={{ color: isActive ? "#C9A84C" : "#A0906E" }}><Ic d={item.icon} size={15} /></span>
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <button className="nav-item" onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}>
          <Ic d={P.logout} size={15} /><span>Sign Out</span>
        </button>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 28px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "Playfair Display,serif", fontSize: 18, fontWeight: 700, color: "#2C1E0F" }}>Services</div>
            <div style={{ fontSize: 12, color: "#9E8E6A" }}>Manage villa services catalog and guest orders</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowAddSvc(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "none", background: "#C9A84C", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
              <Ic d={P.plus} size={14} /> Add Service
            </button>
            <button onClick={loadData} disabled={loading}
              style={{ padding: "8px 16px", borderRadius: 9, border: "1.5px solid #E0D5C5", background: "#fff", color: "#7A6A55", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

          {/* KPI cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Total Revenue",    value: fmtMoney(totalRevenue),        sub: "excl. cancelled", color: "#C9A84C" },
              { label: "Pending Orders",   value: String(pendingCount),           sub: "need confirmation", color: "#92680A" },
              { label: "Fulfilled",        value: String(completedCount),         sub: "confirmed + completed", color: "#1E7A48" },
              { label: "Services Listed",  value: String(services.filter(s => s.is_active).length), sub: `across ${villas.length} villas`, color: "#2B4BA0" },
            ].map(c => (
              <div key={c.label} style={{ background: "#fff", border: "1px solid #EDE6D6", borderRadius: 14, padding: "16px 18px", borderTop: `3px solid ${c.color}` }}>
                <div style={{ fontSize: 11, color: "#9E8E6A", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{c.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#2C1E0F", fontFamily: "Playfair Display,serif" }}>{c.value}</div>
                <div style={{ fontSize: 11.5, color: "#9E8E6A", marginTop: 4 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#fff", borderRadius: 12, padding: 4, border: "1px solid #EDE6D6", width: "fit-content" }}>
            {(["orders", "catalog"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: "7px 20px", borderRadius: 9, border: "none", fontSize: 13, fontWeight: tab === t ? 700 : 500, cursor: "pointer", transition: "all .18s", background: tab === t ? "#2C1E0F" : "transparent", color: tab === t ? "#C9A84C" : "#7A6A50" }}>
                {{ orders: "Service Orders", catalog: "Services Catalog" }[t]}
                {t === "orders" && pendingCount > 0 && (
                  <span style={{ marginLeft: 7, background: "#C9A84C", color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{pendingCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── SERVICE ORDERS TAB ── */}
          {tab === "orders" && (
            <>
              {/* Filters */}
              <div style={{ background: "#fff", border: "1px solid #EDE6D6", borderRadius: 14, padding: "14px 18px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
                {[
                  { label: "Status",  value: statusFilter, setter: setStatusFilter, opts: [["all","All Statuses"],["pending","Pending"],["confirmed","Confirmed"],["completed","Completed"],["cancelled","Cancelled"]] },
                  { label: "Villa",   value: villaFilter,  setter: setVillaFilter,  opts: [["all","All Villas"],   ...villas.map(v => [v.id, v.name])] },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 10.5, color: "#9E8E6A", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.7 }}>{f.label}</div>
                    <select value={f.value} onChange={e => f.setter(e.target.value)}
                      style={{ padding: "7px 12px", border: "1.5px solid #E0D5C5", borderRadius: 8, fontSize: 13, color: "#3D2E1A", background: "#FAF7F2" }}>
                      {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                ))}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 10.5, color: "#9E8E6A", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.7 }}>Search</div>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Guest, service, villa…"
                    style={{ width: "100%", padding: "7px 12px", border: "1.5px solid #E0D5C5", borderRadius: 8, fontSize: 13, color: "#3D2E1A", background: "#FAF7F2" }} />
                </div>
              </div>

              {/* Orders table */}
              <div style={{ background: "#fff", border: "1px solid #EDE6D6", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "12px 18px", borderBottom: "1px solid #EDE6D6", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "#2C1E0F" }}>{filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}</span>
                  <span style={{ fontSize: 12, color: "#9E8E6A" }}>Total: {fmtMoney(filteredOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0))}</span>
                </div>
                {loading ? (
                  <div style={{ padding: 48, textAlign: "center", color: "#A0906E" }}>Loading orders…</div>
                ) : loadErr ? (
                  <div style={{ padding: 48, textAlign: "center", color: "#C62828" }}>Error: {loadErr}</div>
                ) : filteredOrders.length === 0 ? (
                  <div style={{ padding: 48, textAlign: "center", color: "#A0906E" }}>
                    {orders.length === 0 ? "No service orders yet." : "No orders match your filters."}
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #EDE6D6", background: "#FAF7F2" }}>
                          {["Date", "Villa", "Guest", "Service", "Persons", "Scheduled", "Amount", "Status", "Actions"].map(h => (
                            <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9E8E6A", textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map(o => {
                          const sc = ORDER_STATUS[o.order_status ?? "pending"] ?? ORDER_STATUS.pending;
                          return (
                            <tr key={o.id} className="tbl-row" style={{ borderBottom: "1px solid #F5F0E8", background: "#fff", transition: "background .1s" }}>
                              <td style={{ padding: "11px 14px", fontSize: 12.5, color: "#7A6A55", whiteSpace: "nowrap" }}>{fmtDate(o.created_at)}</td>
                              <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "#2C1E0F", whiteSpace: "nowrap" }}>{o.villas?.name ?? "—"}</td>
                              <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Ic d={P.user} size={13} />
                                  </div>
                                  <span style={{ fontSize: 13, color: "#3D2E1A" }}>{o.guest_name ?? "—"}</span>
                                </div>
                              </td>
                              <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                  <span style={{ fontSize: 17 }}>{svcIcon(o.services?.name ?? null)}</span>
                                  <span style={{ fontSize: 13, color: "#3D2E1A", fontWeight: 500 }}>{o.services?.name ?? "—"}</span>
                                </div>
                              </td>
                              <td style={{ padding: "11px 14px", fontSize: 13, color: "#3D2E1A", textAlign: "center" }}>{o.persons ?? o.quantity ?? "—"}</td>
                              <td style={{ padding: "11px 14px", fontSize: 12.5, color: "#7A6A55", whiteSpace: "nowrap" }}>
                                {o.scheduled_date ? `${fmtDate(o.scheduled_date)}${o.scheduled_time ? " · " + o.scheduled_time : ""}` : "—"}
                              </td>
                              <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 700, color: "#2C1E0F", whiteSpace: "nowrap" }}>{fmtMoney(o.total_amount)}</td>
                              <td style={{ padding: "11px 14px" }}>
                                <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: sc.bg, color: sc.color, whiteSpace: "nowrap" }}>
                                  {sc.label}
                                </span>
                              </td>
                              <td style={{ padding: "11px 14px" }}>
                                {o.order_status === "pending" && (
                                  <div style={{ display: "flex", gap: 5 }}>
                                    <button className="act-btn" onClick={() => updateOrderStatus(o.id, "confirmed")} disabled={updating === o.id}
                                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, border: "none", background: "#1E7A48", color: "#fff", cursor: "pointer", fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap" }}>
                                      <Ic d={P.check} size={11} />{updating === o.id ? "…" : "Confirm"}
                                    </button>
                                    <button className="act-btn" onClick={() => updateOrderStatus(o.id, "cancelled")} disabled={updating === o.id}
                                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, border: "1.5px solid #EDE6D6", background: "#fff", color: "#C62828", cursor: "pointer", fontSize: 11.5, fontWeight: 700 }}>
                                      <Ic d={P.x} size={11} />Cancel
                                    </button>
                                  </div>
                                )}
                                {o.order_status === "confirmed" && (
                                  <button className="act-btn" onClick={() => updateOrderStatus(o.id, "completed")} disabled={updating === o.id}
                                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 11px", borderRadius: 7, border: "none", background: "#3730A3", color: "#fff", cursor: "pointer", fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap" }}>
                                    <Ic d={P.check} size={11} />{updating === o.id ? "…" : "Complete"}
                                  </button>
                                )}
                                {(o.order_status === "completed" || o.order_status === "cancelled") && (
                                  <span style={{ fontSize: 12, color: "#C4B89A" }}>—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── SERVICES CATALOG TAB ── */}
          {tab === "catalog" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {loading ? (
                <div style={{ padding: 48, textAlign: "center", color: "#A0906E" }}>Loading catalog…</div>
              ) : servicesByVilla.map(({ villa, svcs }) => (
                <div key={villa.id} style={{ background: "#fff", border: "1px solid #EDE6D6", borderRadius: 16, overflow: "hidden" }}>
                  {/* Villa header */}
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid #EDE6D6", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FAFAF7" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#C9A84C,#A8872E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Ic d={P.villa} size={16} />
                      </div>
                      <div>
                        <div style={{ fontFamily: "Playfair Display,serif", fontSize: 16, fontWeight: 700, color: "#2C1E0F" }}>{villa.name}</div>
                        <div style={{ fontSize: 12, color: "#9E8E6A" }}>{svcs.length} service{svcs.length !== 1 ? "s" : ""} · {svcs.filter(s => s.is_active).length} active</div>
                      </div>
                    </div>
                    <button onClick={() => { setForm({ ...EMPTY_FORM, villa_id: villa.id }); setShowAddSvc(true); }}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: "1.5px solid #C9A84C", background: "#FFF8E6", color: "#92680A", cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}>
                      <Ic d={P.plus} size={13} /> Add Service
                    </button>
                  </div>

                  {svcs.length === 0 ? (
                    <div style={{ padding: "28px 20px", textAlign: "center", color: "#A0906E", fontSize: 13 }}>
                      No services listed for this villa yet.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16, padding: 20 }}>
                      {svcs.map(s => (
                        <div key={s.id} style={{ border: `1.5px solid ${s.is_active ? "#EDE6D6" : "#F0EBE0"}`, borderRadius: 12, padding: "16px 18px", background: s.is_active ? "#FDFCF9" : "#F9F5EE", opacity: s.is_active ? 1 : 0.7 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 22 }}>{svcIcon(s.name)}</span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#2C1E0F" }}>{s.name}</span>
                            </div>
                            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                              <span style={{ fontSize: 11, color: s.is_active ? "#1E7A48" : "#9E8E6A", fontWeight: 600 }}>{s.is_active ? "Active" : "Off"}</span>
                              <div onClick={() => toggleService(s.id, !s.is_active)}
                                style={{ width: 36, height: 20, borderRadius: 10, background: s.is_active ? "#C9A84C" : "#D0C4A8", cursor: "pointer", position: "relative", transition: "background .2s" }}>
                                <div style={{ position: "absolute", top: 2, left: s.is_active ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
                              </div>
                            </label>
                          </div>
                          {s.description && (
                            <div style={{ fontSize: 12, color: "#7A6A55", marginBottom: 10, lineHeight: 1.5 }}>{s.description}</div>
                          )}
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "#C9A84C" }}>{fmtMoney(s.price, s.currency ?? "USD")}</span>
                            <span style={{ fontSize: 11.5, color: "#9E8E6A", padding: "2px 8px", background: "#F5F0E8", borderRadius: 20 }}>
                              {s.price_type === "per_person" ? "/person" : s.price_type === "per_day" ? "/day" : "flat"}
                            </span>
                            {s.min_persons && (
                              <span style={{ fontSize: 11.5, color: "#9E8E6A", padding: "2px 8px", background: "#F5F0E8", borderRadius: 20 }}>
                                Min {s.min_persons}{s.max_persons ? `–${s.max_persons}` : "+"} pax
                              </span>
                            )}
                          </div>
                          {s.advance_notice_hours && (
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, fontSize: 11.5, color: "#A0906E" }}>
                              <Ic d={P.clock} size={12} /> {s.advance_notice_hours}h advance notice
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

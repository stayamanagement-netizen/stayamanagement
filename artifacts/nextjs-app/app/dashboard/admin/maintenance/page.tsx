"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface MaintenanceRecord {
  id: string;
  villa_id: string | null;
  reported_by: string | null;
  title: string;
  description: string | null;
  category: string | null;
  priority: string | null;
  status: string | null;
  photo_urls: string[] | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  resolved_at: string | null;
  created_at: string;
  villas: { name: string | null } | null;
  profiles: { full_name: string | null } | null;
}

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
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
  x:       "M18 6L6 18 M6 6l12 12",
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

const PRIORITY_CFG: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  urgent: { bg: "#FFF0F0", color: "#C62828", dot: "#FF3D3D", label: "🔴 Urgent" },
  high:   { bg: "#FFF4EC", color: "#B05C00", dot: "#FF8C00", label: "🟠 High" },
  medium: { bg: "#FFFBE6", color: "#7A5210", dot: "#FFD700", label: "🟡 Medium" },
  low:    { bg: "#EDFAF3", color: "#2D8A57", dot: "#4CAF50", label: "🟢 Low" },
};

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
  open:        { bg: "#FFF0F0", color: "#C62828", label: "Open" },
  in_progress: { bg: "#FFF8E6", color: "#C9A84C", label: "In Progress" },
  resolved:    { bg: "#EDFAF3", color: "#2D8A57", label: "Resolved" },
  closed:      { bg: "#F5F0E8", color: "#9E8E6A", label: "Closed" },
};

const CAT_LABELS: Record<string, string> = {
  plumbing: "Plumbing", electrical: "Electrical", pool: "Pool",
  garden: "Garden", structural: "Structural",
};

const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtCurrency(n: number | null) {
  if (n == null) return "—";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function AdminMaintenancePage() {
  const [token,      setToken]      = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [records,    setRecords]    = useState<MaintenanceRecord[]>([]);
  const [villas,     setVillas]     = useState<{ id: string; name: string }[]>([]);
  const [selected,   setSelected]   = useState<MaintenanceRecord | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);
  const [loadErr,    setLoadErr]    = useState<string | null>(null);

  const [villaFilter,    setVillaFilter]    = useState("all");
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [catFilter,      setCatFilter]      = useState("all");
  const [search,         setSearch]         = useState("");

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
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

    const [vRes, mRes] = await Promise.all([
      supabase.from("villas").select("id,name").order("name"),
      fetch("/api/admin/maintenance", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    setVillas((vRes.data ?? []) as { id: string; name: string }[]);

    if (!mRes.ok) {
      const errBody = await mRes.json().catch(() => ({}));
      setLoadErr(errBody.error ?? `Server error (${mRes.status})`);
      setLoading(false);
      return;
    }
    const data = await mRes.json();
    setRecords(data as MaintenanceRecord[]);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) loadData();
  }, [token, loadData]);

  async function updateStatus(id: string, newStatus: string) {
    if (!token) return;
    setUpdatingId(id);
    const res = await fetch("/api/admin/maintenance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status: newStatus }),
    });
    if (!res.ok) showToast("Failed to update status", false);
    else {
      showToast("Status updated ✓");
      setRecords(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, resolved_at: newStatus === "resolved" ? new Date().toISOString() : r.resolved_at } : r));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null);
    }
    setUpdatingId(null);
  }

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const filtered = records.filter(r => {
    if (villaFilter    !== "all" && r.villa_id !== villaFilter)     return false;
    if (statusFilter   !== "all" && r.status !== statusFilter)      return false;
    if (priorityFilter !== "all" && r.priority !== priorityFilter)  return false;
    if (catFilter      !== "all" && r.category !== catFilter)       return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.title.toLowerCase().includes(q) &&
          !r.villas?.name?.toLowerCase().includes(q) &&
          !r.profiles?.full_name?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const openCount     = records.filter(r => r.status === "open").length;
  const inProgCount   = records.filter(r => r.status === "in_progress").length;
  const resolvedMonth = records.filter(r => r.status === "resolved" && r.resolved_at?.startsWith(thisMonth)).length;
  const urgentCount   = records.filter(r => r.priority === "urgent" && r.status !== "resolved" && r.status !== "closed").length;

  const path = typeof window !== "undefined" ? window.location.pathname : "";

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F5F0E8", fontFamily: "Inter,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .nav-item{display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:10px;border:none;background:none;color:#A0906E;cursor:pointer;width:100%;text-align:left;font-size:13px;font-weight:500;transition:all .15s}
        .nav-item:hover{background:#F5F0E8;color:#4A3B27}
        .nav-item.active{background:linear-gradient(135deg,#C9A84C20,#C9A84C10);color:#4A3B27;font-weight:600;border-left:3px solid #C9A84C;padding-left:13px}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#DDD5C0;border-radius:10px}
        .tbl-row:hover{background:#FFF8ED!important;cursor:pointer}
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .toast{position:fixed;bottom:28px;right:28px;padding:12px 20px;border-radius:10px;font-size:13.5px;font-weight:600;z-index:9999;animation:fadein .25s ease;box-shadow:0 4px 20px rgba(0,0,0,.14)}
        select{font-family:Inter,sans-serif;cursor:pointer}
      `}</style>

      {toast && <div className="toast" style={{ background: toast.ok ? "#2D8A57" : "#C62828", color: "#fff" }}>{toast.msg}</div>}

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 580, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ flex: 1, marginRight: 16 }}>
                <div style={{ fontFamily: "Playfair Display,serif", fontSize: 20, fontWeight: 700, color: "#2C1E0F", marginBottom: 6 }}>{selected.title}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: PRIORITY_CFG[selected.priority ?? "medium"]?.bg, color: PRIORITY_CFG[selected.priority ?? "medium"]?.color }}>
                    {PRIORITY_CFG[selected.priority ?? "medium"]?.label ?? selected.priority}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: STATUS_CFG[selected.status ?? "open"]?.bg, color: STATUS_CFG[selected.status ?? "open"]?.color }}>
                    {STATUS_CFG[selected.status ?? "open"]?.label ?? selected.status}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "#F5F0E8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Ic d={P.x} size={15} />
              </button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {[
                { label: "Villa",        val: selected.villas?.name ?? "—" },
                { label: "Reported by",  val: selected.profiles?.full_name ?? "—" },
                { label: "Reported on",  val: fmtDate(selected.created_at) },
                { label: "Category",     val: CAT_LABELS[selected.category ?? ""] ?? selected.category ?? "—" },
                { label: "Est. Cost",    val: fmtCurrency(selected.estimated_cost) },
                { label: "Actual Cost",  val: fmtCurrency(selected.actual_cost) },
                { label: "Resolved",     val: fmtDate(selected.resolved_at) },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: "flex", gap: 12, borderBottom: "1px solid #F5F0E8", paddingBottom: 10 }}>
                  <div style={{ width: 130, fontSize: 12, color: "#9E8E6A", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, flexShrink: 0 }}>{label}</div>
                  <div style={{ fontSize: 13.5, color: "#2C1E0F", fontWeight: 500 }}>{val}</div>
                </div>
              ))}
            </div>

            {selected.description && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9E8E6A", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Description</div>
                <div style={{ fontSize: 13.5, color: "#3D2E1A", lineHeight: 1.65, background: "#FAF7F2", borderRadius: 10, padding: "12px 16px" }}>{selected.description}</div>
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9E8E6A", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Update Status</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {STATUSES.map(s => {
                  const sc = STATUS_CFG[s];
                  const isActive = selected.status === s;
                  return (
                    <button key={s} onClick={() => updateStatus(selected.id, s)}
                      disabled={isActive || updatingId === selected.id}
                      style={{ padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${isActive ? sc.color : "#E0D5C5"}`, background: isActive ? sc.bg : "#fff", color: isActive ? sc.color : "#7A6A55", fontWeight: isActive ? 700 : 500, cursor: isActive ? "default" : "pointer", fontSize: 13, transition: "all .15s" }}>
                      {sc.label}
                    </button>
                  );
                })}
              </div>
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
          const isActive = item.href !== null && (item.href === "/dashboard/admin" ? path === item.href : path.startsWith(item.href));
          return (
            <button key={item.label} className={`nav-item${isActive ? " active" : ""}`}
              onClick={() => { if (item.href) window.location.href = item.href; }}
              style={{ opacity: item.href ? 1 : 0.4, cursor: item.href ? "pointer" : "default" }}>
              <span style={{ color: isActive ? "#C9A84C" : "#A0906E" }}><Ic d={item.icon} size={15} /></span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.label === "Maintenance" && urgentCount > 0 && (
                <span style={{ background: "#FF3D3D", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 99 }}>{urgentCount}</span>
              )}
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
        <div style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 28px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "Playfair Display,serif", fontSize: 18, fontWeight: 700, color: "#2C1E0F" }}>Maintenance</div>
            <div style={{ fontSize: 12, color: "#9E8E6A" }}>All maintenance requests across all villas</div>
          </div>
          <button onClick={loadData} style={{ padding: "8px 18px", borderRadius: 9, border: "1.5px solid #C9A84C", background: "#C9A84C", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Refresh</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Open Issues",          value: openCount,     color: "#C62828", bg: "#FFF0F0", sub: "need attention" },
              { label: "In Progress",          value: inProgCount,   color: "#C9A84C", bg: "#FFF8E6", sub: "being worked on" },
              { label: "Resolved This Month",  value: resolvedMonth, color: "#2D8A57", bg: "#EDFAF3", sub: `in ${now.toLocaleString("default", { month: "long" })}` },
              { label: "🔴 Urgent Open",       value: urgentCount,   color: "#FF3D3D", bg: "#FFF0F0", sub: "require immediate action" },
            ].map(c => (
              <div key={c.label} style={{ background: "#fff", border: "1px solid #EDE6D6", borderRadius: 14, padding: "18px 20px", borderTop: `3px solid ${c.color}` }}>
                <div style={{ fontSize: 11, color: "#9E8E6A", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{c.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: c.color, fontFamily: "Playfair Display,serif" }}>{c.value}</div>
                <div style={{ fontSize: 11.5, color: "#9E8E6A", marginTop: 4 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ background: "#fff", border: "1px solid #EDE6D6", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
            {[
              { label: "Villa", value: villaFilter, setter: setVillaFilter, opts: [["all", "All Villas"], ...villas.map(v => [v.id, v.name])] },
              { label: "Status", value: statusFilter, setter: setStatusFilter, opts: [["all","All Statuses"],["open","Open"],["in_progress","In Progress"],["resolved","Resolved"],["closed","Closed"]] },
              { label: "Priority", value: priorityFilter, setter: setPriorityFilter, opts: [["all","All Priorities"],["urgent","🔴 Urgent"],["high","🟠 High"],["medium","🟡 Medium"],["low","🟢 Low"]] },
              { label: "Category", value: catFilter, setter: setCatFilter, opts: [["all","All Categories"], ...Object.entries(CAT_LABELS).map(([k,v]) => [k,v])] },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: 10.5, color: "#9E8E6A", fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.7 }}>{f.label}</div>
                <select value={f.value} onChange={e => f.setter(e.target.value)}
                  style={{ padding: "7px 12px", border: "1.5px solid #E0D5C5", borderRadius: 8, fontSize: 13, outline: "none", color: "#3D2E1A", background: "#FAF7F2" }}>
                  {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 10.5, color: "#9E8E6A", fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.7 }}>Search</div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, villa, reporter…"
                style={{ width: "100%", padding: "7px 12px", border: "1.5px solid #E0D5C5", borderRadius: 8, fontSize: 13, outline: "none", color: "#3D2E1A", background: "#FAF7F2", fontFamily: "Inter,sans-serif" }} />
            </div>
          </div>

          {/* Table */}
          <div style={{ background: "#fff", border: "1px solid #EDE6D6", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #EDE6D6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#2C1E0F" }}>{filtered.length} request{filtered.length !== 1 ? "s" : ""}</span>
              <span style={{ fontSize: 12, color: "#9E8E6A" }}>Click any row to view details & update status</span>
            </div>
            {loading ? (
              <div style={{ padding: 48, textAlign: "center", color: "#A0906E" }}>Loading…</div>
            ) : loadErr ? (
              <div style={{ padding: 48, textAlign: "center", color: "#C62828" }}>Error: {loadErr}</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "#A0906E" }}>
                {records.length === 0 ? "No maintenance requests submitted yet." : "No requests match your filters."}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #EDE6D6", background: "#FAF7F2" }}>
                      {["Date", "Villa", "Reported By", "Title", "Category", "Priority", "Status", "Est. Cost"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9E8E6A", textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => {
                      const pc = PRIORITY_CFG[r.priority ?? "medium"] ?? PRIORITY_CFG.medium;
                      const sc = STATUS_CFG[r.status ?? "open"] ?? STATUS_CFG.open;
                      return (
                        <tr key={r.id} className="tbl-row" onClick={() => setSelected(r)}
                          style={{ borderBottom: "1px solid #F5F0E8", transition: "background .12s", background: r.priority === "urgent" && r.status === "open" ? "#FFF8F8" : "#fff" }}>
                          <td style={{ padding: "12px 14px", fontSize: 13, color: "#3D2E1A", whiteSpace: "nowrap" }}>{fmtDate(r.created_at)}</td>
                          <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#2C1E0F", whiteSpace: "nowrap" }}>{r.villas?.name ?? "—"}</td>
                          <td style={{ padding: "12px 14px", fontSize: 13, color: "#3D2E1A", whiteSpace: "nowrap" }}>{r.profiles?.full_name ?? "—"}</td>
                          <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#2C1E0F", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: "#F5F0E8", color: "#7A6A55" }}>{CAT_LABELS[r.category ?? ""] ?? r.category ?? "—"}</span>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: pc.bg, color: pc.color, whiteSpace: "nowrap" }}>{pc.label}</span>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: sc.bg, color: sc.color, whiteSpace: "nowrap" }}>{sc.label}</span>
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: 13, color: "#3D2E1A" }}>{fmtCurrency(r.estimated_cost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

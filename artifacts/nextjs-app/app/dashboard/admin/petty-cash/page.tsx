"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface PettyCash {
  id: string;
  villa_id: string | null;
  submitted_by: string | null;
  category: string | null;
  description: string | null;
  amount: number | null;
  currency: string | null;
  receipt_url: string | null;
  status: string | null;
  approved_by: string | null;
  approved_at: string | null;
  expense_date: string | null;
  created_at: string;
  villas: { name: string | null } | null;
  profiles: { full_name: string | null } | null;
}

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
  check:   "M5 13l4 4L19 7",
  x:       "M18 6L6 18 M6 6l12 12",
  download:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  eye:     "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
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

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: "#FFF8E6", color: "#C9A84C", label: "Pending" },
  approved: { bg: "#EDFAF3", color: "#2D8A57", label: "Approved" },
  rejected: { bg: "#FFF0F0", color: "#C62828", label: "Rejected" },
};

const CAT_LABELS: Record<string, string> = {
  groceries: "Groceries", cleaning: "Cleaning", maintenance: "Maintenance",
  utilities: "Utilities", supplies: "Supplies", other: "Other",
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtCurrency(n: number | null, currency = "USD") {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

export default function AdminPettyCashPage() {
  const [token,     setToken]     = useState<string | null>(null);
  const [adminName, setAdminName] = useState("Admin");
  const [records,   setRecords]   = useState<PettyCash[]>([]);
  const [villas,    setVillas]    = useState<{ id: string; name: string }[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [loadErr,   setLoadErr]   = useState<string | null>(null);
  const [saving,    setSaving]    = useState<string | null>(null);

  const [villaFilter,  setVillaFilter]  = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter,    setCatFilter]    = useState("all");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [search,       setSearch]       = useState("");

  const [receiptUrl,   setReceiptUrl]   = useState<string | null>(null);
  const [rejectId,     setRejectId]     = useState<string | null>(null);
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      const { data: sess } = await supabase.auth.getSession();
      const jwt = sess.session?.access_token ?? null;
      const { data: prof } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).single();
      if (!prof || prof.role !== "super_admin") { window.location.href = "/"; return; }
      setAdminName(prof.full_name ?? "Admin");
      setToken(jwt);
    });
  }, []);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadErr(null);

    const [villasRes, pcRes] = await Promise.all([
      supabase.from("villas").select("id,name").order("name"),
      fetch("/api/admin/petty-cash", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    setVillas((villasRes.data ?? []) as { id: string; name: string }[]);

    if (!pcRes.ok) {
      const errBody = await pcRes.json().catch(() => ({}));
      setLoadErr(errBody.error ?? `Server error (${pcRes.status})`);
      setLoading(false);
      return;
    }
    const data = await pcRes.json();
    setRecords(data as PettyCash[]);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) loadData();
  }, [token, loadData]);

  async function updateStatus(id: string, status: string) {
    if (!token) return;
    setSaving(id);
    const res = await fetch("/api/admin/petty-cash", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) showToast("Failed to update status", false);
    else {
      showToast(status === "approved" ? "Approved ✓" : "Rejected");
      setRecords(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      if (rejectId === id) setRejectId(null);
    }
    setSaving(null);
  }

  function exportCSV() {
    const header = "Date,Villa,Manager,Category,Description,Amount,Currency,Status";
    const rows = filtered.map(r =>
      `"${r.expense_date ?? ""}","${r.villas?.name ?? ""}","${r.profiles?.full_name ?? ""}","${r.category ?? ""}","${r.description ?? ""}","${r.amount ?? ""}","${r.currency ?? "USD"}","${r.status ?? ""}"`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "petty-cash-export.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const filtered = records.filter(r => {
    if (villaFilter  !== "all" && r.villa_id !== villaFilter) return false;
    if (statusFilter !== "all" && r.status   !== statusFilter) return false;
    if (catFilter    !== "all" && r.category !== catFilter)   return false;
    if (dateFrom && r.expense_date && r.expense_date < dateFrom) return false;
    if (dateTo   && r.expense_date && r.expense_date > dateTo)   return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.description?.toLowerCase().includes(q) &&
          !r.profiles?.full_name?.toLowerCase().includes(q) &&
          !r.villas?.name?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const pendingRecords  = records.filter(r => r.status === "pending");
  const approvedMonth   = records.filter(r => r.status === "approved" && r.created_at?.startsWith(thisMonth));
  const rejectedRecords = records.filter(r => r.status === "rejected");
  const totalPending    = pendingRecords.reduce((s, r) => s + (r.amount ?? 0), 0);
  const totalApprovedMo = approvedMonth.reduce((s, r) => s + (r.amount ?? 0), 0);
  const totalSpent      = records.filter(r => r.status === "approved").reduce((s, r) => s + (r.amount ?? 0), 0);

  const byCategory = Object.entries(CAT_LABELS)
    .map(([k, label]) => ({ label, total: records.filter(r => r.category === k && r.status === "approved").reduce((s, r) => s + (r.amount ?? 0), 0) }))
    .filter(c => c.total > 0).sort((a, b) => b.total - a.total);

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
        select,input{font-family:Inter,sans-serif}
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .toast{position:fixed;bottom:28px;right:28px;padding:12px 20px;border-radius:10px;font-size:13.5px;font-weight:600;z-index:9999;animation:fadein .25s ease;box-shadow:0 4px 20px rgba(0,0,0,.14)}
        .tbl-row:hover{background:#FFF8ED!important}
        input:focus,select:focus{outline:none;border-color:#C9A84C!important}
      `}</style>

      {toast && (
        <div className="toast" style={{ background: toast.ok ? "#2D8A57" : "#C62828", color: "#fff" }}>
          {toast.msg}
        </div>
      )}

      {/* Receipt modal */}
      {receiptUrl && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setReceiptUrl(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, maxWidth: "90vw", position: "relative" }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setReceiptUrl(null)} style={{ position: "absolute", top: 10, right: 10, background: "#F5F0E8", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={P.x} size={14} /></button>
            <img src={receiptUrl} alt="Receipt" style={{ maxWidth: "80vw", maxHeight: "80vh", borderRadius: 8, objectFit: "contain", display: "block" }} />
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 440, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ fontFamily: "Playfair Display,serif", fontSize: 18, fontWeight: 700, color: "#2C2C2C", marginBottom: 6 }}>Reject Expense</div>
            <div style={{ fontSize: 13, color: "#9E8E6A", marginBottom: 20 }}>This expense will be marked as rejected.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setRejectId(null)} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #E0D5C5", background: "#fff", color: "#7A6A55", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
              <button onClick={() => updateStatus(rejectId, "rejected")} disabled={saving === rejectId}
                style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#C62828", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                {saving === rejectId ? "Rejecting…" : "Confirm Reject"}
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
            <div style={{ fontFamily: "Playfair Display,serif", fontSize: 18, fontWeight: 700, color: "#2C1E0F" }}>Petty Cash</div>
            <div style={{ fontSize: 12, color: "#9E8E6A" }}>Review and approve expense submissions from all villas</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "1.5px solid #E0D5C5", background: "#fff", color: "#7A6A55", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              <Ic d={P.download} size={14} /> Export CSV
            </button>
            <button onClick={loadData} disabled={loading} style={{ padding: "8px 16px", borderRadius: 9, border: "1.5px solid #C9A84C", background: "#C9A84C", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Pending Approval",     value: fmtCurrency(totalPending),    sub: `${pendingRecords.length} item${pendingRecords.length !== 1 ? "s" : ""}`,    color: "#C9A84C" },
              { label: "Approved This Month",  value: fmtCurrency(totalApprovedMo), sub: `${approvedMonth.length} item${approvedMonth.length !== 1 ? "s" : ""}`,       color: "#2D8A57" },
              { label: "Total Rejected",       value: String(rejectedRecords.length), sub: "expenses rejected",                                                         color: "#C62828" },
              { label: "Total Spent",          value: fmtCurrency(totalSpent),      sub: byCategory[0] ? `Top: ${byCategory[0].label}` : "All time approved",          color: "#7A6A55" },
            ].map(c => (
              <div key={c.label} style={{ background: "#fff", border: "1px solid #EDE6D6", borderRadius: 14, padding: "18px 20px", borderTop: `3px solid ${c.color}` }}>
                <div style={{ fontSize: 11, color: "#9E8E6A", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{c.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#2C1E0F", fontFamily: "Playfair Display,serif" }}>{c.value}</div>
                <div style={{ fontSize: 11.5, color: "#9E8E6A", marginTop: 4 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ background: "#fff", border: "1px solid #EDE6D6", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
            {[
              { label: "Villa",     value: villaFilter,  setter: setVillaFilter,  opts: [["all", "All Villas"], ...villas.map(v => [v.id, v.name])] },
              { label: "Status",    value: statusFilter, setter: setStatusFilter, opts: [["all","All Statuses"],["pending","Pending"],["approved","Approved"],["rejected","Rejected"]] },
              { label: "Category",  value: catFilter,    setter: setCatFilter,    opts: [["all","All Categories"], ...Object.entries(CAT_LABELS).map(([k,v]) => [k,v])] },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: 10.5, color: "#9E8E6A", fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.7 }}>{f.label}</div>
                <select value={f.value} onChange={e => f.setter(e.target.value)}
                  style={{ padding: "7px 12px", border: "1.5px solid #E0D5C5", borderRadius: 8, fontSize: 13, color: "#3D2E1A", background: "#FAF7F2", cursor: "pointer" }}>
                  {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
            <div>
              <div style={{ fontSize: 10.5, color: "#9E8E6A", fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.7 }}>From</div>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                style={{ padding: "7px 10px", border: "1.5px solid #E0D5C5", borderRadius: 8, fontSize: 13, color: "#3D2E1A", background: "#FAF7F2" }} />
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: "#9E8E6A", fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.7 }}>To</div>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                style={{ padding: "7px 10px", border: "1.5px solid #E0D5C5", borderRadius: 8, fontSize: 13, color: "#3D2E1A", background: "#FAF7F2" }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 10.5, color: "#9E8E6A", fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.7 }}>Search</div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Description, manager, villa…"
                style={{ width: "100%", padding: "7px 12px", border: "1.5px solid #E0D5C5", borderRadius: 8, fontSize: 13, color: "#3D2E1A", background: "#FAF7F2" }} />
            </div>
            {(villaFilter !== "all" || statusFilter !== "all" || catFilter !== "all" || dateFrom || dateTo || search) && (
              <button onClick={() => { setVillaFilter("all"); setStatusFilter("all"); setCatFilter("all"); setDateFrom(""); setDateTo(""); setSearch(""); }}
                style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "#F5F0E8", color: "#7A6A55", cursor: "pointer", fontSize: 12.5, fontWeight: 600, alignSelf: "flex-end" }}>
                Clear
              </button>
            )}
          </div>

          {/* Error state */}
          {loadErr && (
            <div style={{ background: "#FFF0F0", border: "1.5px solid #FFCDD2", borderRadius: 12, padding: "16px 20px", marginBottom: 20, color: "#C62828", fontSize: 13.5 }}>
              <strong>Error loading data:</strong> {loadErr}
            </div>
          )}

          {/* Table */}
          <div style={{ background: "#fff", border: "1px solid #EDE6D6", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #EDE6D6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#2C1E0F" }}>
                {filtered.length} expense{filtered.length !== 1 ? "s" : ""}
              </span>
              <span style={{ fontSize: 12, color: "#9E8E6A" }}>
                Total shown: {fmtCurrency(filtered.reduce((s, r) => s + (r.amount ?? 0), 0))}
              </span>
            </div>

            {loading ? (
              <div style={{ padding: 48, textAlign: "center", color: "#A0906E" }}>Loading expenses…</div>
            ) : loadErr ? (
              <div style={{ padding: 48, textAlign: "center", color: "#A0906E" }}>Could not load data.</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "#A0906E" }}>
                {records.length === 0 ? "No petty cash expenses submitted yet." : "No expenses match your filters."}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #EDE6D6", background: "#FAF7F2" }}>
                      {["Date", "Villa", "Manager", "Category", "Description", "Amount", "Receipt", "Status", "Actions"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9E8E6A", textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => {
                      const sc = STATUS_CFG[r.status ?? "pending"] ?? STATUS_CFG.pending;
                      return (
                        <tr key={r.id} className="tbl-row" style={{ borderBottom: "1px solid #F5F0E8", background: "#fff", transition: "background .1s" }}>
                          <td style={{ padding: "12px 14px", fontSize: 13, color: "#3D2E1A", whiteSpace: "nowrap" }}>{fmtDate(r.expense_date)}</td>
                          <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#2C1E0F", whiteSpace: "nowrap" }}>{r.villas?.name ?? "—"}</td>
                          <td style={{ padding: "12px 14px", fontSize: 13, color: "#3D2E1A", whiteSpace: "nowrap" }}>{r.profiles?.full_name ?? "—"}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: "#F5F0E8", color: "#7A6A55" }}>
                              {CAT_LABELS[r.category ?? ""] ?? r.category ?? "—"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: 13, color: "#3D2E1A", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</td>
                          <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#2C1E0F", whiteSpace: "nowrap" }}>{fmtCurrency(r.amount, r.currency ?? "USD")}</td>
                          <td style={{ padding: "12px 14px" }}>
                            {r.receipt_url ? (
                              <button onClick={() => setReceiptUrl(r.receipt_url!)}
                                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, border: "1.5px solid #C9A84C", background: "#FFF8E6", color: "#C9A84C", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                                <Ic d={P.eye} size={12} /> View
                              </button>
                            ) : (
                              <span style={{ fontSize: 12, color: "#C4B89A" }}>No receipt</span>
                            )}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: sc.bg, color: sc.color }}>
                              {sc.label}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            {r.status === "pending" ? (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => updateStatus(r.id, "approved")} disabled={saving === r.id}
                                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7, border: "none", background: "#2D8A57", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                                  <Ic d={P.check} size={12} />{saving === r.id ? "…" : "Approve"}
                                </button>
                                <button onClick={() => setRejectId(r.id)} disabled={saving === r.id}
                                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7, border: "1.5px solid #EDE6D6", background: "#fff", color: "#C62828", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                                  <Ic d={P.x} size={12} />Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: "#C4B89A" }}>
                                {r.status === "approved" ? `Approved ${fmtDate(r.approved_at)}` : "Rejected"}
                              </span>
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
        </div>
      </div>
    </div>
  );
}

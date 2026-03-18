"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Profile { id: string; full_name: string | null; role: string; }
interface MaintRow { id: string; title: string | null; category: string | null; priority: string | null; status: string | null; description: string | null; estimated_cost: number | null; created_at: string | null; }

const CATEGORIES = ["Plumbing", "Electrical", "Appliance", "Pool & garden", "Structural", "Other"];
const PRIORITIES  = ["Low", "Medium", "High", "Urgent"];

function Ic({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}
function Skel({ w = "100%", h = 14 }: { w?: string | number; h?: number }) {
  return <div style={{ width: w, height: h, borderRadius: 6, background: "linear-gradient(90deg,#EDE6D6 25%,#F5EFE3 50%,#EDE6D6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />;
}
function ini(n: string | null) { if (!n) return "?"; return n.trim().split(" ").map(w => w[0] ?? "").slice(0, 2).join("").toUpperCase(); }
function fmtD(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }

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
  plus:   "M12 5v14 M5 12h14",
  x:      "M18 6L6 18 M6 6l12 12",
  img:    "M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  eye:    "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
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

function Sidebar({ name, initStr }: { name: string; initStr: string }) {
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
          return (
            <div key={item.label} onClick={() => item.href && (window.location.href = item.href)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, marginBottom: 2, cursor: item.href ? "pointer" : "default", background: active ? "rgba(201,168,76,.18)" : "transparent", color: active ? "#C9A84C" : item.href ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.3)", opacity: item.href ? 1 : 0.5, transition: "all .15s" }}>
              <Ic d={item.icon} size={15} /><span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initStr}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
          <div style={{ fontSize: 10, color: "rgba(201,168,76,.7)" }}>Villa Manager</div>
        </div>
        <div style={{ cursor: "pointer", color: "rgba(255,255,255,.4)" }} onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}><Ic d={P.logout} size={14} /></div>
      </div>
    </div>
  );
}

function PriBadge({ p }: { p: string | null }) {
  const m: Record<string, [string, string]> = {
    urgent: ["#FFF0F0", "#C53030"], high: ["#FFF5F0", "#C05621"],
    medium: ["#FFF8E6", "#7A5210"], low: ["#F5F0E8", "#7A6A50"],
  };
  const [bg, color] = m[(p ?? "").toLowerCase()] ?? ["#F0EBE0", "#7A6A4F"];
  return <span style={{ padding: "3px 9px", borderRadius: 20, background: bg, color, fontSize: 10.5, fontWeight: 700 }}>{(p ?? "—").toUpperCase()}</span>;
}
function StBadge({ s }: { s: string | null }) {
  const m: Record<string, [string, string]> = {
    open: ["#FFF8E6", "#7A5210"], in_progress: ["#EEF4FF", "#2B4BA0"], resolved: ["#EDFAF3", "#1E7A48"], closed: ["#F5F0E8", "#7A6A50"],
  };
  const [bg, color] = m[(s ?? "").toLowerCase()] ?? ["#F0EBE0", "#7A6A4F"];
  return <span style={{ padding: "3px 9px", borderRadius: 20, background: bg, color, fontSize: 10.5, fontWeight: 600 }}>{(s ?? "—").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>;
}

const inpStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #EDE6D6", background: "#FDFAF5", fontSize: 13, color: "#2C2C2C", outline: "none", fontFamily: "Inter,sans-serif" };
const selStyle: React.CSSProperties = { ...inpStyle, appearance: "none" };

export default function MaintenancePage() {
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [villaId, setVillaId]     = useState<string | null>(null);
  const [userId, setUserId]       = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [rows, setRows]           = useState<MaintRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<MaintRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg]   = useState("");
  const [photoName, setPhotoName] = useState<string[]>([]);

  const [form, setForm] = useState({ title: "", category: "", priority: "Medium", description: "", estimated_cost: "", photo_urls: [] as string[] });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      try {
        const { data: profData } = await supabase.from("profiles").select("id,full_name,role").eq("id", user.id).single();
        const prof: Profile | null = profData ?? null;
        if (!prof) { window.location.href = "/"; return; }
        if (prof.role === "super_admin") { window.location.href = "/dashboard/admin"; return; }
        if (prof.role === "villa_owner") { window.location.href = "/dashboard/owner"; return; }
        if (prof.role !== "villa_manager") { window.location.href = "/"; return; }
        setProfile(prof); setUserId(user.id); setAuthReady(true);
      } catch { window.location.href = "/"; }
    });
  }, []);

  const fetchVilla = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: vm } = await supabase.from("villa_managers").select("villa_id").eq("manager_id", user.id).single();
    if (vm?.villa_id) setVillaId(vm.villa_id);
  }, []);

  useEffect(() => { if (authReady) fetchVilla(); }, [authReady, fetchVilla]);

  const fetchRows = useCallback(async () => {
    if (!villaId) return;
    setLoading(true);
    try {
      const { data } = await supabase.from("maintenance_issues").select("id,title,category,priority,status,description,estimated_cost,created_at").eq("villa_id", villaId).order("created_at", { ascending: false }).limit(50);
      setRows((data ?? []) as MaintRow[]);
    } catch {} finally { setLoading(false); }
  }, [villaId]);

  useEffect(() => { if (villaId) fetchRows(); }, [villaId, fetchRows]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setPhotoName(files.map(f => f.name));
    const urls: string[] = [];
    for (const file of files) {
      try {
        const ext = file.name.split(".").pop();
        const path = `maintenance/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("maintenance-photos").upload(path, file);
        if (!error) {
          const { data: urlData } = supabase.storage.from("maintenance-photos").getPublicUrl(path);
          if (urlData?.publicUrl) urls.push(urlData.publicUrl);
        }
      } catch {}
    }
    setForm(f => ({ ...f, photo_urls: urls }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.category || !villaId || !userId) { setErrorMsg("Please fill in Title and Category."); return; }
    setSubmitting(true); setErrorMsg("");
    try {
      const { error } = await supabase.from("maintenance_issues").insert({
        villa_id: villaId,
        reported_by: userId,
        title: form.title,
        category: form.category,
        priority: form.priority.toLowerCase(),
        description: form.description || null,
        estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : null,
        photo_urls: form.photo_urls.length > 0 ? form.photo_urls : null,
        status: "open",
      });
      if (error) throw error;
      setShowModal(false);
      setForm({ title: "", category: "", priority: "Medium", description: "", estimated_cost: "", photo_urls: [] });
      setPhotoName([]);
      setSuccessMsg("Issue reported successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
      fetchRows();
    } catch { setErrorMsg("Failed to submit. Please try again."); } finally { setSubmitting(false); }
  };

  const mgr = profile?.full_name ?? "Manager";
  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{background:#F5F0E8;font-family:Inter,sans-serif}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes spin{to{transform:rotate(360deg)}}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#DDD5C0;border-radius:10px}input:focus,select:focus,textarea:focus{border-color:#C9A84C!important;box-shadow:0 0 0 3px rgba(201,168,76,.12)}.mgr-sidebar{width:220px;background:#2C1E0F;display:flex;flex-direction:column;min-height:100vh;position:fixed;top:0;left:0;z-index:100}.mgr-content{margin-left:220px;flex:1}@media(max-width:900px){.mgr-sidebar{width:180px}.mgr-content{margin-left:180px}}@media(max-width:640px){.mgr-sidebar{display:none}.mgr-content{margin-left:0}}`}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar name={mgr} initStr={ini(mgr)} />
        <div className="mgr-content">
          <div style={{ background: "#fff", borderBottom: "1px solid #EDE6D6", padding: "0 28px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
            <div style={{ fontFamily: "Playfair Display,Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C2C2C" }}>Staya <span style={{ color: "#C9A84C" }}>Management</span></div>
            <div style={{ fontSize: 12.5, color: "#9E8E6A", fontStyle: "italic" }}>{todayStr}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{ini(mgr)}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C" }}>{mgr}</span>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1.5px solid #EDE6D6", background: "transparent", color: "#7A6A50", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                <Ic d={P.logout} size={13} /> Logout
              </button>
            </div>
          </div>

          <main style={{ padding: "28px 28px 48px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 26, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 24, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C", fontWeight: 700 }}>Maintenance</h1>
                <p style={{ fontSize: 13, color: "#9E8E6A", marginTop: 4 }}>Report and track maintenance issues</p>
              </div>
              <button onClick={() => { setShowModal(true); setErrorMsg(""); }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 10, border: "none", background: "#C9A84C", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(201,168,76,.35)" }}>
                <Ic d={P.plus} size={15} /> Report New Issue
              </button>
            </div>

            {successMsg && (
              <div style={{ marginBottom: 18, padding: "12px 18px", borderRadius: 10, background: "#EDFAF3", border: "1px solid #B0E8CB", color: "#1E7A48", fontSize: 13, fontWeight: 600 }}>✓ {successMsg}</div>
            )}

            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", boxShadow: "0 2px 10px rgba(44,44,44,.05)", overflow: "hidden" }}>
              <div style={{ padding: "16px 22px 12px", borderBottom: "1px solid #EDE6D6" }}>
                <h2 style={{ fontSize: 14.5, fontWeight: 700, fontFamily: "Playfair Display,Georgia,serif", color: "#2C2C2C" }}>Active Issues</h2>
                <p style={{ fontSize: 11, color: "#9E8E6A", marginTop: 1 }}>Issues can only be closed by admin</p>
              </div>
              {loading ? (
                <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 10 }}>{[...Array(4)].map((_, i) => <Skel key={i} />)}</div>
              ) : rows.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center" }}>
                  <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#C4B89A" }}><Ic d={P.wrench} size={22} /></div>
                  <p style={{ color: "#C4B89A", fontSize: 13 }}>No issues reported yet.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>{["Title", "Category", "Priority", "Status", "Reported", "Actions"].map(h => (
                      <th key={h} style={{ padding: "9px 18px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "#9E8E6A", letterSpacing: ".07em", textTransform: "uppercase", borderBottom: "1px solid #EDE6D6", background: "#FDFAF5", whiteSpace: "nowrap" }}>{h}</th>
                    ))}</tr></thead>
                    <tbody>{rows.map((r, i) => (
                      <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#FDFAF5" }}>
                        <td style={{ padding: "11px 18px", fontSize: 12.5, fontWeight: 600, color: "#2C2C2C", maxWidth: 200 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title ?? "—"}</div>
                        </td>
                        <td style={{ padding: "11px 18px", fontSize: 12.5, color: "#7A6A50" }}>{r.category ?? "—"}</td>
                        <td style={{ padding: "11px 18px" }}><PriBadge p={r.priority} /></td>
                        <td style={{ padding: "11px 18px" }}><StBadge s={r.status} /></td>
                        <td style={{ padding: "11px 18px", fontSize: 12.5, color: "#9E8E6A", whiteSpace: "nowrap" }}>{fmtD(r.created_at)}</td>
                        <td style={{ padding: "11px 18px" }}>
                          <button onClick={() => setShowDetail(r)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, border: "1.5px solid #EDE6D6", background: "transparent", color: "#7A6A50", fontSize: 11, fontWeight: 500, cursor: "pointer" }}><Ic d={P.eye} size={11} /> View</button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* new issue modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(44,30,10,.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,30,10,.25)" }}>
            <div style={{ padding: "22px 26px 16px", borderBottom: "1px solid #EDE6D6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontSize: 17, fontFamily: "Playfair Display,Georgia,serif", fontWeight: 700, color: "#2C2C2C" }}>Report New Issue</h2>
                <p style={{ fontSize: 11.5, color: "#9E8E6A", marginTop: 2 }}>Issue will be submitted with status: Open</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: 30, height: 30, borderRadius: "50%", border: "1.5px solid #EDE6D6", background: "#F5F0E8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7A6A50" }}><Ic d={P.x} size={14} /></button>
            </div>
            <div style={{ padding: "20px 26px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
              {errorMsg && <div style={{ padding: "10px 14px", borderRadius: 9, background: "#FFF0F0", border: "1px solid #FFCDD2", color: "#9B2C2C", fontSize: 12.5 }}>{errorMsg}</div>}

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", display: "block", marginBottom: 6, letterSpacing: ".04em", textTransform: "uppercase" }}>Title *</label>
                <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Leaking tap in bathroom 2" style={inpStyle} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", display: "block", marginBottom: 6, letterSpacing: ".04em", textTransform: "uppercase" }}>Category *</label>
                  <select value={form.category} onChange={e => set("category", e.target.value)} style={selStyle}>
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", display: "block", marginBottom: 6, letterSpacing: ".04em", textTransform: "uppercase" }}>Priority</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {PRIORITIES.map(p => (
                      <button key={p} onClick={() => set("priority", p)} style={{ padding: "5px 12px", borderRadius: 20, border: "1.5px solid", borderColor: form.priority === p ? "#C9A84C" : "#EDE6D6", background: form.priority === p ? "#FFF8E6" : "transparent", color: form.priority === p ? "#7A5210" : "#9E8E6A", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", display: "block", marginBottom: 6, letterSpacing: ".04em", textTransform: "uppercase" }}>Description</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Describe the issue in detail…" style={{ ...inpStyle, resize: "vertical" }} />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", display: "block", marginBottom: 6, letterSpacing: ".04em", textTransform: "uppercase" }}>Estimated Cost (optional)</label>
                <input type="number" min={0} step="0.01" value={form.estimated_cost} onChange={e => set("estimated_cost", e.target.value)} placeholder="0.00" style={inpStyle} />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#7A6A50", display: "block", marginBottom: 6, letterSpacing: ".04em", textTransform: "uppercase" }}>Photos (optional, multiple)</label>
                <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 9, border: "1.5px dashed #DDD5C0", background: "#FDFAF5", cursor: "pointer" }}>
                  <Ic d={P.img} size={16} />
                  <span style={{ fontSize: 12.5, color: photoName.length > 0 ? "#2C2C2C" : "#9E8E6A" }}>
                    {photoName.length > 0 ? `${photoName.length} photo${photoName.length > 1 ? "s" : ""} selected` : "Click to upload photos…"}
                  </span>
                  <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoChange} />
                </label>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #EDE6D6", background: "transparent", color: "#7A6A50", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleSubmit} disabled={submitting} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: submitting ? "#E8C97A" : "#C9A84C", color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "default" : "pointer", boxShadow: "0 4px 14px rgba(201,168,76,.3)" }}>
                  {submitting ? "Submitting…" : "Report Issue"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* detail modal */}
      {showDetail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(44,30,10,.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => { if (e.target === e.currentTarget) setShowDetail(null); }}>
          <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,30,10,.25)" }}>
            <div style={{ padding: "22px 26px 16px", borderBottom: "1px solid #EDE6D6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 17, fontFamily: "Playfair Display,Georgia,serif", fontWeight: 700, color: "#2C2C2C" }}>Issue Details</h2>
              <button onClick={() => setShowDetail(null)} style={{ width: 30, height: 30, borderRadius: "50%", border: "1.5px solid #EDE6D6", background: "#F5F0E8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7A6A50" }}><Ic d={P.x} size={14} /></button>
            </div>
            <div style={{ padding: "20px 26px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <p style={{ fontSize: 11, color: "#9E8E6A", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Title</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#2C2C2C", fontFamily: "Playfair Display,Georgia,serif" }}>{showDetail.title}</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { l: "Category", v: showDetail.category ?? "—" },
                  { l: "Reported", v: fmtD(showDetail.created_at) },
                ].map(({ l, v }) => (
                  <div key={l}>
                    <p style={{ fontSize: 11, color: "#9E8E6A", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>{l}</p>
                    <p style={{ fontSize: 13, color: "#2C2C2C" }}>{v}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div><p style={{ fontSize: 11, color: "#9E8E6A", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Priority</p><PriBadge p={showDetail.priority} /></div>
                <div><p style={{ fontSize: 11, color: "#9E8E6A", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Status</p><StBadge s={showDetail.status} /></div>
              </div>
              {showDetail.description && (
                <div>
                  <p style={{ fontSize: 11, color: "#9E8E6A", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Description</p>
                  <p style={{ fontSize: 13, color: "#2C2C2C", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{showDetail.description}</p>
                </div>
              )}
              {showDetail.estimated_cost != null && (
                <div>
                  <p style={{ fontSize: 11, color: "#9E8E6A", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Estimated Cost</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C" }}>{showDetail.estimated_cost.toLocaleString()}</p>
                </div>
              )}
              <div style={{ padding: "10px 14px", borderRadius: 9, background: "#FFF8E6", border: "1px solid #F5D875", color: "#7A5210", fontSize: 12 }}>
                ℹ️ Only admin can close or resolve maintenance issues.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

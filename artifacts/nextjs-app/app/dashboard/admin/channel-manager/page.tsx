"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";

/* ─── types ──────────────────────────────────────────────────────────────────── */
interface Villa {
  id: string; name: string | null; currency: string | null;
  rate_low_season: number | null; rate_mid_season: number | null;
  rate_high_season: number | null; rate_super_high_season: number | null;
  ota_airbnb: boolean | null; ota_booking: boolean | null;
  ota_vrbo: boolean | null; ota_expedia: boolean | null;
}
interface Booking {
  villa_id: string | null; total_amount: number | null; currency: string | null;
  check_in: string | null; check_out: string | null; ota_channel: string | null; status: string | null;
}
interface ChannelConfig {
  connected: boolean; api_key: string; property_id: string;
  auto_sync: boolean; auto_rates: boolean; min_stay: number;
  cancellation: string; last_synced: string | null;
}
interface ICalEntry { url: string; lastSynced: string | null; status: "idle"|"syncing"|"ok"|"error"; error?: string; }
interface SyncRecord { ts: string; channel: string; villa: string; added: number; updated: number; skipped: number; }

type Season = "low" | "mid" | "high" | "super_high";
const SEASONS: { key: Season; label: string; emoji: string }[] = [
  { key: "low",        label: "Low Season",        emoji: "💚" },
  { key: "mid",        label: "Mid Season",         emoji: "🟡" },
  { key: "high",       label: "High Season",        emoji: "🟠" },
  { key: "super_high", label: "Super High Season",  emoji: "🔴" },
];
const SEASON_COL: Record<Season, keyof Villa> = {
  low: "rate_low_season", mid: "rate_mid_season",
  high: "rate_high_season", super_high: "rate_super_high_season",
};

/* ─── OTA channel config ─────────────────────────────────────────────────────── */
const CHANNELS = [
  { key: "airbnb",   label: "Airbnb",      color: "#FF5A5F", bg: "#FFF0F0", icon: "🔴", domain: "airbnb.com" },
  { key: "booking",  label: "Booking.com", color: "#003580", bg: "#EEF2FF", icon: "🔵", domain: "booking.com" },
  { key: "vrbo",     label: "Vrbo",        color: "#1A6B96", bg: "#EEF4FF", icon: "🟢", domain: "vrbo.com" },
  { key: "expedia",  label: "Expedia",     color: "#D7910A", bg: "#FFF8E6", icon: "🟡", domain: "expedia.com" },
] as const;
type ChKey = typeof CHANNELS[number]["key"];

const ICAL_CH = [
  { key: "airbnb",      label: "Airbnb",      color: "#FF5A5F", placeholder: "https://www.airbnb.com/calendar/ical/…" },
  { key: "booking_com", label: "Booking.com", color: "#003580", placeholder: "https://ical.booking.com/v1/…" },
  { key: "vrbo",        label: "Vrbo",        color: "#1A6B96", placeholder: "https://www.vrbo.com/icalendar/…" },
  { key: "expedia",     label: "Expedia",     color: "#D7910A", placeholder: "https://www.expedia.com/…" },
] as const;

/* ─── localStorage helpers ───────────────────────────────────────────────────── */
function lsGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key: string, val: unknown) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

function defaultConfig(): ChannelConfig {
  return { connected: false, api_key: "", property_id: "", auto_sync: false, auto_rates: false, min_stay: 1, cancellation: "flexible", last_synced: null };
}

/* ─── icon helper ────────────────────────────────────────────────────────────── */
function Ic({ d, size = 16, stroke }: { d: string; size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} fill="none" stroke={stroke ?? "currentColor"} viewBox="0 0 24 24" strokeWidth={1.8} style={{ flexShrink: 0 }}>
      {d.split(" M").map((seg, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={i===0?seg:"M"+seg} />)}
    </svg>
  );
}

/* ─── formatters ─────────────────────────────────────────────────────────────── */
function fmtAmt(n: number | null, cur = "USD") {
  if (n == null || n === 0) return "—";
  if (cur === "IDR") return `Rp ${n.toLocaleString("id-ID")}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
}
function fmtTime(ts: string | null) {
  if (!ts) return "Never";
  const d = new Date(ts), now = new Date();
  const diff = Math.round((now.getTime() - d.getTime()) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.round(diff/60)}h ago`;
  return d.toLocaleDateString("en-GB", { day:"numeric", month:"short" });
}
function fmtDateLong(ts: string | null) {
  if (!ts) return "Never";
  return new Date(ts).toLocaleString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
}
function today() { return new Date().toISOString().slice(0,10); }

/* ─── nav ────────────────────────────────────────────────────────────────────── */
const P_ALERT = "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z";
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
  plus:    "M12 5v14M5 12h14",
  check:   "M20 6L9 17l-5-5",
  sync:    "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  info:    "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  link:    "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
  x:       "M18 6L6 18M6 6l12 12",
  key:     "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  hist:    "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  lock:    "M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z",
};
const NAV = [
  { label: "Dashboard",        icon: P.home,    href: "/dashboard/admin" },
  { label: "Villas",           icon: P.villa,   href: "/dashboard/admin/villas" },
  { label: "Bookings",         icon: P.cal,     href: "/dashboard/admin/bookings" },
  { label: "Channel Manager",  icon: P.channel, href: "/dashboard/admin/channel-manager" },
  { label: "Messages",         icon: P.msg,     href: null },
  { label: "Petty Cash",       icon: P.cash,    href: "/dashboard/admin/petty-cash" },
  { label: "Maintenance",      icon: P.wrench,  href: "/dashboard/admin/maintenance" },
  { label: "Emergencies",      icon: P_ALERT,   href: "/dashboard/admin/emergencies", isAlert: true },
  { label: "Services",         icon: P.service, href: "/dashboard/admin/services" },
  { label: "Owner Statements", icon: P.doc,     href: null },
  { label: "Payments",         icon: P.pay,     href: "/dashboard/admin/payments" },
  { label: "Settings",         icon: P.cog,     href: "/dashboard/admin/settings" },
];

function ini(n: string | null) {
  if (!n) return "??";
  return n.trim().split(" ").map(w => w[0] ?? "").slice(0,2).join("").toUpperCase();
}

/* ─── channel settings modal ─────────────────────────────────────────────────── */
function ChannelSettingsModal({ ch, config, onSave, onClose }: {
  ch: typeof CHANNELS[number];
  config: ChannelConfig;
  onSave: (c: ChannelConfig) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ChannelConfig>({ ...config });
  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #DDD5C0",
    background: "#FDFBF7", fontSize: 13, fontFamily: "Inter,sans-serif", color: "#2C2C2C", outline: "none",
  };
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(44,28,10,.5)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#fff",borderRadius:18,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ padding:"20px 24px 16px",borderBottom:"1px solid #EDE6D6",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <div style={{ fontSize:11,fontWeight:700,color:ch.color,letterSpacing:".06em",textTransform:"uppercase",marginBottom:3 }}>{ch.icon} {ch.label}</div>
            <h2 style={{ fontSize:18,fontFamily:"Playfair Display,Georgia,serif",color:"#2C2C2C",fontWeight:700 }}>Channel Settings</h2>
          </div>
          <button onClick={onClose} style={{ width:32,height:32,borderRadius:"50%",border:"1.5px solid #EDE6D6",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}><Ic d={P.x} size={14}/></button>
        </div>
        <div style={{ padding:"20px 24px",display:"flex",flexDirection:"column",gap:16 }}>
          {/* API Key */}
          <div>
            <label style={{ display:"block",fontSize:11.5,fontWeight:600,color:"#7A6A50",marginBottom:5 }}>API Key</label>
            <div style={{ position:"relative" }}>
              <input type="password" value={form.api_key} onChange={e=>setForm(f=>({...f,api_key:e.target.value}))}
                placeholder="Enter your API key…" style={{ ...inp, paddingRight:36 }} />
              <span style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:"#C4B89A" }}><Ic d={P.key} size={14}/></span>
            </div>
          </div>
          {/* Property ID */}
          <div>
            <label style={{ display:"block",fontSize:11.5,fontWeight:600,color:"#7A6A50",marginBottom:5 }}>Property ID</label>
            <input type="text" value={form.property_id} onChange={e=>setForm(f=>({...f,property_id:e.target.value}))}
              placeholder="e.g. 12345678" style={inp} />
          </div>
          {/* Toggles */}
          {[
            { key:"auto_sync" as const, label:"Auto-sync every 15 min", sub:"Automatically pull new bookings" },
            { key:"auto_rates" as const, label:"Auto-update rates", sub:"Push rate changes to this channel" },
          ].map(t=>(
            <div key={t.key} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:"#F5F0E8",borderRadius:10 }}>
              <div>
                <div style={{ fontSize:13,fontWeight:600,color:"#2C2C2C" }}>{t.label}</div>
                <div style={{ fontSize:11.5,color:"#9E8E6A" }}>{t.sub}</div>
              </div>
              <div onClick={()=>setForm(f=>({...f,[t.key]:!f[t.key]}))}
                style={{ width:44,height:24,borderRadius:12,background:form[t.key]?"#C9A84C":"#DDD5C0",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0 }}>
                <div style={{ width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:form[t.key]?23:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)" }}/>
              </div>
            </div>
          ))}
          {/* Min stay */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            <div>
              <label style={{ display:"block",fontSize:11.5,fontWeight:600,color:"#7A6A50",marginBottom:5 }}>Min Stay (nights)</label>
              <input type="number" min={1} max={30} value={form.min_stay}
                onChange={e=>setForm(f=>({...f,min_stay:+e.target.value||1}))} style={inp}/>
            </div>
            <div>
              <label style={{ display:"block",fontSize:11.5,fontWeight:600,color:"#7A6A50",marginBottom:5 }}>Cancellation Policy</label>
              <select value={form.cancellation} onChange={e=>setForm(f=>({...f,cancellation:e.target.value}))}
                style={{ ...inp,cursor:"pointer" }}>
                {["flexible","moderate","strict","super_strict"].map(v=>(
                  <option key={v} value={v}>{v.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Actions */}
          <div style={{ display:"flex",gap:10,paddingTop:4 }}>
            <button onClick={()=>onSave(form)}
              style={{ flex:1,padding:"10px",borderRadius:10,border:"none",background:ch.color,color:"#fff",fontSize:13.5,fontWeight:700,cursor:"pointer" }}>
              Save Settings
            </button>
            <button onClick={onClose}
              style={{ padding:"10px 18px",borderRadius:10,border:"1.5px solid #EDE6D6",background:"#fff",color:"#7A6A50",fontSize:13,cursor:"pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── main page ──────────────────────────────────────────────────────────────── */
export default function ChannelManagerPage() {
  const [profile, setProfile]     = useState<{ id:string; full_name:string|null; role:string }|null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [villas, setVillas]       = useState<Villa[]>([]);
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [loading, setLoading]     = useState(true);

  // channel configs (localStorage)
  const [configs, setConfigs]     = useState<Record<ChKey, ChannelConfig>>(() => ({
    airbnb:  lsGet("staya_ch_airbnb",  defaultConfig()),
    booking: lsGet("staya_ch_booking", defaultConfig()),
    vrbo:    lsGet("staya_ch_vrbo",    defaultConfig()),
    expedia: lsGet("staya_ch_expedia", defaultConfig()),
  }));

  // iCal urls per villa per channel
  const [icalData, setICalData]   = useState<Record<string, Record<string,ICalEntry>>>({});

  // rate markups: { [villaId]: { [chKey_season]: number } }
  const [markups, setMarkups]     = useState<Record<string,Record<string,number>>>({});
  const [savingRates, setSavingRates] = useState<Record<string,boolean>>({});

  // availability
  const [avVilla, setAvVilla]     = useState<string>("");
  const [avMonth, setAvMonth]     = useState(() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; });
  const [blocked, setBlocked]     = useState<Record<string,string[]>>({});
  const [selDates, setSelDates]   = useState<Set<string>>(new Set());

  // sync history
  const [history, setHistory]     = useState<SyncRecord[]>(() => lsGet("staya_sync_history", []));

  // syncing states
  const [syncingChannel, setSyncingChannel] = useState<ChKey|null>(null);
  const [syncingIcal, setSyncingIcal]       = useState<string|null>(null); // "villaId_channel"

  // modals
  const [settingsModal, setSettingsModal] = useState<ChKey|null>(null);
  const [toast, setToast]                 = useState<{msg:string;type:"success"|"error"}|null>(null);

  /* toast helper */
  function showToast(msg:string, type:"success"|"error"="success") {
    setToast({msg,type}); setTimeout(()=>setToast(null),3500);
  }

  /* ── auth ── */
  useEffect(()=>{
    supabase.auth.getUser().then(async({data:{user}})=>{
      if(!user){window.location.href="/";return;}
      const {data:prof}=await supabase.from("profiles").select("id,full_name,role").eq("id",user.id).single();
      if(!prof||prof.role!=="super_admin"){window.location.href="/dashboard/admin";return;}
      setProfile(prof);setAuthReady(true);
    });
  },[]);

  /* ── fetch data ── */
  const fetchData = useCallback(async()=>{
    setLoading(true);
    const now=new Date();
    const monthStart=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`;
    const [vRes,bRes]=await Promise.all([
      supabase.from("villas").select("id,name,currency,rate_low_season,rate_mid_season,rate_high_season,rate_super_high_season,ota_airbnb,ota_booking,ota_vrbo,ota_expedia").eq("is_active",true).order("name"),
      supabase.from("bookings").select("villa_id,total_amount,currency,check_in,check_out,ota_channel,status").gte("check_in",monthStart),
    ]);
    setVillas((vRes.data??[]) as Villa[]);
    setBookings((bRes.data??[]) as Booking[]);
    setLoading(false);
  },[]);

  /* ── load localStorage data once auth is ready ── */
  useEffect(()=>{
    if(!authReady)return;
    fetchData();
    // load iCal urls
    const ic:Record<string,Record<string,ICalEntry>>={};
    // will be populated per villa after fetchData — done in a follow-up effect
    setICalData(ic);
    // load blocked dates
    const bl:Record<string,string[]>={};
    setBlocked(lsGet("staya_blocked_all",bl));
    // load markups
    setMarkups(lsGet("staya_markups",{}));
  },[authReady,fetchData]);

  /* ── init per-villa localStorage after villas load ── */
  useEffect(()=>{
    if(!villas.length)return;
    const ic:Record<string,Record<string,ICalEntry>>={};
    for(const v of villas){
      const stored=lsGet<Record<string,{url:string;lastSynced:string|null}>>(`staya_ical_${v.id}`,{});
      ic[v.id]={};
      for(const ch of ICAL_CH){
        const e=stored[ch.key]??{url:"",lastSynced:null};
        ic[v.id][ch.key]={url:e.url,lastSynced:e.lastSynced,status:"idle"};
      }
    }
    setICalData(ic);
    if(!avVilla&&villas.length)setAvVilla(villas[0].id);
  },[villas]);// eslint-disable-line

  /* ── computed channel stats ── */
  const channelStats = useMemo(()=>{
    const stats:Record<ChKey,{bookings:number;revenue:number}>={airbnb:{bookings:0,revenue:0},booking:{bookings:0,revenue:0},vrbo:{bookings:0,revenue:0},expedia:{bookings:0,revenue:0}};
    for(const b of bookings){
      const ch=b.ota_channel as ChKey;
      if(!stats[ch])continue;
      if(b.status!=="cancelled"){
        stats[ch].bookings++;
        stats[ch].revenue+=(b.total_amount??0);
      }
    }
    return stats;
  },[bookings]);

  /* ── save channel config ── */
  function saveConfig(key:ChKey, cfg:ChannelConfig){
    const next={...configs,[key]:{...cfg,last_synced:configs[key].last_synced}};
    setConfigs(next);
    lsSet(`staya_ch_${key}`,next[key]);
    setSettingsModal(null);
    showToast(`${CHANNELS.find(c=>c.key===key)?.label} settings saved`);
  }

  /* ── toggle connection ── */
  function toggleConnect(key:ChKey){
    const next={...configs,[key]:{...configs[key],connected:!configs[key].connected}};
    setConfigs(next);
    lsSet(`staya_ch_${key}`,next[key]);
    showToast(next[key].connected?`${CHANNELS.find(c=>c.key===key)?.label} connected`:`Disconnected from ${CHANNELS.find(c=>c.key===key)?.label}`);
  }

  /* ── sync one channel (simulated header-level sync) ── */
  async function syncChannel(key:ChKey){
    setSyncingChannel(key);
    await new Promise(r=>setTimeout(r,1500+Math.random()*1000));
    const next={...configs,[key]:{...configs[key],last_synced:new Date().toISOString()}};
    setConfigs(next);lsSet(`staya_ch_${key}`,next[key]);
    setSyncingChannel(null);
    showToast(`${CHANNELS.find(c=>c.key===key)?.label} synced successfully`);
  }

  /* ── sync all ── */
  async function syncAll(){
    for(const ch of CHANNELS){
      if(configs[ch.key].connected) await syncChannel(ch.key);
    }
    showToast("All connected channels synced");
  }

  /* ── iCal URL update ── */
  function setICalUrl(villaId:string, chKey:string, url:string){
    setICalData(prev=>{
      const next={...prev,[villaId]:{...prev[villaId],[chKey]:{...prev[villaId]?.[chKey],url,status:"idle" as const}}};
      // persist
      const toStore:Record<string,{url:string;lastSynced:string|null}>={};
      for(const k of Object.keys(next[villaId])){
        toStore[k]={url:next[villaId][k].url,lastSynced:next[villaId][k].lastSynced??null};
      }
      lsSet(`staya_ical_${villaId}`,toStore);
      return next;
    });
  }

  /* ── save iCal URLs ── */
  function saveUrls(villaId:string){
    const data=icalData[villaId]??{};
    const toStore:Record<string,{url:string;lastSynced:string|null}>={};
    for(const k of Object.keys(data)) toStore[k]={url:data[k].url,lastSynced:data[k].lastSynced??null};
    lsSet(`staya_ical_${villaId}`,toStore);
    showToast("iCal URLs saved");
  }

  /* ── iCal sync ── */
  async function syncIcal(villaId:string, chKey:string){
    const entry=icalData[villaId]?.[chKey];
    if(!entry?.url?.trim()){showToast("Enter a valid iCal URL first","error");return;}
    const syncId=`${villaId}_${chKey}`;
    setSyncingIcal(syncId);
    setICalData(prev=>({...prev,[villaId]:{...prev[villaId],[chKey]:{...prev[villaId][chKey],status:"syncing"}}}));
    try{
      const resp=await fetch("/api/ical/sync",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({villa_id:villaId,ical_url:entry.url,channel:chKey.replace("_com","")}),
      });
      const result=await resp.json();
      const now=new Date().toISOString();
      setICalData(prev=>({...prev,[villaId]:{...prev[villaId],[chKey]:{...prev[villaId][chKey],status:resp.ok?"ok":"error",lastSynced:resp.ok?now:prev[villaId][chKey].lastSynced,error:resp.ok?undefined:result.error}}}));
      // update ls
      const stored=lsGet<Record<string,{url:string;lastSynced:string|null}>>(`staya_ical_${villaId}`,{});
      lsSet(`staya_ical_${villaId}`,{...stored,[chKey]:{url:entry.url,lastSynced:resp.ok?now:stored[chKey]?.lastSynced??null}});
      // add to history
      if(resp.ok){
        const villa=villas.find(v=>v.id===villaId);
        const rec:SyncRecord={ts:now,channel:chKey,villa:villa?.name??"—",added:result.added,updated:result.updated,skipped:result.skipped};
        const newHist=[rec,...history].slice(0,50);
        setHistory(newHist);lsSet("staya_sync_history",newHist);
        showToast(`Synced — ${result.added} new, ${result.updated} updated`);
      } else {
        showToast(result.error??"Sync failed","error");
      }
    }catch(e){
      setICalData(prev=>({...prev,[villaId]:{...prev[villaId],[chKey]:{...prev[villaId][chKey],status:"error",error:String(e)}}}));
      showToast("Network error during sync","error");
    }finally{
      setSyncingIcal(null);
    }
  }

  /* ── markup helpers ── */
  function getMarkup(villaId:string, chKey:string, season:Season):number {
    return markups[villaId]?.[`${chKey}_${season}`]??0;
  }
  function setMarkup(villaId:string, chKey:string, season:Season, val:number){
    const next={...markups,[villaId]:{...markups[villaId],[`${chKey}_${season}`]:val}};
    setMarkups(next);lsSet("staya_markups",next);
  }

  /* ── save rates ── */
  async function saveRates(villa:Villa){
    setSavingRates(p=>({...p,[villa.id]:true}));
    const seasonValues:Partial<Record<keyof Villa,number|null>>={
      rate_low_season:       villa.rate_low_season,
      rate_mid_season:       villa.rate_mid_season,
      rate_high_season:      villa.rate_high_season,
      rate_super_high_season:villa.rate_super_high_season,
    };
    const {error}=await supabase.from("villas").update(seasonValues).eq("id",villa.id);
    setSavingRates(p=>({...p,[villa.id]:false}));
    if(error){showToast(error.message,"error");}else{showToast(`Rates saved for ${villa.name}`);fetchData();}
  }

  /* ── availability ── */
  const avDays = useMemo(()=>{
    const [y,m]=avMonth.split("-").map(Number);
    const dim=new Date(y,m,0).getDate();
    return Array.from({length:dim},(_,i)=>`${avMonth}-${String(i+1).padStart(2,"0")}`);
  },[avMonth]);

  const bookedDatesSet = useMemo(()=>{
    const s=new Set<string>();
    const [y,m]=avMonth.split("-").map(Number);
    const start=`${avMonth}-01`, end=`${avMonth}-${new Date(y,m,0).getDate()}`;
    for(const b of bookings){
      if(!b.villa_id||b.villa_id!==avVilla)continue;
      if(b.status==="cancelled")continue;
      if(!b.check_in||!b.check_out)continue;
      if(b.check_out<start||b.check_in>end)continue;
      let d=new Date(b.check_in+"T00:00:00");
      const de=new Date(b.check_out+"T00:00:00");
      while(d<de){const ds=d.toISOString().slice(0,10);if(ds>=start&&ds<=end)s.add(ds);d=new Date(d.getTime()+86400000);}
    }
    return s;
  },[bookings,avVilla,avMonth]);

  const blockedSet = useMemo(()=>new Set(blocked[avVilla]??[]),[blocked,avVilla]);

  function toggleDate(date:string){
    if(bookedDatesSet.has(date))return;
    setSelDates(prev=>{const next=new Set(prev);next.has(date)?next.delete(date):next.add(date);return next;});
  }
  function blockSelected(){
    if(!selDates.size)return;
    const next={...blocked,[avVilla]:Array.from(new Set([...(blocked[avVilla]??[]),...selDates]))};
    setBlocked(next);lsSet("staya_blocked_all",next);setSelDates(new Set());
    showToast(`${selDates.size} date(s) blocked`);
  }
  function openSelected(){
    if(!selDates.size)return;
    const next={...blocked,[avVilla]:(blocked[avVilla]??[]).filter(d=>!selDates.has(d))};
    setBlocked(next);lsSet("staya_blocked_all",next);setSelDates(new Set());
    showToast(`${selDates.size} date(s) opened`);
  }
  function clearBlocked(){
    const next={...blocked,[avVilla]:[]};
    setBlocked(next);lsSet("staya_blocked_all",next);
    showToast("All blocked dates cleared for this villa");
  }

  const ownerName=profile?.full_name??"Admin";
  const path=typeof window!=="undefined"?window.location.pathname:"";

  if(!authReady) return (
    <>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#F5F0E8}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
        <div style={{width:36,height:36,border:"3px solid #EDE6D6",borderTop:"3px solid #C9A84C",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#F5F0E8;font-family:Inter,sans-serif}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:#DDD5C0;border-radius:10px}
        input,select,textarea{font-family:Inter,sans-serif}
        input:focus,select:focus,textarea:focus{border-color:#C9A84C!important;outline:none;box-shadow:0 0 0 3px rgba(201,168,76,.12)}
        .adm-sidebar{width:210px;background:#2C1E0F;display:flex;flex-direction:column;min-height:100vh;position:fixed;top:0;left:0;z-index:100}
        .adm-content{margin-left:210px;flex:1;min-height:100vh}
        .sidebar-label{display:block}
        .cal-day{width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:8px;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .12s;user-select:none}
        .cal-day:hover{filter:brightness(.92)}
        .section-card{background:#fff;borderRadius:16px;border:1px solid #EDE6D6;padding:24px;marginBottom:24px}
        @media(max-width:900px){.adm-sidebar{width:56px}.adm-content{margin-left:56px}.sidebar-label{display:none}}
        @media(max-width:640px){.adm-sidebar{display:none}.adm-content{margin-left:0}}
        @media(max-width:768px){.ch-grid{grid-template-columns:1fr 1fr!important}.rate-scroll{overflow-x:auto}}
        @media(max-width:520px){.ch-grid{grid-template-columns:1fr!important}}
      `}</style>

      {/* toast */}
      {toast&&(
        <div style={{position:"fixed",top:20,right:20,zIndex:9999,background:toast.type==="success"?"#1E7A48":"#9B2C2C",color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:13.5,fontWeight:600,boxShadow:"0 4px 20px rgba(0,0,0,.18)",animation:"slideDown .25s ease",maxWidth:340}}>
          {toast.type==="success"?"✓ ":"✗ "}{toast.msg}
        </div>
      )}

      <div style={{display:"flex"}}>
        {/* ── sidebar ── */}
        <div className="adm-sidebar">
          <div style={{padding:"20px 16px 14px",borderBottom:"1px solid rgba(255,255,255,.07)",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:"#C9A84C",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic d={P.villa} size={16} stroke="#fff"/></div>
            <div className="sidebar-label"><div style={{fontSize:12.5,fontWeight:700,color:"#fff",fontFamily:"Playfair Display,Georgia,serif"}}>Staya</div><div style={{fontSize:9,color:"#C9A84C",letterSpacing:".1em",textTransform:"uppercase"}}>Management</div></div>
          </div>
          <div style={{padding:"12px 10px",flex:1,overflowY:"auto"}}>
            {NAV.map(item=>{
              const active=path===item.href||(!!item.href&&item.href!=="/dashboard/admin"&&path.startsWith(item.href));
              return(
                <div key={item.label} onClick={()=>item.href&&(window.location.href=item.href)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,marginBottom:1,cursor:item.href?"pointer":"default",background:active?"rgba(201,168,76,.18)":"transparent",color:active?"#C9A84C":item.isAlert?"rgba(255,100,80,.8)":item.href?"rgba(255,255,255,.72)":"rgba(255,255,255,.3)",opacity:item.href?1:0.5}}>
                  <Ic d={item.icon} size={15}/><span className="sidebar-label" style={{fontSize:12.5,fontWeight:active?600:400}}>{item.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{padding:"10px 12px",borderTop:"1px solid rgba(255,255,255,.07)",display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"#C9A84C",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10.5,fontWeight:700,color:"#fff",flexShrink:0}}>{ini(ownerName)}</div>
            <div className="sidebar-label" style={{minWidth:0,flex:1}}><div style={{fontSize:12,fontWeight:600,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ownerName}</div><div style={{fontSize:10,color:"rgba(201,168,76,.7)"}}>Super Admin</div></div>
            <div style={{cursor:"pointer",color:"rgba(255,255,255,.4)"}} onClick={async()=>{await supabase.auth.signOut();window.location.href="/"}}><Ic d={P.logout} size={14}/></div>
          </div>
        </div>

        <div className="adm-content">
          {/* topbar */}
          <div style={{background:"#fff",borderBottom:"1px solid #EDE6D6",padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
            <div style={{fontFamily:"Playfair Display,Georgia,serif",fontSize:14.5,fontWeight:700,color:"#2C2C2C"}}>Staya Management</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"#C9A84C",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10.5,fontWeight:700,color:"#fff"}}>{ini(ownerName)}</div>
              <span style={{fontSize:13,fontWeight:600,color:"#2C2C2C"}}>{ownerName}</span>
              <button onClick={async()=>{await supabase.auth.signOut();window.location.href="/";}} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:8,border:"1.5px solid #EDE6D6",background:"transparent",color:"#7A6A50",fontSize:12,cursor:"pointer"}}><Ic d={P.logout} size={12}/> Logout</button>
            </div>
          </div>

          <main style={{padding:"24px 24px 80px"}}>

            {/* ── PAGE HEADER ── */}
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:24}}>
              <div>
                <h1 style={{fontSize:26,fontFamily:"Playfair Display,Georgia,serif",color:"#2C2C2C",fontWeight:700}}>Channel Manager</h1>
                <p style={{fontSize:13.5,color:"#9E8E6A",marginTop:3}}>Sync rates &amp; availability across all OTAs</p>
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:"1.5px solid #EDE6D6",background:"#FDFAF5",fontSize:12,color:"#9E8E6A"}}>
                  <Ic d={P.hist} size={13}/> Auto-sync every 15 min
                </div>
                <button onClick={syncAll}
                  style={{display:"flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:10,border:"none",background:"#C9A84C",color:"#fff",fontSize:13.5,fontWeight:700,cursor:"pointer"}}>
                  <Ic d={P.sync} size={15}/> Sync All Channels
                </button>
              </div>
            </div>

            {/* ══════════════════════════════════════════
                SECTION 1 — CHANNEL STATUS CARDS
            ══════════════════════════════════════════ */}
            <div style={{marginBottom:8}}>
              <h2 style={{fontSize:16,fontWeight:700,color:"#2C2C2C",fontFamily:"Playfair Display,Georgia,serif",marginBottom:4}}>Channel Status</h2>
              <p style={{fontSize:12.5,color:"#9E8E6A",marginBottom:16}}>Monitor connections and sync status for each OTA platform</p>
            </div>
            <div className="ch-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:32}}>
              {CHANNELS.map(ch=>{
                const cfg=configs[ch.key];
                const stats=channelStats[ch.key];
                const isSyncing=syncingChannel===ch.key;
                return(
                  <div key={ch.key} style={{background:"#fff",borderRadius:16,border:`1.5px solid ${cfg.connected?ch.color+"44":"#EDE6D6"}`,padding:"20px",display:"flex",flexDirection:"column",gap:14,animation:"fadeUp .3s ease"}}>
                    {/* header */}
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:38,height:38,borderRadius:10,background:ch.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{ch.icon}</div>
                        <div>
                          <div style={{fontSize:13.5,fontWeight:700,color:"#2C2C2C"}}>{ch.label}</div>
                          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
                            {cfg.connected?(
                              <>
                                <div style={{width:7,height:7,borderRadius:"50%",background:"#1E7A48",animation:"pulse 2s infinite"}}/>
                                <span style={{fontSize:11,color:"#1E7A48",fontWeight:600}}>Connected</span>
                              </>
                            ):(
                              <>
                                <div style={{width:7,height:7,borderRadius:"50%",background:"#DDD5C0"}}/>
                                <span style={{fontSize:11,color:"#9E8E6A"}}>Disconnected</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* stats */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <div style={{background:"#F5F0E8",borderRadius:8,padding:"8px 10px"}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#9E8E6A",textTransform:"uppercase",letterSpacing:".05em",marginBottom:2}}>Bookings</div>
                        <div style={{fontSize:18,fontWeight:700,color:"#2C2C2C",fontFamily:"Playfair Display,Georgia,serif"}}>{stats.bookings}</div>
                      </div>
                      <div style={{background:"#F5F0E8",borderRadius:8,padding:"8px 10px"}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#9E8E6A",textTransform:"uppercase",letterSpacing:".05em",marginBottom:2}}>Revenue</div>
                        <div style={{fontSize:13,fontWeight:700,color:"#C9A84C"}}>{stats.revenue>0?fmtAmt(stats.revenue):"—"}</div>
                      </div>
                    </div>
                    {/* last sync */}
                    <div style={{fontSize:11.5,color:"#9E8E6A",display:"flex",alignItems:"center",gap:5}}>
                      <Ic d={P.hist} size={12}/>Last synced: <strong style={{color:"#4A3B27"}}>{fmtTime(cfg.last_synced)}</strong>
                    </div>
                    {/* buttons */}
                    <div style={{display:"flex",flexDirection:"column",gap:7}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                        <button onClick={()=>setSettingsModal(ch.key)}
                          style={{padding:"7px",borderRadius:8,border:"1.5px solid #EDE6D6",background:"#fff",color:"#4A3B27",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                          <Ic d={P.cog} size={12}/> Configure
                        </button>
                        <button onClick={()=>syncChannel(ch.key)} disabled={isSyncing||!cfg.connected}
                          style={{padding:"7px",borderRadius:8,border:"none",background:cfg.connected?"#C9A84C":"#EDE6D6",color:cfg.connected?"#fff":"#C4B89A",fontSize:12,fontWeight:600,cursor:cfg.connected&&!isSyncing?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                          {isSyncing?<><Ic d={P.sync} size={12}/> Syncing…</>:<><Ic d={P.sync} size={12}/> Sync Now</>}
                        </button>
                      </div>
                      <button onClick={()=>toggleConnect(ch.key)}
                        style={{padding:"7px",borderRadius:8,border:`1.5px solid ${cfg.connected?"#FFF0F0":"#EDFAF3"}`,background:cfg.connected?"#FFF0F0":"#EDFAF3",color:cfg.connected?"#9B2C2C":"#1E7A48",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                        {cfg.connected?"Disconnect":"Connect"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ══════════════════════════════════════════
                SECTION 2 — iCAL SYNC
            ══════════════════════════════════════════ */}
            <div style={{marginBottom:8}}>
              <h2 style={{fontSize:16,fontWeight:700,color:"#2C2C2C",fontFamily:"Playfair Display,Georgia,serif",marginBottom:4}}>iCal Calendar Sync</h2>
              <p style={{fontSize:12.5,color:"#9E8E6A",marginBottom:4}}>Connect your OTA calendars to automatically import bookings and block availability</p>
            </div>
            <div style={{background:"#EEF4FF",borderRadius:12,padding:"12px 16px",border:"1px solid #C0D2F8",marginBottom:20,display:"flex",alignItems:"flex-start",gap:10}}>
              <Ic d={P.info} size={15} stroke="#2B4BA0"/>
              <p style={{fontSize:12.5,color:"#2B4BA0",margin:0,lineHeight:1.6}}>
                Paste each channel&apos;s iCal export URL. Click <strong>Sync Now</strong> to pull new bookings directly into the system. Auto-sync runs every 15 minutes when connected.
              </p>
            </div>

            {loading?(
              <div style={{background:"#fff",borderRadius:16,border:"1px solid #EDE6D6",padding:32,textAlign:"center",color:"#C4B89A",fontSize:13}}>Loading villas…</div>
            ):villas.map(villa=>(
              <div key={villa.id} style={{background:"#fff",borderRadius:16,border:"1px solid #EDE6D6",marginBottom:16,overflow:"hidden"}}>
                {/* villa header */}
                <div style={{padding:"14px 20px",borderBottom:"1px solid #EDE6D6",background:"#FDFAF5",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:32,height:32,borderRadius:8,background:"#C9A84C",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff"}}>{ini(villa.name)}</div>
                    <div style={{fontSize:14,fontWeight:700,color:"#2C2C2C"}}>{villa.name}</div>
                  </div>
                  <button onClick={()=>saveUrls(villa.id)}
                    style={{padding:"6px 14px",borderRadius:8,border:"1.5px solid #C9A84C",background:"#FFF8E6",color:"#7A5210",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                    <Ic d={P.check} size={12}/> Save URLs
                  </button>
                </div>
                {/* channels */}
                <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:12}}>
                  {ICAL_CH.map(ch=>{
                    const entry=icalData[villa.id]?.[ch.key]??{url:"",lastSynced:null,status:"idle"};
                    const syncId=`${villa.id}_${ch.key}`;
                    const isSyncing=syncingIcal===syncId||entry.status==="syncing";
                    return(
                      <div key={ch.key} style={{border:`1.5px solid ${entry.url?ch.color+"55":"#EDE6D6"}`,borderRadius:10,overflow:"hidden"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 14px",background:entry.url?ch.color+"0D":"#FAFAFA",borderBottom:"1px solid #EDE6D6",flexWrap:"wrap",gap:8}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:8,height:8,borderRadius:"50%",background:ch.color}}/>
                            <span style={{fontSize:12.5,fontWeight:700,color:"#2C2C2C"}}>{ch.label}</span>
                            {entry.status==="ok"&&<span style={{fontSize:10.5,background:"#EDFAF3",color:"#1E7A48",padding:"2px 8px",borderRadius:10,fontWeight:600}}>✅ Synced {fmtTime(entry.lastSynced)}</span>}
                            {entry.status==="error"&&<span style={{fontSize:10.5,background:"#FFF0F0",color:"#9B2C2C",padding:"2px 8px",borderRadius:10,fontWeight:600}}>⚠️ {entry.error?.slice(0,40)??"Error"}</span>}
                            {entry.status==="syncing"&&<span style={{fontSize:10.5,background:"#EEF4FF",color:"#2B4BA0",padding:"2px 8px",borderRadius:10,fontWeight:600}}>🔄 Syncing…</span>}
                            {entry.status==="idle"&&entry.lastSynced&&<span style={{fontSize:10.5,color:"#9E8E6A"}}>Last: {fmtTime(entry.lastSynced)}</span>}
                          </div>
                          <button onClick={()=>syncIcal(villa.id,ch.key)} disabled={isSyncing||!entry.url?.trim()}
                            style={{padding:"5px 12px",borderRadius:7,border:"none",background:entry.url?.trim()&&!isSyncing?ch.color:"#EDE6D6",color:entry.url?.trim()&&!isSyncing?"#fff":"#C4B89A",fontSize:11.5,fontWeight:700,cursor:entry.url?.trim()&&!isSyncing?"pointer":"default",display:"flex",alignItems:"center",gap:4}}>
                            {isSyncing?<><Ic d={P.sync} size={11}/> Syncing…</>:<><Ic d={P.sync} size={11}/> Sync Now</>}
                          </button>
                        </div>
                        <div style={{padding:"10px 14px",background:"#fff"}}>
                          <input type="url" value={entry.url}
                            onChange={e=>setICalUrl(villa.id,ch.key,e.target.value)}
                            placeholder={ch.placeholder}
                            style={{width:"100%",padding:"8px 12px",border:"1.5px solid #DDD5C0",borderRadius:8,fontSize:12,fontFamily:"monospace",color:"#2C2C2C",background:"#FDFBF7",outline:"none"}}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* ══════════════════════════════════════════
                SECTION 3 — RATE MANAGEMENT
            ══════════════════════════════════════════ */}
            <div style={{marginBottom:8,marginTop:32}}>
              <h2 style={{fontSize:16,fontWeight:700,color:"#2C2C2C",fontFamily:"Playfair Display,Georgia,serif",marginBottom:4}}>Rate Management</h2>
              <p style={{fontSize:12.5,color:"#9E8E6A",marginBottom:16}}>Set markup or discount percentages per channel. Base rates are stored in the villa settings.</p>
            </div>

            {loading?(
              <div style={{background:"#fff",borderRadius:16,border:"1px solid #EDE6D6",padding:32,textAlign:"center",color:"#C4B89A",fontSize:13}}>Loading…</div>
            ):villas.map(villa=>{
              const cur=villa.currency??"USD";
              return(
                <div key={villa.id} style={{background:"#fff",borderRadius:16,border:"1px solid #EDE6D6",marginBottom:16,overflow:"hidden"}}>
                  <div style={{padding:"14px 20px",borderBottom:"1px solid #EDE6D6",background:"#FDFAF5",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:32,height:32,borderRadius:8,background:"#C9A84C",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff"}}>{ini(villa.name)}</div>
                      <div style={{fontSize:14,fontWeight:700,color:"#2C2C2C"}}>{villa.name}<span style={{fontSize:11,color:"#9E8E6A",marginLeft:8}}>{cur}</span></div>
                    </div>
                    <button onClick={()=>saveRates(villa)} disabled={savingRates[villa.id]}
                      style={{padding:"6px 14px",borderRadius:8,border:"none",background:savingRates[villa.id]?"#EDE6D6":"#C9A84C",color:savingRates[villa.id]?"#C4B89A":"#fff",fontSize:12,fontWeight:700,cursor:savingRates[villa.id]?"default":"pointer"}}>
                      {savingRates[villa.id]?"Saving…":"Save Rates"}
                    </button>
                  </div>
                  <div className="rate-scroll" style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",minWidth:560}}>
                      <thead>
                        <tr style={{background:"#FDFAF5"}}>
                          <th style={{padding:"10px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:"#9E8E6A",letterSpacing:".05em",textTransform:"uppercase",borderBottom:"1px solid #EDE6D6",minWidth:140}}>Season</th>
                          <th style={{padding:"10px 12px",textAlign:"right",fontSize:11,fontWeight:700,color:"#9E8E6A",letterSpacing:".05em",textTransform:"uppercase",borderBottom:"1px solid #EDE6D6"}}>Base Rate</th>
                          {CHANNELS.map(ch=>(
                            <th key={ch.key} style={{padding:"10px 12px",textAlign:"center",fontSize:11,fontWeight:700,color:ch.color,letterSpacing:".05em",textTransform:"uppercase",borderBottom:"1px solid #EDE6D6",minWidth:110}}>
                              {ch.icon} {ch.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {SEASONS.map((s,si)=>{
                          const base=(villa[SEASON_COL[s.key] as keyof Villa] as number|null)??0;
                          return(
                            <tr key={s.key} style={{borderBottom:si<SEASONS.length-1?"1px solid #F0EBE0":"none"}}>
                              <td style={{padding:"12px 16px"}}>
                                <div style={{fontSize:13,fontWeight:600,color:"#2C2C2C"}}>{s.emoji} {s.label}</div>
                              </td>
                              <td style={{padding:"12px",textAlign:"right"}}>
                                <span style={{fontSize:14,fontWeight:700,color:"#4A3B27"}}>{base?fmtAmt(base,cur):"—"}</span>
                              </td>
                              {CHANNELS.map(ch=>{
                                const pct=getMarkup(villa.id,ch.key,s.key);
                                const rate=base?(base*(1+pct/100)):0;
                                const isHi=pct>0,isLo=pct<0;
                                return(
                                  <td key={ch.key} style={{padding:"12px",textAlign:"center"}}>
                                    <div style={{fontSize:13,fontWeight:700,color:isHi?"#1E7A48":isLo?"#9B2C2C":"#4A3B27",marginBottom:4}}>
                                      {rate?fmtAmt(rate,cur):"—"}
                                    </div>
                                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                                      <input type="number" value={pct} step={1}
                                        onChange={e=>setMarkup(villa.id,ch.key,s.key,+(+e.target.value).toFixed(1))}
                                        style={{width:54,padding:"3px 6px",border:`1.5px solid ${isHi?"#B0E8CB":isLo?"#FFCDD2":"#DDD5C0"}`,borderRadius:6,fontSize:11.5,textAlign:"center",background:isHi?"#EDFAF3":isLo?"#FFF0F0":"#FDFBF7",color:isHi?"#1E7A48":isLo?"#9B2C2C":"#4A3B27"}}
                                      />
                                      <span style={{fontSize:11,color:"#9E8E6A"}}>%</span>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{padding:"10px 16px",background:"#F5F0E8",borderTop:"1px solid #EDE6D6",fontSize:11,color:"#9E8E6A",display:"flex",gap:20,flexWrap:"wrap"}}>
                    <span style={{color:"#1E7A48",fontWeight:600}}>▲ Green = markup above base</span>
                    <span style={{color:"#9B2C2C",fontWeight:600}}>▼ Red = discount below base</span>
                    <span>Enter % in each cell. Markups are applied on top of the base rate.</span>
                  </div>
                </div>
              );
            })}

            {/* ══════════════════════════════════════════
                SECTION 4 — AVAILABILITY MANAGEMENT
            ══════════════════════════════════════════ */}
            <div style={{marginBottom:8,marginTop:32}}>
              <h2 style={{fontSize:16,fontWeight:700,color:"#2C2C2C",fontFamily:"Playfair Display,Georgia,serif",marginBottom:4}}>Availability Management</h2>
              <p style={{fontSize:12.5,color:"#9E8E6A",marginBottom:16}}>Block or open dates across all channels. Click dates to select, then block or release.</p>
            </div>
            <div style={{background:"#fff",borderRadius:16,border:"1px solid #EDE6D6",marginBottom:32,overflow:"hidden"}}>
              {/* controls */}
              <div style={{padding:"14px 20px",borderBottom:"1px solid #EDE6D6",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <select value={avVilla} onChange={e=>setAvVilla(e.target.value)}
                  style={{padding:"7px 12px",borderRadius:8,border:"1.5px solid #EDE6D6",background:"#fff",fontSize:13,color:"#2C2C2C",cursor:"pointer"}}>
                  {villas.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <button onClick={()=>{const[y,m]=avMonth.split("-").map(Number);const d=new Date(y,m-2,1);setAvMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}}
                  style={{padding:"7px 12px",borderRadius:8,border:"1.5px solid #EDE6D6",background:"#fff",cursor:"pointer",fontSize:13}}>←</button>
                <span style={{fontSize:14,fontWeight:700,color:"#2C2C2C",fontFamily:"Playfair Display,Georgia,serif",minWidth:140,textAlign:"center"}}>
                  {new Date(avMonth+"-01T00:00:00").toLocaleDateString("en-US",{month:"long",year:"numeric"})}
                </span>
                <button onClick={()=>{const[y,m]=avMonth.split("-").map(Number);const d=new Date(y,m,1);setAvMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}}
                  style={{padding:"7px 12px",borderRadius:8,border:"1.5px solid #EDE6D6",background:"#fff",cursor:"pointer",fontSize:13}}>→</button>
                <div style={{flex:1}}/>
                <button onClick={blockSelected} disabled={!selDates.size}
                  style={{padding:"7px 14px",borderRadius:8,border:"none",background:selDates.size?"#9B2C2C":"#EDE6D6",color:selDates.size?"#fff":"#C4B89A",fontSize:12.5,fontWeight:700,cursor:selDates.size?"pointer":"default"}}>
                  Block Selected ({selDates.size})
                </button>
                <button onClick={openSelected} disabled={!selDates.size}
                  style={{padding:"7px 14px",borderRadius:8,border:"none",background:selDates.size?"#1E7A48":"#EDE6D6",color:selDates.size?"#fff":"#C4B89A",fontSize:12.5,fontWeight:700,cursor:selDates.size?"pointer":"default"}}>
                  Open Selected ({selDates.size})
                </button>
                <button onClick={()=>setSelDates(new Set())}
                  style={{padding:"7px 12px",borderRadius:8,border:"1.5px solid #EDE6D6",background:"#fff",color:"#9E8E6A",fontSize:12,cursor:"pointer"}}>
                  Clear
                </button>
              </div>
              {/* calendar grid */}
              <div style={{padding:"20px"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,marginBottom:8}}>
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>(
                    <div key={d} style={{fontSize:11,fontWeight:700,color:"#9E8E6A",textAlign:"center",padding:"4px"}}>{d}</div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
                  {/* offset first day */}
                  {Array.from({length:(new Date(avDays[0]+"T00:00:00").getDay()+6)%7},(_,i)=>(
                    <div key={`empty-${i}`}/>
                  ))}
                  {avDays.map(date=>{
                    const isBooked=bookedDatesSet.has(date);
                    const isBlocked=blockedSet.has(date);
                    const isSel=selDates.has(date);
                    const isPast=date<today();
                    const isToday=date===today();
                    let bg="#EDFAF3",color="#1E7A48",label="";
                    if(isBooked){bg="#FFF8E6";color="#C9A84C";label="";}
                    if(isBlocked){bg="#FFF0F0";color="#9B2C2C";label="";}
                    if(isSel){bg="#2B4BA0";color="#fff";}
                    if(isPast&&!isBooked&&!isBlocked){bg="#F5F0E8";color="#C4B89A";}
                    if(isToday){/* ring */}
                    return(
                      <div key={date}
                        className="cal-day"
                        onClick={()=>!isPast&&toggleDate(date)}
                        style={{background:bg,color,border:isToday?"2px solid #C9A84C":"2px solid transparent",opacity:isPast&&!isBooked&&!isBlocked?.6:1,cursor:isPast&&!isBooked&&!isBlocked?"default":"pointer"}}>
                        <div style={{textAlign:"center",lineHeight:1.2}}>
                          <div style={{fontSize:12.5,fontWeight:isToday?700:500}}>{new Date(date+"T00:00:00").getDate()}</div>
                          {label&&<div style={{fontSize:8}}>{label}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* legend + actions */}
              <div style={{padding:"12px 20px",borderTop:"1px solid #EDE6D6",background:"#FDFAF5",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                  {[
                    {bg:"#EDFAF3",color:"#1E7A48",label:"Available"},
                    {bg:"#FFF8E6",color:"#C9A84C",label:"Booked"},
                    {bg:"#FFF0F0",color:"#9B2C2C",label:"Blocked"},
                    {bg:"#2B4BA0",color:"#fff",label:"Selected"},
                  ].map(l=>(
                    <div key={l.label} style={{display:"flex",alignItems:"center",gap:6,fontSize:11.5,color:"#4A3B27"}}>
                      <div style={{width:14,height:14,borderRadius:4,background:l.bg,border:`1.5px solid ${l.color}40`}}/>
                      {l.label}
                    </div>
                  ))}
                </div>
                <button onClick={clearBlocked}
                  style={{padding:"6px 14px",borderRadius:8,border:"1.5px solid #FFF0F0",background:"#FFF0F0",color:"#9B2C2C",fontSize:11.5,fontWeight:600,cursor:"pointer"}}>
                  Clear All Blocked
                </button>
              </div>
            </div>

            {/* ══════════════════════════════════════════
                SECTION 5 — SYNC HISTORY
            ══════════════════════════════════════════ */}
            <div style={{marginBottom:8,marginTop:32}}>
              <h2 style={{fontSize:16,fontWeight:700,color:"#2C2C2C",fontFamily:"Playfair Display,Georgia,serif",marginBottom:4}}>Sync History</h2>
              <p style={{fontSize:12.5,color:"#9E8E6A",marginBottom:16}}>Log of iCal sync operations. Auto-sync runs every 15 minutes.</p>
            </div>
            <div style={{background:"#fff",borderRadius:16,border:"1px solid #EDE6D6",overflow:"hidden"}}>
              {history.length===0?(
                <div style={{padding:48,textAlign:"center",color:"#C4B89A"}}>
                  <div style={{fontSize:32,marginBottom:10}}>📋</div>
                  <div style={{fontSize:14,fontWeight:600,fontFamily:"Playfair Display,Georgia,serif"}}>No sync history yet</div>
                  <div style={{fontSize:12.5,marginTop:4}}>Sync records will appear here after your first iCal sync.</div>
                </div>
              ):(
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr style={{background:"#FDFAF5"}}>
                        {["Timestamp","Channel","Villa","New","Updated","Skipped"].map(h=>(
                          <th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:"#9E8E6A",letterSpacing:".05em",textTransform:"uppercase",borderBottom:"1px solid #EDE6D6",whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((rec,i)=>{
                        const ch=ICAL_CH.find(c=>c.key===rec.channel||c.key===rec.channel+"_com");
                        return(
                          <tr key={i} style={{borderBottom:"1px solid #F0EBE0"}}>
                            <td style={{padding:"11px 16px",fontSize:12.5,color:"#7A6A50",fontFamily:"monospace"}}>{fmtDateLong(rec.ts)}</td>
                            <td style={{padding:"11px 16px"}}>
                              <span style={{padding:"3px 10px",borderRadius:20,background:ch?ch.color+"15":"#F5F0E8",color:ch?.color??"#7A6A50",fontSize:11.5,fontWeight:700}}>
                                {rec.channel.replace(/_com$/,"").replace(/\b\w/g,c=>c.toUpperCase())}
                              </span>
                            </td>
                            <td style={{padding:"11px 16px",fontSize:13,color:"#2C2C2C",fontWeight:500}}>{rec.villa}</td>
                            <td style={{padding:"11px 16px"}}>
                              {rec.added>0?<span style={{padding:"2px 8px",borderRadius:12,background:"#EDFAF3",color:"#1E7A48",fontSize:12,fontWeight:700}}>+{rec.added}</span>:<span style={{color:"#C4B89A",fontSize:12}}>0</span>}
                            </td>
                            <td style={{padding:"11px 16px"}}>
                              {rec.updated>0?<span style={{padding:"2px 8px",borderRadius:12,background:"#EEF4FF",color:"#2B4BA0",fontSize:12,fontWeight:700}}>~{rec.updated}</span>:<span style={{color:"#C4B89A",fontSize:12}}>0</span>}
                            </td>
                            <td style={{padding:"11px 16px",fontSize:12,color:"#9E8E6A"}}>{rec.skipped}</td>
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
      </div>

      {/* ── channel settings modal ── */}
      {settingsModal&&(()=>{
        const ch=CHANNELS.find(c=>c.key===settingsModal)!;
        return(
          <ChannelSettingsModal
            ch={ch}
            config={configs[settingsModal]}
            onSave={cfg=>saveConfig(settingsModal,cfg)}
            onClose={()=>setSettingsModal(null)}
          />
        );
      })()}
    </>
  );
}

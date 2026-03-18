import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseICalDate(raw: string): string | null {
  const s = raw.replace(/^VALUE=DATE:/i, "").trim();
  if (/^\d{8}$/.test(s)) return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  try { return new Date(s).toISOString().slice(0,10); } catch { return null; }
}

function detectChannel(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("airbnb"))    return "airbnb";
  if (u.includes("booking"))   return "booking";
  if (u.includes("vrbo") || u.includes("homeaway")) return "vrbo";
  if (u.includes("expedia"))   return "expedia";
  return "direct";
}

interface ICalEvent {
  uid: string;
  dtstart: string;
  dtend: string;
  summary: string;
}

function parseICalEvents(icalText: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const blocks = icalText.split(/BEGIN:VEVENT/i);
  for (let i = 1; i < blocks.length; i++) {
    const blk = blocks[i];
    const get = (key: string) => blk.match(new RegExp(`^${key}(?:;[^:]+)?:(.+)$`, "im"))?.[1]?.trim() ?? null;
    const dtstart = parseICalDate(get("DTSTART") ?? "");
    const dtend   = parseICalDate(get("DTEND")   ?? "");
    if (!dtstart || !dtend) continue;
    events.push({
      uid:     get("UID")     ?? `uid-${i}`,
      dtstart,
      dtend,
      summary: get("SUMMARY") ?? "Reserved",
    });
  }
  return events;
}

function guestName(summary: string, channel: string): string {
  const generic = ["reserved","not available","closed","blocked","unavailable"];
  if (generic.some(g => summary.toLowerCase().includes(g))) return `${channel} Guest`;
  return summary.split(/\s+/).slice(0,3).join(" ");
}

export async function POST(req: NextRequest) {
  try {
    const { villa_id, ical_url, channel: explicitChannel } = await req.json() as {
      villa_id: string;
      ical_url: string;
      channel?: string;
    };

    if (!villa_id || !ical_url) {
      return NextResponse.json({ error: "villa_id and ical_url are required" }, { status: 400 });
    }

    const channel = explicitChannel ?? detectChannel(ical_url);

    let icalText: string;
    try {
      const resp = await fetch(ical_url, {
        headers: { "User-Agent": "StayaManagement-iCalSync/1.0" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      icalText = await resp.text();
    } catch (err) {
      return NextResponse.json({ error: `Could not fetch iCal URL: ${String(err)}` }, { status: 400 });
    }

    const events = parseICalEvents(icalText);
    let added = 0, updated = 0, skipped = 0;

    for (const ev of events) {
      const nights = Math.round(
        (new Date(ev.dtend).getTime() - new Date(ev.dtstart).getTime()) / 86_400_000
      );
      if (nights <= 0) { skipped++; continue; }

      const { data: existing } = await supabase
        .from("bookings")
        .select("id")
        .eq("villa_id", villa_id)
        .eq("ota_booking_id", ev.uid)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from("bookings").update({
          check_in:  ev.dtstart,
          check_out: ev.dtend,
          nights,
          status: "confirmed",
        }).eq("id", existing.id);
        if (error) { console.error("[iCal] update error:", error.message); skipped++; }
        else updated++;
      } else {
        const { error } = await supabase.from("bookings").insert({
          villa_id,
          guest_name:     guestName(ev.summary, channel),
          check_in:       ev.dtstart,
          check_out:      ev.dtend,
          nights,
          ota_channel:    channel,
          ota_booking_id: ev.uid,
          status:         "confirmed",
          is_paid:        false,
        });
        if (error) { console.error("[iCal] insert error:", error.message); skipped++; }
        else added++;
      }
    }

    return NextResponse.json({
      success:      true,
      channel,
      total_events: events.length,
      added,
      updated,
      skipped,
      synced_at:    new Date().toISOString(),
    });
  } catch (err) {
    console.error("[iCal Sync] unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

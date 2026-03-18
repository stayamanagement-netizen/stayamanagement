import { NextRequest, NextResponse } from "next/server";
import { sendEmail, baseEmailWrapper, goldDivider, detailRow, infoBox } from "@/lib/sendgrid";

type NotificationType =
  | "new_booking" | "booking_cancelled" | "payment_received"
  | "maintenance_reported" | "maintenance_resolved"
  | "service_requested" | "service_completed"
  | "guest_message" | "petty_cash_submitted" | "custom";

const NOTIFICATION_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  new_booking:           { emoji: "📅", label: "New Booking",          color: "#27AE60" },
  booking_cancelled:     { emoji: "❌", label: "Booking Cancelled",     color: "#C0392B" },
  payment_received:      { emoji: "💰", label: "Payment Received",      color: "#27AE60" },
  maintenance_reported:  { emoji: "🔧", label: "Maintenance Report",    color: "#E67E22" },
  maintenance_resolved:  { emoji: "✅", label: "Maintenance Resolved",  color: "#27AE60" },
  service_requested:     { emoji: "🛎",  label: "Service Requested",    color: "#3498DB" },
  service_completed:     { emoji: "✅", label: "Service Completed",     color: "#27AE60" },
  guest_message:         { emoji: "💬", label: "Guest Message",         color: "#9B59B6" },
  petty_cash_submitted:  { emoji: "🧾", label: "Petty Cash Submitted",  color: "#E67E22" },
  custom:                { emoji: "🔔", label: "Notification",          color: "#C9A84C" },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to, subject, notificationType = "custom", title, message,
      details, actionUrl, actionLabel, priority = "normal",
      villaName, triggeredBy,
    } = body;

    if (!to || !message) {
      return NextResponse.json({ error: "Missing required fields: to, message" }, { status: 400 });
    }

    const config = NOTIFICATION_CONFIG[notificationType] || NOTIFICATION_CONFIG.custom;
    const priorityColor = priority === "urgent" ? "#C0392B" : priority === "high" ? "#E67E22" : config.color;
    const displayTitle = title || config.label;

    const detailsRows = details && typeof details === "object"
      ? Object.entries(details as Record<string, unknown>).map(([key, value]) =>
          detailRow(key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), String(value))
        ).join("")
      : "";

    const content = `
      ${priority === "urgent" ? `<div style="background:#FDEDEC;border:1px solid #E74C3C;border-radius:4px;padding:10px 16px;margin-bottom:24px;text-align:center;"><span style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C0392B;font-weight:700;">⚠️ URGENT ACTION REQUIRED</span></div>` : ""}

      <div style="margin-bottom:24px;">
        <div style="display:inline-block;background:${priorityColor}20;border-radius:4px;padding:8px 14px;margin-bottom:16px;">
          <span style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${priorityColor};font-weight:700;">${config.emoji} ${config.label}</span>
        </div>
        <h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:600;color:#2C1E0F;">${displayTitle}</h2>
        ${villaName ? `<p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#C9A84C;text-transform:uppercase;letter-spacing:1px;">${villaName}</p>` : ""}
      </div>

      ${infoBox(`<p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#5C4A32;line-height:1.8;">${message}</p>`, "#FBF8F3", priorityColor)}

      ${detailsRows ? `${goldDivider()}<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:700;">Details</p><table width="100%" cellpadding="0" cellspacing="0">${detailsRows}</table>` : ""}

      ${goldDivider()}
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Time", new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" }))}
        ${triggeredBy ? detailRow("Triggered By", triggeredBy) : ""}
        ${priority !== "normal" ? detailRow("Priority", priority.charAt(0).toUpperCase() + priority.slice(1)) : ""}
      </table>

      ${actionUrl ? `<div style="text-align:center;margin:32px 0;"><a href="${actionUrl}" style="display:inline-block;background:#2C1E0F;color:#C9A84C;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;padding:14px 36px;border-radius:2px;">${actionLabel || "View Details"}</a></div>` : ""}

      <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#8B7355;line-height:1.6;">This is an automated notification from the Staya Management platform.</p>
    `;

    const emailSubject = subject || `[${config.label}] ${displayTitle}${villaName ? ` – ${villaName}` : ""}`;
    const response = await sendEmail({
      to, subject: emailSubject,
      html: baseEmailWrapper(content, `${config.emoji} ${displayTitle}${villaName ? ` at ${villaName}` : ""}`),
    });

    return NextResponse.json({ success: true, message: "Admin notification sent", statusCode: response[0]?.statusCode });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

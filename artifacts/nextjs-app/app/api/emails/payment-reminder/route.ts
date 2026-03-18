import { NextRequest, NextResponse } from "next/server";
import { sendEmail, baseEmailWrapper, goldDivider, detailRow, ctaButton, infoBox } from "@/lib/sendgrid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to, guestName, villaName, amountDue, currency = "USD",
      dueDate, bookingRef, paymentLink, isOverdue = false,
    } = body;

    if (!to || !guestName || !amountDue || !dueDate || !bookingRef) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const formattedDueDate = new Date(dueDate).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    const urgencyColor = isOverdue ? "#C0392B" : "#C9A84C";
    const urgencyLabel = isOverdue ? "OVERDUE" : "PAYMENT REMINDER";

    const content = `
      <h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:600;color:#2C1E0F;">Payment ${isOverdue ? "Overdue" : "Reminder"}</h2>
      <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">Dear ${guestName},</p>
      <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">
        ${isOverdue
          ? `Your payment for <strong style="color:#2C1E0F;">${villaName}</strong> is now overdue. Please arrange payment immediately to protect your reservation.`
          : `A payment is due for your upcoming stay at <strong style="color:#2C1E0F;">${villaName}</strong>.`}
      </p>
      ${infoBox(`
        <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${urgencyColor};font-weight:700;">${urgencyLabel}</p>
        <p style="margin:0;font-family:Georgia,serif;font-size:32px;color:#2C1E0F;font-weight:700;">${currency} ${Number(amountDue).toLocaleString()}</p>
        <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#5C4A32;">Due by ${formattedDueDate}</p>
      `, "#FBF8F3", urgencyColor)}
      ${goldDivider()}
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Booking Reference", bookingRef)}
        ${villaName ? detailRow("Villa", villaName) : ""}
        ${detailRow("Amount Due", `${currency} ${Number(amountDue).toLocaleString()}`)}
        ${detailRow("Due Date", formattedDueDate)}
      </table>
      ${goldDivider()}
      ${ctaButton("Pay Now", paymentLink || "#")}
      <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:14px;color:#5C4A32;line-height:1.7;">For assistance, contact <a href="mailto:stayamanagement@gmail.com" style="color:#C9A84C;text-decoration:none;">stayamanagement@gmail.com</a>.</p>
      <p style="margin:16px 0 0;font-family:Georgia,serif;font-size:16px;color:#2C1E0F;">Kind regards,<br/><em>The Staya Management Team</em></p>
    `;

    const response = await sendEmail({
      to,
      subject: `${isOverdue ? "⚠️ Overdue" : "Payment Reminder"} – ${villaName} | Ref: ${bookingRef}`,
      html: baseEmailWrapper(content),
    });

    return NextResponse.json({ success: true, message: "Payment reminder sent", statusCode: response[0]?.statusCode });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

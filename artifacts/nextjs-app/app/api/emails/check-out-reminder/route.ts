import { NextRequest, NextResponse } from "next/server";
import { sendEmail, baseEmailWrapper, goldDivider, detailRow, ctaButton, infoBox } from "@/lib/sendgrid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to, guestName, villaName, checkOut, checkOutTime = "11:00",
      bookingRef, lateCheckoutAvailable = false, luggageStorage = false,
      hostPhone, reviewLink,
    } = body;

    if (!to || !guestName || !villaName || !checkOut) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const formattedCheckOut = new Date(checkOut).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const checklistItems = [
      "Return all keys and access cards to the villa manager",
      "Ensure all personal belongings are packed",
      "Turn off all lights, fans, and air conditioning",
      "Secure all windows and doors before departing",
    ];

    const content = `
      <h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:600;color:#2C1E0F;">Check-Out Reminder</h2>
      <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">Dear ${guestName},</p>
      <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">We hope you are enjoying your final moments at <strong style="color:#2C1E0F;">${villaName}</strong>. Your check-out is tomorrow.</p>

      ${infoBox(`
        <table width="100%" cellpadding="0" cellspacing="0">
          ${detailRow("Check-Out Date", formattedCheckOut)}
          ${detailRow("Check-Out Time", checkOutTime)}
          ${bookingRef ? detailRow("Booking Reference", bookingRef) : ""}
        </table>
      `)}

      ${goldDivider()}
      <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:700;">Check-Out Checklist</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        ${checklistItems.map(item => `<tr><td style="padding:10px 0;border-bottom:1px solid #E8DDD0;font-family:Arial,sans-serif;font-size:13px;color:#5C4A32;"><span style="color:#C9A84C;margin-right:10px;">✓</span>${item}</td></tr>`).join("")}
      </table>

      ${(lateCheckoutAvailable || luggageStorage) ? `${goldDivider()}${lateCheckoutAvailable ? infoBox(`<p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#5C4A32;"><strong style="color:#2C1E0F;">Late Check-Out Available</strong> — Contact your villa manager${hostPhone ? ` at <a href="tel:${hostPhone}" style="color:#C9A84C;">${hostPhone}</a>` : ""} to arrange.</p>`) : ""}` : ""}

      <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;font-style:italic;">It has been a privilege to host you. We hope your stay was everything you dreamed of.</p>

      ${reviewLink ? ctaButton("Leave a Review", reviewLink) : ""}

      <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:14px;color:#5C4A32;line-height:1.7;">Safe travels. We hope to welcome you back soon. Contact us at <a href="mailto:stayamanagement@gmail.com" style="color:#C9A84C;text-decoration:none;">stayamanagement@gmail.com</a>.</p>
      <p style="margin:16px 0 0;font-family:Georgia,serif;font-size:16px;color:#2C1E0F;">Until next time,<br/><em>The Staya Management Team</em></p>
    `;

    const response = await sendEmail({
      to,
      subject: `Check-Out Reminder – ${villaName} | ${formattedCheckOut}`,
      html: baseEmailWrapper(content),
    });

    return NextResponse.json({ success: true, message: "Check-out reminder sent", statusCode: response[0]?.statusCode });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

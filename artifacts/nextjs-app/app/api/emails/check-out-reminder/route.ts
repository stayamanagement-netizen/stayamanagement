import { NextRequest, NextResponse } from "next/server";
import { sendEmail, baseEmailWrapper, goldDivider, detailRow, ctaButton, infoBox } from "@/lib/sendgrid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
      guestName,
      villaName,
      checkOut,
      checkOutTime = "11:00",
      bookingRef,
      lateCheckoutAvailable = false,
      luggageStorage = false,
      hostPhone,
      reviewLink,
    } = body;

    if (!to || !guestName || !villaName || !checkOut) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const formattedCheckOut = new Date(checkOut).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    const content = `
      <h2 style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:600;color:#2C1E0F;line-height:1.3;">Check-Out Reminder</h2>
      <p style="margin:0 0 24px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">Dear ${guestName},</p>
      <p style="margin:0 0 24px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">We hope you are enjoying your final moments at <strong style="color:#2C1E0F;">${villaName}</strong>. As a gentle reminder, your check-out is tomorrow.</p>

      ${infoBox(`
        <p style="margin:0 0 4px;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:600;">Check-Out Details</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
          ${detailRow("Check-Out Date", formattedCheckOut)}
          ${detailRow("Check-Out Time", checkOutTime)}
          ${bookingRef ? detailRow("Booking Reference", bookingRef) : ""}
        </table>
      `)}

      ${goldDivider()}

      <p style="margin:0 0 12px;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:600;">Check-Out Checklist</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        ${["Return all keys and access cards to the villa manager", "Ensure all personal belongings are packed", "Turn off all lights, fans, and air conditioning", "Secure all windows and doors before departing", "Leave the villa in the condition you found it"].map(item => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #E8DDD0;font-family:'Inter',Arial,sans-serif;font-size:13px;color:#5C4A32;line-height:1.6;">
              <span style="color:#C9A84C;margin-right:10px;">✓</span> ${item}
            </td>
          </tr>
        `).join("")}
      </table>

      ${goldDivider()}

      ${(lateCheckoutAvailable || luggageStorage) ? `
        <p style="margin:0 0 12px;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:600;">Additional Services</p>
        ${lateCheckoutAvailable ? infoBox(`<p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;color:#5C4A32;"><strong style="color:#2C1E0F;">Late Check-Out Available</strong> — Need a little more time? Late check-out may be available upon request. ${hostPhone ? `Contact your villa manager at <a href="tel:${hostPhone}" style="color:#C9A84C;">${hostPhone}</a>.` : "Please contact us to arrange."}</p>`, "#FBF8F3", "#C9A84C") : ""}
        ${luggageStorage ? infoBox(`<p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;color:#5C4A32;"><strong style="color:#2C1E0F;">Luggage Storage</strong> — We can store your luggage after check-out if you need to explore before your departure. Please ask our team.</p>`, "#FBF8F3", "#E8DDD0") : ""}
        ${goldDivider()}
      ` : ""}

      <p style="margin:0 0 24px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;font-style:italic;">It has been our absolute privilege to host you. We hope your stay has been everything you dreamed of and more.</p>

      ${reviewLink ? ctaButton("Leave a Review", reviewLink) : ""}

      <p style="margin:24px 0 0;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#5C4A32;line-height:1.7;">Safe travels, and we hope to welcome you back to Staya Management soon. For any last-minute requests, please contact us at <a href="mailto:stayamanagement@gmail.com" style="color:#C9A84C;text-decoration:none;">stayamanagement@gmail.com</a>${hostPhone ? ` or call <a href="tel:${hostPhone}" style="color:#C9A84C;text-decoration:none;">${hostPhone}</a>` : ""}.</p>
      <p style="margin:16px 0 0;font-family:'Playfair Display',Georgia,serif;font-size:16px;color:#2C1E0F;">Until next time,<br/><em>The Staya Management Team</em></p>
    `;

    await sendEmail({
      to,
      subject: `Check-Out Reminder – ${villaName} | ${formattedCheckOut}`,
      html: baseEmailWrapper(content, `Your check-out from ${villaName} is tomorrow at ${checkOutTime}. We hope you've had a wonderful stay.`),
    });

    return NextResponse.json({ success: true, message: "Check-out reminder sent" });
  } catch (error: unknown) {
    console.error("check-out-reminder email error:", error);
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

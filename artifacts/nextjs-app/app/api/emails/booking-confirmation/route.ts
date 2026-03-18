import { NextRequest, NextResponse } from "next/server";
import { sendEmail, baseEmailWrapper, goldDivider, detailRow, ctaButton, infoBox } from "@/lib/sendgrid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
      guestName,
      villaName,
      checkIn,
      checkOut,
      totalAmount,
      currency = "USD",
      bookingRef,
      nights,
      guests,
      specialRequests,
    } = body;

    if (!to || !guestName || !villaName || !checkIn || !checkOut || !bookingRef) {
      return NextResponse.json(
        { error: "Missing required fields: to, guestName, villaName, checkIn, checkOut, bookingRef" },
        { status: 400 }
      );
    }

    const formattedCheckIn = new Date(checkIn).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    const formattedCheckOut = new Date(checkOut).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const content = `
      <h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:600;color:#2C1E0F;line-height:1.3;">Booking Confirmed</h2>
      <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">Dear ${guestName},</p>
      <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">
        Your reservation at <strong style="color:#2C1E0F;">${villaName}</strong> has been confirmed.
        We are delighted to welcome you and look forward to making your stay exceptional.
      </p>

      ${infoBox(`
        <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:700;">Booking Reference</p>
        <p style="margin:0;font-family:Georgia,serif;font-size:26px;color:#2C1E0F;font-weight:700;letter-spacing:3px;">${bookingRef}</p>
      `)}

      ${goldDivider()}

      <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:700;">Reservation Details</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Villa", villaName)}
        ${detailRow("Check-In", formattedCheckIn)}
        ${detailRow("Check-Out", formattedCheckOut)}
        ${nights ? detailRow("Duration", `${nights} nights`) : ""}
        ${guests ? detailRow("Guests", String(guests)) : ""}
        ${totalAmount ? detailRow("Total Amount", `${currency} ${Number(totalAmount).toLocaleString()}`) : ""}
      </table>

      ${specialRequests ? `
        ${goldDivider()}
        <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:700;">Special Requests</p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#5C4A32;line-height:1.7;">${specialRequests}</p>
      ` : ""}

      ${goldDivider()}

      ${infoBox(`
        <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;color:#2C1E0F;font-weight:700;">What happens next?</p>
        <ul style="margin:0;padding-left:20px;font-family:Arial,sans-serif;font-size:13px;color:#5C4A32;line-height:2;">
          <li>You will receive check-in instructions 48 hours before arrival</li>
          <li>Our villa manager will be in touch to confirm your arrangements</li>
          <li>Please ensure full payment is received before your arrival date</li>
        </ul>
      `)}

      ${ctaButton("View My Booking", "#")}

      <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:14px;color:#5C4A32;line-height:1.7;">
        If you have any questions, please contact us at
        <a href="mailto:stayamanagement@gmail.com" style="color:#C9A84C;text-decoration:none;">stayamanagement@gmail.com</a>.
      </p>
      <p style="margin:16px 0 0;font-family:Georgia,serif;font-size:16px;color:#2C1E0F;">
        Warm regards,<br/><em>The Staya Management Team</em>
      </p>
    `;

    const response = await sendEmail({
      to,
      subject: `Booking Confirmed – ${villaName} | Ref: ${bookingRef}`,
      html: baseEmailWrapper(content, `Your stay at ${villaName} is confirmed. Reference: ${bookingRef}`),
    });

    return NextResponse.json({
      success: true,
      message: "Booking confirmation email sent successfully",
      statusCode: response[0]?.statusCode,
    });
  } catch (error: unknown) {
    console.error("booking-confirmation email error:", error);
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

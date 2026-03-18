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
      checkInTime = "14:00",
      checkOutTime = "11:00",
      address,
      accessCode,
      wifiName,
      wifiPassword,
      hostName,
      hostPhone,
      emergencyPhone,
      specialInstructions,
      mapLink,
      bookingRef,
    } = body;

    if (!to || !guestName || !villaName || !checkIn) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const formattedCheckIn = new Date(checkIn).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    const content = `
      <h2 style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:600;color:#2C1E0F;line-height:1.3;">Your Check-In Instructions</h2>
      <p style="margin:0 0 24px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">Dear ${guestName},</p>
      <p style="margin:0 0 24px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">Your stay at <strong style="color:#2C1E0F;">${villaName}</strong> begins on ${formattedCheckIn}. Everything is being prepared for your arrival. Here are all the details you need for a seamless check-in.</p>

      <!-- Arrival Info -->
      ${infoBox(`
        <p style="margin:0 0 4px;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:600;">Arrival Details</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
          ${detailRow("Check-In Date", formattedCheckIn)}
          ${detailRow("Check-In Time", checkInTime)}
          ${detailRow("Check-Out Time", checkOutTime)}
          ${bookingRef ? detailRow("Booking Ref", bookingRef) : ""}
        </table>
      `)}

      ${goldDivider()}

      <!-- Address -->
      ${address ? `
        <p style="margin:0 0 12px;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:600;">Villa Address</p>
        <p style="margin:0 0 4px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#2C1E0F;font-weight:500;line-height:1.6;">${address}</p>
        ${mapLink ? `<a href="${mapLink}" style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:#C9A84C;text-decoration:none;">📍 View on Google Maps →</a>` : ""}
        ${goldDivider()}
      ` : ""}

      <!-- Access -->
      ${accessCode ? `
        ${infoBox(`
          <p style="margin:0 0 4px;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:600;">🔑 Property Access Code</p>
          <p style="margin:8px 0 0;font-family:'Playfair Display',Georgia,serif;font-size:28px;color:#2C1E0F;font-weight:700;letter-spacing:6px;">${accessCode}</p>
          <p style="margin:8px 0 0;font-family:'Inter',Arial,sans-serif;font-size:12px;color:#8B7355;">Enter this code at the keypad to access the property</p>
        `)}
        ${goldDivider()}
      ` : ""}

      <!-- WiFi -->
      ${(wifiName || wifiPassword) ? `
        <p style="margin:0 0 12px;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:600;">📶 WiFi Details</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${wifiName ? detailRow("Network Name", wifiName) : ""}
          ${wifiPassword ? detailRow("Password", `<span style="font-family:monospace;background:#F0EBE3;padding:3px 8px;border-radius:3px;">${wifiPassword}</span>`) : ""}
        </table>
        ${goldDivider()}
      ` : ""}

      <!-- Host Contact -->
      ${(hostName || hostPhone) ? `
        <p style="margin:0 0 12px;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:600;">👤 Your Villa Manager</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${hostName ? detailRow("Name", hostName) : ""}
          ${hostPhone ? detailRow("Phone / WhatsApp", `<a href="tel:${hostPhone}" style="color:#C9A84C;text-decoration:none;">${hostPhone}</a>`) : ""}
          ${emergencyPhone ? detailRow("Emergency", `<a href="tel:${emergencyPhone}" style="color:#C9A84C;text-decoration:none;">${emergencyPhone}</a>`) : ""}
        </table>
        ${goldDivider()}
      ` : ""}

      <!-- Special Instructions -->
      ${specialInstructions ? `
        <p style="margin:0 0 12px;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:600;">📋 Important Notes</p>
        <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#5C4A32;line-height:1.8;">${specialInstructions}</p>
        ${goldDivider()}
      ` : ""}

      ${mapLink ? ctaButton("Get Directions", mapLink) : ""}

      <p style="margin:24px 0 0;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#5C4A32;line-height:1.7;">We wish you a wonderful stay. If you need anything at all, we are just a message away at <a href="mailto:stayamanagement@gmail.com" style="color:#C9A84C;text-decoration:none;">stayamanagement@gmail.com</a>.</p>
      <p style="margin:16px 0 0;font-family:'Playfair Display',Georgia,serif;font-size:16px;color:#2C1E0F;">Warmly,<br/><em>The Staya Management Team</em></p>
    `;

    await sendEmail({
      to,
      subject: `Check-In Instructions – ${villaName} | ${formattedCheckIn}`,
      html: baseEmailWrapper(content, `Your check-in details for ${villaName} on ${formattedCheckIn}`),
    });

    return NextResponse.json({ success: true, message: "Check-in instructions sent" });
  } catch (error: unknown) {
    console.error("check-in-instructions email error:", error);
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { sendEmail, baseEmailWrapper, goldDivider, ctaButton, infoBox } from "@/lib/sendgrid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, guestName, villaName, checkIn, checkOut, reviewLink, bookingRef, managerName } = body;

    if (!to || !guestName || !villaName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const formattedCheckIn = checkIn ? new Date(checkIn).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
    const formattedCheckOut = checkOut ? new Date(checkOut).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
    const stars = [1,2,3,4,5].map(() => `<span style="font-size:28px;color:#C9A84C;">★</span>`).join("");

    const content = `
      <h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:600;color:#2C1E0F;">How Was Your Stay?</h2>
      <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">Dear ${guestName},</p>
      <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">Thank you for choosing <strong style="color:#2C1E0F;">${villaName}</strong>${formattedCheckIn ? ` from ${formattedCheckIn} to ${formattedCheckOut}` : ""}. It was a pleasure hosting you.</p>

      <div style="text-align:center;margin:32px 0;">${stars}<p style="margin:16px 0 0;font-family:Georgia,serif;font-size:20px;color:#2C1E0F;font-style:italic;">"We'd love to hear your thoughts"</p></div>

      ${goldDivider()}
      <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#5C4A32;line-height:1.7;">Your review helps other travellers discover exceptional villa experiences and helps us continue to deliver the level of luxury you deserve.</p>

      ${infoBox(`
        <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#2C1E0F;">It only takes 2 minutes</p>
        <ul style="margin:0;padding-left:20px;font-family:Arial,sans-serif;font-size:13px;color:#5C4A32;line-height:2;">
          <li>Rate your overall experience</li>
          <li>Share what made your stay special</li>
          <li>Help future guests make the right choice</li>
        </ul>
      `)}

      ${ctaButton("Write a Review", reviewLink || "#")}
      ${goldDivider()}

      <p style="margin:0 0 0;font-family:Arial,sans-serif;font-size:14px;color:#5C4A32;line-height:1.7;">If anything fell short, please contact us at <a href="mailto:stayamanagement@gmail.com" style="color:#C9A84C;text-decoration:none;">stayamanagement@gmail.com</a>.</p>
      <p style="margin:16px 0 0;font-family:Georgia,serif;font-size:16px;color:#2C1E0F;">With gratitude,<br/><em>${managerName ? managerName + " & " : ""}The Staya Management Team</em></p>
    `;

    const response = await sendEmail({
      to,
      subject: `How was your stay at ${villaName}? We'd love your review`,
      html: baseEmailWrapper(content),
    });

    return NextResponse.json({ success: true, message: "Review request sent", statusCode: response[0]?.statusCode });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

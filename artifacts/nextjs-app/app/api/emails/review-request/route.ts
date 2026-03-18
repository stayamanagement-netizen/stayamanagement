import { NextRequest, NextResponse } from "next/server";
import { sendEmail, baseEmailWrapper, goldDivider, ctaButton, infoBox } from "@/lib/sendgrid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
      guestName,
      villaName,
      checkIn,
      checkOut,
      reviewLink,
      bookingRef,
      managerName,
    } = body;

    if (!to || !guestName || !villaName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const formattedCheckIn = checkIn ? new Date(checkIn).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
    const formattedCheckOut = checkOut ? new Date(checkOut).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";

    const stars = `
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          ${[1,2,3,4,5].map(() => `<td style="padding:0 4px;font-size:28px;color:#C9A84C;">★</td>`).join("")}
        </tr>
      </table>
    `;

    const content = `
      <h2 style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:600;color:#2C1E0F;line-height:1.3;">How Was Your Stay?</h2>
      <p style="margin:0 0 24px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">Dear ${guestName},</p>
      <p style="margin:0 0 24px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">Thank you for choosing <strong style="color:#2C1E0F;">${villaName}</strong> for your recent stay${formattedCheckIn ? ` from ${formattedCheckIn} to ${formattedCheckOut}` : ""}. It was truly a pleasure hosting you.</p>

      <div style="text-align:center;margin:32px 0;">
        ${stars}
        <p style="margin:16px 0 0;font-family:'Playfair Display',Georgia,serif;font-size:20px;color:#2C1E0F;font-style:italic;">"We would love to hear your thoughts"</p>
      </div>

      ${goldDivider()}

      <p style="margin:0 0 16px;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#5C4A32;line-height:1.7;">Your experience and feedback mean the world to us. Reviews help other travellers discover exceptional villa experiences and help us continue to deliver the level of luxury you deserve.</p>

      ${infoBox(`
        <p style="margin:0 0 8px;font-family:'Inter',Arial,sans-serif;font-size:13px;font-weight:600;color:#2C1E0F;">It only takes 2 minutes</p>
        <ul style="margin:0;padding-left:20px;font-family:'Inter',Arial,sans-serif;font-size:13px;color:#5C4A32;line-height:2;">
          <li>Rate your overall experience</li>
          <li>Share what made your stay special</li>
          <li>Help future guests make the right choice</li>
        </ul>
      `, "#FBF8F3", "#C9A84C")}

      ${ctaButton("Write a Review", reviewLink || "#")}

      ${goldDivider()}

      <p style="margin:0 0 16px;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#5C4A32;line-height:1.7;">If anything fell short of your expectations during your stay, we would deeply appreciate hearing from you directly at <a href="mailto:stayamanagement@gmail.com" style="color:#C9A84C;text-decoration:none;">stayamanagement@gmail.com</a>. Your feedback helps us improve.</p>

      <p style="margin:0 0 8px;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#5C4A32;line-height:1.7;">We hope to welcome you back to Staya Management very soon.</p>
      <p style="margin:16px 0 0;font-family:'Playfair Display',Georgia,serif;font-size:16px;color:#2C1E0F;">With gratitude,<br/><em>${managerName ? managerName + " & " : ""}The Staya Management Team</em></p>
    `;

    await sendEmail({
      to,
      subject: `How was your stay at ${villaName}? We'd love your review`,
      html: baseEmailWrapper(content, `Thank you for staying at ${villaName}. Share your experience and help future guests.`),
    });

    return NextResponse.json({ success: true, message: "Review request sent" });
  } catch (error: unknown) {
    console.error("review-request email error:", error);
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

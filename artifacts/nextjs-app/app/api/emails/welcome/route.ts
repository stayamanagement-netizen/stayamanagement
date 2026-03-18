import { NextRequest, NextResponse } from "next/server";
import { sendEmail, baseEmailWrapper, goldDivider, ctaButton, infoBox } from "@/lib/sendgrid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, guestName, role = "guest", loginUrl, temporaryPassword } = body;

    if (!to || !guestName) {
      return NextResponse.json({ error: "Missing required fields: to, guestName" }, { status: 400 });
    }

    const roleLabel: Record<string, string> = {
      guest: "Guest", villa_owner: "Villa Owner",
      villa_manager: "Villa Manager", super_admin: "Administrator",
    };
    const roleDescription: Record<string, string> = {
      guest: "Browse exclusive villas, manage your bookings, request services, and track your stay.",
      villa_owner: "Monitor your villa's performance, review financials, and track bookings.",
      villa_manager: "Manage day-to-day operations, oversee maintenance, and coordinate services.",
      super_admin: "Full platform access to manage villas, users, bookings, and operations.",
    };

    const content = `
      <h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:600;color:#2C1E0F;">Welcome to Staya Management</h2>
      <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">Dear ${guestName},</p>
      <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">We are delighted to welcome you to <strong style="color:#2C1E0F;">Staya Management</strong> — where luxury villa experiences are crafted with care.</p>

      ${infoBox(`
        <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:700;">Your Account</p>
        <p style="margin:8px 0 4px;font-family:Arial,sans-serif;font-size:15px;color:#2C1E0F;font-weight:600;">${guestName}</p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#8B7355;text-transform:uppercase;letter-spacing:1px;">${roleLabel[role] || role}</p>
      `)}

      ${goldDivider()}
      <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#5C4A32;line-height:1.7;">${roleDescription[role] || "Access your personalized dashboard to manage everything in one place."}</p>

      ${temporaryPassword ? infoBox(`
        <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:700;">Temporary Password</p>
        <p style="margin:8px 0;font-family:monospace;font-size:18px;color:#2C1E0F;letter-spacing:2px;background:#F0EBE3;display:inline-block;padding:6px 14px;border-radius:3px;">${temporaryPassword}</p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#8B7355;">Please change your password upon first login.</p>
      `) : ""}

      ${ctaButton("Access Your Dashboard", loginUrl || "#")}

      <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:14px;color:#5C4A32;line-height:1.7;">Questions? Reach us at <a href="mailto:stayamanagement@gmail.com" style="color:#C9A84C;text-decoration:none;">stayamanagement@gmail.com</a>.</p>
      <p style="margin:16px 0 0;font-family:Georgia,serif;font-size:16px;color:#2C1E0F;">With warmth,<br/><em>The Staya Management Team</em></p>
    `;

    const response = await sendEmail({
      to,
      subject: `Welcome to Staya Management, ${guestName}`,
      html: baseEmailWrapper(content, `Your Staya Management account is ready.`),
    });

    return NextResponse.json({ success: true, message: "Welcome email sent", statusCode: response[0]?.statusCode });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

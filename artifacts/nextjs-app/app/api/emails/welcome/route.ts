import { NextRequest, NextResponse } from "next/server";
import { sendEmail, baseEmailWrapper, goldDivider, ctaButton, infoBox } from "@/lib/sendgrid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
      guestName,
      role = "guest",
      loginUrl,
      temporaryPassword,
    } = body;

    if (!to || !guestName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const roleLabel: Record<string, string> = {
      guest: "Guest",
      villa_owner: "Villa Owner",
      villa_manager: "Villa Manager",
      super_admin: "Administrator",
    };

    const roleDescription: Record<string, string> = {
      guest: "Browse exclusive villas, manage your bookings, request services, and track your stay — all in one elegant platform.",
      villa_owner: "Monitor your villa's performance, review financials, track bookings, and stay informed about every aspect of your property.",
      villa_manager: "Manage day-to-day operations, oversee maintenance, coordinate services, and ensure exceptional guest experiences.",
      super_admin: "Full platform access to manage villas, users, bookings, and all operational aspects of Staya Management.",
    };

    const content = `
      <h2 style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:600;color:#2C1E0F;line-height:1.3;">Welcome to Staya Management</h2>
      <p style="margin:0 0 24px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">Dear ${guestName},</p>
      <p style="margin:0 0 24px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">We are delighted to welcome you to <strong style="color:#2C1E0F;">Staya Management</strong> — where luxury villa experiences are crafted with care and precision.</p>

      ${infoBox(`
        <p style="margin:0 0 4px;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:600;">Your Account</p>
        <p style="margin:8px 0 4px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#2C1E0F;font-weight:600;">${guestName}</p>
        <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;color:#8B7355;text-transform:uppercase;letter-spacing:1px;">${roleLabel[role] || role}</p>
      `)}

      ${goldDivider()}

      <p style="margin:0 0 12px;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:600;">Your Dashboard</p>
      <p style="margin:0 0 24px;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#5C4A32;line-height:1.7;">${roleDescription[role] || "Access your personalized dashboard to manage everything in one place."}</p>

      ${goldDivider()}

      <p style="margin:0 0 12px;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:600;">Getting Started</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #E8DDD0;vertical-align:top;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:32px;font-size:20px;vertical-align:top;">01</td>
                <td style="padding-left:16px;vertical-align:top;">
                  <p style="margin:0 0 4px;font-family:'Inter',Arial,sans-serif;font-size:13px;font-weight:600;color:#2C1E0F;">Sign in to your account</p>
                  <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;color:#8B7355;">Access your personalized dashboard</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #E8DDD0;vertical-align:top;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:32px;font-size:20px;vertical-align:top;">02</td>
                <td style="padding-left:16px;vertical-align:top;">
                  <p style="margin:0 0 4px;font-family:'Inter',Arial,sans-serif;font-size:13px;font-weight:600;color:#2C1E0F;">Complete your profile</p>
                  <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;color:#8B7355;">Add your preferences and contact details</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 0;vertical-align:top;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:32px;font-size:20px;vertical-align:top;">03</td>
                <td style="padding-left:16px;vertical-align:top;">
                  <p style="margin:0 0 4px;font-family:'Inter',Arial,sans-serif;font-size:13px;font-weight:600;color:#2C1E0F;">Explore your features</p>
                  <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;color:#8B7355;">Discover everything your account has to offer</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${temporaryPassword ? infoBox(`
        <p style="margin:0 0 4px;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:600;">Temporary Password</p>
        <p style="margin:8px 0;font-family:monospace;font-size:18px;color:#2C1E0F;letter-spacing:2px;background:#F0EBE3;display:inline-block;padding:6px 14px;border-radius:3px;">${temporaryPassword}</p>
        <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:12px;color:#8B7355;">Please change your password upon first login for security.</p>
      `, "#FBF8F3", "#C9A84C") : ""}

      ${ctaButton("Access Your Dashboard", loginUrl || "#")}

      <p style="margin:24px 0 0;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#5C4A32;line-height:1.7;">We are here to support you at every step. Reach us anytime at <a href="mailto:stayamanagement@gmail.com" style="color:#C9A84C;text-decoration:none;">stayamanagement@gmail.com</a>.</p>
      <p style="margin:16px 0 0;font-family:'Playfair Display',Georgia,serif;font-size:16px;color:#2C1E0F;">With warmth,<br/><em>The Staya Management Team</em></p>
    `;

    await sendEmail({
      to,
      subject: `Welcome to Staya Management, ${guestName}`,
      html: baseEmailWrapper(content, `Your Staya Management account is ready. Sign in to explore your dashboard.`),
    });

    return NextResponse.json({ success: true, message: "Welcome email sent" });
  } catch (error: unknown) {
    console.error("welcome email error:", error);
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

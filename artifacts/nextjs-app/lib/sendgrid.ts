import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "stayamanagement@gmail.com";
export const FROM_NAME = process.env.SENDGRID_FROM_NAME || "Staya Management";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    html,
    text: text || subject,
  };
  const response = await sgMail.send(msg);
  return response;
}

export function baseEmailWrapper(content: string, preheader = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Staya Management</title>
</head>
<body style="margin:0;padding:0;background-color:#F0EBE3;font-family:Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;color:#F0EBE3;">${preheader}</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0EBE3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(44,30,15,0.10);">
          <tr>
            <td style="background:linear-gradient(135deg,#2C1E0F 0%,#4A3520 100%);padding:40px 48px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C9A84C;">LUXURY VILLA MANAGEMENT</p>
              <h1 style="margin:0;font-family:Georgia,serif;font-size:32px;font-weight:700;color:#FFFFFF;letter-spacing:1px;">Staya Management</h1>
              <div style="margin:16px auto 0;width:48px;height:2px;background:#C9A84C;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:48px 48px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background:#2C1E0F;padding:32px 48px;text-align:center;">
              <div style="margin-bottom:16px;">
                <a href="mailto:stayamanagement@gmail.com" style="display:inline-block;margin:0 10px;font-family:Arial,sans-serif;font-size:12px;color:#C9A84C;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">Contact Us</a>
              </div>
              <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;color:#8B7355;line-height:1.6;">Staya Management · Luxury Villa Rentals · Bali, Indonesia</p>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#5C4A32;">© ${new Date().getFullYear()} Staya Management. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function goldDivider() {
  return `<div style="margin:28px 0;border:none;border-top:1px solid #E8DDD0;"></div>`;
}

export function detailRow(label: string, value: string) {
  return `<tr>
    <td style="padding:10px 0;font-family:Arial,sans-serif;font-size:12px;color:#8B7355;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;width:45%;vertical-align:top;">${label}</td>
    <td style="padding:10px 0;font-family:Arial,sans-serif;font-size:14px;color:#2C1E0F;font-weight:500;vertical-align:top;">${value}</td>
  </tr>`;
}

export function ctaButton(text: string, href: string) {
  return `<div style="text-align:center;margin:32px 0;">
    <a href="${href}" style="display:inline-block;background:#C9A84C;color:#2C1E0F;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;padding:14px 36px;border-radius:2px;">${text}</a>
  </div>`;
}

export function infoBox(content: string, bgColor = "#FBF8F3", borderColor = "#C9A84C") {
  return `<div style="background:${bgColor};border-left:3px solid ${borderColor};padding:20px 24px;margin:24px 0;border-radius:0 4px 4px 0;">
    ${content}
  </div>`;
}

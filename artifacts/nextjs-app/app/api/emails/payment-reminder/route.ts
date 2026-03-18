import { NextRequest, NextResponse } from "next/server";
import { sendEmail, baseEmailWrapper, goldDivider, detailRow, ctaButton, infoBox } from "@/lib/sendgrid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
      guestName,
      villaName,
      amountDue,
      currency = "USD",
      dueDate,
      bookingRef,
      paymentLink,
      isOverdue = false,
    } = body;

    if (!to || !guestName || !amountDue || !dueDate || !bookingRef) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const formattedDueDate = new Date(dueDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const daysUntilDue = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const urgencyColor = isOverdue ? "#C0392B" : daysUntilDue <= 3 ? "#E67E22" : "#C9A84C";
    const urgencyLabel = isOverdue ? "OVERDUE" : daysUntilDue <= 3 ? "DUE SOON" : "PAYMENT REMINDER";

    const content = `
      <h2 style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:600;color:#2C1E0F;line-height:1.3;">Payment ${isOverdue ? "Overdue" : "Reminder"}</h2>
      <p style="margin:0 0 24px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">Dear ${guestName},</p>
      <p style="margin:0 0 24px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#5C4A32;line-height:1.6;">
        ${isOverdue
          ? `We notice that your payment for <strong style="color:#2C1E0F;">${villaName}</strong> is now overdue. To protect your reservation, please arrange payment at your earliest convenience.`
          : `This is a friendly reminder that a payment is due for your upcoming stay at <strong style="color:#2C1E0F;">${villaName}</strong>.`
        }
      </p>

      ${infoBox(`
        <p style="margin:0 0 4px;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${urgencyColor};font-weight:600;">${urgencyLabel}</p>
        <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:32px;color:#2C1E0F;font-weight:700;">${currency} ${Number(amountDue).toLocaleString()}</p>
        <p style="margin:8px 0 0;font-family:'Inter',Arial,sans-serif;font-size:13px;color:#5C4A32;">Due by ${formattedDueDate}</p>
      `, "#FBF8F3", urgencyColor)}

      ${goldDivider()}

      <p style="margin:0 0 16px;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:600;">Booking Details</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Booking Reference", bookingRef)}
        ${villaName ? detailRow("Villa", villaName) : ""}
        ${detailRow("Amount Due", `${currency} ${Number(amountDue).toLocaleString()}`)}
        ${detailRow("Due Date", formattedDueDate)}
      </table>

      ${goldDivider()}

      ${ctaButton("Pay Now", paymentLink || "#")}

      ${infoBox(`
        <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;color:#5C4A32;line-height:1.7;">
          <strong style="color:#2C1E0F;">Payment Methods Accepted:</strong> Bank Transfer · Credit Card · PayPal<br/>
          If you have already made this payment, please disregard this notice or contact us with your transfer confirmation.
        </p>
      `, "#FBF8F3", "#E8DDD0")}

      <p style="margin:24px 0 0;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#5C4A32;line-height:1.7;">For payment assistance, contact us at <a href="mailto:stayamanagement@gmail.com" style="color:#C9A84C;text-decoration:none;">stayamanagement@gmail.com</a>.</p>
      <p style="margin:16px 0 0;font-family:'Playfair Display',Georgia,serif;font-size:16px;color:#2C1E0F;">Kind regards,<br/><em>The Staya Management Team</em></p>
    `;

    await sendEmail({
      to,
      subject: `${isOverdue ? "⚠️ Overdue" : "Payment Reminder"} – ${villaName} | Ref: ${bookingRef}`,
      html: baseEmailWrapper(content, `Payment of ${currency} ${Number(amountDue).toLocaleString()} due ${formattedDueDate}`),
    });

    return NextResponse.json({ success: true, message: "Payment reminder sent" });
  } catch (error: unknown) {
    console.error("payment-reminder email error:", error);
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

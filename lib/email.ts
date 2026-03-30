import { Resend } from "resend";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BETTER_AUTH_URL ||
  "http://divupstudio.online";

const logoUrl = new URL("/logo/email-logo.png", appUrl).toString();

type EmailPayload = {
  from: string;
  to: string[];
  subject: string;
  text?: string;
  html: string;
};

export async function sendEmail(payload: EmailPayload) {
  if (!resend) {
    console.warn(
      "RESEND_API_KEY is not configured. Skipping email send:",
      payload.subject
    );
    return null;
  }

  return resend.emails.send(payload);
}

export const emergencyContactHtml = `
  <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0; font-size: 12px; color: #6b7280; font-weight: 600;">Need assistance?</p>
    <p style="margin: 6px 0 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
      MR. ZAHIDUL ARIF<br />
      Officer, Brands &amp; Communication (Level 03)<br />
      Mobile: 01776555580
    </p>
  </div>
`;

export function renderEmailTemplate({
  title,
  greetingName,
  bodyHtml,
}: {
  title: string;
  greetingName: string;
  bodyHtml: string;
}) {
  return `
    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="${logoUrl}" alt="Scholars Transit Hub" style="height: 52px; width: auto;" />
      </div>
      <h2 style="color: #5C60DB; text-align: center;">${title}</h2>
      <p style="margin-bottom: 16px;">Dear ${greetingName},</p>
      ${bodyHtml}
      ${emergencyContactHtml}
      <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
        This is an automated message from Scholars Transit Hub. Please do not reply to this email.
      </p>
      <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">&copy; ${new Date().getFullYear()} Scholars Transit Hub. All rights reserved.</p>
    </div>
  `;
}

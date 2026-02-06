import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const logoUrl =
  "https://res.cloudinary.com/dweqw3mgx/image/upload/v1769302905/Scholars_Transit_Hub_Logo-Light_ldnwlf.png";

export const emergencyContactHtml = `
  <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0; font-size: 12px; color: #6b7280; font-weight: 600;">Emergency Contact</p>
    <p style="margin: 6px 0 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
      MR. ZAHIDUL ARIF<br />
      OFFICER, BRANDS &amp; COMMUNICATION (LEVEL : 03)<br />
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
        <img src="${logoUrl}" alt="Scholars Transit Hub" style="height: 50px; width: auto;" />
      </div>
      <h2 style="color: #5C60DB; text-align: center;">${title}</h2>
      <p>Hello ${greetingName},</p>
      ${bodyHtml}
      ${emergencyContactHtml}
      <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">&copy; ${new Date().getFullYear()} Scholars Transit Hub. All rights reserved.</p>
    </div>
  `;
}

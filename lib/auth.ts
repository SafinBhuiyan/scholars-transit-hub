import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { emailOTP } from "better-auth/plugins"
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    emailOTP({
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      expiresIn: 30,
      async sendVerificationOTP({ email, otp, type }) {
        console.log('--- SENDING OTP ---', { email, otp, type });
        try {
          const user = await prisma.user.findUnique({
            where: { email }
          });
          const name = user?.name || "Member";

          await resend.emails.send({
            from: 'Scholars Transit Hub <onboarding@resend.dev>',
            to: [email],
            subject: type === "forget-password" ? "Reset your password" : "Verify your email address",
            text: `Your verification code is ${otp}. It will expire in 10 minutes.`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #5b21b6;">${type === "forget-password" ? "Reset your password" : "Verify your email"}</h2>
                <p>Hello ${name},</p>
                <p>Thank you for using Scholars Transit Hub. Please use the following code for ${type.replace("-", " ")}:</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #5b21b6;">${otp}</span>
                </div>
                <p>This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="font-size: 12px; color: #6b7280;">&copy; ${new Date().getFullYear()} Scholars Transit Hub. All rights reserved.</p>
              </div>
            `,
          });
          console.log(`Verification OTP (${type}) sent to ${email}`);
        } catch (error) {
          console.error("Failed to send verification email:", error);
        }
      },
    })
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false, // cannot be set on signup
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return { data: { ...user, role: "USER" } };
        },
      },
    },
  },
});

export type Auth = typeof auth;
# ScholarsPass

ScholarsPass is a university transport management platform built with Next.js. It supports student and staff onboarding, transport pass applications, admin review workflows, route and pickup-point management, notices, file/document management, and payment collection for student transport passes.

## What This Project Does

There are two main user experiences:

- `USER`: sign up, verify email, submit a transport application, track status, receive notices, and complete payments when required
- `ADMIN`: manage users, routes, pickup points, applications, payments, notices, files/docs, semesters, and pass verification

Payment rules are role-aware:

- Students pay for transport passes through UddoktaPay
- Academic and administrative staff receive free passes
- Approved users receive a pass view and QR-based verification flow

## Stack

- Framework: Next.js 16 with App Router
- Language: TypeScript
- UI: React 19, Tailwind CSS 4, shadcn/ui, Radix UI
- Database: PostgreSQL(Neon)
- ORM: Prisma 7
- Authentication: Better Auth with email/password, Google OAuth, and email OTP verification
- Email: Resend
- Payments: UddoktaPay
- SMS Alert: BTCL SMS API(MRAM)
- Forms and validation: React Hook Form and Zod

## Project Structure

```text
app/                    App Router pages and API routes
app/api/                Route handlers for auth, applications, admin, payments, uploads, notices, webhooks
app/dashboard/          User dashboard pages
app/admin/dashboard/    Admin dashboard pages
components/             Feature components
components/ui/          Shared UI primitives
lib/                    Auth, Prisma, email, payment helpers, utilities
prisma/                 Prisma schema
plans/                  Project roadmap and implementation notes
public/                 Static assets
```

Helpful files to start with:

- `prisma/schema.prisma`
- `lib/auth.ts`
- `lib/prisma.ts`
- `lib/uddoktapay.ts`
- `app/dashboard/layout.tsx`
- `plans/PROJECT_COMPLETION_ROADMAP.md`

## Core Features

- Email/password authentication
- Google sign-in
- OTP-based email verification
- Role-based routing for `USER`, `ADMIN`, and `BANNED`
- Transport application flow with route and pickup point selection
- Admin application approval and rejection
- Route and pickup point management
- Semester management
- Files and docs management
- Notice publishing and read tracking
- Complaint / feedback submission and admin response workflow
- Student payment initiation and verification
- UddoktaPay webhook handling
- Admin payment review and updates
- Pass lookup and QR-assisted verification tools for admins

## Local Setup

### 1. Install dependencies

Use one package manager consistently. The repo currently includes both `package-lock.json` and `bun.lock`, so it is safest to standardize on one before team-wide work.

```bash
npm install
```

### 2. Configure environment variables

Create a local `.env` file with the values required by the app. Based on the source code and integration docs, you will need values for:

- PostgreSQL / Prisma database connection
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- Resend configuration
- UddoktaPay configuration
- App base URL
- Any SMS provider credentials used by the OTP endpoints
- Any upload/storage credentials used by the upload endpoints

Do not commit real secrets to the repository.

### 3. Prepare Prisma

```bash
npx prisma generate
npx prisma db push
```

The complaint / feedback feature adds a new Prisma model, so `db push` is required on environments that do not already have the latest schema.

If you are using migrations in your own workflow, replace `db push` with the appropriate migration command.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Main Routes

Public/auth routes:

- `/`
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/verify-email`

User area:

- `/dashboard`
- `/dashboard/apply`
- `/dashboard/pass`
- `/dashboard/payments`
- `/dashboard/notices`
- `/dashboard/complaint-feedback`
- `/dashboard/payment/success`
- `/dashboard/payment/cancel`

Admin area:

- `/admin/dashboard`
- `/admin/dashboard/applications`
- `/admin/dashboard/complaint-feedback`
- `/admin/dashboard/routes`
- `/admin/dashboard/payments`
- `/admin/dashboard/users`
- `/admin/dashboard/notices`
- `/admin/dashboard/passes`
- `/admin/dashboard/files-docs`
- `/admin/dashboard/settings`
- `/admin/dashboard/id-cards`

## API Surface

Important route groups under `app/api` include:

- `auth`
- `applications`
- `payments`
- `admin/*`
- `complaints`
- `notices`
- `upload`
- `sms`
- `webhooks/resend`
- `webhooks/uddoktapay`

## Current Status

The app has a substantial amount of real product functionality already implemented, especially around auth, admin workflows, database modeling, and payments.

Implemented recently:

- user dashboard now includes pass QR, notices, files/docs, and complaint/feedback access
- transport pass page is implemented for approved users
- admin pass lookup cards now include QR plus quick verification details
- complaint / feedback now has:
  - user submission and tracking
  - admin review and status updates
  - email alerts for submission and admin response
- files/docs uses PDF preview cards in both admin and user surfaces

Known gaps and follow-up areas:

- admin dashboard summary stats/charts still need stronger real data coverage in some areas
- profile management is still limited
- there is still no automated end-to-end test suite
- the public landing page is still not a polished production homepage
- this repo still contains both `package-lock.json` and `bun.lock`
- complaint alert emails require `COMPLAINT_ALERT_EMAILS` or similar env setup if team inbox alerts are desired


## Development Notes

- `app/page.tsx` currently points to a demo-style component entry, so the landing page is not yet a polished production homepage
- auth and role gating are handled server-side in layout/page logic
- Prisma client generation runs on `postinstall`
- `react-pdf` previews are client-only and used in files/docs cards and preview dialogs
- pass QR rendering is shared through `lib/pass.ts`

## Recommended Next Steps

If you are continuing development, the highest-value cleanup path is:

1. Add end-to-end coverage for signup -> apply -> approve -> pay -> pass -> verify
2. Complete profile management and any remaining user self-service flows
3. Improve admin dashboard reporting with more operational metrics
4. Standardize on a single package manager
5. Add a dedicated `.env.example` covering auth, payments, storage, email, and complaint alert settings


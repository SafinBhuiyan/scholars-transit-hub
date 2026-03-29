# Scholars Transit Hub

Scholars Transit Hub is a university transport management platform built with Next.js. It supports student and staff onboarding, transport pass applications, admin review workflows, route and pickup-point management, notices, file/document management, and payment collection for student transport passes.

## What This Project Does

There are two main user experiences:

- `USER`: sign up, verify email, submit a transport application, track status, receive notices, and complete payments when required
- `ADMIN`: manage users, routes, pickup points, applications, payments, notices, files/docs, semesters, and pass verification

Payment rules are role-aware:

- Students pay for transport passes through UddoktaPay
- Academic and administrative staff receive free passes

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
- Student payment initiation and verification
- UddoktaPay webhook handling
- Admin payment review and updates
- Pass lookup and verification tools for admins

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

If you are using migrations in your own workflow, replace `db push` with the appropriate migration command.

### 4. Run the app

```bash
npm dev
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
- `/dashboard/payments`
- `/dashboard/payment/success`
- `/dashboard/payment/cancel`

Admin area:

- `/admin/dashboard`
- `/admin/dashboard/applications`
- `/admin/dashboard/routes`
- `/admin/dashboard/payments`
- `/admin/dashboard/users`
- `/admin/dashboard/notices`
- `/admin/dashboard/passes`
- `/admin/dashboard/settings`
- `/admin/dashboard/id-cards`

## API Surface

Important route groups under `app/api` include:

- `auth`
- `applications`
- `payments`
- `admin/*`
- `notices`
- `upload`
- `sms`
- `webhooks/resend`
- `webhooks/uddoktapay`

## Current Status

The app has a substantial amount of real product functionality already implemented, especially around auth, admin workflows, database modeling, and payments.

Known areas still called out in the project roadmap:

- user dashboard still contains hardcoded/demo data in places
- admin dashboard stats and charts still need real database-backed values
- transport pass page is not fully implemented
- profile management is incomplete
- end-to-end test coverage is missing
- README and docs were previously under-documented

See `plans/PROJECT_COMPLETION_ROADMAP.md` and `plans/FINAL_IMPLEMENTATION_TASKS.md` for the current project notes.

## Development Notes

- `app/page.tsx` currently points to a demo-style component entry, so the landing page is not yet a polished production homepage
- `app/dashboard/page.tsx` still references `data.json`, which is a good candidate for cleanup
- auth and role gating are handled server-side in layout/page logic
- Prisma client generation runs on `postinstall`

## Recommended Next Steps

If you are continuing development, the highest-value cleanup path is:

1. Replace hardcoded dashboard data with real queries
2. Finish the transport pass flow
3. Complete profile management
4. Add integration or end-to-end tests for signup -> apply -> approve -> pay -> pass
5. Standardize on a single package manager and document the expected env vars in a dedicated example file

## Related Docs

- `plans/PROJECT_COMPLETION_ROADMAP.md`
- `plans/FINAL_IMPLEMENTATION_TASKS.md`
- `UDDOKTAPAY_INTEGRATION.md`
# Architecture

## High-Level Architecture

```text
Browser
  ->
Next.js App Router UI
  ->
Next.js Route Handlers (/api/*)
  ->
Prisma ORM
  ->
PostgreSQL (Neon)

External integrations:
- Better Auth
- UddoktaPay
- Resend
- MRAM SMS API
- Cloudinary
- Google Analytics Data API
```

## Main Layers

## Presentation Layer

- `app/` pages and layouts
- `components/` UI and feature components
- user dashboard pages under `app/dashboard/`
- admin dashboard pages under `app/admin/dashboard/`

## Application Layer

- route handlers under `app/api/`
- auth helpers under `lib/auth.ts` and `lib/auth-client.ts`
- payment helpers under `lib/uddoktapay.ts`
- pass computation under `lib/pass.ts`
- notices and complaint-related helpers under `lib/`

## Data Layer

- Prisma schema in `prisma/schema.prisma`
- PostgreSQL database hosted on Neon

## External Service Usage

### Better Auth
- email/password login
- Google social login
- email OTP verification
- email OTP password reset

### UddoktaPay
- creates checkout session
- verifies payment by invoice ID
- updates payment state through webhook flow

### Resend
- sends verification and password-reset related emails through Better Auth plugin
- sends role update, complaint, application, and payment request emails

### MRAM SMS API
- sends phone OTP for transport application verification

### Cloudinary
- stores uploaded ID card images
- stores PDF files and documents

### Google Analytics Data API
- provides visitor analytics for reporting endpoints

## Design Observations

- the project uses route handlers instead of a separate backend service
- dashboard pages rely heavily on server-side session checks and Prisma queries
- pass rendering is derived from application and payment records rather than a dedicated pass model
- upload, payment, and notification flows are integrated into operational dashboards instead of isolated modules

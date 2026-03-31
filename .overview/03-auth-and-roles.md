# Authentication And Roles

## Authentication Methods

Implemented in `lib/auth.ts` and client-side auth forms:

- email and password signup
- email and password login
- Google OAuth login
- email OTP verification
- password reset using email OTP

## Auth Storage

Better Auth uses Prisma-backed models:

- `User`
- `Session`
- `Account`
- `Verification`

## Email Verification

The Better Auth `emailOTP` plugin is configured to:

- send verification OTP on signup
- send password-reset OTP for `forget-password`
- use custom Resend-powered email templates
- expire OTP in 10 minutes

## Phone Verification

Phone OTP is separate from Better Auth and is used only for transport applications.

Flow:

1. User enters phone number
2. `/api/sms/send-otp` generates a 6-digit OTP
3. OTP is stored in `Verification` with identifier format `otp_<phone>`
4. MRAM SMS API sends the message
5. `/api/sms/verify-otp` validates and consumes the OTP

## Roles

### `USER`

Standard applicant-facing role. Can:

- use dashboard
- submit transport application
- initiate payments for owned records
- view notices and files
- submit complaints

### `ADMIN`

Administrative role. Can access management endpoints and admin dashboard features.

### `BANNED`

Restricted role. The login flow redirects banned users to `/banned`.

## Authorization Pattern

Most protected APIs use:

```text
auth.api.getSession({ headers: await headers() })
```

Then enforce one of:

- authenticated user required
- `session.user.role === "USER"`
- `session.user.role === "ADMIN"`

## Important Role Truth

Applicant type is not the same as login role.

Example:
- a student, academic staff member, and administrative staff member all log in as `USER`
- payment and pass rules are decided using `TransportApplication.applicantType`

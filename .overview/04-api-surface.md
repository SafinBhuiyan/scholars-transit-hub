# API Surface

This file lists the real route-handler endpoints discovered in the codebase.

## Auth

- `GET/POST /api/auth/[...all]`
- `GET /api/auth/get-session`
- `POST /api/auth/delete-unverified-user`

Used with Better Auth client flows for:

- sign up
- sign in
- Google social sign in
- send verification OTP
- verify email OTP
- send password reset OTP
- reset password

## User-Facing APIs

### Applications

- `POST /api/applications`
- `GET /api/applications`

### Payments

- `POST /api/payments/initiate`
- `POST /api/payments/verify`

### Routes

- `GET /api/routes/public`

### Notices

- `GET /api/notices`
- `POST /api/notices` for admin creation
- `PUT /api/notices/[id]`
- `DELETE /api/notices/[id]`
- `POST /api/notices/[id]/publish`
- `POST /api/notices/[id]/read`

### Complaints

- `GET /api/complaints`
- `POST /api/complaints`

### Upload And OTP

- `POST /api/upload`
- `POST /api/sms/send-otp`
- `POST /api/sms/verify-otp`

## Admin APIs

### Applications

- `PATCH /api/admin/applications/[id]/status`
- `POST /api/admin/applications/[id]/payment-request`

### Routes And Pickup Points

- `GET/POST /api/admin/routes`
- `PATCH/DELETE /api/admin/routes/[id]`
- `POST /api/admin/routes/[id]/pickups`
- `PATCH/DELETE /api/admin/pickups/[id]`
- `POST /api/admin/pickups/reorder`

### Payments

- `GET /api/admin/payments`
- `POST /api/admin/payments/create`
- `PATCH/DELETE /api/admin/payments/[id]`
- `GET /api/admin/payments/[id]/uddoktapay`

### Pass Search

- `GET /api/admin/passes`

### Users

- `GET /api/admin/users`
- `GET /api/admin/users/search`
- `PATCH /api/admin/users/[id]/role`

### Semesters

- `GET/POST /api/admin/semesters`
- `PATCH/DELETE /api/admin/semesters/[id]`

### Complaints

- `GET /api/admin/complaints`
- `PATCH /api/admin/complaints/[id]`

### Files And Categories

- `GET/POST/DELETE /api/admin/files-docs`
- `GET/POST /api/admin/files-doc-categories`
- `PATCH/DELETE /api/admin/files-doc-categories/[id]`

## Webhooks And Analytics

- `POST /api/webhooks/uddoktapay`
- `POST /api/webhooks/resend`
- `GET /api/analytics/visitors`

## Important Notes

- there is no dedicated REST endpoint that returns a standalone persisted pass record
- pass data is assembled on server-rendered dashboard pages using Prisma queries and `lib/pass.ts`
- admin application listing is mostly performed in server-side dashboard pages rather than through a single list API endpoint

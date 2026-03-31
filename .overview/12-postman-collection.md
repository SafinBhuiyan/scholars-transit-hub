# Postman Collection Summary

This file summarizes the real ScholarsPass API groups in a Postman-friendly format. It is intended to help you build or verify an importable collection using the implemented route handlers.

## Base URL

Use a collection variable such as:

```text
{{baseUrl}} = http://localhost:3000
```

## Authentication Notes

- ScholarsPass uses session-based authentication.
- Admin and user APIs depend on the authenticated session cookie.
- Better Auth endpoints are exposed through `/api/auth/[...all]`.
- Google OAuth is redirect-based and is not ideal for direct Postman testing.

## Suggested Postman Folder Structure

## 1. Auth

- `POST /api/auth/sign-up/email`
- `POST /api/auth/sign-in/email`
- `GET /api/auth/get-session`
- `POST /api/auth/email-otp/send-verification-otp`
- `POST /api/auth/email-otp/verify-email`
- `POST /api/auth/email-otp/reset-password`
- `POST /api/auth/delete-unverified-user`

## 2. OTP And Upload

- `POST /api/sms/send-otp`
- `POST /api/sms/verify-otp`
- `POST /api/upload`

## 3. User Application

- `GET /api/routes/public`
- `POST /api/applications`
- `GET /api/applications`

## 4. User Payments

- `POST /api/payments/initiate`
- `POST /api/payments/verify`

## 5. Notices

- `GET /api/notices`
- `POST /api/notices`
- `PUT /api/notices/[id]`
- `DELETE /api/notices/[id]`
- `POST /api/notices/[id]/publish`
- `POST /api/notices/[id]/read`

## 6. Complaints

- `GET /api/complaints`
- `POST /api/complaints`
- `GET /api/admin/complaints`
- `PATCH /api/admin/complaints/[id]`

## 7. Admin Applications

- `PATCH /api/admin/applications/[id]/status`
- `POST /api/admin/applications/[id]/payment-request`

## 8. Admin Routes And Pickups

- `GET /api/admin/routes`
- `POST /api/admin/routes`
- `PATCH /api/admin/routes/[id]`
- `DELETE /api/admin/routes/[id]`
- `POST /api/admin/routes/[id]/pickups`
- `PATCH /api/admin/pickups/[id]`
- `DELETE /api/admin/pickups/[id]`
- `POST /api/admin/pickups/reorder`

## 9. Admin Payments

- `GET /api/admin/payments`
- `POST /api/admin/payments/create`
- `PATCH /api/admin/payments/[id]`
- `DELETE /api/admin/payments/[id]`
- `GET /api/admin/payments/[id]/uddoktapay`

## 10. Admin Users

- `GET /api/admin/users`
- `GET /api/admin/users/search`
- `PATCH /api/admin/users/[id]/role`

## 11. Admin Semesters

- `GET /api/admin/semesters`
- `POST /api/admin/semesters`
- `PATCH /api/admin/semesters/[id]`
- `DELETE /api/admin/semesters/[id]`

## 12. Admin Files And Categories

- `GET /api/admin/files-docs`
- `POST /api/admin/files-docs`
- `DELETE /api/admin/files-docs`
- `GET /api/admin/files-doc-categories`
- `POST /api/admin/files-doc-categories`
- `PATCH /api/admin/files-doc-categories/[id]`
- `DELETE /api/admin/files-doc-categories/[id]`

## 13. Admin Pass Lookup

- `GET /api/admin/passes`

## 14. Webhooks And Analytics

- `POST /api/webhooks/uddoktapay`
- `POST /api/webhooks/resend`
- `GET /api/analytics/visitors`

## Recommended Collection Variables

- `baseUrl`
- `applicationId`
- `paymentId`
- `invoiceId`
- `routeId`
- `pickupId`
- `noticeId`
- `semesterId`
- `userId`
- `complaintId`
- `publicId`

## Important Implementation Truths

- There is no dedicated API that returns a persisted `Pass` record.
- The pass page is rendered from application and payment data plus computed pass logic.
- Admin application listing is mostly server-rendered in dashboard pages, while status and payment-request actions use APIs.
- The strongest student payment flow is `approve application -> create payment request -> initiate payment -> verify payment/webhook`.

## Recommended Testing Order

1. Register or log in
2. Verify email if needed
3. Send and verify phone OTP
4. Upload ID card
5. Fetch public routes
6. Submit application
7. Approve application as admin
8. Create payment request as admin for student
9. Initiate payment as user
10. Verify payment or simulate webhook
11. Check dashboard pass behavior in the app

## Gaps To Remember During Testing

- Google OAuth is browser-based, so Postman is not the best tool for that path.
- Session-based auth means you may need to reuse cookies instead of bearer tokens.
- Some admin list data is rendered directly in pages and does not exist as a matching list API.

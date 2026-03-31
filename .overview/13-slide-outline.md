# ScholarsPass Slide Outline

## Slide 1: Title

**ScholarsPass**  
University Transport Pass Management System

- Final Year Project
- Web-based transport application, approval, payment, and pass verification platform
- Built for university transport administration

## Slide 2: Problem Statement

- Manual transport pass processing is slow and inconsistent
- Route and pickup-point assignment is difficult to manage centrally
- Student fee collection is hard to track reliably
- Transport eligibility is difficult to verify at the point of use
- Notices, files, and complaints are often managed through disconnected channels

## Slide 3: Project Goal

- Digitize the complete transport lifecycle
- Centralize transport administration in one platform
- Allow users to apply, pay if required, and access passes online
- Give admins full control over approval, routes, payments, and communication

## Slide 4: Core Workflow

```text
Application -> Approval -> Payment (students only) -> Pass Activation -> QR Usage
```

- User submits transport application
- Admin reviews and approves or rejects
- Student completes payment
- Pass becomes active
- QR is shown for transport verification

## Slide 5: User Roles

### Platform Roles

- `USER`
- `ADMIN`
- `BANNED`

### Applicant Categories Inside Application

- `STUDENT`
- `ACADEMIC`
- `ADMINISTRATIVE`

Presentation note:
- All applicants log in as `USER`
- Payment logic depends on applicant type, not login role

## Slide 6: Main Features

- email/password and Google login
- email OTP verification
- phone OTP verification during application
- route and pickup-point selection
- admin approval and rejection
- student payment integration
- QR-based pass page
- notice management
- files and document management
- complaint and feedback workflow

## Slide 7: Student Flow

```text
Register/Login
-> Verify Email
-> Verify Phone
-> Apply for Transport
-> WAITLIST
-> APPROVED
-> Payment Pending
-> Payment Verified
-> Active Pass
```

- students require payment
- pass becomes active only after approval and successful payment

## Slide 8: Staff Flow

```text
Register/Login
-> Verify Email
-> Verify Phone
-> Apply for Transport
-> WAITLIST
-> APPROVED
-> Active Pass
```

- academic and administrative applicants do not pay
- approval alone activates pass access

## Slide 9: Admin Flow

- review applications
- approve or reject applicants
- set semester and payment amount for students
- manage routes and pickup points
- publish notices
- upload files and documents
- review complaints
- manage user roles

## Slide 10: System Architecture

```text
Client
-> Next.js Frontend
-> Next.js API Route Handlers
-> Prisma ORM
-> PostgreSQL

External Services:
- Better Auth
- UddoktaPay
- Resend
- MRAM SMS API
- Cloudinary
```

## Slide 11: Technology Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM
- PostgreSQL (Neon)
- Better Auth
- UddoktaPay
- Resend
- MRAM SMS API
- Cloudinary

## Slide 12: Database Design

Core tables:

- `User`
- `TransportApplication`
- `Route`
- `PickupPoint`
- `Payment`
- `Semester`
- `Notice`
- `UserNotice`
- `FilesDoc`
- `FilesDocCategory`
- `Complaint`

Presentation note:
- There is no standalone `Pass` table
- Pass information is computed from application and payment state

## Slide 13: Payment System

- only students require payment
- admin creates payment request after approval
- user initiates payment through UddoktaPay
- system verifies payment through verify endpoint and webhook
- client-side success page is not trusted alone

## Slide 14: QR Pass Logic

- pass ID is generated from application data
- QR includes:
  - pass ID
  - application ID
  - user ID
  - route
  - pickup point
  - issued time
- QR becomes available only when pass is active

## Slide 15: Security Features

- session-based authentication
- role-based admin authorization
- phone OTP expires in 10 minutes
- payment ownership validation
- gateway verification before confirming payment
- upload size and type restrictions
- duplicate student ID prevention

## Slide 16: Supporting Modules

- notices with role or user targeting
- user read tracking for notices
- files and docs management
- complaint, feedback, and suggestion handling
- role update notifications

## Slide 17: Challenges And Solutions

### Challenge 1
- Different business rules for students and staff
- Solution: applicant type stored in application

### Challenge 2
- Payment confirmation cannot rely on frontend redirect
- Solution: use verify endpoint and webhook

### Challenge 3
- Need transport pass without duplicate storage
- Solution: compute pass state from application and payment data

### Challenge 4
- Need ordered pickup points
- Solution: route-specific pickup ordering with reorder API

## Slide 18: Future Improvements

- dedicated QR scan interface for transport operators
- audit logs for admin actions
- end-to-end automated testing
- profile management improvements
- transport analytics and reporting dashboards
- mobile app support

## Slide 19: Conclusion

- ScholarsPass is a real full-stack transport management platform
- It digitizes application, approval, payment, and pass access
- It supports both operations and communication
- It is suitable for real institutional use and academic defense

## Slide 20: Viva Backup Notes

Keep these ready if asked:

- There is no `Pass` table in the database
- `WAITLIST`, `APPROVED`, `REJECTED` are stored application statuses
- `ACTIVE` and `PAYMENT_PENDING` are derived business states
- Only students pay
- Staff passes become active after approval

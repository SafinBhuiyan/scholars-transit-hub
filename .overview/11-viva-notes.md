# Viva Notes

## Critical Clarifications

- There is no supervisor role in the system.
- There is no standalone `Pass` table in the database.
- Pass status is computed from application status and payment state.
- `WAITLIST`, `APPROVED`, and `REJECTED` are real stored application statuses.
- `PAYMENT_PENDING` and `ACTIVE` are explanation-friendly business states, not Prisma enums.
- Only students require payment.
- Academic and administrative staff receive a pass after approval without payment.

## Strong Answers To Likely Questions

### Why did you not create a separate pass table?

The current implementation computes pass state from existing application and payment records. This avoids duplicated data and prevents pass records from becoming inconsistent with approval or payment changes.

### How do you ensure payment is genuine?

The system does not trust the client-side success page. It verifies payment through UddoktaPay verification and also supports webhook-based status updates before treating payment as completed.

### How is QR data generated?

QR data is generated at runtime from the approved application and includes pass ID, application ID, user ID, applicant details, route, pickup point, and issued timestamp.

### Why is applicant type separate from account role?

Because all regular applicants use the same dashboard experience as `USER`, while business rules such as payment eligibility depend on whether the transport application belongs to a student, academic staff member, or administrative staff member.

### What modules make the project more than just a basic CRUD app?

- payment gateway integration
- email OTP and password reset
- phone OTP verification
- QR pass generation
- route and pickup ordering
- notice targeting and read tracking
- complaint resolution workflow
- files and document management

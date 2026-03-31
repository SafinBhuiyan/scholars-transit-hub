# User Flows

## Student Flow

```text
Sign up / Login
-> Verify email
-> Open application form
-> Verify phone by SMS OTP
-> Upload ID card
-> Select route and pickup point
-> Submit application
-> Application status = WAITLIST

Admin decision:
- REJECTED -> flow ends
- WAITLIST -> keep waiting
- APPROVED -> continue

If applicantType = STUDENT:
-> Admin creates payment request
-> Business state = PAYMENT_PENDING
-> Student opens payment page
-> Initiates UddoktaPay checkout
-> Payment verified by gateway API or webhook
-> Payment status = PAID
-> Business state = ACTIVE
-> Pass page shows QR
```

## Academic Or Administrative Flow

```text
Sign up / Login
-> Verify email
-> Open application form
-> Verify phone by SMS OTP
-> Upload ID card
-> Select route and pickup point
-> Submit application
-> Application status = WAITLIST

Admin decision:
- REJECTED -> flow ends
- APPROVED -> no payment required
-> Business state = ACTIVE
-> Pass page shows QR
```

## Admin Flow

```text
Login as ADMIN
-> Review submitted applications
-> Check applicant details, route, pickup point, and ID card
-> Set status to WAITLIST, APPROVED, or REJECTED

For approved student:
-> Select semester and amount
-> Create payment request
-> Monitor payment list
-> Optionally verify or manually update payment

Parallel admin work:
-> Manage routes and pickup points
-> Publish notices
-> Upload files and docs
-> Review complaints
-> Manage user roles
```

## Stored States Vs Derived States

### Stored database states

- Application: `WAITLIST`, `APPROVED`, `REJECTED`
- Payment: `PENDING`, `PAID`, `FAILED`, `REFUNDED`

### Derived business states used for explanation

- `PAYMENT_PENDING`
  - approved student with no successful payment yet
- `ACTIVE`
  - approved academic/administrative applicant
  - or approved student with at least one paid payment

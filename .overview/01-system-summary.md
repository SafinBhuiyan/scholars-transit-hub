# System Summary

## Project Name

ScholarsPass: University Transport Pass Management System

## Purpose

ScholarsPass digitizes the university transport lifecycle from application to pass usage. It replaces manual coordination with a web-based system where users can apply for transport service, select routes and pickup points, receive status updates, complete payment when required, and access a QR-based pass.

## Implemented Roles

- `ADMIN`
- `USER`
- `BANNED`

Applicant categories are stored in transport applications, not as separate login roles:

- `STUDENT`
- `ACADEMIC`
- `ADMINISTRATIVE`

## Core Lifecycle

```text
Application -> Admin Review -> Approval -> Payment (students only) -> Pass Activation -> QR Usage
```

## Main User Capabilities

- create account and verify email
- sign in with email/password or Google
- verify phone number by SMS OTP during application
- upload ID card image
- select route and pickup point
- submit transport application
- view payment requests
- access pass page and QR code
- receive notices
- view files and documents
- submit complaints, feedback, and suggestions

## Main Admin Capabilities

- review applications
- approve, reject, or keep on waitlist
- create payment requests for approved students
- view and manually update payments
- manage routes and pickup points
- reorder pickup points within a route
- manage semesters
- manage notices
- manage users and roles
- manage complaints and responses
- upload and organize files and documents

## Key Business Rules

- only students require payment
- academic and administrative applicants receive free passes after approval
- a pass becomes active only when approval and payment conditions are satisfied
- duplicate student IDs are blocked during application creation
- users cannot maintain multiple active applications in `WAITLIST` or `APPROVED`
- client-side payment success is not trusted without gateway verification

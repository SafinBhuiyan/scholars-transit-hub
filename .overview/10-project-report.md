# Project Report Draft

## Introduction

ScholarsPass is a web-based university transport pass management system built to digitize application processing, transport assignment, administrative review, student fee collection, and QR-based transport pass usage. The system addresses the operational inefficiencies of manual transport administration by providing a centralized dashboard for both applicants and administrators.

## Problem Statement

Universities that manage transport manually often face delays in approval processing, inconsistent record keeping, route assignment confusion, weak payment traceability, and difficulty verifying transport eligibility at the point of service. ScholarsPass solves these problems by combining application management, route control, payment verification, pass access, notices, and complaint handling in one system.

## Objectives

- digitize transport pass applications
- centralize route and pickup-point management
- allow administrators to approve or reject applications
- require payment only for students
- activate passes only after required conditions are met
- support QR-based verification
- improve transport communication through notices and files

## System Overview

ScholarsPass serves two main platform roles: `USER` and `ADMIN`. Within the `USER` role, transport-specific applicant type is stored as `STUDENT`, `ACADEMIC`, or `ADMINISTRATIVE`. This allows the system to enforce student-only payment rules while keeping a consistent dashboard entry point for all applicants.

## Major Features

- email/password and Google authentication
- email OTP verification and password reset
- phone OTP verification during application
- transport application with route and pickup-point selection
- admin approval and rejection workflow
- semester-based payment requests for students
- gateway payment initiation and verification
- QR-based pass view
- notice management and read tracking
- files and document distribution
- complaint and feedback workflow

## Technology Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS and shadcn/ui
- Prisma ORM
- PostgreSQL on Neon
- Better Auth
- UddoktaPay
- Resend
- MRAM SMS API
- Cloudinary

## Database Design

The data model is centered around `User`, `TransportApplication`, `Route`, `PickupPoint`, and `Payment`, with supporting modules for notices, documents, complaints, sessions, and verification codes.

One important architectural detail is that the system does not store a standalone `Pass` table. Pass identity and activation are computed from application approval and payment status.

## Security Considerations

- protected endpoints require session validation
- admin APIs enforce admin role checks
- phone OTP expires and is deleted after verification
- payment ownership is checked before user-side initiation and verification
- payment confirmation is verified through gateway APIs and webhook processing
- uploads are restricted by file type and size

## Conclusion

ScholarsPass is a realistic full-stack university management system focused on transport administration. It combines modern web development practices with domain-specific workflows such as approval, payment, and QR-based pass access, making it appropriate for final year project demonstration and technical defense.

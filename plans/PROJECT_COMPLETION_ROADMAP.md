# Scholars Transit Hub - Project Completion Roadmap

## Project Status Overview

This document outlines the current state of the Scholars Transit Hub project and provides a roadmap to completion.

---

## User Flows by Role

### USER (Student/Staff) Flow

```
1. Sign Up
   ├─ Visit /signup
   ├─ Enter email, password, name
   ├─ Verify email via OTP
   └─ Login to dashboard

2. Apply for Transport Pass
   ├─ Visit /dashboard/apply
   ├─ Select applicant type (Student/Academic/Administrative)
   ├─ Enter personal details (name, department, batch, student ID)
   ├─ Verify phone via SMS OTP
   ├─ Upload ID card image
   ├─ Select route and pickup point
   └─ Submit application (status: WAITLIST)

3. View Application Status
   ├─ Visit /dashboard
   ├─ View current application status
   └─ Receive notifications

4. Make Payment (Students only)
   ├─ Admin creates payment request
   ├─ Visit /dashboard/payments
   ├─ Click "Pay Now"
   ├─ Redirect to UddoktaPay
   ├─ Complete payment
   └─ Return to success/cancel page

5. View Transport Pass
   ├─ Application approved + payment paid (if student)
   ├─ Visit /dashboard/pass
   └─ View/download transport pass with QR code

6. Profile Management
   ├─ Visit /dashboard/profile
   ├─ View profile details
   └─ Edit profile information
```

### ADMIN Flow

```
1. Login
   ├─ Visit /login
   ├─ Authenticate with email/password or Google
   └─ Redirect to admin dashboard

2. Dashboard Overview
   ├─ View statistics (applications, payments, users)
   ├─ View charts and analytics
   └─ Access quick actions

3. Manage Routes
   ├─ Visit /admin/dashboard/routes
   ├─ Create new routes (name, capacity, times)
   ├─ Add/edit/delete pickup points
   ├─ Reorder pickup points via drag-and-drop
   └─ Activate/deactivate routes

4. Manage Applications
   ├─ Visit /admin/dashboard/applications
   ├─ View all applications
   ├─ Filter by status (WAITLIST, APPROVED, REJECTED)
   ├─ View application details
   ├─ Approve/reject applications
   ├─ Create payment request for approved students
   └─ Send to payment

5. Manage Payments
   ├─ Visit /admin/dashboard/payments
   ├─ View all payments
   ├─ Filter by status (PENDING, PAID, FAILED, REFUNDED)
   ├─ View payment details
   ├─ Update payment status manually
   └─ Process refunds

6. Manage Notices
   ├─ Visit /admin/dashboard/notices
   ├─ Create new notices
   ├─ Publish/unpublish notices
   ├─ Target specific roles or users
   └─ Pin important notices

7. Manage Users
   ├─ Visit /admin/dashboard/users
   ├─ View all users
   ├─ Search users
   └─ Change user roles (USER, ADMIN)

8. Semester Management
   ├─ Configure academic semesters
   └─ Set semester for payment periods
```

---

## Current Implementation Status

### ✅ FULLY IMPLEMENTED

| Feature | Status | Details |
|---------|--------|---------|
| Authentication | Complete | Email/password + Google OAuth + OTP verification via Resend |
| Database Schema | Complete | PostgreSQL with Prisma - User, Route, PickupPoint, TransportApplication, Payment, Semester, Notice, FilesDoc, FilesDocCategory models |
| User Roles | Complete | USER and ADMIN roles |
| Application Form | Complete | Full form with phone OTP verification, route selection, pickup point |
| Admin Dashboard | Complete | Routes management, pickup points, applications, payments, notices |
| Payment Integration | Complete | UddoktaPay gateway - students pay, staff free |
| Notices System | Complete | Create, publish, read tracking |
| Email System | Complete | Resend integration for verification emails |
| UI Components | Complete | shadcn/ui components |
| Files & Docs | Complete | PDF-only uploads, Cloudinary-backed storage, database categories, admin list/upload/delete UI |
| ID Cards Gallery | Complete | Admin gallery backed by `transport_application.idCardUrl` |
| Pass Scan | Complete | Admin pass lookup and verification screen on `/admin/dashboard/passes` |
| Settings Management | Complete | Semester management plus dynamic Files & Docs categories, delete confirmation, responsive layout |
| Production Build | Complete | `bun run build` passes successfully |

### ⚠️ PARTIALLY IMPLEMENTED / DUMMY

| Feature | Status | Details |
|---------|--------|---------|
| Student Dashboard | Dummy | Uses hardcoded data.json instead of real data |
| Admin Dashboard Stats | Dummy | Uses hardcoded data.json instead of real stats |
| Transport Pass | Dummy | Empty placeholder page |
| Profile Page | Dummy | Empty placeholder page |
| Charts | Dummy | Uses hardcoded data.json |

### New Features to Implement

| Feature | Description | Priority |
|---------|-------------|----------|
| Resources Page | Replace "Data Library" with "Resources" page | HIGH |
| Dashboard Stats | Replace hardcoded dashboard stats with real database queries | HIGH |
| Student Dashboard | Replace `data.json` with real application/pass data | HIGH |
| Transport Pass | Build the printable/downloadable pass page | HIGH |
| Profile Page | Add editable profile and application history | MEDIUM |
| Notifications | Expand SMS/email notifications beyond current verification flows | MEDIUM |
| Testing | Add end-to-end coverage for signup → apply → approve → pay → pass | HIGH |
| Cleanup | Remove leftover dummy data sources and dead UI paths | MEDIUM |

---

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma 7
- **Auth**: Better Auth + Email OTP
- **Payment**: UddoktaPay Gateway
- **Email**: Resend
- **SMS**: MRAM
- **UI**: shadcn/ui + Tailwind CSS
- **Forms**: React Hook Form + Zod

---

## Roadmap to Completion

### Phase 1: Fix Dashboard Data (Priority: HIGH)

1. **Student Dashboard**
   - Remove data.json dependency
   - Fetch real application data from API
   - Show user's current application status
   - Display transport pass information

2. **Admin Dashboard**
   - Replace data.json with real statistics
   - Fetch actual counts: total applications, pending, approved, payments
   - Connect charts to real data
   - Keep the existing admin content pages for Files & Docs, ID Cards, and Settings

### Phase 2: Complete Core Features (Priority: HIGH)

3. **Transport Pass Generation**
   - Create pass component with user details
   - Generate QR code for verification
   - Show route and pickup point information
   - Add printable version

4. **Profile Management**
   - Allow users to edit name
   - View application history
   - Change password functionality

### Phase 3: Notifications & Polish (Priority: MEDIUM)

6. **SMS Notifications**
   - Connect to payment webhooks
   - Send payment confirmation SMS
   - Send application status updates

7. **Email Notifications**
   - Payment request emails to students
   - Application approval/rejection emails
   - Payment confirmation emails

### Phase 4: Testing & Deployment (Priority: HIGH)

8. **Testing**
   - Test complete user flow: signup → apply → admin approve → payment → view pass
   - Test payment webhook integration
   - Test email delivery
   - Test role-based access

9. **Production Deployment**
   - Update environment variables for production
   - Set up proper database
   - Deploy to Vercel
   - Re-run build verification after deployment config changes

---

## Implementation Steps

### Step 1: Update Student Dashboard
```
- Fetch user's application: GET /api/applications/me
- Display application status card
- Show transport pass if approved
- Remove data.json import
```

### Step 2: Update Admin Dashboard
```
- Create stats API: GET /api/admin/stats
- Show real counts: applications, payments, users
- Connect charts to real data
```

### Step 3: Build Transport Pass Page
```
- GET /api/applications/me returns user's approved application
- Display pass card with: name, route, pickup point, validity
- Add QR code generation
- Add print/download button
```

### Step 4: Build Profile Page
```
- GET /api/auth/get-session for user data
- Form to update name
- View application history
```

### Step 5: Implement Supervisor Features
```
- Define what supervisors can do
- Create supervisor-specific API endpoints
- Build supervisor dashboard UI
```

---

## Recommended Execution Order

1. Prisma setup: `npx prisma generate && npx prisma db push`
2. Fix student dashboard to show real data
3. Fix admin dashboard to show real stats
4. Implement transport pass page
5. Implement profile page
6. Add notifications
7. Test end-to-end flow
8. Deploy to production

---

## Notes

- The project is approximately **85% complete**
- Core features (auth, application, payment) are working
- Main gaps are in dashboard statistics, transport pass generation, and replacing the remaining dummy dashboard data
- Files & Docs, ID Cards, and Settings admin tools are now implemented and aligned with the Prisma schema
- The Files & Docs upload flow is restricted to PDFs and uses the database-backed category system
- The admin pass lookup screen now handles the scan/verification workflow that used to be planned for supervisor access
- The build is currently green, so remaining work is feature completion rather than stabilization

---

*Last Updated: 2026-03-26*

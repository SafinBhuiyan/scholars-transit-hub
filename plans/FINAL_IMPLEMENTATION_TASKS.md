# Final Project Completion Tasks

This document contains actionable tasks to complete the project. Use this as a checklist to fast-forward the process.

## 🚀 Priority 1: Dynamic Dashboards

- [ ] **Student Dashboard (`app/dashboard/page.tsx`)**
    - [ ] Remove `import data from "./data.json"`
    - [ ] Fetch the user's application using `prisma.transportApplication.findFirst` (Server Component)
    - [ ] Show a "Status Card" (Waitlist, Approved, Rejected)
    - [ ] If status is **APPROVED** and student needs to pay: Show "Pay Now" button linking to `/dashboard/payment`
    - [ ] If status is **PAID**: Show "View Transport Pass" button linking to `/dashboard/pass`

- [ ] **Admin Dashboard Statistics (`app/admin/dashboard/page.tsx`)**
    - [ ] Implement Prisma aggregations to replace mock stats in `SectionCards`:
        - [ ] Total Applications count
        - [ ] Pending Applications count
        - [ ] Total Revenue (Sum of `PAID` payments)
        - [ ] Active Users count
    - [ ] Connect `ChartAreaInteractive` to real database trends (grouped by month/day)
    - [ ] Replace `data.json` for the main dashboard table with a summary of recent activity

## 🎫 Priority 2: Transport Pass & Profile

- [ ] **Transport Pass Page (`app/dashboard/pass/page.tsx`)**
    - [ ] Create a high-quality printable pass UI
    - [ ] Generate a QR code using `lucide-react` or similar (pointing to a verification URL)
    - [ ] Include details: Name, Photo, Route, Pickup Point, Semester, Validity Period
    - [ ] Add a "Print Pass" button

- [ ] **Profile Management (`app/dashboard/profile/page.tsx`)**
    - [ ] Display user's profile information
    - [ ] Add a form to edit `name` and `phone`
    - [ ] Show a table of "Previous Applications" and "Payment History"

## 🔔 Priority 3: Notifications & Polish

- [ ] **Automated Notifications**
    - [ ] Trigger an SMS (using MRAM) when an application is Approved/Rejected
    - [ ] Trigger an Email (using Resend) when a payment is successful
    - [ ] Add a "Notice" automatically to the user's dashboard when status changes

- [ ] **Code Cleanup**
    - [ ] Delete `app/dashboard/data.json`
    - [ ] Remove all hardcoded stats from UI components
    - [ ] Ensure all "Dummy" or "Placeholder" text is removed from the frontend

## ✅ Final Verification

- [ ] [ ] Test entire flow: Sign up -> Phone OTP -> Apply -> Admin Dashboard Approve -> Student Dashboard Pay -> View Pass
- [ ] [ ] Build verification: `bun run build`

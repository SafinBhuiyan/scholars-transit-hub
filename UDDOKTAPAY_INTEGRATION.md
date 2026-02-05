# UddoktaPay Payment Gateway Integration

## Overview
Successfully integrated UddoktaPay payment gateway for student transport pass payments. Academic and administrative staff receive free passes without payment.

---

## 🎯 Key Features

### Payment Rules
- ✅ **Students**: Must pay for transport passes via UddoktaPay
- ✅ **Academic Staff**: Free transport passes (no payment required)
- ✅ **Administrative Staff**: Free transport passes (no payment required)

### Payment Flow
1. Admin approves student application
2. Admin creates payment request with semester and amount
3. Student receives payment notification
4. Student clicks "Pay Now" button
5. Redirected to UddoktaPay checkout page
6. Student completes payment via bKash/Nagad/Rocket/Card
7. Payment status automatically updated via webhook
8. Student can view payment receipt and transaction details

---

## 🔧 Implementation Details

### Environment Variables Added
```env
UDDOKTAPAY_API_KEY="vqLkEV11UjtxilYjUX8j0Fqil9d2jUidiOtaVjBj"
UDDOKTAPAY_BASE_URL="https://divupstudio.paymently.io/api"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Database Schema Updates
Added to `Payment` model:
- `invoiceId` (String, unique) - UddoktaPay invoice number
- `senderNumber` (String) - Mobile number used for payment
- Index on `invoiceId` for fast lookups

### Files Created

#### 1. Payment Gateway Utilities
**`lib/uddoktapay.ts`**
- `createCheckout()` - Initiate payment session
- `verifyPayment()` - Verify payment status
- `refundPayment()` - Process refunds
- `generateInvoiceNumber()` - Create unique invoice IDs
- `getPaymentUrls()` - Generate redirect/webhook URLs

#### 2. API Endpoints

**`/api/payments/initiate` (POST)**
- Initiates payment for students
- Validates student status
- Creates UddoktaPay checkout session
- Returns payment URL for redirection

**`/api/payments/verify` (POST)**
- Verifies payment status with UddoktaPay
- Updates payment record in database
- Returns current payment status

**`/api/webhooks/uddoktapay` (POST)**
- Receives payment status updates from UddoktaPay
- Automatically updates payment records
- Handles COMPLETED, FAILED, PENDING statuses

**Updated: `/api/admin/applications/[id]/payment-request` (POST)**
- Added validation: Only students can have payment requests
- Returns error for academic/administrative staff

#### 3. Student Pages

**`/dashboard/payments`**
- Shows application details
- Displays pending payment with "Pay Now" button
- Shows payment history
- Free pass notice for non-students

**`/dashboard/payment/success`**
- Payment success confirmation page
- Automatic payment verification
- Shows invoice ID and transaction details
- Links to view pass and dashboard

**`/dashboard/payment/cancel`**
- Payment cancellation page
- Option to retry payment
- No charges made message

#### 4. Components

**`StudentPaymentsView`**
- Application information card
- Pending payment card with pay button
- Payment history list
- Free pass notice for non-students
- Status badges and transaction details

---

## 🔄 Complete Payment Workflow

### For Students

```
1. Application Submitted → WAITLIST
2. Admin Approves → APPROVED
3. Admin Creates Payment Request
   - Enters semester (e.g., "Spring 2025")
   - Enters amount (e.g., 5000 BDT)
4. Payment Record Created → PENDING
5. Student Navigates to /dashboard/payments
6. Student Clicks "Pay Now"
7. API Call to /api/payments/initiate
8. Redirected to UddoktaPay Checkout
9. Student Selects Payment Method (bKash/Nagad/Rocket/Card)
10. Student Completes Payment
11. UddoktaPay Sends Webhook to /api/webhooks/uddoktapay
12. Payment Status Updated → PAID
13. Student Redirected to /dashboard/payment/success
14. Payment Verified via /api/payments/verify
15. Success Message Displayed
16. Student Can View Pass
```

### For Academic/Administrative Staff

```
1. Application Submitted → WAITLIST
2. Admin Approves → APPROVED
3. No Payment Required
4. Staff Can Immediately View Pass
5. Free Pass Notice Shown in Dashboard
```

---

## 💳 Supported Payment Methods

UddoktaPay supports:
- **bKash** - Mobile banking
- **Nagad** - Mobile banking
- **Rocket** - Mobile banking
- **Card** - Credit/Debit cards
- **Bank Transfer** - Direct bank transfer

---

## 🔐 Security Features

1. **User Validation**: Only payment owner can initiate payment
2. **Application Validation**: Only approved applications can have payments
3. **Student Validation**: Only students are charged
4. **Duplicate Prevention**: Can't create multiple pending payments
5. **Webhook Verification**: Secure webhook endpoint for status updates
6. **Invoice Tracking**: Unique invoice IDs for each payment

---

## 📊 Admin Features

### Payment Management (`/admin/dashboard/payments`)
- View all payments across all applications
- Filter by status (PENDING, PAID, FAILED, REFUNDED)
- Search by name, email, or transaction ID
- Edit payment details
- Update payment status manually
- Add transaction IDs and references
- Delete payment records
- View payment method and sender number

### Payment Request Creation
From `/admin/dashboard/applications`:
1. Click "Payment" button on approved student application
2. Enter semester (e.g., "Spring 2025")
3. Enter amount in BDT
4. Submit to create payment request
5. Student receives notification

**Note**: Payment button is disabled for academic/administrative staff

---

## 🧪 Testing the Integration

### Prerequisites
1. Run Prisma commands:
```powershell
npx prisma generate
npx prisma db push
```

2. Restart development server:
```powershell
npm run dev
```

### Test Scenarios

#### Test 1: Student Payment Flow
1. Create/approve a student application
2. As admin, create payment request (semester: "Test Semester", amount: 100)
3. As student, navigate to `/dashboard/payments`
4. Click "Pay Now"
5. Complete payment on UddoktaPay test page
6. Verify redirect to success page
7. Check payment status updated to PAID

#### Test 2: Academic Staff (Free Pass)
1. Create/approve an academic staff application
2. As admin, try to create payment request
3. Should receive error: "Only students need to make payment"
4. As staff, navigate to `/dashboard/payments`
5. Should see "Free Transport Pass" notice

#### Test 3: Payment Verification
1. After payment, check `/admin/dashboard/payments`
2. Verify payment shows as PAID
3. Check transaction ID is populated
4. Verify payment method is shown
5. Check sender number is recorded

#### Test 4: Webhook Processing
1. Make a payment
2. Check server logs for webhook received
3. Verify payment status auto-updated
4. Check all payment details populated

---

## 🔍 Troubleshooting

### Issue: TypeScript errors about 'payment' not existing
**Solution**: Run `npx prisma generate` to regenerate Prisma client

### Issue: Payment button not working
**Solution**: 
- Check browser console for errors
- Verify UDDOKTAPAY_API_KEY is set
- Check network tab for API response

### Issue: Webhook not updating payment
**Solution**:
- Verify webhook URL is accessible
- Check server logs for webhook errors
- Ensure invoice ID matches

### Issue: Redirect not working after payment
**Solution**:
- Verify NEXT_PUBLIC_APP_URL is correct
- Check UddoktaPay dashboard for redirect URL
- Ensure success/cancel pages exist

---

## 📝 API Reference

### UddoktaPay Endpoints

#### Checkout
```
POST https://divupstudio.paymently.io/api/checkout
Headers:
  RT-UDDOKTAPAY-API-KEY: your_api_key
  Content-Type: application/json
Body:
  {
    "amount": "5000",
    "fullName": "John Doe",
    "email": "john@example.com",
    "invoiceNumber": "STH-ABC12345-1234567890-123",
    "paymentType": "Transport Pass Payment",
    "redirectUrl": "http://localhost:3000/dashboard/payment/success",
    "cancelUrl": "http://localhost:3000/dashboard/payment/cancel",
    "webhookUrl": "http://localhost:3000/api/webhooks/uddoktapay"
  }
```

#### Verify Payment
```
POST https://divupstudio.paymently.io/api/verify-payment
Headers:
  RT-UDDOKTAPAY-API-KEY: your_api_key
  Content-Type: application/json
Body:
  {
    "invoice_id": "STH-ABC12345-1234567890-123"
  }
```

#### Refund Payment
```
POST https://divupstudio.paymently.io/api/refund-payment
Headers:
  RT-UDDOKTAPAY-API-KEY: your_api_key
  Content-Type: application/json
Body:
  {
    "invoice_id": "STH-ABC12345-1234567890-123"
  }
```

---

## 🚀 Next Steps (Optional Enhancements)

1. **Email Notifications**: Send payment request emails to students
2. **SMS Notifications**: Send payment confirmation via SMS
3. **Payment Receipts**: Generate PDF receipts for paid payments
4. **Refund Processing**: Implement refund workflow for admins
5. **Payment Analytics**: Dashboard with payment statistics
6. **Bulk Payments**: Create payment requests for multiple students
7. **Payment Reminders**: Automated reminders for pending payments
8. **Payment Plans**: Support for installment payments
9. **Discount Codes**: Apply discounts to payments
10. **Payment Reports**: Export payment data for accounting

---

## 📋 Checklist

Before going live:
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma db push`
- [ ] Update `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Verify UddoktaPay API key is correct
- [ ] Test payment flow end-to-end
- [ ] Test webhook endpoint
- [ ] Verify redirect URLs work
- [ ] Test with all payment methods
- [ ] Check error handling
- [ ] Review security measures
- [ ] Set up monitoring/logging
- [ ] Document for team

---

## 🎉 Summary

The UddoktaPay integration is complete and ready for use! The system now supports:
- ✅ Online payments for students
- ✅ Free passes for staff
- ✅ Automatic payment verification
- ✅ Webhook status updates
- ✅ Payment history tracking
- ✅ Transaction details recording
- ✅ Multiple payment methods
- ✅ Secure payment processing

Students can now pay for their transport passes online, while academic and administrative staff automatically receive free passes.

# Database Schema

## Core Models

### User

Fields:

- `id`
- `name`
- `email`
- `emailVerified`
- `image`
- `role`
- `createdAt`
- `updatedAt`

Relations:

- `sessions`
- `accounts`
- `noticesCreated`
- `noticesRead`
- `transportApplications`
- `filesDocsUploaded`
- `complaintsSubmitted`
- `complaintsManaged`

### TransportApplication

Fields:

- `id`
- `userId`
- `applicantType`
- `fullName`
- `department`
- `batch`
- `studentId`
- `phone`
- `phoneVerified`
- `idCardUrl`
- `routeId`
- `pickupPointId`
- `status`
- `createdAt`
- `updatedAt`

Relations:

- belongs to `User`
- belongs to `Route`
- belongs to `PickupPoint`
- has many `Payment`

### Route

Fields:

- `id`
- `name`
- `capacity`
- `startTime`
- `returnTime`
- `isActive`
- `createdAt`
- `updatedAt`

Relations:

- has many `PickupPoint`
- has many `TransportApplication`

### PickupPoint

Fields:

- `id`
- `name`
- `landmark`
- `order`
- `routeId`
- `isActive`
- `createdAt`
- `updatedAt`

Relations:

- belongs to `Route`
- has many `TransportApplication`

### Payment

Fields:

- `id`
- `applicationId`
- `semesterId`
- `amount`
- `currency`
- `status`
- `method`
- `invoiceId`
- `invoiceNumber`
- `paymentUrl`
- `transactionId`
- `reference`
- `senderNumber`
- `paidAt`
- `requestedAt`
- `notes`
- `createdAt`
- `updatedAt`

Relations:

- belongs to `TransportApplication`
- optionally belongs to `Semester`

### Semester

Fields:

- `id`
- `name`
- `startDate`
- `endDate`
- `createdAt`
- `updatedAt`

### Notice

Fields:

- `id`
- `title`
- `content`
- `type`
- `target`
- `targetRoles`
- `targetUsers`
- `isPublished`
- `isPinned`
- `expiryDate`
- `createdById`
- `createdAt`
- `updatedAt`

### UserNotice

Fields:

- `id`
- `noticeId`
- `userId`
- `isRead`
- `readAt`

### FilesDoc

Fields:

- `id`
- `fileName`
- `originalName`
- `publicId`
- `url`
- `format`
- `mimeType`
- `bytes`
- `category`
- `uploadedById`
- `createdAt`
- `updatedAt`

### FilesDocCategory

Fields:

- `id`
- `name`
- `createdAt`
- `updatedAt`

### Complaint

Fields:

- `id`
- `userId`
- `type`
- `status`
- `subject`
- `message`
- `adminResponse`
- `statusUpdatedAt`
- `statusUpdatedById`
- `resolvedAt`
- `createdAt`
- `updatedAt`

### Better Auth Models

- `Session`
- `Account`
- `Verification`

## Enums

### Role
- `USER`
- `ADMIN`
- `BANNED`

### ApplicantType
- `STUDENT`
- `ACADEMIC`
- `ADMINISTRATIVE`

### ApplicationStatus
- `WAITLIST`
- `APPROVED`
- `REJECTED`

### PaymentStatus
- `PENDING`
- `PAID`
- `FAILED`
- `REFUNDED`

### PaymentMethod
- `CASH`
- `BKASH`
- `NAGAD`
- `ROCKET`
- `BANK_TRANSFER`
- `CARD`

### ComplaintType
- `COMPLAINT`
- `FEEDBACK`
- `SUGGESTION`

### ComplaintStatus
- `OPEN`
- `IN_REVIEW`
- `RESOLVED`
- `CLOSED`

### NoticeType
- `INFO`
- `WARNING`
- `SUCCESS`
- `DANGER`

### NoticeTarget
- `ALL`
- `ROLE`
- `SPECIFIC`

## Important Truth

There is no Prisma `Pass` model. Pass information is computed at runtime from application and payment records.

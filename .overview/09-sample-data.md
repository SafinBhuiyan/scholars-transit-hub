# Sample Data

## Users

| id | name | email | role | emailVerified |
|---|---|---|---|---|
| user_001 | Ayesha Rahman | ayesha@example.com | USER | true |
| user_002 | Md. Fahim Hasan | fahim@example.com | USER | true |
| user_003 | Dr. Nusrat Jahan | nusrat@example.com | USER | true |
| admin_001 | Transport Admin | admin@scholarspass.edu | ADMIN | true |

## Routes

| id | name | capacity | startTime | returnTime | isActive |
|---|---|---:|---|---|---|
| route_001 | Route 01 - Signboard | 50 | 07:00 | 16:15 | true |
| route_002 | Route 02 - Uttara | 45 | 07:10 | 16:20 | true |

## Pickup Points

| id | routeId | order | name | landmark |
|---|---|---:|---|---|
| pickup_001 | route_001 | 0 | Signboard | Near BRTC Counter |
| pickup_002 | route_001 | 1 | Matuail |  |
| pickup_003 | route_001 | 2 | Rayerbag |  |
| pickup_004 | route_002 | 0 | Uttara House Building | Rajlaxmi Signal |
| pickup_005 | route_002 | 1 | Airport | In front of station |

## Applications

| id | userId | applicantType | fullName | department | batch | studentId | routeId | pickupPointId | status |
|---|---|---|---|---|---|---|---|---|---|
| app_001 | user_001 | STUDENT | Ayesha Rahman | CSE | 56th | 212010158 | route_001 | pickup_001 | APPROVED |
| app_002 | user_002 | STUDENT | Md. Fahim Hasan | EEE | 54th | 211010220 | route_002 | pickup_004 | WAITLIST |
| app_003 | user_003 | ACADEMIC | Dr. Nusrat Jahan | CSE |  |  | route_001 | pickup_003 | APPROVED |

## Semesters

| id | name | startDate | endDate |
|---|---|---|---|
| sem_001 | Spring 2026 | 2026-01-01 | 2026-06-30 |

## Payments

| id | applicationId | semesterId | amount | status | method | invoiceId | transactionId | paidAt |
|---|---|---|---:|---|---|---|---|---|
| pay_001 | app_001 | sem_001 | 1500 | PAID | BKASH | inv_123456 | TXN-123456 | 2026-04-01T10:15:00Z |
| pay_002 | app_002 | sem_001 | 1500 | PENDING |  |  |  |  |

## Computed Pass Examples

### Approved Student

```json
{
  "passId": "STH-2026-P_001",
  "applicationId": "app_001",
  "userId": "user_001",
  "fullName": "Ayesha Rahman",
  "applicantType": "STUDENT",
  "route": "Route 01 - Signboard",
  "pickupPoint": "Signboard",
  "issuedAt": "2026-04-01T10:15:00.000Z",
  "isPassActive": true
}
```

### Approved Academic Staff

```json
{
  "passId": "STH-2026-P_003",
  "applicationId": "app_003",
  "userId": "user_003",
  "fullName": "Dr. Nusrat Jahan",
  "applicantType": "ACADEMIC",
  "route": "Route 01 - Signboard",
  "pickupPoint": "Rayerbag",
  "issuedAt": "2026-04-01T09:00:00.000Z",
  "isPassActive": true
}
```

## Notices

| id | title | target | isPublished | isPinned |
|---|---|---|---|---|
| notice_001 | Transport fee deadline | ROLE(USER) | true | true |
| notice_002 | Route 01 revised return time | ALL | true | false |

## Complaints

| id | userId | type | status | subject |
|---|---|---|---|---|
| comp_001 | user_001 | COMPLAINT | RESOLVED | Route timing issue |
| comp_002 | user_002 | SUGGESTION | OPEN | Add another pickup near airport |

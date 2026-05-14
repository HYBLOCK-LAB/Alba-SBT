# B-1 Attendance API Draft

## Common

All protected endpoints use `Authorization: Bearer <jwt>`.

JWT is issued by C after SIWE verification. B-1 verifies:

```text
algorithm: HS256
expires: 24h
refresh token: none
expired token: SIWE re-login
```

Payload:

```json
{
  "sub": "users.id",
  "walletAddress": "users.wallet_address",
  "accountType": "worker | manager",
  "iat": 1710000000,
  "exp": 1710086400
}
```

Success response:

```json
{
  "success": true,
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "위치/QR이 일치하지 않습니다",
  "code": "GPS_OUT_OF_RANGE"
}
```

## QR

### `POST /qr/tokens`

Manager creates a short-lived QR token for a store.

Default TTL is `QR_TOKEN_TTL_SECONDS=10`, matching the QR display duration in `PRD.md`.

```json
{
  "storeId": "uuid"
}
```

## Attendance

### `POST /attendance/clock-in`

Worker clocks in with QR and GPS verification.

```json
{
  "storeId": "uuid",
  "qrToken": "token",
  "latitude": 37.5665,
  "longitude": 126.978
}
```

### `POST /attendance/clock-out`

Worker clocks out with QR and GPS verification.

```json
{
  "attendanceId": "uuid",
  "qrToken": "token",
  "latitude": 37.5665,
  "longitude": 126.978
}
```

## Schedules

### `POST /schedules/generate`

Generate schedules from active recurring patterns.

```json
{
  "staffAssignmentId": "uuid",
  "fromDate": "2026-05-11",
  "toDate": "2026-06-30"
}
```

## Extra Work

### `POST /extra-work/requests`

Manager creates an extra work request.

```json
{
  "storeId": "uuid",
  "requestedDate": "2026-05-20",
  "requestedStartTime": "18:00",
  "requestedEndTime": "22:00"
}
```

### `POST /extra-work/applications`

Worker applies for an extra work request.

```json
{
  "extraWorkRequestId": "uuid"
}
```

### `POST /extra-work/applications/accept`

Manager accepts one pending application. Other pending applications for the same request become `not_selected`.

```json
{
  "applicationId": "uuid"
}
```

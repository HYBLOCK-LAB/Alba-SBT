# B-1 Attendance API

## Common

Protected endpoints use `Authorization: Bearer <jwt>`.

JWT is issued after SIWE verification and B-1 verifies the shared C spec.

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
  "message": "기존 스케줄과 시간이 겹칩니다",
  "code": "EXTRA_WORK_SCHEDULE_CONFLICT"
}
```

## QR

### `POST /qr/tokens`

Manager creates a short-lived QR token for a store.

Default TTL is `QR_TOKEN_TTL_SECONDS=10`, matching the QR display duration in `PRD.md`.

Request:

```json
{
  "storeId": "uuid"
}
```

Response data:

```json
{
  "token": "string",
  "expires_at": "2026-05-15T09:00:10"
}
```

### `POST /qr/verify`

Worker or frontend verifies that a QR token is still usable for the selected store.

Request:

```json
{
  "storeId": "uuid",
  "qrToken": "token"
}
```

Response data:

```json
{
  "valid": true,
  "storeId": "uuid",
  "expiresAt": "2026-05-15T09:00:10"
}
```

## Attendance

### `POST /attendance/clock-in`

Worker clocks in with QR and GPS verification.

Request:

```json
{
  "storeId": "uuid",
  "qrToken": "token",
  "latitude": 37.501286,
  "longitude": 127.039585
}
```

Notes:

- GPS must be within `stores.gps_radius_meters`.
- Regular work uses today's `schedules` row.
- If no regular schedule exists, an accepted extra work application for today can be used.

### `POST /attendance/clock-out`

Worker clocks out with QR and GPS verification.

Request:

```json
{
  "attendanceId": "uuid",
  "storeId": "uuid",
  "qrToken": "token",
  "latitude": 37.501286,
  "longitude": 127.039585
}
```

`attendanceId` can be omitted; then the latest open attendance for the worker/store is used.

### `GET /attendance/me/month?month=YYYY-MM&storeId=uuid`

Worker retrieves own monthly schedules and attendance.

Query:

```text
month=2026-05
storeId=uuid optional
```

### `GET /attendance/stores/:storeId/today`

Manager retrieves today's store attendance snapshot.

Response data:

```json
{
  "date": "2026-05-15",
  "schedules": [],
  "attendance": []
}
```

Use this endpoint as the initial load and after Realtime events.

## Realtime Attendance

Frontend A should subscribe to Supabase Realtime on the `attendance` table and refetch today's snapshot when an event arrives.

Channel:

```text
attendance:store:{storeId}
```

Subscription:

```ts
supabase
  .channel(`attendance:store:${storeId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'attendance',
      filter: `store_id=eq.${storeId}`,
    },
    () => refetchTodayStatus(),
  )
  .subscribe();
```

Refetch endpoint:

```text
GET /attendance/stores/:storeId/today
```

Recommended UI mapping:

```text
clock_in_time exists and status=on_time -> 출근
clock_in_time exists and status=late -> 지각
status=absent -> 결근
no attendance row for today's schedule -> 미출근
```

## Schedules

### `POST /schedules/generate`

Manager generates schedules from active recurring patterns.

Request:

```json
{
  "staffAssignmentId": "uuid",
  "fromDate": "2026-05-15",
  "toDate": "2026-06-30",
  "recurringScheduleId": "uuid optional"
}
```

Response data:

```json
{
  "inserted": 5
}
```

### `POST /schedules/generate/current-next-month`

Manager generates schedules from today through the end of next month for one staff assignment.

Request:

```json
{
  "staffAssignmentId": "uuid"
}
```

## Extra Work

### `POST /extra-work/requests`

Manager creates an extra work request.

Request:

```json
{
  "storeId": "uuid",
  "requestedDate": "2026-06-03",
  "requestedStartTime": "10:00:00",
  "requestedEndTime": "12:00:00"
}
```

### `GET /extra-work/requests?storeId=uuid`

Worker lists available extra work requests for active assigned stores.

### `POST /extra-work/applications`

Worker applies for an extra work request.

Request:

```json
{
  "extraWorkRequestId": "uuid"
}
```

Schedule conflict response:

```json
{
  "success": false,
  "message": "기존 스케줄과 시간이 겹칩니다",
  "code": "EXTRA_WORK_SCHEDULE_CONFLICT"
}
```

### `GET /extra-work/applications/me`

Worker lists own extra work applications.

### `GET /extra-work/stores/:storeId/applications`

Manager lists applications for a store.

### `POST /extra-work/applications/accept`

Manager accepts one pending application. Other pending applications for the same request become `not_selected`.

Request:

```json
{
  "applicationId": "uuid"
}
```

## Schedulers

These run automatically inside the NestJS server.

```text
0 0 * * * *       QR expired token cleanup, every hour
0 0 0 * * *       attendance judgement, every midnight KST
0 0 0 25 * *      next-month schedule generation, every 25th KST
```

# EAS 발급 E2E 테스트 플랜

**최종 수정**: 2026-05-13  
**테스트 대상**: `supabase/functions/eas-trigger` Edge Function

---

## 📋 개요

EAS 4종의 발급 조건 충족 → 온체인 발행 → DB 저장 전체 흐름을 검증합니다.  
Supabase SQL Editor에서 테스트 데이터를 삽입 후 Edge Function을 수동 트리거하여 결과를 확인합니다.

**첫 번째 트리거 후 예상 발급:**
| EAS 타입 | 수량 | 구간 / 조건 |
|---------|-----|-----------|
| EAS_EXP_TIME | 1개 | 2025-11-01 ~ 2026-05-01 (6개월) |
| EAS_FAITH_ATT | 1개 | 2025-11-01 ~ 2026-01-30 (90일, absent=0 late=0) |
| EAS_WORK_COMP | 1개 | 동일 90일 구간 (completed=2/2) |
| EAS_EXTRA_ACC | 1개 | 추가근무 수락 10회 누적 |

> **두 번째 트리거 시**: FAITH_ATT 2차 구간(2026-01-31~2026-05-01) 조건 충족 → FAITH_ATT + WORK_COMP 각 1개 추가. 정상 동작.

---

## Step 1: 테스트 데이터 삽입

각 블록을 **순서대로** Supabase SQL Editor에서 실행합니다.  
`ON CONFLICT (id) DO NOTHING` 처리로 중복 실행해도 안전합니다.

---

### 블록 A — 기본 엔티티 (users / stores / staff_assignments)

```sql
-- 테스트 사장님 (stores.manager_id FK용)
INSERT INTO users (id, account_type, name, wallet_address)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'manager', '테스트사장',
  '0xA100000000000000000000000000000000000001'
) ON CONFLICT (id) DO NOTHING;

-- 테스트 알바생 (EAS attestation recipient)
INSERT INTO users (id, account_type, name, wallet_address)
VALUES (
  '10000000-0000-0000-0000-000000000002',
  'worker', '테스트알바',
  '0xA200000000000000000000000000000000000002'
) ON CONFLICT (id) DO NOTHING;

-- 테스트 매장 (fnb / 카페)
INSERT INTO stores (
  id, manager_id, name, store_code, category, sub_category,
  address, latitude, longitude, gps_radius_meters,
  qr_validity_start_hour, qr_validity_end_hour
) VALUES (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '테스트스타벅스', 'TST001', 'fnb', '카페',
  '서울시 강남구 테헤란로 1', 37.501286, 127.039585,
  100, 8, 23
) ON CONFLICT (id) DO NOTHING;

-- 직원 배정 (active)
INSERT INTO staff_assignments (id, user_id, store_id, status)
VALUES (
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000001',
  'active'
) ON CONFLICT (id) DO NOTHING;
```

---

### 블록 B — EAS_EXP_TIME + EAS_FAITH_ATT + EAS_WORK_COMP 데이터

```sql
-- 스케줄 4개 (attendance.schedule_id FK 및 WORK_COMP용 scheduled_end_time)
INSERT INTO schedules (
  id, staff_assignment_id, store_id, user_id,
  scheduled_date, scheduled_start_time, scheduled_end_time, is_cancelled
) VALUES
  ('40000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000002',
   '2025-11-01', '09:00:00', '18:00:00', FALSE),
  ('40000000-0000-0000-0000-000000000002',
   '30000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000002',
   '2026-01-15', '09:00:00', '18:00:00', FALSE),
  ('40000000-0000-0000-0000-000000000003',
   '30000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000002',
   '2026-02-01', '09:00:00', '18:00:00', FALSE),
  ('40000000-0000-0000-0000-000000000004',
   '30000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000002',
   '2026-05-01', '09:00:00', '18:00:00', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 출근 기록 4개
-- 레코드 1·2: 1차 90일 구간(2025-11-01 ~ 2026-01-30) → FAITH_ATT + WORK_COMP 판정
-- 레코드 3: 2차 90일 구간(2026-01-31 ~ 2026-05-01) → 2회차 FAITH_ATT + WORK_COMP
-- 레코드 4: 6개월 span 달성 → EXP_TIME 판정
-- clock_out 18:30 UTC > scheduled_end 18:00 → WORK_COMP 완수 조건 충족
INSERT INTO attendance (
  id, staff_assignment_id, user_id, store_id, schedule_id,
  type, status, clock_in_time, clock_out_time, clock_in_gps_verified
) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000001',
   'regular', 'on_time',
   '2025-11-01 09:00:00+00', '2025-11-01 18:30:00+00', TRUE),

  ('a0000000-0000-0000-0000-000000000002',
   '30000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000002',
   'regular', 'on_time',
   '2026-01-15 09:00:00+00', '2026-01-15 18:30:00+00', TRUE),

  ('a0000000-0000-0000-0000-000000000003',
   '30000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000003',
   'regular', 'on_time',
   '2026-02-01 09:00:00+00', '2026-02-01 18:30:00+00', TRUE),

  ('a0000000-0000-0000-0000-000000000004',
   '30000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000004',
   'regular', 'on_time',
   '2026-05-01 09:00:00+00', '2026-05-01 18:30:00+00', TRUE)
ON CONFLICT (id) DO NOTHING;
```

**판정 로직 검증 메모:**
- **EXP_TIME**: MIN=2025-11-01, MAX clock_out=2026-05-01 18:30 UTC → diff = (2026-2025)×12 + (4-10) = **6개월** → expectedCount=1 ✓
- **FAITH_ATT 1차**: intervalStart=`2025-11-01 09:00 UTC`, intervalEnd=`2026-01-30 09:00 UTC`
  - 구간 내 레코드(gte, lt 조건): 2025-11-01, 2026-01-15 → absent=0, late=0 ✓
- **WORK_COMP**: 위 2건 INNER JOIN schedules → `"18:30:00" >= "18:00:00"` ✓ → completed=2/2 ✓

---

### 블록 C — EAS_EXTRA_ACC 데이터 (추가근무 수락 10회)

```sql
-- 추가 근무 요청 10건
INSERT INTO extra_work_requests (
  id, store_id, manager_id,
  requested_date, requested_start_time, requested_end_time
)
SELECT
  ('50000000-0000-0000-' || LPAD(gs::TEXT, 4, '0') || '-000000000001')::UUID,
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  DATE '2026-03-01' + (gs - 1) * INTERVAL '1 day',
  '10:00:00', '15:00:00'
FROM generate_series(1, 10) AS gs
ON CONFLICT (id) DO NOTHING;

-- 수락 신청 10건 (responded_at 필수: first/last_accepted_at 조립용)
INSERT INTO extra_work_applications (
  id, extra_work_request_id, staff_assignment_id,
  user_id, store_id, status, applied_at, responded_at
)
SELECT
  ('60000000-0000-0000-' || LPAD(gs::TEXT, 4, '0') || '-000000000001')::UUID,
  ('50000000-0000-0000-' || LPAD(gs::TEXT, 4, '0') || '-000000000001')::UUID,
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000001',
  'accepted',
  TIMESTAMPTZ '2026-03-01 10:00:00+00' + (gs - 1) * INTERVAL '1 day',
  TIMESTAMPTZ '2026-03-01 12:00:00+00' + (gs - 1) * INTERVAL '1 day'
FROM generate_series(1, 10) AS gs
ON CONFLICT (id) DO NOTHING;
```

**판정 로직 검증:** totalAccepted=10, floor(10/10)=1 > issuedCount=0 → EAS_EXTRA_ACC 1개 ✓

---

## Step 2: Edge Function 수동 트리거

Supabase 대시보드 > Settings > API에서 Project URL·anon key 확인 후 실행합니다.

```bash
curl -X POST https://<PROJECT_REF>.supabase.co/functions/v1/eas-trigger \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>"
```

**예상 응답:**
```json
{"success": true, "elapsed_ms": 30000}
```

Sepolia 트랜잭션 처리 시간 포함으로 **30~90초** 소요 예상.  
`success: false` 반환 시 → Supabase 대시보드 > Edge Functions > eas-trigger > Logs 확인.

---

## Step 3: DB 검증 (Supabase SQL Editor)

```sql
-- 발급 결과 전체 조회
SELECT
  eas_type,
  status,
  eas_uid,
  transaction_hash,
  issued_at,
  level_check_triggered,
  attestation_data
FROM eas_attestations
WHERE user_id = '10000000-0000-0000-0000-000000000002'
ORDER BY created_at;

-- 실패 건 확인
SELECT eas_type, status, retry_count
FROM eas_attestations
WHERE user_id = '10000000-0000-0000-0000-000000000002'
  AND status = 'failed';
```

**기대 결과 (첫 번째 트리거 후): 4행, 모두 status='issued', eas_uid 값 있음**

---

## Step 4: 온체인 검증

발급된 `eas_uid` 값을 Sepolia EAS Explorer에서 조회:

```
https://sepolia.easscan.org/attestation/view/<eas_uid>
```

확인 항목:
- Recipient = `0xA200000000000000000000000000000000000002`
- Revocable = `false`
- Schema UID = 각 EAS 타입별 UID (`docs/EAS-Schema.md` 참조)

트랜잭션 확인 (Sepolia Etherscan):
```
https://sepolia.etherscan.io/tx/<transaction_hash>
```

---

## Step 5 (선택) — 두 번째 트리거로 2차 구간 검증

```bash
curl -X POST https://<PROJECT_REF>.supabase.co/functions/v1/eas-trigger \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>"
```

**추가 발급 예상:**
- EAS_FAITH_ATT 1개 (2차 구간: 2026-01-31 ~ 2026-05-01, 2026-02-01 레코드)
- EAS_WORK_COMP 1개 (동일 구간, completed=1/1)
- EAS_EXP_TIME / EAS_EXTRA_ACC 추가 없음 (이미 최대 발급)

```sql
-- 2차 트리거 후 EAS 타입별 발급 수 확인 (총 6건 기대)
SELECT eas_type, COUNT(*) AS issued_count
FROM eas_attestations
WHERE user_id = '10000000-0000-0000-0000-000000000002'
  AND status = 'issued'
GROUP BY eas_type;
```

---

## Step 6 (B-2 API 수령 후) — 승급 트리거 연동 테스트

> **선행 조건**: B-2로부터 `/level-check` API 명세 및 Railway 배포 URL 수령 완료

### 6-1. 환경변수 등록

Supabase CLI 또는 대시보드 > **Project Settings > Edge Functions > Secrets**에서 등록:

```bash
supabase secrets set LEVEL_CHECK_API_URL=https://<RAILWAY_URL>/level-check
supabase secrets set LEVEL_CHECK_API_SECRET=<B-2_API_SECRET>
```

등록 후 Edge Function 재배포:

```bash
supabase functions deploy eas-trigger --project-ref ynypngctkxtlrgigsale
```

---

### 6-2. 재시도 대상 확인 (Supabase SQL Editor)

Step 1~5에서 발급된 EAS 레코드는 stub 상태로 인해 `level_check_triggered=false`입니다.  
재배포 후 트리거하면 `retryPendingLevelChecks`가 이 레코드들을 자동 재시도합니다.

```sql
-- level-check 미완료 레코드 확인
SELECT id, eas_type, eas_uid, level_check_triggered
FROM eas_attestations
WHERE user_id = '10000000-0000-0000-0000-000000000002'
  AND status = 'issued'
  AND level_check_triggered = false;
```

**기대 결과**: 6건 (1차+2차 FAITH_ATT·WORK_COMP, EXP_TIME, EXTRA_ACC)

---

### 6-3. Edge Function 트리거

```bash
curl -X POST https://ynypngctkxtlrgigsale.supabase.co/functions/v1/eas-trigger \
  -H 'Authorization: Bearer <SUPABASE_ANON_KEY>'
```

---

### 6-4. DB 검증

```sql
-- level_check_triggered 전환 확인
SELECT eas_type, level_check_triggered
FROM eas_attestations
WHERE user_id = '10000000-0000-0000-0000-000000000002'
  AND status = 'issued'
ORDER BY created_at;
```

**기대 결과**: 전체 6건 모두 `level_check_triggered = true`

---

### 6-5. B-2 서버 응답 검증

B-2 팀과 함께 확인:
- Railway 서버 로그에서 `/level-check` POST 요청 수신 확인
- 응답 구조가 명세와 일치하는지 확인
- 레벨 판독 결과가 `users.level` 또는 별도 테이블에 반영되는지 확인

---

### 트러블슈팅

| 증상 | 원인 후보 | 확인 방법 |
|------|---------|---------|
| `level_check_triggered` 여전히 `false` | `LEVEL_CHECK_API_URL` 미설정 또는 오타 | Edge Function 로그에서 `[STUB]` 경고 확인 |
| B-2 서버 400/401 오류 | `LEVEL_CHECK_API_SECRET` 불일치 | B-2 팀과 secret 값 재확인 |
| B-2 서버 500 오류 | B-2 레벨 판독 로직 오류 | B-2 서버 로그 확인 |

---

## 트러블슈팅 체크리스트

| 증상 | 원인 후보 | 확인 방법 |
|------|---------|---------|
| `success: false` | EAS 환경변수 미설정 | Supabase Secrets에서 `EAS_SCHEMA_UID_*` 4개 존재 확인 |
| `status='failed'` | Sepolia RPC 실패 / signer 잔액 부족 | Etherscan에서 signer 주소 잔액 확인 |
| `eas_uid=NULL` | Attested 이벤트 파싱 실패 | Edge Function 실행 로그에서 오류 메시지 확인 |
| EAS_WORK_COMP 미발급 | `clock_out_time` 시간 또는 schedules INNER JOIN 실패 | `attendance.schedule_id` → `schedules.id` 존재 여부 확인 |
| EAS_EXTRA_ACC 미발급 | `responded_at` NULL | `extra_work_applications.responded_at` 값 직접 확인 |

---

## 테스트 고정 ID 참조표

| 항목 | UUID |
|-----|------|
| 테스트 사장님 | `10000000-0000-0000-0000-000000000001` |
| 테스트 알바생 | `10000000-0000-0000-0000-000000000002` |
| 테스트 매장 | `20000000-0000-0000-0000-000000000001` |
| 직원 배정 | `30000000-0000-0000-0000-000000000001` |
| 스케줄 1 (2025-11-01) | `40000000-0000-0000-0000-000000000001` |
| 스케줄 2 (2026-01-15) | `40000000-0000-0000-0000-000000000002` |
| 스케줄 3 (2026-02-01) | `40000000-0000-0000-0000-000000000003` |
| 스케줄 4 (2026-05-01) | `40000000-0000-0000-0000-000000000004` |
| 출근 기록 1~4 | `a0000000-0000-0000-0000-00000000000{1~4}` |
| 추가근무 요청 1~10 | `50000000-0000-0000-{0001~0010}-000000000001` |
| 추가근무 신청 1~10 | `60000000-0000-0000-{0001~0010}-000000000001` |

# Alba-SBT EAS 스키마 정의

**최종 수정**: 2026-05-11  
**상태**: 1차 설계 완료

---

## 📋 개요

Ethereum Attestation Service(EAS)에 등록할 각 스키마의 Solidity 타입 정의, 발급 조건, 및 DB 저장용 `attestation_data` JSONB 구조를 정의합니다.

**공통 사항:**
- EAS attestation의 `recipient` 필드 = 알바생의 `wallet_address` (스키마 data 필드에 별도 포함하지 않음)
- 온체인 날짜 타입: `uint64` (Unix timestamp, 초 단위)
- `storeId`: UUID → `bytes32` 변환 시 16바이트 패딩 처리
- 스키마 등록 후 Schema UID는 각 EAS 타입 하단 "Schema UID" 항목에 기록

---

## 🔷 EAS_EXP_TIME — 업종 경력 증명

### 온체인 Schema String
```
bytes32 storeId, string storeName, string category, string subCategory, uint32 periodMonths, uint64 startDate, uint64 endDate
```

### 발급 조건
- 동일 매장에서 첫 `clock_in` ~ 최근 `clock_in/clock_out` 기준 **6개월 달성** 시 자동 발급
- 매장별 독립 판정 (다중 매장 기간 합산 없음)
- 매장 중복 발급 가능
- `attendance.type = 'regular'` 및 `'extra'` 모두 포함
- 판정 쿼리: `MIN(clock_in_time)` ~ `MAX(COALESCE(clock_out_time, clock_in_time))`, `store_id` 기준

### `attestation_data` JSONB (DB 저장용)
```json
{
  "store_id": "uuid",
  "store_name": "스타벅스",
  "category": "F&B",
  "sub_category": "카페",
  "period_months": 6,
  "start_date": "2025-11-01",
  "end_date": "2026-05-01"
}
```

### Schema UID
> 등록 후 기입 예정

---

## 🔷 EAS_FAITH_ATT — 성실성 증명

### 온체인 Schema String
```
bytes32 storeId, string storeName, string category, string subCategory, uint32 absentCount, uint32 lateCount, uint32 periodDays, uint64 startDate, uint64 endDate
```

### 발급 조건
- 매장별 첫 출근일 기준 **90일 고정 구간** 내
  - 결근(`absent`) **0회**
  - 지각(`late`) **2회 이하**
- 매장별 독립 판정, 다중 매장 근무 시 매장마다 별도 발급 가능
- 판정 쿼리: `attendance.status` per `store_id`, 90일 구간 내 `absent` 횟수 = 0, `late` 횟수 ≤ 2

### `attestation_data` JSONB (DB 저장용)
```json
{
  "store_id": "uuid",
  "store_name": "스타벅스",
  "category": "F&B",
  "sub_category": "카페",
  "absent_count": 0,
  "late_count": 1,
  "period_days": 90,
  "start_date": "2026-02-01",
  "end_date": "2026-05-01"
}
```

**필드 설명:**
| 필드 | 설명 | 발급 기준 |
|------|------|---------|
| `absent_count` | 구간 내 결근 횟수 | 반드시 0 |
| `late_count` | 구간 내 지각 횟수 | 2 이하 |
| `period_days` | 판정 구간 일수 | 항상 90 |

### Schema UID
> 등록 후 기입 예정

---

## 🔷 EAS_WORK_COMP — 근무 완수 증명

### 온체인 Schema String
```
bytes32 storeId, string storeName, string category, string subCategory, uint32 completedCount, uint32 onTimeCount, uint32 periodDays, uint64 startDate, uint64 endDate
```

### 발급 조건
- `EAS_FAITH_ATT` 조건 충족 전제 (결근 0회 + 지각 2회 이하)
- 동일 90일 구간 내 `on_time` 출근한 모든 근무에서 **조기 퇴근 0회**
  - 판정: `clock_out_time::TIME >= schedules.scheduled_end_time`
  - `late` 출근 건은 퇴근 시각 무관 평가 제외
  - `clock_out_time IS NULL`이면 미완수
- 매장별 독립 판정
- 판정 쿼리: `attendance JOIN schedules ON schedule_id`, `status = 'on_time'` AND `clock_out_time::TIME >= scheduled_end_time`

### `attestation_data` JSONB (DB 저장용)
```json
{
  "store_id": "uuid",
  "store_name": "스타벅스",
  "category": "F&B",
  "sub_category": "카페",
  "completed_count": 47,
  "on_time_count": 47,
  "period_days": 90,
  "start_date": "2026-02-01",
  "end_date": "2026-05-01"
}
```

**필드 설명:**
| 필드 | 설명 |
|------|------|
| `completed_count` | 구간 내 on_time 출근 + 정시 퇴근 완수 건수 |
| `on_time_count` | 구간 내 on_time 출근 건수 (= `completed_count` 발급 조건 충족 시) |

### Schema UID
> 등록 후 기입 예정

---

## 🔷 EAS_EXTRA_ACC — 추가 근무 수락 증명

### 온체인 Schema String
```
uint32 totalAcceptedCount, uint64 issuedDate, bytes extraStoresData
```

> `extraStoresData`: 매장별 데이터를 ABI 인코딩한 bytes 배열  
> 각 항목: `(bytes32 storeId, string storeName, string category, string subCategory, uint32 acceptedCount, uint64 firstAcceptedAt, uint64 lastAcceptedAt)`

### 발급 조건
- 전 매장 통합 추가 근무 수락 누적 **10회마다 1개** 발급
- 수락(`status = 'accepted'`) 건만 집계 (거절·미선택 미포함)
- clock_out 완료 여부 무관 (수락 의사 기준)
- 기한 없음, 10회 달성마다 반복 발급
- `total_accepted_count`: 누적 카운트 (1차=10, 2차=20, 3차=30)
- 판정 쿼리: `COUNT(*) FROM extra_work_applications WHERE status = 'accepted' AND user_id = ?`

### `attestation_data` JSONB (DB 저장용)
```json
{
  "total_accepted_count": 10,
  "issued_date": "2026-05-01",
  "stores": [
    {
      "store_id": "uuid-cafe",
      "store_name": "스타벅스",
      "category": "F&B",
      "sub_category": "커피",
      "accepted_count": 4,
      "first_accepted_at": "2026-01-15",
      "last_accepted_at": "2026-04-20"
    },
    {
      "store_id": "uuid-convenient",
      "store_name": "CU",
      "category": "유통·물류",
      "sub_category": "편의점",
      "accepted_count": 6,
      "first_accepted_at": "2026-02-01",
      "last_accepted_at": "2026-04-28"
    }
  ]
}
```

**필드 설명:**
| 필드 | 위치 | 설명 |
|------|------|------|
| `total_accepted_count` | 루트 | 발급 시점까지의 전 매장 누적 수락 횟수 |
| `accepted_count` | stores[] | 해당 매장의 누적 수락 횟수 |
| `first_accepted_at` | stores[] | 해당 매장의 첫 번째 수락일 |
| `last_accepted_at` | stores[] | 해당 매장의 가장 최근 수락일 |

> **설계 결정**: 개별 수락 날짜 배열 대신 기간 범위(first/last)를 채택. 채용처는 "언제" 활동했는지 파악 가능하면서 calldata 크기를 고정 유지. 개별 날짜는 `extra_work_applications.responded_at`으로 off-chain DB에 보존됨.

### Schema UID
> 등록 후 기입 예정

---

## 📊 EAS 타입 요약

| EAS 타입 | 발급 단위 | 발급 반복 | `store_id` 포함 |
|----------|---------|---------|----------------|
| `EAS_EXP_TIME` | 매장별 | 반복 가능 | 필수 |
| `EAS_FAITH_ATT` | 매장별 90일 구간 | 반복 가능 | 필수 |
| `EAS_WORK_COMP` | 매장별 90일 구간 | 반복 가능 | 필수 |
| `EAS_EXTRA_ACC` | 전 매장 통합 10회 | 반복 가능 | NULL (전체 합산) |

---

**작성 완료**: 2026-05-11

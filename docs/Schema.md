# Alba-SBT Database Schema

**최종 수정**: 2026-04-29  
**상태**: Phase 1 스키마 확정 (POS 제외)

---

## 📋 개요

Alba-SBT 시스템의 필수 테이블을 **앱 흐름 순서**대로 정렬.  
각 테이블은 해당 파트와 용도를 명시합니다.

---

## 🔷 공통 (앱 — 회원가입/로그인)

### `users` — 사용자 계정 및 지갑 연동
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 (Primary Key) |
| `account_type` | ENUM('worker', 'manager') | 계정 유형: 알바생 또는 사장님 |
| `name` | VARCHAR | 사용자 이름 |
| `email` | VARCHAR (UNIQUE, NULLABLE) | 이메일 주소 |
| `phone` | VARCHAR (NULLABLE) | 휴대폰 번호 |
| `wallet_address` | VARCHAR (UNIQUE) | 지갑 주소 (MetaMask 연동, SIWE 인증 기준) |
| `created_at` | TIMESTAMP | 가입 일시 |
| `updated_at` | TIMESTAMP | 최종 수정 일시 |

**파트**: 앱 — 공통  
**참고**: SIWE(Sign-In with Ethereum) 기반 인증으로 password_hash 불필요. 신규 가입 시 계정 유형 선택 화면에서 `account_type` 저장. 이후 변경 불가.

---

### `siwe_nonces` — SIWE 인증용 임시 nonce
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `nonce` | VARCHAR (UNIQUE) | SIWE 서명 요청용 임시 nonce |
| `wallet_address` | VARCHAR | 요청 지갑 주소 |
| `expires_at` | TIMESTAMP | 만료 일시 (발급 시각 + 5분) |
| `created_at` | TIMESTAMP | 생성 일시 |

**파트**: 앱 — 공통  
**담당**: C  
**참고**: SIWE 인증 흐름 — nonce 발급 → 지갑 서명 → 서명 검증 후 nonce 즉시 삭제 (재사용 방지). 만료된 nonce는 C가 주기적으로 정리.

---

## 🔷 앱 — 매장 관리

### `stores` — 매장 정보
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `manager_id` | UUID (FK) | 사장님 ID (`users.id`) |
| `name` | VARCHAR | 매장명 |
| `store_code` | VARCHAR(6) (UNIQUE) | 6자리 자동 생성 매장코드 (알바생 등록 시 입력) |
| `category` | ENUM('fnb', 'retail', 'production', 'service', 'culture', 'office', 'education') | 업종 대분류 (EAS_EXP_TIME에 사용) |
| `sub_category` | VARCHAR | 하위 업종 (예: 카페, 편의점, 패스트푸드) — EAS 발급 시 필수 |
| `address` | VARCHAR | 매장 주소 |
| `latitude` | DECIMAL(10, 8) | 위도 (GPS 검증용) |
| `longitude` | DECIMAL(11, 8) | 경도 (GPS 검증용) |
| `gps_radius_meters` | INT | GPS 허용 반경 (기본값: 50m) |
| `qr_validity_start_hour` | INT | 당일 QR 유효 시작 시간 (예: 8 = 08:00) |
| `qr_validity_end_hour` | INT | 당일 QR 유효 종료 시간 (예: 23 = 23:00) |
| `business_number` | VARCHAR (NULLABLE) | 사업자번호 (선택 입력) |
| `contact` | VARCHAR (NULLABLE) | 연락처 |
| `created_at` | TIMESTAMP | 등록 일시 |
| `updated_at` | TIMESTAMP | 수정 일시 |

**파트**: 앱 — 매장 관리

**참고**: 지갑 연동 후 매장 추가 정보 입력 시 `category`(대분류) + `sub_category`(소분류) **모두 필수 입력**. EAS(`EAS_EXP_TIME`) 발행 데이터에 업종 정보가 포함되므로 누락 불가.

---

### `qr_tokens` — 출퇴근 QR 토큰
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `store_id` | UUID (FK) | 매장 ID (`stores.id`) |
| `token` | VARCHAR (UNIQUE) | QR 토큰값 (무작위 생성) |
| `expires_at` | TIMESTAMP | 만료 일시 (생성 시각 + 30초) |
| `created_by` | UUID (FK) | 생성한 사장님 ID (`users.id`) |
| `created_at` | TIMESTAMP | 생성 일시 |

**파트**: 앱 — 매장 관리  
**참고**: 사장님이 [QR 생성] 버튼 클릭 시 생성 → 30초 유효 → 자동 소멸. 알바생 출퇴근 스캔 시 `attendance.qr_scanned`와 대조 검증

---

## 🔷 앱 — 직원 배정

### `staff_assignments` — 사용자 ↔ 매장 매핑
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `user_id` | UUID (FK) | 알바생 ID (`users.id`) |
| `store_id` | UUID (FK) | 매장 ID (`stores.id`) |
| `staff_number` | VARCHAR (UNIQUE) | 사번 (매장별 출퇴근 QR 활성화 기준) |
| `status` | ENUM('pending', 'active') | 배정 상태: 승인 대기 / 활성 |
| `approved_at` | TIMESTAMP (NULLABLE) | 사장님 승인 일시 |
| `created_at` | TIMESTAMP | 배정 일시 |
| `updated_at` | TIMESTAMP | 수정 일시 |

**파트**: 앱 — 직원 관리  
**참고**: 알바생이 `store_code` 입력 → `status='pending'` 생성 → 사장님이 승인하면 `status='active'`로 변경

---

## 🔷 앱 — 근태 (출퇴근)

### `schedules` — 예약 근무 일정
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `staff_assignment_id` | UUID (FK) | 직원 배정 ID (`staff_assignments.id`) |
| `scheduled_date` | DATE | 근무 예정일 |
| `scheduled_start_time` | TIME | 예약 출근 시간 |
| `scheduled_end_time` | TIME | 예약 퇴근 시간 |
| `is_cancelled` | BOOLEAN | 스케줄 취소 여부 |
| `created_at` | TIMESTAMP | 등록 일시 |
| `updated_at` | TIMESTAMP | 수정 일시 |

**파트**: 앱 — 근태 관리

---

### `attendance` — 출퇴근 로그
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `staff_assignment_id` | UUID (FK) | 직원 배정 ID (`staff_assignments.id`) |
| `store_id` | UUID (FK) | 매장 ID (`stores.id`) |
| `type` | ENUM('regular', 'extension') | 근무 유형: 정규 또는 연장근무 |
| `status` | ENUM('on_time', 'late', 'absent') | 근태 상태 (EAS_FAITH_ATT 판정용) |
| `clock_in_time` | TIMESTAMP | 실제 출근 시간 |
| `clock_out_time` | TIMESTAMP (NULLABLE) | 실제 퇴근 시간 |
| `extension_hours` | DECIMAL(5, 2) (NULLABLE) | 연장근무 시간 (type='extension'일 때 사용) |
| `clock_in_latitude` | DECIMAL(10, 8) (NULLABLE) | 출근 스캔 GPS 위도 |
| `clock_in_longitude` | DECIMAL(11, 8) (NULLABLE) | 출근 스캔 GPS 경도 |
| `gps_verified` | BOOLEAN | GPS 검증 통과 여부 |
| `qr_scanned` | VARCHAR (NULLABLE) | 스캔한 QR 토큰값 (`qr_tokens.token`과 대조) |
| `created_at` | TIMESTAMP | 기록 생성 일시 |

**파트**: 앱 — 근태  
**참고**:
- 근무 기간 집계: `MIN(clock_in_time)` ~ `MAX(clock_out_time)` (store_id 별) → `EAS_EXP_TIME` 발행 조건 판정
- 연장근무 집계: `SUM(extension_hours)` WHERE `type='extension'` → `EAS_SUB_SUPPORT` 판정 (누적 30시간 이상)

---

## 🔷 앱 — 스케줄 변경 & 연장근무

### `schedule_changes` — 스케줄 변경 요청 로그
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `schedule_id` | UUID (FK) | 원래 스케줄 ID (`schedules.id`) |
| `staff_assignment_id` | UUID (FK) | 요청자 ID (`staff_assignments.id`) |
| `requested_at` | TIMESTAMP | 변경 요청 시간 |
| `scheduled_date` | DATE | 변경 전 근무 예정일 |
| `new_date` | DATE (NULLABLE) | 변경 요청한 새 날짜 |
| `new_start_time` | TIME (NULLABLE) | 변경 요청한 새 시작 시간 |
| `new_end_time` | TIME (NULLABLE) | 변경 요청한 새 종료 시간 |
| `change_hour_threshold` | INT | 변경 기한 (근무 당일 N시간 이전) |
| `reason` | TEXT (NULLABLE) | 변경 사유 |
| `reason_category` | ENUM('unavoidable', 'personal') (NULLABLE) | 변경 사유 분류. unavoidable: 가족사, 건강문제 (EAS 판정 제외). personal: 개인 여행, 학교 시험 등 (EAS 판정 포함). |
| `status` | ENUM('pending', 'approved', 'rejected') | 요청 상태 |
| `created_at` | TIMESTAMP | 기록 생성 일시 |

**파트**: 앱 — 스케줄 관리  
**참고**: EAS_SCHED_RELI 판정용. 3개월 동안 개인 사유(personal)로 인한 사장님 승인 변경 0회 조건. 가족사·건강문제(unavoidable)는 EAS 판정 제외.

---

### `overtime_requests` — 연장근무 신청
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `staff_assignment_id` | UUID (FK) | 요청자 ID (`staff_assignments.id`) |
| `schedule_id` | UUID (FK) | 연장 기준 스케줄 ID (`schedules.id`) |
| `requested_date` | DATE | 연장근무 예정일 |
| `extension_hours` | DECIMAL(5, 2) | 요청 연장 시간 |
| `reason` | TEXT (NULLABLE) | 연장 사유 |
| `status` | ENUM('pending', 'approved', 'rejected') | 승인 상태 |
| `requested_at` | TIMESTAMP | 신청 일시 |
| `responded_at` | TIMESTAMP (NULLABLE) | 사장님 처리 일시 |
| `created_at` | TIMESTAMP | 생성 일시 |

**파트**: 앱 — 스케줄 관리  
**참고**: 현재 월 + 익월까지 신청 가능. 승인 후 알바생이 실제 연장 clock_out 완료 시 B-1이 `attendance(type='extension')` 레코드 자동 INSERT → `extension_hours` 기록 → EAS_SUB_SUPPORT 집계에 사용

---

## 🔷 블록체인 — EAS & SBT (Phase 2)

### `eas_attestations` — 발행된 EAS 기록
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `user_id` | UUID (FK) | 사용자 ID (`users.id`) |
| `eas_type` | ENUM('EAS_EXP_TIME', 'EAS_FAITH_ATT', 'EAS_SCHED_RELI', 'EAS_SUB_SUPPORT') | EAS 유형 |
| `eas_uid` | VARCHAR (UNIQUE) | 온체인 EAS UID (Sepolia) |
| `attestation_data` | JSONB | EAS 타입별 증명 데이터 (상세 구조는 아래 참조) |
| `issued_at` | TIMESTAMP | 발행 일시 |
| `transaction_hash` | VARCHAR (NULLABLE) | 블록체인 트랜잭션 해시 |
| `status` | ENUM('pending', 'issued', 'failed') | EAS 발급 상태 (기본값: 'pending') |
| `retry_count` | INT (DEFAULT 0) | Edge Function 재시도 횟수 (최대 3회) |
| `created_at` | TIMESTAMP | 기록 생성 일시 |

#### `attestation_data` 구조 상세 (EAS 타입별)

**EAS_EXP_TIME** (매장별 독립)
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

**EAS_FAITH_ATT** (매장별 독립)
```json
{
  "store_id": "uuid",
  "store_name": "스타벅스",
  "category": "F&B",
  "sub_category": "카페",
  "attendance_rate": 100.0,
  "period_days": 90,
  "start_date": "2026-02-01",
  "end_date": "2026-05-01"
}
```

**EAS_SCHED_RELI** (매장별 독립)
```json
{
  "store_id": "uuid",
  "store_name": "스타벅스",
  "category": "F&B",
  "sub_category": "카페",
  "period_days": 90,
  "personal_changes_count": 0,
  "unavoidable_changes_count": 2,
  "start_date": "2026-02-01",
  "end_date": "2026-05-01"
}
```

**EAS_SUB_SUPPORT** (매장 통합 누적)
```json
{
  "total_hours": 30.5,
  "issued_date": "2026-05-01",
  "stores": [
    {
      "store_id": "uuid-cafe",
      "store_name": "스타벅스",
      "category": "F&B",
      "sub_category": "커피",
      "hours": 5.0
    },
    {
      "store_id": "uuid-convenient",
      "store_name": "CU",
      "category": "유통·물류",
      "sub_category": "편의점",
      "hours": 15.0
    },
    {
      "store_id": "uuid-delivery",
      "store_name": "배달의민족",
      "category": "서비스",
      "sub_category": "배달",
      "hours": 10.5
    }
  ]
}
```

**파트**: 블록체인 — EAS 추적

---

### `level_up_requests` — 승급 판독 & Multisig 상태
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `user_id` | UUID (FK) | 사용자 ID (`users.id`) |
| `current_level` | INT | 현재 레벨 (1~10) |
| `target_level` | INT | 목표 레벨 |
| `status` | ENUM('pending', 'awaiting_approval', 'multisig_signed', 'minted', 'rejected') | 승급 상태 |
| `nonce` | BIGINT | EIP-712 서명 재사용 방지 nonce (컨트랙트 on-chain nonce와 동기화) |
| `manager_signature` | VARCHAR (NULLABLE) | 사장님 EIP-712 서명 |
| `platform_signature` | VARCHAR (NULLABLE) | 플랫폼 서명 |
| `sbt_token_id` | VARCHAR (NULLABLE) | 발급된 SBT 토큰 ID |
| `requested_at` | TIMESTAMP | 승급 신청 일시 |
| `approved_at` | TIMESTAMP (NULLABLE) | 사장님 승인 일시 |
| `minted_at` | TIMESTAMP (NULLABLE) | SBT 민팅 완료 일시 |
| `created_at` | TIMESTAMP | 기록 생성 일시 |

**파트**: 블록체인 — SBT 발급

---

### `badge_images` — SBT 뱃지 이미지 관리
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `level` | INT | SBT 레벨 (1~10) |
| `image_uri` | VARCHAR (UNIQUE) | 뱃지 이미지 Supabase Storage URL (고정) |
| `image_filename` | VARCHAR | 이미지 파일명 (예: level-7.png) |
| `category` | VARCHAR (NULLABLE) | 업종별 구분 (향후 확장용, 현재는 NULL) |
| `description` | TEXT (NULLABLE) | 뱃지 설명 |
| `created_at` | TIMESTAMP | 등록 일시 |
| `updated_at` | TIMESTAMP | 수정 일시 |

**파트**: 블록체인 — 뱃지 메타데이터  
**담당**: B-2 (PM 제공 원본 이미지를 Supabase Storage에 업로드·관리)  
**참고**: 각 레벨별로 1개 레코드 생성 (Lv.1~10). 이미지는 PM이 준비 → B-2가 Supabase Storage에 업로드 → `image_uri` 저장. `sbt_tokens`에서는 `level`을 기준으로 JOIN하여 `badge_image_uri` 획득.

---

### `sbt_tokens` — 발급된 SBT 토큰 정보
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `user_id` | UUID (FK) | 사용자 ID (`users.id`) |
| `token_id` | VARCHAR (UNIQUE) | SBT 토큰 ID (스마트 컨트랙트 tokenId) |
| `level` | INT | 발급 레벨 (1~10) |
| `metadata_uri` | VARCHAR | SBT 메타데이터 JSON URI (Supabase Storage) |
| `badge_image_uri` | VARCHAR | 뱃지 이미지 URI (Supabase Storage, 레벨별 고정 URL) |
| `contract_address` | VARCHAR | SBT 컨트랙트 주소 (Sepolia) |
| `transaction_hash` | VARCHAR | 민팅 트랜잭션 해시 |
| `minted_at` | TIMESTAMP | 민팅 일시 |
| `created_at` | TIMESTAMP | 기록 생성 일시 |

**파트**: 블록체인 — SBT 토큰  
**참고**: B-2가 뱃지 이미지를 사전에 준비하여 Supabase Storage에 업로드 → 레벨별로 고정 URL 할당 (예: `.../badge-images/level-7.png`)

---

## 🔗 관계도

```
users (1) ──→ staff_assignments (N) ──→ stores (1)

staff_assignments (1) ──→ schedules (N)
                    ──→ attendance (N)
                    ──→ schedule_changes (N)
                    ──→ overtime_requests (N)

stores (1) ──→ qr_tokens (N)

users (1) ──→ eas_attestations (N)
        ──→ level_up_requests (N)
        ──→ sbt_tokens (N) ──→ badge_images (1) (level 기준 JOIN)
```

---

## 📌 주요 설계 원칙

1. **타임스탬프 추적**: 모든 테이블에 `created_at` 필수 (감사 추적)
2. **외래키**: FK 관계로 데이터 무결성 보장
3. **조건 판정 최적화**: EAS 발행 및 레벨업 판정이 쿼리로 가능하도록 컬럼 설계
4. **확장성**: Phase 2 블록체인 통합을 위한 온체인 메타데이터 컬럼 예비 (transaction_hash, eas_uid 등)

### EAS 판정 데이터 매핑 요약

| EAS 유형 | 판정 기준 | 참조 테이블 / 컬럼 |
|----------|----------|-----------------|
| `EAS_EXP_TIME` | 매장별 독립 6개월 달성 | `attendance` — `MIN/MAX(clock_in_time)`, `store_id` 기준 독립 판정 (다중 매장 합산 없음. `type='regular'` 및 `type='extension'` 모두 포함) |
| `EAS_FAITH_ATT` | 매장별 연속 3개월(90일) 무지각·무결근 | `attendance.status` — `store_id`별 연속 90일 무지각·무결근 판정. 위반 발생 시 해당 `store_id` 카운트 리셋 |
| `EAS_SCHED_RELI` | 매장별 독립으로 3개월 동안 개인 사유(personal) 승인 변경 0회 (가족사·건강문제 unavoidable 제외. 다중 매장 시 매장마다 별도 발급) | `schedule_changes` — `COUNT(status = 'approved' AND reason_category = 'personal')`, `store_id` 기준 (personal 사유 승인만. unavoidable·pending·rejected 제외. 매장별 독립 판정) |
| `EAS_SUB_SUPPORT` | 모든 매장 통합 누적 연장근무 30시간 이상 (다중 매장 경력 합산. 달성 시 한 번만 발급) | `attendance` — `SUM(extension_hours)` WHERE `type='extension'` (모든 매장 통합 누적) |

---

**작성 완료**: 2026-04-29

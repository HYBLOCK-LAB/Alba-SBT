# Alba-SBT Database Schema

**최종 수정**: 2026-04-10  
**상태**: Phase 1 기본 스키마 확정

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
| `email` | VARCHAR (UNIQUE) | 이메일 주소 |
| `phone` | VARCHAR | 휴대폰 번호 |
| `wallet_address` | VARCHAR (UNIQUE, NULLABLE) | 지갑 주소 (MetaMask 연동) |
| `did` | VARCHAR (NULLABLE) | DID (Decentralized Identifier) |
| `password_hash` | VARCHAR | 비밀번호 해시 |
| `created_at` | TIMESTAMP | 가입 일시 |
| `updated_at` | TIMESTAMP | 최종 수정 일시 |

**파트**: 앱 — 공통

---

## 🔷 앱 — 매장 관리

### `stores` — 매장 정보
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `manager_id` | UUID (FK) | 사장님 ID (`users.id`) |
| `name` | VARCHAR | 매장명 |
| `category` | ENUM('food', 'retail', 'service', 'other') | 업종 분류 (EAS_EXP_TIME에 사용) |
| `address` | VARCHAR | 매장 주소 |
| `latitude` | DECIMAL(10, 8) | 위도 (GPS 검증용) |
| `longitude` | DECIMAL(11, 8) | 경도 (GPS 검증용) |
| `gps_radius_meters` | INT | GPS 허용 반경 (기본값: 50m) |
| `qr_validity_start_hour` | INT | 당일 QR 유효 시작 시간 (예: 8 = 08:00) |
| `qr_validity_end_hour` | INT | 당일 QR 유효 종료 시간 (예: 23 = 23:00) |
| `created_at` | TIMESTAMP | 등록 일시 |
| `updated_at` | TIMESTAMP | 수정 일시 |

**파트**: 앱 — 매장 관리

---

## 🔷 앱 — 직원 배정

### `staff_assignments` — 사용자 ↔ 매장 매핑
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `user_id` | UUID (FK) | 알바생 ID (`users.id`) |
| `store_id` | UUID (FK) | 매장 ID (`stores.id`) |
| `staff_number` | VARCHAR (UNIQUE) | 사번 (매장별 출퇴근 QR 활성화 기준) |
| `hire_date` | DATE | 입사일 |
| `status` | ENUM('active', 'inactive') | 근무 상태 |
| `created_at` | TIMESTAMP | 배정 일시 |
| `updated_at` | TIMESTAMP | 수정 일시 |

**파트**: 앱 — 직원 관리

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
| `status` | ENUM('on_time', 'late', 'absent') | 근태 상태 (EAS_FAITH_ATT 판정용) |
| `clock_in_time` | TIMESTAMP | 실제 출근 시간 |
| `clock_out_time` | TIMESTAMP (NULLABLE) | 실제 퇴근 시간 |
| `clock_in_latitude` | DECIMAL(10, 8) (NULLABLE) | 출근 스캔 GPS 위도 |
| `clock_in_longitude` | DECIMAL(11, 8) (NULLABLE) | 출근 스캔 GPS 경도 |
| `gps_verified` | BOOLEAN | GPS 검증 통과 여부 |
| `qr_scanned` | VARCHAR (NULLABLE) | 스캔한 QR 코드값 |
| `created_at` | TIMESTAMP | 기록 생성 일시 |

**파트**: 앱 — 근태

**참고**: 근무 기간 집계는 `MIN(clock_in_time)` ~ `MAX(clock_out_time)` 기준 (store_id 별) → EAS_EXP_TIME 발행 조건 판정

---

## 🔷 앱 — 스케줄 변경 & 대타

### `schedule_changes` — 스케줄 변경 요청 로그
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `schedule_id` | UUID (FK) | 원래 스케줄 ID (`schedules.id`) |
| `staff_assignment_id` | UUID (FK) | 요청자 ID (`staff_assignments.id`) |
| `requested_at` | TIMESTAMP | 변경 요청 시간 |
| `scheduled_date` | DATE | 근무 예정일 |
| `change_hour_threshold` | INT | 변경 기한 (근무 당일 N시간 이전) |
| `status` | ENUM('pending', 'approved', 'rejected') | 요청 상태 |
| `created_at` | TIMESTAMP | 기록 생성 일시 |

**파트**: 앱 — 스케줄 관리

**참고**: EAS_SCHED_RELI 판정용 (3개월 변경 0회 조건)

---

### `substitute_requests` — 대타 지원 로그
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `original_schedule_id` | UUID (FK) | 공석 스케줄 ID (`schedules.id`) |
| `volunteer_id` | UUID (FK) | 지원자 ID (`staff_assignments.id`) |
| `status` | ENUM('pending', 'accepted', 'rejected') | 지원 상태 |
| `support_date` | DATE | 지원 예정일 |
| `support_hours` | DECIMAL | 지원 시간 |
| `created_at` | TIMESTAMP | 지원 일시 |

**파트**: 앱 — 스케줄 관리

**참고**: EAS_SUB_SUPPORT 판정용 (지원 5회 이상 조건, status='accepted')

---

## 🔷 POS — 메뉴 & 판매 기록

### `products` — 메뉴 저장소
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `store_id` | UUID (FK) | 매장 ID (`stores.id`) |
| `name` | VARCHAR | 메뉴명 (예: 아메리카노) |
| `price` | INT | 판매 가격 (원) |
| `category` | VARCHAR | 카테고리 (예: 음료, 음식) |
| `is_active` | BOOLEAN | 판매 활성 여부 |
| `created_at` | TIMESTAMP | 등록 일시 |
| `updated_at` | TIMESTAMP | 수정 일시 |

**파트**: POS — 메뉴 관리

---

### `payment_logs` — 결제 실적
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `staff_assignment_id` | UUID (FK) | 결제 처리자 ID (`staff_assignments.id`) |
| `product_id` | UUID (FK) | 판매 상품 ID (`products.id`) |
| `store_id` | UUID (FK) | 매장 ID (`stores.id`) |
| `total_amount` | INT | 결제 금액 (원) |
| `quantity` | INT | 판매 수량 |
| `payment_method` | VARCHAR | 결제 수단 (현금, 카드 등) |
| `created_at` | TIMESTAMP | 결제 일시 |

**파트**: POS — 결제 로그

**참고**: EAS_SVC_COUNT 판정용 (결제 1,000건 이상 조건)

---

### `making_logs` — 제조 실적
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `staff_assignment_id` | UUID (FK) | 제조자 ID (`staff_assignments.id`) |
| `product_id` | UUID (FK) | 제조 상품 ID (`products.id`) |
| `store_id` | UUID (FK) | 매장 ID (`stores.id`) |
| `product_name` | VARCHAR | 제조 상품명 |
| `quantity` | INT | 제조 수량 |
| `created_at` | TIMESTAMP | 제조 완료 일시 |

**파트**: POS — 제조 로그

**참고**: EAS_SVC_COUNT 판정용 (제조 1,000건 이상 조건)

---

## 🔷 블록체인 — EAS & SBT (Phase 2)

### `eas_attestations` — 발행된 EAS 기록
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `user_id` | UUID (FK) | 사용자 ID (`users.id`) |
| `eas_type` | ENUM('EAS_EXP_TIME', 'EAS_SVC_COUNT', 'EAS_FAITH_ATT', 'EAS_SCHED_RELI', 'EAS_SUB_SUPPORT') | EAS 유형 |
| `eas_uid` | VARCHAR (UNIQUE) | 온체인 EAS UID (Sepolia) |
| `attestation_data` | JSONB | EAS 증명 데이터 (업종, 기간, 횟수 등) |
| `issued_at` | TIMESTAMP | 발행 일시 |
| `transaction_hash` | VARCHAR (NULLABLE) | 블록체인 트랜잭션 해시 |
| `created_at` | TIMESTAMP | 기록 생성 일시 |

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
| `manager_signature` | VARCHAR (NULLABLE) | 사장님 EIP-712 서명 |
| `platform_signature` | VARCHAR (NULLABLE) | 플랫폼 서명 |
| `sbt_token_id` | VARCHAR (NULLABLE) | 발급된 SBT 토큰 ID |
| `requested_at` | TIMESTAMP | 승급 신청 일시 |
| `approved_at` | TIMESTAMP (NULLABLE) | 사장님 승인 일시 |
| `minted_at` | TIMESTAMP (NULLABLE) | SBT 민팅 완료 일시 |
| `created_at` | TIMESTAMP | 기록 생성 일시 |

**파트**: 블록체인 — SBT 발급

---

### `sbt_tokens` — 발급된 SBT 토큰 정보
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본 키 |
| `user_id` | UUID (FK) | 사용자 ID (`users.id`) |
| `token_id` | VARCHAR (UNIQUE) | SBT 토큰 ID (스마트 컨트랙트 tokenId) |
| `level` | INT | 발급 레벨 (1~10) |
| `metadata_uri` | VARCHAR | SBT 메타데이터 JSON URI (IPFS 또는 Supabase) |
| `contract_address` | VARCHAR | SBT 컨트랙트 주소 (Sepolia) |
| `transaction_hash` | VARCHAR | 민팅 트랜잭션 해시 |
| `minted_at` | TIMESTAMP | 민팅 일시 |
| `created_at` | TIMESTAMP | 기록 생성 일시 |

**파트**: 블록체인 — SBT 토큰

---

## 🔗 관계도

```
users (1) ──→ staff_assignments (N) ──→ stores (1)
         ──→ (매장 접근 권한)

staff_assignments (1) ──→ schedules (N)
                    ──→ attendance (N)
                    ──→ payment_logs (N)
                    ──→ making_logs (N)
                    ──→ schedule_changes (N)

stores (1) ──→ products (N)
         ──→ payment_logs (N)
         ──→ making_logs (N)

users (1) ──→ eas_attestations (N)
        ──→ level_up_requests (N)
        ──→ sbt_tokens (N)
```

---

## 📌 주요 설계 원칙

1. **타임스탬프 추적**: 모든 테이블에 `created_at` 필수 (감사 추적)
2. **외래키**: FK 관계로 데이터 무결성 보장
3. **조건 판정 최적화**: EAS 발행 및 레벨업 판정이 쿼리로 가능하도록 컬럼 설계
4. **확장성**: Phase 2 블록체인 통합을 위한 온체인 메타데이터 컬럼 예비 (transaction_hash, eas_uid 등)

---

**작성 완료**: 2026-04-10

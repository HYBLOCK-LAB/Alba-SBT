import { getDbClient } from "../utils/db-client.ts";
import { getSchemaEncoder, uuidToBytes32, dateToUnixTimestamp, EasType } from "../utils/eas-client.ts";
import { issueAttestation } from "../utils/attestation.ts";
import { triggerLevelCheck } from "../utils/level-check.ts";

const EAS_TYPE: EasType = "EAS_EXP_TIME";
const INTERVAL_MONTHS = 6; // 6개월마다 1개 발급

// 매장별 반복 발급 로직:
// - 첫 QR(clock_in_time) 기준으로 6개월 구간 단위 판정
// - A 매장 1년 근무 → EAS 2개 (0~6개월 구간 1개, 6~12개월 구간 1개)
// - 이전 구간 end_date = 다음 구간 start_date
export async function handleExpTime(): Promise<void> {
  const db = getDbClient();
  const schemaUid = Deno.env.get("EAS_SCHEMA_UID_EXP_TIME") ?? "";

  // 1단계: 출근 기록이 있는 모든 user + store 조합 조회 (regular + extra 포함)
  const { data: pairs, error } = await db
    .from("attendance")
    .select("user_id, store_id")
    .in("type", ["regular", "extra"]);

  if (error) {
    console.error("EAS_EXP_TIME 근태 데이터 조회 실패:", error.message);
    return;
  }

  if (!pairs?.length) {
    console.log("EAS_EXP_TIME: 근태 데이터 없음");
    return;
  }

  // 중복 제거: user_id + store_id 조합
  const uniquePairs = Array.from(
    new Map(pairs.map((a: { user_id: string; store_id: string }) =>
      [`${a.user_id}:${a.store_id}`, a]
    )).values()
  ) as Array<{ user_id: string; store_id: string }>;

  for (const pair of uniquePairs) {
    await processUserStoreExpTime(pair.user_id, pair.store_id, schemaUid);
  }
}

// 특정 user + store에 대해 6개월 구간 반복 판정 및 발급
async function processUserStoreExpTime(
  userId: string,
  storeId: string,
  schemaUid: string
): Promise<void> {
  const db = getDbClient();

  // 이 매장의 첫 clock_in (QR 첫 등록 기준)
  const { data: firstRow } = await db
    .from("attendance")
    .select("clock_in_time")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .in("type", ["regular", "extra"])
    .order("clock_in_time", { ascending: true })
    .limit(1)
    .single();

  if (!firstRow) return;

  // 가장 최근 활동 시각 (clock_out_time 우선, 없으면 clock_in_time)
  const { data: latestRow } = await db
    .from("attendance")
    .select("clock_out_time, clock_in_time")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .in("type", ["regular", "extra"])
    .order("clock_in_time", { ascending: false })
    .limit(1)
    .single();

  if (!latestRow) return;

  const firstClockIn = new Date(firstRow.clock_in_time);
  const latestActivity = latestRow.clock_out_time
    ? new Date(latestRow.clock_out_time)
    : new Date(latestRow.clock_in_time);

  // 총 경과 개월 수 계산
  const totalMonths = calcMonthDiff(firstClockIn, latestActivity);

  // 발급 가능한 총 구간 수 (6개월 단위)
  const expectedCount = Math.floor(totalMonths / INTERVAL_MONTHS);
  if (expectedCount === 0) return;

  // 기발급 횟수 조회 (issued 상태만)
  const { data: issuedList } = await db
    .from("eas_attestations")
    .select("attestation_data")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .eq("eas_type", EAS_TYPE)
    .eq("status", "issued")
    .order("issued_at", { ascending: true });

  const issuedCount = issuedList?.length ?? 0;
  const toIssueCount = expectedCount - issuedCount;

  if (toIssueCount <= 0) return;

  // 매장 정보 및 wallet_address 조회
  const [{ data: store }, { data: user }] = await Promise.all([
    db.from("stores").select("name, category, sub_category").eq("id", storeId).single(),
    db.from("users").select("wallet_address").eq("id", userId).single(),
  ]);

  if (!store || !user?.wallet_address) return;

  // 미발급 구간 순서대로 발급
  for (let i = issuedCount; i < expectedCount; i++) {
    // 구간 i: firstClockIn + i*6months ~ firstClockIn + (i+1)*6months
    const intervalStart = addMonths(firstClockIn, i * INTERVAL_MONTHS);
    const intervalEnd = addMonths(firstClockIn, (i + 1) * INTERVAL_MONTHS);

    // 해당 구간 end_date가 아직 도래하지 않으면 발급 불가
    if (intervalEnd > new Date()) break;

    const startDateStr = toDateString(intervalStart);
    const endDateStr = toDateString(intervalEnd);

    // 스키마 인코딩
    const encoder = getSchemaEncoder(EAS_TYPE);
    const encodedData = encoder.encodeData([
      { name: "storeId", value: uuidToBytes32(storeId), type: "bytes32" },
      { name: "storeName", value: store.name, type: "string" },
      { name: "category", value: store.category, type: "string" },
      { name: "subCategory", value: store.sub_category, type: "string" },
      { name: "periodMonths", value: INTERVAL_MONTHS, type: "uint32" },
      { name: "startDate", value: dateToUnixTimestamp(startDateStr), type: "uint64" },
      { name: "endDate", value: dateToUnixTimestamp(endDateStr), type: "uint64" },
    ]);

    const attestationData = {
      store_id: storeId,
      store_name: store.name,
      category: store.category,
      sub_category: store.sub_category,
      period_months: INTERVAL_MONTHS,
      start_date: startDateStr,
      end_date: endDateStr,
    };

    const easUid = await issueAttestation({
      userId,
      storeId,
      easType: EAS_TYPE,
      schemaUid,
      encodedData,
      attestationData,
      recipient: user.wallet_address,
    });

    if (easUid) {
      const { data: attestation } = await db
        .from("eas_attestations")
        .select("id")
        .eq("eas_uid", easUid)
        .single();

      if (attestation) {
        await triggerLevelCheck(attestation.id, userId, EAS_TYPE, easUid);
      }
    }
  }
}

// 두 날짜 사이의 개월 수 계산 (KST 기준)
function calcMonthDiff(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12
    + (to.getMonth() - from.getMonth());
}

// 날짜에 개월 수를 더한 새 Date 반환
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// Date → "YYYY-MM-DD" 문자열 변환 (KST 오프셋 +9h 적용)
function toDateString(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split("T")[0];
}

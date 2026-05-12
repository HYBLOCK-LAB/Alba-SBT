import { getDbClient } from "../utils/db-client.ts";
import { getSchemaEncoder, uuidToBytes32, dateToUnixTimestamp, EasType } from "../utils/eas-client.ts";
import { issueAttestation } from "../utils/attestation.ts";
import { triggerLevelCheck } from "../utils/level-check.ts";
import { handleWorkCompForInterval } from "./work-comp.ts";

const EAS_TYPE: EasType = "EAS_FAITH_ATT";
const INTERVAL_DAYS = 90;

// 매장별 첫 출근일 기준 90일 구간 내 결근 0회 + 지각 2회 이하 달성 시 EAS_FAITH_ATT 발급
// 발급 시 동일 구간 EAS_WORK_COMP 조건도 함께 체크
export async function handleFaithAtt(): Promise<void> {
  const db = getDbClient();
  const schemaUid = Deno.env.get("EAS_SCHEMA_UID_FAITH_ATT") ?? "";

  // 1단계: 알바생 x 매장 조합 목록 조회 (첫 출근 기록 있는 조합)
  const { data: assignments, error } = await db
    .from("attendance")
    .select("user_id, store_id")
    .throwOnError();

  if (error) {
    console.error("EAS_FAITH_ATT 대상 조회 실패:", error.message);
    return;
  }

  // 중복 제거: user_id + store_id 조합
  const uniquePairs = Array.from(
    new Map(assignments.map((a: { user_id: string; store_id: string }) => [`${a.user_id}:${a.store_id}`, a])).values()
  ) as Array<{ user_id: string; store_id: string }>;

  for (const pair of uniquePairs) {
    await processUserStoreFaithAtt(pair.user_id, pair.store_id, schemaUid);
  }
}

// 특정 user + store에 대해 90일 구간 반복 판정
async function processUserStoreFaithAtt(
  userId: string,
  storeId: string,
  schemaUid: string
): Promise<void> {
  const db = getDbClient();

  // 이 매장의 첫 출근일 조회
  const { data: firstAttendance } = await db
    .from("attendance")
    .select("clock_in_time")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .order("clock_in_time", { ascending: true })
    .limit(1)
    .single();

  if (!firstAttendance) return;

  // 이미 발급된 구간들의 end_date 조회 (다음 구간 시작점 계산용)
  const { data: issuedList } = await db
    .from("eas_attestations")
    .select("attestation_data")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .eq("eas_type", "EAS_FAITH_ATT")
    .eq("status", "issued")
    .order("issued_at", { ascending: false });

  // 다음 구간 시작일: 마지막 발급 end_date+1일 또는 첫 출근일
  let intervalStart = new Date(firstAttendance.clock_in_time);
  if (issuedList?.length) {
    const lastEndDate = issuedList[0].attestation_data.end_date;
    intervalStart = new Date(lastEndDate);
    intervalStart.setDate(intervalStart.getDate() + 1);
  }

  const intervalEnd = new Date(intervalStart);
  intervalEnd.setDate(intervalEnd.getDate() + INTERVAL_DAYS);

  // 구간이 아직 완료되지 않으면 판정 불가
  if (intervalEnd > new Date()) return;

  // 구간 내 근태 통계 조회
  const { data: stats } = await db
    .from("attendance")
    .select("status")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .gte("clock_in_time", intervalStart.toISOString())
    .lt("clock_in_time", intervalEnd.toISOString());

  if (!stats?.length) return;

  const absentCount = stats.filter((s: { status: string }) => s.status === "absent").length;
  const lateCount = stats.filter((s: { status: string }) => s.status === "late").length;

  // 발급 조건: 결근 0회 + 지각 2회 이하
  if (absentCount !== 0 || lateCount > 2) {
    console.log(`EAS_FAITH_ATT 조건 미달 (userId=${userId}, storeId=${storeId}): absent=${absentCount}, late=${lateCount}`);
    return;
  }

  // 매장 정보 조회
  const { data: store } = await db
    .from("stores")
    .select("name, category, sub_category")
    .eq("id", storeId)
    .single();

  if (!store) return;

  // 알바생 wallet_address 조회
  const { data: user } = await db
    .from("users")
    .select("wallet_address")
    .eq("id", userId)
    .single();

  if (!user?.wallet_address) return;

  const startDateStr = intervalStart.toISOString().split("T")[0];
  const endDateStr = intervalEnd.toISOString().split("T")[0];

  // 스키마 인코딩
  const encoder = getSchemaEncoder("EAS_FAITH_ATT");
  const encodedData = encoder.encodeData([
    { name: "storeId", value: uuidToBytes32(storeId), type: "bytes32" },
    { name: "storeName", value: store.name, type: "string" },
    { name: "category", value: store.category, type: "string" },
    { name: "subCategory", value: store.sub_category, type: "string" },
    { name: "absentCount", value: absentCount, type: "uint32" },
    { name: "lateCount", value: lateCount, type: "uint32" },
    { name: "periodDays", value: INTERVAL_DAYS, type: "uint32" },
    { name: "startDate", value: dateToUnixTimestamp(startDateStr), type: "uint64" },
    { name: "endDate", value: dateToUnixTimestamp(endDateStr), type: "uint64" },
  ]);

  const attestationData = {
    store_id: storeId,
    store_name: store.name,
    category: store.category,
    sub_category: store.sub_category,
    absent_count: absentCount,
    late_count: lateCount,
    period_days: INTERVAL_DAYS,
    start_date: startDateStr,
    end_date: endDateStr,
  };

  // EAS_FAITH_ATT 발급
  const easUid = await issueAttestation({
    userId,
    storeId,
    easType: "EAS_FAITH_ATT",
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
      await triggerLevelCheck(attestation.id, userId, "EAS_FAITH_ATT", easUid);
    }

    // 동일 90일 구간에서 EAS_WORK_COMP 조건도 체크
    await handleWorkCompForInterval(userId, storeId, intervalStart, intervalEnd, user.wallet_address);
  }
}

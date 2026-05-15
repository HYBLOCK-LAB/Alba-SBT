import { getDbClient } from "../utils/db-client.ts";
import { getSchemaEncoder, uuidToBytes32, dateToUnixTimestamp } from "../utils/eas-client.ts";
import { issueAttestation } from "../utils/attestation.ts";
import { triggerLevelCheck } from "../utils/level-check.ts";

const EAS_TYPE = "EAS_WORK_COMP" as const;
const INTERVAL_DAYS = 90;

// EAS_FAITH_ATT 조건 충족 구간 내 on_time 출근 건에서 조기 퇴근 0회 달성 시 EAS_WORK_COMP 발급
// faith-att 핸들러에서 조건 충족 구간을 확인한 뒤 이 함수를 호출함
export async function handleWorkCompForInterval(
  userId: string,
  storeId: string,
  intervalStart: Date,
  intervalEnd: Date,
  recipientWallet: string
): Promise<void> {
  const db = getDbClient();
  const schemaUid = Deno.env.get("EAS_SCHEMA_UID_WORK_COMP") ?? "";

  // 동일 구간 EAS_WORK_COMP 기발급 여부 확인
  const startDateStr = intervalStart.toISOString().split("T")[0];
  const { data: existing } = await db
    .from("eas_attestations")
    .select("id")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .eq("eas_type", EAS_TYPE)
    .eq("status", "issued")
    .contains("attestation_data", { start_date: startDateStr })
    .maybeSingle();

  if (existing) return;

  // 구간 내 on_time 출근 건 조회 (schedules JOIN으로 scheduled_end_time 비교)
  const { data: onTimeList, error } = await db
    .from("attendance")
    .select(`
      id,
      clock_out_time,
      schedule_id,
      schedules!inner(scheduled_end_time)
    `)
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .eq("status", "on_time")
    .gte("clock_in_time", intervalStart.toISOString())
    .lt("clock_in_time", intervalEnd.toISOString());

  if (error) {
    console.error("EAS_WORK_COMP 근태 조회 실패:", error.message);
    return;
  }

  if (!onTimeList?.length) return;

  const onTimeCount = onTimeList.length;

  // 완수 조건: clock_out_time이 있고 퇴근 시각 >= 예정 퇴근 시각
  const completedCount = onTimeList.filter((a: {
    clock_out_time: string | null;
    schedules: { scheduled_end_time: string };
  }) => {
    if (!a.clock_out_time) return false; // 퇴근 미기록 → 미완수
    const clockOutTime = a.clock_out_time.split("T")[1].substring(0, 8); // HH:MM:SS
    return clockOutTime >= a.schedules.scheduled_end_time;
  }).length;

  // 발급 조건: on_time 출근 건 전부 정시 퇴근 완수
  if (completedCount !== onTimeCount) {
    console.log(`EAS_WORK_COMP 조건 미달 (userId=${userId}): completed=${completedCount}/${onTimeCount}`);
    return;
  }

  // 매장 정보 조회
  const { data: store } = await db
    .from("stores")
    .select("name, category, sub_category")
    .eq("id", storeId)
    .single();

  if (!store) return;

  const endDateStr = intervalEnd.toISOString().split("T")[0];

  // 스키마 인코딩
  const encoder = getSchemaEncoder(EAS_TYPE);
  const encodedData = encoder.encodeData([
    { name: "storeId", value: uuidToBytes32(storeId), type: "bytes32" },
    { name: "storeName", value: store.name, type: "string" },
    { name: "category", value: store.category, type: "string" },
    { name: "subCategory", value: store.sub_category, type: "string" },
    { name: "completedCount", value: completedCount, type: "uint32" },
    { name: "onTimeCount", value: onTimeCount, type: "uint32" },
    { name: "periodDays", value: INTERVAL_DAYS, type: "uint32" },
    { name: "startDate", value: dateToUnixTimestamp(startDateStr), type: "uint64" },
    { name: "endDate", value: dateToUnixTimestamp(endDateStr), type: "uint64" },
  ]);

  const attestationData = {
    store_id: storeId,
    store_name: store.name,
    category: store.category,
    sub_category: store.sub_category,
    completed_count: completedCount,
    on_time_count: onTimeCount,
    period_days: INTERVAL_DAYS,
    start_date: startDateStr,
    end_date: endDateStr,
  };

  // EAS_WORK_COMP 발급
  const easUid = await issueAttestation({
    userId,
    storeId,
    easType: EAS_TYPE,
    schemaUid,
    encodedData,
    attestationData,
    recipient: recipientWallet,
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

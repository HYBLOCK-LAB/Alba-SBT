import { handleExpTime } from "./handlers/exp-time.ts";
import { handleFaithAtt } from "./handlers/faith-att.ts";
import { handleExtraAcc } from "./handlers/extra-acc.ts";
import { retryFailedAttestations } from "./utils/attestation.ts";
import { retryPendingLevelChecks } from "./utils/level-check.ts";
import { getDbClient } from "./utils/db-client.ts";
import { getEasClient } from "./utils/eas-client.ts";

const MAX_RETRY_COUNT = 3;

Deno.serve(async (_req: Request) => {
  const startTime = Date.now();
  console.log(`[eas-trigger] 실행 시작: ${new Date().toISOString()}`);

  try {
    // 클라이언트 초기화 확인
    getDbClient();
    getEasClient();

    // 1단계: 이전 실패 건 재처리 (retry_count < 3)
    console.log("[1/5] 실패 재처리 시작");
    await retryFailedEasAttestations();

    // 2단계: EAS_EXP_TIME 발급 (매장별 6개월 경력 증명)
    console.log("[2/5] EAS_EXP_TIME 처리 시작");
    await handleExpTime();

    // 3단계: EAS_FAITH_ATT + EAS_WORK_COMP 발급 (90일 구간 성실성 + 근무 완수)
    // faith-att 핸들러가 조건 충족 시 work-comp도 연계 발급
    console.log("[3/5] EAS_FAITH_ATT + EAS_WORK_COMP 처리 시작");
    await handleFaithAtt();

    // 4단계: EAS_EXTRA_ACC 발급 (전 매장 추가 근무 수락 10회 누적)
    console.log("[4/5] EAS_EXTRA_ACC 처리 시작");
    await handleExtraAcc();

    // 5단계: level-check 미완료 건 재시도
    console.log("[5/5] level-check 미완료 재시도 시작");
    await retryPendingLevelChecks();

    const elapsed = Date.now() - startTime;
    console.log(`[eas-trigger] 완료: ${elapsed}ms`);

    return new Response(
      JSON.stringify({ success: true, elapsed_ms: elapsed }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = (err as Error).message;
    console.error("[eas-trigger] 치명적 오류:", message);

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// eas_attestations에서 failed 건을 꺼내 EAS 타입별로 재발급 시도
async function retryFailedEasAttestations(): Promise<void> {
  const db = getDbClient();
  const { getEasClient: _eas, getSchemaEncoder, uuidToBytes32, dateToUnixTimestamp } = await import("./utils/eas-client.ts");
  const { issueAttestation } = await import("./utils/attestation.ts");
  const { triggerLevelCheck } = await import("./utils/level-check.ts");

  // 재시도 대상 조회
  const { data: failedList, error } = await db
    .from("eas_attestations")
    .select("id, eas_type, attestation_data, user_id, store_id, retry_count")
    .eq("status", "failed")
    .lt("retry_count", MAX_RETRY_COUNT);

  if (error || !failedList?.length) return;

  console.log(`재시도 대상: ${failedList.length}건`);

  for (const record of failedList) {
    // retry_count 선 증가
    await db
      .from("eas_attestations")
      .update({ retry_count: record.retry_count + 1 })
      .eq("id", record.id);

    // wallet_address 조회
    const { data: user } = await db
      .from("users")
      .select("wallet_address")
      .eq("id", record.user_id)
      .single();

    if (!user?.wallet_address) continue;

    // Schema UID 매핑
    const schemaUidMap: Record<string, string> = {
      EAS_EXP_TIME: Deno.env.get("EAS_SCHEMA_UID_EXP_TIME") ?? "",
      EAS_FAITH_ATT: Deno.env.get("EAS_SCHEMA_UID_FAITH_ATT") ?? "",
      EAS_WORK_COMP: Deno.env.get("EAS_SCHEMA_UID_WORK_COMP") ?? "",
      EAS_EXTRA_ACC: Deno.env.get("EAS_SCHEMA_UID_EXTRA_ACC") ?? "",
    };

    const schemaUid = schemaUidMap[record.eas_type];
    if (!schemaUid) continue;

    // 기존 레코드 삭제 후 재발급 (issueAttestation이 새 레코드를 INSERT하는 구조)
    await db.from("eas_attestations").delete().eq("id", record.id);

    // EAS 타입별 인코딩 재조립
    const encodedData = reencodeAttestationData(record.eas_type, record.attestation_data, { getSchemaEncoder, uuidToBytes32, dateToUnixTimestamp });
    if (!encodedData) continue;

    const easUid = await issueAttestation({
      userId: record.user_id,
      storeId: record.store_id,
      easType: record.eas_type,
      schemaUid,
      encodedData,
      attestationData: record.attestation_data,
      recipient: user.wallet_address,
    });

    if (easUid) {
      const { data: newAttestation } = await db
        .from("eas_attestations")
        .select("id")
        .eq("eas_uid", easUid)
        .single();

      if (newAttestation) {
        await triggerLevelCheck(newAttestation.id, record.user_id, record.eas_type, easUid);
      }
    }
  }
}

// attestation_data JSONB → 온체인 encodedData 재조립 (재시도용)
function reencodeAttestationData(
  easType: string,
  data: Record<string, unknown>,
  utils: {
    getSchemaEncoder: typeof import("./utils/eas-client.ts").getSchemaEncoder;
    uuidToBytes32: typeof import("./utils/eas-client.ts").uuidToBytes32;
    dateToUnixTimestamp: typeof import("./utils/eas-client.ts").dateToUnixTimestamp;
  }
): string | null {
  const { getSchemaEncoder, uuidToBytes32, dateToUnixTimestamp } = utils;

  try {
    switch (easType) {
      case "EAS_EXP_TIME": {
        const enc = getSchemaEncoder("EAS_EXP_TIME");
        return enc.encodeData([
          { name: "storeId", value: uuidToBytes32(data.store_id as string), type: "bytes32" },
          { name: "storeName", value: data.store_name as string, type: "string" },
          { name: "category", value: data.category as string, type: "string" },
          { name: "subCategory", value: data.sub_category as string, type: "string" },
          { name: "periodMonths", value: data.period_months as number, type: "uint32" },
          { name: "startDate", value: dateToUnixTimestamp(data.start_date as string), type: "uint64" },
          { name: "endDate", value: dateToUnixTimestamp(data.end_date as string), type: "uint64" },
        ]);
      }
      case "EAS_FAITH_ATT": {
        const enc = getSchemaEncoder("EAS_FAITH_ATT");
        return enc.encodeData([
          { name: "storeId", value: uuidToBytes32(data.store_id as string), type: "bytes32" },
          { name: "storeName", value: data.store_name as string, type: "string" },
          { name: "category", value: data.category as string, type: "string" },
          { name: "subCategory", value: data.sub_category as string, type: "string" },
          { name: "absentCount", value: data.absent_count as number, type: "uint32" },
          { name: "lateCount", value: data.late_count as number, type: "uint32" },
          { name: "periodDays", value: data.period_days as number, type: "uint32" },
          { name: "startDate", value: dateToUnixTimestamp(data.start_date as string), type: "uint64" },
          { name: "endDate", value: dateToUnixTimestamp(data.end_date as string), type: "uint64" },
        ]);
      }
      case "EAS_WORK_COMP": {
        const enc = getSchemaEncoder("EAS_WORK_COMP");
        return enc.encodeData([
          { name: "storeId", value: uuidToBytes32(data.store_id as string), type: "bytes32" },
          { name: "storeName", value: data.store_name as string, type: "string" },
          { name: "category", value: data.category as string, type: "string" },
          { name: "subCategory", value: data.sub_category as string, type: "string" },
          { name: "completedCount", value: data.completed_count as number, type: "uint32" },
          { name: "onTimeCount", value: data.on_time_count as number, type: "uint32" },
          { name: "periodDays", value: data.period_days as number, type: "uint32" },
          { name: "startDate", value: dateToUnixTimestamp(data.start_date as string), type: "uint64" },
          { name: "endDate", value: dateToUnixTimestamp(data.end_date as string), type: "uint64" },
        ]);
      }
      // EAS_EXTRA_ACC 재시도는 extraStoresData 재인코딩이 복잡하므로 핸들러 재실행 방식 권장
      default:
        return null;
    }
  } catch {
    return null;
  }
}

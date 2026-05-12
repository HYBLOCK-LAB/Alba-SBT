import { getDbClient } from "./db-client.ts";

// B-2 /level-check API 호출 및 DB 트리거 완료 플래그 업데이트
// B-2 명세 수령 후 실제 구현으로 교체 예정
export async function triggerLevelCheck(
  attestationId: string,
  userId: string,
  easType: string,
  easUid: string
): Promise<void> {
  const levelCheckApiUrl = Deno.env.get("LEVEL_CHECK_API_URL");
  const levelCheckApiSecret = Deno.env.get("LEVEL_CHECK_API_SECRET");

  // TODO: B-2 /level-check API 명세 수령 후 구현
  // 현재는 stub — 로그만 남기고 triggered=true 처리
  if (!levelCheckApiUrl) {
    console.warn(`[STUB] level-check 미연결 (userId=${userId}, easType=${easType}, easUid=${easUid})`);
    console.warn("[STUB] LEVEL_CHECK_API_URL 환경변수 설정 후 실제 구현으로 교체 필요");
    await markLevelCheckTriggered(attestationId);
    return;
  }

  try {
    const response = await fetch(levelCheckApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${levelCheckApiSecret}`,
      },
      body: JSON.stringify({ userId, newEasType: easType, easUid }),
    });

    if (!response.ok) {
      throw new Error(`level-check API 응답 오류: ${response.status}`);
    }

    await markLevelCheckTriggered(attestationId);
    console.log(`level-check 완료 (userId=${userId}, easType=${easType})`);
  } catch (err) {
    // 실패 시 level_check_triggered=false 유지 → 다음 Edge Function 주기에 재시도
    console.error(`level-check 호출 실패 (userId=${userId}):`, (err as Error).message);
  }
}

// issued 상태이지만 level-check 미완료 건 재시도
export async function retryPendingLevelChecks(): Promise<void> {
  const db = getDbClient();

  const { data: pendingList, error } = await db
    .from("eas_attestations")
    .select("id, user_id, eas_type, eas_uid")
    .eq("status", "issued")
    .eq("level_check_triggered", false)
    .not("eas_uid", "is", null);

  if (error || !pendingList?.length) return;

  for (const record of pendingList) {
    await triggerLevelCheck(record.id, record.user_id, record.eas_type, record.eas_uid);
  }
}

async function markLevelCheckTriggered(attestationId: string): Promise<void> {
  const db = getDbClient();
  await db
    .from("eas_attestations")
    .update({ level_check_triggered: true })
    .eq("id", attestationId);
}

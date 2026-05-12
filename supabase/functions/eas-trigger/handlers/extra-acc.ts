import { ethers } from "ethers";
import { getDbClient } from "../utils/db-client.ts";
import { getSchemaEncoder, dateToUnixTimestamp } from "../utils/eas-client.ts";
import { issueAttestation } from "../utils/attestation.ts";
import { triggerLevelCheck } from "../utils/level-check.ts";

const EAS_TYPE = "EAS_EXTRA_ACC" as const;
const ISSUE_THRESHOLD = 10; // 10회마다 1개 발급

// 전 매장 통합 추가 근무 수락 누적 10회마다 EAS_EXTRA_ACC 발급
export async function handleExtraAcc(): Promise<void> {
  const db = getDbClient();
  const schemaUid = Deno.env.get("EAS_SCHEMA_UID_EXTRA_ACC") ?? "";

  // 1단계: 알바생별 전 매장 수락 누적 횟수 조회
  const { data: userStats, error } = await db
    .from("extra_work_applications")
    .select("user_id")
    .eq("status", "accepted");

  if (error) {
    console.error("EAS_EXTRA_ACC 수락 데이터 조회 실패:", error.message);
    return;
  }

  if (!userStats?.length) return;

  // user_id별 수락 횟수 집계
  const countByUser = new Map<string, number>();
  for (const row of userStats) {
    countByUser.set(row.user_id, (countByUser.get(row.user_id) ?? 0) + 1);
  }

  for (const [userId, totalAccepted] of countByUser) {
    const expectedIssuedCount = Math.floor(totalAccepted / ISSUE_THRESHOLD);
    if (expectedIssuedCount === 0) continue;

    // 2단계: 기발급 횟수 조회
    const { data: issuedList } = await db
      .from("eas_attestations")
      .select("id")
      .eq("user_id", userId)
      .eq("eas_type", EAS_TYPE)
      .eq("status", "issued");

    const issuedCount = issuedList?.length ?? 0;
    const toIssueCount = expectedIssuedCount - issuedCount;

    if (toIssueCount <= 0) continue;

    // 3단계: 매장별 수락 데이터 집계 (extraStoresData 조립용)
    const { data: storeAcceptedList } = await db
      .from("extra_work_applications")
      .select(`
        store_id,
        responded_at,
        stores!inner(name, category, sub_category)
      `)
      .eq("user_id", userId)
      .eq("status", "accepted")
      .order("responded_at", { ascending: true });

    if (!storeAcceptedList?.length) continue;

    // 매장별 그룹핑
    const storeMap = new Map<string, {
      storeName: string;
      category: string;
      subCategory: string;
      acceptedCount: number;
      firstAcceptedAt: string;
      lastAcceptedAt: string;
    }>();

    for (const row of storeAcceptedList) {
      const existing = storeMap.get(row.store_id);
      if (existing) {
        existing.acceptedCount++;
        existing.lastAcceptedAt = row.responded_at;
      } else {
        storeMap.set(row.store_id, {
          storeName: (row.stores as { name: string; category: string; sub_category: string }).name,
          category: (row.stores as { name: string; category: string; sub_category: string }).category,
          subCategory: (row.stores as { name: string; category: string; sub_category: string }).sub_category,
          acceptedCount: 1,
          firstAcceptedAt: row.responded_at,
          lastAcceptedAt: row.responded_at,
        });
      }
    }

    // 알바생 wallet_address 조회
    const { data: user } = await db
      .from("users")
      .select("wallet_address")
      .eq("id", userId)
      .single();

    if (!user?.wallet_address) continue;

    // 4단계: 미발급 횟수만큼 반복 발급
    for (let i = 0; i < toIssueCount; i++) {
      const currentTotal = (issuedCount + i + 1) * ISSUE_THRESHOLD;
      const issuedDate = new Date().toISOString().split("T")[0];

      // extraStoresData ABI 인코딩
      const encodedExtraStoresData = encodeExtraStoresData(storeMap);

      // 스키마 인코딩
      const encoder = getSchemaEncoder(EAS_TYPE);
      const encodedData = encoder.encodeData([
        { name: "totalAcceptedCount", value: currentTotal, type: "uint32" },
        { name: "issuedDate", value: dateToUnixTimestamp(issuedDate), type: "uint64" },
        { name: "extraStoresData", value: encodedExtraStoresData, type: "bytes" },
      ]);

      // attestation_data JSONB 조립
      const storesJsonb = Array.from(storeMap.entries()).map(([storeId, data]) => ({
        store_id: storeId,
        store_name: data.storeName,
        category: data.category,
        sub_category: data.subCategory,
        accepted_count: data.acceptedCount,
        first_accepted_at: data.firstAcceptedAt,
        last_accepted_at: data.lastAcceptedAt,
      }));

      const attestationData = {
        total_accepted_count: currentTotal,
        issued_date: issuedDate,
        stores: storesJsonb,
      };

      const easUid = await issueAttestation({
        userId,
        storeId: null, // EAS_EXTRA_ACC는 전 매장 통합 → store_id NULL
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
}

// 매장별 데이터를 EAS onchain bytes 형식으로 ABI 인코딩
// 각 항목: (bytes32 storeId, string storeName, string category, string subCategory, uint32 acceptedCount, uint64 firstAcceptedAt, uint64 lastAcceptedAt)
function encodeExtraStoresData(
  storeMap: Map<string, {
    storeName: string;
    category: string;
    subCategory: string;
    acceptedCount: number;
    firstAcceptedAt: string;
    lastAcceptedAt: string;
  }>
): string {
  const tupleType = "(bytes32,string,string,string,uint32,uint64,uint64)[]";
  const storesArray = Array.from(storeMap.entries()).map(([storeId, data]) => [
    "0x" + storeId.replace(/-/g, "").padEnd(64, "0"), // bytes32
    data.storeName,
    data.category,
    data.subCategory,
    data.acceptedCount,
    BigInt(Math.floor(new Date(data.firstAcceptedAt).getTime() / 1000)),
    BigInt(Math.floor(new Date(data.lastAcceptedAt).getTime() / 1000)),
  ]);

  return ethers.AbiCoder.defaultAbiCoder().encode([tupleType], [storesArray]);
}

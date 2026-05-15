import { ethers } from "ethers";
import { getEasClient, EasType } from "./eas-client.ts";
import { getDbClient } from "./db-client.ts";

const MAX_RETRY_COUNT = 3;

interface IssueAttestationParams {
  userId: string;
  storeId: string | null;
  easType: EasType;
  schemaUid: string;
  encodedData: string;
  attestationData: Record<string, unknown>;
  recipient: string;
}

// 트랜잭션 receipt 로그에서 Attested 이벤트의 UID 파싱
function parseAttestationUid(
  receipt: ethers.TransactionReceipt,
  iface: ethers.Interface
): string {
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed?.name === "Attested") {
        return parsed.args.uid as string;
      }
    } catch {
      // 파싱 불가 로그 무시
    }
  }
  throw new Error("Attested 이벤트를 트랜잭션 로그에서 찾을 수 없음");
}

// 공통 EAS 발급 + DB INSERT 함수
// 흐름: pending INSERT → 온체인 attest → issued UPDATE (실패 시 failed UPDATE)
export async function issueAttestation(params: IssueAttestationParams): Promise<string | null> {
  const db = getDbClient();
  const { contract } = getEasClient();

  if (!params.schemaUid) {
    console.error(`Schema UID 미설정: ${params.easType}`);
    return null;
  }

  // 1단계: pending 상태로 선 INSERT (중복 방지 및 실패 추적)
  const { data: inserted, error: insertError } = await db
    .from("eas_attestations")
    .insert({
      user_id: params.userId,
      store_id: params.storeId,
      eas_type: params.easType,
      attestation_data: params.attestationData,
      status: "pending",
      retry_count: 0,
      level_check_triggered: false,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error(`eas_attestations INSERT 실패 (${params.easType}):`, insertError?.message);
    return null;
  }

  const recordId = inserted.id;

  try {
    // 2단계: EAS 온체인 발행
    const tx = await contract.attest({
      schema: params.schemaUid,
      data: {
        recipient: params.recipient,
        expirationTime: 0n,   // 만료 없음
        revocable: false,      // ERC-5192 SBT: revoke 불가
        refUID: ethers.ZeroHash,
        data: params.encodedData,
        value: 0n,
      },
    });

    // 트랜잭션 채굴 대기 후 receipt에서 UID 파싱
    const receipt: ethers.TransactionReceipt = await tx.wait();
    const easUid = parseAttestationUid(receipt, contract.interface);
    const txHash = receipt.hash;

    // 3단계: 발급 성공 → issued 업데이트
    await db
      .from("eas_attestations")
      .update({
        eas_uid: easUid,
        transaction_hash: txHash,
        status: "issued",
        issued_at: new Date().toISOString(),
      })
      .eq("id", recordId);

    console.log(`EAS 발급 완료 (${params.easType}): uid=${easUid}`);
    return easUid;
  } catch (err) {
    // 4단계: 발급 실패 → failed 업데이트, retry_count +1
    await db
      .from("eas_attestations")
      .update({ status: "failed", retry_count: 1 })
      .eq("id", recordId);

    console.error(`EAS 발급 실패 (${params.easType}):`, (err as Error).message);
    return null;
  }
}

// 실패 건 재시도 (status=failed AND retry_count < MAX_RETRY_COUNT)
export async function retryFailedAttestations(
  handlers: Record<EasType, (recordId: string, attestationData: Record<string, unknown>, recipient: string) => Promise<string | null>>
): Promise<void> {
  const db = getDbClient();

  const { data: failedList, error } = await db
    .from("eas_attestations")
    .select("id, eas_type, attestation_data, user_id")
    .eq("status", "failed")
    .lt("retry_count", MAX_RETRY_COUNT);

  if (error || !failedList?.length) return;

  for (const record of failedList) {
    const { data: user } = await db
      .from("users")
      .select("wallet_address")
      .eq("id", record.user_id)
      .single();

    if (!user?.wallet_address) continue;

    const handler = handlers[record.eas_type as EasType];
    if (!handler) continue;

    await db
      .from("eas_attestations")
      .update({ retry_count: db.rpc("increment_retry", { row_id: record.id }) })
      .eq("id", record.id);

    await handler(record.id, record.attestation_data, user.wallet_address);
  }
}

export class SignApprovalDto {
  levelUpRequestId?: string;
  workerAddress?: string;
  level?: number;
  nonce?: string;
  sig1?: string;
  managerSignature?: string;
}

# Alba-SBT SIWE and JWT Interface Draft

## Scope

This document defines the authentication contract between developer C, developer A, and backend CommonModule ownership in B-1.

## Authentication Model

- Authentication method: SIWE (Sign-In with Ethereum)
- Session token: JWT
- JWT algorithm: `HS256`
- JWT expiration: `24h`
- Refresh token: not used
- Re-authentication policy: after JWT expiration, the user must sign SIWE again

## Source of Truth

- Wallet identity source: `users.wallet_address`
- Temporary SIWE replay protection store: `siwe_nonces`
- Session validation source: JWT signature + expiration

## `siwe_nonces` Table Usage

Table from `DatabaseSchema.md`:

- `nonce`: unique random nonce string
- `wallet_address`: requested wallet address
- `expires_at`: issued time + 5 minutes
- `created_at`: created time

### C Ownership

Developer C owns:

- nonce creation
- nonce validation
- nonce deletion after successful verification
- cleanup of expired nonce rows

## Auth Flow

### 1. Wallet Connect

Frontend calls the wallet connector owned by developer C.

Expected result:

- connected wallet address
- connection state
- connection error state if any

### 2. Nonce Request

Client requests a nonce before signing.

Suggested request:

```json
{
  "walletAddress": "0xabc..."
}
```

Suggested response:

```json
{
  "nonce": "8c3b9c7e-...",
  "expiresAt": "2026-05-06T12:00:00+09:00"
}
```

### 3. SIWE Message Sign

Client constructs a SIWE message using:

- domain or app name
- wallet address
- nonce
- issued time
- chain id

User signs this message with the connected wallet.

### 4. Signature Verification

Backend verifies:

- nonce exists
- nonce is not expired
- nonce wallet address matches the signing wallet
- SIWE message signature is valid

After successful verification:

- the nonce row must be deleted immediately
- the session JWT is issued

### 5. User Lookup and Signup Branch

After signature verification:

- lookup `users.wallet_address`
- if the wallet already exists: treat as existing user
- if the wallet does not exist: treat as new user

### 6. Lv.1 Auto Mint Branch

For a new user only:

- after signup completion and JWT issuance
- C triggers Lv.1 SBT mint using the platform-only path
- no B-2 multisig flow is required

## JWT Payload

Recommended minimum payload:

```json
{
  "sub": "user_uuid",
  "walletAddress": "0xabc...",
  "accountType": "worker",
  "iat": 1778036400,
  "exp": 1778122800
}
```

### Field Meaning

- `sub`: user id from `users.id`
- `walletAddress`: canonical wallet address
- `accountType`: `worker` or `manager`
- `iat`: issued-at timestamp
- `exp`: expiration timestamp

## JWT Secret and Validation

Developer C provides the JWT contract to B-1:

- secret management policy
- algorithm: `HS256`
- expiration: `24h`

B-1 uses this contract to implement the shared `CommonModule` auth guard.

## Frontend Contract for A

Developer A should consume authentication via C-owned wallet and auth services only.

### Wallet Hook Shape

```ts
interface WalletState {
  walletAddress: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}
```

### SIWE Sign-In Result Shape

```ts
interface SignInResult {
  walletAddress: string;
  token: string;
  isNewUser: boolean;
  accountType?: "worker" | "manager";
}
```

### Auth UI Routing Rule

- `isNewUser = true`: navigate to signup extra-info screen
- `isNewUser = false`: navigate by `accountType`

## Error Cases

Suggested high-level auth error categories:

- wallet not connected
- nonce expired
- nonce not found
- signature verification failed
- wallet mismatch
- JWT issuance failed
- Lv.1 auto mint failed

Frontend does not need blockchain-level detail for every case, but should distinguish:

- retryable auth errors
- fatal auth errors

## Ownership Summary

### Developer C

- wallet connect module
- SIWE nonce CRUD
- signature verification logic
- JWT issuance contract
- Lv.1 auto mint flow

### Developer A

- wallet connect UI
- auth loading/error UI
- post-login routing

### Developer B-1

- shared NestJS `CommonModule`
- JWT guard implementation using C's auth contract


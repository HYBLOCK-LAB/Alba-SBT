# Backend Workspace

This directory is the starting point for the Alba-SBT backend work.

## Current scope

The first backend slice is the B-2 database layer for Supabase/PostgreSQL.

Included in the initial migration draft:

- `users`
- `stores`
- `staff_assignments`
- `eas_attestations`
- `level_up_requests`
- `badge_images`
- `sbt_tokens`

## Structure

- `supabase/migrations`
  - Draft SQL migrations for the B-2 owned schema
- `src`
  - Minimal NestJS-style API skeleton for B-2 domains

## Agreed decisions reflected here

- `wallet_address` keeps original casing
- app access is `API only`
- same user can rejoin the same store
- rejoin creates a new `staff_assignments` row
- `staff_number` is kept, but has no unique constraint
- `staff_assignments` only uses `pending` and `active`
- SBTs are cumulative and remain stored after level-up
- `level_up_requests` only blocks duplicate in-progress requests
- B-2 starts with `users`, `stores`, `staff_assignments`, then the blockchain-tracking tables

## Important implementation note

To support re-entry without adding extra assignment statuses, the draft adds:

- `staff_assignments.ended_at`

That lets us keep:

- old assignment rows for history
- only one open active assignment per `user_id + store_id`

## Next implementation targets

- add request validation and exception mapping
- add approval-sign workflow after approval ownership and contract ABI are finalized
- split read/write DTOs from persistence models

## B-2 level-up read APIs

- `POST /level-check`
  - Re-evaluates issued EAS counts and creates the next eligible `level_up_requests` row.
- `GET /level-up/status/:userId`
  - Returns `currentLevel`, the latest request, the active in-progress request, and request history for worker polling UI.
- `GET /level-up/requests/:requestId`
  - Returns request detail, worker wallet info, target badge image info, evidence snapshot, signatures, nonce, and minted SBT token info when available.

## Remaining design risk

`wallet_address` is stored as-is and not normalized. This means the same wallet could be inserted more than once if different casing is used. The current draft preserves the agreed policy and does not enforce case-insensitive uniqueness.

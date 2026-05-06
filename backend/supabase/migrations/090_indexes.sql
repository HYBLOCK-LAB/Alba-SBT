create index if not exists stores_manager_id_idx
  on public.stores (manager_id);

create index if not exists staff_assignments_user_store_idx
  on public.staff_assignments (user_id, store_id);

create index if not exists staff_assignments_store_status_idx
  on public.staff_assignments (store_id, status);

create index if not exists staff_assignments_store_staff_number_idx
  on public.staff_assignments (store_id, staff_number);

create unique index if not exists staff_assignments_one_open_active_idx
  on public.staff_assignments (user_id, store_id)
  where status = 'active' and ended_at is null;

create index if not exists eas_attestations_user_type_status_idx
  on public.eas_attestations (user_id, eas_type, status);

create index if not exists eas_attestations_user_status_type_idx
  on public.eas_attestations (user_id, status, eas_type);

create index if not exists level_up_requests_user_status_target_idx
  on public.level_up_requests (user_id, status, target_level);

create unique index if not exists level_up_requests_one_in_progress_idx
  on public.level_up_requests (user_id, target_level)
  where status in ('pending', 'awaiting_approval', 'multisig_signed');

create unique index if not exists level_up_requests_user_target_unique_idx
  on public.level_up_requests (user_id, target_level);

create unique index if not exists level_up_requests_nonce_idx
  on public.level_up_requests (nonce);

create index if not exists sbt_tokens_user_level_idx
  on public.sbt_tokens (user_id, level);

create unique index if not exists sbt_tokens_user_level_unique_idx
  on public.sbt_tokens (user_id, level);

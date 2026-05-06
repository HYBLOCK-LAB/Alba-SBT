create table if not exists public.eas_attestations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  store_id uuid references public.stores(id) on delete restrict,
  eas_type public.eas_type_enum not null,
  eas_uid varchar not null unique,
  attestation_data jsonb not null,
  issued_at timestamptz not null,
  transaction_hash varchar,
  status public.eas_status_enum not null default 'pending',
  retry_count int not null default 0,
  created_at timestamptz not null default now(),
  constraint eas_attestations_retry_count_non_negative check (retry_count >= 0)
);

create table if not exists public.level_up_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  current_level int not null,
  target_level int not null,
  status public.level_up_status_enum not null,
  nonce text not null,
  used_eas_uids jsonb not null default '[]'::jsonb,
  requirements_snapshot jsonb not null default '{}'::jsonb,
  manager_signature varchar,
  platform_signature varchar,
  sbt_token_id varchar,
  requested_at timestamptz not null,
  approved_at timestamptz,
  minted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint level_up_requests_current_level_range check (current_level between 1 and 10),
  constraint level_up_requests_target_level_range check (target_level between 1 and 10),
  constraint level_up_requests_target_gt_current check (target_level > current_level)
);

create table if not exists public.badge_images (
  id uuid primary key default gen_random_uuid(),
  level int not null unique,
  image_uri varchar not null unique,
  image_filename varchar not null,
  category varchar,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint badge_images_level_range check (level between 1 and 10),
  constraint badge_images_filename_not_blank check (btrim(image_filename) <> '')
);

create table if not exists public.sbt_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  token_id varchar not null unique,
  level int not null,
  metadata_uri varchar not null,
  badge_image_uri varchar not null,
  contract_address varchar not null,
  transaction_hash varchar not null,
  minted_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint sbt_tokens_level_range check (level between 1 and 10)
);

drop trigger if exists set_badge_images_updated_at on public.badge_images;
create trigger set_badge_images_updated_at
before update on public.badge_images
for each row
execute function public.set_updated_at();

create table if not exists badge_images (
  id uuid primary key default gen_random_uuid(),
  level int not null unique check (level between 1 and 10),
  image_uri varchar not null unique,
  image_filename varchar not null,
  category varchar,
  description text,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists sbt_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  token_id varchar not null unique,
  level int not null check (level between 1 and 10),
  metadata_uri varchar not null,
  badge_image_uri varchar not null,
  contract_address varchar not null,
  transaction_hash varchar not null,
  minted_at timestamp not null,
  created_at timestamp not null default now()
);

create index if not exists idx_sbt_tokens_user_id on sbt_tokens(user_id);
create index if not exists idx_sbt_tokens_level on sbt_tokens(level);

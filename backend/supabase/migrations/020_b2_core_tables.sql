create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  account_type public.account_type_enum not null,
  name varchar not null,
  email varchar unique,
  phone varchar,
  wallet_address varchar not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_name_not_blank check (btrim(name) <> '')
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.users(id) on delete restrict,
  name varchar not null,
  store_code varchar(6) not null unique,
  category public.store_category_enum not null,
  sub_category varchar not null,
  address varchar not null,
  latitude numeric(10, 8) not null,
  longitude numeric(11, 8) not null,
  gps_radius_meters int not null default 50,
  qr_validity_start_hour int not null,
  qr_validity_end_hour int not null,
  business_number varchar,
  contact varchar,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stores_name_not_blank check (btrim(name) <> ''),
  constraint stores_sub_category_not_blank check (btrim(sub_category) <> ''),
  constraint stores_address_not_blank check (btrim(address) <> ''),
  constraint stores_gps_radius_positive check (gps_radius_meters > 0),
  constraint stores_qr_start_hour_range check (qr_validity_start_hour between 0 and 23),
  constraint stores_qr_end_hour_range check (qr_validity_end_hour between 0 and 23)
);

create table if not exists public.staff_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  store_id uuid not null references public.stores(id) on delete restrict,
  staff_number varchar not null,
  status public.staff_assignment_status_enum not null,
  approved_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_assignments_staff_number_not_blank check (btrim(staff_number) <> ''),
  constraint staff_assignments_status_approved_at_check check (
    (status = 'pending' and approved_at is null)
    or (status = 'active' and approved_at is not null)
  ),
  constraint staff_assignments_ended_at_after_approved_at check (
    ended_at is null
    or approved_at is null
    or ended_at >= approved_at
  )
);

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists set_stores_updated_at on public.stores;
create trigger set_stores_updated_at
before update on public.stores
for each row
execute function public.set_updated_at();

drop trigger if exists set_staff_assignments_updated_at on public.staff_assignments;
create trigger set_staff_assignments_updated_at
before update on public.staff_assignments
for each row
execute function public.set_updated_at();

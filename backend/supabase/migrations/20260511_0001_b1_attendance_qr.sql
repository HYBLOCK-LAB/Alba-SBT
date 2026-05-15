create extension if not exists "pgcrypto";

do $$
begin
  create type attendance_type as enum ('regular', 'extra');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type attendance_status as enum ('on_time', 'late', 'absent');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type extra_work_application_status as enum ('pending', 'accepted', 'not_selected');
exception
  when duplicate_object then null;
end $$;

create table if not exists qr_tokens (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  token varchar not null unique,
  expires_at timestamp not null,
  created_by uuid not null references users(id),
  created_at timestamp not null default now()
);

create table if not exists recurring_schedules (
  id uuid primary key default gen_random_uuid(),
  staff_assignment_id uuid not null references staff_assignments(id),
  store_id uuid not null references stores(id),
  user_id uuid not null references users(id),
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  effective_from date not null,
  is_active boolean not null default true,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  staff_assignment_id uuid not null references staff_assignments(id),
  store_id uuid not null references stores(id),
  user_id uuid not null references users(id),
  scheduled_date date not null,
  scheduled_start_time time not null,
  scheduled_end_time time not null,
  is_cancelled boolean not null default false,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now(),
  unique (staff_assignment_id, scheduled_date)
);

create table if not exists extra_work_requests (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  manager_id uuid not null references users(id),
  requested_date date not null,
  requested_start_time time not null,
  requested_end_time time not null,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists extra_work_applications (
  id uuid primary key default gen_random_uuid(),
  extra_work_request_id uuid not null references extra_work_requests(id),
  staff_assignment_id uuid not null references staff_assignments(id),
  user_id uuid not null references users(id),
  store_id uuid not null references stores(id),
  status extra_work_application_status not null default 'pending',
  applied_at timestamp not null default now(),
  responded_at timestamp,
  created_at timestamp not null default now(),
  unique (extra_work_request_id, user_id)
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  staff_assignment_id uuid not null references staff_assignments(id),
  user_id uuid not null references users(id),
  store_id uuid not null references stores(id),
  schedule_id uuid references schedules(id),
  type attendance_type not null,
  status attendance_status not null,
  clock_in_time timestamp,
  clock_out_time timestamp,
  extra_work_application_id uuid references extra_work_applications(id),
  clock_in_latitude decimal(10, 8),
  clock_in_longitude decimal(11, 8),
  clock_in_gps_verified boolean not null default false,
  clock_in_qr_scanned varchar,
  clock_out_latitude decimal(10, 8),
  clock_out_longitude decimal(11, 8),
  clock_out_gps_verified boolean,
  clock_out_qr_scanned varchar,
  created_at timestamp not null default now()
);

create index if not exists idx_qr_tokens_token on qr_tokens(token);
create index if not exists idx_qr_tokens_expires_at on qr_tokens(expires_at);
create index if not exists idx_schedules_user_date on schedules(user_id, scheduled_date);
create index if not exists idx_attendance_user_store on attendance(user_id, store_id);
create index if not exists idx_attendance_schedule on attendance(schedule_id);
create index if not exists idx_extra_work_applications_user on extra_work_applications(user_id);
create unique index if not exists idx_extra_work_one_accepted
  on extra_work_applications(extra_work_request_id)
  where status = 'accepted';

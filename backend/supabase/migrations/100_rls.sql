alter table public.users enable row level security;
alter table public.stores enable row level security;
alter table public.staff_assignments enable row level security;
alter table public.eas_attestations enable row level security;
alter table public.level_up_requests enable row level security;
alter table public.badge_images enable row level security;
alter table public.sbt_tokens enable row level security;

-- API-only mode:
-- no client-facing policies are created here.
-- service_role-based server access is expected.

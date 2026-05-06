do $$
begin
  if not exists (select 1 from pg_type where typname = 'account_type_enum') then
    create type public.account_type_enum as enum ('worker', 'manager');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'store_category_enum') then
    create type public.store_category_enum as enum (
      'fnb',
      'retail',
      'production',
      'service',
      'culture',
      'office',
      'education'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'staff_assignment_status_enum') then
    create type public.staff_assignment_status_enum as enum ('pending', 'active');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'eas_type_enum') then
    create type public.eas_type_enum as enum (
      'EAS_EXP_TIME',
      'EAS_FAITH_ATT',
      'EAS_WORK_COMP',
      'EAS_EXTRA_ACC'
    );
  end if;
end
$$;

alter type public.eas_type_enum add value if not exists 'EAS_WORK_COMP';
alter type public.eas_type_enum add value if not exists 'EAS_EXTRA_ACC';

do $$
begin
  if not exists (select 1 from pg_type where typname = 'eas_status_enum') then
    create type public.eas_status_enum as enum ('pending', 'issued', 'failed');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'level_up_status_enum') then
    create type public.level_up_status_enum as enum (
      'pending',
      'awaiting_approval',
      'multisig_signed',
      'minted',
      'rejected'
    );
  end if;
end
$$;

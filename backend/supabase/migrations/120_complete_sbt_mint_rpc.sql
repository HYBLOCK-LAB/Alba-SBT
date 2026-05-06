create or replace function public.complete_sbt_mint(
  p_level_up_request_id uuid,
  p_token_id text,
  p_metadata_uri text,
  p_badge_image_uri text,
  p_contract_address text,
  p_transaction_hash text,
  p_minted_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_level_up_request public.level_up_requests%rowtype;
  v_sbt_token public.sbt_tokens%rowtype;
  v_updated_level_up_request public.level_up_requests%rowtype;
  v_minted_at timestamptz := coalesce(p_minted_at, now());
begin
  select *
    into v_level_up_request
    from public.level_up_requests
   where id = p_level_up_request_id
   for update;

  if not found then
    raise exception 'level_up_request_not_found' using errcode = 'P0002';
  end if;

  if v_level_up_request.status = 'minted' or v_level_up_request.minted_at is not null then
    raise exception 'level_up_request_already_minted' using errcode = '23505';
  end if;

  if v_level_up_request.status in ('rejected', 'failed') then
    raise exception 'level_up_request_not_mintable' using errcode = 'P0001';
  end if;

  insert into public.sbt_tokens (
    user_id,
    token_id,
    level,
    metadata_uri,
    badge_image_uri,
    contract_address,
    transaction_hash,
    minted_at
  )
  values (
    v_level_up_request.user_id,
    p_token_id,
    v_level_up_request.target_level,
    p_metadata_uri,
    p_badge_image_uri,
    p_contract_address,
    p_transaction_hash,
    v_minted_at
  )
  returning * into v_sbt_token;

  update public.level_up_requests
     set status = 'minted',
         sbt_token_id = p_token_id,
         minted_at = v_minted_at
   where id = p_level_up_request_id
  returning * into v_updated_level_up_request;

  return jsonb_build_object(
    'sbtToken', to_jsonb(v_sbt_token),
    'levelUpRequest', to_jsonb(v_updated_level_up_request)
  );
end;
$$;

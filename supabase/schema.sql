-- Photo Director storage. Tables are locked (RLS on, no policies); the app only talks to them
-- through the SECURITY DEFINER functions below, keyed by an unguessable per-device UUID.

create table if not exists public.pd_gear (
  device uuid primary key,
  gear jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.pd_plans (
  id uuid primary key default gen_random_uuid(),
  device uuid not null,
  plan jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists pd_plans_device_idx on public.pd_plans (device, created_at desc);
create table if not exists public.pd_usage (
  day date not null,
  device text not null,
  n int not null default 0,
  primary key (day, device)
);
alter table public.pd_gear enable row level security;
alter table public.pd_plans enable row level security;
alter table public.pd_usage enable row level security;

create or replace function public.pd_get_gear(p_device uuid) returns jsonb
language sql security definer set search_path = public as $$
  select gear from pd_gear where device = p_device
$$;

create or replace function public.pd_set_gear(p_device uuid, p_gear jsonb) returns void
language sql security definer set search_path = public as $$
  insert into pd_gear (device, gear) values (p_device, p_gear)
  on conflict (device) do update set gear = excluded.gear, updated_at = now()
$$;

create or replace function public.pd_list_plans(p_device uuid) returns jsonb
language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(s order by created desc), '[]'::jsonb) from (
    select p.created_at as created, jsonb_build_object(
      'id', p.id,
      'createdAt', p.created_at,
      'title', p.plan->>'title',
      'subjectType', p.plan->'inputs'->>'subjectType',
      'kitName', p.plan->'inputs'->>'kitName',
      'thumbRef', p.plan->'thumbs'->>'ref',
      'thumbScene', p.plan->'thumbs'->'scenes'->>0,
      'steps', coalesce(jsonb_array_length(p.plan->'data'->'instructions'), 0) + 1,
      'done', (select count(*) from jsonb_object_keys(coalesce(p.plan->'checklist', '{}'::jsonb))),
      'mock', coalesce((p.plan->'meta'->>'mock')::boolean, false)
    ) as s
    from pd_plans p where p.device = p_device
    order by p.created_at desc limit 100
  ) t
$$;

create or replace function public.pd_get_plan(p_device uuid, p_id uuid) returns jsonb
language sql security definer set search_path = public as $$
  select p.plan || jsonb_build_object('id', p.id, 'createdAt', p.created_at)
  from pd_plans p where p.id = p_id and p.device = p_device
$$;

create or replace function public.pd_add_plan(p_device uuid, p_plan jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  insert into pd_plans (device, plan) values (p_device, p_plan) returning id into new_id;
  delete from pd_plans where device = p_device and id not in (
    select id from pd_plans where device = p_device order by created_at desc limit 100);
  return new_id;
end $$;

create or replace function public.pd_update_plan(p_device uuid, p_id uuid, p_plan jsonb) returns void
language sql security definer set search_path = public as $$
  update pd_plans set plan = p_plan where id = p_id and device = p_device
$$;

create or replace function public.pd_delete_plan(p_device uuid, p_id uuid) returns void
language sql security definer set search_path = public as $$
  delete from pd_plans where id = p_id and device = p_device
$$;

-- Counts one analysis; returns false when the per-device or global daily limit is reached.
create or replace function public.pd_hit(p_device uuid, p_dev_limit int, p_global_limit int) returns boolean
language plpgsql security definer set search_path = public as $$
declare d_n int; g_n int;
begin
  select coalesce(n, 0) into d_n from pd_usage where day = current_date and device = p_device::text;
  select coalesce(sum(n), 0) into g_n from pd_usage where day = current_date;
  if coalesce(d_n, 0) >= p_dev_limit or g_n >= p_global_limit then return false; end if;
  insert into pd_usage (day, device, n) values (current_date, p_device::text, 1)
  on conflict (day, device) do update set n = pd_usage.n + 1;
  delete from pd_usage where day < current_date - 7;
  return true;
end $$;

revoke all on function public.pd_get_gear(uuid), public.pd_set_gear(uuid, jsonb), public.pd_list_plans(uuid),
  public.pd_get_plan(uuid, uuid), public.pd_add_plan(uuid, jsonb), public.pd_update_plan(uuid, uuid, jsonb),
  public.pd_delete_plan(uuid, uuid), public.pd_hit(uuid, int, int) from public;
grant execute on function public.pd_get_gear(uuid), public.pd_set_gear(uuid, jsonb), public.pd_list_plans(uuid),
  public.pd_get_plan(uuid, uuid), public.pd_add_plan(uuid, jsonb), public.pd_update_plan(uuid, uuid, jsonb),
  public.pd_delete_plan(uuid, uuid), public.pd_hit(uuid, int, int) to anon, authenticated;

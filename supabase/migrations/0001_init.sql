-- Enerji Köməkçisi — Stage 2: V1 sxemi + RLS
-- IoT cədvəlləri (iot_devices, energy_readings, energy_summaries) Stage 10-da əlavə olunacaq.

-- ───────── Köməkçi funksiyalar ─────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ───────── Tarif cədvəlləri (profiles bunlara istinad edir) ─────────
create table public.tariff_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade, -- null = sistem tarifi
  country char(2) not null,
  currency char(3) not null,
  name text not null check (char_length(name) between 1 and 120),
  valid_from date,
  valid_to date,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from),
  check ((is_system and owner_id is null) or (not is_system and owner_id is not null))
);

create table public.tariff_tiers (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.tariff_plans(id) on delete cascade,
  from_kwh numeric(12,3) not null check (from_kwh >= 0),
  to_kwh numeric(12,3),              -- null = limitsiz son pillə
  price_per_kwh numeric(12,4) not null check (price_per_kwh >= 0),
  created_at timestamptz not null default now(),
  check (to_kwh is null or to_kwh > from_kwh),
  unique (plan_id, from_kwh)
);

-- ───────── İstifadəçi profili ─────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  locale text not null default 'az' check (locale in ('az','en','ru')),
  currency char(3) not null default 'AZN',
  default_tariff_plan_id uuid references public.tariff_plans(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────── Obyektlər, otaqlar, cihazlar ─────────
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 120),
  type text not null check (type in ('home','summer_house','office','store','farm')),
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index properties_user_idx on public.properties(user_id);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index rooms_property_idx on public.rooms(property_id);

create table public.device_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name_az text not null,
  default_power_w numeric(10,2) check (default_power_w is null or default_power_w >= 0),
  saving_rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  category_id uuid references public.device_categories(id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  power_w numeric(10,2) not null check (power_w >= 0),
  hours_per_day numeric(4,2) not null check (hours_per_day >= 0 and hours_per_day <= 24),
  is_active boolean not null default true,
  source text not null default 'manual' check (source in ('manual','measured')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index devices_property_idx on public.devices(property_id);
create index devices_room_idx on public.devices(room_id);

-- ───────── AI söhbətləri ─────────
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  property_id uuid references public.properties(id) on delete set null,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ai_conversations_user_idx on public.ai_conversations(user_id);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index ai_messages_conv_idx on public.ai_messages(conversation_id, created_at);

-- ───────── updated_at triggerləri ─────────
do $$
declare t text;
begin
  foreach t in array array['tariff_plans','profiles','properties','rooms','devices','ai_conversations']
  loop
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ───────── RLS köməkçiləri ─────────
-- security definer: policy daxilində rekursiv RLS yoxlamasından qaçmaq üçün.
create or replace function public.owns_property(pid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.properties p where p.id = pid and p.user_id = auth.uid());
$$;

create or replace function public.owns_conversation(cid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.ai_conversations c where c.id = cid and c.user_id = auth.uid());
$$;

create or replace function public.owns_tariff_plan(pid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.tariff_plans t
                 where t.id = pid and t.owner_id = auth.uid() and not t.is_system);
$$;

create or replace function public.can_read_tariff_plan(pid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.tariff_plans t
                 where t.id = pid and (t.is_system or t.owner_id = auth.uid()));
$$;

-- ───────── RLS aktivləşdirmə ─────────
alter table public.profiles          enable row level security;
alter table public.properties        enable row level security;
alter table public.rooms             enable row level security;
alter table public.devices           enable row level security;
alter table public.device_categories enable row level security;
alter table public.tariff_plans      enable row level security;
alter table public.tariff_tiers      enable row level security;
alter table public.ai_conversations  enable row level security;
alter table public.ai_messages       enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- properties
create policy properties_all on public.properties for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- rooms
create policy rooms_all on public.rooms for all to authenticated
  using (public.owns_property(property_id)) with check (public.owns_property(property_id));

-- devices: otaq və kateqoriya eyni obyektə aid olmalıdır (aşağıdakı trigger)
create policy devices_all on public.devices for all to authenticated
  using (public.owns_property(property_id)) with check (public.owns_property(property_id));

create or replace function public.check_device_room_property()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.room_id is not null and not exists (
    select 1 from public.rooms r where r.id = new.room_id and r.property_id = new.property_id
  ) then
    raise exception 'Otaq bu obyektə aid deyil';
  end if;
  return new;
end $$;
create trigger devices_room_check before insert or update on public.devices
  for each row execute function public.check_device_room_property();

-- device_categories: hamı oxuya bilər, yazma yalnız service_role (policy yoxdur)
create policy device_categories_select on public.device_categories for select to authenticated using (true);

-- tariff_plans: sistem tarifləri hamıya, şəxsi tarif yalnız sahibinə
create policy tariff_plans_select on public.tariff_plans for select to authenticated
  using (is_system or owner_id = auth.uid());
create policy tariff_plans_insert on public.tariff_plans for insert to authenticated
  with check (owner_id = auth.uid() and not is_system);
create policy tariff_plans_update on public.tariff_plans for update to authenticated
  using (owner_id = auth.uid() and not is_system) with check (owner_id = auth.uid() and not is_system);
create policy tariff_plans_delete on public.tariff_plans for delete to authenticated
  using (owner_id = auth.uid() and not is_system);

-- tariff_tiers
create policy tariff_tiers_select on public.tariff_tiers for select to authenticated
  using (public.can_read_tariff_plan(plan_id));
create policy tariff_tiers_write on public.tariff_tiers for all to authenticated
  using (public.owns_tariff_plan(plan_id)) with check (public.owns_tariff_plan(plan_id));

-- AI
create policy ai_conversations_all on public.ai_conversations for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ai_messages_all on public.ai_messages for all to authenticated
  using (public.owns_conversation(conversation_id)) with check (public.owns_conversation(conversation_id));

-- anon rolu heç bir cədvələ çıxış əldə etmir (policy yoxdur); əlavə sərtləşdirmə:
revoke all on all tables in schema public from anon;

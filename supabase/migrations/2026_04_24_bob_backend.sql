-- ============================================================
--  BOBtheBAGEL — backend schema
--  Planning · Notifications · Calendar · Audits · Orders.reservation
--  A appliquer dans la console Supabase (SQL Editor) ou via la CLI.
--  Les tables existantes (orders / stock / messages / conversations / shops /
--  products / profiles) ne sont PAS recreees ici — on ne fait que les
--  completer (colonnes, bucket, RLS) si elles existent deja.
-- ============================================================

-- ============ ORDERS : ajouter la colonne reservation ============
alter table if exists public.orders
  add column if not exists reservation jsonb;

comment on column public.orders.reservation is
  'Reserve saisie a la reception: { note, items[], photos[], reportedBy, reportedById, reportedAt }';

-- ============ PROFILES : colonnes attendues par le front ============
alter table if exists public.profiles
  add column if not exists role       text default 'user',
  add column if not exists name       text,
  add column if not exists photo_url  text,
  add column if not exists shop_ids   jsonb default '[]'::jsonb;

comment on column public.profiles.role is 'admin = Manager, user = Team BTB, kitchen = Cuisine';
comment on column public.profiles.shop_ids is 'Liste des shops.id autorises pour ce profil (vide = aucun pour users / tous pour admin)';

-- ============ SHOPS : colonnes attendues par le front ============
alter table if exists public.shops
  add column if not exists color      text default '#0E4B30',
  add column if not exists is_active  boolean default true;

-- ============ PLANNING ==========================================
create table if not exists public.planning (
  id           text primary key,
  shop_id      text references public.shops(id) on delete cascade,
  staff_id     uuid references public.profiles(id) on delete set null,
  staff_name   text        not null,
  date         date        not null,
  start_time   time        not null,
  end_time     time        not null,
  role         text        not null default 'Matin',
  note         text,
  created_by   uuid references public.profiles(id) on delete set null,
  updated_at   timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists planning_shop_date_idx
  on public.planning (shop_id, date);

alter table public.planning enable row level security;

-- lecture : tout authentifie (on filtrera par shop cote front jusqu'a I1)
drop policy if exists planning_select_all on public.planning;
create policy planning_select_all on public.planning
  for select using (auth.role() = 'authenticated');

-- ecriture : uniquement Manager
drop policy if exists planning_write_manager on public.planning;
create policy planning_write_manager on public.planning
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============ NOTIFICATIONS =====================================
create table if not exists public.notifications (
  id           text primary key,
  type         text        not null,
  role         text        not null default 'admin',
  title        text        not null,
  body         text        not null default '',
  shop_id      text references public.shops(id) on delete set null,
  order_id     text,
  created_by   uuid references public.profiles(id) on delete set null,
  seen_by      jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_role_idx
  on public.notifications (role, created_at desc);

alter table public.notifications enable row level security;

-- lecture : uniquement les users dont role correspond (ou notif globale role='all')
drop policy if exists notifications_select_by_role on public.notifications;
create policy notifications_select_by_role on public.notifications
  for select using (
    role = 'all'
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = public.notifications.role
    )
  );

-- ecriture : tout authentifie (creation coherente cote serveur plus tard)
drop policy if exists notifications_insert_authenticated on public.notifications;
create policy notifications_insert_authenticated on public.notifications
  for insert with check (auth.role() = 'authenticated');

-- update seen_by : tout authentifie
drop policy if exists notifications_update_seen on public.notifications;
create policy notifications_update_seen on public.notifications
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists notifications_delete_manager on public.notifications;
create policy notifications_delete_manager on public.notifications
  for delete using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============ CALENDAR EVENTS ===================================
create table if not exists public.calendar_events (
  id           text primary key,
  title        text        not null,
  description  text        not null default '',
  date         date        not null,
  time         time,
  end_time     time,
  status       text        not null default 'planned',
  color_tag    text,
  event_type   text        not null default 'generic',
  shop_ids     jsonb       not null default '[]'::jsonb,
  checklist    jsonb       not null default '[]'::jsonb,
  author_id    uuid references public.profiles(id) on delete set null,
  author_name  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists calendar_events_date_idx
  on public.calendar_events (date);

alter table public.calendar_events enable row level security;

drop policy if exists calendar_select_all on public.calendar_events;
create policy calendar_select_all on public.calendar_events
  for select using (auth.role() = 'authenticated');

drop policy if exists calendar_insert_auth on public.calendar_events;
create policy calendar_insert_auth on public.calendar_events
  for insert with check (auth.role() = 'authenticated');

drop policy if exists calendar_update_auth on public.calendar_events;
create policy calendar_update_auth on public.calendar_events
  for update using (auth.role() = 'authenticated');

drop policy if exists calendar_delete_manager on public.calendar_events;
create policy calendar_delete_manager on public.calendar_events
  for delete using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
    or author_id = auth.uid()
  );

-- ============ AUDITS ============================================
create table if not exists public.audits (
  id            text primary key,
  shop_id       text references public.shops(id) on delete set null,
  shop_name     text not null default '',
  auditor_id    uuid references public.profiles(id) on delete set null,
  auditor_name  text not null default '',
  status        text not null default 'draft',
  note          text not null default '',
  photos        jsonb not null default '[]'::jsonb,
  sections      jsonb not null default '[]'::jsonb,
  score         integer,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index if not exists audits_shop_created_idx
  on public.audits (shop_id, created_at desc);

alter table public.audits enable row level security;

drop policy if exists audits_select_auth on public.audits;
create policy audits_select_auth on public.audits
  for select using (auth.role() = 'authenticated');

drop policy if exists audits_upsert_manager on public.audits;
create policy audits_upsert_manager on public.audits
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============ STORAGE BUCKETS ===================================
-- chat-photos et audit-photos (public read, managed write)
insert into storage.buckets (id, name, public)
values ('chat-photos', 'chat-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('audit-photos', 'audit-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('reception-photos', 'reception-photos', true)
on conflict (id) do nothing;

-- Policies : lecture public, upload pour users authentifies
do $$ begin
  drop policy if exists "public-read-chat" on storage.objects;
  drop policy if exists "public-read-audit" on storage.objects;
  drop policy if exists "public-read-reception" on storage.objects;
  drop policy if exists "auth-upload-chat" on storage.objects;
  drop policy if exists "auth-upload-audit" on storage.objects;
  drop policy if exists "auth-upload-reception" on storage.objects;
exception when others then null;
end $$;

create policy "public-read-chat" on storage.objects
  for select using (bucket_id = 'chat-photos');
create policy "public-read-audit" on storage.objects
  for select using (bucket_id = 'audit-photos');
create policy "public-read-reception" on storage.objects
  for select using (bucket_id = 'reception-photos');

create policy "auth-upload-chat" on storage.objects
  for insert with check (bucket_id = 'chat-photos' and auth.role() = 'authenticated');
create policy "auth-upload-audit" on storage.objects
  for insert with check (bucket_id = 'audit-photos' and auth.role() = 'authenticated');
create policy "auth-upload-reception" on storage.objects
  for insert with check (bucket_id = 'reception-photos' and auth.role() = 'authenticated');

-- ============ REALTIME ==========================================
-- Activer les publications realtime (a faire aussi depuis l'UI Supabase)
alter publication supabase_realtime add table public.planning;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.calendar_events;
alter publication supabase_realtime add table public.audits;

-- ============ NOTES =============================================
-- 1) Les droits par boutique (I1) ne sont pas encore appliques ici car
--    ils dependent du lien profile <-> shops. A ajouter quand les users
--    Supabase Auth sont en place.
-- 2) profiles.role = 'admin' correspond au role Manager cote front
--    ('user' = Team BTB, 'kitchen' = Kitchen).

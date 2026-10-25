-- Apply to a Supabase Free project. No paid extension or background job is required.
create table if not exists public.projects (
  id text primary key, owner text not null, name text not null, data text not null,
  version integer not null default 1, published text, share_token text unique,
  plan text not null default 'launch', invoice_status text not null default 'unbilled',
  invoice_amount integer not null default 0 check (invoice_amount >= 0),
  created bigint not null, updated bigint not null
);
create index if not exists projects_owner on public.projects(owner);
create table if not exists public.events (
  id text primary key, project text not null references public.projects(id) on delete cascade,
  type text not null check(type in ('view','plot','whatsapp','document')), plot text, created bigint not null
);
create index if not exists events_project_time on public.events(project,created);
create table if not exists public.activity (
  id text primary key, project text not null references public.projects(id) on delete cascade,
  actor text not null, action text not null, created bigint not null
);
create index if not exists activity_project_time on public.activity(project,created);
-- Access goes through the authenticated app API. Browser clients cannot read or write tables directly.
alter table public.projects enable row level security;
alter table public.events enable row level security;
alter table public.activity enable row level security;
revoke all on public.projects,public.events,public.activity from anon,authenticated;
grant select,insert,update,delete on public.projects,public.events,public.activity to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('plotera-assets','plotera-assets',false,26214400,array['image/png','image/jpeg','image/webp','application/pdf','model/gltf-binary','audio/mpeg'])
on conflict(id) do nothing;

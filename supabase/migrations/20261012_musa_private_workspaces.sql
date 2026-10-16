-- MUSA Creative Laboratory, isolated Supabase project ygcusertmukfifwpnlkp.
-- Do not run this migration against Casa Clara or NeoTeam.
create table if not exists public.musa_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  document jsonb not null default '{"favorites":[],"artworks":[],"sessions":[],"references":[],"searches":[],"active":null}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint musa_workspace_document_object check (jsonb_typeof(document) = 'object'),
  constraint musa_workspace_document_max_size check (pg_column_size(document) < 3000000)
);
alter table public.musa_workspaces enable row level security;
revoke all on public.musa_workspaces from anon, public;
grant select, insert, update, delete on public.musa_workspaces to authenticated;
create policy "Users can read only their workspace" on public.musa_workspaces for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert only their workspace" on public.musa_workspaces for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update only their workspace" on public.musa_workspaces for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete only their workspace" on public.musa_workspaces for delete to authenticated using ((select auth.uid()) = user_id);
create or replace function public.musa_set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger musa_workspace_updated_at before update on public.musa_workspaces
for each row execute function public.musa_set_updated_at();
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('musa-artworks','musa-artworks',false,6291456,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false, file_size_limit=6291456,
allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy "MUSA private photos select" on storage.objects for select to authenticated
using (bucket_id = 'musa-artworks' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "MUSA private photos insert" on storage.objects for insert to authenticated
with check (bucket_id = 'musa-artworks' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "MUSA private photos update" on storage.objects for update to authenticated
using (bucket_id = 'musa-artworks' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'musa-artworks' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "MUSA private photos delete" on storage.objects for delete to authenticated
using (bucket_id = 'musa-artworks' and (storage.foldername(name))[1] = (select auth.uid())::text);

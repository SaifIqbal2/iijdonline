-- Run this in Supabase SQL Editor.
-- After creating a user in Supabase Auth, promote that user's UUID:
-- update public.admin_users set is_active = true where user_id = 'YOUR-USER-UUID';

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text,
  article_type text,
  abstract text,
  section text not null default 'inpress' check (section in ('inpress', 'inprogress', 'current', 'archive')),
  order_number integer not null default 0,
  page_number text,
  volume text,
  issue text,
  doi text,
  pdf_path text not null,
  published_at date,
  created_by uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_section_order_idx
  on public.articles (section, order_number, published_at desc, created_at desc);

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid() and is_active = true
  );
$$;

alter table public.admin_users enable row level security;
alter table public.articles enable row level security;

create policy "admins can read their admin record"
  on public.admin_users for select
  to authenticated
  using (user_id = auth.uid());

create policy "public can read published article metadata"
  on public.articles for select
  to anon, authenticated
  using (true);

create policy "admins can insert articles"
  on public.articles for insert
  to authenticated
  with check (public.is_active_admin() and created_by = auth.uid());

create policy "admins can update articles"
  on public.articles for update
  to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());

create policy "admins can delete articles"
  on public.articles for delete
  to authenticated
  using (public.is_active_admin());

insert into storage.buckets (id, name, public)
values ('article-pdfs', 'article-pdfs', false)
on conflict (id) do nothing;

-- Public article PDFs are viewed on the website through signed URLs, so anon users need
-- permission to read the object metadata for the storage bucket.
create policy "public can read article pdfs via signed urls"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'article-pdfs');

create policy "admins can upload article pdfs"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'article-pdfs' and public.is_active_admin());

create policy "admins can update article pdfs"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'article-pdfs' and public.is_active_admin())
  with check (bucket_id = 'article-pdfs' and public.is_active_admin());

create policy "admins can delete article pdfs"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'article-pdfs' and public.is_active_admin());

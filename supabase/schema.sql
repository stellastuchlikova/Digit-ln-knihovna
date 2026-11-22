-- One private catalog per Supabase account. Run this in Supabase SQL Editor.
create table if not exists public.books (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  book_data jsonb,
  deleted_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint books_record_state check (
    (book_data is not null and deleted_at is null)
    or (book_data is null and deleted_at is not null)
  )
);

alter table public.books enable row level security;

create policy "Users can view their own books"
  on public.books for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own books"
  on public.books for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own books"
  on public.books for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists books_user_updated_idx
  on public.books (user_id, updated_at desc);

grant select, insert, update on public.books to authenticated;

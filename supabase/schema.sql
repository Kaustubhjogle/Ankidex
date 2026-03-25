
create extension if not exists "pgcrypto";

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  front text not null,
  back text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.card_reviews (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ease_factor double precision not null default 2.2,
  interval integer not null default 0,
  next_review_at timestamptz not null default now(),
  streak integer not null default 0,
  reviews integer not null default 0,
  created_at timestamptz not null default now(),
  unique (card_id, user_id)
);

alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.card_reviews enable row level security;

create policy "decks_select_own" on public.decks
for select using (auth.uid() = user_id);

create policy "decks_insert_own" on public.decks
for insert with check (auth.uid() = user_id);

create policy "decks_update_own" on public.decks
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "decks_delete_own" on public.decks
for delete using (auth.uid() = user_id);

create policy "cards_select_own" on public.cards
for select using (
  exists (
    select 1 from public.decks d
    where d.id = cards.deck_id and d.user_id = auth.uid()
  )
);

create policy "cards_insert_own" on public.cards
for insert with check (
  exists (
    select 1 from public.decks d
    where d.id = cards.deck_id and d.user_id = auth.uid()
  )
);

create policy "cards_update_own" on public.cards
for update using (
  exists (
    select 1 from public.decks d
    where d.id = cards.deck_id and d.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.decks d
    where d.id = cards.deck_id and d.user_id = auth.uid()
  )
);

create policy "cards_delete_own" on public.cards
for delete using (
  exists (
    select 1 from public.decks d
    where d.id = cards.deck_id and d.user_id = auth.uid()
  )
);

create policy "reviews_select_own" on public.card_reviews
for select using (auth.uid() = user_id);

create policy "reviews_insert_own" on public.card_reviews
for insert with check (auth.uid() = user_id);

create policy "reviews_update_own" on public.card_reviews
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reviews_delete_own" on public.card_reviews
for delete using (auth.uid() = user_id);

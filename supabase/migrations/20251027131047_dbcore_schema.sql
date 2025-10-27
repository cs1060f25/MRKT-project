-- Create users table
create table public.users (
  id uuid primary key,
  email text unique not null,
  full_name text,
  created_at timestamptz default now() not null
);

-- Create events table
create table public.events (
  id uuid primary key,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  org text not null,
  created_by uuid not null references public.users(id),
  created_at timestamptz default now() not null
);

-- Create asks table
create table public.asks (
  id uuid primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  seller_id uuid not null references public.users(id),
  price_cents integer not null check (price_cents > 0),
  qty integer not null check (qty > 0),
  qr_storage_path text not null,
  status text not null default 'open',
  created_at timestamptz default now() not null
);

-- Create bids table
create table public.bids (
  id uuid primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  buyer_id uuid not null references public.users(id),
  price_cents integer not null check (price_cents > 0),
  qty integer not null check (qty > 0),
  status text not null default 'open',
  created_at timestamptz default now() not null
);

-- Create matches table
create table public.matches (
  id uuid primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  ask_id uuid not null references public.asks(id),
  bid_id uuid not null references public.bids(id),
  clearing_price_cents integer not null check (clearing_price_cents > 0),
  qty integer not null check (qty > 0),
  created_at timestamptz default now() not null
);

-- Create tickets table
create table public.tickets (
  id uuid primary key,
  match_id uuid not null references public.matches(id) on delete cascade,
  winner_id uuid not null references public.users(id),
  qr_storage_path text not null,
  delivered_at timestamptz,
  created_at timestamptz default now() not null
);

-- Create indices
create index bids_event_id_idx on public.bids(event_id);
create index asks_event_id_idx on public.asks(event_id);
create index matches_event_id_idx on public.matches(event_id);

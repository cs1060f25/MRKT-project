# Supabase + Clerk Integration Build Instructions (DBCore & I_DB Stories)

These are **step-by-step, code-free instructions** for implementing and testing your backend stories.
They are sequenced, grouped into logical branches, and designed to be directly executed by a coding agent.

---

## 0) Global setup (once)

### Prereqs
- Node 18+ and pnpm or npm
- Docker Desktop (running)
- Supabase CLI: `npm i -g supabase`
- psql (PostgreSQL client)

### Initialize Supabase in the repo
```bash
supabase init
supabase link --project-ref <YOUR_SUPABASE_PROJECT_REF>
```

### Start and prepare testing environment
```bash
supabase start
supabase db install pgtap
```

### Verify local stack
- Postgres: `localhost:54322`
- REST (PostgREST): `http://127.0.0.1:54321/rest/v1`

### Repo structure
```
/supabase/migrations
/supabase/seed
/supabase/tests
```

### Branch structure
- `feature/dbcore-schema`
- `feature/dbcore-rls`
- `feature/idb-rpc-surface`
- `feature/idb-rpc-functions`

---

## 1) Group A: DBCore Core Tables and Migrations
**Branch:** `feature/dbcore-schema`

A.1 Create migration with schema-only DDL

Create a timestamped migration (Supabase CLI will name it)

supabase migration new dbcore_schema


In the newly created SQL file under /supabase/migrations, implement only schema DDL for these tables (no RLS yet):

public.users
- id uuid primary key
- email text unique not null
- full_name text
- created_at timestamptz default now() not null

public.events
- id uuid primary key
- title text not null
- starts_at timestamptz not null
- ends_at timestamptz not null
- org text not null (simple org name)
- created_by uuid not null references public.users(id)
- created_at timestamptz default now() not null

public.asks
- id uuid primary key
- event_id uuid not null references public.events(id) on delete cascade
- seller_id uuid not null references public.users(id)
- price_cents integer not null check (price_cents > 0)
- qty integer not null check (qty > 0)
- qr_storage_path text not null (Supabase Storage path)
- status text not null default 'open' -- allowed: open, matched, delivered
- created_at timestamptz default now() not null

public.bids
- id uuid primary key
- event_id uuid not null references public.events(id) on delete cascade
- buyer_id uuid not null references public.users(id)
- price_cents integer not null check (price_cents > 0)
- qty integer not null check (qty > 0)
- status text not null default 'open' -- allowed: open, matched
- created_at timestamptz default now() not null

public.matches
- id uuid primary key
- event_id uuid not null references public.events(id) on delete cascade
- ask_id uuid not null references public.asks(id)
- bid_id uuid not null references public.bids(id)
- clearing_price_cents integer not null check (clearing_price_cents > 0)
- qty integer not null check (qty > 0)
- created_at timestamptz default now() not null

public.tickets
- id uuid primary key
- match_id uuid not null references public.matches(id) on delete cascade
- winner_id uuid not null references public.users(id)
- qr_storage_path text not null
- delivered_at timestamptz -- null until delivered
- created_at timestamptz default now() not null

Indices (minimal, exact names):
- bids_event_id_idx on bids(event_id)
- asks_event_id_idx on asks(event_id)
- matches_event_id_idx on matches(event_id)

Apply locally and verify no errors

supabase db reset

---

## 2) Group B: DBCore RLS Policies
**Branch:** `feature/dbcore-rls`

### B.1 Enable RLS
```bash
supabase migration new dbcore_rls
```
Enable RLS and restrict access to authenticated users only.

### B.2 Policy rules
Define policies for `users`, `events`, `asks`, `bids`, `matches`, and `tickets` tables using `auth.uid()`.

### B.3 pgTAP RLS tests
Use `set_config('request.jwt.claims', '{"sub":"<UUID>","role":"authenticated"}', true);` to simulate users.

Test using:
- `lives_ok()` for allowed ops
- `throws_ok()` for denied ops (42501 code)

Run:
```bash
supabase db reset
psql "postgresql://postgres:postgres@localhost:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/02_rls_pgtap.sql
```

---

## 3) Group C: I_DB PostgREST & RPC Surface
**Branch:** `feature/idb-rpc-surface`

### C.1 Create RPC functions
```bash
supabase migration new idb_rpc_surface
```
Define SQL functions:
- `rpc_create_event(...)`
- `rpc_create_ask(...)`
- `rpc_create_bid(...)`
- `rpc_get_book(...)`
- `rpc_mark_ticket_delivered(...)`
- `rpc_health()`

Grant `execute` to authenticated users. No REST config needed.

### C.2 pgTAP tests
Create `/supabase/tests/03_rpc_surface_pgtap.sql`
- Test type returns, RLS compliance, `rpc_health()` returns `"ok"`

Run:
```bash
supabase db reset
psql "postgresql://postgres:postgres@localhost:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/03_rpc_surface_pgtap.sql
```

---

## 4) Group D: I_DB RPC Functions
**Branch:** `feature/idb-rpc-functions`

### D.1 Implement full RPC logic
```bash
supabase migration new idb_rpc_functions
```
Add input validation, transaction safety, and restricted updates per story spec.

### D.2 pgTAP tests
Add `/supabase/tests/04_rpc_functions_pgtap.sql`:
- Test valid/invalid inserts
- Test delivery rights enforcement

Run:
```bash
supabase db reset
psql "postgresql://postgres:postgres@localhost:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/04_rpc_functions_pgtap.sql
```

---

## 5) CI & Deployment

### Merge order
1. `feature/dbcore-schema`
2. `feature/dbcore-rls`
3. `feature/idb-rpc-surface`
4. `feature/idb-rpc-functions`

### CI script
Add script in `package.json`:
```json
"scripts": {
  "test:db": "supabase db reset && psql postgresql://postgres:postgres@localhost:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/01_schema_pgtap.sql && psql postgresql://postgres:postgres@localhost:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/02_rls_pgtap.sql && psql postgresql://postgres:postgres@localhost:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/03_rpc_surface_pgtap.sql && psql postgresql://postgres:postgres@localhost:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/04_rpc_functions_pgtap.sql"
}
```

### Deploy migrations to remote
```bash
supabase db push
```

---

## 6) Run Everything

### Local dev
```bash
supabase start
supabase db reset
npm run test:db
```

### Health check
```bash
curl -s http://127.0.0.1:54321/rest/v1/rpc/rpc_health -H "apikey: anon"
```

### Deploy to Supabase cloud
```bash
supabase db push
```

---

## Clerk integration (context)
Frontend will use Clerk; DB RLS relies on `auth.uid()`.  
Frontend will exchange Clerk JWT → Supabase session later.  
Tests simulate via `set_config('request.jwt.claims', ...)`.

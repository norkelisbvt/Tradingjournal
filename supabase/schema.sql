-- ════════════════════════════════════════════════════════════════════
-- Esquema de la nube para el Trading Journal + Panel Financiero
-- Ejecutar completo en: Supabase → SQL Editor → New query → Run
--
-- Diseño: cada tabla tiene user_id (referencia a auth.users) y RLS
-- (Row Level Security) activado, así que cada uno de los 5 usuarios
-- solo puede leer/escribir SUS propias filas, aunque compartan el
-- mismo proyecto de Supabase. No hace falta lógica extra en el
-- frontend para aislar los datos: la base de datos lo garantiza.
-- ════════════════════════════════════════════════════════════════════

-- Extensión para generar UUIDs (gen_random_uuid) — normalmente ya viene
-- habilitada en Supabase, pero por las dudas:
create extension if not exists pgcrypto;

-- ── Función helper: mantiene updated_at al día en cada UPDATE ──
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ════════════════════════════════════════════════════════════════════
-- MÓDULO TRADING
-- ════════════════════════════════════════════════════════════════════

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  broker text,
  moneda text not null default 'USD',
  saldo_inicial numeric not null default 0,
  orden integer not null default 0,
  archivado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  fecha date not null,
  instrumento text not null,
  direccion text, -- 'long' | 'short'
  entrada numeric,
  salida numeric,
  lotaje numeric,
  resultado numeric, -- ganancia/pérdida en la moneda de la cuenta
  setup text,
  razones jsonb not null default '[]',
  errores jsonb not null default '[]',
  notas text,
  -- Claves de objeto en R2 (NO la imagen en sí, solo la ruta dentro del
  -- bucket, ej. "u_123/trades/abc/antes.webp"). El binario vive en R2,
  -- acá solo la referencia — así la fila pesa unos pocos bytes.
  imagen_antes_key text,
  imagen_despues_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists trades_user_fecha_idx on trades (user_id, fecha desc);
create index if not exists trades_account_idx on trades (account_id);

-- ════════════════════════════════════════════════════════════════════
-- MÓDULO FINANZAS
-- ════════════════════════════════════════════════════════════════════

create table if not exists fin_categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('gasto', 'ingreso')),
  nombre text not null,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, tipo, nombre)
);

create table if not exists fin_gastos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  fecha date not null,
  valor numeric not null,
  categoria text not null,
  moneda text not null default 'USD',
  recurrente_id uuid, -- referencia lógica a fin_recurrentes (sin FK dura, ver nota abajo)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists fin_gastos_user_fecha_idx on fin_gastos (user_id, fecha desc);

create table if not exists fin_ingresos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  fecha date not null,
  valor numeric not null,
  categoria text not null,
  moneda text not null default 'USD',
  recurrente_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists fin_ingresos_user_fecha_idx on fin_ingresos (user_id, fecha desc);

create table if not exists fin_recurrentes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('gasto', 'ingreso')),
  nombre text not null,
  valor numeric not null,
  categoria text not null,
  moneda text not null default 'USD',
  dia_mes integer not null default 1 check (dia_mes between 1 and 31),
  activo boolean not null default true,
  ultimo_generado text, -- "YYYY-MM" del último mes ya generado
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists fin_presupuestos_categoria (
  user_id uuid not null references auth.users(id) on delete cascade,
  categoria text not null,
  moneda text not null default 'USD',
  monto numeric not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, categoria, moneda)
);

-- Una sola fila por usuario: límite mensual de gasto + meta de ahorro.
create table if not exists fin_config (
  user_id uuid primary key references auth.users(id) on delete cascade,
  limite_mensual numeric,
  meta_ahorro numeric not null default 100,
  moneda_default text not null default 'USD',
  updated_at timestamptz not null default now()
);

-- ── Triggers de updated_at en todas las tablas que lo usan ──
do $$
declare t text;
begin
  foreach t in array array['accounts','trades','fin_gastos','fin_ingresos','fin_recurrentes','fin_config'] loop
    execute format('drop trigger if exists trg_updated_at on %I;', t);
    execute format('create trigger trg_updated_at before update on %I for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY: cada usuario solo ve/edita sus propias filas
-- ════════════════════════════════════════════════════════════════════

alter table accounts enable row level security;
alter table trades enable row level security;
alter table fin_categorias enable row level security;
alter table fin_gastos enable row level security;
alter table fin_ingresos enable row level security;
alter table fin_recurrentes enable row level security;
alter table fin_presupuestos_categoria enable row level security;
alter table fin_config enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'accounts','trades','fin_categorias','fin_gastos','fin_ingresos',
    'fin_recurrentes','fin_presupuestos_categoria','fin_config'
  ] loop
    execute format('drop policy if exists "select_own" on %I;', t);
    execute format('create policy "select_own" on %I for select using (auth.uid() = user_id);', t);
    execute format('drop policy if exists "insert_own" on %I;', t);
    execute format('create policy "insert_own" on %I for insert with check (auth.uid() = user_id);', t);
    execute format('drop policy if exists "update_own" on %I;', t);
    execute format('create policy "update_own" on %I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
    execute format('drop policy if exists "delete_own" on %I;', t);
    execute format('create policy "delete_own" on %I for delete using (auth.uid() = user_id);', t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- Notas de diseño:
--
-- 1) recurrente_id en fin_gastos/fin_ingresos es una referencia "suave"
--    (sin foreign key) a fin_recurrentes.id a propósito: si se borra la
--    plantilla recurrente, los movimientos históricos que ya generó
--    deben seguir existiendo tal cual quedaron, no desaparecer con un
--    ON DELETE CASCADE.
--
-- 2) Todas las tablas están pensadas para "cada usuario ve lo suyo",
--    no datos compartidos entre los 5 usuarios. Si en algún momento
--    quisieran una cuenta de trading o un gasto compartido entre dos
--    personas, eso es un cambio de modelo (tabla de "miembros" +
--    políticas RLS distintas) — avisame si eso es lo que necesitás y
--    lo ajustamos antes de que haya datos reales cargados.
-- ════════════════════════════════════════════════════════════════════

-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

DROP EXTENSION pg_net;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

CREATE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

GRANT ALL ON FUNCTION public.set_updated_at() TO anon;

GRANT ALL ON FUNCTION public.set_updated_at() TO authenticated;

GRANT ALL ON FUNCTION public.set_updated_at() TO service_role;

CREATE TABLE public.accounts (
  id            uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id       uuid                     NOT NULL,
  nombre        text                     NOT NULL,
  broker        text,
  moneda        text                     DEFAULT 'USD'::text NOT NULL,
  saldo_inicial numeric                  DEFAULT 0 NOT NULL,
  orden         integer                  DEFAULT 0 NOT NULL,
  archivado     boolean                  DEFAULT false NOT NULL,
  created_at    timestamp with time zone DEFAULT now() NOT NULL,
  updated_at    timestamp with time zone DEFAULT now() NOT NULL,
  local_key     text,
  grupo         text,
  fase          text,
  riesgo_pct    numeric
);

ALTER TABLE public.accounts
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_user_localkey_key UNIQUE (user_id, local_key);

GRANT ALL ON public.accounts TO anon;

GRANT ALL ON public.accounts TO authenticated;

GRANT ALL ON public.accounts TO service_role;

CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY delete_own ON public.accounts
  FOR DELETE
  USING ((auth.uid() = user_id));

CREATE POLICY insert_own ON public.accounts
  FOR INSERT
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY select_own ON public.accounts
  FOR SELECT
  USING ((auth.uid() = user_id));

CREATE POLICY update_own ON public.accounts
  FOR UPDATE
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE TABLE public.fin_categorias (
  id         uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id    uuid                     NOT NULL,
  tipo       text                     NOT NULL,
  nombre     text                     NOT NULL,
  orden      integer                  DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.fin_categorias
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fin_categorias
  ADD CONSTRAINT fin_categorias_pkey PRIMARY KEY (id);

ALTER TABLE public.fin_categorias
  ADD CONSTRAINT fin_categorias_tipo_check CHECK (tipo = ANY (ARRAY['gasto'::text, 'ingreso'::text]));

ALTER TABLE public.fin_categorias
  ADD CONSTRAINT fin_categorias_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.fin_categorias
  ADD CONSTRAINT fin_categorias_user_id_tipo_nombre_key UNIQUE (user_id, tipo, nombre);

GRANT ALL ON public.fin_categorias TO anon;

GRANT ALL ON public.fin_categorias TO authenticated;

GRANT ALL ON public.fin_categorias TO service_role;

CREATE POLICY delete_own ON public.fin_categorias
  FOR DELETE
  USING ((auth.uid() = user_id));

CREATE POLICY insert_own ON public.fin_categorias
  FOR INSERT
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY select_own ON public.fin_categorias
  FOR SELECT
  USING ((auth.uid() = user_id));

CREATE POLICY update_own ON public.fin_categorias
  FOR UPDATE
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE TABLE public.fin_config (
  user_id        uuid                     NOT NULL,
  limite_mensual numeric,
  meta_ahorro    numeric                  DEFAULT 100 NOT NULL,
  moneda_default text                     DEFAULT 'USD'::text NOT NULL,
  updated_at     timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.fin_config
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fin_config
  ADD CONSTRAINT fin_config_pkey PRIMARY KEY (user_id);

ALTER TABLE public.fin_config
  ADD CONSTRAINT fin_config_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

GRANT ALL ON public.fin_config TO anon;

GRANT ALL ON public.fin_config TO authenticated;

GRANT ALL ON public.fin_config TO service_role;

CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.fin_config
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY delete_own ON public.fin_config
  FOR DELETE
  USING ((auth.uid() = user_id));

CREATE POLICY insert_own ON public.fin_config
  FOR INSERT
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY select_own ON public.fin_config
  FOR SELECT
  USING ((auth.uid() = user_id));

CREATE POLICY update_own ON public.fin_config
  FOR UPDATE
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE TABLE public.fin_gastos (
  id            uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id       uuid                     NOT NULL,
  nombre        text                     NOT NULL,
  fecha         date                     NOT NULL,
  valor         numeric                  NOT NULL,
  categoria     text                     NOT NULL,
  moneda        text                     DEFAULT 'USD'::text NOT NULL,
  recurrente_id uuid,
  created_at    timestamp with time zone DEFAULT now() NOT NULL,
  updated_at    timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.fin_gastos
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fin_gastos
  ADD CONSTRAINT fin_gastos_pkey PRIMARY KEY (id);

ALTER TABLE public.fin_gastos
  ADD CONSTRAINT fin_gastos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

GRANT ALL ON public.fin_gastos TO anon;

GRANT ALL ON public.fin_gastos TO authenticated;

GRANT ALL ON public.fin_gastos TO service_role;

CREATE INDEX fin_gastos_user_fecha_idx ON public.fin_gastos (user_id, fecha DESC);

CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.fin_gastos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY delete_own ON public.fin_gastos
  FOR DELETE
  USING ((auth.uid() = user_id));

CREATE POLICY insert_own ON public.fin_gastos
  FOR INSERT
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY select_own ON public.fin_gastos
  FOR SELECT
  USING ((auth.uid() = user_id));

CREATE POLICY update_own ON public.fin_gastos
  FOR UPDATE
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE TABLE public.fin_ingresos (
  id            uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id       uuid                     NOT NULL,
  nombre        text                     NOT NULL,
  fecha         date                     NOT NULL,
  valor         numeric                  NOT NULL,
  categoria     text                     NOT NULL,
  moneda        text                     DEFAULT 'USD'::text NOT NULL,
  recurrente_id uuid,
  created_at    timestamp with time zone DEFAULT now() NOT NULL,
  updated_at    timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.fin_ingresos
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fin_ingresos
  ADD CONSTRAINT fin_ingresos_pkey PRIMARY KEY (id);

ALTER TABLE public.fin_ingresos
  ADD CONSTRAINT fin_ingresos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

GRANT ALL ON public.fin_ingresos TO anon;

GRANT ALL ON public.fin_ingresos TO authenticated;

GRANT ALL ON public.fin_ingresos TO service_role;

CREATE INDEX fin_ingresos_user_fecha_idx ON public.fin_ingresos (user_id, fecha DESC);

CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.fin_ingresos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY delete_own ON public.fin_ingresos
  FOR DELETE
  USING ((auth.uid() = user_id));

CREATE POLICY insert_own ON public.fin_ingresos
  FOR INSERT
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY select_own ON public.fin_ingresos
  FOR SELECT
  USING ((auth.uid() = user_id));

CREATE POLICY update_own ON public.fin_ingresos
  FOR UPDATE
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE TABLE public.fin_presupuestos_categoria (
  user_id    uuid                     NOT NULL,
  categoria  text                     NOT NULL,
  moneda     text                     DEFAULT 'USD'::text NOT NULL,
  monto      numeric                  NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.fin_presupuestos_categoria
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fin_presupuestos_categoria
  ADD CONSTRAINT fin_presupuestos_categoria_pkey PRIMARY KEY (user_id, categoria, moneda);

ALTER TABLE public.fin_presupuestos_categoria
  ADD CONSTRAINT fin_presupuestos_categoria_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

GRANT ALL ON public.fin_presupuestos_categoria TO anon;

GRANT ALL ON public.fin_presupuestos_categoria TO authenticated;

GRANT ALL ON public.fin_presupuestos_categoria TO service_role;

CREATE POLICY delete_own ON public.fin_presupuestos_categoria
  FOR DELETE
  USING ((auth.uid() = user_id));

CREATE POLICY insert_own ON public.fin_presupuestos_categoria
  FOR INSERT
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY select_own ON public.fin_presupuestos_categoria
  FOR SELECT
  USING ((auth.uid() = user_id));

CREATE POLICY update_own ON public.fin_presupuestos_categoria
  FOR UPDATE
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE TABLE public.fin_recurrentes (
  id              uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id         uuid                     NOT NULL,
  tipo            text                     NOT NULL,
  nombre          text                     NOT NULL,
  valor           numeric                  NOT NULL,
  categoria       text                     NOT NULL,
  moneda          text                     DEFAULT 'USD'::text NOT NULL,
  dia_mes         integer                  DEFAULT 1 NOT NULL,
  activo          boolean                  DEFAULT true NOT NULL,
  ultimo_generado text,
  created_at      timestamp with time zone DEFAULT now() NOT NULL,
  updated_at      timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.fin_recurrentes
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fin_recurrentes
  ADD CONSTRAINT fin_recurrentes_dia_mes_check CHECK (dia_mes >= 1 AND dia_mes <= 31);

ALTER TABLE public.fin_recurrentes
  ADD CONSTRAINT fin_recurrentes_pkey PRIMARY KEY (id);

ALTER TABLE public.fin_recurrentes
  ADD CONSTRAINT fin_recurrentes_tipo_check CHECK (tipo = ANY (ARRAY['gasto'::text, 'ingreso'::text]));

ALTER TABLE public.fin_recurrentes
  ADD CONSTRAINT fin_recurrentes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

GRANT ALL ON public.fin_recurrentes TO anon;

GRANT ALL ON public.fin_recurrentes TO authenticated;

GRANT ALL ON public.fin_recurrentes TO service_role;

CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.fin_recurrentes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY delete_own ON public.fin_recurrentes
  FOR DELETE
  USING ((auth.uid() = user_id));

CREATE POLICY insert_own ON public.fin_recurrentes
  FOR INSERT
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY select_own ON public.fin_recurrentes
  FOR SELECT
  USING ((auth.uid() = user_id));

CREATE POLICY update_own ON public.fin_recurrentes
  FOR UPDATE
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE TABLE public.trades (
  id                 uuid                     NOT NULL,
  user_id            uuid                     NOT NULL,
  account_id         uuid,
  fecha              date                     NOT NULL,
  hora               text,
  fecha_salida       date,
  instrumento        text                     NOT NULL,
  direccion          text,
  sesion             text,
  entrada            numeric,
  salida             numeric,
  stop_loss          numeric,
  lotaje             numeric,
  risk_pct           numeric,
  rr                 numeric,
  pnl                numeric,
  setups             jsonb                    DEFAULT '[]'::jsonb NOT NULL,
  razones            jsonb                    DEFAULT '{}'::jsonb NOT NULL,
  errores            jsonb                    DEFAULT '[]'::jsonb NOT NULL,
  emociones          jsonb                    DEFAULT '[]'::jsonb NOT NULL,
  tags               jsonb                    DEFAULT '[]'::jsonb NOT NULL,
  notas              text,
  imagen_antes_key   text,
  imagen_despues_key text,
  created_at         timestamp with time zone DEFAULT now() NOT NULL,
  updated_at         timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.trades
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.trades
  ADD CONSTRAINT trades_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;

ALTER TABLE public.trades
  ADD CONSTRAINT trades_pkey PRIMARY KEY (id);

ALTER TABLE public.trades
  ADD CONSTRAINT trades_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

GRANT ALL ON public.trades TO anon;

GRANT ALL ON public.trades TO authenticated;

GRANT ALL ON public.trades TO service_role;

CREATE INDEX trades_account_idx ON public.trades (account_id);

CREATE INDEX trades_user_fecha_idx ON public.trades (user_id, fecha DESC);

CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY delete_own ON public.trades
  FOR DELETE
  USING ((auth.uid() = user_id));

CREATE POLICY insert_own ON public.trades
  FOR INSERT
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY select_own ON public.trades
  FOR SELECT
  USING ((auth.uid() = user_id));

CREATE POLICY update_own ON public.trades
  FOR UPDATE
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

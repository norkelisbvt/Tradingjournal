


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nombre" "text" NOT NULL,
    "broker" "text",
    "moneda" "text" DEFAULT 'USD'::"text" NOT NULL,
    "saldo_inicial" numeric DEFAULT 0 NOT NULL,
    "orden" integer DEFAULT 0 NOT NULL,
    "archivado" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "local_key" "text",
    "grupo" "text",
    "fase" "text",
    "riesgo_pct" numeric
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fin_categorias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tipo" "text" NOT NULL,
    "nombre" "text" NOT NULL,
    "orden" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "fin_categorias_tipo_check" CHECK (("tipo" = ANY (ARRAY['gasto'::"text", 'ingreso'::"text"])))
);


ALTER TABLE "public"."fin_categorias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fin_config" (
    "user_id" "uuid" NOT NULL,
    "limite_mensual" numeric,
    "meta_ahorro" numeric DEFAULT 100 NOT NULL,
    "moneda_default" "text" DEFAULT 'USD'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."fin_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fin_gastos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nombre" "text" NOT NULL,
    "fecha" "date" NOT NULL,
    "valor" numeric NOT NULL,
    "categoria" "text" NOT NULL,
    "moneda" "text" DEFAULT 'USD'::"text" NOT NULL,
    "recurrente_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."fin_gastos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fin_ingresos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nombre" "text" NOT NULL,
    "fecha" "date" NOT NULL,
    "valor" numeric NOT NULL,
    "categoria" "text" NOT NULL,
    "moneda" "text" DEFAULT 'USD'::"text" NOT NULL,
    "recurrente_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."fin_ingresos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fin_presupuestos_categoria" (
    "user_id" "uuid" NOT NULL,
    "categoria" "text" NOT NULL,
    "moneda" "text" DEFAULT 'USD'::"text" NOT NULL,
    "monto" numeric NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."fin_presupuestos_categoria" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fin_recurrentes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tipo" "text" NOT NULL,
    "nombre" "text" NOT NULL,
    "valor" numeric NOT NULL,
    "categoria" "text" NOT NULL,
    "moneda" "text" DEFAULT 'USD'::"text" NOT NULL,
    "dia_mes" integer DEFAULT 1 NOT NULL,
    "activo" boolean DEFAULT true NOT NULL,
    "ultimo_generado" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "fin_recurrentes_dia_mes_check" CHECK ((("dia_mes" >= 1) AND ("dia_mes" <= 31))),
    CONSTRAINT "fin_recurrentes_tipo_check" CHECK (("tipo" = ANY (ARRAY['gasto'::"text", 'ingreso'::"text"])))
);


ALTER TABLE "public"."fin_recurrentes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trades" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "account_id" "uuid",
    "fecha" "date" NOT NULL,
    "hora" "text",
    "fecha_salida" "date",
    "instrumento" "text" NOT NULL,
    "direccion" "text",
    "sesion" "text",
    "entrada" numeric,
    "salida" numeric,
    "stop_loss" numeric,
    "lotaje" numeric,
    "risk_pct" numeric,
    "rr" numeric,
    "pnl" numeric,
    "setups" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "razones" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "errores" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "emociones" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "tags" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "notas" "text",
    "imagen_antes_key" "text",
    "imagen_despues_key" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trades" OWNER TO "postgres";


ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_user_localkey_key" UNIQUE ("user_id", "local_key");



ALTER TABLE ONLY "public"."fin_categorias"
    ADD CONSTRAINT "fin_categorias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fin_categorias"
    ADD CONSTRAINT "fin_categorias_user_id_tipo_nombre_key" UNIQUE ("user_id", "tipo", "nombre");



ALTER TABLE ONLY "public"."fin_config"
    ADD CONSTRAINT "fin_config_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."fin_gastos"
    ADD CONSTRAINT "fin_gastos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fin_ingresos"
    ADD CONSTRAINT "fin_ingresos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fin_presupuestos_categoria"
    ADD CONSTRAINT "fin_presupuestos_categoria_pkey" PRIMARY KEY ("user_id", "categoria", "moneda");



ALTER TABLE ONLY "public"."fin_recurrentes"
    ADD CONSTRAINT "fin_recurrentes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trades"
    ADD CONSTRAINT "trades_pkey" PRIMARY KEY ("id");



CREATE INDEX "fin_gastos_user_fecha_idx" ON "public"."fin_gastos" USING "btree" ("user_id", "fecha" DESC);



CREATE INDEX "fin_ingresos_user_fecha_idx" ON "public"."fin_ingresos" USING "btree" ("user_id", "fecha" DESC);



CREATE INDEX "trades_account_idx" ON "public"."trades" USING "btree" ("account_id");



CREATE INDEX "trades_user_fecha_idx" ON "public"."trades" USING "btree" ("user_id", "fecha" DESC);



CREATE OR REPLACE TRIGGER "trg_updated_at" BEFORE UPDATE ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_updated_at" BEFORE UPDATE ON "public"."fin_config" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_updated_at" BEFORE UPDATE ON "public"."fin_gastos" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_updated_at" BEFORE UPDATE ON "public"."fin_ingresos" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_updated_at" BEFORE UPDATE ON "public"."fin_recurrentes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_updated_at" BEFORE UPDATE ON "public"."trades" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fin_categorias"
    ADD CONSTRAINT "fin_categorias_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fin_config"
    ADD CONSTRAINT "fin_config_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fin_gastos"
    ADD CONSTRAINT "fin_gastos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fin_ingresos"
    ADD CONSTRAINT "fin_ingresos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fin_presupuestos_categoria"
    ADD CONSTRAINT "fin_presupuestos_categoria_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fin_recurrentes"
    ADD CONSTRAINT "fin_recurrentes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trades"
    ADD CONSTRAINT "trades_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trades"
    ADD CONSTRAINT "trades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_own" ON "public"."accounts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own" ON "public"."fin_categorias" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own" ON "public"."fin_config" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own" ON "public"."fin_gastos" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own" ON "public"."fin_ingresos" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own" ON "public"."fin_presupuestos_categoria" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own" ON "public"."fin_recurrentes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own" ON "public"."trades" FOR DELETE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."fin_categorias" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fin_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fin_gastos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fin_ingresos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fin_presupuestos_categoria" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fin_recurrentes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_own" ON "public"."accounts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own" ON "public"."fin_categorias" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own" ON "public"."fin_config" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own" ON "public"."fin_gastos" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own" ON "public"."fin_ingresos" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own" ON "public"."fin_presupuestos_categoria" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own" ON "public"."fin_recurrentes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own" ON "public"."trades" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own" ON "public"."accounts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own" ON "public"."fin_categorias" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own" ON "public"."fin_config" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own" ON "public"."fin_gastos" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own" ON "public"."fin_ingresos" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own" ON "public"."fin_presupuestos_categoria" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own" ON "public"."fin_recurrentes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own" ON "public"."trades" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."trades" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_own" ON "public"."accounts" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own" ON "public"."fin_categorias" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own" ON "public"."fin_config" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own" ON "public"."fin_gastos" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own" ON "public"."fin_ingresos" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own" ON "public"."fin_presupuestos_categoria" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own" ON "public"."fin_recurrentes" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own" ON "public"."trades" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";



GRANT ALL ON TABLE "public"."fin_categorias" TO "anon";
GRANT ALL ON TABLE "public"."fin_categorias" TO "authenticated";
GRANT ALL ON TABLE "public"."fin_categorias" TO "service_role";



GRANT ALL ON TABLE "public"."fin_config" TO "anon";
GRANT ALL ON TABLE "public"."fin_config" TO "authenticated";
GRANT ALL ON TABLE "public"."fin_config" TO "service_role";



GRANT ALL ON TABLE "public"."fin_gastos" TO "anon";
GRANT ALL ON TABLE "public"."fin_gastos" TO "authenticated";
GRANT ALL ON TABLE "public"."fin_gastos" TO "service_role";



GRANT ALL ON TABLE "public"."fin_ingresos" TO "anon";
GRANT ALL ON TABLE "public"."fin_ingresos" TO "authenticated";
GRANT ALL ON TABLE "public"."fin_ingresos" TO "service_role";



GRANT ALL ON TABLE "public"."fin_presupuestos_categoria" TO "anon";
GRANT ALL ON TABLE "public"."fin_presupuestos_categoria" TO "authenticated";
GRANT ALL ON TABLE "public"."fin_presupuestos_categoria" TO "service_role";



GRANT ALL ON TABLE "public"."fin_recurrentes" TO "anon";
GRANT ALL ON TABLE "public"."fin_recurrentes" TO "authenticated";
GRANT ALL ON TABLE "public"."fin_recurrentes" TO "service_role";



GRANT ALL ON TABLE "public"."trades" TO "anon";
GRANT ALL ON TABLE "public"."trades" TO "authenticated";
GRANT ALL ON TABLE "public"."trades" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";








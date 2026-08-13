-- Carga rápida de trades: marca si un trade todavía tiene pendiente su
-- review completo (razones, errores, notas, etc.) o si ya se completó.
-- Default TRUE a propósito: los trades existentes (cargados antes de esta
-- feature, todos vía el form completo) se consideran "ya revisados" — no
-- tiene sentido que de golpe aparezcan cientos de trades viejos marcados
-- como pendientes. Solo la carga rápida nueva pone este valor en FALSE
-- explícitamente.
ALTER TABLE trades ADD COLUMN IF NOT EXISTS review_completado boolean DEFAULT true;

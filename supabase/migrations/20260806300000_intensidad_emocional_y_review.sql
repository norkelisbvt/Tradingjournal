-- Intensidad emocional por trade (1-5, opcional) y review post-trade
-- estructurado (separado del campo "notas" genérico).
--
-- emociones_intensidad: jsonb tipo { "fomo": 4, "confident": 2 } — un nivel
-- por cada emoción marcada en `emociones`. Puede no tener entrada para una
-- emoción marcada (trades cargados antes de este cambio); eso es válido,
-- no se rellena con un valor por defecto en la base.
ALTER TABLE trades ADD COLUMN IF NOT EXISTS emociones_intensidad jsonb DEFAULT '{}'::jsonb;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS revision_bien text;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS revision_mejorar text;

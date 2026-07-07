-- Sugestões de prescrição personalizada geradas por IA
-- Executar no Supabase SQL Editor

ALTER TABLE pacientes_local
  ADD COLUMN IF NOT EXISTS sexo TEXT CHECK (sexo IN ('M','F','outro'));

CREATE TABLE IF NOT EXISTS prescricoes_sugestoes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        REFERENCES auth.users(id),
  paciente_id      TEXT        NOT NULL,
  diagnostico_id   TEXT,
  diagnostico_nome TEXT,
  resultado        JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE prescricoes_sugestoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_sugestoes"
  ON prescricoes_sugestoes FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

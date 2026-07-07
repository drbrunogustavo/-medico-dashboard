-- Dashboard por Paciente
-- Executar no Supabase SQL Editor ANTES de usar a página /pacientes/[id]

-- Colunas clínicas adicionadas em pacientes_local
ALTER TABLE pacientes_local
  ADD COLUMN IF NOT EXISTS foto_url          TEXT,
  ADD COLUMN IF NOT EXISTS peso              NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS altura            NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS circunferencia_ab NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS medicamentos      JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pendencias        TEXT,
  ADD COLUMN IF NOT EXISTS protocolo_ativo   TEXT;

-- Tabela de exames por paciente
CREATE TABLE IF NOT EXISTS paciente_exames (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        REFERENCES auth.users(id),
  paciente_id  TEXT        NOT NULL,
  nome         TEXT        NOT NULL,
  valor        TEXT        NOT NULL,
  unidade      TEXT,
  referencia   TEXT,
  tendencia    TEXT        CHECK (tendencia IN ('up','down','stable')),
  data_coleta  DATE,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE paciente_exames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own exames"
  ON paciente_exames FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket para fotos de pacientes
-- Criar manualmente no painel Storage → New bucket → nome: pacientes-fotos → public: true
-- Ou via SQL:
INSERT INTO storage.buckets (id, name, public)
  VALUES ('pacientes-fotos', 'pacientes-fotos', true)
  ON CONFLICT DO NOTHING;

-- Policy de upload autenticado
CREATE POLICY "auth_upload_pacientes_fotos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pacientes-fotos');

CREATE POLICY "auth_update_pacientes_fotos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'pacientes-fotos' AND owner = auth.uid());

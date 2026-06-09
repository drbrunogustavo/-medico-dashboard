-- ============================================================
-- PRAXIS — Multi-usuário: RLS completo + tabela de perfis
-- Rodar no SQL Editor do Supabase
-- ============================================================

-- ─── 1. Adicionar user_id às tabelas que ainda não têm ────────────────────────

ALTER TABLE public.pautas
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.referencias
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ─── 2. pautas ────────────────────────────────────────────────────────────────

ALTER TABLE public.pautas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pautas_user" ON public.pautas;
CREATE POLICY "pautas_user" ON public.pautas
  FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

-- ─── 3. referencias ───────────────────────────────────────────────────────────

ALTER TABLE public.referencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referencias_user" ON public.referencias;
CREATE POLICY "referencias_user" ON public.referencias
  FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

-- ─── 4. financeiro_lancamentos ────────────────────────────────────────────────

ALTER TABLE public.financeiro_lancamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "financeiro_user" ON public.financeiro_lancamentos;
CREATE POLICY "financeiro_user" ON public.financeiro_lancamentos
  FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

-- ─── 5. leads_nutricao ────────────────────────────────────────────────────────

ALTER TABLE public.leads_nutricao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_user" ON public.leads_nutricao;
CREATE POLICY "leads_user" ON public.leads_nutricao
  FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

-- ─── 6. nutricao_pacientes_trilhas ────────────────────────────────────────────

ALTER TABLE public.nutricao_pacientes_trilhas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nutricao_user" ON public.nutricao_pacientes_trilhas;
CREATE POLICY "nutricao_user" ON public.nutricao_pacientes_trilhas
  FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

-- ─── 7. perfis ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.perfis (
  user_id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome                 TEXT,
  especialidade        TEXT,
  crm                  TEXT,
  cidade               TEXT,
  instagram            TEXT,
  publico_alvo         TEXT,
  diferencial          TEXT,
  avatar_url           TEXT,
  onboarding_completo  BOOLEAN     NOT NULL DEFAULT FALSE,
  criado_em            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfis_user" ON public.perfis;
CREATE POLICY "perfis_user" ON public.perfis
  FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

-- ─── 8. Trigger: cria perfil automaticamente ao registrar usuário ─────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (user_id, nome)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 9. Indices de performance ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS pautas_user_id_idx        ON public.pautas        (user_id);
CREATE INDEX IF NOT EXISTS referencias_user_id_idx   ON public.referencias   (user_id);

-- ============================================================
-- Após rodar: teste com
--   SELECT * FROM public.perfis;
--   SELECT * FROM public.pautas WHERE user_id = auth.uid();
-- ============================================================

-- ============================================================
-- PRAXIS — Integração Stripe: tabela de planos de usuário
-- Rodar no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_planos (
  user_id                UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plano                  TEXT        NOT NULL DEFAULT 'starter',
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  atualizado_em          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garante que a coluna plano só aceite valores válidos
ALTER TABLE public.user_planos
  DROP CONSTRAINT IF EXISTS user_planos_plano_check;

ALTER TABLE public.user_planos
  ADD CONSTRAINT user_planos_plano_check
  CHECK (plano IN ('starter', 'pro', 'elite'));

-- Row Level Security
ALTER TABLE public.user_planos ENABLE ROW LEVEL SECURITY;

-- Usuário lê apenas o próprio plano
DROP POLICY IF EXISTS "user_planos_select" ON public.user_planos;
CREATE POLICY "user_planos_select"
  ON public.user_planos
  FOR SELECT
  USING (auth.uid() = user_id);

-- Índice de performance (uuid já é PK, mas explicitando)
CREATE INDEX IF NOT EXISTS user_planos_user_id_idx
  ON public.user_planos (user_id);

-- ============================================================
-- NOTA: O webhook Stripe usa SUPABASE_SERVICE_ROLE_KEY,
-- que bypassa RLS automaticamente. Nenhuma policy adicional
-- de INSERT/UPDATE é necessária para o service role.
-- ============================================================

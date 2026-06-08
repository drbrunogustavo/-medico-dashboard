-- PRAXIS — Ala Clínica
-- Run in Supabase SQL Editor

-- ── financeiro_lancamentos ───────────────────────────────────────────────────
create table if not exists financeiro_lancamentos (
  id               uuid primary key default gen_random_uuid(),
  unidade          text         not null,
  tipo             text         not null, -- 'consulta' | 'procedimento' | 'despesa' | 'outro'
  descricao        text,
  valor            numeric(12,2) not null,
  forma_pagamento  text,        -- 'pix' | 'dinheiro' | 'credito' | 'debito' | 'plano'
  observacao       text,
  data             date         not null default current_date,
  criado_em        timestamptz  not null default now(),
  user_id          uuid         references auth.users(id)
);

alter table financeiro_lancamentos enable row level security;

create policy "Users can manage own lancamentos"
  on financeiro_lancamentos for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── leads_nutricao ───────────────────────────────────────────────────────────
create table if not exists leads_nutricao (
  id           uuid primary key default gen_random_uuid(),
  perfil       text         not null,
  interesse    text,
  duracao_dias integer      not null default 30,
  status       text         not null default 'aquecendo', -- 'aquecendo' | 'pronto' | 'convertido' | 'inativo'
  trilha       jsonb,
  criado_em    timestamptz  not null default now(),
  user_id      uuid         references auth.users(id)
);

alter table leads_nutricao enable row level security;

create policy "Users can manage own leads"
  on leads_nutricao for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── nutricao_pacientes_trilhas ───────────────────────────────────────────────
create table if not exists nutricao_pacientes_trilhas (
  id                uuid primary key default gen_random_uuid(),
  id_paciente_medx  text,
  nome_paciente     text         not null,
  tipo_trilha       text         not null, -- 'pre_consulta' | 'pos_consulta'
  mensagens         jsonb,
  status            text         not null default 'ativa', -- 'ativa' | 'concluida' | 'pausada'
  criado_em         timestamptz  not null default now(),
  user_id           uuid         references auth.users(id)
);

alter table nutricao_pacientes_trilhas enable row level security;

create policy "Users can manage own trilhas"
  on nutricao_pacientes_trilhas for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

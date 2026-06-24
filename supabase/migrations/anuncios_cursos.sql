-- Marketplace de Cursos: anúncios exibidos no banner da tela de login
create table if not exists anuncios_cursos (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  titulo              text not null,
  chamada             text not null,
  link_destino        text not null,
  anunciante_nome     text not null,
  anunciante_foto_url text,
  contato_email       text not null,
  contato_telefone    text,
  periodo_dias        int  not null default 15 check (periodo_dias in (7, 15, 30)),
  data_inicio         date,          -- definido pelo admin ao aprovar
  data_fim            date,          -- definido pelo admin ao aprovar
  status              text not null default 'pendente'
                      check (status in ('pendente', 'aprovado', 'expirado'))
);

alter table anuncios_cursos enable row level security;

-- INSERT: anon pode inserir somente com status='pendente' e datas nulas.
-- Dupla proteção: a API route já hardcoda isso em código, mas esta policy
-- bloqueia tentativas diretas via Supabase REST com a anon key.
create policy "public_insert" on anuncios_cursos
  for insert with check (
    status      = 'pendente'
    and data_inicio is null
    and data_fim    is null
  );

-- Nenhuma policy SELECT para anon.
-- Reads públicos: /api/anuncios-cursos/publico usa service_role (bypassa RLS)
--   e seleciona apenas os campos do banner.
-- Reads de admin: /api/admin/anuncios usa service_role + isAdmin() — idem.
-- O anon key não enxerga nenhuma linha desta tabela.

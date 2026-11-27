-- Comissão recorrente de afiliados: uma linha por fatura paga do indicado.
-- stripe_invoice_id único impede crédito duplicado quando o Stripe reenvia o webhook.
-- fatura_em serve ao teto de 12 meses, contado a partir da primeira fatura paga.
create table public.afiliados_comissoes (
  id                            uuid primary key default gen_random_uuid(),
  indicacao_id                  uuid not null references public.afiliados_indicacoes(id) on delete cascade,
  afiliado_id                   uuid not null references public.afiliados(id) on delete cascade,
  stripe_invoice_id             text not null unique,
  fatura_em                     timestamptz not null,
  valor_fatura                  numeric(12,2) not null,
  percentual                    numeric(5,2)  not null,
  valor_comissao                numeric(12,2) not null,
  status                        text not null default 'pendente' check (status in ('pendente','aplicada')),
  motivo                        text,
  stripe_balance_transaction_id text,
  created_at                    timestamptz not null default now(),
  aplicado_em                   timestamptz
);

create index idx_afiliados_comissoes_afiliado_id  on public.afiliados_comissoes (afiliado_id);
create index idx_afiliados_comissoes_indicacao_id on public.afiliados_comissoes (indicacao_id);

alter table public.afiliados_comissoes enable row level security;

-- Cada afiliado enxerga só as próprias comissões. Escrita só pelo servidor (service role).
create policy afiliados_veem_proprias_comissoes
  on public.afiliados_comissoes for select
  using (afiliado_id in (select id from public.afiliados where user_id = auth.uid()));

-- Reembolso de fatura (charge.refunded): a comissão da fatura é revertida na mesma proporção.
-- valor_comissao passa a ser o valor que continua valendo; valor_estornado guarda o que foi revertido.
-- Reembolso total muda o status para 'estornada' e a linha deixa de entrar nos totais (que somam só 'aplicada').
alter table public.afiliados_comissoes
  add column valor_estornado numeric(12,2) not null default 0,
  add column estornado_em timestamptz,
  add column stripe_estorno_balance_transaction_id text;

alter table public.afiliados_comissoes
  drop constraint afiliados_comissoes_status_check,
  add constraint afiliados_comissoes_status_check check (status in ('pendente','aplicada','estornada'));

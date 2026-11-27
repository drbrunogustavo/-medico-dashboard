-- Remove o acesso total de visitantes anônimos a pautas e referencias.
-- Cada usuário continua acessando só as próprias linhas (pautas_user / referencias_user).
drop policy if exists "acesso publico pautas" on public.pautas;
drop policy if exists "acesso publico referencias" on public.referencias;

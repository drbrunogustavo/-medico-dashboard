# DEPLOY.md — PRAXIS Platform

Guia completo de deploy para produção via Vercel.

---

## 1. CONECTAR AO VERCEL (primeiro deploy)

1. Acesse [vercel.com](https://vercel.com) → **Add New → Project**
2. Importe o repositório do GitHub (`medico-dashboard`)
3. Em **Configure Project**:
   - **Framework Preset:** Next.js (detectado automaticamente)
   - **Root Directory:** `.` (raiz)
   - **Build Command:** `npm run build` (padrão)
   - **Output Directory:** `.next` (padrão)
   - **Install Command:** `npm install` (padrão)
   - **Node.js Version:** 20.x (recomendado)
4. Adicione as variáveis de ambiente (ver Seção 2) **antes** de clicar em Deploy
5. Clique **Deploy**

> **Nota:** Não adicione `output: 'standalone'` no `next.config.js` para Vercel — o Vercel gerencia seu próprio output internamente e a opção standalone quebraria o deploy.

---

## 2. VARIÁVEIS DE AMBIENTE

Configure em **Settings → Environment Variables** no painel do Vercel.
Para cada variável: **Name** + **Value** + marcar **Production** e **Preview**.

### Obrigatórias — sem estas o app não funciona

| Variável | Onde obter | Exposta ao browser? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | Sim (pública) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public | Sim (pública) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys | Não (server-side) |

### Multi-usuário e autenticação

| Variável | Onde obter | Uso |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | Webhook Stripe (bypassa RLS) |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` nunca deve ter o prefixo `NEXT_PUBLIC_`.

### Geração de imagens — mínimo 1 dos 3

| Variável | Onde obter | Modelo |
|---|---|---|
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) → API Keys | gpt-image-1 **(recomendado)** |
| `GOOGLE_AI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → Get API Key | Gemini Imagen 3 |
| `HUGGINGFACE_TOKEN` | [huggingface.co](https://huggingface.co) → Settings → Tokens | FLUX.1-schnell |

### Stripe — planos pagos

| Variável | Onde obter |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → Signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys → Publishable key |
| `STRIPE_PRICE_STARTER` | Stripe Dashboard → Products → Starter → Price ID (`price_...`) |
| `STRIPE_PRICE_PRO` | Stripe Dashboard → Products → Pro → Price ID |
| `STRIPE_PRICE_ELITE` | Stripe Dashboard → Products → Elite → Price ID |

### Ala Clínica — Agenda, Copiloto, Pacientes

| Variável | Onde obter |
|---|---|
| `MEDX_API_URL` | MedX → Ajustes → Integração → URL da instância |
| `MEDX_API_KEY` | MedX → Ajustes → Integração → Token de Integração |

### Zapi WhatsApp (opcional)

| Variável | Onde obter |
|---|---|
| `ZAPI_INSTANCE_ID` | Z-API Dashboard → Instâncias → ID da instância |
| `ZAPI_TOKEN` | Z-API Dashboard → Instâncias → Token |

---

## 3. CONFIGURAR WEBHOOK DO STRIPE

### No Stripe Dashboard

1. Acesse **Stripe Dashboard → Developers → Webhooks → Add endpoint**
2. **Endpoint URL:** `https://seu-dominio.vercel.app/api/stripe/webhook`
3. **Events to send:** selecionar:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
4. Clique **Add endpoint**
5. Na tela do endpoint, clique em **Reveal signing secret**
6. Copie o `whsec_...` e cole como `STRIPE_WEBHOOK_SECRET` no Vercel

### Por que `/api/stripe/webhook` é rota pública

O middleware passa todas as rotas `/api/*` diretamente para o handler (sem verificar autenticação). O webhook do Stripe é recebido sem sessão de usuário — a verificação de segurança é feita via assinatura HMAC com `STRIPE_WEBHOOK_SECRET`.

### Teste local do webhook

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Encaminhar eventos para localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 4. MIGRATIONS DO SUPABASE

Execute no **SQL Editor** do Supabase (projeto → SQL Editor → New query):

```sql
-- 1. Multi-usuário: adiciona user_id + RLS + tabela perfis
-- Conteúdo de: supabase/migrations/multiusuario.sql

-- 2. Ala Clínica: financeiro, nutrição, agenda
-- Conteúdo de: supabase/migrations/clinica.sql
```

Execute os arquivos em ordem. Cada migration tem `IF NOT EXISTS` — é seguro reexecutar.

### Dados existentes sem user_id

Após ativar RLS, registros com `user_id = NULL` ficam invisíveis. Para migrar:

```sql
-- Substitua '<seu-uuid>' pelo UUID do usuário administrador
UPDATE public.pautas     SET user_id = '<seu-uuid>' WHERE user_id IS NULL;
UPDATE public.referencias SET user_id = '<seu-uuid>' WHERE user_id IS NULL;
```

---

## 5. CHECKLIST DE PRÉ-DEPLOY

### Obrigatório

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada no Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada no Vercel
- [ ] `ANTHROPIC_API_KEY` configurada no Vercel (sem `NEXT_PUBLIC_`)
- [ ] Pelo menos 1 chave de imagem (`OPENAI_API_KEY` recomendada)
- [ ] Migrations do Supabase executadas (em ordem)
- [ ] `npm run build` passou localmente sem erros
- [ ] `npx tsc --noEmit` retorna zero erros

### Stripe (se habilitado)

- [ ] `STRIPE_SECRET_KEY` configurada
- [ ] `STRIPE_WEBHOOK_SECRET` configurada (obtida após criar o endpoint)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` configurada
- [ ] `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ELITE` configuradas
- [ ] Endpoint de webhook criado no Stripe Dashboard com a URL de produção

### Ala Clínica (se habilitada)

- [ ] `MEDX_API_URL` e `MEDX_API_KEY` configuradas e válidas
- [ ] Token MedX testado via `GET /api/medx-test` no ambiente de staging

### Segurança

- [ ] `grep -r "NEXT_PUBLIC_ANTHROPIC" app/` retorna vazio
- [ ] `grep -r "NEXT_PUBLIC_OPENAI" app/` retorna vazio
- [ ] `grep -r "NEXT_PUBLIC_STRIPE_SECRET" app/` retorna vazio
- [ ] `.env.local` está no `.gitignore` (verificar com `git status`)

---

## 6. VERIFICAR DEPLOY (pós-produção)

Testar nesta ordem após o deploy:

1. **Login** → `/login` — Supabase Auth funcionando
2. **Onboarding** → `/onboarding` — fluxo de cadastro completo
3. **Dashboard** → `/` — carrega sem erros de console
4. **Banco de Pautas** → `/pautas` — CRUD funcionando (Supabase RLS)
5. **Gerador de Legendas** → `/legendas` — chamada Anthropic respondendo
6. **Diretor Criativo** → `/imagens` — geração de imagem funcionando
7. **Radar** → `/radar` — Claude com web_search retornando dados
8. **Planos** → `/planos` → clicar em "Assinar" — Stripe Checkout abrindo

---

## 7. VARIÁVEIS POR MÓDULO (referência rápida)

| Módulo | Variáveis necessárias |
|---|---|
| Todos os módulos IA (Social) | `ANTHROPIC_API_KEY` |
| Banco de Pautas, Referências, Perfil | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Diretor Criativo — GPT Image (padrão) | `OPENAI_API_KEY` |
| Diretor Criativo — Gemini Imagen | `GOOGLE_AI_API_KEY` |
| Diretor Criativo — FLUX | `HUGGINGFACE_TOKEN` |
| Planos / Stripe | `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + `STRIPE_PRICE_*` |
| Stripe webhook (Supabase update) | + `SUPABASE_SERVICE_ROLE_KEY` |
| Agenda, Copiloto, Pacientes | `MEDX_API_URL` + `MEDX_API_KEY` |
| Agente WhatsApp | `ZAPI_INSTANCE_ID` + `ZAPI_TOKEN` |

---

## 8. COMANDOS ÚTEIS

```bash
# Desenvolvimento local
npm run dev

# Build de produção
npm run build

# Verificar tipos
npx tsc --noEmit

# Auditoria PT-BR — system prompts em inglês
grep -rn "You are\|Always respond" app/api/ --include="*.ts"

# Auditoria de segurança — chaves server-side expostas ao client
grep -rn "NEXT_PUBLIC_ANTHROPIC\|NEXT_PUBLIC_OPENAI\|NEXT_PUBLIC_STRIPE_SECRET" app/

# Logs do Vercel em tempo real
vercel logs --follow
```

---

*PRAXIS v3.0 · Junho 2026 · Dr. Bruno Gustavo*

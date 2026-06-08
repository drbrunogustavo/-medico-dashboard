# CONTEXT.md — PRAXIS Platform
**Estado técnico completo · Atualizado: Junho 2026**

---

## 1. VISÃO GERAL

**PRAXIS** é uma plataforma SaaS de marketing médico e gestão clínica para Dr. Bruno Gustavo. Possui duas "alas":

| Ala | Descrição |
|-----|-----------|
| **Social** | 15 módulos de inteligência e criação de conteúdo para redes sociais |
| **Clínica** | Agenda (MedX), pacientes, copiloto de consulta, financeiro, nutrição |

---

## 2. STACK TÉCNICA

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js App Router | 14.2.5 |
| Linguagem | TypeScript | 5.x |
| Estilização | Tailwind CSS | 3.4.x |
| Fontes | Inter (UI) + Playfair Display (headings) | via next/font/google |
| Ícones | Lucide React | 0.383 |
| IA principal | Anthropic Claude Sonnet | claude-sonnet-4-20250514 |
| Geração de imagem | OpenAI gpt-image-1 · Google Imagen 3 · HuggingFace FLUX.1 | — |
| Auth | Supabase Auth (SSR) | @supabase/ssr 0.10 |
| Banco de dados | Supabase (PostgreSQL) | @supabase/supabase-js 2.x |
| Integração clínica | MedX API (Azure) | REST |
| Vídeo | @ffmpeg/ffmpeg (WASM) | 0.12 |
| Deploy | Vercel (CI/CD automático via GitHub) | — |

---

## 3. ESTRUTURA DE PASTAS

```
medico-dashboard/
│
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout — Sidebar, MobileNav, anti-flash theme script
│   ├── globals.css                   # CSS custom properties (temas dark/light), animações, Tailwind
│   ├── page.tsx                      # Dashboard — PRAXIS Command Center
│   ├── loading.tsx                   # Loading global
│   │
│   ├── login/page.tsx                # Login split-screen (Supabase Auth)
│   ├── landing/page.tsx              # Landing page pública (fixed overlay z-200)
│   ├── planos/page.tsx               # Planos Starter/Pro/Elite
│   ├── configuracoes/page.tsx        # Tema claro/escuro + info da conta
│   │
│   ├── ── ALA SOCIAL ──────────────────────────────────────────────
│   ├── radar/page.tsx                # Radar de Tendências (Claude web_search)
│   ├── oportunidades/page.tsx        # Detector de Oportunidades
│   ├── concorrentes/page.tsx         # Análise de Concorrentes
│   ├── referencias/page.tsx          # Monitor de Referências (Supabase)
│   ├── agente/page.tsx               # Agente Executivo (calendário + geração em lote)
│   ├── imagens/page.tsx              # Diretor Criativo IA (imagens + headlines)
│   ├── editor/page.tsx               # Editor de Vídeo (FFmpeg WASM)
│   ├── roteiros/page.tsx             # Gerador de Roteiros
│   ├── legendas/page.tsx             # Gerador de Legendas
│   ├── polemicas/page.tsx            # Gerador de Polêmicas
│   ├── ofertas/page.tsx              # Gerador de Ofertas (campanha + landing)
│   ├── raio-x/page.tsx               # Raio-X de Pacientes
│   ├── objecoes/page.tsx             # Mapa de Objeções
│   ├── ganchos/page.tsx              # Biblioteca de Ganchos
│   ├── pautas/page.tsx               # Banco de Pautas (Supabase CRUD)
│   ├── titulos/page.tsx              # Gerador de Títulos
│   ├── hashtags/page.tsx             # Gerador de Hashtags
│   ├── whatsapp/page.tsx             # Agente WhatsApp (placeholder)
│   │
│   ├── ── ALA CLÍNICA ──────────────────────────────────────────────
│   ├── agenda/page.tsx               # Agenda Inteligente (MedX)  [stub — UI pendente]
│   ├── pacientes/page.tsx            # Gestão de Pacientes (MedX) [stub — UI pendente]
│   ├── copiloto/page.tsx             # Copiloto de Consulta (Claude) [stub — UI pendente]
│   ├── financeiro/page.tsx           # Financeiro por Unidade (Supabase) [stub — UI pendente]
│   ├── nutricao-pacientes/page.tsx   # Nutrição de Pacientes [stub — UI pendente]
│   ├── nutricao-leads/page.tsx       # Nutrição de Leads [stub — UI pendente]
│   │
│   └── api/                          # API Routes (servidor Next.js)
│       ├── roteiros/route.ts         # Proxy Claude: POST → /v1/messages
│       ├── imagens/route.ts          # Proxy Claude: POST → /v1/messages (imagens)
│       ├── gerar-imagem/route.ts     # Geração imagem: OpenAI / Gemini / FLUX
│       ├── imagegen/route.ts         # Geração alternativa (legada)
│       ├── legendas/route.ts         # Geração de legendas (Claude)
│       ├── polemicas/route.ts        # Geração de polêmicas (Claude)
│       ├── analisar-roteiro/route.ts # Análise de roteiro (Claude)
│       ├── raio-x/route.ts           # Raio-X de pacientes (Claude)
│       ├── oportunidades/route.ts    # Detector de oportunidades (Claude)
│       ├── referencias/route.ts      # CRUD referências (Supabase)
│       ├── pautas/route.ts           # CRUD pautas (Supabase + auth)
│       ├── objecoes/
│       │   ├── mapear/route.ts       # Mapear objeções (Claude)
│       │   └── transformar/route.ts  # Transformar objeção (Claude)
│       ├── ofertas/
│       │   ├── route.ts              # Campanha completa (Claude, 2 partes)
│       │   └── landing/route.ts      # Landing page HTML completo (Claude)
│       ├── agente/
│       │   ├── planejar/route.ts     # Planejamento editorial (Claude)
│       │   └── gerar/route.ts        # Geração em lote de conteúdo (Claude)
│       ├── agenda/route.ts           # Proxy MedX: agenda, disponibilidade, usuários
│       ├── pacientes/route.ts        # Proxy MedX: pacientes, prontuário
│       ├── copiloto/route.ts         # Copiloto de consulta (Claude + MedX)
│       ├── financeiro/route.ts       # CRUD financeiro (Supabase)
│       ├── nutricao-pacientes/route.ts # Trilhas de mensagens (Claude + Supabase)
│       └── nutricao-leads/route.ts   # Trilhas de leads (Claude + Supabase)
│
├── components/
│   ├── Sidebar.tsx                   # Navegação: toggle Social/Clínica, tema, plano, perfil
│   ├── TopBar.tsx                    # Header sticky: título, subtítulo, ThemeToggle, actions
│   ├── PraxisLogo.tsx                # SVG inline: símbolo P + "PRAXIS" Playfair + tagline
│   ├── ThemeToggle.tsx               # Botão Sun/Moon com animação, usa useTheme()
│   ├── StatCard.tsx                  # Card de métrica: value + label + icon + accent color
│   ├── MobileNav.tsx                 # Top bar mobile com hamburger
│   ├── MobileMenuProvider.tsx        # Context: open/closeMenu para mobile drawer
│   ├── PautasModal.tsx               # Modal reutilizável para importar do Banco de Pautas
│   ├── EmptyState.tsx                # Estado vazio reutilizável
│   ├── LoadingPulse.tsx              # Skeleton/pulse de carregamento
│   └── Toast.tsx                     # Notificação toast
│
├── hooks/
│   ├── useAuth.ts                    # Supabase Auth: user, loading, signOut
│   └── useTheme.ts                   # Tema: theme, toggleTheme, setTheme, followSystem
│
├── lib/
│   ├── utils.ts                      # cn() — merge de classes Tailwind
│   ├── auth-check.ts                 # checkAuth() — guard para API Routes (server-side)
│   ├── medx.ts                       # Cliente MedX API com cache de token (170min)
│   ├── supabase.ts                   # createClient() direto (anon key) — uso legado
│   ├── supabase-browser.ts           # getSupabaseBrowserClient() — singleton browser
│   └── supabase-server.ts            # createSupabaseServerClient() — SSR com cookies
│
├── supabase/
│   └── migrations/
│       └── clinica.sql               # CREATE TABLE: financeiro_lancamentos, leads_nutricao,
│                                     #   nutricao_pacientes_trilhas (rodar no SQL Editor)
│
├── public/
│   ├── favicon.svg                   # Ícone geométrico PRAXIS em SVG
│   └── manifest.json                 # PWA manifest
│
├── middleware.ts                     # Auth guard global (Supabase SSR)
├── tailwind.config.js                # Paleta via CSS custom properties + animações
├── next.config.js                    # COOP/COEP headers para FFmpeg SharedArrayBuffer
├── postcss.config.js
├── tsconfig.json
├── CLAUDE.md                         # Documentação original (stack legada)
└── CONTEXT.md                        # Este arquivo
```

---

## 4. VARIÁVEIS DE AMBIENTE

### `.env.local` (desenvolvimento)

```env
# Anthropic — modelo principal de IA (server-side only)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Supabase (expostas ao browser — seguro, são chaves anônimas)
NEXT_PUBLIC_SUPABASE_URL=https://dnieitrfrjboswlfxzjw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# OpenAI — geração de imagem (gpt-image-1)
OPENAI_API_KEY=sk-...

# Google — Gemini Imagen 3
GOOGLE_AI_API_KEY=AIza...

# HuggingFace — FLUX.1-schnell
HUGGINGFACE_TOKEN=hf_...

# MedX — integração clínica
MEDX_URL=https://medx65-v65teste.azurewebsites.net
MEDX_INTEGRATION_TOKEN=...
```

### Vercel (produção)
Todas as variáveis acima devem ser configuradas em **Settings → Environment Variables**.

> **Nota:** `ANTHROPIC_API_KEY` não tem prefixo `NEXT_PUBLIC_` — fica apenas no servidor. O arquivo `.env.local` antigo tinha `NEXT_PUBLIC_ANTHROPIC_API_KEY` (inseguro); as API Routes novas usam a versão server-side.

---

## 5. AUTENTICAÇÃO

- **Provider:** Supabase Auth (email + senha)
- **Middleware:** `middleware.ts` intercepta todas as rotas (exceto `/_next`, assets)
  - Não autenticado → redirect para `/login`
  - Autenticado em `/login` → redirect para `/`
  - Rotas `/api/*`: cada route handler chama `checkAuth()` individualmente
- **`checkAuth()`** (`lib/auth-check.ts`): lê sessão via cookie SSR, retorna `{ authenticated: true, userId }` ou `{ authenticated: false, response: NextResponse 401 }`
- **`useAuth()`** (`hooks/useAuth.ts`): hook client-side com `user`, `loading`, `signOut()`
- **Login page** (`app/login/page.tsx`): `fixed inset-0 z-[200]` — sobrepõe todo o layout

---

## 6. DESIGN SYSTEM — PRAXIS

### Tema (CSS Custom Properties em `globals.css`)

| Token | Dark (`data-theme="dark"`) | Light (`data-theme="light"`) |
|-------|---------------------------|------------------------------|
| `--background` | `#080808` | `#f5f5f0` |
| `--surface` | `#0f0f0f` | `#ffffff` |
| `--surface-2` / `--card` | `#161616` | `#ffffff` |
| `--border` | `#1f1f1f` | `#e0e0d8` |
| `--border-hover` | `#2a2a2a` | `#c8c8c0` |
| `--text-primary` | `#f5f5f7` | `#1a1a1a` |
| `--text-secondary` | `#a1a1a6` | `#4a4a4a` |
| `--text-muted` | `#48484f` | `#8a8a8a` |
| `--accent-rgb` | `0 192 127` | `0 168 107` |
| `--accent` | `#00c07f` | `#00a86b` |
| `--gold` | `#d4af37` | (igual) |
| `--topbar-bg` | `rgba(8,8,8,0.85)` | `rgba(245,245,240,0.90)` |

**Anti-flash:** script inline síncrono no `<head>` seta `data-theme` antes do primeiro paint. `suppressHydrationWarning` em `<html>` evita aviso de mismatch do React.

### Tailwind Config
- Cores core usam `var(--token)` diretamente
- Accent usa `rgb(var(--accent-rgb) / <alpha-value>)` para suportar `bg-accent/10` etc.

### Fontes
- **Inter** (`var(--font-inter)`) — UI geral, labels, body
- **Playfair Display** (`var(--font-playfair)`) — headlines, nome PRAXIS, títulos de seção
- **JetBrains Mono** — badges, metadados, timestamps

### Persistência do tema
- `localStorage("praxis-theme")` — `"dark"` | `"light"`
- `localStorage("praxis-follow-system")` — `"true"` | `"false"`
- `localStorage("praxis_ala")` — `"social"` | `"clinica"` (ala ativa da Sidebar)

---

## 7. MÓDULOS — ALA SOCIAL (15 módulos)

### 7.1 Dashboard (`/`)
- Saudação dinâmica em Playfair Display com horário atual
- Counter animation (requestAnimationFrame) para métricas
- 4 metric cards, 8 atalhos rápidos para módulos principais
- Pautas recentes via Supabase + Insight do Dia por dia da semana

### 7.2 Radar de Tendências (`/radar`)
- Claude com `web_search` para tendências médicas em tempo real
- Filtros: Fonte, Categoria, Período
- Cards com badge de urgência (Alto/Médio/Baixo) — Alto tem pulse animation
- Botão "Transformar em Pauta" → salva no Banco de Pautas

### 7.3 Agente Executivo (`/agente`)
- **Passo 1:** Briefing (especialidade, público, volume de dias, pilares)
- **Passo 2:** Claude gera plano editorial completo com calendário — API: `/api/agente/planejar`
- **Passo 3:** Geração em lote dia a dia (cada dia: Reel, Imagem, Legenda, Story) — API: `/api/agente/gerar`
- Toggle Lista/Calendário: grade 7 colunas, células coloridas por formato
- Modal de dia com 4 tabs de conteúdo
- Exportar PDF (lista ou calendário visual)

### 7.4 Diretor Criativo IA (`/imagens`)
- **Seção Imagens:**
  - 4 formatos: Story, Reels Cover, Retrato, Quadrado
  - 10 estilos editoriais (card premium, luxo editorial, capa reels…)
  - 3 modelos: GPT Image 1, Gemini Imagen 3, Flux Schnell
  - Fluxo: Briefing → Claude gera direção criativa (7 componentes) → Gerar Imagem OU Gerar 3 Variações
  - 3 Variações: `Promise.all` paralelo → grid de 3 cards → selecionar + confirmar
  - Auditoria visual automática (Claude avalia o prompt)
  - Histórico da sessão (últimas 5 imagens)
  - Importar tema do Banco de Pautas via `PautasModal`
- **Seção Headlines:**
  - Gera 100 headlines virais por gatilho emocional com score 0–100
  - 6 gatilhos: Medo, Curiosidade, Autoridade, Escassez, Dor, Benefício
  - Filtros por gatilho + "Usar na Arte →"

### 7.5 Gerador de Roteiros (`/roteiros`)
- Roteiros completos para Reels com estrutura, cenas e CTA
- Análise pós-roteiro com `/api/analisar-roteiro`

### 7.6 Gerador de Legendas (`/legendas`)
- Input: contexto, formato, tom, emojis → Claude gera legenda otimizada

### 7.7 Gerador de Polêmicas (`/polemicas`)
- Temas controversos éticos para debate médico → Claude estrutura perspectivas

### 7.8 Gerador de Ofertas (`/ofertas`)
- **Parte 1:** 3 roteiros de Reels + estrutura de landing page
- **Parte 2:** Anúncios (Feed/Stories/Reels em 3 variações), sequência 7 dias de stories, mensagens WhatsApp
- **Landing page:** Claude gera HTML completo autocontido → preview em `<iframe>` → exportar `.html`

### 7.9 Raio-X de Pacientes (`/raio-x`)
- Análise psicológica do perfil de paciente ideal
- Gatilhos emocionais, objeções frequentes, linguagem efetiva

### 7.10 Mapa de Objeções (`/objecoes`)
- Input: objeção → Claude: análise + resposta empática + conteúdo derivado
- APIs: `/api/objecoes/mapear` + `/api/objecoes/transformar`

### 7.11 Detector de Oportunidades (`/oportunidades`)
- Input: especialidade, localização, janela de tempo
- Claude identifica momentos de faturamento e oportunidades de conteúdo

### 7.12 Monitor de Referências (`/referencias`)
- CRUD de médicos influentes (Supabase: tabela `referencias`)
- Campos: nome, Instagram, especialidade, seguidores, frequência, temas, relevância
- Análise de perfil via Claude

### 7.13 Banco de Pautas (`/pautas`)
- CRUD completo (Supabase: tabela `pautas`)
- Filtros: categoria, prioridade, estágio
- Estágios: Ideia → Em produção → Revisão → Pronto → Publicado
- Importado por outros módulos via `PautasModal` component

### 7.14 Biblioteca de Ganchos (`/ganchos`)
- Banco curado de aberturas virais por categoria

### 7.15 Editor de Vídeo (`/editor`)
- Timeline visual + preview canvas + FFmpeg WASM
- Requer headers COOP/COEP (`next.config.js`) para SharedArrayBuffer

---

## 8. MÓDULOS — ALA CLÍNICA

> **Status atual:** API Routes 100% implementadas. Páginas com UI completa: pendentes.

### 8.1 Agenda Inteligente (`/agenda`)
- `GET /api/agenda?action=agenda|agenda-usuario|disponibilidade|usuarios|status`
- `POST /api/agenda` (inserir agendamento)
- `PUT /api/agenda` (atualizar agendamento)

### 8.2 Gestão de Pacientes (`/pacientes`)
- `GET /api/pacientes?action=list|get|search`
- `POST /api/pacientes?action=contato|prontuario`

### 8.3 Copiloto de Consulta (`/copiloto`)
- `POST /api/copiloto?action=gerar` → Claude gera 6 seções (Resumo, Plano, Orientações, Mensagens, Conteúdo, Prontuário)
- `POST /api/copiloto?action=prontuario` → envia para MedX via `inserirProntuario`

### 8.4 Financeiro por Unidade (`/financeiro`)
- `GET /api/financeiro?unidade=&inicio=&fim=`
- `POST /api/financeiro` (novo lançamento)
- `DELETE /api/financeiro?id=`
- Unidades: Poços de Caldas, Alfenas, São Paulo · Balneário Camboriú, Itapema

### 8.5 Nutrição de Pacientes (`/nutricao-pacientes`)
- `POST /api/nutricao-pacientes?action=gerar|salvar`
- `GET /api/nutricao-pacientes` (listar trilhas)
- Trilhas: Pré-consulta (D-1, D-0) · Pós-consulta (H+2, D+1, D+15, D-15)

### 8.6 Nutrição de Leads (`/nutricao-leads`)
- `POST /api/nutricao-leads?action=gerar|salvar|status`
- `GET /api/nutricao-leads` (listar leads)
- Cronograma: D1, D3, D5, D7, D10, D14, D21, D30 (durações: 7, 15 ou 30 dias)

---

## 9. INTEGRAÇÃO MEDX

### Setup

```env
MEDX_URL=https://medx65-v65teste.azurewebsites.net
MEDX_INTEGRATION_TOKEN=<token-do-painel>
```

**Como obter o token:** MedX → Ajustes → Integração para websites → copiar Token de Integração.

### Cache de token (`lib/medx.ts`)
- Token armazenado em variáveis module-level: `cachedToken`, `tokenExpiresAt`
- TTL: 170 minutos
- Limitação: cache local por instância serverless (sem compartilhamento entre instâncias)

### Endpoints MedX implementados

| Função exportada | Endpoint |
|-----------------|---------|
| `getAgenda(inicio, fim)` | `GetAgenda` |
| `getAgendaByUsuario(inicio, fim, idUsuario)` | `GetAgendabyUsuario` |
| `getDisponibilidade(dti, dtf, proId, intervalo)` | `GetDisponibilidade` |
| `getPacientes()` | `GetPacientes` |
| `getPacienteById(id)` | `GetContatosById` |
| `buscarPaciente(nome)` | `GetContatosGridBySearch` |
| `inserirAgendamento(dados)` | `InsertAgenda` |
| `atualizarAgendamento(dados)` | `UpdateAgendamento` |
| `inserirContato(dados)` | `InsertContato` |
| `inserirProntuario(historico, idCliente)` | `InsertProntuario` |
| `getUsuariosAgenda()` | `GetUsuariosAgenda` |
| `getStatusAgenda()` | `GetStatusNomeAgenda` |

---

## 10. SUPABASE

### Projeto
- **URL:** `https://dnieitrfrjboswlfxzjw.supabase.co`

### Tabelas

| Tabela | Módulo | Campos principais |
|--------|--------|-------------------|
| `pautas` | Banco de Pautas | `id, titulo, categoria, prioridade, estagio, nota, criada_em` |
| `referencias` | Monitor Referências | `id, nome, instagram, especialidade, seguidores, frequencia, temas, relevancia` |
| `financeiro_lancamentos` | Financeiro | `id, unidade, tipo, valor, forma_pagamento, descricao, data, user_id` |
| `leads_nutricao` | Nutrição Leads | `id, perfil, interesse, duracao_dias, status, trilha (jsonb), user_id` |
| `nutricao_pacientes_trilhas` | Nutrição Pacientes | `id, id_paciente_medx, nome_paciente, tipo_trilha, mensagens (jsonb), status, user_id` |

### RLS (Row Level Security)
- Todas as tabelas têm RLS ativo
- `financeiro_lancamentos`, `leads_nutricao`, `nutricao_pacientes_trilhas`: policy filtra por `user_id = auth.uid()`
- `pautas`, `referencias`: auth exigida via `checkAuth()` na API Route

### Aplicar migrations
```sql
-- Rodar no SQL Editor do Supabase:
-- conteúdo de supabase/migrations/clinica.sql
```

---

## 11. SIDEBAR — ALAS E NAVEGAÇÃO

```
┌─────────────────────┐
│     PraxisLogo      │
├─────────────────────┤
│  [Social] [Clínica] │  ← toggle, persiste em localStorage("praxis_ala")
├─────────────────────┤
│  nav items...       │
├─────────────────────┤
│  [ELITE] → /planos  │
│  Avatar | Dr. Bruno │
│  ⚙ ☀ ←────── 🚪    │  ← Settings | ThemeToggle | LogOut
└─────────────────────┘
```

- Ala Social → cor ativa: `accent` (verde)
- Ala Clínica → cor ativa: `blue-400`

---

## 12. ROTEAMENTO: PÚBLICAS vs. PROTEGIDAS

| Rota | Acesso |
|------|--------|
| `/login` | Pública (redirect se autenticado) |
| `/landing` | Pública (overlay `z-[200]` sobre o layout) |
| `/planos` | Pública |
| Todas as demais | Protegidas pelo middleware |
| `/api/*` | Verificação de auth por route handler |

---

## 13. PADRÕES DE API ROUTE

### Proxy Claude (padrão)
```ts
const auth = await checkAuth()
if (!auth.authenticated) return auth.response

const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": process.env.ANTHROPIC_API_KEY!,
    "anthropic-version": "2023-06-01",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
})
```

### SDK Anthropic (com system prompt estruturado)
```ts
import Anthropic from "@anthropic-ai/sdk"
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const resp = await client.messages.create({ model: "claude-sonnet-4-20250514", ... })
```

### Supabase Server (operações de banco)
```ts
import { createSupabaseServerClient } from "@/lib/supabase-server"
const supabase = createSupabaseServerClient()
const { data } = await supabase.from("tabela").select("*")
```

---

## 14. MODELOS DE IA UTILIZADOS

| Módulo | Modelo |
|--------|--------|
| Todos os módulos Social | `claude-sonnet-4-20250514` |
| Diretor Criativo (geração de imagem — padrão) | `gpt-image-1` via `OPENAI_API_KEY` |
| Diretor Criativo (alternativa Gemini) | `imagen-3.0-generate-002` via `GOOGLE_AI_API_KEY` |
| Diretor Criativo (alternativa FLUX) | `black-forest-labs/FLUX.1-schnell` via `HUGGINGFACE_TOKEN` |
| Copiloto de Consulta | `claude-sonnet-4-20250514` |
| Nutrição de Pacientes/Leads | `claude-sonnet-4-20250514` |
| Ofertas — landing page | `claude-sonnet-4-20250514` (`max_tokens: 8000`) |

---

## 15. PLANOS

| Plano | Preço | Módulos | Gerações/mês |
|-------|-------|---------|-------------|
| **Starter** | R$ 97 | Roteiros, Legendas, Ganchos, Banco de Pautas | 30 |
| **Pro** | R$ 197 | Todos exceto Agente Executivo | 200 |
| **Elite** | R$ 397 | Todos os 15 módulos + Ala Clínica | Ilimitadas |

CTAs atualmente exibem toast "Em breve — entre em contato pelo WhatsApp". Integração Stripe pendente.

---

## 16. TEMA CLARO/ESCURO

- **Hook:** `hooks/useTheme.ts` — `theme`, `setTheme()`, `toggleTheme()`, `followSystem`, `enableFollowSystem()`, `mounted`
- **Persistência:** `localStorage("praxis-theme")` e `localStorage("praxis-follow-system")`
- **Anti-flash:** script inline síncrono no `<head>` de `layout.tsx` seta `data-theme` antes do React
- **ThemeToggle:** `components/ThemeToggle.tsx` — renderiza placeholder até `mounted = true` (evita hydration mismatch)
- **Configurações:** `/configuracoes` — cards visuais de preview + toggle "Seguir sistema"
- **Transição global CSS:**
  ```css
  *, *::before, *::after {
    transition: background-color 300ms ease, border-color 300ms ease, color 200ms ease;
  }
  ```

---

## 17. PRÓXIMOS PASSOS

- [ ] **UI completa das páginas Ala Clínica** (agenda, pacientes, copiloto, financeiro, nutrição-pacientes, nutrição-leads)
- [ ] Integrar Stripe para assinaturas automáticas
- [ ] Mover `ANTHROPIC_API_KEY` para server-only em todos os módulos (remover `NEXT_PUBLIC_ANTHROPIC_API_KEY` se ainda existir)
- [ ] Zapi — envio real de WhatsApp para Nutrição de Pacientes/Leads
- [ ] Analytics de engajamento (Meta Graph API)
- [ ] Autenticação multi-usuário com perfis isolados (RLS por `user_id`)
- [ ] Análise de Concorrentes — módulo em desenvolvimento

---

## 18. COMANDOS ÚTEIS

```bash
npm run dev              # Desenvolvimento local (http://localhost:3000)
npm run build            # Build para produção
npm start                # Preview do build
npx tsc --noEmit         # Verificar erros de tipo
```

---

*PRAXIS v3.0 · Junho 2026 · Dr. Bruno Gustavo*

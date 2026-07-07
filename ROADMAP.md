# ROADMAP — Praxis Plataforma

---

## Sessão 07/07/2026 — ✅ CONCLUÍDO

### Deploy status
| Commit | Descrição | Status |
|--------|-----------|--------|
| `8c4cdd6` | COMMIT 2 — Auditoria Instagram no cron diário | ✅ READY |
| `a3b3692` | COMMIT 3 — Sugestões inteligentes no Dashboard | ✅ READY |
| `f1e8a8c` | COMMIT 4 — Leitura de PDF de exames | ✅ READY |
| `db99002` | COMMIT 5 — Protocolos stepper visual | ✅ READY |
| `b6dffd4` | COMMIT 6 — Gráfico de evolução de peso (recharts) | ✅ READY |
| `73709af` | COMMIT 7 — Ideias do consultório em /pautas | ✅ READY |
| `b8695ea` | COMMIT 8 — IA em Agenda e Executivo | ✅ READY |
| `95768e0` | COMMITs 9-15 — Insights, Hub IA, Copilot Cmd+K, Academy gamificação | ✅ PUSHED |
| `5c15167` | COMMIT 16 — Memória clínica proativa no Copiloto | ✅ PUSHED |
| `ffecf03` | COMMIT 17 — IA conversacional completa (/conversa) | ✅ PUSHED |
| `41f1467` | COMMIT 18 — Comunidade entre médicos (/comunidade) | ✅ PUSHED |
| `2ce2a1c` | COMMIT 19 — Fix banner Marketplace no login | ✅ PUSHED |

---

### COMMIT 2 — Auditoria automática de Instagram no cron diário
- [x] `runAuditoriaInstagram()` — executa apenas às quintas-feiras (`getDay() === 4`)
- [x] Verifica gap de dias desde último post publicado (pauta com estagio="Publicado")
- [x] Alerta se gap > 4 dias sem postar
- [x] Lista pautas paradas há > 7 dias (excluindo "Publicado" e "Pronto")
- [x] `buildAuditoriaEmail()` — HTML com amber/yellow alerts via Resend
- [x] Adicionado ao `Promise.allSettled` em `/api/automacoes/diario`

### COMMIT 3 — Sugestões inteligentes no Dashboard
- [x] `POST /api/dashboard/sugestoes` — Claude gera 1-2 sugestões com base em especialidade, pautas, métricas
- [x] `SugestoesIA` component — skeleton loading → cards com categoria colorida (social/clínica/ia)
- [x] Href validado contra allowlist de 20 rotas; disparo lazy após `execLoading + perfilLoading = false`
- [x] Exibido entre KPIs e banner de depoimento no dashboard

### COMMIT 4 — Upload e leitura de PDF de exames com IA
- [x] `POST /api/exames/upload` (maxDuration=60) — pdf-parse v2 (`PDFParse({ data })`) + Claude
- [x] Extrai exames com `{nome, valor, unidade, referencia, tendencia}`, máx. 30 itens
- [x] Botão "Importar PDF" + file picker oculto em `/pacientes/[id]`
- [x] Cada exame extraído inserido em `paciente_exames` + reload automático da tabela
- [x] Fix: pdf-parse v2 usa named export `PDFParse`, não default; parâmetro é `data` (não `buffer`)

### COMMIT 5 — Protocolos como stepper visual
- [x] `ProtocoloStepper` component em `ProtocolosTab.tsx`
- [x] 4 etapas: Diagnóstico (Stethoscope) → Exames (FlaskConical) → Tratamento (Pill) → Seguimento (Activity)
- [x] Ícone colorido com `protocolo.cor`, linha conectora, badge contador, lista de itens, ArrowDown entre etapas
- [x] Substitui 4x `SecaoItem` colapsáveis no modal — dados estáticos, só renderização muda

### COMMIT 6 — Gráfico de evolução de peso
- [x] `EvolucaoChart` component em `/pacientes/[id]` — recharts LineChart verde `#00c07f`
- [x] Filtra exames com `nome="peso"`, adiciona peso atual do perfil como ponto "hoje" se sem entrada nos últimos 7 dias
- [x] Mensagem "Adicione mais consultas..." se < 2 pontos; tooltip customizado com estilo do design system
- [x] Seção 5 "Evolução de Peso" antes do histórico de consultas

### COMMIT 7 — Banco de ideias baseado no perfil dos pacientes
- [x] `POST /api/pautas/ideias-consultorio` — busca últimos 10 resumos de `copiloto_historico`, Claude gera 5 ideias
- [x] Cada ideia: `{titulo, formato:"reel"|"carrossel"|"post", categoria, justificativa}`
- [x] Botão "Ideias do consultório" no TopBar de /pautas com ícone Sparkles
- [x] Painel com 5 cards (ícone por formato, badge categoria) + botão "Adicionar ao banco" por ideia
- [x] `adicionarIdeia()` — POST /api/pautas com nota `[FORMATO] justificativa`

### COMMIT 8 — IA em Agenda e Executivo
- [x] `POST /api/agenda/resumo-dia` — busca agendamentos do dia via `getAgenda(hoje, hoje)`, Claude gera briefing ≤120 palavras
- [x] `POST /api/executivo/analise-mes` — lê faturamento mês atual vs anterior, leads, NPS, consultas; Claude gera análise executiva ≤160 palavras
- [x] Botão "Briefing do dia" (Sparkles) no TopBar de /agenda — painel dismissível com resultado
- [x] Botão "Analisar mês" (Sparkles) no header de /executivo — painel dismissível com resultado

---

### COMMIT 9 — Insights automáticos no Executivo
- [x] `POST /api/executivo/insights` (maxDuration=20) — Claude gera 3 cards `{tipo:"ok"|"warn"|"info", titulo, descricao}`
- [x] Auto-load via `useEffect` ao abrir /executivo (guard `insightsDone` evita double-fire)
- [x] Grid de 3 cards coloridos entre KPIs e aba pills

### COMMIT 10 — Hub /praxis-ia
- [x] Reescrita completa: 4 categorias (Clínico, Social, Executivo, Pacientes) com 24 ferramentas linkadas
- [x] Badges "NOVO" e "MAIS USADO"; hover scale e borda por categoria

### COMMIT 11 — Praxis Copilot (Cmd+K)
- [x] `POST /api/copilot` — Claude interpreta intenção, valida rota contra allowlist de 25 rotas
- [x] `PraxisCopilot` component: FAB fixo, modal com sugestões por rota, keyboard Cmd+K + Escape
- [x] Onboarding tooltip (localStorage `copilot_hint_shown`), hint na sidebar, custom event `"open-copilot"`

### COMMIT 14 — Academy gamificação
- [x] 4 níveis: Bronze/Prata/Ouro/Diamond com barra de progresso colorida e ícone Trophy
- [x] `NivelBadge` component no header da Academy
- [x] Celebration toast 1800ms "Aula concluída!" ao marcar aula como feita

### COMMIT 15 — Casos Reais na Academy
- [x] Nova aba "Casos Reais" com badge "NOVO"
- [x] 5 casos clínicos expandíveis com `{dificuldade, especialidade, descricao, resolucao, aprendizado}`
- [x] Badges de dificuldade (Fácil/Médio/Difícil) com cores distintas

### COMMIT 16 — Memória clínica proativa no Copiloto
- [x] `POST /api/copiloto/memoria-padrao` — analisa últimos 5 atendimentos do paciente, extrai padrões via Claude
- [x] Chips `{tipo:"exame"|"medicamento"|"diagnostico", texto}` abaixo de "Dados Objetivos"
- [x] Clicar no chip appenda o texto ao campo; cores distintas por tipo

### COMMIT 17 — IA conversacional completa (/conversa)
- [x] Nova página `/conversa` com formulário (relato + dados + paciente + tipo)
- [x] `POST /api/conversa/caso-clinico` (maxDuration=60) — Claude retorna 8 seções em JSON
- [x] Seções expandíveis: história clínica, exames, prescrição, protocolo, orientações, retorno, Instagram e carta ao paciente
- [x] Botão "Usar no Copiloto" navega para `/copiloto?dados=...`; botão Copiar por seção
- [x] Adicionado ao Sidebar (academy group) e hub /praxis-ia

### COMMIT 18 — Comunidade entre médicos (/comunidade)
- [x] `GET/POST /api/comunidade/posts` — lista com `meu_like`, cria post buscando `autor_nome` de `perfis`
- [x] `POST /api/comunidade/likes` — toggle com trigger SQL sincronizando contador
- [x] `GET/POST /api/comunidade/comentarios` — lista e cria comentários por post
- [x] Feed com filtro por categoria (Protocolo, Caso Clínico, Experiência, Dúvida, Resultado)
- [x] PostCard: avatar com iniciais, like otimista, comentários inline, expansão de conteúdo longo
- [x] Modal "Novo post" com pills de categoria; adicionado ao Sidebar e hub /praxis-ia

### COMMIT 19 — Fix banner Marketplace no login
- [x] Bug: `login/page.tsx` tratava resposta da API como array → `Array.isArray(data)` sempre false → banner nunca aparecia
- [x] Fix: `data?.anuncio` em vez de `data[0]` — alinhado com retorno real `{ anuncio: {...} | null }`

---

### SQL pendente de execução manual no Supabase
```sql
-- COMMIT 12 (academy_progresso)
CREATE TABLE IF NOT EXISTS academy_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aula_id TEXT NOT NULL, trilha_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'concluida',
  concluida_em TIMESTAMPTZ,
  UNIQUE (user_id, aula_id)
);
ALTER TABLE academy_progresso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "academy_progresso_own" ON academy_progresso FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- COMMIT 18 (comunidade — JÁ EXECUTADO ✅)
-- comunidade_posts, comunidade_comentarios, comunidade_likes, trigger sync_post_likes
```

---



> Documento de acompanhamento entre sessões. Atualizar conforme itens forem resolvidos.

---

## UX / Copiloto — ✅ CONCLUÍDO (06/07/2026 noite)

**Deploy:** `dpl_3q9d2RJeoY7jvq87uT4A5YFCpUJr` → READY  
**Commits:** `34ea3c8` (COMMIT A), `e2b1beb` (COMMIT B)

### Copiloto — Prontuário em blocos editáveis (COMMIT A)

- [x] `parseProntuario()` — parser linha a linha, case-insensitive, strip de `:`, detecta 8 seções padrão
- [x] Seções: Queixa Principal, HDA, Antecedentes, Exame Físico, Hipótese Diagnóstica, Plano/Conduta, Orientações, Retorno
- [x] Cada bloco vira `AutoTextarea` editável com ícone colorido (MessageCircle, Stethoscope, FlaskConical…)
- [x] Fallback gracioso: se `< 3` seções detectadas → `<textarea readonly>` original
- [x] Copy e "Enviar ao MedX" usam conteúdo editado (montado com labels em maiúsculo)
- [x] `novaConsulta()` reseta estado dos blocos

### Copiloto — Timeline do paciente no histórico (COMMIT B)

- [x] `historicoFiltrado` — filtra `copiloto_historico` por `paciente_nome` quando paciente selecionado
- [x] Modo timeline: dot azul + linha guia vertical, data "DD Mon YYYY", badge tipo de consulta, preview 2 linhas do resumo
- [x] Modo flat list: comportamento original preservado quando sem paciente selecionado
- [x] Mensagem diferenciada: "Nenhuma consulta para [Nome]" vs "Nenhuma consulta salva ainda"
- [x] `fmtDateLong()` helper para formatação legível

**Pendente de teste:**
- [ ] Gerar prontuário real e confirmar que parser detecta as seções corretamente
- [ ] Editar um bloco e clicar "Enviar ao MedX" — confirmar que texto editado é enviado (não o original)
- [ ] Selecionar paciente com histórico → confirmar timeline filtrada aparece no strip

---

## UX — CTAs, filtros e IA visível — ✅ CONCLUÍDO (06/07/2026 tarde)

**Commits:** `573cb65` (COMMIT 3), `ab26c4a` (COMMIT 6) + commits de COMMIT 4 e 5

### COMMIT 3 — Filtros recolhidos
- [x] `/radar` — Período sempre visível; Tópico+Fonte+Categoria+Search recolhidos sob "Filtros ▾" com badge contador
- [x] `/pautas` — Categoria+Prioridade recolhidos sob accordion

### COMMIT 4 — Badges de impacto nos Ganchos
- [x] `IMPACTO_CONFIG` — viral (🔥 red), conversao (⭐ yellow), educativo (🧠 blue), vendas (💰 green)
- [x] IA classifica cada gancho com campo `impacto`; badge renderizado em "Gerar" e "Favoritos"

### COMMIT 5 — IA mais visível
- [x] `/editor` — botão "✨ Gerar roteiro" abre modal; chama `/api/roteiros` com prompt de timecodes
- [x] `/referencias` — botão "✨ Buscar influencers" abre modal; busca 5 influencers por especialidade via IA

### COMMIT 6 — CTAs primários maiores
- [x] Padrão unificado: `py-3 px-5 text-[14px] min-h-[44px]` em `/radar`, `/pautas`, `/referencias`
- [x] `/radar` CTA renomeado "Buscar Tendências" (era "Atualizar")

---

## Sessão 06/07/2026 (tarde) — ✅ CONCLUÍDO

### Bugs corrigidos

- [x] **Relatório do paciente** — `maxDuration = 60` adicionado na route (`api/relatorio-paciente`)
- [x] **Emagrecimento Inteligente** — sexo masculino (ou não informado) não exige seção "Menopausa / Andropausa"; seletor M/F adicionado no topo; `maxDuration = 60` na route; sexo enviado à IA no prompt
- [x] **CTA** — `maxDuration = 60` adicionado na route (`api/cta`)
- [x] **Nutrição de Leads** — telefone normalizado antes do INSERT (`.replace(/\D/g, "") || null`) — corrige "the string did not match the expected pattern" com inputs formatados

### Melhorias

- [x] **Tipos de consulta CRM/Agenda** — lista ampliada: Primeira Consulta, Retorno, Nova Consulta - Paciente Antigo, Procedimento, Administração EV/IM, Bioimpedância, Outro
- [x] **Botão Voltar Agenda** — `<ArrowLeft>` no modal de agendamento volta à lista sem recarregar
- [x] **Avisos de 30–60s nos loaders** — mensagem de "pode levar até 30–60 s" em todas as telas com IA de longa duração
- [x] **Sugerir perfil lead com IA** — endpoint `?action=sugerir-perfil` em `api/nutricao-leads`; botão na UI preenche campo Perfil automaticamente
- [x] **Dropdown formatos Banco de Pautas** — seleção de formato (Story, Carrossel, Vídeo…) no formulário de nova pauta
- [x] **Biblioteca de Ganchos CSS** — página `/ganchos` com filtros por formato/emoção/objetivo
- [x] **Fonte global 15px** — `body { font-size: 15px }` (era 14px) em `globals.css`

### Auditoria / Infra

- [x] **Sweep maxDuration em routes** — todas as routes com IA receberam `export const maxDuration = 60`
- [x] **getAnthropicClient server-only** — migrado para `lib/anthropic.ts` com lazy singleton; removido do cliente
- [x] **3 colunas ausentes corrigidas** — colunas referenciadas em routes mas ausentes no schema: adicionadas via `ALTER TABLE … ADD COLUMN IF NOT EXISTS`
- [x] **Constraint user_planos corrigida** — `CHECK plano IN (…)` atualizado para incluir `'trial'`; erro silencioso em novos cadastros resolvido

**Commits desta sessão:** `ac09cb4`, `0ca2e6c`, `34dbc18`, `6308abd`, `7db530a`, `93edd22`

---

## Copiloto de Consulta com voz — ✅ CONCLUÍDO (06/07/2026)

**Commit:** `34dbc18`

- [x] Gravação de voz via MediaRecorder → Groq Whisper large-v3 (language: pt)
- [x] Endpoint `POST /api/copiloto/transcricao` — FormData { audio }, limite 25MB, auth checkAuth()
- [x] Texto transcrito appended ao relato (não substitui)
- [x] VoiceConsentModal one-time (LGPD) — salva `voz_gravacao_autorizada` via PATCH /api/perfil
- [x] Botão Gravar: vermelho pulsando durante gravação, spinner "transcrevendo..." após parar
- [x] Compatibilidade SSR-safe: `hasMediaRecorder` detectado via useEffect, MicOff silencioso em Firefox/Safari
- [x] SQL necessário: `ALTER TABLE perfis ADD COLUMN voz_gravacao_autorizada BOOLEAN DEFAULT FALSE`

**Pendente de teste:**
- [ ] Testar fluxo completo no Chrome: clicar Gravar → modal de consentimento → aceitar → gravar → parar → verificar transcrição no campo Relato
- [ ] Confirmar que rejeitar o modal não persiste nada e mostra o modal novamente na próxima vez
- [ ] Testar em Safari/Firefox — deve exibir MicOff sem quebrar

---

## E-mail de boas-vindas pós-pagamento — ✅ CONCLUÍDO (02/07/2026)

**Commit:** `535a2f3`

- [x] `lib/email-boas-vindas.ts` — helper compartilhado com `buildBoasVindasHtml` + constantes
- [x] Webhook `checkout.session.completed` dispara e-mail via Resend fire-and-forget após ativar plano
- [x] Fallback: `supabase.auth.admin.getUserById` → `session.customer_details.email`
- [x] Falha no e-mail nunca trava nem reverte o webhook
- [x] Guard `RESEND_API_KEY` — silencioso em dev sem a variável

**Pendente de teste:**
- [ ] Confirmar com webhook real do Stripe (pagamento de teste) que e-mail chega no destinatário

---

## /configuracoes/integracoes conectada ao backend — ✅ CONCLUÍDO (02/07/2026)

**Commit:** `8c66fe4`

- [x] `GET /api/integracoes` — retorna linhas de `integracoes_usuario` do usuário autenticado
- [x] `POST /api/integracoes` — upsert por `(user_id, tipo)`, persiste config, marca `ativo=true`
- [x] UI: `useEffect` carrega configs no mount, badge "Conectado" reflete banco real
- [x] Card MedX adicionado (url + integration_token)
- [x] Tabela `integracoes_usuario` com RLS (criada anteriormente)

---

## Crons régua + NPS mesclados no slot diário — ✅ CONCLUÍDO (02/07/2026)

**Commit:** `4454dd5`

- [x] `runRegua()` e `runNps()` inline em `/api/automacoes/diario` via `Promise.allSettled`
- [x] Ambos usam `sendZapiForUser()` — credenciais por usuário com fallback para process.env
- [x] Hobby plan (2 crons): slot 1 = nurturing, slot 2 = diario (trial + leads + relatorio + régua + NPS)
- [x] Falha isolada por etapa não bloqueia as demais

---

## Bugs #1–#5 corrigidos — ✅ CONCLUÍDO (01/07/2026)

**Commits:** `6573cd9`, `6eb56ef`, `34844ee`

- [x] Bug #1 — Gerador de Imagens: modelo `gpt-image` desabilitado na UI (badge "Indisponível"), default → Gemini
- [x] Bug #2 — Hashtags duplicados: strip de `#` antes de prepend em copiloto-conteudo, carrossel, roteiros, calendário
- [x] Bug #3 — Prescricao: abas renomeadas para "Prescrição Rápida" e "Conduta Clínica" com ícones, link cruzado adicionado
- [x] Bug #4 — Imagens quebradas no /perfil: COEP/COOP restrito a `/imagens` (era global, bloqueava Supabase Storage)
- [x] Bug #5 — Relatório timeout: `maxDuration=60` na route + `console.error` no catch da page
- [x] Auto-save avatar/logo após upload (PATCH /api/perfil imediato, não precisa clicar Salvar)

---

## WhatsApp/MedX por assinante + Importação por planilha — ✅ CONCLUÍDO (29/06/2026)

**Commits:** `a2fd4ae`, `1adfa1c`, `fcd24a2`

- [x] `sendZapiForUser()` em todos os crons (nurturing, régua, NPS, reativação)
- [x] `getMedxClientForUser()` em importar-medx e endpoints relacionados
- [x] Importação por planilha CSV/Excel funcional (`importar-planilha/route.ts`)
- [x] Índice parcial `uniq_reativacao_telefone WHERE medx_id IS NULL` preserva casais no mesmo número

**Pendente de teste:**
- [ ] Upload de planilha CSV/Excel em /reativacao (2-3 linhas de teste)
- [ ] CampanhaModal — confirmar que nome/especialidade aparecem corretos (não mais placeholders)
- [ ] Mensagem de reativação do paciente de teste (Bruno, tel 35999190808) — confirmar via cron das 9h BRT

---

## Testes manuais pendentes — sessão 06/07/2026 (tarde)

- [ ] **Emagrecimento Inteligente — masculino sem menopausa**: selecionar Masculino → confirmar que seção "Menopausa / Andropausa" desaparece e que "Gerar Análise" fica habilitado sem preencher aquela seção
- [ ] **Nutrição de Leads — telefone formatado**: salvar lead com telefone no formato `(35) 9-9999-9999` → confirmar que salva sem erro "string did not match the expected pattern"
- [ ] **CTA — timeout**: gerar CTA com texto longo → confirmar que não retorna erro 504 (maxDuration = 60 aplicado)
- [ ] **Compatibilidade mobile geral** — abrir no celular e verificar agenda (modal novo agendamento + filtro de profissionais), admin/anuncios (URLs longas nos cards), e qualquer página com formulário inline

---

## Verificações pendentes (infra / SQL)

- [ ] **Policy de UPDATE no Supabase Storage** — necessária para upload de avatar/logo; SQL ainda não executado:
  ```sql
  CREATE POLICY "auth_update_perfil_assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'perfil-assets' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'perfil-assets');
  ```
- [x] **Constraint `user_planos`** — corrigida: `'trial'` incluído no CHECK (sessão 06/07/2026 tarde)
- [ ] **Webhook Stripe** — fix de URL www. aplicado (commit `948fe61`), não confirmado com pagamento real
- [ ] **Teste mobile** — 28 telas com tagline nova (commit `d57b4e9`)
- [ ] **Capa do livro** — adicionar manualmente no Elementor (WordPress)

---

## Dashboard por Paciente — ⏳ INVESTIGADO, aguardando aprovação

**Funcionalidades solicitadas:** foto, peso/altura/IMC, circunferência abdominal, medicamentos, exames com tendência, última consulta + pendências, protocolos ativos, botão Copiloto.

**Schema atual de `pacientes_local`** (colunas confirmadas via `app/api/pacientes/route.ts`):
- `id`, `user_id`, `nome`, `telefone`, `email`, `data_nascimento`, `observacao`, `created_at`
- **Ausente:** peso, altura, circunferência, foto_url, medicamentos, exames

**Proposta de schema mínimo viável:**
```sql
-- Adicionar em pacientes_local (dados estáticos do paciente)
ALTER TABLE pacientes_local
  ADD COLUMN IF NOT EXISTS foto_url          TEXT,
  ADD COLUMN IF NOT EXISTS peso              NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS altura            NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS circunferencia_ab NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS medicamentos      JSONB DEFAULT '[]'::jsonb;
  -- IMC calculado no frontend: peso / (altura/100)^2

-- Tabela separada para exames (cresce por consulta, histórico faz sentido)
CREATE TABLE IF NOT EXISTS paciente_exames (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id),
  paciente_id  TEXT NOT NULL,  -- compatível com MedX (string) e local (uuid)
  nome         TEXT NOT NULL,  -- "HbA1c", "TSH", "LDL"
  valor        TEXT NOT NULL,  -- "6.2%", "2.5 mUI/L"
  referencia   TEXT,           -- "< 7%"
  data_coleta  DATE,
  criado_em    TIMESTAMPTZ DEFAULT now()
);
```
Medicamentos como JSONB em `pacientes_local` (lista editável simples, sem histórico).
Exames como tabela separada (valores mudam por consulta → histórico + tendência ↑↓).
Foto como URL no Supabase Storage, bucket `pacientes-fotos`.

**Mineração de exames do `copiloto_historico`:** `resultado.exames_solicitados` é um array de strings (`["HbA1c", "TSH"]`) — contém apenas nomes, sem valores. Útil para sugerir exames a adicionar, não para popular valores automaticamente.

**Rota:** `/pacientes/[id]` (rota própria) — melhor que modal por permitir URL direta, botão "Abrir no Copiloto" via `?paciente=id`, e navegação via back do browser.

**Pendente de aprovação:**
- [ ] Aprovar schema acima e executar SQL no Supabase
- [ ] Criar bucket `pacientes-fotos` no Supabase Storage + policy de upload autenticado
- [ ] Implementar `app/pacientes/[id]/page.tsx` com os 7 blocos
- [ ] Endpoint `PATCH /api/pacientes?action=update` para salvar peso/altura/medicamentos
- [ ] Endpoint `POST /api/pacientes/exames` para adicionar exames manualmente

---

## Decisões de produto pendentes

- [ ] **Dashboard por Paciente** — schema aprovado? Ver seção acima
- [ ] **Marketplace de cursos** para assinantes anunciarem — mencionado, não iniciado
- [ ] **Seção "Antes e depois"** (drbrunogustavo.com) — confirmar consentimento de uso publicitário por paciente, aviso CFM "resultados individuais variam"

---

## Erros silenciosos — ✅ CONCLUÍDO (23/06/2026)

**79 ocorrências corrigidas** em 2 commits (`cb6a80e`, `fba0ea6`). Ver histórico para detalhes.

---

*Última atualização: 06/07/2026 (noite)*

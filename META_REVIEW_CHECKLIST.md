# Meta App Review — PRAXIS Checklist

**App:** PRAXIS — Plataforma para Médicos Empreendedores  
**Permissions solicitadas:** `instagram_basic`, `instagram_manage_insights`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`  
**Última atualização:** Junho 2026

---

## STATUS RÁPIDO

| Item | Estado | Observação |
|------|--------|------------|
| Privacy Policy URL | ✅ Pronto | `https://praxisplataforma.com.br/privacidade` |
| Data Deletion Callback | ✅ Criado | `POST /api/instagram/data-deletion` — **registrar no painel Meta** |
| Ícone 1024×1024 | ❌ FALTA | Criar e fazer upload no Meta Developer Console |
| OAuth Connect flow | ✅ Pronto | `/api/instagram/connect` → `/api/instagram/callback` |
| Chamadas de API por permissão | ✅ Pronto | `/api/instagram/test-connection` cobre todas |
| App em modo "Live" | ❌ Checar | Verificar em Meta for Developers → Settings → Basic |
| Domínio verificado | ❌ Checar | Business Manager → Brand Safety → Domains |
| Business Verification | ❌ Checar | Necessário para `instagram_manage_insights` |
| Gravação de tela | ❌ FALTA | Gravar fluxo completo (ver seção abaixo) |

---

## CHECKLIST COMPLETO

### 1. CONFIGURAÇÃO DO APP (Meta for Developers)

- [ ] Acesse [developers.facebook.com](https://developers.facebook.com) → seu app PRAXIS
- [ ] **Settings → Basic:**
  - [ ] App Name: `PRAXIS`
  - [ ] App Icon: **1024×1024 px, formato PNG** — sem logos Meta/Facebook/Instagram
  - [ ] Privacy Policy URL: `https://praxisplataforma.com.br/privacidade`
  - [ ] Terms of Service URL: `https://praxisplataforma.com.br/termos` (se existir)
  - [ ] Category: `Business`
  - [ ] Data Deletion Request URL: `https://praxisplataforma.com.br/api/instagram/data-deletion`
- [ ] **App Domains:** adicionar `praxisplataforma.com.br`
- [ ] **OAuth Redirect URIs** (em Facebook Login for Business):
  - `https://praxisplataforma.com.br/api/instagram/callback`
- [ ] App em modo **Live** (não Development)

---

### 2. ÍCONE DO APP — 1024×1024

- [ ] Criar imagem PNG **exatamente 1024×1024 px**
- [ ] Usar o logotipo PRAXIS (P estilizado + acento dourado `#b8976a`)
- [ ] **NÃO incluir:** logos do Instagram, Facebook, Meta, câmera com arco-íris
- [ ] Background: `#0D1B2A` (azul-escuro PRAXIS) ou branco puro
- [ ] Fazer upload em: Meta for Developers → Settings → Basic → App Icon
- [ ] Salvar uma cópia em `public/meta-app-icon-1024.png`

**Dica:** Usar o mesmo ícone que está em `public/icon-512.png`, redimensionado para 1024px.

---

### 3. POLÍTICA DE PRIVACIDADE

- [x] URL pública: `https://praxisplataforma.com.br/privacidade`
- [x] Menciona coleta de dados do Instagram
- [x] Menciona direito de exclusão de dados
- [x] Link para `/deletar-dados` na própria página
- [ ] **Verificar se a página carrega sem login** — confirmar que `/privacidade` está na lista `PUBLIC_ROUTES` do middleware ✅ (já está)
- [ ] Adicionar menção explícita ao Meta / Instagram Graph API na política

**Texto sugerido para adicionar à seção de Integrações da política:**

> A PRAXIS integra com a API do Instagram (Meta Platforms) para exibir métricas de desempenho e gerenciar publicações de conteúdo médico. Ao conectar sua conta Instagram, coletamos e armazenamos seu token de acesso de forma criptografada. Você pode desconectar sua conta a qualquer momento em Configurações → Integrações.

---

### 4. DATA DELETION CALLBACK

- [x] Endpoint criado: `POST /api/instagram/data-deletion`
- [x] Verifica assinatura HMAC-SHA256 com `META_APP_SECRET`
- [x] Deleta tokens da tabela `instagram_tokens`
- [x] Retorna `{ url, confirmation_code }` no formato exigido pela Meta
- [ ] **Registrar a URL no painel:**
  - Meta for Developers → Settings → Basic → Data Deletion Request URL
  - URL: `https://praxisplataforma.com.br/api/instagram/data-deletion`
- [ ] Garantir que `META_APP_SECRET` está configurado no Vercel:
  ```
  vercel env add META_APP_SECRET production
  ```

---

### 5. CHAMADAS DE API (uma por permissão nos últimos 30 dias)

A Meta exige evidência de uso real de cada permissão solicitada.

**Endpoint de teste:** `GET /api/instagram/test-connection`  
Faz chamadas reais cobrindo todas as permissões.

| Permissão | Chamada | Onde está no código |
|-----------|---------|---------------------|
| `instagram_basic` | `GET /{ig-id}?fields=username,followers_count` | `metrics/route.ts` + `test-connection` |
| `instagram_manage_insights` | `GET /{ig-id}/insights?metric=impressions` | `metrics/route.ts` + `test-connection` |
| `instagram_content_publish` | `GET /{ig-id}?fields=id` (validação) | `test-connection` |
| `pages_show_list` | `GET /me/accounts` | `callback/route.ts` + `test-connection` |
| `pages_read_engagement` | `GET /{page-id}?fields=fan_count` | `test-connection` |

**Para gerar logs antes da revisão:**
1. Conectar uma conta Instagram real via `/instagram`
2. Acessar `GET /api/instagram/test-connection` (autenticado)
3. Confirmar que `summary.allOk === true` no JSON retornado
4. Repetir pelo menos uma vez por semana nos 30 dias antes de submeter

---

### 6. VERIFICAÇÃO DO NEGÓCIO (Business Verification)

Necessária para `instagram_manage_insights` e `instagram_content_publish`.

- [ ] Acesse: Meta Business Suite → Configurações → Verificação do negócio
- [ ] Documentação necessária: CNPJ, contrato social ou cartão CNPJ
- [ ] Alternativamente: verificação via domínio (DNS TXT record)
- [ ] Status de verificação aparece em Meta for Developers → App Review → Permissions

---

### 7. GRAVAÇÃO DE TELA (Screen Recording)

A Meta exige um vídeo mostrando o fluxo completo de uso de cada permissão.

**Roteiro da gravação (MP4, máx 100MB, qualidade HD):**

**Faixa 1 — Conectar conta Instagram:**
1. Fazer login na plataforma PRAXIS (`/login`)
2. Navegar para `/instagram`
3. Clicar em "Conectar Instagram" → fluxo OAuth abre
4. Autenticar com conta Instagram de teste
5. Voltar para `/instagram` com conta conectada ✓

**Faixa 2 — Métricas (instagram_basic + instagram_manage_insights):**
1. Tela de métricas em `/instagram` mostrando seguidores, alcance, impressões
2. O dado carrega da Graph API (não mock)

**Faixa 3 — Publicação (instagram_content_publish):**
1. Mostrar tela de geração de conteúdo
2. (Se disponível) botão de publicar → demonstrar intenção de publicar
3. OU mostrar a chamada de API no `test-connection` retornando ok

**Faixa 4 — Pages (pages_show_list + pages_read_engagement):**
1. Mostrar a resposta do `test-connection` com `pages_show_list.ok: true`
2. OU mostrar no fluxo de callback onde buscamos as Pages do usuário

**Ferramentas:** QuickTime Player (Mac) ou OBS Studio.

---

### 8. INSTRUÇÕES PARA O REVISOR META

Cole este texto na aba "Notes for reviewer" ao submeter cada permissão:

```
PRAXIS is a SaaS platform for Brazilian medical professionals (doctors, clinics).

USE CASE: Medical doctors use PRAXIS to manage their content marketing strategy
on Instagram. The platform analyzes their Instagram performance metrics
(followers, reach, engagement) and helps them create evidence-based medical
content optimized for their audience.

PERMISSION USAGE:
• instagram_basic: Display the doctor's Instagram profile info and post count
  on their analytics dashboard (/instagram).
• instagram_manage_insights: Show reach, impressions, and profile views over
  the last 30 days so doctors can track their growth.
• instagram_content_publish: (future) Allow doctors to schedule and publish
  AI-generated medical content directly from the platform.
• pages_show_list: Identify the Facebook Page linked to the doctor's Instagram
  Business Account during the OAuth connection flow.
• pages_read_engagement: Display Page engagement data alongside Instagram metrics.

TEST ACCOUNT:
Email: [INSERIR EMAIL DA CONTA DE TESTE]
Password: [INSERIR SENHA]
URL: https://praxisplataforma.com.br/login

OAUTH FLOW: Click "Conectar Instagram" on the /instagram page.
```

---

### 9. VARIÁVEIS DE AMBIENTE NECESSÁRIAS (Vercel)

```bash
# Já deve ter:
META_APP_ID=<seu-app-id>
META_APP_SECRET=<seu-app-secret>

# Verificar se está configurado:
vercel env ls | grep META
```

---

### 10. CONTA DE TESTE PARA O REVISOR

- [ ] Criar conta de teste em `https://praxisplataforma.com.br/cadastro`
- [ ] Conectar uma conta Instagram **Business** (não pessoal) de teste
- [ ] Confirmar que `/api/instagram/test-connection` retorna `allOk: true`
- [ ] Registrar as credenciais para incluir no formulário de revisão

**IMPORTANTE:** A conta Instagram conectada deve ser uma **conta Business ou Creator** — a API do Graph não funciona com contas pessoais.

---

### 11. SUBMISSÃO

1. Acesse: Meta for Developers → App Review → Permissions and Features
2. Clique em "Request" para cada permissão
3. Preencha o formulário com:
   - Use case description
   - Screen recording
   - Test credentials
4. Submeta e aguarde (geralmente 5-30 dias úteis)

---

## O QUE FALTA FAZER AGORA (Priorizado)

1. **[CRÍTICO]** Criar ícone 1024×1024 e fazer upload no Meta Developer Console
2. **[CRÍTICO]** Registrar Data Deletion URL no painel Meta:
   `https://praxisplataforma.com.br/api/instagram/data-deletion`
3. **[CRÍTICO]** Adicionar `META_APP_SECRET` no Vercel (necessário para o callback funcionar)
4. **[IMPORTANTE]** Verificar negócio no Meta Business Manager (CNPJ)
5. **[IMPORTANTE]** Gravar vídeo do fluxo completo seguindo o roteiro acima
6. **[IMPORTANTE]** Criar conta de teste e conectar Instagram Business
7. **[MENOR]** Adicionar menção ao Instagram Graph API na política de privacidade
8. **[MENOR]** Colocar app em modo "Live" antes de submeter

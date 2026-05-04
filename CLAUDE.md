# CLAUDE.md — MedContent Dashboard

Documentação técnica do projeto para referência futura e continuidade de desenvolvimento com IA.

---

## Stack Utilizada

| Camada       | Tecnologia              | Versão   | Motivo da escolha |
|--------------|-------------------------|----------|-------------------|
| Framework    | Next.js (App Router)    | 14.x     | SSR + roteamento automático por pasta |
| Linguagem    | TypeScript              | 5.x      | Tipagem estática, melhor DX |
| Estilização  | Tailwind CSS            | 3.x      | Utility-first, consistência de design |
| Componentes  | shadcn/ui (base)        | —        | Acessibilidade e composição |
| Ícones       | Lucide React            | 0.383    | Biblioteca leve e consistente |
| IA / API     | Anthropic Claude Sonnet | latest   | Busca inteligente de tendências médicas |
| Deploy       | Vercel                  | —        | CI/CD automático via GitHub |

---

## Estrutura de Pastas

```
medico-dashboard/
├── app/                        # App Router do Next.js
│   ├── layout.tsx              # Layout raiz — importa Sidebar e globals.css
│   ├── globals.css             # Reset, fontes (Inter + JetBrains Mono), utilitários
│   ├── page.tsx                # Dashboard home — visão geral dos módulos
│   ├── radar/
│   │   └── page.tsx            # Radar de Tendências — busca IA em tempo real
│   ├── pautas/
│   │   └── page.tsx            # Banco de Pautas — repositório de ideias clínicas
│   └── referencias/
│       └── page.tsx            # Monitor de Referências — perfis médicos influentes
│
├── components/
│   ├── Sidebar.tsx             # Navegação lateral fixa — compartilhada entre todas as páginas
│   ├── TopBar.tsx              # Barra superior por página — título, subtítulo e actions
│   ├── StatCard.tsx            # Card de métrica reutilizável com acento colorido
│   └── ui/                     # Componentes shadcn/ui (adicionar conforme necessário)
│
├── lib/
│   └── utils.ts                # Helper cn() para merge de classes Tailwind
│
├── public/                     # Assets estáticos
├── next.config.js              # Configuração do Next.js
├── tailwind.config.js          # Paleta de cores customizada + animações
├── postcss.config.js           # PostCSS para Tailwind
├── tsconfig.json               # Configuração TypeScript
└── CLAUDE.md                   # Este arquivo
```

---

## Paleta de Cores

Definida em `tailwind.config.js` sob `theme.extend.colors`:

| Token               | Hex / Valor                  | Uso |
|---------------------|------------------------------|-----|
| `background`        | `#08090e`                    | Fundo principal da página |
| `surface`           | `#0f1018`                    | Sidebar, TopBar |
| `card`              | `#13141d`                    | Cards, painéis |
| `border`            | `#1c1d2a`                    | Bordas padrão |
| `border-hover`      | `#2a2c3e`                    | Bordas em hover |
| `text-primary`      | `#e8eaf2`                    | Texto principal |
| `text-secondary`    | `#7c85a0`                    | Texto de suporte |
| `text-muted`        | `#474f66`                    | Labels, metadados |
| `accent`            | `#00c07f` (verde médico)     | Cor primária de destaque |
| `accent-dim`        | `rgba(0,192,127,0.12)`       | Background de badges accent |
| `accent-border`     | `rgba(0,192,127,0.3)`        | Borda de elementos accent |
| `blue`              | `#3b7fff`                    | Acento secundário |

---

## Padrões de Componentes

### Páginas
Cada página segue esta estrutura:

```tsx
export default function NomePage() {
  return (
    <div className="animate-fade-in">
      <TopBar title="Título" subtitle="SUBTÍTULO · EM CAPS MONO" actions={<Botões />} />
      <div className="p-8 space-y-6">
        {/* StatCards */}
        {/* Filtros */}
        {/* Conteúdo principal */}
      </div>
    </div>
  )
}
```

### StatCard
```tsx
<StatCard
  label="Label"     // texto pequeno acima do número
  value={42}        // número principal
  sub="descrição"   // texto menor abaixo
  icon={IconName}   // ícone Lucide (opcional)
  accent="green"    // "green" | "blue" | "red" | "amber"
/>
```

### Badges de Status
```tsx
// Padrão para todos os badges
<span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border bg-X-950/60 border-X-500/40 text-X-400">
  Texto
</span>
```

### Filtros em Pill
```tsx
<button className={cn(
  "text-[10px] px-2.5 py-0.5 rounded-full border transition-all",
  ativo
    ? "bg-accent-dim border-accent-border text-accent-text font-medium"
    : "border-border text-text-muted hover:text-text-secondary"
)}>
  Item
</button>
```

---

## Módulos do Sistema

### 1. Radar de Tendências (`/radar`)
- Chama a API da Anthropic com `web_search` para buscar tendências médicas reais
- Filtra por Fonte, Categoria e Período
- Cards com badge de urgência (Alto/Médio/Baixo) com animação de pulse no Alto
- Botão "Transformar em Pauta" salva no estado local

**Variável de ambiente necessária:**
```
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Banco de Pautas (`/pautas`)
- CRUD completo de ideias clínicas
- Filtros por Categoria, Prioridade e Estágio de produção
- Estágios: Ideia → Em produção → Revisão → Pronto → Publicado
- Formulário inline para criação rápida

### 3. Monitor de Referências (`/referencias`)
- Cadastro de médicos influentes no nicho
- Campos: nome, Instagram, especialidade, seguidores, frequência, temas, relevância
- Cards com avatar gerado por iniciais
- Links diretos para perfil Instagram e site

---

## Decisões de Configuração

### Por que Next.js e não Vite/React puro?
O App Router do Next.js oferece roteamento automático por pasta, melhor SEO, e facilita a adição futura de Server Components e API Routes (ex: proxy seguro para a Anthropic API sem expor a chave no cliente).

### Por que `NEXT_PUBLIC_` na variável de ambiente?
No Next.js, apenas variáveis prefixadas com `NEXT_PUBLIC_` são expostas ao cliente (browser). Como o Radar faz chamadas diretas da API no browser, a chave precisa desse prefixo. Em produção, o ideal é criar uma API Route (`/api/radar`) que faz a chamada no servidor, eliminando a exposição da chave.

### Fonte tipográfica
- **Inter** — corpo de texto, UI geral. Leitura limpa em telas.
- **JetBrains Mono** — labels, badges, metadados, timestamps. Comunica precisão e dado técnico.

### Sidebar fixa vs. dinâmica
A Sidebar é `position: fixed` com `width: 240px`. O `<main>` tem `margin-left: 240px` (via `ml-60` no Tailwind). Essa abordagem é mais simples e suficiente para dashboards desktop-first.

### Estado local vs. banco de dados
Atualmente o Banco de Pautas e o Monitor de Referências usam `useState` local — os dados são perdidos ao recarregar. Para persistência real, as próximas etapas seriam:
1. Supabase (Postgres gerenciado) + autenticação
2. Ou localStorage como solução intermediária

---

## Comandos Úteis

```bash
# Desenvolvimento local
npm run dev

# Build para produção
npm run build

# Preview do build
npm start

# Verificar erros de tipo
npx tsc --noEmit
```

---

## Próximos Passos Sugeridos

- [ ] Adicionar persistência com Supabase ou localStorage
- [ ] Criar API Route `/api/radar` para proteger a chave da Anthropic no servidor
- [ ] Módulo: Gerador de Legendas para Instagram com IA
- [ ] Módulo: Calendário Editorial visual
- [ ] Módulo: Analytics de engajamento (integração Meta API)
- [ ] Autenticação com NextAuth.js
- [ ] Deploy com variáveis de ambiente seguras no Vercel

---

*Última atualização: Maio 2025 — Dr. Bruno Gustavo*

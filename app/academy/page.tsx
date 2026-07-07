"use client"

import { useState, useEffect, useCallback } from "react"
import {
  GraduationCap, Megaphone, BarChart3, TrendingUp, Rocket,
  Users, Check, Clock, Search, X, ChevronDown, ChevronRight,
  BookOpen, Play, Circle, Loader2, ArrowRight, ExternalLink,
  CheckCircle, BarChart2, Award, Star, Trophy,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileOnlyHeader } from "@/components/MobileOnlyHeader"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Aula {
  id:          string
  numero:      number
  titulo:      string
  conteudo:    string
  duracao:     string
  nivel:       "Iniciante" | "Intermediário" | "Avançado"
  linkModulo?: { label: string; href: string }
}

interface Modulo {
  id:    string
  nome:  string
  aulas: Aula[]
}

interface Trilha {
  id:        string
  titulo:    string
  descricao: string
  icon:      React.ElementType
  color:     string
  bg:        string
  border:    string
  nivel:     string
  modulos:   Modulo[]
}

type ProgressoMap = Record<string, "nao_iniciada" | "em_andamento" | "concluida">
type Tab = "trilhas" | "aulas" | "comunidade" | "progresso"

// ─── Dados ────────────────────────────────────────────────────────────────────

const TRILHAS: Trilha[] = [
  {
    id: "marketing", titulo: "Marketing Médico", nivel: "Iniciante → Avançado",
    descricao: "Do zero à autoridade digital. Atraia pacientes pelo Instagram sem violar o CFM.",
    icon: Megaphone, color: "var(--accent)", bg: "var(--accent-dim)", border: "var(--accent-border)",
    modulos: [
      {
        id: "mkt-m1", nome: "Módulo 1 — Fundamentos",
        aulas: [
          { id: "mkt-1", numero: 1, titulo: "Por que médicos falham no marketing digital", duracao: "18 min", nivel: "Iniciante",
            conteudo: "Os 5 erros mais comuns de médicos nas redes sociais. Como o CFM regula a publicidade médica. O que pode e não pode segundo a Resolução CFM 2.336/2023. Exemplos práticos de publicações aprovadas e reprovadas.", linkModulo: { label: "Radar de Tendências", href: "/radar" } },
          { id: "mkt-2", numero: 2, titulo: "Posicionamento médico: como se tornar referência", duracao: "24 min", nivel: "Iniciante",
            conteudo: "Diferença entre ser generalista e especialista de nicho. Como definir seu avatar de paciente ideal em 3 perguntas. Como comunicar seu diferencial sem parecer arrogante. Exercício prático: sua proposta de valor em 1 frase.", linkModulo: { label: "Copiloto de Conteúdo", href: "/roteiros" } },
          { id: "mkt-3", numero: 3, titulo: "Instagram para médicos: do zero à autoridade", duracao: "31 min", nivel: "Iniciante",
            conteudo: "Otimização do perfil: bio, foto, destaques. Os 5 pilares de conteúdo médico que convertem. Como crescer sem dançar ou fazer trends absurdas. Frequência ideal por fase de crescimento (0-1k / 1k-10k / 10k+).", linkModulo: { label: "Instagram Analytics", href: "/instagram" } },
          { id: "mkt-4", numero: 4, titulo: "Os tipos de conteúdo que mais convertem pacientes", duracao: "22 min", nivel: "Iniciante",
            conteudo: "Reels educativos vs. de autoridade: quando usar cada um. Carrosséis que ensinam e geram salvamentos. Stories que aproximam e criam relacionamento. Como usar cada formato para cada objetivo." },
        ],
      },
      {
        id: "mkt-m2", nome: "Módulo 2 — Crescimento",
        aulas: [
          { id: "mkt-5", numero: 5, titulo: "Como criar um Reel viral sobre sua especialidade", duracao: "28 min", nivel: "Intermediário",
            conteudo: "Estrutura comprovada: gancho (3s) + desenvolvimento (30s) + CTA (5s). Os 10 ganchos que mais funcionam para médicos. Como gravar sem medo de câmera. Roteiro template.", linkModulo: { label: "Gerador de Roteiros", href: "/roteiros" } },
          { id: "mkt-6", numero: 6, titulo: "Calendário editorial: nunca mais ficar sem pauta", duracao: "19 min", nivel: "Intermediário",
            conteudo: "Como montar 30 dias de conteúdo em 2 horas com o PRAXIS. Datas comemorativas de saúde para sua especialidade. Temas evergreen vs. trending: como equilibrar. Método de batching.", linkModulo: { label: "Banco de Pautas", href: "/pautas" } },
          { id: "mkt-7", numero: 7, titulo: "Tráfego pago para clínicas: o básico que funciona", duracao: "35 min", nivel: "Intermediário",
            conteudo: "Quando investir em ads (e quando não). Como criar campanhas no Meta Ads para captação de leads médicos. Quanto investir por fase: R$300, R$1000, R$3000/mês. Métricas para avaliar resultados. CPL ideal por especialidade." },
          { id: "mkt-8", numero: 8, titulo: "Análise de métricas: o que realmente importa", duracao: "21 min", nivel: "Intermediário",
            conteudo: "Alcance vs. engajamento vs. conversão: a hierarquia. As métricas que predizem crescimento de pacientes. Como usar o Instagram Insights para tomar decisões. Dashboard de acompanhamento mensal.", linkModulo: { label: "Agente Executivo", href: "/agente" } },
        ],
      },
      {
        id: "mkt-m3", nome: "Módulo 3 — Autoridade",
        aulas: [
          { id: "mkt-9", numero: 9, titulo: "Como se tornar referência na sua especialidade", duracao: "27 min", nivel: "Avançado",
            conteudo: "Estratégia de conteúdo de autoridade: séries temáticas. Como citar estudos científicos sem ser chato. Posicionamento contra mitos comuns. Como lidar com comentários difíceis e críticas.", linkModulo: { label: "Radar de Tendências", href: "/radar" } },
          { id: "mkt-10", numero: 10, titulo: "Parcerias estratégicas e co-marketing médico", duracao: "23 min", nivel: "Avançado",
            conteudo: "Como fazer lives com colegas que ampliam seu alcance. Sistema de indicação cruzada entre especialidades. Como abordar parceiros potenciais. Cases reais de co-marketing médico bem-sucedido.", linkModulo: { label: "Monitor de Referências", href: "/referencias" } },
          { id: "mkt-11", numero: 11, titulo: "Depoimentos e prova social: ética e estratégia", duracao: "16 min", nivel: "Avançado",
            conteudo: "O que o CFM permite sobre depoimentos. Como coletar feedback de pacientes eticamente. Como exibir resultados sem prometer curas. Templates de pedido de depoimento. Diferença entre antes/depois permitido e proibido." },
          { id: "mkt-12", numero: 12, titulo: "Construindo uma marca médica duradoura", duracao: "29 min", nivel: "Avançado",
            conteudo: "Identidade visual consistente: cores, fontes, estilo de foto. Tom de voz: como escrever textos que parecem seus. Arquitetura de conteúdo de longo prazo. Como manter relevância com mudanças de algoritmo.", linkModulo: { label: "Gerador de Legendas", href: "/legendas" } },
        ],
      },
    ],
  },
  {
    id: "gestao", titulo: "Gestão de Clínica", nivel: "Todos os níveis",
    descricao: "Gerencie sua clínica como empresa. Indicadores, finanças, equipe e crescimento sustentável.",
    icon: BarChart3, color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.22)",
    modulos: [
      {
        id: "ges-m1", nome: "Módulo 1 — Fundamentos da Gestão",
        aulas: [
          { id: "ges-1", numero: 1, titulo: "Por que 70% das clínicas fecham em 5 anos", duracao: "22 min", nivel: "Iniciante",
            conteudo: "Os erros de gestão mais comuns que levam clínicas à falência. Como pensar como empresário sem deixar de ser médico. A diferença entre clínica e consultório. Por onde começar quando você não sabe nada de gestão." },
          { id: "ges-2", numero: 2, titulo: "Indicadores que todo médico deve acompanhar", duracao: "26 min", nivel: "Iniciante",
            conteudo: "Ticket médio, taxa de retorno, custo de aquisição de paciente, taxa de ocupação da agenda, churn. Como calcular cada um. Como interpretar e agir sobre eles. Dashboard financeiro mensal.", linkModulo: { label: "Financeiro", href: "/financeiro" } },
          { id: "ges-3", numero: 3, titulo: "Gestão financeira para médicos: o essencial", duracao: "33 min", nivel: "Iniciante",
            conteudo: "Separar PJ de PF: por que é fundamental. Pró-labore vs. distribuição de lucros. Reserva de emergência: quanto guardar. Planejamento tributário básico: Simples vs. Lucro Presumido. Controle de fluxo de caixa." },
        ],
      },
      {
        id: "ges-m2", nome: "Módulo 2 — Processos e Equipe",
        aulas: [
          { id: "ges-4", numero: 4, titulo: "SOPs: como documentar sua clínica", duracao: "24 min", nivel: "Intermediário",
            conteudo: "O que são SOPs e por que toda clínica precisa. Como criar procedimentos operacionais padrão para recepção, consulta e pós-atendimento. Templates prontos. Como implementar sem resistência da equipe." },
          { id: "ges-5", numero: 5, titulo: "Recrutamento e seleção para clínicas", duracao: "28 min", nivel: "Intermediário",
            conteudo: "Como contratar secretária, enfermeira e gestor. Onde encontrar bons candidatos. Processo de entrevista. O que avaliar além do currículo. Teste prático para cada cargo." },
          { id: "ges-6", numero: 6, titulo: "Como treinar e reter sua equipe", duracao: "31 min", nivel: "Intermediário",
            conteudo: "Onboarding estruturado para novos colaboradores. Como criar cultura de alta performance em clínica. Motivação além do salário. Como lidar com conflitos. O que fazer quando alguém quer sair." },
          { id: "ges-7", numero: 7, titulo: "Avaliação de desempenho na prática", duracao: "19 min", nivel: "Intermediário",
            conteudo: "Como avaliar cada membro da equipe de forma objetiva. Feedback que gera melhoria. Metas individuais e coletivas. O que fazer quando alguém não performa. Plano de desenvolvimento individual." },
        ],
      },
      {
        id: "ges-m3", nome: "Módulo 3 — Crescimento",
        aulas: [
          { id: "ges-8", numero: 8, titulo: "Como precificar sua consulta corretamente", duracao: "27 min", nivel: "Avançado",
            conteudo: "Método de precificação baseado em custo + valor. Como calcular o preço mínimo viável. Estratégia de preço premium. Como comunicar aumento de preço para pacientes antigos. Benchmarking por especialidade." },
          { id: "ges-9", numero: 9, titulo: "Estratégias para reduzir dependência de convênios", duracao: "35 min", nivel: "Avançado",
            conteudo: "Como migrar de convênio para particular de forma gradual e segura. Estratégias de conversão de paciente convênio para particular. Criação de pacotes e programas de acompanhamento. Comunicação da transição." },
          { id: "ges-10", numero: 10, titulo: "Planejamento para a segunda unidade", duracao: "40 min", nivel: "Avançado",
            conteudo: "Quando você está pronto para expandir. Como escolher a localização. Projeção financeira da segunda unidade. Modelo de gestão à distância. O que pode dar errado e como evitar." },
        ],
      },
    ],
  },
  {
    id: "comercial", titulo: "Comercial e Conversão", nivel: "Iniciante → Intermediário",
    descricao: "Transforme interessados em pacientes fiéis. Scripts, CRM, fidelização e reativação.",
    icon: TrendingUp, color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.22)",
    modulos: [
      {
        id: "com-m1", nome: "Módulo 1 — Conversão",
        aulas: [
          { id: "com-1", numero: 1, titulo: "A jornada do paciente moderno", duracao: "20 min", nivel: "Iniciante",
            conteudo: "Como o paciente de 2026 pesquisa, decide e escolhe seu médico. Os 5 momentos de decisão. O papel do Instagram, Google e indicações. Como aparecer em cada etapa. Por que 80% dos leads esfria antes de agendar.", linkModulo: { label: "CRM de Leads", href: "/nutricao-leads" } },
          { id: "com-2", numero: 2, titulo: "Como converter leads em consultas", duracao: "25 min", nivel: "Iniciante",
            conteudo: "O primeiro contato que decide tudo. Template de mensagem de boas-vindas. Como qualificar leads sem parecer um vendedor. Quando e como fazer follow-up. Taxa de conversão ideal e como melhorá-la." },
          { id: "com-3", numero: 3, titulo: "Scripts de atendimento de alta conversão", duracao: "32 min", nivel: "Intermediário",
            conteudo: "Roteiro completo para recepcionista: do WhatsApp à confirmação de consulta. Como responder as 10 objeções mais comuns. Tom de voz que converte. Erros que afastam pacientes.", linkModulo: { label: "Mapa de Objeções", href: "/objecoes" } },
          { id: "com-4", numero: 4, titulo: "Como apresentar e fechar protocolos", duracao: "28 min", nivel: "Intermediário",
            conteudo: "Como apresentar programas de acompanhamento sem pressionar. A psicologia da decisão do paciente. Ancoragem de valor: como o Elite é percebido diferente. Quando e como oferecer parcelamento. Taxa de conversão de protocolos vs. consultas avulsas." },
        ],
      },
      {
        id: "com-m2", nome: "Módulo 2 — Fidelização",
        aulas: [
          { id: "com-5", numero: 5, titulo: "Experiência premium do paciente", duracao: "24 min", nivel: "Iniciante",
            conteudo: "Os 12 pontos de contato do paciente com sua clínica. Como criar uma experiência que gera indicações espontâneas. Pequenos gestos de alto impacto. Pesquisa de NPS: como aplicar e interpretar." },
          { id: "com-6", numero: 6, titulo: "Programa de indicações que funciona", duracao: "18 min", nivel: "Iniciante",
            conteudo: "Por que programas de indicação falham. O modelo de 3 etapas que funciona. Como motivar sem parecer mercenário. Regras claras e comunicação transparente. Cases de clínicas que lotaram a agenda por indicação." },
          { id: "com-7", numero: 7, titulo: "Régua de relacionamento pós-consulta", duracao: "21 min", nivel: "Intermediário",
            conteudo: "O fluxo de mensagens que mantém o paciente engajado. Sequência de 30 dias: o que enviar e quando. Como personalizar sem gastar horas. Automação ética. A diferença entre nutrição e spam.", linkModulo: { label: "Nutrição de Pacientes", href: "/nutricao-pacientes" } },
          { id: "com-8", numero: 8, titulo: "Como reativar pacientes perdidos", duracao: "23 min", nivel: "Intermediário",
            conteudo: "Definindo 'paciente perdido': 3, 6 ou 12 meses? Segmentação por motivo de afastamento. Script de reativação que não parece desesperado. O momento certo para reativar. Taxa de reativação realista.", linkModulo: { label: "Nutrição de Leads", href: "/nutricao-leads" } },
        ],
      },
    ],
  },
  {
    id: "escala", titulo: "Escalabilidade", nivel: "Avançado",
    descricao: "Da clínica solo ao grupo médico. Telemedicina, segunda unidade, patrimônio e legado.",
    icon: Rocket, color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.22)",
    modulos: [
      {
        id: "esc-m1", nome: "Módulo 1 — Escala",
        aulas: [
          { id: "esc-1", numero: 1, titulo: "Da clínica solo ao grupo médico", duracao: "38 min", nivel: "Avançado",
            conteudo: "Os modelos de expansão: franquia, sociedade, licença de marca. Como sair da operação sem perder qualidade. O papel do sócio operacional. Estrutura jurídica para grupos médicos. Cases de grupos que saíram do zero." },
          { id: "esc-2", numero: 2, titulo: "Como abrir a segunda unidade", duracao: "42 min", nivel: "Avançado",
            conteudo: "Quando você está realmente pronto (não é sobre dinheiro). Due diligence de localização. Modelo financeiro para a segunda unidade. Transferência de cultura e processos. Os erros mais comuns na expansão." },
          { id: "esc-3", numero: 3, titulo: "Telemedicina como canal de escala", duracao: "29 min", nivel: "Avançado",
            conteudo: "Regulamentação atual da telemedicina no Brasil. Como montar uma operação de teleconsulta eficiente. Precificação da teleconsulta vs. presencial. Como usar telemedicina para atender cidades sem presença física.", linkModulo: { label: "Copiloto de Consulta", href: "/copiloto" } },
          { id: "esc-4", numero: 4, titulo: "Construindo ativos além da consulta", duracao: "33 min", nivel: "Avançado",
            conteudo: "Produtos digitais para médicos: cursos, e-books, mentorias. Como precificar conteúdo educativo. A diferença entre produto de entrada e produto premium. Como seu Instagram alimenta suas vendas digitais. Receita passiva na medicina." },
        ],
      },
      {
        id: "esc-m2", nome: "Módulo 2 — Visão de Longo Prazo",
        aulas: [
          { id: "esc-5", numero: 5, titulo: "Precificação premium: como cobrar o que vale", duracao: "31 min", nivel: "Avançado",
            conteudo: "A psicologia do preço premium. Como criar percepção de valor que justifica preços altos. O que clientes de alto padrão realmente buscam. Como fazer a transição para preços maiores sem perder todos os pacientes." },
          { id: "esc-6", numero: 6, titulo: "Construindo patrimônio através da medicina", duracao: "37 min", nivel: "Avançado",
            conteudo: "Por que médicos são maus investidores (e como mudar). Alocação de renda de médico: a fórmula dos 40-30-30. Investimentos que fazem sentido para médicos. Previdência privada vs. outros instrumentos. Independência financeira." },
          { id: "esc-7", numero: 7, titulo: "Saída estratégica: quando e como vender", duracao: "44 min", nivel: "Avançado",
            conteudo: "Quando uma clínica tem valor de mercado. Como calcular o valuation da sua clínica. O processo de M&A na medicina. Como preparar a clínica para uma venda. O que acontece com seus pacientes. Due diligence do comprador." },
          { id: "esc-8", numero: 8, titulo: "Legado médico: construindo algo maior", duracao: "26 min", nivel: "Avançado",
            conteudo: "Além do dinheiro: qual impacto você quer deixar. Como construir um grupo médico com propósito. Mentoria e formação de médicos juniores. O papel do médico empreendedor na saúde brasileira." },
        ],
      },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NIVEL_STYLE: Record<string, string> = {
  "Iniciante":     "bg-green-50 border-green-200 text-green-700",
  "Intermediário": "bg-blue-50  border-blue-200  text-blue-700",
  "Avançado":      "bg-purple-50 border-purple-200 text-purple-700",
}

function totalAulas(t: Trilha)  { return t.modulos.reduce((s, m) => s + m.aulas.length, 0) }
function concluidasT(t: Trilha, p: ProgressoMap) {
  return t.modulos.reduce((s, m) => s + m.aulas.filter(a => p[a.id] === "concluida").length, 0)
}
function todasAulasList() {
  return TRILHAS.flatMap(t => t.modulos.flatMap(m => m.aulas.map(a => ({ aula: a, trilha: t }))))
}

// ─── Sistema de níveis ────────────────────────────────────────────────────────

const NIVEIS = [
  { label: "Bronze",  min: 0,  max: 25,  cor: "#cd7f32", textCls: "text-amber-600",  bgCls: "bg-amber-900/20",   borderCls: "border-amber-700/40" },
  { label: "Prata",   min: 26, max: 50,  cor: "#94a3b8", textCls: "text-slate-400",  bgCls: "bg-slate-400/15",   borderCls: "border-slate-400/35" },
  { label: "Ouro",    min: 51, max: 75,  cor: "#f59e0b", textCls: "text-yellow-400", bgCls: "bg-yellow-400/15",  borderCls: "border-yellow-400/35" },
  { label: "Diamond", min: 76, max: 100, cor: "#a78bfa", textCls: "text-violet-400", bgCls: "bg-violet-400/15",  borderCls: "border-violet-400/35" },
]

function getNivel(pct: number) {
  return NIVEIS.find(n => pct <= n.max) ?? NIVEIS[NIVEIS.length - 1]
}

function NivelBadge({ done, total }: { done: number; total: number }) {
  const pct   = total > 0 ? Math.round(done / total * 100) : 0
  const nivel = getNivel(pct)
  const next  = NIVEIS.find(n => n.min > pct)
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border", nivel.bgCls, nivel.borderCls)}>
      <Trophy className={cn("w-5 h-5 flex-shrink-0", nivel.textCls)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={cn("text-[13px] font-bold", nivel.textCls)}>{nivel.label}</span>
          <span className="text-[10px] font-mono text-text-muted">{pct}% concluído</span>
          {next && (
            <span className="text-[10px] font-mono text-text-muted ml-auto">
              próximo: {next.label} ({next.min}%)
            </span>
          )}
        </div>
        <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: nivel.cor }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Modal de aula ────────────────────────────────────────────────────────────

function AulaModal({ aula, trilha, status, onClose, onConcluir, saving }: {
  aula: Aula; trilha: Trilha; status: string
  onClose: () => void; onConcluir: () => void; saving: boolean
}) {
  const concluida = status === "concluida"
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>

        <div className="flex items-start justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
              Aula {aula.numero} · {aula.duracao}
            </p>
            <h2 className="text-[15px] font-bold leading-snug" style={{ color: "var(--text-primary)" }}>{aula.titulo}</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors mt-0.5 flex-shrink-0"
            style={{ color: "var(--text-muted)" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Thumbnail placeholder */}
          <div className="w-full aspect-video rounded-xl flex flex-col items-center justify-center"
            style={{ background: trilha.bg, border: `1px solid ${trilha.border}` }}>
            <Play className="w-10 h-10 mb-2" style={{ color: trilha.color }} />
            <p className="text-[11px] font-mono tracking-widest" style={{ color: trilha.color }}>CONTEÚDO EM BREVE</p>
          </div>

          {/* Nível */}
          <span className={cn("text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border", NIVEL_STYLE[aula.nivel])}>
            {aula.nivel}
          </span>

          {/* Conteúdo */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>O que você vai aprender</p>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{aula.conteudo}</p>
          </div>

          {/* Link módulo relacionado */}
          {aula.linkModulo && (
            <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
              style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)" }}>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest mb-0.5" style={{ color: "var(--accent)" }}>Material relacionado</p>
                <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>Praticar no {aula.linkModulo.label}</p>
              </div>
              <a href={aula.linkModulo.href}
                className="flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-3 py-1.5 flex-shrink-0 transition-all"
                style={{ border: "1px solid var(--accent-border)", color: "var(--accent)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-dim)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                Abrir <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Botão concluir */}
          <button onClick={onConcluir} disabled={saving || concluida}
            className={cn("w-full py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all", concluida && "cursor-default")}
            style={concluida
              ? { background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }
              : { background: "var(--accent)", color: "var(--background)" }
            }>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" />
              : concluida ? <><CheckCircle className="w-4 h-4" /> Aula concluída</>
              : <><Check className="w-4 h-4" /> Marcar como concluída</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ABA TRILHAS ─────────────────────────────────────────────────────────────

function AbaTrilhas({ progresso, onMarcarConcluida }: { progresso: ProgressoMap; onMarcarConcluida: (a: Aula, t: Trilha) => Promise<void> }) {
  const [expanded,    setExpanded]    = useState<Record<string, boolean>>({})
  const [modExpanded, setModExpanded] = useState<Record<string, boolean>>({})
  const [aulaModal,   setAulaModal]   = useState<{ aula: Aula; trilha: Trilha } | null>(null)
  const [saving,      setSaving]      = useState(false)

  async function handleConcluir() {
    if (!aulaModal) return
    setSaving(true)
    await onMarcarConcluida(aulaModal.aula, aulaModal.trilha)
    setSaving(false)
    setAulaModal(null)
  }

  return (
    <>
      <div className="space-y-4">
        {TRILHAS.map(trilha => {
          const total  = totalAulas(trilha)
          const done   = concluidasT(trilha, progresso)
          const pct    = total > 0 ? Math.round((done / total) * 100) : 0
          const isOpen = expanded[trilha.id]
          const Icon   = trilha.icon

          return (
            <div key={trilha.id} className="rounded-2xl overflow-hidden transition-all"
              style={{ background: isOpen ? trilha.bg : "var(--card)", border: `1px solid ${isOpen ? trilha.border : "var(--border)"}` }}>

              <button onClick={() => setExpanded(e => ({ ...e, [trilha.id]: !isOpen }))}
                className="w-full flex items-center gap-4 px-5 py-4 text-left">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: trilha.bg, border: `1px solid ${trilha.border}` }}>
                  <Icon className="w-5 h-5" style={{ color: trilha.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>{trilha.titulo}</h3>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border"
                      style={{ background: trilha.bg, borderColor: trilha.border, color: trilha.color }}>{trilha.nivel}</span>
                  </div>
                  <p className="text-[12px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{trilha.descricao}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 h-1.5 rounded-full max-w-[140px]" style={{ background: "var(--border)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: trilha.color }} />
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{done}/{total} aulas</span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform" style={{ color: "var(--text-muted)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 space-y-3" style={{ borderTop: `1px solid ${trilha.border}`, paddingTop: 16 }}>
                  {trilha.modulos.map(mod => {
                    const modOpen = modExpanded[mod.id] !== false
                    return (
                      <div key={mod.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                        <button onClick={() => setModExpanded(e => ({ ...e, [mod.id]: !modOpen }))}
                          className="w-full flex items-center gap-2 px-4 py-3 text-left">
                          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 transition-transform" style={{ color: "var(--text-muted)", transform: modOpen ? "rotate(90deg)" : "rotate(0deg)" }} />
                          <span className="text-[12px] font-semibold flex-1" style={{ color: "var(--text-primary)" }}>{mod.nome}</span>
                          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{mod.aulas.length} aulas</span>
                        </button>

                        {modOpen && (
                          <div style={{ borderTop: "1px solid var(--border)" }}>
                            {mod.aulas.map(aula => {
                              const st = progresso[aula.id] ?? "nao_iniciada"
                              return (
                                <div key={aula.id}
                                  className="flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer group"
                                  style={{ borderBottom: "1px solid var(--border)" }}
                                  onClick={() => setAulaModal({ aula, trilha })}
                                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                  {st === "concluida"
                                    ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    : <Circle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-medium truncate"
                                      style={{ color: st === "concluida" ? "var(--text-muted)" : "var(--text-primary)", textDecoration: st === "concluida" ? "line-through" : "none" }}>
                                      {aula.numero}. {aula.titulo}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <Clock className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{aula.duracao}</span>
                                    </div>
                                  </div>
                                  <span className={cn("text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border flex-shrink-0 hidden sm:block", NIVEL_STYLE[aula.nivel])}>
                                    {aula.nivel.slice(0, 3).toUpperCase()}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {aulaModal && (
        <AulaModal
          aula={aulaModal.aula} trilha={aulaModal.trilha}
          status={progresso[aulaModal.aula.id] ?? "nao_iniciada"}
          onClose={() => setAulaModal(null)} onConcluir={handleConcluir} saving={saving}
        />
      )}
    </>
  )
}

// ─── ABA AULAS ────────────────────────────────────────────────────────────────

function AbaAulas({ progresso, onMarcarConcluida }: { progresso: ProgressoMap; onMarcarConcluida: (a: Aula, t: Trilha) => Promise<void> }) {
  const [busca,     setBusca]     = useState("")
  const [filtroT,   setFiltroT]   = useState("todas")
  const [filtroN,   setFiltroN]   = useState("todos")
  const [aulaModal, setAulaModal] = useState<{ aula: Aula; trilha: Trilha } | null>(null)
  const [saving,    setSaving]    = useState(false)

  const lista = todasAulasList().filter(({ aula, trilha }) => {
    const q = busca.toLowerCase()
    if (q && !aula.titulo.toLowerCase().includes(q) && !trilha.titulo.toLowerCase().includes(q)) return false
    if (filtroT !== "todas" && trilha.id !== filtroT) return false
    if (filtroN !== "todos" && aula.nivel !== filtroN) return false
    return true
  })

  async function handleConcluir() {
    if (!aulaModal) return
    setSaving(true)
    await onMarcarConcluida(aulaModal.aula, aulaModal.trilha)
    setSaving(false)
    setAulaModal(null)
  }

  return (
    <>
      <div className="space-y-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar aula..."
            className="w-full rounded-xl pl-9 pr-4 py-2 text-[13px] outline-none transition-colors"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
        </div>
        <div className="flex flex-wrap gap-2">
          {[{ label: "Todas", val: "todas" }, ...TRILHAS.map(t => ({ label: t.titulo, val: t.id }))].map(o => (
            <button key={o.val} onClick={() => setFiltroT(o.val)}
              className="text-[11px] px-3 py-1.5 rounded-full border transition-all"
              style={filtroT === o.val
                ? { background: "var(--accent-dim)", borderColor: "var(--accent-border)", color: "var(--accent)", fontWeight: 600 }
                : { borderColor: "var(--border)", color: "var(--text-muted)" }}>
              {o.label}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            {["todos", "Iniciante", "Intermediário", "Avançado"].map(n => (
              <button key={n} onClick={() => setFiltroN(n)}
                className="text-[11px] px-3 py-1.5 rounded-full border transition-all"
                style={filtroN === n
                  ? { background: "var(--surface-2)", borderColor: "var(--border-hover)", color: "var(--text-primary)", fontWeight: 600 }
                  : { borderColor: "var(--border)", color: "var(--text-muted)" }}>
                {n === "todos" ? "Todos" : n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {lista.length === 0 && (
          <div className="text-center py-12 rounded-xl" style={{ border: "1px solid var(--border)" }}>
            <Search className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Nenhuma aula encontrada</p>
          </div>
        )}
        {lista.map(({ aula, trilha }) => {
          const Icon = trilha.icon
          const st   = progresso[aula.id] ?? "nao_iniciada"
          return (
            <div key={aula.id}
              className="rounded-xl px-4 py-3 flex items-center gap-3 transition-colors cursor-pointer group"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              onClick={() => setAulaModal({ aula, trilha })}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-hover)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              {st === "concluida"
                ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                : <Circle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />}
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: trilha.bg, border: `1px solid ${trilha.border}` }}>
                <Icon className="w-3.5 h-3.5" style={{ color: trilha.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate"
                  style={{ color: st === "concluida" ? "var(--text-muted)" : "var(--text-primary)", textDecoration: st === "concluida" ? "line-through" : "none" }}>
                  {aula.titulo}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{trilha.titulo} · {aula.duracao}</p>
              </div>
              <span className={cn("text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border flex-shrink-0 hidden sm:block", NIVEL_STYLE[aula.nivel])}>
                {aula.nivel}
              </span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: "var(--text-muted)" }} />
            </div>
          )
        })}
      </div>

      {aulaModal && (
        <AulaModal
          aula={aulaModal.aula} trilha={aulaModal.trilha}
          status={progresso[aulaModal.aula.id] ?? "nao_iniciada"}
          onClose={() => setAulaModal(null)} onConcluir={handleConcluir} saving={saving}
        />
      )}
    </>
  )
}

// ─── ABA COMUNIDADE ──────────────────────────────────────────────────────────

function AbaComunidade() {
  const [form, setForm] = useState({ nome: "", email: "", especialidade: "" })
  const [step, setStep] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [total] = useState(84)

  const valid = form.nome.trim() && form.email.includes("@")
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!valid) return
    setStep("sending")
    try {
      const res = await fetch("/api/academy/interesse", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      setStep(res.ok ? "done" : "error")
    } catch { setStep("error") }
  }

  const FEATURES = [
    { icon: Star,      label: "Ranking mensal de crescimento",  desc: "Compare seu crescimento com outros médicos da sua especialidade." },
    { icon: Award,     label: "Desafios mensais com premiação", desc: "Participe de desafios e ganhe reconhecimento da comunidade." },
    { icon: BarChart2, label: "Benchmarking por especialidade", desc: "Dados anônimos para saber como você se compara ao mercado." },
    { icon: Users,     label: "Grupos por especialidade",       desc: "Conecte-se com médicos da mesma área para trocar experiências." },
    { icon: GraduationCap, label: "Mentoria ao vivo",          desc: "Sessões mensais de Q&A ao vivo com especialistas PRAXIS." },
  ]

  const inputSt: React.CSSProperties = {
    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#fff", outline: "none", width: "100%",
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg,#0D1B2A 0%,#1a3a5c 100%)" }}>
        <div className="px-6 py-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full"
            style={{ background: "rgba(184,151,106,0.15)", border: "1px solid rgba(184,151,106,0.3)" }}>
            <Users className="w-3.5 h-3.5" style={{ color: "#b8976a" }} />
            <span className="text-[11px] font-mono tracking-widest" style={{ color: "#b8976a" }}>{total} MÉDICOS INTERESSADOS</span>
          </div>
          <h2 className="text-[22px] font-bold text-white mb-3"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Comunidade PRAXIS — Em breve
          </h2>
          <p className="text-[14px] mb-6 max-w-md mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            Uma comunidade exclusiva de médicos que pensam como empresários. Deixe seu interesse e seja avisado no lançamento.
          </p>

          {step === "done" ? (
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl"
              style={{ background: "rgba(0,192,127,0.12)", border: "1px solid rgba(0,192,127,0.30)" }}>
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-[13px] font-semibold text-green-300">Você está na lista! Te avisaremos no lançamento.</span>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Seu nome" style={inputSt} />
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Seu e-mail" style={inputSt} />
              <button type="submit" disabled={!valid || step === "sending"}
                className="px-5 py-2.5 rounded-lg font-bold text-[13px] transition-all disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
                style={{ background: "#b8976a", color: "#0D1B2A" }}>
                {step === "sending" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Quero participar"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Features */}
      <div>
        <h3 className="text-[12px] font-mono uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>O que vem aí</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <div key={i} className="rounded-xl p-4 flex items-start gap-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)" }}>
                  <Icon className="w-4 h-4" style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>{f.label}</p>
                  <p className="text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── ABA PROGRESSO ────────────────────────────────────────────────────────────

function AbaProgresso({ progresso }: { progresso: ProgressoMap }) {
  const totalGeral  = TRILHAS.reduce((s, t) => s + totalAulas(t), 0)
  const doneGeral   = Object.values(progresso).filter(s => s === "concluida").length
  const pctGeral    = totalGeral > 0 ? Math.round((doneGeral / totalGeral) * 100) : 0

  const proxima = (() => {
    for (const t of TRILHAS) {
      for (const m of t.modulos) {
        for (const a of m.aulas) {
          if ((progresso[a.id] ?? "nao_iniciada") !== "concluida") return { aula: a, trilha: t }
        }
      }
    }
    return null
  })()

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Conclusão geral", value: `${pctGeral}%`, sub: "do conteúdo concluído", color: "var(--accent)" },
          { label: "Aulas concluídas", value: `${doneGeral}`, sub: `de ${totalGeral} aulas`,  color: "#10b981" },
          { label: "Trilhas disponíveis", value: `${TRILHAS.length}`, sub: "para explorar", color: "#3b82f6" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-5 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="text-[32px] font-bold mb-1" style={{ color: s.color, fontFamily: "var(--font-playfair), Georgia, serif" }}>{s.value}</div>
            <div className="text-[12px] font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>{s.label}</div>
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Próxima aula */}
      {proxima && (
        <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--accent-border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Próxima aula recomendada</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: proxima.trilha.bg, border: `1px solid ${proxima.trilha.border}` }}>
              <proxima.trilha.icon className="w-5 h-5" style={{ color: proxima.trilha.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{proxima.aula.titulo}</p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{proxima.trilha.titulo} · {proxima.aula.duracao}</p>
            </div>
            <span className={cn("text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border flex-shrink-0", NIVEL_STYLE[proxima.aula.nivel])}>
              {proxima.aula.nivel}
            </span>
          </div>
        </div>
      )}

      {/* Por trilha */}
      <div>
        <h3 className="text-[12px] font-mono uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Progresso por trilha</h3>
        <div className="space-y-3">
          {TRILHAS.map(t => {
            const tot  = totalAulas(t)
            const done = concluidasT(t, progresso)
            const pct  = tot > 0 ? Math.round((done / tot) * 100) : 0
            const Icon = t.icon
            return (
              <div key={t.id} className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: t.bg, border: `1px solid ${t.border}` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: t.color }} />
                  </div>
                  <span className="text-[13px] font-semibold flex-1" style={{ color: "var(--text-primary)" }}>{t.titulo}</span>
                  <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>{done}/{tot}</span>
                  <span className="text-[12px] font-bold" style={{ color: t.color }}>{pct}%</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: t.color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Certificados */}
      <div className="rounded-2xl p-6 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <Award className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
        <h3 className="text-[14px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Certificados</h3>
        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Em breve — disponível ao concluir cada trilha completa.</p>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AcademyPage() {
  const [tab,         setTab]         = useState<Tab>("trilhas")
  const [progresso,   setProgresso]   = useState<ProgressoMap>({})
  const [loadingProg, setLoadingProg] = useState(true)
  const [celebrando,  setCelebrando]  = useState(false)

  const fetchProgresso = useCallback(async () => {
    try {
      const res  = await fetch("/api/academy/progresso")
      if (!res.ok) return
      const data = await res.json() as Array<{ aula_id: string; status: string }>
      const map: ProgressoMap = {}
      data.forEach(r => { map[r.aula_id] = r.status as ProgressoMap[string] })
      setProgresso(map)
    } finally { setLoadingProg(false) }
  }, [])

  useEffect(() => { fetchProgresso() }, [fetchProgresso])

  async function marcarConcluida(aula: Aula, trilha: Trilha) {
    if (progresso[aula.id] === "concluida") return
    try {
      await fetch("/api/academy/progresso", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aula_id: aula.id, trilha_id: trilha.id, status: "concluida" }),
      })
      setProgresso(p => ({ ...p, [aula.id]: "concluida" }))
      setCelebrando(true)
      setTimeout(() => setCelebrando(false), 1800)
    } catch (e) { console.error("[academy] erro ao marcar aula como concluída:", e) }
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "trilhas",    label: "Trilhas",       icon: BookOpen    },
    { id: "aulas",      label: "Aulas",         icon: Play        },
    { id: "comunidade", label: "Comunidade",    icon: Users       },
    { id: "progresso",  label: "Meu Progresso", icon: BarChart2   },
  ]

  const totalGeral  = TRILHAS.reduce((s, t) => s + totalAulas(t), 0)
  const doneGeral   = Object.values(progresso).filter(s => s === "concluida").length

  return (
    <div className="animate-fade-in">
      <MobileOnlyHeader title="PRAXIS Academy" />

      {/* Celebração */}
      {celebrando && (
        <div className="fixed inset-0 z-[60] pointer-events-none flex items-end justify-center pb-24">
          <div className="flex items-center gap-2.5 bg-emerald-500/90 text-white text-[13px] font-semibold px-5 py-3 rounded-full shadow-2xl animate-fade-in">
            <CheckCircle className="w-4 h-4" /> Aula concluída!
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-5 h-5" style={{ color: "var(--accent)" }} />
              <h1 className="text-[22px] font-bold" style={{ color: "var(--text-primary)" }}>PRAXIS Academy</h1>
            </div>
            <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              APRENDA A CONSTRUIR UMA CLÍNICA DE SUCESSO
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[20px] font-bold" style={{ color: "var(--accent)" }}>
              {doneGeral}<span className="text-[13px] font-normal" style={{ color: "var(--text-muted)" }}>/{totalGeral}</span>
            </div>
            <div className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>AULAS CONCLUÍDAS</div>
          </div>
        </div>

        {/* Nível badge */}
        {!loadingProg && (
          <div className="mb-4">
            <NivelBadge done={doneGeral} total={totalGeral} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-3 text-[12px] font-medium transition-all border-b-2"
                style={tab === t.id
                  ? { borderColor: "var(--accent)", color: "var(--accent)" }
                  : { borderColor: "transparent", color: "var(--text-muted)" }}>
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-4 md:p-8">
        {loadingProg ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
          </div>
        ) : (
          <>
            {tab === "trilhas"    && <AbaTrilhas    progresso={progresso} onMarcarConcluida={marcarConcluida} />}
            {tab === "aulas"      && <AbaAulas      progresso={progresso} onMarcarConcluida={marcarConcluida} />}
            {tab === "comunidade" && <AbaComunidade />}
            {tab === "progresso"  && <AbaProgresso  progresso={progresso} />}
          </>
        )}
      </div>
    </div>
  )
}

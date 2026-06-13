"use client"

import { useState } from "react"
import { ClipboardList, Sparkles, Copy, Check, X, Clock, Users, Wrench, AlertTriangle, BarChart2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface SopPasso {
  numero:      number
  titulo:      string
  descricao:   string
  responsavel: string
  tempo:       string
  observacao:  string
}

interface SopResult {
  titulo:                  string
  objetivo:                string
  responsavel_principal:   string
  frequencia:              string
  tempo_estimado:          string
  materiais_necessarios:   string[]
  passos:                  SopPasso[]
  pontos_atencao:          string[]
  indicadores:             string[]
  revisao:                 string
}

interface SopBiblioteca {
  id:         string
  titulo:     string
  categoria:  string
  desc:       string
  passos:     string[]
}

// ─── Static Library ──────────────────────────────────────────────────────────

const BIBLIOTECA_SOPS: SopBiblioteca[] = [
  {
    id: "s1", categoria: "Recepção", titulo: "Abertura do Consultório",
    desc: "Roteiro completo para abertura diária do consultório antes do primeiro paciente.",
    passos: [
      "Chegar 30 min antes do primeiro paciente",
      "Ligar equipamentos e sistemas (computador, prontuário eletrônico, impressora)",
      "Verificar agenda do dia e confirmar os próximos 3 atendimentos",
      "Organizar sala de espera — verificar limpeza, temperatura e materiais informativos",
      "Checar estoque de materiais básicos (luvas, álcool, fichas)",
      "Verificar caixa de entrada (e-mails, WhatsApp, mensagens urgentes)",
      "Briefar o médico sobre a agenda do dia antes do primeiro paciente",
    ],
  },
  {
    id: "s2", categoria: "Recepção", titulo: "Check-in de Paciente",
    desc: "Processo padronizado de recepção desde a chegada até o encaminhamento para a sala.",
    passos: [
      "Receber o paciente com saudação pelo nome ao chegar",
      "Confirmar dados cadastrais e atualizar se necessário",
      "Verificar documentos (identidade, cartão de convênio ou comprovante de pagamento)",
      "Preencher ou confirmar LGPD / termo de uso de dados (primeira consulta)",
      "Informar tempo estimado de espera com transparência",
      "Oferecer local de espera confortável, água e/ou café",
      "Notificar o médico da chegada do paciente via sistema ou pessoalmente",
      "Encaminhar o paciente à sala quando chamado",
    ],
  },
  {
    id: "s3", categoria: "Clínico", titulo: "Consulta de Primeira Vez",
    desc: "Protocolo estruturado para maximizar a qualidade e eficiência das consultas iniciais.",
    passos: [
      "Receber o paciente com apresentação pessoal e criar rapport nos primeiros 2 min",
      "Colher anamnese completa usando escuta ativa — deixar o paciente falar sem interromper",
      "Revisar histórico médico, medicamentos em uso, alergias e antecedentes familiares",
      "Realizar exame físico direcionado à queixa principal",
      "Estabelecer hipótese diagnóstica e comunicar ao paciente de forma clara e acessível",
      "Solicitar exames complementares se necessário, explicando o objetivo de cada um",
      "Discutir plano terapêutico e obter concordância do paciente",
      "Registrar tudo no prontuário eletrônico antes de encerrar a consulta",
      "Entregar prescrição, solicitações e instruções por escrito",
      "Agendar retorno e orientar sobre pontos de alerta",
    ],
  },
  {
    id: "s4", categoria: "Clínico", titulo: "Gestão de Resultado de Exames",
    desc: "Fluxo de recebimento, análise e comunicação de resultados de exames ao paciente.",
    passos: [
      "Receber resultado de exame via sistema ou entregue pelo paciente",
      "Associar o resultado ao prontuário correto imediatamente",
      "Médico analisa o resultado em até 48h úteis",
      "Classificar urgência: Normal / Atenção / Urgente",
      "Urgente: contato telefônico imediato com o paciente",
      "Atenção: agendar retorno em até 7 dias via WhatsApp",
      "Normal: notificar o paciente por mensagem e disponibilizar resultado no sistema",
      "Registrar a comunicação no prontuário com data e hora",
    ],
  },
  {
    id: "s5", categoria: "Financeiro", titulo: "Fechamento de Caixa Diário",
    desc: "Procedimento de conferência e fechamento financeiro ao final de cada dia.",
    passos: [
      "Compilar lista de atendimentos do dia pelo sistema",
      "Verificar pagamentos recebidos (dinheiro, cartão, PIX, convênio)",
      "Conferir se cada atendimento teve pagamento registrado",
      "Identificar pendências ou inadimplências do dia",
      "Registrar receitas no sistema de gestão financeira",
      "Separar sangria de caixa e preparar depósito bancário se aplicável",
      "Preencher relatório diário de faturamento",
      "Enviar resumo financeiro do dia para o responsável/gestor",
    ],
  },
  {
    id: "s6", categoria: "Marketing", titulo: "Produção de Conteúdo Semanal",
    desc: "Roteiro semanal para manter presença digital consistente nas redes sociais.",
    passos: [
      "Segunda-feira: revisar calendário editorial da semana no PRAXIS",
      "Definir tema central da semana alinhado ao público-alvo",
      "Gravar ou produzir 1 Reel/vídeo curto (entre 15-60s)",
      "Criar 1 carrossel educativo com 5-8 slides",
      "Preparar 3 stories de bastidores ou dicas rápidas",
      "Revisar todos os textos antes de publicar (ortografia e clareza)",
      "Publicar conteúdos nos melhores horários do perfil",
      "Responder comentários e DMs em até 4h úteis",
      "Sexta-feira: analisar métricas da semana e ajustar plano seguinte",
    ],
  },
  {
    id: "s7", categoria: "Pós-atendimento", titulo: "Follow-up de Paciente",
    desc: "Processo de acompanhamento ativo após consulta para aumentar adesão e satisfação.",
    passos: [
      "24h após consulta: enviar mensagem de WhatsApp verificando se está bem",
      "7 dias: confirmar se iniciou o tratamento prescrito e tirar dúvidas",
      "30 dias: verificar evolução e reforçar próximo retorno",
      "Registrar respostas no CRM do paciente",
      "Paciente sem resposta: tentar segundo contato em até 48h",
      "Paciente com piora ou dúvida urgente: acionar médico imediatamente",
      "Após retorno: registrar no prontuário a evolução relatada pelo paciente",
    ],
  },
  {
    id: "s8", categoria: "Qualidade", titulo: "Pesquisa de Satisfação NPS",
    desc: "Coleta e análise sistemática do Net Promoter Score dos pacientes.",
    passos: [
      "Configurar envio automático de pesquisa 24h após cada consulta",
      "Mensagem curta com nota de 0-10 e campo de comentário livre",
      "Compilar respostas semanalmente no módulo NPS do PRAXIS",
      "Classificar: Promotores (9-10), Neutros (7-8), Detratores (0-6)",
      "Responder individualmente a todos os detratores em até 48h",
      "Agradecer pessoalmente aos promotores e pedir indicação",
      "Calcular NPS mensal e registrar no painel executivo",
      "Reunião mensal com a equipe para discutir feedback e melhorias",
    ],
  },
]

const EQUIPE_OPTS     = ["Médico(a)", "Recepcionista", "Enfermeiro(a)", "Secretário(a)", "Gestor(a)", "Estagiário(a)"]
const DETALHE_OPTS    = ["Resumido", "Padrão", "Detalhado"]
const FERRAMENTA_OPTS = ["Prontuário eletrônico", "WhatsApp", "Google Agenda", "Sistema de agendamento", "Excel/Planilha", "E-mail", "PRAXIS"]

const CATEGORIA_CORES: Record<string, string> = {
  Recepção:       "text-amber-400",
  Clínico:        "text-accent",
  Financeiro:     "text-purple-400",
  Marketing:      "text-pink-400",
  "Pós-atendimento": "text-blue-400",
  Qualidade:      "text-emerald-400",
}

// ─── SOP Modal ───────────────────────────────────────────────────────────────

function SopModal({ sop, onClose }: { sop: SopBiblioteca; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const texto = `${sop.titulo}\n\n${sop.desc}\n\n${sop.passos.map((p, i) => `${i + 1}. ${p}`).join("\n")}`

  function copy() {
    navigator.clipboard.writeText(texto)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[--card] border border-[--border] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between p-5 border-b border-[--border]">
          <div>
            <span className={cn("text-[10px] font-mono uppercase tracking-widest", CATEGORIA_CORES[sop.categoria] ?? "text-text-muted")}>
              {sop.categoria}
            </span>
            <h3 className="text-base font-semibold text-text-primary mt-0.5">{sop.titulo}</h3>
            <p className="text-xs text-text-muted mt-1">{sop.desc}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary ml-4 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <ol className="space-y-3">
            {sop.passos.map((p, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-mono font-bold text-accent flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-text-secondary leading-relaxed">{p}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[--border]">
          <button
            onClick={copy}
            className="flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-lg border border-[--border] text-text-muted hover:text-accent hover:border-accent/30 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copiado!" : "Copiar SOP"}
          </button>
          <button onClick={onClose} className="text-xs font-mono px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/15 transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Generated SOP View ──────────────────────────────────────────────────────

function SopGeradoView({ sop, onNovo }: { sop: SopResult; onNovo: () => void }) {
  const [copied, setCopied] = useState(false)

  const textoCompleto = [
    `SOP: ${sop.titulo}`,
    `Objetivo: ${sop.objetivo}`,
    `Responsável: ${sop.responsavel_principal}`,
    `Frequência: ${sop.frequencia}`,
    `Tempo estimado: ${sop.tempo_estimado}`,
    "",
    "PASSOS:",
    ...sop.passos.map(p => `${p.numero}. ${p.titulo}\n   ${p.descricao}${p.observacao ? `\n   ⚠ ${p.observacao}` : ""}`),
    "",
    "PONTOS DE ATENÇÃO:",
    ...sop.pontos_atencao.map(p => `• ${p}`),
  ].join("\n")

  function copy() {
    navigator.clipboard.writeText(textoCompleto)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-text-primary">{sop.titulo}</h2>
            <p className="text-sm text-text-secondary mt-1">{sop.objetivo}</p>
          </div>
          <button
            onClick={onNovo}
            className="text-xs font-mono border border-[--border] px-3 py-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:border-accent/30 transition-colors sm:flex-shrink-0 self-start"
          >
            Novo SOP
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { icon: Users,  label: "Responsável",       value: sop.responsavel_principal },
            { icon: Clock,  label: "Frequência",         value: sop.frequencia },
            { icon: Clock,  label: "Tempo estimado",     value: sop.tempo_estimado },
            { icon: BarChart2, label: "Revisão",         value: sop.revisao },
          ].map(k => (
            <div key={k.label} className="bg-[--surface] rounded-lg border border-[--border] p-3">
              <p className="text-[10px] font-mono text-text-muted uppercase">{k.label}</p>
              <p className="text-xs text-text-secondary mt-1">{k.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Passos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">Passos do Procedimento</h3>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-[--border] text-text-muted hover:text-accent hover:border-accent/30 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copiado!" : "Copiar tudo"}
          </button>
        </div>
        <div className="space-y-2">
          {sop.passos.map(p => (
            <div key={p.numero} className="rounded-xl border border-[--border] bg-[--surface] p-4">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-mono font-bold text-accent flex-shrink-0">
                  {p.numero}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-text-primary">{p.titulo}</p>
                    <div className="flex gap-2 flex-shrink-0">
                      {p.responsavel && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-[--border] text-text-muted">
                          {p.responsavel}
                        </span>
                      )}
                      {p.tempo && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-[--border] text-text-muted">
                          {p.tempo}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">{p.descricao}</p>
                  {p.observacao && (
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      {p.observacao}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Materiais */}
      {sop.materiais_necessarios.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">Materiais Necessários</h3>
          <div className="flex flex-wrap gap-2">
            {sop.materiais_necessarios.map((m, i) => (
              <span key={i} className="text-xs px-3 py-1 rounded-full border border-[--border] text-text-secondary bg-[--surface]">{m}</span>
            ))}
          </div>
        </div>
      )}

      {/* Pontos de Atenção */}
      {sop.pontos_atencao.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
          <h3 className="text-xs font-mono text-amber-400 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Pontos de Atenção
          </h3>
          <ul className="space-y-1">
            {sop.pontos_atencao.map((p, i) => (
              <li key={i} className="text-sm text-text-secondary flex gap-2">
                <span className="text-amber-400 flex-shrink-0">•</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Indicadores */}
      {sop.indicadores.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5" /> Indicadores de Qualidade
          </h3>
          <ul className="space-y-1">
            {sop.indicadores.map((ind, i) => (
              <li key={i} className="text-sm text-text-secondary flex gap-2">
                <span className="text-emerald-400 flex-shrink-0">✓</span>
                {ind}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SopsPage() {
  const [tab, setTab]               = useState<"biblioteca" | "gerar">("biblioteca")
  const [sopModal, setSopModal]     = useState<SopBiblioteca | null>(null)

  // Generator state
  const [processo,      setProcesso]      = useState("")
  const [equipe,        setEquipe]        = useState<string[]>(["Médico(a)"])
  const [nivelDetalhe,  setNivelDetalhe]  = useState("Padrão")
  const [ferramentas,   setFerramentas]   = useState<string[]>([])
  const [loading,       setLoading]       = useState(false)
  const [result,        setResult]        = useState<SopResult | null>(null)
  const [error,         setError]         = useState("")

  function toggleEquipe(e: string) {
    setEquipe(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])
  }
  function toggleFerramenta(f: string) {
    setFerramentas(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  async function gerarSop() {
    if (!processo.trim()) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/sops/gerar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processo, equipe, nivel_detalhe: nivelDetalhe, ferramentas }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error ?? "Erro ao gerar SOP"); return }
      setResult(data as SopResult)
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const categorias = Array.from(new Set(BIBLIOTECA_SOPS.map(s => s.categoria)))

  return (
    <div className="animate-fade-in">
      {sopModal && <SopModal sop={sopModal} onClose={() => setSopModal(null)} />}

      <div className="p-4 md:p-8 pb-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Gerador de SOPs</h1>
            <p className="text-sm text-text-muted font-mono">CONSULTÓRIO · PROCESSOS OPERACIONAIS</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[--surface] border border-[--border] rounded-xl p-1 w-fit">
          {(["biblioteca", "gerar"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wide transition-all",
                tab === t
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {t === "biblioteca" ? "📂 Biblioteca" : "✨ Gerar SOP"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Biblioteca ── */}
      {tab === "biblioteca" && (
        <div className="p-4 md:p-8 space-y-8">
          {categorias.map(cat => (
            <div key={cat} className="space-y-3">
              <div className="flex items-center gap-2 pb-1">
                <h3 className={cn("text-xs font-mono uppercase tracking-widest font-semibold", CATEGORIA_CORES[cat] ?? "text-text-muted")}>{cat}</h3>
                <div className="flex-1 h-px bg-[--border]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BIBLIOTECA_SOPS.filter(s => s.categoria === cat).map(sop => (
                  <button
                    key={sop.id}
                    onClick={() => setSopModal(sop)}
                    className="text-left rounded-xl border border-[--border] bg-[--surface] p-4 hover:border-[--border-hover] transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">{sop.titulo}</p>
                      <span className="text-[10px] font-mono text-text-muted border border-[--border] px-2 py-0.5 rounded-full flex-shrink-0">
                        {sop.passos.length} passos
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{sop.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Gerar SOP ── */}
      {tab === "gerar" && (
        <div className="p-4 md:p-8 space-y-6 max-w-2xl">
          {result ? (
            <SopGeradoView sop={result} onNovo={() => { setResult(null); setProcesso("") }} />
          ) : (
            <>
              {/* Processo */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-text-muted uppercase tracking-wide">Processo a documentar *</label>
                <textarea
                  value={processo}
                  onChange={e => setProcesso(e.target.value)}
                  placeholder="Descreva o processo que você quer padronizar. Ex: triagem de novos pacientes via WhatsApp, agendamento de cirurgias, orientação nutricional pós-consulta..."
                  rows={3}
                  className="w-full bg-[--surface] border border-[--border] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-text-muted resize-none"
                />
              </div>

              {/* Equipe */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-text-muted uppercase tracking-wide">Equipe envolvida</label>
                <div className="flex flex-wrap gap-2">
                  {EQUIPE_OPTS.map(e => (
                    <button
                      key={e}
                      onClick={() => toggleEquipe(e)}
                      className={cn(
                        "text-[11px] font-mono px-3 py-1.5 rounded-full border transition-all flex items-center gap-1",
                        equipe.includes(e)
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold"
                          : "border-[--border] text-text-muted hover:text-text-secondary"
                      )}
                    >
                      {equipe.includes(e) && <Check className="w-2.5 h-2.5" />}
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nível de detalhe */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-text-muted uppercase tracking-wide">Nível de detalhe</label>
                <div className="flex gap-2">
                  {DETALHE_OPTS.map(d => (
                    <button
                      key={d}
                      onClick={() => setNivelDetalhe(d)}
                      className={cn(
                        "flex-1 text-xs font-mono py-2 rounded-xl border transition-all",
                        nivelDetalhe === d
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold"
                          : "border-[--border] text-text-muted hover:text-text-secondary"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ferramentas */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-text-muted uppercase tracking-wide flex items-center gap-1.5">
                  <Wrench className="w-3 h-3" /> Ferramentas / Sistemas utilizados
                </label>
                <div className="flex flex-wrap gap-2">
                  {FERRAMENTA_OPTS.map(f => (
                    <button
                      key={f}
                      onClick={() => toggleFerramenta(f)}
                      className={cn(
                        "text-[11px] font-mono px-3 py-1.5 rounded-full border transition-all flex items-center gap-1",
                        ferramentas.includes(f)
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold"
                          : "border-[--border] text-text-muted hover:text-text-secondary"
                      )}
                    >
                      {ferramentas.includes(f) && <Check className="w-2.5 h-2.5" />}
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
              )}

              {/* CTA */}
              <button
                onClick={gerarSop}
                disabled={loading || !processo.trim()}
                className={cn(
                  "w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                  !loading && processo.trim()
                    ? "bg-emerald-500 text-white hover:bg-emerald-400"
                    : "bg-[--surface] border border-[--border] text-text-muted cursor-not-allowed"
                )}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando SOP...</>
                  : <><Sparkles className="w-4 h-4" /> Gerar SOP com IA</>}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

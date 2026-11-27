"use client"

import { useState } from "react"
import { Sparkles, Copy, Check } from "lucide-react"
import { Panel, PxButton, Tag, Segmented, PxCheckbox, PxModal, PageHeader } from "@/components/px"

// ─── Tipos ───────────────────────────────────────────────────────────────────

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

// ─── Biblioteca estática ──────────────────────────────────────────────────────

const BIBLIOTECA_SOPS: SopBiblioteca[] = [
  {
    id: "s1", categoria: "Recepção", titulo: "Abertura do Consultório",
    desc: "Roteiro completo para abertura diária do consultório antes do primeiro paciente.",
    passos: [
      "Chegar 30 min antes do primeiro paciente",
      "Ligar equipamentos e sistemas (computador, prontuário eletrônico, impressora)",
      "Verificar agenda do dia e confirmar os próximos 3 atendimentos",
      "Organizar sala de espera: verificar limpeza, temperatura e materiais informativos",
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
      "Colher anamnese completa usando escuta ativa: deixar o paciente falar sem interromper",
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

const areaCls = "w-full resize-none rounded-px-ctl border border-px-line bg-white/70 px-3.5 py-2.5 text-[14px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"

function Rotulo({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[13px] font-semibold text-px-ink">{children}</h3>
}

// ─── Modal de SOP da biblioteca ──────────────────────────────────────────────

function SopModal({ sop, onClose }: { sop: SopBiblioteca; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const texto = `${sop.titulo}\n\n${sop.desc}\n\n${sop.passos.map((p, i) => `${i + 1}. ${p}`).join("\n")}`

  function copy() {
    navigator.clipboard.writeText(texto)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <PxModal open onClose={onClose} title={sop.titulo} className="max-w-lg">
      <div className="space-y-4">
        <div>
          <Tag tone="neutral">{sop.categoria}</Tag>
          <p className="mt-2 text-[13px] text-px-muted">{sop.desc}</p>
        </div>
        <ol className="max-h-[50vh] space-y-3 overflow-y-auto">
          {sop.passos.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-5 flex-shrink-0 text-[13px] font-semibold tabular-nums text-px-accent">{i + 1}</span>
              <span className="text-[14px] leading-relaxed text-px-ink">{p}</span>
            </li>
          ))}
        </ol>
        <div className="flex justify-end gap-2 border-t border-px-line pt-3">
          <PxButton variant="secondary" leftIcon={copied ? Check : Copy} onClick={copy}>{copied ? "Copiado" : "Copiar SOP"}</PxButton>
          <PxButton onClick={onClose}>Fechar</PxButton>
        </div>
      </div>
    </PxModal>
  )
}

// ─── SOP gerado ──────────────────────────────────────────────────────────────

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
    ...sop.passos.map(p => `${p.numero}. ${p.titulo}\n   ${p.descricao}${p.observacao ? `\n   Atenção: ${p.observacao}` : ""}`),
    "",
    "PONTOS DE ATENÇÃO:",
    ...sop.pontos_atencao.map(p => `- ${p}`),
  ].join("\n")

  function copy() {
    navigator.clipboard.writeText(textoCompleto)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resumo = [
    { label: "Responsável",    value: sop.responsavel_principal },
    { label: "Frequência",     value: sop.frequencia },
    { label: "Tempo estimado", value: sop.tempo_estimado },
    { label: "Revisão",        value: sop.revisao },
  ]

  return (
    <div className="space-y-4">
      <Panel tone="dark">
        <div className="flex flex-col justify-between gap-3 text-white sm:flex-row sm:items-start">
          <div>
            <h2 className="text-[20px] font-semibold">{sop.titulo}</h2>
            <p className="mt-1 text-[14px] text-white/85">{sop.objetivo}</p>
          </div>
          <PxButton variant="inverse" onClick={onNovo}>Novo SOP</PxButton>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-white sm:grid-cols-4">
          {resumo.map(k => (
            <div key={k.label}>
              <dt className="text-[12px] text-white/80">{k.label}</dt>
              <dd className="mt-0.5 text-[13px]">{k.value}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <section className="space-y-3" aria-labelledby="sop-passos">
        <div className="flex items-center justify-between">
          <h2 id="sop-passos" className="text-[15px] font-semibold text-px-ink">Passos do procedimento</h2>
          <PxButton size="sm" variant="secondary" leftIcon={copied ? Check : Copy} onClick={copy}>{copied ? "Copiado" : "Copiar tudo"}</PxButton>
        </div>
        <ol className="space-y-3">
          {sop.passos.map(p => (
            <li key={p.numero}>
              <Panel tone="light" className="flex gap-3">
                <span className="w-6 flex-shrink-0 text-[15px] font-semibold tabular-nums text-px-accent">{p.numero}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-[14px] font-semibold text-px-ink">{p.titulo}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.responsavel && <Tag tone="neutral">{p.responsavel}</Tag>}
                      {p.tempo && <Tag tone="neutral">{p.tempo}</Tag>}
                    </div>
                  </div>
                  <p className="mt-1 text-[14px] leading-relaxed text-px-ink">{p.descricao}</p>
                  {p.observacao && (
                    <p className="mt-2 rounded-px-card bg-px-warn-soft px-3 py-2 text-[13px] text-px-warn">
                      <span className="font-semibold">Atenção: </span>{p.observacao}
                    </p>
                  )}
                </div>
              </Panel>
            </li>
          ))}
        </ol>
      </section>

      {sop.materiais_necessarios.length > 0 && (
        <section className="space-y-2" aria-labelledby="sop-mat">
          <h2 id="sop-mat" className="text-[15px] font-semibold text-px-ink">Materiais necessários</h2>
          <ul className="flex flex-wrap gap-2">
            {sop.materiais_necessarios.map((m, i) => <li key={i}><Tag tone="neutral">{m}</Tag></li>)}
          </ul>
        </section>
      )}

      {sop.pontos_atencao.length > 0 && (
        <Panel tone="light" className="space-y-2">
          <h2 className="text-[15px] font-semibold text-px-ink">Pontos de atenção</h2>
          <ul className="list-disc space-y-1 pl-5">
            {sop.pontos_atencao.map((p, i) => <li key={i} className="text-[14px] text-px-ink">{p}</li>)}
          </ul>
        </Panel>
      )}

      {sop.indicadores.length > 0 && (
        <Panel tone="light" className="space-y-2">
          <h2 className="text-[15px] font-semibold text-px-ink">Indicadores de qualidade</h2>
          <ul className="list-disc space-y-1 pl-5">
            {sop.indicadores.map((ind, i) => <li key={i} className="text-[14px] text-px-ink">{ind}</li>)}
          </ul>
        </Panel>
      )}
    </div>
  )
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function SopsPage() {
  const [tab, setTab]           = useState<"biblioteca" | "gerar">("biblioteca")
  const [sopModal, setSopModal] = useState<SopBiblioteca | null>(null)

  const [processo,      setProcesso]      = useState("")
  const [equipe,        setEquipe]        = useState<string[]>(["Médico(a)"])
  const [nivelDetalhe,  setNivelDetalhe]  = useState("Padrão")
  const [ferramentas,   setFerramentas]   = useState<string[]>([])
  const [loading,       setLoading]       = useState(false)
  const [result,        setResult]        = useState<SopResult | null>(null)
  const [error,         setError]         = useState("")

  const toggle = (set: React.Dispatch<React.SetStateAction<string[]>>, v: string) =>
    set(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])

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
    } catch (e) {
      console.error("[sops] erro ao gerar SOP:", e)
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const categorias = Array.from(new Set(BIBLIOTECA_SOPS.map(s => s.categoria)))

  return (
    <div className="animate-fade-in">
      <PageHeader title="SOPs" caption="Procedimentos operacionais padrão da clínica" />
      {sopModal && <SopModal sop={sopModal} onClose={() => setSopModal(null)} />}

      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Segmented
          label="Seção"
          value={tab}
          onChange={setTab}
          options={[{ value: "biblioteca", label: "Biblioteca" }, { value: "gerar", label: "Gerar com IA" }]}
        />

        {tab === "biblioteca" && (
          <div className="space-y-6">
            {categorias.map(cat => (
              <section key={cat} aria-labelledby={`sop-cat-${cat}`} className="space-y-3">
                <h2 id={`sop-cat-${cat}`} className="text-[15px] font-semibold text-px-ink">{cat}</h2>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {BIBLIOTECA_SOPS.filter(s => s.categoria === cat).map(sop => (
                    <li key={sop.id}>
                      <button type="button" onClick={() => setSopModal(sop)} className="block h-full w-full text-left">
                        <Panel tone="light" className="h-full">
                          <span className="flex items-start justify-between gap-2">
                            <span className="text-[14px] font-semibold text-px-ink">{sop.titulo}</span>
                            <Tag tone="neutral">{sop.passos.length} passos</Tag>
                          </span>
                          <span className="mt-1.5 block text-[13px] leading-relaxed text-px-muted">{sop.desc}</span>
                        </Panel>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {tab === "gerar" && (
          result ? (
            <SopGeradoView sop={result} onNovo={() => { setResult(null); setProcesso("") }} />
          ) : (
            <Panel tone="light" className="max-w-2xl space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="sop-proc" className="text-[13px] font-medium text-px-ink">Processo a documentar (obrigatório)</label>
                <textarea
                  id="sop-proc"
                  value={processo}
                  onChange={e => setProcesso(e.target.value)}
                  rows={3}
                  placeholder="Descreva o processo que você quer padronizar. Ex: triagem de novos pacientes via WhatsApp, agendamento de cirurgias, orientação nutricional pós-consulta"
                  className={areaCls}
                />
              </div>

              <fieldset className="space-y-2">
                <legend className="mb-1 text-[13px] font-medium text-px-ink">Equipe envolvida</legend>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                  {EQUIPE_OPTS.map(e => (
                    <PxCheckbox key={e} label={e} checked={equipe.includes(e)} onChange={() => toggle(setEquipe, e)} />
                  ))}
                </div>
              </fieldset>

              <div className="space-y-2">
                <p className="text-[13px] font-medium text-px-ink">Nível de detalhe</p>
                <Segmented label="Nível de detalhe" value={nivelDetalhe} onChange={setNivelDetalhe} options={DETALHE_OPTS.map(d => ({ value: d, label: d }))} />
              </div>

              <fieldset className="space-y-2">
                <legend className="mb-1 text-[13px] font-medium text-px-ink">Ferramentas e sistemas utilizados</legend>
                <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  {FERRAMENTA_OPTS.map(f => (
                    <PxCheckbox key={f} label={f} checked={ferramentas.includes(f)} onChange={() => toggle(setFerramentas, f)} />
                  ))}
                </div>
              </fieldset>

              {error && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{error}</p>}

              <PxButton fullWidth leftIcon={Sparkles} loading={loading} disabled={loading || !processo.trim()} onClick={gerarSop}>
                {loading ? "Gerando SOP" : "Gerar SOP com IA"}
              </PxButton>
            </Panel>
          )
        )}
      </div>
    </div>
  )
}

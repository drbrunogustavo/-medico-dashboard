"use client"

import { useState } from "react"
import { FileText, Sparkles, Copy, Check, ChevronDown, ChevronUp, Loader2, MessageSquare, Phone, Clipboard, Smartphone, Users, ShieldQuestion, Heart, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileOnlyHeader } from "@/components/MobileOnlyHeader"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Script {
  id:        string
  titulo:    string
  categoria: string
  situacao:  string
  conteudo:  string
}

// ─── Static Library ──────────────────────────────────────────────────────────

const CATEGORIAS = [
  { id: "consulta",    label: "Consulta",    icon: MessageSquare, color: "text-accent" },
  { id: "retorno",     label: "Retorno",     icon: Phone,         color: "text-blue-400" },
  { id: "protocolo",   label: "Protocolo",   icon: Clipboard,     color: "text-purple-400" },
  { id: "whatsapp",    label: "WhatsApp",    icon: Smartphone,    color: "text-emerald-400" },
  { id: "recepcao",    label: "Recepção",    icon: Users,         color: "text-amber-400" },
  { id: "objecoes",    label: "Objeções",    icon: ShieldQuestion,color: "text-red-400" },
  { id: "indicacao",   label: "Indicação",   icon: Heart,         color: "text-pink-400" },
]

const BIBLIOTECA: Script[] = [
  // Consulta
  {
    id: "c1", categoria: "consulta", titulo: "Abertura de consulta empática",
    situacao: "Primeiros minutos da consulta",
    conteudo: `Olá, [nome do paciente], seja muito bem-vindo(a)! Meu nome é Dr(a). [seu nome], sou [especialidade].

Antes de começarmos, quero que saiba que este é um espaço seguro — pode me contar tudo com tranquilidade. Vou fazer algumas perguntas para entender melhor o que você está sentindo, ok?

Me conta: o que te trouxe aqui hoje? O que está te incomodando mais?

[Ouvir atentamente, sem interromper]

Entendo. Isso que você está descrevendo é muito importante. Vamos investigar isso com cuidado.`,
  },
  {
    id: "c2", categoria: "consulta", titulo: "Explicação de diagnóstico",
    situacao: "Comunicar diagnóstico ao paciente",
    conteudo: `[Nome do paciente], com base no que você me contou e nos exames que fizemos, posso te dizer o que encontramos.

Você tem [diagnóstico]. Eu sei que o nome pode assustar, mas vou te explicar de forma simples o que isso significa.

Em resumo: [explicação simples em 2-3 frases sem jargão médico].

A boa notícia é que [aspecto positivo do caso]. O tratamento que vou propor para você é [resumo do tratamento].

Você tem alguma dúvida sobre o que acabei de explicar? Pode perguntar à vontade — não existe pergunta boba.`,
  },

  // Retorno
  {
    id: "r1", categoria: "retorno", titulo: "Retorno de exame positivo",
    situacao: "Paciente retorna com exame com resultado relevante",
    conteudo: `[Nome do paciente], obrigado(a) por trazer os exames. Vou analisá-los aqui com você.

Olhando o resultado, vejo que [achado do exame]. Isso nos confirma / nos indica que [interpretação clínica simples].

Com base nisso, vou [ajuste de conduta: iniciar tratamento / encaminhar / repetir exame].

A partir de agora, o próximo passo é [ação concreta]. Vou te dar um resumo por escrito antes de você sair.

Ficou alguma dúvida sobre o resultado?`,
  },
  {
    id: "r2", categoria: "retorno", titulo: "Retorno de acompanhamento",
    situacao: "Consulta de rotina ou follow-up de tratamento",
    conteudo: `Olá, [nome]! Que bom te ver por aqui. Como você está se sentindo desde nossa última consulta?

[Ouvir relato do paciente]

Ótimo. Vou verificar [sinais vitais / exames / parâmetros relevantes].

Comparando com a última vez: [evolução clínica]. Isso mostra que [interpretação — está funcionando / precisamos ajustar].

Por isso, vou [manter / ajustar] o tratamento. O que acha? Tem alguma queixa específica hoje?`,
  },

  // Protocolo
  {
    id: "p1", categoria: "protocolo", titulo: "Apresentação de protocolo de tratamento",
    situacao: "Explicar plano terapêutico estruturado",
    conteudo: `[Nome], agora que temos o diagnóstico, quero te apresentar o protocolo de tratamento que elaborei especificamente para você.

São [número] etapas:

1. [Etapa 1] — durante [período]
2. [Etapa 2] — a partir de [data/marco]
3. [Etapa 3] — [descrição]

Em cada etapa, você vai [o que o paciente deve fazer/esperar].

O sucesso desse tratamento depende muito da sua adesão. Tenho visto resultados excelentes em pacientes que seguem esse protocolo com disciplina.

Vou te dar tudo por escrito. Dúvidas?`,
  },
  {
    id: "p2", categoria: "protocolo", titulo: "Orientações pós-procedimento",
    situacao: "Instruções após procedimento ambulatorial",
    conteudo: `[Nome], o procedimento correu muito bem. Agora vou te orientar sobre os cuidados importantes nas próximas horas e dias.

Nas primeiras 24h: [cuidados imediatos — repouso, alimentação, medicações].

Nos próximos 7 dias: [cuidados gerais].

Sinais de alerta — entre em contato comigo imediatamente se você sentir: [sintomas de alerta].

Vou te encaminhar nossas instruções por WhatsApp também. Meu contato de urgência é [número]. Retorno em [data/período].`,
  },

  // WhatsApp
  {
    id: "w1", categoria: "whatsapp", titulo: "Confirmação de consulta",
    situacao: "Lembrete de agendamento 24h antes",
    conteudo: `Olá, [nome]! 👋

Sou da clínica do Dr(a). [seu nome]. Passando para confirmar sua consulta:

📅 Data: [data]
🕐 Horário: [hora]
📍 Local: [endereço]

Por favor, chegue 10 minutos antes com seus documentos e cartão de convênio (se aplicável).

Confirma presença? Responda SIM para confirmar ou NOS AVISE com antecedência caso precise remarcar.

Qualquer dúvida, estou à disposição! 😊`,
  },
  {
    id: "w2", categoria: "whatsapp", titulo: "Resultado de exame disponível",
    situacao: "Notificar paciente que exame ficou pronto",
    conteudo: `Olá, [nome]! Tudo bem?

Seus exames já estão disponíveis. 🗂️

Gostaria de agendar um retorno para conversarmos sobre os resultados? Tenho horários disponíveis:

• [opção 1]
• [opção 2]
• [opção 3]

Qual fica melhor para você?

Att,
Dr(a). [nome]
[especialidade]`,
  },

  // Recepção
  {
    id: "re1", categoria: "recepcao", titulo: "Recepção de primeiro contato",
    situacao: "Paciente entra em contato pela primeira vez",
    conteudo: `Clínica do Dr(a). [nome], bom dia / boa tarde / boa noite! Aqui é [nome da recepcionista], como posso ajudá-lo(a)?

[Ouvir a necessidade]

Entendido! O Dr(a). [nome] atende [especialidade] e poderemos te ajudar com isso, sim.

Temos horários disponíveis em [opções]. Qual fica melhor para você?

Para confirmar o agendamento, vou precisar do seu nome completo, data de nascimento e número de telefone.

[Anotar dados]

Perfeito! Agendamento confirmado para [data e hora]. Aguardamos você! Qualquer dúvida, pode nos contatar.`,
  },
  {
    id: "re2", categoria: "recepcao", titulo: "Resposta a reclamação ou espera",
    situacao: "Paciente impaciente com tempo de espera",
    conteudo: `[Nome], peço sinceras desculpas pelo tempo de espera. Entendo que seu tempo é muito valioso.

O Dr(a). [nome] está finalizando um atendimento que precisou de um pouco mais de atenção — nossa prioridade é sempre dar o cuidado completo que cada paciente merece, incluindo você.

Estima-se que em [X minutos] o Dr(a). poderá te atender.

Posso oferecer [água / café]? E se precisar de algo, estou aqui à disposição.

Mais uma vez, pedimos desculpas pelo inconveniente.`,
  },

  // Objeções
  {
    id: "ob1", categoria: "objecoes", titulo: "Objeção de preço",
    situacao: "Paciente questiona valor da consulta",
    conteudo: `Entendo sua preocupação com o investimento — é uma pergunta legítima.

O valor da minha consulta reflete [diferenciais: tempo dedicado / protocolo personalizado / experiência / tecnologia utilizada].

Em [X minutos] de consulta, você vai receber [o que o paciente ganha]: diagnóstico preciso, plano de tratamento personalizado e acompanhamento.

Muitos dos meus pacientes me dizem que o que investiram aqui economizaram em consultas sem resultado e tratamentos desnecessários.

Dito isso, o que posso oferecer é [parcelamento / forma de pagamento alternativa]. Como prefere?`,
  },
  {
    id: "ob2", categoria: "objecoes", titulo: "Paciente que quer pensar",
    situacao: "Paciente hesita antes de agendar ou iniciar tratamento",
    conteudo: `Claro, é natural querer refletir antes de tomar uma decisão importante sobre sua saúde.

Enquanto você pensa, deixa eu te dar algumas informações que podem ajudar:

[Informação 1 relevante sobre o tratamento/condição]
[Informação 2 sobre consequências de adiar]

Minha agenda costuma ficar bem cheia — para garantir o horário que funciona para você, pode fazer sentido reservar agora e cancelar sem custo até [prazo].

O que mais está pesando na sua decisão? Posso esclarecer qualquer dúvida.`,
  },

  // Indicação
  {
    id: "in1", categoria: "indicacao", titulo: "Pedido de indicação no pós-consulta",
    situacao: "Solicitar indicação ao paciente satisfeito",
    conteudo: `[Nome], fico muito feliz em saber que você está [resultado positivo].

Posso te pedir um favor? Quem te indicou para mim ou como você me encontrou?

[Ouvir resposta]

Se você conhece alguém que também está passando por [condição] ou que poderia se beneficiar dos mesmos resultados que você teve, ficaria honrado(a) se você me indicasse.

Pode passar meu contato direto: [telefone/WhatsApp]. Vou tratar seus conhecidos com o mesmo cuidado que tratei você.

Muito obrigado(a) pela confiança!`,
  },
  {
    id: "in2", categoria: "indicacao", titulo: "Mensagem de indicação por WhatsApp",
    situacao: "Script para paciente encaminhar a contatos",
    conteudo: `[Este script é para você enviar para quem quiser indicar o médico]

Oi [nome do contato]! Tudo bem?

Sei que você está com [problema/condição]. Quero te indicar o Dr(a). [nome], [especialidade].

Fui paciente dele(a) e [resultado que você teve]. A diferença foi enorme!

O consultório fica [localização] e o contato para agendamento é [telefone/link].

Vale muito a pena! Fala que foi eu quem indicou. 😊`,
  },
]

const TOM_OPTS = ["Empático", "Profissional", "Direto", "Motivador", "Tranquilizador", "Educativo"]

// ─── Copy Button ─────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-[--border] text-text-muted hover:text-accent hover:border-accent/30 transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copiado!" : "Copiar"}
    </button>
  )
}

// ─── Script Card ─────────────────────────────────────────────────────────────

function ScriptCard({ script }: { script: Script }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-[--border] overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div>
          <p className="text-sm font-semibold text-text-primary">{script.titulo}</p>
          <p className="text-[11px] text-text-muted mt-0.5">{script.situacao}</p>
        </div>
        <div className="flex items-center gap-2">
          {open && <CopyBtn text={script.conteudo} />}
          {open
            ? <ChevronUp className="w-4 h-4 text-text-muted flex-shrink-0" />
            : <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />}
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 border-t border-[--border] pt-4">
          <pre className="text-sm text-text-secondary font-sans whitespace-pre-wrap leading-relaxed">{script.conteudo}</pre>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ScriptsPage() {
  const [tab, setTab]             = useState<"biblioteca" | "gerar">("biblioteca")
  const [catFiltro, setCatFiltro] = useState("todos")

  // Generator state
  const [tipo,         setTipo]         = useState("")
  const [situacao,     setSituacao]     = useState("")
  const [tom,          setTom]          = useState("Empático")
  const [nomeMedico,   setNomeMedico]   = useState("")
  const [especialidade, setEspec]       = useState("")
  const [loading,      setLoading]      = useState(false)
  const [resultado,    setResultado]    = useState("")
  const [error,        setError]        = useState("")
  const [copied,       setCopied]       = useState(false)

  const scriptsFiltrados = catFiltro === "todos"
    ? BIBLIOTECA
    : BIBLIOTECA.filter(s => s.categoria === catFiltro)

  async function gerarScript() {
    if (!tipo.trim() || !situacao.trim()) return
    setLoading(true)
    setError("")
    setResultado("")
    try {
      const res = await fetch("/api/scripts/gerar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, situacao, tom, nome_medico: nomeMedico, especialidade }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error ?? "Erro ao gerar script"); return }
      setResultado(data.texto)
    } catch (e) {
      console.error("[scripts] erro ao gerar script:", e)
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  function copyResultado() {
    navigator.clipboard.writeText(resultado)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tiposScript = [
    "Abertura de consulta", "Explicação de diagnóstico", "Orientações de tratamento",
    "Follow-up por WhatsApp", "Confirmação de retorno", "Manejo de objeção",
    "Pedido de indicação", "Apresentação de protocolo", "Script de recepção",
    "Mensagem pós-procedimento",
  ]

  return (
    <div className="animate-fade-in">
      <MobileOnlyHeader title="Biblioteca de Scripts" />
      <div className="p-4 md:p-8 pb-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Biblioteca de Scripts</h1>
            <p className="text-sm text-text-muted font-mono">CONSULTÓRIO · COMUNICAÇÃO</p>
            <p className="text-[12px] text-text-secondary mt-1.5">Acesse roteiros prontos para recepção, captação e follow-up de pacientes.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[--surface] border border-[--border] rounded-xl p-1 w-fit">
          {(["biblioteca", "gerar"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wide transition-all inline-flex items-center gap-2",
                tab === t
                  ? "bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {t === "biblioteca" ? <><BookOpen className="w-3.5 h-3.5" /> Biblioteca</> : <><Sparkles className="w-3.5 h-3.5" /> Gerar Script</>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Biblioteca ── */}
      {tab === "biblioteca" && (
        <div className="p-4 md:p-8 space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCatFiltro("todos")}
              className={cn(
                "text-[11px] font-mono px-3 py-1.5 rounded-full border transition-all",
                catFiltro === "todos"
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-400 font-semibold"
                  : "border-[--border] text-text-muted hover:text-text-secondary"
              )}
            >
              Todos ({BIBLIOTECA.length})
            </button>
            {CATEGORIAS.map(c => {
              const count = BIBLIOTECA.filter(s => s.categoria === c.id).length
              return (
                <button
                  key={c.id}
                  onClick={() => setCatFiltro(c.id)}
                  className={cn(
                    "text-[11px] font-mono px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5",
                    catFiltro === c.id
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-400 font-semibold"
                      : "border-[--border] text-text-muted hover:text-text-secondary"
                  )}
                >
                  {c.label} ({count})
                </button>
              )
            })}
          </div>

          {/* Scripts Grid */}
          {CATEGORIAS.filter(c => catFiltro === "todos" || c.id === catFiltro).map(cat => {
            const scripts = BIBLIOTECA.filter(s => s.categoria === cat.id)
            if (scripts.length === 0) return null
            const Icon = cat.icon
            return (
              <div key={cat.id} className="space-y-3">
                <div className="flex items-center gap-2 pb-1">
                  <Icon className={cn("w-4 h-4", cat.color)} />
                  <h3 className={cn("text-xs font-mono uppercase tracking-widest font-semibold", cat.color)}>{cat.label}</h3>
                  <div className="flex-1 h-px bg-[--border]" />
                </div>
                <div className="space-y-2">
                  {scripts.map(s => <ScriptCard key={s.id} script={s} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Tab: Gerar Script ── */}
      {tab === "gerar" && (
        <div className="p-4 md:p-8 space-y-6 max-w-2xl">
          {/* Doctor Info */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono text-text-muted uppercase tracking-widest">Seu Perfil</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-text-muted uppercase tracking-wide">Seu nome</label>
                <input
                  value={nomeMedico}
                  onChange={e => setNomeMedico(e.target.value)}
                  placeholder="Dr. João Silva"
                  className="w-full bg-[--surface] border border-[--border] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-text-muted"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-text-muted uppercase tracking-wide">Especialidade</label>
                <input
                  value={especialidade}
                  onChange={e => setEspec(e.target.value)}
                  placeholder="Ex: Cardiologista"
                  className="w-full bg-[--surface] border border-[--border] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-text-muted"
                />
              </div>
            </div>
          </div>

          {/* Script Type */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono text-text-muted uppercase tracking-wide">Tipo de script *</label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className="w-full bg-[--surface] border border-[--border] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-blue-500/50 transition-colors"
            >
              <option value="">Selecione o tipo...</option>
              {tiposScript.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Situação */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-text-muted uppercase tracking-wide">Situação específica *</label>
            <textarea
              value={situacao}
              onChange={e => setSituacao(e.target.value)}
              placeholder="Descreva a situação: ex. paciente de primeira vez com ansiedade, quer entender o diagnóstico de hipertensão..."
              rows={3}
              className="w-full bg-[--surface] border border-[--border] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-text-muted resize-none"
            />
          </div>

          {/* Tom */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono text-text-muted uppercase tracking-wide">Tom de voz</label>
            <div className="flex flex-wrap gap-2">
              {TOM_OPTS.map(t => (
                <button
                  key={t}
                  onClick={() => setTom(t)}
                  className={cn(
                    "text-[11px] font-mono px-3 py-1.5 rounded-full border transition-all",
                    tom === t
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-400 font-semibold"
                      : "border-[--border] text-text-muted hover:text-text-secondary"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={gerarScript}
            disabled={loading || !tipo.trim() || !situacao.trim()}
            className={cn(
              "w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
              !loading && tipo.trim() && situacao.trim()
                ? "bg-blue-500 text-white hover:bg-blue-400"
                : "bg-[--surface] border border-[--border] text-text-muted cursor-not-allowed"
            )}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando script...</>
              : <><Sparkles className="w-4 h-4" /> Gerar Script com IA</>}
          </button>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Result */}
          {resultado && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-text-muted uppercase tracking-wide">Script gerado</span>
                <button
                  onClick={copyResultado}
                  className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-[--border] text-text-muted hover:text-blue-400 hover:border-blue-400/30 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-blue-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                <pre className="text-sm text-text-secondary font-sans whitespace-pre-wrap leading-relaxed">{resultado}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

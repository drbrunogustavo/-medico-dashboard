"use client"

import { useState, useRef } from "react"
import { TopBar } from "@/components/TopBar"
import { Toast } from "@/components/Toast"
import type { ToastType } from "@/components/Toast"
import {
  Megaphone, Video, Globe, Film, MessageSquare,
  Copy, BookmarkPlus, RotateCcw, Loader2, Sparkles,
  ChevronDown, ChevronRight, Check, Phone,
  Download, Maximize2, Code2, Eye, RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Roteiro {
  titulo:       string
  gancho:       string
  estrutura:    string
  cta:          string
  promptImagem: string
}

interface Beneficio  { titulo: string; descricao: string }
interface FaqItem    { pergunta: string; resposta: string }

interface LandingPage {
  headline:      string
  subtitulo:     string
  beneficios:    Beneficio[]
  provaSocial:   string
  ctaTexto:      string
  ctaUrgencia:   string
  faq:           FaqItem[]
  ctaSecundario: string
}

interface Anuncio {
  variacao: "Conservador" | "Equilibrado" | "Agressivo"
  headline: string
  texto:    string
  cta:      string
}

interface AnunciosFormatos {
  feed:    Anuncio[]
  stories: Anuncio[]
  reels:   Anuncio[]
}

interface StoryDia {
  dia:            number
  tipo:           string
  texto:          string
  sugestaoVisual: string
  sticker:        string
}

interface FollowUp { dia: number; mensagem: string }

interface WhatsApp {
  abertura:        string
  followUps:       FollowUp[]
  fechamento:      string
  respostaObjecao: string
}

interface Campanha {
  roteiros:    Roteiro[]
  landingPage: LandingPage
  anuncios:    AnunciosFormatos
  stories:     StoryDia[]
  whatsapp:    WhatsApp
}

type TabKey = "roteiros" | "landing" | "anuncios" | "stories" | "whatsapp"

// ─── Constants ────────────────────────────────────────────────────────────────

const SAZONAIS = [
  { emoji: "🌞", label: "Verão",           sub: "Emagrecimento e corpo",    tema: "Campanha de Verão: Emagrecimento e Definição Corporal",       publico: "Adultos que querem emagrecer antes do verão",                objetivo: "Atrair Pacientes", tom: "Urgente"    },
  { emoji: "🌸", label: "Dia da Mulher",   sub: "Saúde feminina",           tema: "Dia Internacional da Mulher: Saúde Feminina em Foco",         publico: "Mulheres 30-55 anos interessadas em saúde preventiva",       objetivo: "Awareness",        tom: "Empático"   },
  { emoji: "❄️",  label: "Inverno",         sub: "Imunidade e energia",      tema: "Campanha de Inverno: Imunidade e Energia",                    publico: "Adultos que sofrem com gripes e baixa energia no inverno",   objetivo: "Atrair Pacientes", tom: "Educativo"  },
  { emoji: "🍂", label: "Climatério",      sub: "Menopausa e hormônios",    tema: "Climatério e Menopausa: Viva Melhor Essa Fase",               publico: "Mulheres 45-60 anos em fase de menopausa",                  objetivo: "Atrair Pacientes", tom: "Empático"   },
  { emoji: "💪", label: "Ano Novo",        sub: "Mudança de hábitos",       tema: "Ano Novo, Saúde Nova: Mudança de Hábitos com Acompanhamento", publico: "Adultos 30-50 anos com metas de saúde para o ano",          objetivo: "Lançar Protocolo", tom: "Autoridade" },
  { emoji: "🎯", label: "Semana da Saúde", sub: "Prevenção",                tema: "Semana da Saúde: Prevenção É o Melhor Tratamento",            publico: "Adultos de todas as idades interessados em prevenção",       objetivo: "Educar",           tom: "Educativo"  },
  { emoji: "🏃", label: "Volta às Aulas",  sub: "Saúde infantil e familiar",tema: "Volta às Aulas: Cuide da Saúde da Família",                   publico: "Pais de crianças e adolescentes em idade escolar",           objetivo: "Atrair Pacientes", tom: "Empático"   },
  { emoji: "💊", label: "Janeiro Branco",  sub: "Saúde mental",             tema: "Janeiro Branco: Cuidar da Mente É Cuidar da Vida",            publico: "Adultos interessados em saúde mental e bem-estar emocional", objetivo: "Awareness",        tom: "Empático"   },
]

const OBJETIVOS = ["Atrair Pacientes", "Educar", "Vender Consulta", "Lançar Protocolo", "Awareness"]
const DURACOES  = ["7 dias", "15 dias", "30 dias"]
const TONS      = ["Autoridade", "Empático", "Urgente", "Educativo"]

const TABS: { key: TabKey; label: string; Icon: React.ElementType }[] = [
  { key: "roteiros", label: "Roteiros",    Icon: Video        },
  { key: "landing",  label: "Landing Page",Icon: Globe        },
  { key: "anuncios", label: "Anúncios",    Icon: Megaphone    },
  { key: "stories",  label: "Stories",     Icon: Film         },
  { key: "whatsapp", label: "WhatsApp",    Icon: MessageSquare},
]

const VARIACAO_STYLE: Record<string, string> = {
  "Conservador": "text-blue-700 bg-blue-50 border-blue-200",
  "Equilibrado": "text-accent bg-accent-dim border-accent-border",
  "Agressivo":   "text-red-700 bg-red-50 border-red-200",
}

const STORY_TYPE_STYLE: Record<string, string> = {
  "Educativo":  "text-blue-700 bg-blue-50 border-blue-200",
  "Depoimento": "text-purple-700 bg-purple-50 border-purple-200",
  "Bastidores": "text-amber-700 bg-amber-50 border-amber-200",
  "Oferta":     "text-accent bg-accent-dim border-accent-border",
  "FAQ":        "text-text-muted bg-surface-2 border-border",
}

// ─── Mock fallback ────────────────────────────────────────────────────────────

const MOCK_P1: Pick<Campanha, "roteiros" | "landingPage"> = {
  roteiros: [
    { titulo: "O Segredo que Mudou Minha Prática Clínica", gancho: "Em 10 anos de medicina, nunca vi resultado tão rápido quanto este...", estrutura: "[Médico olha para câmera] 'Vou te contar algo que mudou completamente minha abordagem com pacientes.'\n\n[Pausa dramática] 'A maioria dos médicos não fala sobre isso — mas os resultados são impressionantes.'\n\n[Mostrar dado ou resultado] 'Desde que implementei este protocolo, meus pacientes chegam com meses de espera.'\n\n[Tom direto] 'E a razão é simples: eu trato a causa, não o sintoma.'", cta: "Quer saber mais? Clica no link da bio e agenda sua avaliação.", promptImagem: "Professional Brazilian doctor in white coat, confident look at camera, modern medical office background, warm natural lighting, high contrast, Instagram Reels cover style, 9:16 ratio" },
    { titulo: "3 Erros que Impedem Seu Resultado", gancho: "A maioria das pessoas comete exatamente esses 3 erros — e o terceiro é o mais grave.", estrutura: "[Médico apontando para câmera] 'Se você não está conseguindo resultado, provavelmente está cometendo um desses erros.'\n\n[Erro 1] '...'\n[Erro 2] '...'\n[Erro 3] 'E este é o mais crítico de todos.'\n\n[Solução] 'A abordagem correta é baseada em evidência e personalizada para o seu caso.'\n\n[CTA] 'Me conta nos comentários qual desses você reconhece.'", cta: "Não perca mais tempo errando. Link na bio para agendamento.", promptImagem: "Brazilian doctor with concerned but helpful expression, pointing at camera, clean white medical background, educational content style, bold typography overlay, professional Instagram thumbnail" },
    { titulo: "A História de Transformação Real", gancho: "Ela chegou ao consultório sem esperança. Hoje é uma história diferente.", estrutura: "[Tom empático] 'Vou te contar sobre uma paciente que chegou aqui completamente frustrada.'\n\n[Situação inicial] 'Ela tinha tentado de tudo. Dieta, academia, tratamentos... Nada funcionava.'\n\n[Virada] 'O que descobrimos juntos mudou tudo. Era uma questão de...'\n\n[Resultado] 'Em poucos meses, a transformação foi completa.'\n\n[Mensagem] 'Sua história pode ser a próxima.'", cta: "Agende sua avaliação. Link na bio.", promptImagem: "Warm and inspiring Brazilian doctor smiling, transformation story style, bright hopeful atmosphere, before-after concept, motivational Instagram Reels cover, professional quality" },
  ],
  landingPage: {
    headline: "Transforme Sua Saúde com Acompanhamento Médico Especializado",
    subtitulo: "Um protocolo personalizado, baseado em evidências científicas, criado exclusivamente para o seu perfil e objetivos.",
    beneficios: [
      { titulo: "Resultado Comprovado",      descricao: "Protocolo baseado em evidências científicas com resultados mensuráveis desde as primeiras semanas de acompanhamento." },
      { titulo: "Totalmente Personalizado",  descricao: "Cada plano é desenvolvido exclusivamente para você, considerando seu histórico, exames e objetivos específicos." },
      { titulo: "Suporte Contínuo",          descricao: "Você não está sozinho. Acompanhamento próximo com ajustes constantes para garantir sua evolução." },
    ],
    provaSocial: '"Nunca imaginei alcançar resultados tão rápidos. O protocolo mudou minha relação com minha saúde. Em apenas 3 meses, me sinto uma pessoa completamente diferente." — Maria S., São Paulo',
    ctaTexto: "Quero Transformar Minha Saúde Agora",
    ctaUrgencia: "Vagas limitadas para esta campanha — garanta a sua hoje antes que esgotem.",
    faq: [
      { pergunta: "Quanto tempo até ver resultados?",          resposta: "A maioria dos pacientes percebe mudanças já nas primeiras 2 a 4 semanas, dependendo do protocolo e da adesão." },
      { pergunta: "O tratamento tem contraindicações?",        resposta: "Cada protocolo é avaliado individualmente. Na consulta inicial, analisamos seu histórico completo para garantir a abordagem mais segura." },
      { pergunta: "A consulta pode ser online?",               resposta: "Sim! Oferecemos atendimento presencial e por telemedicina, com a mesma qualidade e personalização." },
      { pergunta: "Qual é o investimento?",                    resposta: "O valor é apresentado após a avaliação do seu caso, com opções de pagamento facilitado adaptadas à sua realidade." },
      { pergunta: "E se eu não tiver o resultado esperado?",   resposta: "Monitoramos sua evolução de perto e ajustamos o protocolo conforme necessário. Nosso compromisso é com o seu resultado." },
    ],
    ctaSecundario: "Ainda tem dúvidas? Entre em contato pelo WhatsApp e tire todas as suas perguntas antes de decidir.",
  },
}

const MOCK_P2: Pick<Campanha, "anuncios" | "stories" | "whatsapp"> = {
  anuncios: {
    feed: [
      { variacao: "Conservador", headline: "Cuide da Sua Saúde Com Quem Entende",  texto: "Acompanhamento médico especializado pode transformar sua qualidade de vida. Protocolo personalizado para o seu caso.", cta: "Saiba Mais" },
      { variacao: "Equilibrado", headline: "Resultados Reais, Comprovados",        texto: "Pacientes com resultados incríveis em poucas semanas. Vagas limitadas — agende agora antes que esgotem.", cta: "Agendar Consulta" },
      { variacao: "Agressivo",   headline: "Pare de Sofrer. A Solução Está Aqui.", texto: "Chega de tentativas que não funcionam. Um protocolo médico especializado muda tudo. Últimas vagas disponíveis.", cta: "Garantir Minha Vaga" },
    ],
    stories: [
      { variacao: "Conservador", headline: "Sua saúde merece atenção especializada.",    texto: "Agende agora e comece sua transformação.", cta: "Ver Mais ↑" },
      { variacao: "Equilibrado", headline: "Resultado real é possível. Em semanas.",      texto: "Veja o que nossos pacientes alcançaram. Deslize.", cta: "Deslize para cima ↑" },
      { variacao: "Agressivo",   headline: "ÚLTIMAS VAGAS!",                               texto: "Não perca. Clique agora.", cta: "QUERO MEU RESULTADO ↑" },
    ],
    reels: [
      { variacao: "Conservador", headline: "Existe um tratamento eficaz para isso.",          texto: "Veja como funciona nosso protocolo médico especializado e como pode ajudar você.", cta: "Saiba mais no link da bio." },
      { variacao: "Equilibrado", headline: "Meus pacientes mudam em semanas.",                texto: "Não é milagre. É ciência com acompanhamento. Se você quer resultado real, posso te ajudar.", cta: "Agende no link da bio." },
      { variacao: "Agressivo",   headline: "Você ainda vai continuar assim?",                 texto: "Cada dia sem tratamento é perdido. Meus pacientes que agiram tiveram resultados incríveis. Seja o próximo.", cta: "Link na bio — vagas limitadas." },
    ],
  },
  stories: [
    { dia: 1, tipo: "Educativo",  texto: "Você sabia que [dado importante]?\nMuitas pessoas desconhecem isso.\nArrasta para ver mais 👉", sugestaoVisual: "Fundo colorido com texto grande e ícone do tema",  sticker: "Enquete: Você sabia disso? Sim / Não" },
    { dia: 2, tipo: "Depoimento", texto: '"Depois do tratamento, minha vida mudou."\n— Paciente real\nVeja nossa história completa no feed.', sugestaoVisual: "Layout de depoimento com aspas e fundo suave",   sticker: "Pergunta: Qual é seu maior desafio?" },
    { dia: 3, tipo: "Bastidores", texto: "Bastidores do consultório 👀\nComo preparamos cada protocolo\nde forma personalizada para você.", sugestaoVisual: "Foto ou vídeo do consultório e equipe em ação", sticker: "Reação: O que achou? 🔥❤️" },
    { dia: 4, tipo: "Oferta",     texto: "Campanha especial disponível!\nVagas limitadas para protocolo\npersonalizado. Garanta a sua. ⬇️", sugestaoVisual: "Layout de oferta com destaque e urgência visual", sticker: "Contagem regressiva até o fim da campanha" },
    { dia: 5, tipo: "FAQ",        texto: "Pergunta mais comum:\n'Quanto tempo para ver resultado?'\nResposta nos próximos slides 👉", sugestaoVisual: "Layout de pergunta e resposta limpo e profissional", sticker: "Caixa de perguntas: Me faça sua dúvida!" },
    { dia: 6, tipo: "Educativo",  texto: "3 sinais que seu corpo pede atenção:\n• Sinal 1\n• Sinal 2\n• Sinal 3 — e este é o mais grave", sugestaoVisual: "Lista visual com ícones, fundo escuro, texto claro", sticker: "Enquete: Quantos você tem? 0 / 1 / 2+" },
    { dia: 7, tipo: "Oferta",     texto: "ÚLTIMO DIA! ⚠️\nGaranta sua vaga na campanha\ne comece sua transformação hoje.", sugestaoVisual: "Layout de urgência máxima com CTA visual grande",  sticker: "Contagem regressiva: Últimas horas!" },
  ],
  whatsapp: {
    abertura: "Olá! 👋 Tudo bem? Aqui é o Dr. [Nome]. Estou passando para te contar sobre algo especial que estou oferecendo este mês para pacientes selecionados da minha lista... 🎯",
    followUps: [
      { dia: 1, mensagem: "Oi! Passando para saber se você teve chance de ver minha mensagem de ontem. Tenho vagas limitadas e quero garantir que pessoas comprometidas tenham acesso. Tem interesse em saber mais? 😊" },
      { dia: 3, mensagem: "Oi! Sei que você está ocupado(a). Só lembrando: ainda tenho algumas vagas disponíveis para a campanha especial. Muitos pacientes já iniciaram e os resultados estão sendo incríveis. Posso te contar mais detalhes?" },
      { dia: 7, mensagem: "Olá! 🔔 Última chance! As vagas encerram hoje à meia-noite e não haverá exceções. Não quero que você perca essa oportunidade. Me responde aqui e te conto tudo rapidinho! 🙏" },
    ],
    fechamento: "⚠️ ENCERRAMENTO: Hoje é o último dia. As vagas se esgotam à meia-noite. Se você quer começar sua transformação, este é o momento. Responda 'SIM' e te passo todos os detalhes agora. 🙏",
    respostaObjecao: "Entendo sua preocupação com o investimento! Mas pensa: quanto está custando continuar do jeito que está? O protocolo é personalizado, com acompanhamento próximo, e o resultado vale muito mais que o valor. Além disso, temos opções de parcelamento. Posso te mostrar as condições?",
  },
}

// ─── Helper — build clipboard text per tab ────────────────────────────────────

function buildTabText(tab: TabKey, c: Campanha): string {
  const sep = "\n" + "─".repeat(40) + "\n\n"
  switch (tab) {
    case "roteiros":
      return c.roteiros.map((r, i) =>
        `ROTEIRO ${i + 1}: ${r.titulo}\n\nGancho: ${r.gancho}\n\nEstrutura:\n${r.estrutura}\n\nCTA: ${r.cta}\n\nPrompt Imagem:\n${r.promptImagem}`
      ).join("\n\n" + sep)
    case "landing": {
      const lp = c.landingPage
      return [
        `HEADLINE: ${lp.headline}`,
        `SUBTÍTULO: ${lp.subtitulo}`,
        `BENEFÍCIOS:\n${lp.beneficios.map(b => `• ${b.titulo}: ${b.descricao}`).join("\n")}`,
        `PROVA SOCIAL:\n${lp.provaSocial}`,
        `CTA PRINCIPAL: ${lp.ctaTexto}\nURGÊNCIA: ${lp.ctaUrgencia}`,
        `FAQ:\n${lp.faq.map(f => `P: ${f.pergunta}\nR: ${f.resposta}`).join("\n\n")}`,
        `CTA SECUNDÁRIO: ${lp.ctaSecundario}`,
      ].join("\n\n" + sep)
    }
    case "anuncios":
      return [
        { label: "FEED",    items: c.anuncios.feed    },
        { label: "STORIES", items: c.anuncios.stories },
        { label: "REELS",   items: c.anuncios.reels   },
      ].map(fmt =>
        `ANÚNCIOS — ${fmt.label}:\n\n${fmt.items.map(a =>
          `[${a.variacao}]\nHeadline: ${a.headline}\nTexto: ${a.texto}\nCTA: ${a.cta}`
        ).join("\n\n")}`
      ).join("\n\n" + sep)
    case "stories":
      return c.stories.map(s =>
        `DIA ${s.dia} — ${s.tipo}\n${s.texto}\nVisual: ${s.sugestaoVisual}\nSticker: ${s.sticker}`
      ).join("\n\n")
    case "whatsapp": {
      const wa = c.whatsapp
      return [
        `ABERTURA:\n${wa.abertura}`,
        `FOLLOW-UPS:\n${wa.followUps.map(f => `Dia ${f.dia}: ${f.mensagem}`).join("\n\n")}`,
        `FECHAMENTO:\n${wa.fechamento}`,
        `RESPOSTA OBJEÇÃO:\n${wa.respostaObjecao}`,
      ].join("\n\n" + sep)
    }
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfertasPage() {
  const [stage,      setStage]      = useState<"briefing" | "resultado">("briefing")
  const [tema,       setTema]       = useState("")
  const [publico,    setPublico]    = useState("")
  const [objetivo,   setObjetivo]   = useState("Atrair Pacientes")
  const [duracao,    setDuracao]    = useState("15 dias")
  const [tom,        setTom]        = useState("Autoridade")
  const [campanha,   setCampanha]   = useState<Campanha | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [progresso,  setProgresso]  = useState("")
  const [activeTab,  setActiveTab]  = useState<TabKey>("roteiros")
  const [expanded,   setExpanded]   = useState<number[]>([0])
  const [toastMsg,   setToastMsg]   = useState<string | null>(null)
  const [toastType,  setToastType]  = useState<ToastType>("success")
  const [copiedKey,  setCopiedKey]  = useState<string | null>(null)

  // Landing page HTML
  const [landingHtml,    setLandingHtml]    = useState<string | null>(null)
  const [originalHtml,   setOriginalHtml]   = useState<string | null>(null)
  const [editedHtml,     setEditedHtml]     = useState("")
  const [loadingLanding, setLoadingLanding] = useState(false)
  const [showHtmlEditor, setShowHtmlEditor] = useState(false)
  const landingGenRef = useRef(0)

  // Pauta import modal
  const [showImport,     setShowImport]     = useState(false)
  const [pautasList,     setPautasList]     = useState<{ id: number | string; titulo: string }[]>([])
  const [loadingPautas,  setLoadingPautas]  = useState(false)

  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string, type: ToastType = "success") {
    if (toastRef.current) clearTimeout(toastRef.current)
    setToastMsg(msg)
    setToastType(type)
    toastRef.current = setTimeout(() => setToastMsg(null), 3500)
  }

  async function copiarTexto(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (e) {
      console.error("[ofertas] erro ao copiar texto:", e)
      showToast("Erro ao copiar", "error")
    }
  }

  function CopyBtn({ text, k }: { text: string; k: string }) {
    const done = copiedKey === k
    return (
      <button
        onClick={() => copiarTexto(text, k)}
        className={cn(
          "flex items-center gap-1 text-badge font-mono px-2 py-1 rounded border transition-all",
          done
            ? "text-accent border-accent-border bg-accent-dim"
            : "text-text-muted border-border hover:text-text-secondary hover:border-border-hover"
        )}
      >
        {done ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
        {done ? "Copiado" : "Copiar"}
      </button>
    )
  }

  async function openImport() {
    setShowImport(true)
    setLoadingPautas(true)
    try {
      const r = await fetch("/api/pautas")
      const data = await r.json()
      if (Array.isArray(data)) setPautasList(data)
    } catch (e) { console.error("[ofertas] erro ao carregar pautas:", e) }
    setLoadingPautas(false)
  }

  async function gerar() {
    if (!tema.trim() || !publico.trim()) {
      showToast("Preencha o tema e o público-alvo", "warning")
      return
    }
    setLoading(true)
    const payload = { tema, publico, objetivo, duracao, tom }
    try {
      setProgresso("Gerando roteiros e landing page...")
      const r1   = await fetch("/api/ofertas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, parte: 1 }) })
      const data1 = await r1.json()

      setProgresso("Gerando anúncios, stories e WhatsApp...")
      const r2   = await fetch("/api/ofertas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, parte: 2 }) })
      const data2 = await r2.json()

      const camp: Campanha = {
        roteiros:    data1.roteiros    ?? MOCK_P1.roteiros,
        landingPage: data1.landingPage ?? MOCK_P1.landingPage,
        anuncios:    data2.anuncios    ?? MOCK_P2.anuncios,
        stories:     data2.stories     ?? MOCK_P2.stories,
        whatsapp:    data2.whatsapp    ?? MOCK_P2.whatsapp,
      }
      setCampanha(camp)
      setStage("resultado")
      setActiveTab("roteiros")
      setExpanded([0])
      setShowHtmlEditor(false)
      landingGenRef.current += 1
      gerarLandingHtml(camp.landingPage, landingGenRef.current)
    } catch (e) {
      console.error("[ofertas] erro ao gerar campanha:", e)
      const mockCamp: Campanha = { ...MOCK_P1, ...MOCK_P2 }
      setCampanha(mockCamp)
      setStage("resultado")
      setActiveTab("roteiros")
      setExpanded([0])
      setShowHtmlEditor(false)
      landingGenRef.current += 1
      gerarLandingHtml(mockCamp.landingPage, landingGenRef.current)
      showToast("Erro na API — exibindo campanha de exemplo", "warning")
    } finally {
      setLoading(false)
      setProgresso("")
    }
  }

  async function salvarNoPautas() {
    if (!campanha) return
    let saved = 0
    for (const r of campanha.roteiros) {
      try {
        await fetch("/api/pautas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titulo: r.titulo, categoria: "Oferta" }) })
        saved++
      } catch (e) { console.error("[ofertas] erro ao salvar roteiro em pautas:", e) }
    }
    showToast(`${saved} roteiro${saved !== 1 ? "s" : ""} salvo${saved !== 1 ? "s" : ""} no Banco de Pautas!`, "success")
  }

  async function copiarAba() {
    if (!campanha) return
    if (activeTab === "landing" && landingHtml) {
      await copiarTexto(landingHtml, "aba-landing")
      showToast("HTML da landing page copiado!", "success")
      return
    }
    const text = buildTabText(activeTab, campanha)
    await copiarTexto(text, `aba-${activeTab}`)
    showToast("Aba copiada para a área de transferência!", "success")
  }

  function exportarHtml() {
    if (!landingHtml) return
    const blob = new Blob([landingHtml], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const slug = tema.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30).replace(/-$/, "")
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `landing-${slug}-${date}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast("Landing page exportada com sucesso!", "success")
  }

  function abrirTelaCheia() {
    if (!landingHtml) return
    const blob = new Blob([landingHtml], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
  }

  async function copiarLink() {
    if (!landingHtml) return
    const blob = new Blob([landingHtml], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    try {
      await navigator.clipboard.writeText(url)
      showToast("Link copiado! Válido nesta sessão do navegador.", "success")
    } catch (e) {
      console.error("[ofertas] erro ao copiar link:", e)
      showToast("Erro ao copiar link", "error")
    }
  }

  async function gerarLandingHtml(lp: LandingPage, genId: number) {
    setLoadingLanding(true)
    setLandingHtml(null)
    setOriginalHtml(null)
    setEditedHtml("")
    try {
      const r = await fetch("/api/ofertas/landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema, publico, objetivo, tom, landingPage: lp }),
      })
      if (!r.ok) throw new Error("HTTP error")
      const data = await r.json()
      if (landingGenRef.current !== genId) return
      const html: string = data.html ?? ""
      setLandingHtml(html)
      setOriginalHtml(html)
      setEditedHtml(html)
    } catch (e) {
      console.error("[ofertas] erro ao gerar landing HTML:", e)
    } finally {
      if (landingGenRef.current === genId) setLoadingLanding(false)
    }
  }

  // ── Input class ─────────────────────────────────────────────────────────────

  const INPUT = "w-full bg-card border border-border text-text-primary text-base md:text-[13px] rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent-border transition-colors placeholder:text-text-muted"
  const SELECT = "bg-card border border-border text-text-primary text-[12px] rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent-border transition-colors cursor-pointer"

  // ── Tab content renderers ────────────────────────────────────────────────────

  function renderRoteiros(c: Campanha) {
    return (
      <div className="space-y-3">
        {c.roteiros.map((r, i) => {
          const open = expanded.includes(i)
          return (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(prev => open ? prev.filter(x => x !== i) : [...prev, i])}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                  <Video className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-text-primary truncate">{r.titulo}</div>
                  <div className="text-[11px] text-text-muted mt-0.5 truncate">{r.gancho}</div>
                </div>
                <CopyBtn text={`${r.titulo}\n\nGancho: ${r.gancho}\n\nEstrutura:\n${r.estrutura}\n\nCTA: ${r.cta}\n\nPrompt Imagem:\n${r.promptImagem}`} k={`roteiro-${i}`} />
                {open ? <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />}
              </button>
              {open && (
                <div className="px-5 pb-5 space-y-4 border-t border-border">
                  {[
                    { label: "Gancho de abertura", text: r.gancho },
                    { label: "Estrutura completa (60s)", text: r.estrutura },
                    { label: "CTA final", text: r.cta },
                    { label: "Prompt de imagem (capa)", text: r.promptImagem },
                  ].map((s) => (
                    <div key={s.label} className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase">{s.label}</span>
                        <CopyBtn text={s.text} k={`${r.titulo}-${s.label}`} />
                      </div>
                      <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line bg-background/60 rounded-lg p-3 border border-border">{s.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  function renderLanding(c: Campanha) {
    // Loading skeleton
    if (loadingLanding) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[12px] font-mono text-text-muted">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Construindo sua landing page...
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden animate-pulse" style={{ height: 560 }}>
            {/* Hero skeleton */}
            <div className="flex flex-col items-center justify-center gap-4 p-12" style={{ height: 220, background: "var(--surface-2)" }}>
              <div className="h-7 rounded-lg w-2/3" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="h-4 rounded-lg w-1/2" style={{ background: "rgba(255,255,255,0.04)" }} />
              <div className="h-10 rounded-lg w-36 mt-2" style={{ background: "rgba(0,192,127,0.15)" }} />
            </div>
            {/* Body skeleton */}
            <div className="p-8 space-y-6">
              <div className="space-y-2.5">
                {[100, 83, 91, 75].map((w, i) => (
                  <div key={i} className="h-3 rounded" style={{ width: `${w}%`, background: "rgba(255,255,255,0.04)" }} />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }} />
                ))}
              </div>
              <div className="space-y-2">
                {[80, 65, 72].map((w, i) => (
                  <div key={i} className="h-3 rounded" style={{ width: `${w}%`, background: "rgba(255,255,255,0.04)" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    // No HTML generated (error or not triggered)
    if (!landingHtml) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <Globe className="w-8 h-8 text-text-muted" />
          <p className="text-[13px] text-text-muted">
            Não foi possível gerar a landing page para esta campanha.
          </p>
          <p className="text-[11px] text-text-muted opacity-60">{c.landingPage.headline}</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={abrirTelaCheia}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-text-secondary text-[11px] font-medium hover:border-border-hover hover:text-text-primary transition-all min-h-[36px]"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Tela cheia
          </button>
          <button
            onClick={() => setShowHtmlEditor(v => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-medium transition-all min-h-[36px]",
              showHtmlEditor
                ? "bg-accent-dim border-accent-border text-accent"
                : "border-border text-text-secondary hover:border-border-hover hover:text-text-primary"
            )}
          >
            {showHtmlEditor
              ? <><Eye className="w-3.5 h-3.5" />Ver Preview</>
              : <><Code2 className="w-3.5 h-3.5" />Editar HTML</>
            }
          </button>
          <button
            onClick={exportarHtml}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-dim border border-accent-border text-accent text-[11px] font-medium hover:bg-accent/20 transition-all min-h-[36px]"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar HTML
          </button>
          <button
            onClick={copiarLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-text-secondary text-[11px] font-medium hover:border-border-hover hover:text-text-primary transition-all min-h-[36px]"
          >
            <Copy className="w-3.5 h-3.5" />
            Copiar Link
          </button>
        </div>

        {/* Preview */}
        {!showHtmlEditor && (
          <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ height: 620 }}>
            <iframe
              key={landingHtml.length}
              srcDoc={landingHtml}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              title="Landing Page Preview"
            />
          </div>
        )}

        {/* HTML Editor */}
        {showHtmlEditor && (
          <div className="space-y-3">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase">Editor HTML</span>
                <span className="text-[9px] font-mono text-text-muted">{editedHtml.length.toLocaleString()} chars</span>
              </div>
              <textarea
                value={editedHtml}
                onChange={e => setEditedHtml(e.target.value)}
                className="w-full bg-background px-4 py-4 text-[12px] font-mono leading-relaxed resize-none outline-none"
                style={{ height: 500, color: "#4ade80", caretColor: "#e8eaf2" }}
                spellCheck={false}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLandingHtml(editedHtml)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-dim border border-accent-border text-accent text-[11px] font-medium hover:bg-accent/20 transition-all min-h-[36px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar Preview
              </button>
              <button
                onClick={() => { setEditedHtml(originalHtml ?? ""); setLandingHtml(originalHtml) }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-text-secondary text-[11px] font-medium hover:border-border-hover hover:text-text-primary transition-all min-h-[36px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Resetar
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderAnuncios(c: Campanha) {
    const FORMATS = [
      { key: "feed",    label: "Anúncios para Feed",   items: c.anuncios.feed    },
      { key: "stories", label: "Anúncios para Stories", items: c.anuncios.stories },
      { key: "reels",   label: "Anúncios para Reels",   items: c.anuncios.reels   },
    ] as const
    return (
      <div className="space-y-6">
        {FORMATS.map(fmt => (
          <div key={fmt.key}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-mono text-text-muted tracking-widest uppercase">{fmt.label}</span>
              <div className="h-px flex-1 bg-border opacity-60" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {fmt.items.map((a, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-badge font-mono font-bold px-2 py-0.5 rounded border tracking-wider", VARIACAO_STYLE[a.variacao] ?? VARIACAO_STYLE["Equilibrado"])}>
                      {a.variacao}
                    </span>
                    <CopyBtn text={`Headline: ${a.headline}\nTexto: ${a.texto}\nCTA: ${a.cta}`} k={`ad-${fmt.key}-${i}`} />
                  </div>
                  <p className="text-[13px] font-bold text-text-primary leading-snug">{a.headline}</p>
                  <p className="text-[11px] text-text-secondary leading-relaxed flex-1">{a.texto}</p>
                  <div className="pt-2 border-t border-border">
                    <p className="text-[10px] font-mono text-accent">{a.cta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  function renderStories(c: Campanha) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {c.stories.map((s) => (
          <div key={s.dia} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-text-muted">DIA {s.dia}</span>
                <span className={cn("text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border tracking-wider", STORY_TYPE_STYLE[s.tipo] ?? STORY_TYPE_STYLE["Educativo"])}>
                  {s.tipo}
                </span>
              </div>
              <CopyBtn text={`DIA ${s.dia} — ${s.tipo}\n${s.texto}\nVisual: ${s.sugestaoVisual}\nSticker: ${s.sticker}`} k={`story-${s.dia}`} />
            </div>
            <div className="flex-1 bg-background/60 border border-border rounded-lg p-3">
              <p className="text-[12px] text-text-primary leading-relaxed whitespace-pre-line">{s.texto}</p>
            </div>
            <div className="space-y-1.5">
              <div>
                <span className="text-[8px] font-mono text-text-muted">VISUAL</span>
                <p className="text-[10px] text-text-secondary mt-0.5">{s.sugestaoVisual}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-badge font-mono text-amber-400 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  {s.sticker}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  function renderWhatsapp(c: Campanha) {
    const wa = c.whatsapp
    const msgs = [
      { label: "Abertura",               emoji: "👋", text: wa.abertura,        k: "wa-abertura"  },
      { label: `Follow-up — Dia ${wa.followUps[0]?.dia ?? 1}`, emoji: "📩", text: wa.followUps[0]?.mensagem ?? "", k: "wa-fu1" },
      { label: `Follow-up — Dia ${wa.followUps[1]?.dia ?? 3}`, emoji: "📩", text: wa.followUps[1]?.mensagem ?? "", k: "wa-fu2" },
      { label: `Follow-up — Dia ${wa.followUps[2]?.dia ?? 7}`, emoji: "📩", text: wa.followUps[2]?.mensagem ?? "", k: "wa-fu3" },
      { label: "Fechamento / Urgência",  emoji: "⚠️", text: wa.fechamento,       k: "wa-fechamento"},
      { label: "Resposta a Objeção",     emoji: "💬", text: wa.respostaObjecao,  k: "wa-objecao"  },
    ]
    return (
      <div className="max-w-2xl space-y-4">
        {msgs.map((m) => (
          <div key={m.k} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span>{m.emoji}</span>
                <span className="text-[11px] font-semibold text-text-primary">{m.label}</span>
              </div>
              <CopyBtn text={m.text} k={m.k} />
            </div>
            <div className="p-4">
              <div className="bg-green-50 border border-green-200 rounded-2xl rounded-tl-none p-4 max-w-[90%]">
                <p className="text-[12px] text-text-primary leading-relaxed whitespace-pre-line">{m.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── TopBar actions for resultado stage ──────────────────────────────────────

  const resultadoActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={salvarNoPautas}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-text-secondary text-[11px] font-medium hover:border-accent-border hover:text-accent transition-all min-h-[36px]"
        title="Salvar roteiros no Banco de Pautas"
      >
        <BookmarkPlus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Salvar Pautas</span>
      </button>
      <button
        onClick={copiarAba}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-text-secondary text-[11px] font-medium hover:border-border-hover hover:text-text-primary transition-all min-h-[36px]"
      >
        <Copy className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Copiar Aba</span>
      </button>
      <button
        onClick={() => {
            landingGenRef.current += 1
            setStage("briefing")
            setCampanha(null)
            setLandingHtml(null)
            setOriginalHtml(null)
            setEditedHtml("")
            setLoadingLanding(false)
            setShowHtmlEditor(false)
          }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-dim border border-accent-border text-accent text-[11px] font-semibold hover:bg-accent/20 transition-all min-h-[36px]"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Nova Campanha</span>
      </button>
    </div>
  )

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Gerador de Ofertas"
        subtitle="CAMPANHAS COMPLETAS EM MINUTOS"
        actions={stage === "resultado" ? resultadoActions : undefined}
      />

      {/* ── BRIEFING ─────────────────────────────────────────────────────────── */}
      {stage === "briefing" && (
        <div className="p-4 md:p-8 space-y-6 max-w-3xl">

          {/* Sazonais */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase">Campanhas sazonais</span>
              <div className="h-px flex-1 bg-border opacity-60" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {SAZONAIS.map(s => (
                <button
                  key={s.label}
                  onClick={() => { setTema(s.tema); setPublico(s.publico); setObjetivo(s.objetivo); setTom(s.tom) }}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all hover:-translate-y-0.5 hover:border-accent-border",
                    tema === s.tema ? "bg-accent-dim border-accent-border" : "bg-card border-border"
                  )}
                >
                  <span className="text-xl">{s.emoji}</span>
                  <span className="text-[12px] font-semibold text-text-primary leading-snug">{s.label}</span>
                  <span className="text-[10px] text-text-muted leading-snug">{s.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border opacity-60" />
            <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase">ou escreva manualmente</span>
            <div className="h-px flex-1 bg-border opacity-60" />
          </div>

          {/* Form */}
          <div className="bg-card border border-border rounded-xl p-5 md:p-6 space-y-5">

            {/* Tema */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono text-text-muted tracking-wider uppercase">Tema da Campanha</label>
                <button
                  onClick={openImport}
                  className="text-[9px] font-mono text-accent hover:underline"
                >
                  Importar do Banco de Pautas
                </button>
              </div>
              <textarea
                value={tema}
                onChange={e => setTema(e.target.value)}
                placeholder="Ex: Campanha de emagrecimento para o verão — protocolo hormonal feminino"
                rows={2}
                className={cn(INPUT, "resize-none")}
              />
            </div>

            {/* Público */}
            <div>
              <label className="block text-[11px] font-mono text-text-muted tracking-wider uppercase mb-1.5">Público-alvo</label>
              <input
                type="text"
                value={publico}
                onChange={e => setPublico(e.target.value)}
                placeholder="Ex: Mulheres 40-55 anos com dificuldade para emagrecer"
                className={INPUT}
              />
            </div>

            {/* Selects row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-text-muted tracking-wider uppercase mb-1.5">Objetivo</label>
                <select value={objetivo} onChange={e => setObjetivo(e.target.value)} className={cn(SELECT, "w-full")}>
                  {OBJETIVOS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-text-muted tracking-wider uppercase mb-1.5">Duração</label>
                <select value={duracao} onChange={e => setDuracao(e.target.value)} className={cn(SELECT, "w-full")}>
                  {DURACOES.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-text-muted tracking-wider uppercase mb-1.5">Tom</label>
                <select value={tom} onChange={e => setTom(e.target.value)} className={cn(SELECT, "w-full")}>
                  {TONS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={gerar}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-accent-dim border border-accent-border text-accent font-bold text-[13px] hover:bg-accent/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed min-h-[52px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {progresso || "Gerando campanha..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Campanha Completa
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── RESULTADO ────────────────────────────────────────────────────────── */}
      {stage === "resultado" && campanha && (
        <div className="p-4 md:p-8 space-y-5">

          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none p-1 bg-card/60 rounded-xl border border-border">
            {TABS.map(t => {
              const Icon = t.Icon
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all flex-shrink-0",
                    activeTab === t.key
                      ? "bg-accent-dim border border-accent-border text-accent"
                      : "text-text-muted hover:text-text-secondary border border-transparent"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="animate-fade-in">
            {activeTab === "roteiros" && renderRoteiros(campanha)}
            {activeTab === "landing"  && renderLanding(campanha)}
            {activeTab === "anuncios" && renderAnuncios(campanha)}
            {activeTab === "stories"  && renderStories(campanha)}
            {activeTab === "whatsapp" && renderWhatsapp(campanha)}
          </div>
        </div>
      )}

      {/* ── Import Pauta Modal ─────────────────────────────────────────────── */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Importar pauta">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowImport(false)} aria-hidden="true" />
          <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-[14px] font-semibold text-text-primary">Importar do Banco de Pautas</h2>
              <button onClick={() => setShowImport(false)} className="text-text-muted hover:text-text-primary text-[11px] font-mono">Fechar</button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {loadingPautas ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
                </div>
              ) : pautasList.length === 0 ? (
                <div className="py-10 text-center text-[12px] text-text-muted">Nenhuma pauta encontrada</div>
              ) : (
                pautasList.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setTema(String(p.titulo)); setShowImport(false) }}
                    className="w-full text-left px-5 py-3 text-[12px] text-text-secondary hover:bg-white/[0.03] hover:text-text-primary transition-colors"
                  >
                    {p.titulo}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} type={toastType} />
    </div>
  )
}

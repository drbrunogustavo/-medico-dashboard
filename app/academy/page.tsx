"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Check, ChevronDown, ChevronRight, Circle, CheckCircle, Clock, ExternalLink, Play } from "lucide-react"
import { Toast } from "@/components/Toast"
import { Panel, PxButton, Segmented, Field, PxInput, PxModal, Tag, PageHeader } from "@/components/px"

// ─── Tipos ───────────────────────────────────────────────────────────────────

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
  nivel:     string
  modulos:   Modulo[]
}

type ProgressoMap = Record<string, "nao_iniciada" | "em_andamento" | "concluida">
type Tab = "trilhas" | "aulas" | "casos" | "comunidade" | "progresso"

// ─── Dados ───────────────────────────────────────────────────────────────────

const TRILHAS: Trilha[] = [
  {
    id: "marketing", titulo: "Marketing Médico", nivel: "Iniciante a Avançado",
    descricao: "Do zero à autoridade digital. Atraia pacientes pelo Instagram sem violar o CFM.",
    modulos: [
      {
        id: "mkt-m1", nome: "Módulo 1: Fundamentos",
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
        id: "mkt-m2", nome: "Módulo 2: Crescimento",
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
        id: "mkt-m3", nome: "Módulo 3: Autoridade",
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
    modulos: [
      {
        id: "ges-m1", nome: "Módulo 1: Fundamentos da Gestão",
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
        id: "ges-m2", nome: "Módulo 2: Processos e Equipe",
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
        id: "ges-m3", nome: "Módulo 3: Crescimento",
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
    id: "comercial", titulo: "Comercial e Conversão", nivel: "Iniciante a Intermediário",
    descricao: "Transforme interessados em pacientes fiéis. Scripts, CRM, fidelização e reativação.",
    modulos: [
      {
        id: "com-m1", nome: "Módulo 1: Conversão",
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
        id: "com-m2", nome: "Módulo 2: Fidelização",
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
    modulos: [
      {
        id: "esc-m1", nome: "Módulo 1: Escala",
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
        id: "esc-m2", nome: "Módulo 2: Visão de Longo Prazo",
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

// ─── Casos clínicos ──────────────────────────────────────────────────────────

interface CasoClinico {
  id:           string
  especialidade: string
  titulo:       string
  contexto:     string
  decisao:      string
  resultado:    string
  aprendizado:  string
  dificuldade:  "Iniciante" | "Intermediário" | "Avançado"
}

const CASOS: CasoClinico[] = [
  {
    id: "caso-1",
    especialidade: "Nutrologia",
    titulo: "Resistência insulínica mascarada em paciente normoglicêmico",
    contexto: "Homem, 42 anos, IMC 27, glicemia de jejum 94 mg/dL (normal). Queixa de fadiga crônica, ganho de 4 kg em 1 ano sem mudança de dieta. HbA1c: 5.4%. Médico anterior descartou diabetes.",
    decisao: "Solicitar HOMA-IR e curva glicoinsulinêmica de 2h. HOMA-IR = 3.8 (resistência). Insulina de jejum: 18 µUI/mL. Iniciou protocolo low-carb + metformina 500mg/dia + berberina 500mg 2x/dia.",
    resultado: "Em 12 semanas: perda de 5 kg, HOMA-IR 1.9, energia normalizada. Paciente evitou progressão para pré-diabetes.",
    aprendizado: "Glicemia de jejum normal não descarta resistência insulínica. HOMA-IR e insulinemia de jejum devem ser rotina em pacientes com fadiga e ganho ponderal inexplicado.",
    dificuldade: "Intermediário",
  },
  {
    id: "caso-2",
    especialidade: "Longevidade",
    titulo: "Paciente de 58 anos com 'exames normais' e senescência celular precoce",
    contexto: "Mulher, 58 anos, TSH 2.8, vitamina D 32 ng/mL (normal pelo lab). Queixa de perda de massa muscular, unhas quebradiças, cognição reduzida. Médico anterior disse que 'está tudo bem'.",
    decisao: "Referenciar vitamina D funcional ≥ 60 ng/mL para longevidade. Iniciar reposição vitamina D3 10.000 UI + K2 200 mcg. Avaliar zinco, ferritina sérica, IGF-1 e testosterona livre.",
    resultado: "Em 6 meses: vitamina D 68 ng/mL, melhora do sono e cognição, ganho de 1.2 kg de massa magra (DEXA). Zinco estava em 68 mcg/dL, suplementação iniciada.",
    aprendizado: "Valores 'normais' de laboratório foram estabelecidos para evitar doenças agudas, não para otimizar função. Médicos de longevidade trabalham com faixas funcionais, não apenas de referência.",
    dificuldade: "Avançado",
  },
  {
    id: "caso-3",
    especialidade: "Endocrinologia",
    titulo: "TSH 'normal' com hipotireoidismo subclínico sintomático",
    contexto: "Mulher, 35 anos, TSH 3.9 mUI/L (lab informa normal < 4.5). Queixa clássica: fadiga, ganho de peso, queda de cabelo, constipação, pele seca. T4L no limite inferior. Anti-TPO: 380 UI/mL.",
    decisao: "Diagnóstico de Tireoidite de Hashimoto + hipotireoidismo subclínico sintomático. Iniciar levotiroxina 25 mcg com titulação até TSH 1–1.5. Dieta sem glúten por 3 meses (impacto em anti-TPO).",
    resultado: "TSH 1.2 após 8 semanas. Sintomas resolvidos em 90%. Anti-TPO caiu 40% em 6 meses com dieta e selênio 200 mcg/dia.",
    aprendizado: "TSH ideal para qualidade de vida é 0.5–2.0, não 0.5–4.5. Anti-TPO elevado indica processo autoimune ativo mesmo com TSH 'normal'. Abordagem funcional muda o prognóstico.",
    dificuldade: "Intermediário",
  },
  {
    id: "caso-4",
    especialidade: "Metabolismo",
    titulo: "Esteatose hepática revertida com intervenção nutricional precisa",
    contexto: "Homem, 49 anos, diagnóstico de esteatose hepática grau 2 (USG). Consumo de álcool negado. TGO 48, TGP 67. Triglicerídeos 280 mg/dL, HDL 38. IMC 31. Cardiologista prescreveu estatina.",
    decisao: "Interromper estatina (hepatotóxica na esteatose). Protocolo: jejum intermitente 16:8, frutose < 15g/dia, ômega-3 4g/dia, colina 500 mg/dia, perda de 7–10% do peso corporal.",
    resultado: "Em 16 semanas: peso −8.5 kg, TGP 28, TGO 24, triglicerídeos 145, HDL 52. USG controle: esteatose leve/ausente.",
    aprendizado: "Frutose é o principal driver da esteatose não alcoólica, e não a gordura alimentar. Colina e ômega-3 têm evidência robusta. Perda de 7-10% do peso é o maior preditor de reversão.",
    dificuldade: "Avançado",
  },
  {
    id: "caso-5",
    especialidade: "Nutrologia",
    titulo: "Criança com déficit de crescimento por deficiência de zinco não investigada",
    contexto: "Menina, 8 anos, altura no percentil 10 (pais no P50). Apetite reduzido, infecções respiratórias frequentes (4-5/ano). Pediatra propôs GH. Ferritina e hemograma normais.",
    decisao: "Zinco sérico: 54 mcg/dL (deficiência). Suplementar zinco quelado 10 mg/dia por 3 meses. Reavaliar apetite em 4 semanas.",
    resultado: "Apetite normalizado em 3 semanas. Após 6 meses: ganho de 3.2 cm (velocidade de crescimento dobrou). Infecções: 1 episódio no semestre. GH não necessário.",
    aprendizado: "Zinco é cofator de +300 enzimas, incluindo IGF-1 e imunidade. Deficiência é subestimada na pediatria. Antes de GH, investigar micronutrientes.",
    dificuldade: "Iniciante",
  },
]

// ─── Casos clínicos: componente ──────────────────────────────────────────────

function AbaCasos() {
  const [aberto, setAberto] = useState<string | null>(null)
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-px-muted">{CASOS.length} casos documentados</p>
      {CASOS.map(caso => {
        const isOpen = aberto === caso.id
        return (
          <Panel key={caso.id} as="article" className="overflow-hidden p-0">
            <button
              type="button"
              aria-expanded={isOpen}
              className="flex w-full items-start gap-4 p-5 text-left"
              onClick={() => setAberto(isOpen ? null : caso.id)}
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <Tag tone="accent">{caso.especialidade}</Tag>
                  <Tag>{caso.dificuldade}</Tag>
                </div>
                <p className="text-[14px] font-semibold leading-snug text-px-ink">{caso.titulo}</p>
              </div>
              <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-px-muted transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>

            {isOpen && (
              <div className="animate-fade-in space-y-4 border-t border-px-ink/10 px-5 pb-5 pt-4">
                {[
                  { label: "Contexto",  text: caso.contexto  },
                  { label: "Decisão",   text: caso.decisao   },
                  { label: "Resultado", text: caso.resultado },
                ].map(({ label, text }) => (
                  <div key={label}>
                    <p className="mb-1 text-[12px] font-medium text-px-muted">{label}</p>
                    <p className="text-[13px] leading-relaxed text-px-ink/80">{text}</p>
                  </div>
                ))}
                <div className="rounded-px-card bg-px-accent-soft px-4 py-3">
                  <p className="mb-1 text-[12px] font-medium text-px-accent">Aprendizado principal</p>
                  <p className="text-[13px] font-medium leading-relaxed text-px-ink">{caso.aprendizado}</p>
                </div>
              </div>
            )}
          </Panel>
        )
      })}
    </div>
  )
}

function totalAulas(t: Trilha)  { return t.modulos.reduce((s, m) => s + m.aulas.length, 0) }
function concluidasT(t: Trilha, p: ProgressoMap) {
  return t.modulos.reduce((s, m) => s + m.aulas.filter(a => p[a.id] === "concluida").length, 0)
}
function todasAulasList() {
  return TRILHAS.flatMap(t => t.modulos.flatMap(m => m.aulas.map(a => ({ aula: a, trilha: t }))))
}

// ─── Sistema de níveis ───────────────────────────────────────────────────────

const NIVEIS = [
  { label: "Bronze",  min: 0,  max: 25  },
  { label: "Prata",   min: 26, max: 50  },
  { label: "Ouro",    min: 51, max: 75  },
  { label: "Diamond", min: 76, max: 100 },
]

function getNivel(pct: number) {
  return NIVEIS.find(n => pct <= n.max) ?? NIVEIS[NIVEIS.length - 1]
}

const XP_POR_NIVEL: Record<string, number> = { "Iniciante": 10, "Intermediário": 15, "Avançado": 20 }
function xpAula(a: Aula) { return XP_POR_NIVEL[a.nivel] ?? 10 }
const XP_TOTAL = TRILHAS.flatMap(t => t.modulos.flatMap(m => m.aulas)).reduce((s, a) => s + xpAula(a), 0)

function Barra({ pct, label, className }: { pct: number; label: string; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={`h-2 w-full overflow-hidden rounded-full bg-px-ink/10 ${className ?? ""}`}
    >
      <div className="h-full rounded-full bg-px-ink transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

function NivelBadge({ done, total, xp, xpMax }: { done: number; total: number; xp: number; xpMax: number }) {
  const pct    = total > 0 ? Math.round(done / total * 100) : 0
  const nivel  = getNivel(pct)
  const next   = NIVEIS.find(n => n.min > pct)
  const xpProx = next ? Math.ceil(xpMax * next.min / 100) : xpMax
  return (
    <Panel className="space-y-3 p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[16px] font-semibold text-px-ink">{nivel.label}</span>
        <span className="text-[12.5px] text-px-muted">{xp} / {xpProx} XP</span>
        <span className="text-[12.5px] text-px-muted">{done}/{total} aulas concluídas</span>
        <span className="ml-auto text-[12.5px] text-px-muted">{next ? `próximo nível: ${next.label}` : "nível máximo"}</span>
      </div>
      <Barra pct={pct} label="Progresso geral nas aulas" />
    </Panel>
  )
}

// ─── Modal de aula ───────────────────────────────────────────────────────────

function AulaModal({ aula, status, onClose, onConcluir, saving }: {
  aula: Aula; status: string
  onClose: () => void; onConcluir: () => void; saving: boolean
}) {
  const concluida = status === "concluida"
  return (
    <PxModal open onClose={onClose} title={aula.titulo} className="max-w-lg">
      <div className="space-y-4">
        <p className="text-[12.5px] text-px-muted">Aula {aula.numero}, {aula.duracao}</p>

        <div className="flex aspect-video w-full flex-col items-center justify-center rounded-px-card bg-px-ink/[0.06]">
          <Play className="mb-2 h-9 w-9 text-px-ink" aria-hidden="true" />
          <p className="text-[13px] font-medium text-px-ink">Vídeo em breve</p>
        </div>

        <Tag>{aula.nivel}</Tag>

        <div>
          <p className="mb-1.5 text-[12px] font-medium text-px-muted">O que você vai aprender</p>
          <p className="text-[13.5px] leading-relaxed text-px-ink/80">{aula.conteudo}</p>
        </div>

        {aula.linkModulo && (
          <div className="flex items-center justify-between gap-3 rounded-px-card bg-px-accent-soft px-4 py-3">
            <div>
              <p className="mb-0.5 text-[12px] font-medium text-px-accent">Material relacionado</p>
              <p className="text-[13px] font-medium text-px-ink">Praticar no {aula.linkModulo.label}</p>
            </div>
            <a
              href={aula.linkModulo.href}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-px-ctl border border-px-line bg-white/60 px-3.5 text-[12.5px] font-semibold text-px-ink hover:bg-white/90"
            >
              Abrir <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        )}

        <PxButton fullWidth onClick={onConcluir} loading={saving} disabled={concluida} leftIcon={Check}>
          {concluida ? "Aula concluída" : "Marcar como concluída"}
        </PxButton>
      </div>
    </PxModal>
  )
}

// ─── Aba trilhas ─────────────────────────────────────────────────────────────

type MarcarFn = (a: Aula, t: Trilha) => Promise<boolean>

function useAulaModal(onMarcarConcluida: MarcarFn) {
  const [aulaModal, setAulaModal] = useState<{ aula: Aula; trilha: Trilha } | null>(null)
  const [saving,    setSaving]    = useState(false)
  async function handleConcluir() {
    if (!aulaModal) return
    setSaving(true)
    const ok = await onMarcarConcluida(aulaModal.aula, aulaModal.trilha)
    setSaving(false)
    if (ok) setAulaModal(null)
  }
  return { aulaModal, setAulaModal, saving, handleConcluir }
}

function IconeStatus({ concluida }: { concluida: boolean }) {
  return concluida
    ? <CheckCircle className="h-4 w-4 shrink-0 text-px-ink" aria-label="Concluída" />
    : <Circle className="h-4 w-4 shrink-0 text-px-muted" aria-label="Não concluída" />
}

function AbaTrilhas({ progresso, onMarcarConcluida }: { progresso: ProgressoMap; onMarcarConcluida: MarcarFn }) {
  const [expanded,    setExpanded]    = useState<Record<string, boolean>>({})
  const [modExpanded, setModExpanded] = useState<Record<string, boolean>>({})
  const { aulaModal, setAulaModal, saving, handleConcluir } = useAulaModal(onMarcarConcluida)

  return (
    <>
      <div className="space-y-3">
        {TRILHAS.map(trilha => {
          const total  = totalAulas(trilha)
          const done   = concluidasT(trilha, progresso)
          const pct    = total > 0 ? Math.round((done / total) * 100) : 0
          const isOpen = !!expanded[trilha.id]

          return (
            <Panel key={trilha.id} as="article" className="overflow-hidden p-0">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setExpanded(e => ({ ...e, [trilha.id]: !isOpen }))}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[16px] font-semibold text-px-ink">{trilha.titulo}</h3>
                    <Tag>{trilha.nivel}</Tag>
                  </div>
                  <p className="mt-1 text-[13px] text-px-muted">{trilha.descricao}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <Barra pct={pct} label={`Progresso em ${trilha.titulo}`} className="max-w-[160px]" />
                    <span className="text-[12.5px] text-px-muted">{done}/{total} aulas</span>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 shrink-0 text-px-muted transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>

              {isOpen && (
                <div className="space-y-3 border-t border-px-ink/10 px-4 pb-4 pt-4">
                  {trilha.modulos.map(mod => {
                    const modOpen = modExpanded[mod.id] !== false
                    return (
                      <div key={mod.id} className="overflow-hidden rounded-px-card bg-white/60">
                        <button
                          type="button"
                          aria-expanded={modOpen}
                          onClick={() => setModExpanded(e => ({ ...e, [mod.id]: !modOpen }))}
                          className="flex w-full items-center gap-2 px-4 py-3 text-left"
                        >
                          <ChevronRight className={`h-4 w-4 shrink-0 text-px-muted transition-transform ${modOpen ? "rotate-90" : ""}`} aria-hidden="true" />
                          <span className="flex-1 text-[13.5px] font-semibold text-px-ink">{mod.nome}</span>
                          <span className="text-[12.5px] text-px-muted">{mod.aulas.length} aulas</span>
                        </button>

                        {modOpen && (
                          <ul className="divide-y divide-px-ink/10 border-t border-px-ink/10">
                            {mod.aulas.map(aula => {
                              const concluida = (progresso[aula.id] ?? "nao_iniciada") === "concluida"
                              return (
                                <li key={aula.id}>
                                  <button
                                    type="button"
                                    onClick={() => setAulaModal({ aula, trilha })}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-px-ink/[0.05]"
                                  >
                                    <IconeStatus concluida={concluida} />
                                    <span className="min-w-0 flex-1">
                                      <span className={`block truncate text-[13.5px] font-medium ${concluida ? "text-px-muted" : "text-px-ink"}`}>
                                        {aula.numero}. {aula.titulo}
                                      </span>
                                      <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-px-muted">
                                        <Clock className="h-3 w-3" aria-hidden="true" />{aula.duracao}
                                      </span>
                                    </span>
                                    <span className="hidden shrink-0 sm:block"><Tag>{aula.nivel}</Tag></span>
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Panel>
          )
        })}
      </div>

      {aulaModal && (
        <AulaModal
          aula={aulaModal.aula}
          status={progresso[aulaModal.aula.id] ?? "nao_iniciada"}
          onClose={() => setAulaModal(null)} onConcluir={handleConcluir} saving={saving}
        />
      )}
    </>
  )
}

// ─── Aba aulas ───────────────────────────────────────────────────────────────

function AbaAulas({ progresso, onMarcarConcluida }: { progresso: ProgressoMap; onMarcarConcluida: MarcarFn }) {
  const [busca,   setBusca]   = useState("")
  const [filtroT, setFiltroT] = useState("todas")
  const [filtroN, setFiltroN] = useState("todos")
  const { aulaModal, setAulaModal, saving, handleConcluir } = useAulaModal(onMarcarConcluida)

  const lista = todasAulasList().filter(({ aula, trilha }) => {
    const q = busca.toLowerCase()
    if (q && !aula.titulo.toLowerCase().includes(q) && !trilha.titulo.toLowerCase().includes(q)) return false
    if (filtroT !== "todas" && trilha.id !== filtroT) return false
    if (filtroN !== "todos" && aula.nivel !== filtroN) return false
    return true
  })

  return (
    <>
      <div className="mb-5 space-y-3">
        <PxInput
          type="search"
          aria-label="Buscar aula"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar aula"
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-3">
          <Segmented
            label="Filtrar por trilha"
            value={filtroT}
            onChange={setFiltroT}
            options={[{ value: "todas", label: "Todas" }, ...TRILHAS.map(t => ({ value: t.id, label: t.titulo }))]}
          />
          <Segmented
            label="Filtrar por nível"
            value={filtroN}
            onChange={setFiltroN}
            options={["todos", "Iniciante", "Intermediário", "Avançado"].map(n => ({ value: n, label: n === "todos" ? "Todos os níveis" : n }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        {lista.length === 0 && (
          <Panel className="py-10 text-center">
            <p className="text-[14px] font-semibold text-px-ink">Nenhuma aula encontrada</p>
            <p className="mb-4 mt-1 text-[13px] text-px-muted">Tente outros termos ou limpe os filtros para ver todas as aulas.</p>
            <PxButton variant="secondary" onClick={() => { setBusca(""); setFiltroT("todas"); setFiltroN("todos") }}>Limpar filtros</PxButton>
          </Panel>
        )}
        {lista.map(({ aula, trilha }) => {
          const concluida = (progresso[aula.id] ?? "nao_iniciada") === "concluida"
          return (
            <button
              key={aula.id}
              type="button"
              onClick={() => setAulaModal({ aula, trilha })}
              className="px-glass flex w-full items-center gap-3 rounded-px-card px-4 py-3 text-left hover:bg-white/80"
            >
              <IconeStatus concluida={concluida} />
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[14px] font-medium ${concluida ? "text-px-muted" : "text-px-ink"}`}>{aula.titulo}</span>
                <span className="text-[12px] text-px-muted">{trilha.titulo}, {aula.duracao}</span>
              </span>
              <span className="hidden shrink-0 sm:block"><Tag>{aula.nivel}</Tag></span>
            </button>
          )
        })}
      </div>

      {aulaModal && (
        <AulaModal
          aula={aulaModal.aula}
          status={progresso[aulaModal.aula.id] ?? "nao_iniciada"}
          onClose={() => setAulaModal(null)} onConcluir={handleConcluir} saving={saving}
        />
      )}
    </>
  )
}

// ─── Aba comunidade ──────────────────────────────────────────────────────────

const FEATURES = [
  { label: "Ranking mensal de crescimento",  desc: "Compare seu crescimento com outros médicos da sua especialidade." },
  { label: "Desafios mensais com premiação", desc: "Participe de desafios e ganhe reconhecimento da comunidade." },
  { label: "Benchmarking por especialidade", desc: "Dados anônimos para saber como você se compara ao mercado." },
  { label: "Grupos por especialidade",       desc: "Conecte-se com médicos da mesma área para trocar experiências." },
  { label: "Mentoria ao vivo",               desc: "Sessões mensais de perguntas e respostas ao vivo com especialistas PRAXIS." },
]

function AbaComunidade() {
  const [form, setForm] = useState({ nome: "", email: "", especialidade: "" })
  const [step, setStep] = useState<"idle" | "sending" | "done" | "error">("idle")

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

  return (
    <div className="space-y-6">
      <Panel tone="dark" className="px-6 py-8 text-center">
        <h2 className="mb-3 text-[24px] font-medium tracking-[-0.02em] text-white">Comunidade PRAXIS: em breve</h2>
        <p className="mx-auto mb-6 max-w-md text-[14px] leading-relaxed text-white/75">
          Uma comunidade exclusiva de médicos que pensam como empresários. Deixe seu interesse e seja avisado no lançamento.
        </p>

        {step === "done" ? (
          <p role="status" className="inline-flex items-center gap-2 rounded-px-card bg-white/10 px-5 py-3 text-[13.5px] font-semibold text-white">
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
            Você está na lista. Avisaremos no lançamento.
          </p>
        ) : (
          <form onSubmit={submit} className="mx-auto flex max-w-xl flex-col gap-2 sm:flex-row">
            <PxInput aria-label="Seu nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Seu nome" />
            <PxInput aria-label="Seu e-mail" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Seu e-mail" />
            <PxButton type="submit" variant="inverse" loading={step === "sending"} disabled={!valid}>Quero participar</PxButton>
          </form>
        )}
        {step === "error" && (
          <p role="alert" className="mx-auto mt-3 max-w-md rounded-px-card bg-white px-4 py-2.5 text-[13px] text-px-danger">
            Não foi possível registrar seu interesse. Tente novamente.
          </p>
        )}
      </Panel>

      <section aria-labelledby="com-vem-ai">
        <h3 id="com-vem-ai" className="mb-3 text-[15px] font-semibold text-px-ink">O que vem aí</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(f => (
            <Panel key={f.label} as="article" className="p-4">
              <p className="mb-0.5 text-[14px] font-semibold text-px-ink">{f.label}</p>
              <p className="text-[13px] leading-snug text-px-muted">{f.desc}</p>
            </Panel>
          ))}
        </div>
      </section>
    </div>
  )
}

// ─── Aba progresso ───────────────────────────────────────────────────────────

function Numero({ valor, titulo, apoio }: { valor: string | number; titulo: string; apoio: string }) {
  return (
    <Panel as="div" className="p-4 text-center">
      <p className="text-[30px] font-medium leading-none tracking-[-0.02em] text-px-ink">{valor}</p>
      <p className="mt-2 text-[13px] font-semibold text-px-ink">{titulo}</p>
      <p className="text-[12px] text-px-muted">{apoio}</p>
    </Panel>
  )
}

function AbaProgresso({ progresso, xpGanho, xpMax, aulasNaSemana }: {
  progresso: ProgressoMap; xpGanho: number; xpMax: number; aulasNaSemana: number
}) {
  const totalGeral = TRILHAS.reduce((s, t) => s + totalAulas(t), 0)
  const doneGeral  = Object.values(progresso).filter(s => s === "concluida").length
  const pctGeral   = totalGeral > 0 ? Math.round((doneGeral / totalGeral) * 100) : 0
  const nivel      = getNivel(pctGeral)

  const trilhaMaisAvancada = TRILHAS.reduce<{ trilha: Trilha; pct: number } | null>((best, t) => {
    const tot  = totalAulas(t)
    const done = concluidasT(t, progresso)
    const pct  = tot > 0 ? Math.round((done / tot) * 100) : 0
    if (!best || pct > best.pct) return { trilha: t, pct }
    return best
  }, null)

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Numero valor={xpGanho} titulo="XP total" apoio={`de ${xpMax} possíveis`} />
        <Numero valor={nivel.label} titulo="Nível atual" apoio={`${pctGeral}% concluído`} />
        <Numero valor={aulasNaSemana} titulo="Aulas esta semana" apoio="últimos 7 dias" />
        {trilhaMaisAvancada && (
          <Numero valor={`${trilhaMaisAvancada.pct}%`} titulo={trilhaMaisAvancada.trilha.titulo} apoio="trilha mais avançada" />
        )}
      </div>

      {proxima && (
        <Panel className="space-y-2">
          <p className="text-[12.5px] font-medium text-px-muted">Próxima aula recomendada</p>
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-px-ink">{proxima.aula.titulo}</p>
              <p className="text-[12.5px] text-px-muted">{proxima.trilha.titulo}, {proxima.aula.duracao}</p>
            </div>
            <Tag>{proxima.aula.nivel}</Tag>
          </div>
        </Panel>
      )}

      <section aria-labelledby="prog-trilhas">
        <h3 id="prog-trilhas" className="mb-3 text-[15px] font-semibold text-px-ink">Progresso por trilha</h3>
        <div className="space-y-3">
          {TRILHAS.map(t => {
            const tot  = totalAulas(t)
            const done = concluidasT(t, progresso)
            const pct  = tot > 0 ? Math.round((done / tot) * 100) : 0
            return (
              <Panel key={t.id} as="article" className="p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex-1 text-[14px] font-semibold text-px-ink">{t.titulo}</span>
                  <span className="text-[12.5px] text-px-muted">{done}/{tot}</span>
                  <span className="text-[13px] font-semibold text-px-ink">{pct}%</span>
                </div>
                <Barra pct={pct} label={`Progresso em ${t.titulo}`} />
              </Panel>
            )
          })}
        </div>
      </section>

      <Panel className="text-center">
        <h3 className="mb-1 text-[15px] font-semibold text-px-ink">Certificados</h3>
        <p className="text-[13px] text-px-muted">Em breve, disponíveis ao concluir cada trilha completa.</p>
      </Panel>
    </div>
  )
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function AcademyPage() {
  const [tab,         setTab]         = useState<Tab>("trilhas")
  const [progresso,   setProgresso]   = useState<ProgressoMap>({})
  const [loadingProg, setLoadingProg] = useState(true)
  const [erroProg,    setErroProg]    = useState(false)
  const [toast,       setToast]       = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [aulasDatas,  setAulasDatas]  = useState<Record<string, string>>({})

  const fetchProgresso = useCallback(async () => {
    setLoadingProg(true)
    setErroProg(false)
    try {
      const res  = await fetch("/api/academy/progresso")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as Array<{ aula_id: string; status: string; concluida_em?: string }>
      if (!Array.isArray(data)) throw new Error("formato inesperado")
      const map: ProgressoMap = {}
      const datas: Record<string, string> = {}
      data.forEach(r => {
        map[r.aula_id] = r.status as ProgressoMap[string]
        if (r.concluida_em) datas[r.aula_id] = r.concluida_em
      })
      setProgresso(map)
      setAulasDatas(datas)
    } catch (e) {
      console.error("[academy] erro ao carregar progresso:", e)
      setErroProg(true)
    } finally { setLoadingProg(false) }
  }, [])

  useEffect(() => { fetchProgresso() }, [fetchProgresso])

  function avisar(msg: string, type: "success" | "error") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), type === "success" ? 1800 : 3500)
  }

  async function marcarConcluida(aula: Aula, trilha: Trilha): Promise<boolean> {
    if (progresso[aula.id] === "concluida") return true
    try {
      const res = await fetch("/api/academy/progresso", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aula_id: aula.id, trilha_id: trilha.id, status: "concluida" }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setProgresso(p => ({ ...p, [aula.id]: "concluida" }))
      setAulasDatas(d => ({ ...d, [aula.id]: new Date().toISOString() }))
      avisar("Aula concluída", "success")
      return true
    } catch (e) {
      console.error("[academy] erro ao marcar aula como concluída:", e)
      avisar("Não foi possível salvar o progresso. Tente novamente.", "error")
      return false
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "trilhas",    label: "Trilhas"       },
    { id: "aulas",      label: "Aulas"         },
    { id: "casos",      label: "Casos reais"   },
    { id: "comunidade", label: "Comunidade"    },
    { id: "progresso",  label: "Meu progresso" },
  ]

  const totalGeral  = TRILHAS.reduce((s, t) => s + totalAulas(t), 0)
  const doneGeral   = Object.values(progresso).filter(s => s === "concluida").length
  const xpGanho     = useMemo(() =>
    todasAulasList().filter(({ aula }) => progresso[aula.id] === "concluida").reduce((s, { aula }) => s + xpAula(aula), 0)
  , [progresso])
  const aulasNaSemana = useMemo(() => {
    const limite = new Date(); limite.setDate(limite.getDate() - 7)
    return Object.values(aulasDatas).filter(d => new Date(d) >= limite).length
  }, [aulasDatas])

  return (
    <div className="animate-fade-in">
      <PageHeader title="PRAXIS Academy" caption="Aprenda a construir uma clínica de sucesso" />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        {!loadingProg && !erroProg && (
          <NivelBadge done={doneGeral} total={totalGeral} xp={xpGanho} xpMax={XP_TOTAL} />
        )}

        <Segmented label="Seção da Academy" value={tab} onChange={setTab} options={TABS.map(t => ({ value: t.id, label: t.label }))} />

        {loadingProg ? (
          <div role="status" className="py-16 text-center text-[13px] text-px-muted">Carregando seu progresso</div>
        ) : (
          <>
            {erroProg && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">
                <span>Não foi possível carregar seu progresso. As aulas aparecem como não concluídas.</span>
                <PxButton size="sm" variant="secondary" onClick={fetchProgresso}>Tentar de novo</PxButton>
              </div>
            )}
            {tab === "trilhas"    && <AbaTrilhas    progresso={progresso} onMarcarConcluida={marcarConcluida} />}
            {tab === "aulas"      && <AbaAulas      progresso={progresso} onMarcarConcluida={marcarConcluida} />}
            {tab === "casos"      && <AbaCasos />}
            {tab === "comunidade" && <AbaComunidade />}
            {tab === "progresso"  && <AbaProgresso  progresso={progresso} xpGanho={xpGanho} xpMax={XP_TOTAL} aulasNaSemana={aulasNaSemana} />}
          </>
        )}
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}

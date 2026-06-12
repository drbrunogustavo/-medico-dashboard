"use client"

import { useState, useMemo } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  Pill, Search, ChevronDown, ChevronRight, Copy, Check,
  AlertTriangle, Info, Shield, Zap, Star,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type Linha = "primeira" | "segunda" | "terceira" | "adjuvante"
type Via   = "SC" | "IM" | "VO" | "Vaginal" | "Transdérmica" | "Tópica" | "EV"

interface Titulacao {
  semana?: number
  dia?: number
  dose: string
  nota?: string
}

interface Medicamento {
  id: string
  nome: string
  nomesComerciais: string[]
  linha: Linha
  via: Via
  doseInicial: string
  titulacao?: Titulacao[]
  doseManutencao?: string
  mecanismo?: string
  indicacoes: string[]
  contraindicacoes: string[]
  efeitosAdversos: string[]
  interacoes: string[]
  monitoramento: string[]
  notas?: string[]
  diferencial?: string
}

interface Diagnostico {
  id: string
  nome: string
  categoria: string
  medicamentos: Medicamento[]
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const DIAGNOSTICOS: Diagnostico[] = [
  // ── OBESIDADE ──────────────────────────────────────────────────────────────
  {
    id: "obesidade",
    nome: "Obesidade / Emagrecimento",
    categoria: "Metabolismo",
    medicamentos: [
      {
        id: "semaglutida",
        nome: "Semaglutida",
        nomesComerciais: ["Ozempic® (DM2)", "Wegovy® (obesidade)"],
        linha: "primeira",
        via: "SC",
        doseInicial: "0,25 mg/semana SC × 4 semanas",
        titulacao: [
          { semana: 1,  dose: "0,25 mg/semana" },
          { semana: 5,  dose: "0,5 mg/semana" },
          { semana: 9,  dose: "1,0 mg/semana" },
          { semana: 17, dose: "1,7 mg/semana" },
          { semana: 21, dose: "2,4 mg/semana", nota: "Dose máxima para obesidade" },
        ],
        mecanismo: "Agonista do receptor GLP-1 de ação prolongada — reduz apetite, retarda esvaziamento gástrico e melhora sensibilidade insulínica.",
        indicacoes: ["IMC ≥ 30 kg/m²", "IMC ≥ 27 kg/m² com comorbidade (HAS, DM2, dislipidemia)", "DM2 com controle inadequado"],
        contraindicacoes: [
          "Carcinoma medular de tireoide pessoal ou familiar",
          "Neoplasia Endócrina Múltipla tipo 2 (NEM 2)",
          "Pancreatite aguda recorrente",
          "Gravidez e amamentação",
        ],
        efeitosAdversos: [
          "Náusea (muito comum — transitória nas primeiras semanas)",
          "Vômitos, diarreia, constipação",
          "Dor abdominal, dispepsia",
          "Pancreatite aguda (raro — suspender se suspeita)",
        ],
        interacoes: [
          "Insulina e secretagogos: risco de hipoglicemia — reduzir dose de insulina ao iniciar",
          "Anticoagulantes orais (varfarina): monitorar RNI",
          "Medicamentos orais: retardo no esvaziamento gástrico pode alterar absorção",
        ],
        monitoramento: [
          "TFG e função renal antes e durante (especialmente em desidratação)",
          "Amilase/lipase se dor abdominal persistente",
          "PA, FC e peso a cada consulta",
          "HbA1c, glicemia de jejum a cada 3 meses",
        ],
        notas: [
          "Aplicar uma vez por semana, mesmo dia, a qualquer hora, com ou sem alimento.",
          "Locais de aplicação: abdome, coxa ou braço — rodiziar pontos.",
          "Titulação lenta reduz significativamente náusea — não pular etapas.",
        ],
      },
      {
        id: "tirzepatida",
        nome: "Tirzepatida",
        nomesComerciais: ["Mounjaro®"],
        linha: "primeira",
        via: "SC",
        doseInicial: "2,5 mg/semana SC × 4 semanas",
        titulacao: [
          { semana: 1,  dose: "2,5 mg/semana" },
          { semana: 5,  dose: "5,0 mg/semana" },
          { semana: 9,  dose: "7,5 mg/semana" },
          { semana: 13, dose: "10,0 mg/semana" },
          { semana: 17, dose: "12,5 mg/semana" },
          { semana: 21, dose: "15,0 mg/semana", nota: "Dose máxima" },
        ],
        mecanismo: "Duplo agonista GIP/GLP-1 — maior eficácia de perda de peso vs. semaglutida mono-agonista.",
        indicacoes: ["IMC ≥ 30 kg/m²", "IMC ≥ 27 kg/m² + comorbidade", "DM2 — primeira linha após metformina"],
        contraindicacoes: [
          "NEM tipo 2 ou carcinoma medular de tireoide (pessoal/familiar)",
          "Hipersensibilidade à tirzepatida",
          "Gravidez e amamentação",
        ],
        efeitosAdversos: [
          "Náusea, vômito, diarreia (mais frequentes nos primeiros meses)",
          "Redução do apetite intensa",
          "Pancreatite (raro)",
          "Colelitíase — risco aumentado com perda de peso rápida",
        ],
        interacoes: [
          "Insulina/secretagogos: risco de hipoglicemia",
          "Medicamentos de janela terapêutica estreita: monitorar absorção",
        ],
        monitoramento: [
          "Glicemia e HbA1c trimestralmente",
          "Peso e CA a cada consulta",
          "Função renal, PA",
          "Sintomas biliares (cálculos em perda rápida)",
        ],
        diferencial: "Perda de peso até 22% em estudos (SURMOUNT) vs. ~15% com semaglutida. Melhor controle glicêmico no DM2.",
      },
      {
        id: "liraglutida",
        nome: "Liraglutida",
        nomesComerciais: ["Saxenda® (obesidade)", "Victoza® (DM2)"],
        linha: "segunda",
        via: "SC",
        doseInicial: "0,6 mg/dia SC × 1 semana",
        titulacao: [
          { semana: 1, dose: "0,6 mg/dia" },
          { semana: 2, dose: "1,2 mg/dia" },
          { semana: 3, dose: "1,8 mg/dia" },
          { semana: 4, dose: "2,4 mg/dia" },
          { semana: 5, dose: "3,0 mg/dia", nota: "Dose terapêutica alvo" },
        ],
        mecanismo: "Agonista GLP-1 de ação intermediária — administração diária.",
        indicacoes: ["IMC ≥ 30", "IMC ≥ 27 + comorbidade", "Quando semaglutida/tirzepatida indisponíveis ou não toleradas"],
        contraindicacoes: ["Mesmas da semaglutida", "NEM 2, carcinoma medular tireoide"],
        efeitosAdversos: ["Náusea, vômito (mais pronunciados por ser diário)", "Diarreia, constipação", "Pancreatite (raro)"],
        interacoes: ["Insulina e secretagogos: hipoglicemia"],
        monitoramento: ["Peso, PA, FC", "Glicemia, HbA1c", "Função renal"],
        notas: ["Administrar uma vez ao dia, mesma hora, independente de refeições.", "Menos conveniente que semaglutida semanal — menor adesão."],
      },
      {
        id: "orlistat",
        nome: "Orlistat",
        nomesComerciais: ["Xenical® 120mg", "Lipiblock® 120mg"],
        linha: "segunda",
        via: "VO",
        doseInicial: "120 mg 3x/dia com refeições que contenham gordura",
        mecanismo: "Inibidor de lipase pancreática e gástrica — reduz absorção de ~30% da gordura ingerida.",
        indicacoes: ["IMC ≥ 30", "IMC ≥ 27 + comorbidade", "Alternativa quando GLP-1 contraindicado ou intolerável"],
        contraindicacoes: [
          "Síndrome de má absorção crônica",
          "Colestase",
          "Gravidez",
          "Hipersensibilidade ao orlistat",
        ],
        efeitosAdversos: [
          "Esteatorreia, manchas oleosas nas fezes",
          "Urgência e incontinência fecal",
          "Flatulência com descarga oleosa",
          "Deficiências de vitaminas lipossolúveis (A, D, E, K) — suplementar",
        ],
        interacoes: [
          "Ciclosporina: reduz absorção — separar por 2h",
          "Levotiroxina: separar por 4h",
          "Anticoagulantes orais (varfarina): monitorar RNI",
          "Antiepiléticos: redução de absorção",
        ],
        monitoramento: ["Peso, PA", "Vitaminas lipossolúveis anualmente", "Função hepática (casos de lesão hepática raros)"],
        notas: [
          "Tomar durante ou até 1h após a refeição.",
          "Omitir dose se a refeição não contiver gordura.",
          "Suplementar multivitamínico 2h antes ou após o orlistat.",
        ],
      },
      {
        id: "sibutramina",
        nome: "Sibutramina",
        nomesComerciais: ["Biomag®", "Plenty®", "Reductil® (descontinuado)"],
        linha: "segunda",
        via: "VO",
        doseInicial: "10 mg/dia pela manhã",
        doseManutencao: "10–15 mg/dia (aumentar para 15mg após 4 sem se resposta inadequada)",
        mecanismo: "Inibidor da recaptação de serotonina, noradrenalina e dopamina — reduz apetite e aumenta saciedade.",
        indicacoes: ["IMC ≥ 30", "IMC ≥ 27 + comorbidade", "Sem contraindicações cardiovasculares"],
        contraindicacoes: [
          "Doença cardiovascular estabelecida (IAM, AVC, IC)",
          "HAS não controlada (PA > 145/90 mmHg)",
          "Arritmias cardíacas",
          "Hipertireoidismo",
          "Uso concomitante de IMAO (intervalo mínimo 14 dias)",
          "Transtorno de humor não controlado",
        ],
        efeitosAdversos: [
          "Boca seca, constipação, insônia",
          "Elevação de PA e FC (monitorar obrigatório)",
          "Cefaleia, tontura",
          "Sudorese",
        ],
        interacoes: [
          "IMAO: síndrome serotoninérgica fatal — contraindicação absoluta",
          "Triptanos, ISRS, IRSN: risco de síndrome serotoninérgica",
          "Ergotamínicos: vasoconstrição",
        ],
        monitoramento: [
          "PA e FC em toda consulta — suspender se PA > 145/90 ou FC > 100",
          "Peso mensal",
          "Sintomas cardiovasculares",
        ],
        notas: [
          "Receita especial (tarja preta) — uso controlado no Brasil.",
          "Não usar por mais de 2 anos contínuos.",
          "Associar obrigatoriamente a MEV — não é monoterapia.",
        ],
      },
      {
        id: "bupropiona_naltrexona",
        nome: "Bupropiona + Naltrexona",
        nomesComerciais: ["Contrave® (8mg/90mg por comprimido)"],
        linha: "segunda",
        via: "VO",
        doseInicial: "1 cp (8/90mg) pela manhã × 1 semana",
        titulacao: [
          { semana: 1, dose: "1 cp manhã" },
          { semana: 2, dose: "1 cp manhã + 1 cp noite" },
          { semana: 3, dose: "2 cp manhã + 1 cp noite" },
          { semana: 4, dose: "2 cp manhã + 2 cp noite", nota: "Dose máxima: 4 cp/dia" },
        ],
        mecanismo: "Bupropiona: inibidor de recaptação de DA/NA + ativação POMC. Naltrexona: antagonista opioide — potencializa saciedade hipotalâmica.",
        indicacoes: ["IMC ≥ 30", "IMC ≥ 27 + comorbidade", "Especialmente indicado em compulsão alimentar"],
        contraindicacoes: [
          "Epilepsia ou histórico de convulsões",
          "Bulimia ou anorexia nervosa",
          "Uso de IMAO (intervalo ≥ 14 dias)",
          "Dependência de opioides em tratamento com agonistas (metadona, buprenorfina)",
          "HAS grave não controlada",
          "Gravidez",
        ],
        efeitosAdversos: [
          "Náusea (muito comum — melhor administrar com alimentos)",
          "Cefaleia, insônia, boca seca",
          "Constipação, tontura",
          "Aumento de PA (monitorar)",
        ],
        interacoes: [
          "IMAO: risco de crise hipertensiva",
          "Opioides: antagonismo — reduz efeito analgésico",
          "Tamoxifeno: bupropiona inibe CYP2D6",
          "Carbamazepina, rifampicina: indutores de CYP2B6 — reduzem efeito",
        ],
        monitoramento: ["PA, FC a cada consulta", "Peso mensal", "Humor (risco de alterações em depressão)"],
        notas: [
          "Não mastigar nem partir os comprimidos.",
          "Tomar com alimentos para reduzir náusea.",
          "Avaliar resposta em 12 semanas — suspender se < 5% de perda de peso.",
        ],
      },
    ],
  },

  // ── DM2 ────────────────────────────────────────────────────────────────────
  {
    id: "dm2",
    nome: "Diabetes Mellitus Tipo 2",
    categoria: "Metabolismo",
    medicamentos: [
      {
        id: "metformina",
        nome: "Metformina",
        nomesComerciais: ["Glifage XR®", "Glucoformin®", "Metformina genérico"],
        linha: "primeira",
        via: "VO",
        doseInicial: "500 mg/dia com jantar × 1–2 semanas",
        titulacao: [
          { semana: 1,  dose: "500 mg com jantar" },
          { semana: 2,  dose: "500 mg manhã + 500 mg jantar" },
          { semana: 4,  dose: "1000 mg manhã + 500 mg jantar" },
          { semana: 8,  dose: "1000 mg manhã + 1000 mg jantar", nota: "Dose máxima eficaz" },
        ],
        mecanismo: "Ativação de AMPK → reduz produção hepática de glicose, melhora sensibilidade periférica à insulina.",
        indicacoes: ["DM2 recém-diagnosticado (exceto contraindicações)", "Pré-diabetes (reduz progressão em 31%)", "Resistência insulínica + SOP"],
        contraindicacoes: [
          "TFG < 30 mL/min/1,73m² (suspender)",
          "TFG 30–45: usar com cautela, dose máxima 1000 mg/dia",
          "Insuficiência hepática grave",
          "Alcoolismo",
          "Contraste iodado: suspender no dia do exame e 48h depois se TFG < 60",
        ],
        efeitosAdversos: [
          "Náusea, diarreia, dor abdominal (dose-dependente — reduzir com titulação lenta)",
          "Deficiência de vitamina B12 (uso prolongado — dosar anualmente)",
          "Acidose láctica (muito raro, principalmente em hipóxia/insuficiência renal)",
        ],
        interacoes: [
          "Contraste iodado: risco de acidose láctica — suspender antes",
          "Álcool: potencializa acidose láctica",
          "Cimetidina: aumenta nível sérico de metformina",
        ],
        monitoramento: ["HbA1c a cada 3 meses (meta < 7%)", "TFG e creatinina anualmente", "Vitamina B12 anualmente"],
        notas: ["Preferir formulação XR (liberação prolongada) — melhor tolerabilidade GI.", "Tomar com ou imediatamente após as refeições."],
      },
      {
        id: "dapagliflozina",
        nome: "Dapagliflozina (iSGLT2)",
        nomesComerciais: ["Forxiga®", "Farxiga®"],
        linha: "primeira",
        via: "VO",
        doseInicial: "10 mg/dia (dose única — não há titulação)",
        mecanismo: "Inibidor de SGLT2 — impede reabsorção renal de glicose → glicosúria e perda calórica (~300 kcal/dia).",
        indicacoes: [
          "DM2 + DCV estabelecida (reduz eventos CV e mortalidade)",
          "DM2 + DRC (nefroproteção — reduz progressão)",
          "IC com fração de ejeção reduzida (com ou sem DM2)",
        ],
        contraindicacoes: [
          "TFG < 25 mL/min/1,73m² (sem benefício glicêmico, mas pode usar para IC/DRC)",
          "Infecções genitais recorrentes",
          "Cetoacidose diabética",
          "Gravidez",
        ],
        efeitosAdversos: [
          "Infecções genitais (candidíase vulvovaginal e balanite)",
          "ITU (menos comum que infecções genitais)",
          "Cetoacidose euglicêmica (rara — risco em jejum prolongado, cirurgia)",
          "Amputações de membros inferiores (canagliflozina > dapagliflozina)",
          "Hipotensão postural (especialmente com diuréticos)",
        ],
        interacoes: [
          "Diuréticos: risco de hipovolemia e hipotensão",
          "Insulina: reduzir dose ao iniciar (risco de hipoglicemia)",
        ],
        monitoramento: [
          "TFG e eletrólitos antes e após início",
          "PA (efeito anti-hipertensivo leve)",
          "Sintomas de infecção genital",
          "Suspender 3–5 dias antes de cirurgia (cetoacidose euglicêmica)",
        ],
      },
      {
        id: "empagliflozina",
        nome: "Empagliflozina (iSGLT2)",
        nomesComerciais: ["Jardiance®"],
        linha: "primeira",
        via: "VO",
        doseInicial: "10 mg/dia (pode aumentar para 25 mg/dia se necessário)",
        mecanismo: "Inibidor SGLT2 — perfil cardiovascular com maior evidência em redução de mortalidade (EMPA-REG OUTCOME).",
        indicacoes: ["DM2 + DCV estabelecida", "DM2 + DRC", "IC (HFrEF e HFpEF)"],
        contraindicacoes: ["TFG < 20 mL/min/1,73m² (IC) / < 30 (DM2)", "Gravidez", "Cetoacidose"],
        efeitosAdversos: ["Infecções genitais", "ITU", "Cetoacidose euglicêmica", "Hipotensão"],
        interacoes: ["Diuréticos, insulina: mesmas da dapagliflozina"],
        monitoramento: ["TFG, eletrólitos", "PA", "Peso"],
        diferencial: "EMPA-REG: reduziu mortalidade CV em 38% e hospitalização por IC em 35% em DM2 + DCV.",
      },
      {
        id: "glimepirida",
        nome: "Glimepirida (Sulfonilureia)",
        nomesComerciais: ["Amaryl®", "Glimepirida genérico"],
        linha: "segunda",
        via: "VO",
        doseInicial: "1–2 mg/dia com o café da manhã",
        doseManutencao: "2–8 mg/dia (máx 8 mg/dia)",
        mecanismo: "Secretagogo — fecha canais de K+ nas células beta → despolarização → secreção de insulina.",
        indicacoes: ["DM2 sem risco cardiovascular aumentado", "Associação com metformina quando HbA1c > 9%"],
        contraindicacoes: ["DM1 ou LADA", "Insuficiência hepática ou renal grave", "Gravidez", "Hipoglicemia frequente"],
        efeitosAdversos: ["Hipoglicemia (principal risco — especialmente em idosos, jejum, exercício)", "Ganho de peso (1–2 kg)", "Náusea, diarreia"],
        interacoes: ["AINEs, fluconazol, sulfonamidas: potencializam hipoglicemia", "Rifampicina, corticoides: reduzem efeito"],
        monitoramento: ["HbA1c trimestralmente", "Glicemia capilar (hipoglicemia)", "Peso"],
        notas: ["Evitar em idosos frágeis — risco elevado de hipoglicemia grave.", "Tomar com primeira refeição do dia."],
      },
      {
        id: "sitagliptina",
        nome: "Sitagliptina (iDPP-4)",
        nomesComerciais: ["Januvia®", "Sitagliptina genérico"],
        linha: "segunda",
        via: "VO",
        doseInicial: "100 mg/dia (dose única — sem titulação)",
        doseManutencao: "50 mg/dia se TFG 30–50; 25 mg/dia se TFG < 30",
        mecanismo: "Inibe DPP-4 → prolonga ação de GLP-1 e GIP endógenos → aumento de insulina glicose-dependente.",
        indicacoes: ["DM2 como segunda linha após metformina", "Idosos (baixo risco de hipoglicemia)", "TFG ≥ 30 (com ajuste de dose)"],
        contraindicacoes: ["DM1", "Cetoacidose", "Hipersensibilidade ao produto"],
        efeitosAdversos: ["Nasofaringite, infecções do trato respiratório superior", "Artralgia (raro, mas incapacitante)", "Pancreatite (raro)"],
        interacoes: ["Digoxina: leve aumento nos níveis", "Poucas interações relevantes"],
        monitoramento: ["HbA1c trimestralmente", "Função renal anualmente"],
        notas: ["Neutro em peso — vantagem em pacientes que não toleram ganho de peso.", "Seguro em IC — não piora eventos."],
      },
    ],
  },

  // ── HIPOTIREOIDISMO ─────────────────────────────────────────────────────────
  {
    id: "hipotireoidismo",
    nome: "Hipotireoidismo",
    categoria: "Tireoide",
    medicamentos: [
      {
        id: "levotiroxina",
        nome: "Levotiroxina (LT4)",
        nomesComerciais: ["Puran T4®", "Euthyrox®", "Synthroid® (EUA)", "Levotiroxina genérico"],
        linha: "primeira",
        via: "VO",
        doseInicial: "1,6 mcg/kg/dia (adultos saudáveis) · Iniciar com 25–50 mcg/dia em idosos ou cardiopatas",
        mecanismo: "Reposição do hormônio tireoidiano T4 — convertido perifericamente em T3 ativo.",
        indicacoes: [
          "Hipotireoidismo primário confirmado (TSH > 10 ou TSH > 4 com sintomas)",
          "Pós-tireoidectomia ou radioiodoterapia",
          "Hipotireoidismo central",
          "Hipotireoidismo na gestação (tratamento urgente)",
        ],
        contraindicacoes: [
          "Hipersensibilidade ao produto",
          "Tireotoxicose não tratada",
          "Insuficiência adrenal não tratada (corrigir antes de iniciar LT4)",
        ],
        efeitosAdversos: [
          "Palpitações, taquicardia (superdosagem)",
          "Insônia, irritabilidade, tremores (superdosagem)",
          "Perda de peso, sudorese (superdosagem)",
          "Osteoporose em uso prolongado com TSH suprimido",
        ],
        interacoes: [
          "Cálcio e ferro: reduzem absorção — separar por 4h",
          "Café e fibras: reduzem absorção — tomar 30–60 min antes",
          "Antiácidos (alumínio, magnésio): reduzem absorção",
          "Colestiramina, sucralfato: separar por 4h",
          "Fenitoína, rifampicina, carbamazepina: aumentam metabolismo — pode precisar dose maior",
        ],
        monitoramento: [
          "TSH após 6–8 semanas de cada ajuste de dose",
          "Meta TSH: 0,5–2,5 mUI/L (adultos jovens) · 1,0–4,0 mUI/L (idosos)",
          "Meta TSH na gestação: < 2,5 mUI/L no 1º tri; < 3,0 mUI/L no 2º–3º tri",
          "Densitometria óssea se TSH suprimido por > 1 ano",
        ],
        notas: [
          "Tomar em jejum, 30–60 min antes do café da manhã (ou 4h depois da última refeição).",
          "Dose por peso: ~1,6 mcg/kg/dia (adulto saudável); ~1,0 mcg/kg/dia (idoso, pós-TSH suprimido).",
          "Ajuste fino: aumentar/reduzir 12,5–25 mcg por vez. Reavaliar TSH após 6–8 semanas.",
          "Gravidez: aumentar dose em ~30% logo ao confirmar gravidez.",
        ],
      },
      {
        id: "liotironina_combo",
        nome: "Levotiroxina + Liotironina (LT4 + LT3)",
        nomesComerciais: ["Combinação off-label: LT4 + Cytomel® (T3)"],
        linha: "segunda",
        via: "VO",
        doseInicial: "Reduzir LT4 em ~20 mcg, substituir por T3 5–10 mcg/dia (dividir em 2 doses)",
        mecanismo: "Combinação de T4 (depósito) + T3 (ativo) — beneficia pacientes com sintomas persistentes apesar de TSH normal.",
        indicacoes: [
          "Hipotireoidismo com sintomas residuais apesar de TSH normalizado em monoterapia com LT4",
          "Polimorfismo no gene da deiodinase (redução da conversão T4→T3)",
        ],
        contraindicacoes: ["Cardiopatia isquêmica", "Arritmias", "Idosos frágeis"],
        efeitosAdversos: ["Palpitações, taquicardia por pico de T3", "Insônia se dose vespertina tardia"],
        interacoes: ["Mesmas da levotiroxina"],
        monitoramento: ["TSH + T3 livre após 6 semanas", "Sintomas cardiovasculares"],
        notas: ["T3 tem meia-vida de 1 dia — fracionar em 2x/dia para evitar picos.", "Evidência limitada — individualizar conforme sintomas e T3L basal."],
      },
    ],
  },

  // ── HIPOTIREOIDISMO SUBCLÍNICO ──────────────────────────────────────────────
  {
    id: "hipotireoidismo_sub",
    nome: "Hipotireoidismo Subclínico",
    categoria: "Tireoide",
    medicamentos: [
      {
        id: "levotiroxina_sub",
        nome: "Levotiroxina (LT4) — Subclínico",
        nomesComerciais: ["Puran T4®", "Euthyrox®"],
        linha: "primeira",
        via: "VO",
        doseInicial: "25–50 mcg/dia (doses menores que no hipotireoidismo franco)",
        mecanismo: "Reposição hormonal mínima para normalizar TSH sem supressão.",
        indicacoes: [
          "TSH > 10 mUI/L (tratar independente dos sintomas)",
          "TSH 4–10 + sintomas clínicos significativos (fadiga, ganho de peso, depressão)",
          "TSH 4–10 + gravidez ou planejamento reprodutivo",
          "TSH 4–10 + Anti-TPO positivo (maior risco de progressão)",
        ],
        contraindicacoes: ["TSH 4–10 assintomático em > 65 anos — observar antes de tratar", "Hipersensibilidade"],
        efeitosAdversos: ["Palpitações se superdosagem", "Osteoporose se TSH suprimido"],
        interacoes: ["Cálcio, ferro: separar por 4h"],
        monitoramento: ["TSH após 6–8 semanas", "Meta TSH: 1,0–2,5 mUI/L", "Repetir TSH se decidir não tratar: a cada 6–12 meses"],
        notas: [
          "Em > 65 anos: TSH até 6–7 pode ser fisiológico — evitar tratar se assintomático.",
          "Decidir tratar vs. observar: avaliar sintomas, Anti-TPO, tendência de TSH e contexto reprodutivo.",
          "Titular lentamente: aumentar 12,5 mcg a cada 6–8 semanas até normalizar TSH.",
        ],
      },
    ],
  },

  // ── ANDROPAUSA / HIPOGONADISMO ──────────────────────────────────────────────
  {
    id: "andropausa",
    nome: "Andropausa / Hipogonadismo Masculino",
    categoria: "Hormônios",
    medicamentos: [
      {
        id: "testo_gel",
        nome: "Testosterona Gel 2%",
        nomesComerciais: ["Androgel®", "Testogel®", "Testim®"],
        linha: "primeira",
        via: "Tópica",
        doseInicial: "50 mg/dia (2,5g de gel) nos ombros ou abdome",
        doseManutencao: "25–100 mg/dia conforme testosterona total e sintomas",
        mecanismo: "Reposição transdérmica de testosterona — níveis mais estáveis que injetável, sem picos.",
        indicacoes: [
          "Hipogonadismo masculino confirmado (T < 300 ng/dL em 2 medições matinais)",
          "Sintomas: fadiga, disfunção erétil, sarcopenia, depressão, libido reduzida",
          "Excluir causas tratáveis: obesidade, hiperprolactinemia, hemossiderose",
        ],
        contraindicacoes: [
          "Câncer de próstata ou mama",
          "Policitemia não tratada (Ht > 52%)",
          "Apneia do sono grave não tratada",
          "Desejo de fertilidade (suprime espermatogênese — usar clomifeno/HCG)",
          "ICC descompensada",
        ],
        efeitosAdversos: [
          "Eritrocitose (hematócrito elevado — dose-dependente)",
          "Acne, seborréia",
          "Transferência cutânea para parceira/crianças",
          "Ginecomastia (aromatização para estradiol)",
          "Supressão da espermatogênese",
        ],
        interacoes: ["Anticoagulantes orais: monitorar RNI", "Insulina: pode reduzir necessidade"],
        monitoramento: [
          "Testosterona total (manhã, 2h após aplicação) após 2–4 semanas",
          "Hemograma (eritrocitose) a cada 3–6 meses",
          "PSA e toque retal anual (> 40 anos ou > 45 com HF de Ca próstata)",
          "Estradiol (E2) se ginecomastia ou sintomas de excesso de estrogênio",
          "SHBG para calcular T livre",
        ],
        notas: [
          "Não aplicar em genitais.",
          "Lavar as mãos após aplicação; cobrir o local antes de contato com outros.",
          "Meta T total: 400–700 ng/dL — não almejar máximo da referência.",
        ],
      },
      {
        id: "testo_cipionato",
        nome: "Testosterona Cipionato (injetável)",
        nomesComerciais: ["Deposteron®", "Deposterona®"],
        linha: "primeira",
        via: "IM",
        doseInicial: "200 mg IM a cada 2 semanas (ou 100 mg IM a cada semana para nível mais estável)",
        doseManutencao: "100–200 mg/semana ou 200 mg/quinzenal",
        mecanismo: "Éster de testosterona de liberação intermediária (~8 dias de meia-vida).",
        indicacoes: ["Hipogonadismo masculino", "Preferência por injetável vs. diário"],
        contraindicacoes: ["Mesmas do gel de testosterona"],
        efeitosAdversos: ["Picos e vales de T (humor instável entre aplicações)", "Eritrocitose", "Dor no local de aplicação"],
        interacoes: ["Anticoagulantes: monitorar"],
        monitoramento: ["T total: dosar no vale (antes da próxima aplicação)", "Hemograma, PSA"],
        notas: ["Aplicar em glúteo — rodiziar lados.", "Para níveis mais estáveis: preferir aplicações semanais de dose menor."],
      },
      {
        id: "testo_undecanoato",
        nome: "Testosterona Undecanoato (injetável)",
        nomesComerciais: ["Nebido®"],
        linha: "primeira",
        via: "IM",
        doseInicial: "1000 mg IM — 2ª dose após 6 semanas, depois a cada 12 semanas",
        mecanismo: "Éster de liberação prolongada — 10–14 semanas de duração. Máxima comodidade (4 injeções/ano).",
        indicacoes: ["Hipogonadismo masculino — preferência por menor frequência de injeções"],
        contraindicacoes: ["Mesmas da testosterona"],
        efeitosAdversos: ["Embolia (injeção rápida) — administrar lentamente em 2 min", "Eritrocitose", "Acne"],
        interacoes: ["Anticoagulantes"],
        monitoramento: ["T total: dosar na metade do intervalo (semana 6 do ciclo de 12)", "Hemograma, PSA anual"],
        notas: ["Injeção MUITO lenta (≥ 2 min) — risco de microembolia pulmonar se rápida.", "Permanecer em observação 30 min após a injeção."],
      },
      {
        id: "clomifeno",
        nome: "Clomifeno (off-label)",
        nomesComerciais: ["Indux®", "Serofene®", "Clomid®"],
        linha: "adjuvante",
        via: "VO",
        doseInicial: "25 mg/dia em dias alternados (ou 50 mg 3x/semana)",
        doseManutencao: "25–50 mg/dia — ajustar por LH, FSH e T",
        mecanismo: "Modulador seletivo de receptor estrogênico (SERM) — bloqueia feedback negativo de E2 no hipotálamo → aumenta GnRH → LH/FSH → produção endógena de T.",
        indicacoes: [
          "Hipogonadismo hipogonadotrófico leve-moderado",
          "Desejo de preservar fertilidade (não suprime espermatogênese)",
          "Resistência à TRT convencional ou preferência por oral",
        ],
        contraindicacoes: ["Doenças hepáticas", "Tumores testiculares", "Obstrução biliar"],
        efeitosAdversos: ["Alterações visuais (scotomas — raro)", "Ginecomastia", "Humor lábil"],
        interacoes: ["Poucas interações relevantes"],
        monitoramento: ["LH, FSH, T total após 4–6 semanas", "E2 (pode elevar)", "Hemograma"],
        notas: ["Uso off-label no Brasil — não aprovado para TRT masculina.", "Alternativa em homens jovens que desejam filhos.", "Eficácia menor que TRT convencional em hipogonadismo moderado-grave."],
      },
    ],
  },

  // ── MENOPAUSA / TRH ─────────────────────────────────────────────────────────
  {
    id: "menopausa",
    nome: "Menopausa / Terapia de Reposição Hormonal",
    categoria: "Hormônios",
    medicamentos: [
      {
        id: "estradiol_gel",
        nome: "Estradiol Gel 0,1%",
        nomesComerciais: ["Oestrogel®", "Estrogel®"],
        linha: "primeira",
        via: "Transdérmica",
        doseInicial: "1,5 g/dia (1 dose = 1,5 mg de estradiol) em braços ou abdome",
        doseManutencao: "1,5–3,0 g/dia (0,5–1 medida/dia)",
        mecanismo: "Reposição de estradiol via pele — evita metabolismo de primeira passagem hepático (menor risco trombótico vs. oral).",
        indicacoes: ["Sintomas climatéricos (fogachos, insônia, secura vaginal, humor)", "Prevenção de osteoporose pós-menopáusica", "Síndrome genitourinária da menopausa"],
        contraindicacoes: [
          "Câncer de mama (atual ou história) — contraindicação absoluta",
          "Câncer de endométrio dependente de estrogênio",
          "TEP ou TVP em uso de estrogênio",
          "AVC ou IAM recente",
          "Sangramento uterino a esclarecer",
          "Doença hepática ativa",
        ],
        efeitosAdversos: ["Retenção hídrica", "Mastalgia", "Sangramento irregular", "Cefaleia", "Tromboembolismo (menor risco com via transdérmica)"],
        interacoes: ["Rifampicina, carbamazepina: reduzem efeito", "Anticoagulantes: pode alterar necessidade"],
        monitoramento: [
          "Mamografia anual (ou bianual conforme risco)",
          "Ultrassom transvaginal se sangramento",
          "PA a cada consulta",
          "Perfil lipídico e hepático anualmente",
          "Densitometria óssea a cada 2 anos",
        ],
        notas: [
          "Sempre associar progestagênio em mulheres com útero intacto para proteção endometrial.",
          "Via transdérmica: menor risco tromboembólico vs. estradiol oral.",
          "Iniciar com dose mínima eficaz — individualizar conforme sintomas e tolerância.",
        ],
      },
      {
        id: "estradiol_patch",
        nome: "Estradiol Adesivo (Patch)",
        nomesComerciais: ["Estraderm TTS®", "Climara®", "Systen®"],
        linha: "primeira",
        via: "Transdérmica",
        doseInicial: "25–50 mcg/24h (patch semanal ou bissemanal)",
        doseManutencao: "25–100 mcg/24h conforme sintomas",
        mecanismo: "Liberação contínua de estradiol transdérmico — compliance superior ao gel.",
        indicacoes: ["Mesmas do estradiol gel", "Preferência por aplicação menos frequente"],
        contraindicacoes: ["Mesmas do estradiol gel"],
        efeitosAdversos: ["Irritação cutânea no local de aplicação", "Mesmos do gel"],
        interacoes: ["Mesmas do gel"],
        monitoramento: ["Mamografia, ultrassom, PA"],
        notas: ["Aplicar em quadril, nádegas ou abdome — evitar seios.", "Trocar 2x/semana (bissemanal) ou 1x/semana (semanal) conforme produto.", "Rodiziar locais de aplicação."],
      },
      {
        id: "progesterona_micro",
        nome: "Progesterona Micronizada",
        nomesComerciais: ["Utrogestan®", "Prometrium®"],
        linha: "primeira",
        via: "VO",
        doseInicial: "200 mg/dia por 12–14 dias/mês (cíclico) ou 100 mg/dia contínuo",
        mecanismo: "Progesterona natural bioidentical — protege o endométrio da hiperplasia induzida pelo estrogênio.",
        indicacoes: ["Mulheres com útero intacto em TRH — obrigatória a proteção endometrial"],
        contraindicacoes: ["Sangramento vaginal inexplicado", "Doença hepática grave", "Trombose ativa"],
        efeitosAdversos: ["Sonolência (vantagem: tomar à noite)", "Dizziness", "Mastalgia"],
        interacoes: ["Rifampicina, carbamazepina: reduzem efeito"],
        monitoramento: ["Sintomas endometriais", "USG transvaginal se sangramento anormal"],
        notas: ["Preferir progesterona micronizada à sintética (menor risco de CA mama vs. MPA).", "Tomar sempre à noite (efeito sedativo é benéfico em insônia climaterica)."],
      },
      {
        id: "tibolona",
        nome: "Tibolona",
        nomesComerciais: ["Livial®"],
        linha: "segunda",
        via: "VO",
        doseInicial: "2,5 mg/dia contínuo",
        mecanismo: "Esteroide sintético com atividade estrogênica, progestogênica e androgênica combinadas — efeito endometrial neutro (não precisa de progestagênio separado).",
        indicacoes: ["Menopausa estabelecida (> 1 ano de amenorreia) com fogachos e libido reduzida", "Quando paciente prefere não usar progestagênio separado"],
        contraindicacoes: ["Menopausa recente (< 1 ano) — risco de sangramento", "Mesmas do estradiol para DCV e CA mama", "AVC — contraindicação absoluta (LIFT trial)"],
        efeitosAdversos: ["Sangramento vaginal irregular", "Cefaleia", "Ginecomastia"],
        interacoes: ["Anticoagulantes", "Rifampicina"],
        monitoramento: ["PA, USG se sangramento", "Mamografia anual"],
        notas: ["Não usar em menopausa recente — esperar > 1 ano após última menstruação.", "Melhora libido por componente androgênico.", "Não usar junto com TRH estrogênica — redundância."],
      },
    ],
  },

  // ── VITAMINA D ──────────────────────────────────────────────────────────────
  {
    id: "vitd",
    nome: "Deficiência de Vitamina D",
    categoria: "Nutrologia",
    medicamentos: [
      {
        id: "colecalciferol",
        nome: "Colecalciferol (Vitamina D3)",
        nomesComerciais: ["Bio-D3®", "Depura®", "Addera D3®", "Ossomag D3®"],
        linha: "primeira",
        via: "VO",
        doseInicial: "< 20 ng/mL: 50.000 UI/semana × 8–12 semanas (reposição). 20–30 ng/mL: 2.000–4.000 UI/dia.",
        doseManutencao: "1.000–5.000 UI/dia conforme nível alvo",
        mecanismo: "Precursor da vitamina D — convertido no fígado (25-OH) e rim (1,25-OH = calcitriol ativo).",
        indicacoes: [
          "25-OH-VitD < 20 ng/mL (deficiência)",
          "25-OH-VitD 20–30 ng/mL com sintomas ou fatores de risco",
          "Manutenção de nível funcional 50–80 ng/mL em pacientes selecionados",
        ],
        contraindicacoes: [
          "Hipercalcemia",
          "Hipervitaminose D",
          "Sarcoidose, tuberculose ativa (produção excessiva de calcitriol)",
          "Nefrolitíase cálcica (relativa)",
        ],
        efeitosAdversos: [
          "Toxicidade rara — apenas com > 150 ng/mL ou suplementação crônica excessiva",
          "Hipercalcemia (fraqueza, poliúria, polidipsia, nefrolitíase)",
          "Hipercalciúria",
        ],
        interacoes: [
          "Tiazídicos: aumentam risco de hipercalcemia",
          "Colestiramina, óleo mineral: reduzem absorção",
          "Antiepilépticos (fenitoína, fenobarbital): aumentam metabolismo da VitD",
        ],
        monitoramento: [
          "25-OH-VitD após 3 meses de reposição",
          "Cálcio sérico e calciúria 24h em doses altas (> 10.000 UI/dia)",
          "PTH antes do início e após normalização",
        ],
        notas: [
          "Tomar com refeição gordurosa — vitamina D é lipossolúvel, absorção aumenta 50%.",
          "Nível alvo laboratorial: > 30 ng/mL. Funcional: 50–80 ng/mL.",
          "Magnésio é cofator para conversão de VitD — tratar hipomagnesemia concomitante.",
          "Associar com vitamina K2 (MK-7, 100–200 mcg/dia) em doses altas para proteção cardiovascular e óssea.",
        ],
      },
    ],
  },

  // ── DEFICIÊNCIA DE FERRO ────────────────────────────────────────────────────
  {
    id: "ferro_def",
    nome: "Deficiência de Ferro / Anemia Ferropriva",
    categoria: "Nutrologia",
    medicamentos: [
      {
        id: "bisglicinato",
        nome: "Bisglicinato Ferroso",
        nomesComerciais: ["Vitafer®", "TheraCal®", "Combiron®", "Ferrochel®"],
        linha: "primeira",
        via: "VO",
        doseInicial: "30–60 mg de ferro elementar/dia (1 dose ou dividido em 2)",
        doseManutencao: "30 mg/dia (manutenção após normalização de ferritina)",
        mecanismo: "Ferro quelado com glicina — maior biodisponibilidade e menor irritação GI que sulfato ferroso.",
        indicacoes: ["Ferritina < 30 ng/mL", "Ferritina < 50 ng/mL com sintomas (queda de cabelo, fadiga, FOG)"],
        contraindicacoes: ["Sobrecarga de ferro (hemocromatose)", "Anemia de doença crônica sem depleção real"],
        efeitosAdversos: [
          "Constipação, escurecimento das fezes (leve)",
          "Náusea (menor que sulfato ferroso)",
          "Menos efeitos GI que formas inorgânicas",
        ],
        interacoes: [
          "Levotiroxina: separar por 4h",
          "Cálcio, antiácidos, chá, café: reduzem absorção — separar por 2h",
          "Ciprofloxacino, tetraciclina: quelação — separar por 2h",
        ],
        monitoramento: [
          "Ferritina após 3 meses de reposição",
          "Hemograma (Hb deve aumentar 1–2 g/dL em 4 semanas se respondedor)",
          "Reticulócitos em 1 semana (pico reticulocitário = confirmação diagnóstica)",
        ],
        notas: [
          "Tomar em jejum (30 min antes das refeições) com vitamina C para melhorar absorção.",
          "Bisglicinato pode ser tomado com alimentos se intolerância — menor perda de absorção que sulfato.",
          "Manter reposição por 3–6 meses após normalização para repor estoques (ferritina > 50).",
        ],
      },
      {
        id: "sulfato_ferroso",
        nome: "Sulfato Ferroso",
        nomesComerciais: ["Noripurum VO®", "Sulfato Ferroso genérico"],
        linha: "primeira",
        via: "VO",
        doseInicial: "60 mg de ferro elementar 2–3x/dia em dias alternados (melhor absorção e menor EAs)",
        mecanismo: "Sal inorgânico ferroso — baixo custo, mas maior irritação GI.",
        indicacoes: ["Anemia ferropriva", "Deficiência de ferro com intolerância ao bisglicinato não confirmada"],
        contraindicacoes: ["Sobrecarga de ferro"],
        efeitosAdversos: ["Constipação (muito comum)", "Dor epigástrica, náusea", "Escurecimento das fezes"],
        interacoes: ["Mesmas do bisglicinato"],
        monitoramento: ["Hemograma, ferritina após 3 meses"],
        notas: ["Dias alternados têm eficácia igual com menos EAs (upregula hepcidina — bloqueia absorção nas 24h seguintes).", "Considerar bisglicinato se intolerância GI."],
      },
      {
        id: "carboximaltose",
        nome: "Carboximaltose Férrica (EV)",
        nomesComerciais: ["Ferinject®"],
        linha: "segunda",
        via: "EV",
        doseInicial: "500–1000 mg EV em dose única (máx 1000 mg/sessão)",
        doseManutencao: "Calcular dose total por Ganzoni: Peso × (Hb alvo − Hb atual) × 2,4 + 500",
        mecanismo: "Complexo de ferro EV de alta estabilidade — permite administração de grandes doses em única infusão.",
        indicacoes: [
          "Intolerância ao ferro oral",
          "Má absorção (doença celíaca, EII, gastrectomia)",
          "Anemia grave pré-operatória (≥ 2 g/dL abaixo do normal)",
          "DRC em hemodiálise",
          "IC com ferritina < 100 ou 100–300 + sat < 20%",
        ],
        contraindicacoes: [
          "1º trimestre de gestação",
          "Anemia não ferropriva",
          "Sobrecarga de ferro",
          "Hipersensibilidade conhecida",
        ],
        efeitosAdversos: [
          "Reação de hipersensibilidade (raro — observar 30 min após infusão)",
          "Hipofosfatemia (mais comum que com outras formulações EV)",
          "Rubor facial, cefaleia durante infusão",
          "Escurecimento da pele no local de extravasamento",
        ],
        interacoes: ["Não misturar com outros medicamentos na mesma infusão"],
        monitoramento: [
          "Ferritina, sat transferrina 4–8 semanas após última infusão",
          "Hemograma (Hb deve normalizar em 4–8 semanas)",
          "Fósforo sérico (hipofosfatemia pode ser intensa — suplementar se necessário)",
        ],
        notas: [
          "Vantagem: 1 infusão de até 1000 mg — reduz visitas ao serviço vs. sacarato.",
          "Infundir em 15 min (para 500 mg) ou 30 min (para 1000 mg) em SF 0,9%.",
          "Observar o paciente por 30 min após a infusão.",
          "Usar calculadora de Ganzoni para dose exata (disponível nas Calculadoras do sistema).",
        ],
      },
      {
        id: "sacarato",
        nome: "Sacarato de Hidróxido de Ferro III (EV)",
        nomesComerciais: ["Noripurum EV®", "Venofer®"],
        linha: "segunda",
        via: "EV",
        doseInicial: "100–200 mg EV por sessão (máx 200 mg/infusão), 2–3x/semana",
        mecanismo: "Complexo de ferro EV — menor dose por sessão, maior número de infusões.",
        indicacoes: ["Deficiência de ferro quando ferro oral não tolerado", "DRC em hemodiálise (na linha de diálise)"],
        contraindicacoes: ["Mesmas da carboximaltose"],
        efeitosAdversos: ["Hipotensão (infusão rápida)", "Febre, artralgia", "Reações alérgicas"],
        interacoes: ["Não misturar com outros medicamentos"],
        monitoramento: ["Ferritina, hemograma após série completa"],
        notas: ["Calcular número de sessões: dose total (Ganzoni) ÷ 200 mg/sessão.", "Preferir carboximaltose quando disponível — menos sessões, maior conveniência."],
      },
    ],
  },
]

// ─── Config maps ──────────────────────────────────────────────────────────────

const LINHA_CONFIG: Record<Linha, { label: string; color: string; bg: string; border: string }> = {
  primeira:  { label: "1ª linha",   color: "text-green-400",  bg: "bg-green-950/40",  border: "border-green-500/30"  },
  segunda:   { label: "2ª linha",   color: "text-amber-400",  bg: "bg-amber-950/40",  border: "border-amber-500/30"  },
  terceira:  { label: "3ª linha",   color: "text-orange-400", bg: "bg-orange-950/40", border: "border-orange-500/30" },
  adjuvante: { label: "Adjuvante",  color: "text-purple-400", bg: "bg-purple-950/40", border: "border-purple-500/30" },
}

const VIA_LABELS: Record<Via, string> = {
  SC: "Subcutâneo", IM: "Intramuscular", VO: "Via oral",
  Vaginal: "Vaginal", Transdérmica: "Transdérmica", Tópica: "Tópica", EV: "Endovenoso",
}

const CATEGORIAS = Array.from(new Set(DIAGNOSTICOS.map(d => d.categoria)))

// ─── Components ───────────────────────────────────────────────────────────────

function LinhaBadge({ linha }: { linha: Linha }) {
  const c = LINHA_CONFIG[linha]
  return (
    <span className={cn("text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1", c.color, c.bg, c.border)}>
      {linha === "primeira" && <Star className="w-2.5 h-2.5" />}
      {c.label}
    </span>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function BulletList({ items, color = "var(--text-secondary)", icon = "▸", iconColor }: {
  items: string[]; color?: string; icon?: string; iconColor?: string
}) {
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-[9px] font-mono mt-0.5 flex-shrink-0" style={{ color: iconColor ?? "var(--accent)" }}>
            {icon}
          </span>
          <span className="text-[11px] leading-relaxed" style={{ color }}>{item}</span>
        </div>
      ))}
    </div>
  )
}

function MedCard({
  med, copied, onCopy,
}: {
  med: Medicamento; copied: string | null; onCopy: (id: string, text: string) => void
}) {
  const [open, setOpen] = useState(false)
  const linhaCfg = LINHA_CONFIG[med.linha]

  const copyText = [
    `${med.nome} (${med.nomesComerciais.join(", ")})`,
    `Via: ${VIA_LABELS[med.via]} · ${LINHA_CONFIG[med.linha].label}`,
    `Dose inicial: ${med.doseInicial}`,
    med.titulacao ? `\nTitulação:\n${med.titulacao.map(t => `  ${t.semana ? `Sem. ${t.semana}` : `Dia ${t.dia}`}: ${t.dose}${t.nota ? ` — ${t.nota}` : ""}`).join("\n")}` : "",
    `\nContraindicações:\n${med.contraindicacoes.map(c => `  • ${c}`).join("\n")}`,
    `\nEfeitos adversos:\n${med.efeitosAdversos.map(e => `  • ${e}`).join("\n")}`,
    `\nMonitoramento:\n${med.monitoramento.map(m => `  • ${m}`).join("\n")}`,
    med.notas ? `\nNotas:\n${med.notas.map(n => `  • ${n}`).join("\n")}` : "",
  ].filter(Boolean).join("\n")

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/[0.02]"
        style={{ background: "var(--card)" }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <Pill className="w-3.5 h-3.5 flex-shrink-0" style={{ color: linhaCfg.color.replace("text-", "#").replace("-400", "") ?? "var(--accent)" }} />
          <div className="text-left">
            <span className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>{med.nome}</span>
            <span className="ml-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
              {med.nomesComerciais[0]}
            </span>
          </div>
          <LinhaBadge linha={med.linha} />
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
            {VIA_LABELS[med.via]}
          </span>
        </div>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
          : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
          <div className="pt-4 space-y-4">

            {/* Mecanismo + Diferencial */}
            {(med.mecanismo || med.diferencial) && (
              <div className="rounded-lg p-3" style={{ background: "rgba(0,192,127,0.05)", border: "1px solid rgba(0,192,127,0.15)" }}>
                {med.mecanismo && (
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    <span className="font-semibold" style={{ color: "var(--accent)" }}>Mecanismo: </span>
                    {med.mecanismo}
                  </p>
                )}
                {med.diferencial && (
                  <p className="text-[11px] leading-relaxed mt-1" style={{ color: "var(--text-secondary)" }}>
                    <span className="font-semibold" style={{ color: "#3b7fff" }}>Diferencial: </span>
                    {med.diferencial}
                  </p>
                )}
              </div>
            )}

            {/* Dose + Titulação */}
            <InfoRow label="Posologia">
              <div className="space-y-2">
                <div className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Início: {med.doseInicial}
                </div>
                {med.titulacao && (
                  <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    <div className="px-3 py-1.5" style={{ background: "var(--surface)" }}>
                      <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        Esquema de titulação
                      </span>
                    </div>
                    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {med.titulacao.map((t, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2">
                          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                            {t.semana ? `Semana ${t.semana}` : `Dia ${t.dia}`}
                          </span>
                          <div className="text-right">
                            <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
                              {t.dose}
                            </span>
                            {t.nota && (
                              <div className="text-[9px]" style={{ color: "var(--accent)" }}>{t.nota}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {med.doseManutencao && (
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Manutenção: {med.doseManutencao}
                  </div>
                )}
              </div>
            </InfoRow>

            {/* 4-col grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Indicações">
                <BulletList items={med.indicacoes} iconColor="#00c07f" />
              </InfoRow>
              <InfoRow label="Contraindicações">
                <div className="space-y-1.5">
                  {med.contraindicacoes.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5 text-red-400" />
                      <span className="text-[11px] leading-relaxed text-red-300">{c}</span>
                    </div>
                  ))}
                </div>
              </InfoRow>
              <InfoRow label="Efeitos Adversos">
                <BulletList items={med.efeitosAdversos} iconColor="#f59e0b" />
              </InfoRow>
              <InfoRow label="Interações Medicamentosas">
                <BulletList items={med.interacoes} iconColor="#f97316" />
              </InfoRow>
            </div>

            {/* Monitoramento */}
            <InfoRow label="Monitoramento">
              <div className="rounded-lg p-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <BulletList items={med.monitoramento} iconColor="#3b7fff" />
              </div>
            </InfoRow>

            {/* Notas */}
            {med.notas && (
              <InfoRow label="Notas Clínicas">
                <div className="rounded-lg p-3" style={{ background: "rgba(59,127,255,0.06)", border: "1px solid rgba(59,127,255,0.2)" }}>
                  <BulletList items={med.notas} iconColor="#3b7fff" />
                </div>
              </InfoRow>
            )}

            {/* Actions */}
            <div className="flex justify-end">
              <button
                onClick={() => onCopy(`med-${med.id}`, copyText)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                style={{
                  background: copied === `med-${med.id}` ? "var(--accent-dim)" : "var(--surface)",
                  border: `1px solid ${copied === `med-${med.id}` ? "var(--accent-border)" : "var(--border)"}`,
                  color: copied === `med-${med.id}` ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {copied === `med-${med.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === `med-${med.id}` ? "Copiado!" : "Copiar prescrição"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PrescricaoPage() {
  const [search,   setSearch]   = useState("")
  const [openDiag, setOpenDiag] = useState<Record<string, boolean>>(
    Object.fromEntries(DIAGNOSTICOS.map(d => [d.id, true]))
  )
  const [copied, setCopied] = useState<string | null>(null)
  const [catFilter, setCatFilter] = useState<string>("Todos")

  function copy(id: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return DIAGNOSTICOS
      .filter(d => catFilter === "Todos" || d.categoria === catFilter)
      .map(d => ({
        ...d,
        medicamentos: d.medicamentos.filter(m =>
          !q ||
          m.nome.toLowerCase().includes(q) ||
          m.nomesComerciais.some(n => n.toLowerCase().includes(q)) ||
          d.nome.toLowerCase().includes(q) ||
          m.indicacoes.some(i => i.toLowerCase().includes(q))
        ),
      }))
      .filter(d => d.medicamentos.length > 0)
  }, [search, catFilter])

  const totalMeds = DIAGNOSTICOS.reduce((s, d) => s + d.medicamentos.length, 0)

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Prescrição Assistida"
        subtitle="PROTOCOLOS CLÍNICOS · DOSES E TITULAÇÃO · CONTRAINDICAÇÕES E INTERAÇÕES"
        actions={
          <span className="text-[10px] font-mono px-3 py-1.5 rounded-lg border"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
            {totalMeds} medicamentos · {DIAGNOSTICOS.length} diagnósticos
          </span>
        }
      />

      <div className="p-4 md:p-8 space-y-5">

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar diagnóstico ou medicamento…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] outline-none"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["Todos", ...CATEGORIAS].map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className="text-[11px] px-3 py-2 rounded-lg transition-all"
                style={{
                  background: catFilter === cat ? "var(--accent-dim)" : "var(--surface)",
                  border: `1px solid ${catFilter === cat ? "var(--accent-border)" : "var(--border)"}`,
                  color: catFilter === cat ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px]">
          {(Object.entries(LINHA_CONFIG) as [Linha, typeof LINHA_CONFIG[Linha]][]).map(([k, v]) => (
            <div key={k} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border", v.color, v.bg, v.border)}>
              {k === "primeira" && <Star className="w-2.5 h-2.5" />}
              {v.label}
            </div>
          ))}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-blue-300 bg-blue-950/30 border-blue-500/20">
            <Info className="w-2.5 h-2.5" />Monitoramento obrigatório
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-red-300 bg-red-950/30 border-red-500/20">
            <Shield className="w-2.5 h-2.5" />Contraindicação listada
          </div>
        </div>

        {/* Accordion by diagnosis */}
        {filtered.map(diag => (
          <div key={diag.id} className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}>
            <button
              onClick={() => setOpenDiag(prev => ({ ...prev, [diag.id]: !prev[diag.id] }))}
              className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.02]"
              style={{ background: "var(--card)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)" }}>
                  <Pill className="w-4 h-4" style={{ color: "var(--accent)" }} />
                </div>
                <div className="text-left">
                  <div className="text-[14px] font-bold" style={{ color: "var(--text-primary)" }}>{diag.nome}</div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {diag.categoria.toUpperCase()} · {diag.medicamentos.length} MEDICAMENTO{diag.medicamentos.length !== 1 ? "S" : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {diag.medicamentos.filter(m => m.linha === "primeira").length > 0 && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full text-green-400 bg-green-950/40 border border-green-500/30">
                    <Star className="w-2.5 h-2.5 inline mr-0.5" />
                    {diag.medicamentos.filter(m => m.linha === "primeira").length} 1ª linha
                  </span>
                )}
                {openDiag[diag.id]
                  ? <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                  : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />}
              </div>
            </button>

            {openDiag[diag.id] && (
              <div className="p-4 space-y-3" style={{ background: "var(--background)", borderTop: "1px solid var(--border)" }}>
                {diag.medicamentos.map(med => (
                  <MedCard key={med.id} med={med} copied={copied} onCopy={copy} />
                ))}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Pill className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              Nenhum medicamento encontrado para &quot;{search}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

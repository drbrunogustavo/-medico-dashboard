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

  // ── GINECOLOGIA ──────────────────────────────────────────────────────────────
  {
    id: "sop",
    nome: "SOP — Síndrome do Ovário Policístico",
    categoria: "Ginecologia",
    medicamentos: [
      {
        id: "metformina-sop",
        nome: "Metformina",
        nomesComerciais: ["Glifage®", "Glucoformin®"],
        linha: "primeira",
        via: "VO",
        doseInicial: "500 mg 1x/dia com refeição",
        titulacao: [
          { semana: 1, dose: "500 mg 1x/dia" },
          { semana: 2, dose: "500 mg 2x/dia" },
          { semana: 4, dose: "850 mg 2x/dia" },
          { semana: 8, dose: "1.000 mg 2x/dia", nota: "Dose-alvo para SOP" },
        ],
        mecanismo: "Sensibilizador de insulina — reduz hiperinsulinemia, melhora ovulação e androgenismo na SOP com resistência insulínica.",
        indicacoes: ["SOP com resistência insulínica (HOMA-IR >2,5)", "SOP em obesas ou com pré-diabetes", "Indução de ovulação (associada ao citrato de clomifeno)"],
        contraindicacoes: ["TFGe <30 mL/min", "Uso de contraste iodado (suspender 48h)", "Gestação (categoria B — controverso, mas usado)", "Alcoolismo"],
        efeitosAdversos: ["Náusea, diarreia (transitórios — melhoram com titulação lenta)", "Deficiência de B12 (uso crônico — dosar anualmente)", "Gosto metálico"],
        interacoes: ["Álcool: risco de acidose lática (raro)", "Contraste iodado: suspender 48h antes/depois"],
        monitoramento: ["Função renal antes e a cada 6–12 meses", "B12 anualmente", "Glicemia e insulina de jejum (HOMA-IR)"],
        notas: ["Não é contraceptivo — orientar anticoncepção se necessário.", "Tomar com alimento para reduzir efeitos GI."],
      },
      {
        id: "mioinositol",
        nome: "Mioinositol",
        nomesComerciais: ["Inofolic®", "Ovafolic®"],
        linha: "primeira",
        via: "VO",
        doseInicial: "2.000 mg 2x/dia (total 4g/dia)",
        mecanismo: "Segundo mensageiro da insulina — melhora sensibilidade insulínica e restaura função ovariana na SOP.",
        indicacoes: ["SOP com ou sem resistência insulínica", "Melhora da regularidade menstrual e ovulação", "Redução de andrógenos"],
        contraindicacoes: ["Alergia ao produto"],
        efeitosAdversos: ["Náusea leve (geralmente transitória)", "Diarreia ocasional"],
        interacoes: [],
        monitoramento: ["Ciclo menstrual", "LH, FSH, testosterona em 3–6 meses"],
        notas: ["Associação mioinositol + ácido fólico 200 mcg: formulação preferida.", "Evidência sólida para restauração da ovulação."],
      },
      {
        id: "espironolactona-sop",
        nome: "Espironolactona",
        nomesComerciais: ["Aldactone®"],
        linha: "segunda",
        via: "VO",
        doseInicial: "25–50 mg/dia",
        doseManutencao: "100–200 mg/dia",
        mecanismo: "Anti-androgênico — bloqueia receptor de androgênio, reduz hirsutismo e acne na SOP.",
        indicacoes: ["SOP com hirsutismo e/ou acne", "SOP sem desejo de engravidar (necessita anticoncepção associada)"],
        contraindicacoes: ["Gravidez ou plano de gestação", "IRC grave (K+ >5,5)", "Hiperpotassemia"],
        efeitosAdversos: ["Hipercalemia", "Irregularidade menstrual (necessita ACO associado)", "Poliúria"],
        interacoes: ["IECA/BRA + espironolactona: risco alto de hipercalemia", "AINEs: reduzem efeito diurético"],
        monitoramento: ["K+ sérico 1 mês após início e a cada 6 meses", "PA"],
        notas: ["Sempre associar anticoncepção — teratogênica.", "Efeito no hirsutismo visível após 6 meses."],
      },
    ],
  },

  // ── CARDIOLOGIA ──────────────────────────────────────────────────────────────
  {
    id: "has",
    nome: "Hipertensão Arterial Sistêmica",
    categoria: "Cardiologia",
    medicamentos: [
      {
        id: "enalapril",
        nome: "Enalapril (IECA)",
        nomesComerciais: ["Vasotec®", "Renitec®"],
        linha: "primeira",
        via: "VO",
        doseInicial: "5 mg 1–2x/dia",
        doseManutencao: "10–40 mg/dia (1–2 tomadas)",
        mecanismo: "Inibidor da ECA — reduz angiotensina II e aldosterona. Efeito nefroprotetor em DM e microalbuminúria.",
        indicacoes: ["HAS", "DM + HAS (1ª escolha)", "IC com FE reduzida", "Pós-IAM com disfunção ventricular", "Nefropatia diabética"],
        contraindicacoes: ["Gravidez (2º e 3º trimestres) — teratogênico", "Angioedema prévio por IECA", "Estenose bilateral de artéria renal", "TFGe <30 (relativa)"],
        efeitosAdversos: ["Tosse seca (15–20% — principal causa de troca)", "Hipercalemia", "Hipotensão 1ª dose", "Angioedema (raro, grave)"],
        interacoes: ["AINEs: reduzem anti-hipertensivo + risco renal", "K+ / espironolactona: hipercalemia", "Lítio: aumenta nível sérico de lítio"],
        monitoramento: ["Creatinina e K+ em 1–2 semanas após início", "PA a cada consulta"],
        notas: ["Tosse seca: trocar por BRA (mesma classe funcional, sem tosse).", "Aumentar dose gradualmente a cada 2–4 semanas."],
      },
      {
        id: "losartana",
        nome: "Losartana (BRA)",
        nomesComerciais: ["Cozaar®", "Hyzaar® (+ hidroclorotiazida)"],
        linha: "primeira",
        via: "VO",
        doseInicial: "50 mg 1x/dia",
        doseManutencao: "50–100 mg/dia",
        mecanismo: "Bloqueador do receptor de angiotensina II (AT1) — mesmo benefício que IECA sem tosse.",
        indicacoes: ["HAS (especialmente se tosse por IECA)", "DM + HAS", "IC com FE reduzida intolerante a IECA", "Nefropatia diabética"],
        contraindicacoes: ["Gravidez", "Angioedema por BRA prévio", "Estenose bilateral de artéria renal"],
        efeitosAdversos: ["Hipercalemia (menos que IECA)", "Tontura", "Angioedema (mais raro que com IECA)"],
        interacoes: ["AINEs", "K+/espironolactona: hipercalemia"],
        monitoramento: ["Creatinina e K+ 1–2 semanas após início", "PA"],
        notas: ["Nunca combinar IECA + BRA — risco de hipercalemia e LRA sem benefício adicional."],
      },
      {
        id: "anlodipino",
        nome: "Anlodipino (Bloqueador de Ca²⁺)",
        nomesComerciais: ["Norvasc®", "Pressovasc®"],
        linha: "primeira",
        via: "VO",
        doseInicial: "5 mg 1x/dia",
        doseManutencao: "5–10 mg/dia",
        mecanismo: "Bloqueador de canais de cálcio di-hidropiridínico de longa ação — vasodilatação periférica.",
        indicacoes: ["HAS (especialmente em idosos e negros)", "HAS + angina estável", "HAS + DRC (sem microalbuminúria)"],
        contraindicacoes: ["IC com FE reduzida (diltiazem/verapamil — não anlodipino)", "Hipotensão"],
        efeitosAdversos: ["Edema de tornozelo (dose-dependente)", "Rubor facial", "Cefaleia"],
        interacoes: ["Sinvastatina/atorvastatina: aumenta risco de miopatia com sinvastatina >20 mg"],
        monitoramento: ["PA", "Edema de MMII"],
        diferencial: "Di-hidropiridínico (anlodipino): só efeito vascular. Não-di-hidropiridínico (diltiazem, verapamil): também reduz FC — usar com cuidado em IC.",
      },
    ],
  },

  // ── REUMATOLOGIA ─────────────────────────────────────────────────────────────
  {
    id: "artrite-reumatoide",
    nome: "Artrite Reumatoide",
    categoria: "Reumatologia",
    medicamentos: [
      {
        id: "metotrexato",
        nome: "Metotrexato (MTX)",
        nomesComerciais: ["Metoject® (SC)", "genérico (VO)"],
        linha: "primeira",
        via: "VO",
        doseInicial: "10–15 mg/semana (VO ou SC)",
        titulacao: [
          { semana: 1, dose: "10 mg/semana" },
          { semana: 4, dose: "15 mg/semana" },
          { semana: 8, dose: "20 mg/semana", nota: "Dose alvo" },
          { semana: 12, dose: "25 mg/semana", nota: "Se necessário" },
        ],
        mecanismo: "DMARD convencional — inibe dihidrofolato redutase → redução da proliferação de células imunes sinoviais.",
        indicacoes: ["AR — 1ª linha DMARD universal", "Espondilite anquilosante (periférica)", "Artrite psoriásica", "Lúpus (manifestações articulares)"],
        contraindicacoes: ["Gravidez e amamentação (categoria X)", "TFGe <30", "Hepatopatia grave", "Alcoolismo ativo", "Imunodepressão grave"],
        efeitosAdversos: ["Náusea, mucosite (ácido fólico previne)", "Hepatotoxicidade (dose e tempo dependente)", "Mielossupressão", "Pneumonite (rara — grave)", "Teratogenicidade"],
        interacoes: ["AINEs: reduzem excreção de MTX (toxicidade)", "Trimetoprima-SMX: antagonismo do folato", "Álcool: hepatotoxicidade sinérgica"],
        monitoramento: ["Hemograma, TGO, TGP, creatinina a cada 4–8 semanas (primeiros 6 meses)", "Após estabilização: a cada 3 meses", "Raio-X tórax anual"],
        notas: [
          "Sempre prescrever ácido fólico 5 mg/semana (no dia seguinte ao MTX) — reduz efeitos GI e mucosite.",
          "MTX SC tem maior biodisponibilidade e menos efeitos GI que oral.",
          "Contracepcão obrigatória — ambos os sexos — até 3 meses após suspensão.",
        ],
      },
      {
        id: "leflunomida",
        nome: "Leflunomida",
        nomesComerciais: ["Arava®"],
        linha: "segunda",
        via: "VO",
        doseInicial: "20 mg/dia (sem dose de ataque recomendada)",
        mecanismo: "DMARD convencional — inibe síntese de pirimidinas → supressão de linfócitos T ativados.",
        indicacoes: ["AR — alternativa ao MTX ou em combinação", "Intolerância ao MTX"],
        contraindicacoes: ["Gravidez e amamentação (altamente teratogênico)", "Hepatopatia grave", "Imunodepressão grave"],
        efeitosAdversos: ["Hepatotoxicidade", "Alopecia (dose-dependente)", "Diarreia", "HAS", "Mielossupressão"],
        interacoes: ["Varfarina: aumenta INR — monitorar", "MTX: hepatotoxicidade sinérgica"],
        monitoramento: ["TGO/TGP e hemograma a cada 4–8 semanas", "PA"],
        notas: ["Meia-vida muito longa (1–3 semanas) — em caso de toxicidade ou gravidez não planejada: protocolo de washout com colestiramina 8g 3x/dia por 11 dias."],
      },
    ],
  },

  // ── PSIQUIATRIA ───────────────────────────────────────────────────────────────
  {
    id: "depressao",
    nome: "Depressão",
    categoria: "Psiquiatria",
    medicamentos: [
      {
        id: "sertralina",
        nome: "Sertralina (ISRS)",
        nomesComerciais: ["Zoloft®", "Tolrest®"],
        linha: "primeira",
        via: "VO",
        doseInicial: "25–50 mg/dia",
        titulacao: [
          { semana: 1, dose: "25 mg/dia" },
          { semana: 2, dose: "50 mg/dia", nota: "Dose-alvo inicial" },
          { semana: 4, dose: "100 mg/dia", nota: "Se resposta parcial" },
          { semana: 8, dose: "150–200 mg/dia", nota: "Dose máxima" },
        ],
        mecanismo: "ISRS — inibe recaptação de serotonina na fenda sináptica. Efeito terapêutico completo em 4–6 semanas.",
        indicacoes: ["Depressão maior", "TAG — transtorno de ansiedade generalizada", "TOC", "TEPT", "Fobia social", "Síndrome do pânico"],
        contraindicacoes: ["Uso concomitante com IMAO (intervalo de 14 dias)", "Síndrome serotoninérgica prévia"],
        efeitosAdversos: ["Náusea (primeiras semanas)", "Disfunção sexual (anorgasmia, diminuição libido)", "Insônia ou sonolência", "Cefaleia", "Síndrome de discontinuação se retirada abrupta"],
        interacoes: ["IMAO: síndrome serotoninérgica grave (fatal)", "Tramadol: risco de síndrome serotoninérgica", "Varfarina: aumenta INR"],
        monitoramento: ["Risco de suicídio nas primeiras 4 semanas (especialmente jovens)", "Resposta clínica em 4–6 semanas", "Efeitos adversos"],
        notas: [
          "Reavaliar resposta em 4–6 semanas. Sem resposta: aumentar dose ou trocar classe.",
          "Manter por pelo menos 6–12 meses após remissão do 1º episódio.",
          "Retirada gradual em 4–8 semanas para evitar síndrome de discontinuação.",
        ],
      },
      {
        id: "venlafaxina",
        nome: "Venlafaxina (IRSN)",
        nomesComerciais: ["Efexor® XR"],
        linha: "primeira",
        via: "VO",
        doseInicial: "37,5 mg/dia (XR, com refeição)",
        titulacao: [
          { semana: 1, dose: "37,5 mg/dia" },
          { semana: 2, dose: "75 mg/dia" },
          { semana: 4, dose: "150 mg/dia", nota: "Dose-alvo" },
          { semana: 8, dose: "225 mg/dia", nota: "Dose máxima" },
        ],
        mecanismo: "IRSN — inibe recaptação de serotonina E norepinefrina. Ativo em dor neuropática além de depressão/ansiedade.",
        indicacoes: ["Depressão maior (especialmente com dor crônica ou fadiga)", "TAG", "Fobia social", "Fibromialgia", "Dor neuropática", "Menopausa — fogachos"],
        contraindicacoes: ["IMAO (intervalo 14 dias)", "HAS não controlada"],
        efeitosAdversos: ["HAS dose-dependente (>150 mg)", "Disfunção sexual", "Sudorese", "Boca seca", "Constipação"],
        interacoes: ["IMAO: síndrome serotoninérgica", "Antihipertensivos: monitorar PA"],
        monitoramento: ["PA a cada consulta (especialmente doses >150 mg)", "FC"],
        notas: ["Forma XR: tomar 1x/dia com refeição. Cápsula pode ser aberta e misturada com alimento.", "Retirada gradual obrigatória — síndrome de discontinuação intensa."],
      },
    ],
  },

  // ── INFECTOLOGIA ─────────────────────────────────────────────────────────────
  {
    id: "itu",
    nome: "ITU não complicada (Cistite)",
    categoria: "Infectologia",
    medicamentos: [
      {
        id: "nitrofurantoina",
        nome: "Nitrofurantoína",
        nomesComerciais: ["Macrobid®", "Macrodantina®"],
        linha: "primeira",
        via: "VO",
        doseInicial: "100 mg (macrocristal) 2x/dia por 5 dias",
        mecanismo: "Antibacteriano urinário — atinge altas concentrações na urina, inibe síntese de DNA bacteriano.",
        indicacoes: ["Cistite aguda não complicada (mulheres)", "Profilaxia de ITU recorrente (50 mg 1x/dia à noite)"],
        contraindicacoes: ["TFGe <45 mL/min (não atinge concentração terapêutica na urina)", "Gravidez no 3º trimestre (hemólise neonatal)", "Neuropatia periférica"],
        efeitosAdversos: ["Náusea, vômitos (tomar com alimento)", "Pneumonite (uso crônico — raro)", "Neuropatia periférica (uso prolongado)"],
        interacoes: ["Probenecida: aumenta toxicidade"],
        monitoramento: ["Urocultura de controle se não houver melhora em 48h"],
        notas: ["Boa atividade contra E. coli (principal agente). Baixa resistência comunitária.", "Não eficaz para pielonefrite (não penetra tecido renal)."],
      },
      {
        id: "fosfomicina",
        nome: "Fosfomicina",
        nomesComerciais: ["Monurol®"],
        linha: "primeira",
        via: "VO",
        doseInicial: "3 g dose única (sache oral)",
        mecanismo: "Inibe síntese da parede celular bacteriana por via diferente dos β-lactâmicos — eficaz contra cepas resistentes.",
        indicacoes: ["Cistite aguda não complicada", "Alternativa na suspeita de ESBL", "Gestação (categoria B)"],
        contraindicacoes: ["TFGe <10 mL/min"],
        efeitosAdversos: ["Diarreia leve", "Náusea"],
        interacoes: ["Metoclopramida: reduz absorção"],
        monitoramento: ["Sintomas em 48–72h"],
        notas: ["Dose única — adesão máxima.", "Alta atividade contra E. coli ESBL.", "Boa opção em gestantes e idosos."],
      },
    ],
  },

  // ── DERMATOLOGIA ─────────────────────────────────────────────────────────────
  {
    id: "acne",
    nome: "Acne Vulgar (Moderada a Grave)",
    categoria: "Dermatologia",
    medicamentos: [
      {
        id: "tretinoinaTopic",
        nome: "Tretinoína Tópica",
        nomesComerciais: ["Vitacid®", "Retacnyl®", "Epiduo® (tretinoína + adapaleno)"],
        linha: "primeira",
        via: "Tópica",
        doseInicial: "0,025% à noite (adaptar a 0,05% ou 0,1% conforme tolerância)",
        mecanismo: "Retinoide tópico — normaliza queratinização folicular, comedolítico e anti-inflamatório.",
        indicacoes: ["Acne comedogênica e papulopustulosa", "Manutenção após isotretinoína"],
        contraindicacoes: ["Gestação (categoria C/X)", "Pele com eczema ativo"],
        efeitosAdversos: ["Irritação, eritema, descamação (primeiras 4–8 semanas)", "Fotossensibilidade"],
        interacoes: ["Peróxido de benzoíla: não aplicar simultaneamente (degradação do retinoide)"],
        monitoramento: ["Resposta clínica em 8–12 semanas", "Fotoproteção diária obrigatória"],
        notas: ["Aplicar sobre pele seca, 20 min após lavar. Início com dias alternados se irritação.", "Resultado esperado após 3 meses de uso contínuo."],
      },
      {
        id: "isotretinoina",
        nome: "Isotretinoína Oral",
        nomesComerciais: ["Roacutan®", "Neotrex®", "Acnova®"],
        linha: "segunda",
        via: "VO",
        doseInicial: "0,5 mg/kg/dia por 4 semanas",
        titulacao: [
          { semana: 1, dose: "0,5 mg/kg/dia", nota: "Fase de indução" },
          { semana: 5, dose: "1,0 mg/kg/dia", nota: "Dose plena — manter até dose cumulativa" },
        ],
        doseManutencao: "Dose cumulativa alvo: 120–150 mg/kg total",
        mecanismo: "Retinoide oral — reduz produção sebácea em 70–90%, normaliza queratinização, anti-inflamatório.",
        indicacoes: ["Acne grave nodular/cística", "Acne moderada refratária a antibióticos + retinoide tópico", "Acne com cicatrizes"],
        contraindicacoes: ["Gestação (CATEGORIA X — teratogênica)", "Hiperlipidemia grave", "Hepatopatia", "Uso de vitamina A em altas doses"],
        efeitosAdversos: ["Queilite (≥90%)", "Xerodermia e xeroftalmia", "Mialgia e artralgia", "Elevação de triglicerídeos", "Depressão (monitorar)"],
        interacoes: ["Tetraciclinas: contraindicado (pseudotumor cerebri)", "Vitamina A suplementar: evitar"],
        monitoramento: ["TGP, TGO e triglicerídeos: mensalmente", "Teste de gravidez: antes, mensalmente e 5 semanas após", "iPledge/PNAFE: cadastro obrigatório"],
        notas: ["Programa PNAFE no Brasil: cadastro obrigatório médico e paciente.", "Anticoncepção dupla obrigatória em mulheres em idade fértil — iniciar 1 mês antes."],
      },
      {
        id: "doxiciclinaAcne",
        nome: "Doxiciclina (Acne)",
        nomesComerciais: ["Vibramicina®", "Doryx®"],
        linha: "primeira",
        via: "VO",
        doseInicial: "100 mg 1–2x/dia por 12–16 semanas (máx 6 meses)",
        mecanismo: "Tetraciclina — efeito anti-inflamatório e antibacteriano contra P. acnes.",
        indicacoes: ["Acne inflamatória moderada a grave", "Combinação com retinoide tópico"],
        contraindicacoes: ["Gestação (categoria D)", "Crianças <8 anos (manchas dentárias)", "Exposição solar intensa"],
        efeitosAdversos: ["Fotossensibilidade (usar protetor solar)", "Náusea (tomar com alimento)", "Esofagite (tomar com bastante água)"],
        interacoes: ["Antiácidos, leite: reduzem absorção (tomar 2h separados)", "Varfarina: aumenta anticoagulação"],
        monitoramento: ["Reavaliação em 8 semanas", "Não usar como monoterapia — associar tópico"],
        notas: ["Usar o menor tempo necessário. Resistência crescente a macrolídeos — preferir doxiciclina.", "Não usar na profilaxia de longo prazo."],
      },
    ],
  },
  {
    id: "dermatite_atopica",
    nome: "Dermatite Atópica",
    categoria: "Dermatologia",
    medicamentos: [
      {
        id: "mometasona",
        nome: "Mometasona Tópica (Corticoide)",
        nomesComerciais: ["Elocom®", "Elofar®"],
        linha: "primeira",
        via: "Tópica",
        doseInicial: "Creme 0,1% — aplicar 1x/dia nas lesões (14 dias); manutenção intermitente",
        mecanismo: "Corticoide tópico de potência média-alta — anti-inflamatório local.",
        indicacoes: ["DA moderada em corpo (não face)", "Placas inflamatórias pruriginosas"],
        contraindicacoes: ["Face e dobras por períodos prolongados (atrofia)", "Infecção cutânea ativa"],
        efeitosAdversos: ["Atrofia cutânea (uso prolongado)", "Estrias", "Rosácea periorificial (face)"],
        interacoes: [],
        monitoramento: ["Limitar a 14 dias contínuos; curto prazo na face (5–7 dias)"],
        notas: ["Regra: potência baixa na face e dobras; potência média-alta em tronco e membros."],
      },
      {
        id: "tacrolimus",
        nome: "Tacrolimus Tópico",
        nomesComerciais: ["Protopic® 0,03% e 0,1%"],
        linha: "segunda",
        via: "Tópica",
        doseInicial: "0,03% 2x/dia (crianças ≥2a) · 0,1% 2x/dia (adultos) por 6 semanas",
        mecanismo: "Inibidor de calcineurina tópico — reduz ativação de linfócitos T sem atrofia cutânea.",
        indicacoes: ["DA refratária a corticoides", "DA em face, pálpebras e dobras (sem risco de atrofia)"],
        contraindicacoes: ["Infecção herpética ativa", "<2 anos"],
        efeitosAdversos: ["Ardência e prurido transitorios nas primeiras semanas", "Intolerância ao calor (transitória)"],
        interacoes: [],
        monitoramento: ["Suspender se infecção cutânea bacteriana/viral"],
        notas: ["Alternativa segura para face e dobras — sem atrofia. Alerta FDA sobre risco teórico de linfoma (não confirmado em estudos)."],
      },
      {
        id: "dupilumabe",
        nome: "Dupilumabe",
        nomesComerciais: ["Dupixent®"],
        linha: "terceira",
        via: "SC",
        doseInicial: "600 mg SC (dose de ataque: 2x 300 mg) → 300 mg SC a cada 2 semanas",
        mecanismo: "Anticorpo monoclonal anti-IL-4Rα — bloqueia IL-4 e IL-13 (citocinas Th2 centrais na DA).",
        indicacoes: ["DA moderada a grave refratária a tratamento tópico otimizado", "A partir dos 6 meses de idade"],
        contraindicacoes: ["Infecção grave não controlada"],
        efeitosAdversos: ["Reação no local da injeção", "Conjuntivite (5–10%)", "Herpes zóster (raro)"],
        interacoes: [],
        monitoramento: ["EASI ou IGA a cada 16 semanas para avaliar resposta"],
        notas: ["Resultado esperado em 16 semanas. Se EASI -75% → manter. Aprovado ANVISA para DA moderada-grave.", "Autoaplicação possível com caneta — ensinar o paciente."],
        diferencial: "Biológico de primeira escolha para DA grave. Alternativas: tralokinumabe, abrocitinibe, upadacitinibe.",
      },
    ],
  },
  {
    id: "rosacca",
    nome: "Rosácea",
    categoria: "Dermatologia",
    medicamentos: [
      {
        id: "metronidazolRosa",
        nome: "Metronidazol Tópico",
        nomesComerciais: ["Rosex®", "Metrocreme®"],
        linha: "primeira",
        via: "Tópica",
        doseInicial: "Gel/creme 0,75% 2x/dia ou 1% 1x/dia por 12 semanas",
        mecanismo: "Anti-inflamatório e antibacteriano tópico — reduz eritema e pápulas da rosácea.",
        indicacoes: ["Rosácea papulopustulosa (subtipo 2)", "Manutenção após antibiótico oral"],
        contraindicacoes: ["Hipersensibilidade ao metronidazol"],
        efeitosAdversos: ["Ressecamento, leve ardência"],
        interacoes: [],
        monitoramento: ["Reavaliação em 8–12 semanas"],
        notas: ["Não tem efeito sobre eritema vascular (subtipo 1) — para eritema usar brimonidina ou ivermectina."],
      },
      {
        id: "ivermectinaRosa",
        nome: "Ivermectina Tópica 1%",
        nomesComerciais: ["Soolantra®"],
        linha: "primeira",
        via: "Tópica",
        doseInicial: "Creme 1% 1x/dia por 12 semanas (manutenção com menor frequência)",
        mecanismo: "Anti-inflamatório e anti-Demodex — age no ácaro folicular implicado na rosácea.",
        indicacoes: ["Rosácea papulopustulosa moderada a grave", "Refratária ao metronidazol"],
        contraindicacoes: ["Gestação (dados limitados)"],
        efeitosAdversos: ["Ardência transitória inicial"],
        interacoes: [],
        monitoramento: ["Resposta superior ao metronidazol em estudos head-to-head — considerar 1ª linha"],
        notas: ["Manutenção: 2x/semana após remissão. Evidência superior ao metronidazol para rosácea grave."],
      },
      {
        id: "doxiciclinaRosa",
        nome: "Doxiciclina 40 mg (Dose sub-antimicrobiana)",
        nomesComerciais: ["Oracea®"],
        linha: "segunda",
        via: "VO",
        doseInicial: "40 mg liberação modificada 1x/dia em jejum, por 12–16 semanas",
        mecanismo: "Efeito anti-inflamatório (não antibacteriano nessa dose) — reduz MMP e citocinas pró-inflamatórias.",
        indicacoes: ["Rosácea moderada a grave", "Eritema e pápulas persistentes"],
        contraindicacoes: ["Gestação", "Crianças <8 anos"],
        efeitosAdversos: ["Náusea", "Fotossensibilidade"],
        interacoes: ["Antiácidos: intervalo de 2h"],
        monitoramento: ["Reavaliação em 12 semanas"],
        notas: ["Oracea® 40 mg: aprovado especificamente para rosácea (não usa doses antibióticas). Evita resistência bacteriana."],
      },
    ],
  },

  // ── GERIATRIA ─────────────────────────────────────────────────────────────────
  {
    id: "osteoporose_idoso",
    nome: "Osteoporose no Idoso",
    categoria: "Geriatria",
    medicamentos: [
      {
        id: "alendronato",
        nome: "Alendronato de Sódio",
        nomesComerciais: ["Fosamax®", "Alendronato Genérico"],
        linha: "primeira",
        via: "VO",
        doseInicial: "70 mg 1x/semana (ou 10 mg/dia)",
        mecanismo: "Bisfosfonato — inibe osteoclastos, reduz reabsorção óssea.",
        indicacoes: ["Osteoporose (T-score ≤-2,5)", "Osteopenia com FRAX >10% para fratura maior", "Prevenção de fraturas em idosos"],
        contraindicacoes: ["TFGe <35 mL/min", "Esofagite ou dificuldade de deglutição", "Hipocalcemia"],
        efeitosAdversos: ["Esofagite, úlcera esofágica (instruir sobre postura)", "ONM (osteonecrose de mandíbula) — raro", "FAA (fratura atípica de fêmur) — uso >5 anos"],
        interacoes: ["Cálcio, antiácidos, leite: absorção zero se ingeridos junto — tomar 30–60 min antes"],
        monitoramento: ["Densitometria após 2 anos de tratamento", "TFGe e cálcio basal antes de iniciar", "Holiday após 5 anos se não há fratura prévia (drug holiday)"],
        notas: ["Orientação CRÍTICA: tomar em jejum, com copo cheio de água, ficar em pé 30 min após.", "NÃO deitar após tomar — risco de esofagite grave."],
      },
      {
        id: "calcio_vitD",
        nome: "Cálcio + Vitamina D3",
        nomesComerciais: ["Caltrate®", "Calcichew®", "Osteocalcin®"],
        linha: "adjuvante",
        via: "VO",
        doseInicial: "Cálcio 1000–1200 mg/dia (dividido em 2 tomadas) + VitD3 800–2000 UI/dia",
        mecanismo: "Suporte mineral essencial para mineralização óssea e ação dos bisfosfonatos.",
        indicacoes: ["Adjuvante de qualquer tratamento para osteoporose", "Idosos institucionalizados (deficiência de VitD quase universal)"],
        contraindicacoes: ["Hipercalcemia", "Nefrolitíase por cálcio (carbonato — preferir citrato)"],
        efeitosAdversos: ["Constipação (carbonato de cálcio)", "Cálculo renal em predispostos"],
        interacoes: ["Ferro: absorção reduzida — separar 2h"],
        monitoramento: ["Vitamina D 25-OH basal e após 3 meses de suplementação", "Calcemia antes e durante"],
        notas: ["Citrato de cálcio: preferível em idosos com acloridria ou que tomam IBP. Carbonato exige acidez gástrica para absorção."],
      },
    ],
  },
  {
    id: "demencia",
    nome: "Demência (Alzheimer)",
    categoria: "Geriatria",
    medicamentos: [
      {
        id: "donepezil",
        nome: "Donepezila",
        nomesComerciais: ["Aricept®", "Donepezila Genérico"],
        linha: "primeira",
        via: "VO",
        doseInicial: "5 mg/dia à noite por 4–6 semanas",
        titulacao: [
          { semana: 1, dose: "5 mg/dia", nota: "Início" },
          { semana: 5, dose: "10 mg/dia", nota: "Manter conforme tolerância" },
        ],
        doseManutencao: "10 mg/dia (23 mg/dia disponível — benefício marginal, mais efeitos adversos)",
        mecanismo: "Inibidor da acetilcolinesterase — aumenta acetilcolina sináptica, melhora cognição.",
        indicacoes: ["Doença de Alzheimer leve a grave", "Demência de Parkinson"],
        contraindicacoes: ["Bradicardia ou bloqueio AV (cautela)"],
        efeitosAdversos: ["Náusea, vômito, diarreia (especialmente na titulação)", "Bradicardia, síncope", "Pesadelos vividos (tomar de manhã se ocorrer)"],
        interacoes: ["Anticolinérgicos: antagonismo (oxibutinina, antihistamínicos — evitar)"],
        monitoramento: ["ECG basal se suspeita de arritmia", "MEEM ou MoCA a cada 6 meses"],
        notas: ["Não modifica progressão — apenas sintomático. Reavaliação anual da indicação.", "Efeito esperado: estabilização ou leve melhora por 6–12 meses."],
      },
      {
        id: "memantina",
        nome: "Memantina",
        nomesComerciais: ["Ebixa®", "Namenda®", "Memantina Genérico"],
        linha: "segunda",
        via: "VO",
        doseInicial: "5 mg/dia, aumentando 5 mg a cada semana",
        titulacao: [
          { semana: 1, dose: "5 mg/dia" },
          { semana: 2, dose: "10 mg/dia (5 mg 2x)" },
          { semana: 3, dose: "15 mg/dia" },
          { semana: 4, dose: "20 mg/dia (dose alvo)" },
        ],
        doseManutencao: "20 mg/dia",
        mecanismo: "Antagonista NMDA não competitivo — reduz excitotoxicidade por glutamato.",
        indicacoes: ["Alzheimer moderado a grave", "Combinação com donepezila em fases moderadas"],
        contraindicacoes: ["TFGe <30 mL/min (reduzir dose)"],
        efeitosAdversos: ["Tontura, cefaleia", "Confusão (menos comum que colinérgicos)"],
        interacoes: ["Amantadina, cimetidina: acumulação de memantina — cautela"],
        monitoramento: ["Função renal antes e a cada 6 meses", "Avaliar cognição e funcionalidade"],
        notas: ["Pode ser combinado com donepezila em Alzheimer moderado-grave — sinergia de mecanismos."],
      },
    ],
  },

  // ── MEDICINA DO ESPORTE ───────────────────────────────────────────────────────
  {
    id: "suplementacao_esporte",
    nome: "Suplementação Baseada em Evidências",
    categoria: "Medicina do Esporte",
    medicamentos: [
      {
        id: "creatina",
        nome: "Creatina Monohidrato",
        nomesComerciais: ["Creapure®", "qualquer marca de creatina pura"],
        linha: "primeira",
        via: "VO",
        doseInicial: "3–5 g/dia (manutenção) — sem fase de carga necessária",
        mecanismo: "Repõe estoques de fosfocreatina — melhora performance em exercícios de alta intensidade e curta duração.",
        indicacoes: ["Aumento de força e massa muscular", "Melhora de performance em sprints e treinamento de força", "Sarcopenia no idoso (evidência crescente)", "Lesão cerebral e neuroproteção (uso emergente)"],
        contraindicacoes: ["Doença renal estabelecida (monitorar com cautela)", "Desidratação grave"],
        efeitosAdversos: ["Ganho de peso (água intracelular)", "Distensão GI se dose alta de uma vez"],
        interacoes: ["Cafeína em altas doses: pode reduzir efeito (evidência mista)"],
        monitoramento: ["Creatinina pode elevar levemente (artefato — não significa dano renal)", "Hidratação adequada"],
        notas: ["Suplemento mais estudado e eficaz — evidência nível A para força e hipertrofia.", "Não precisa fase de carga (saturação ocorre em 3–4 semanas com 3 g/dia)."],
      },
      {
        id: "cafeina",
        nome: "Cafeína",
        nomesComerciais: ["Cafeína anidra (suplemento)", "café, chá verde (fonte natural)"],
        linha: "primeira",
        via: "VO",
        doseInicial: "3–6 mg/kg, 45–60 min antes do exercício",
        mecanismo: "Antagonismo de adenosina — reduz percepção de esforço, aumenta mobilização de ácidos graxos.",
        indicacoes: ["Melhora de performance aeróbica e anaeróbica", "Redução da fadiga central", "Foco e cognição"],
        contraindicacoes: ["Arritmia não controlada", "Gestação (limitar a 200 mg/dia)", "Ansiedade grave"],
        efeitosAdversos: ["Taquicardia, ansiedade", "Insônia (não usar após 14h)", "Dependência e abstinência"],
        interacoes: ["Beta-bloqueadores: podem atenuar efeitos cardiovasculares"],
        monitoramento: ["Tolerância individual — titular dose"],
        notas: ["Dose ótima: 3 mg/kg. Acima de 9 mg/kg: sem benefício adicional + toxicidade.", "Habitual na cafeína: efeito ergogênico menor — abstinência 7 dias antes de competição restaura resposta."],
      },
      {
        id: "betaAlanina",
        nome: "Beta-Alanina",
        nomesComerciais: ["qualquer beta-alanina pura"],
        linha: "segunda",
        via: "VO",
        doseInicial: "3,2–6,4 g/dia divididos ao longo do dia (reduz parestesia)",
        mecanismo: "Precursor de carnosina intramuscular — tampona H+ durante exercício de alta intensidade.",
        indicacoes: ["Exercícios de 1–10 minutos de alta intensidade (natação, ciclismo, corrida de média distância)", "Melhora de performance anaeróbica"],
        contraindicacoes: [],
        efeitosAdversos: ["Parestesia (formigamento) — dose-dependente, inócua, reduz com doses fracionadas"],
        interacoes: [],
        monitoramento: ["4–6 semanas para saturação de carnosina muscular"],
        notas: ["Sem efeito imediato — saturação progressiva. Melhor para exercícios de 60–240 segundos.", "Parestesia é inócua mas incômoda — fracionar dose ou usar SR (sustained release)."],
      },
    ],
  },

  // ── OFTALMOLOGIA ───────────────────────────────────────────────────────────
  {
    id: "glaucoma",
    nome: "Glaucoma / Hipertensão Ocular",
    categoria: "Oftalmologia",
    medicamentos: [
      {
        id: "timolol",
        nome: "Timolol",
        nomesComerciais: ["Timoptol", "Blocadren ocular"],
        linha: "primeira",
        via: "Tópica",
        doseInicial: "1 gota 0,5% 12/12h",
        mecanismo: "Betabloqueador tópico — reduz produção de humor aquoso (-20–25% PIO)",
        indicacoes: ["Glaucoma de ângulo aberto", "Hipertensão ocular"],
        contraindicacoes: ["Asma/DPOC grave", "BAV 2º e 3º grau", "ICC descompensada"],
        efeitosAdversos: ["Bradicardia sistêmica (absorção nasolacrimal)", "Broncoespasmo", "Olho seco"],
        interacoes: ["Betabloqueadores sistêmicos (efeito aditivo)", "Verapamil (BAV)"],
        monitoramento: ["PA e FC inicialmente", "Tonometria a cada 3–6 meses"],
        notas: ["Ocluir ponto lacrimal após instilação para reduzir absorção sistêmica.", "Monofármaco mais prescrito historicamente mas substituído por prostaglandinas como 1ª linha."],
      },
      {
        id: "latanoprosta",
        nome: "Latanoprosta",
        nomesComerciais: ["Xalatan", "Monopost"],
        linha: "primeira",
        via: "Tópica",
        doseInicial: "1 gota 0,005% à noite",
        mecanismo: "Análogo de prostaglandina F2α — aumenta drenagem uveoescleral (-25–35% PIO)",
        indicacoes: ["Glaucoma de ângulo aberto", "Hipertensão ocular"],
        contraindicacoes: ["Uveíte ativa", "Edema macular cistoide"],
        efeitosAdversos: ["Hiperemia conjuntival", "Hiperpigmentação de íris e cílios", "Crescimento de cílios"],
        interacoes: [],
        monitoramento: ["Tonometria a cada 3 meses inicialmente", "Avaliação de campo visual anual"],
        notas: ["1ª linha preferida por eficácia superior e dose única noturna.", "Hiperpigmentação de íris é irreversível — informar paciente."],
      },
    ],
  },
  {
    id: "conjuntivite-bacteriana",
    nome: "Conjuntivite Bacteriana",
    categoria: "Oftalmologia",
    medicamentos: [
      {
        id: "ciprofloxacino-ocular",
        nome: "Ciprofloxacino Ocular",
        nomesComerciais: ["Ciloxan"],
        linha: "primeira",
        via: "Tópica",
        doseInicial: "1–2 gotas 0,3% 4–6x/dia por 5–7 dias",
        mecanismo: "Fluoroquinolona — inibe DNA girase e topoisomerase IV bacteriana",
        indicacoes: ["Conjuntivite bacteriana aguda", "Ceratite bacteriana superficial"],
        contraindicacoes: ["Hipersensibilidade a quinolonas"],
        efeitosAdversos: ["Ardência transitória", "Precipitado branco corneano (uso excessivo)"],
        interacoes: [],
        monitoramento: ["Melhora esperada em 48–72h — reavaliar se não houver"],
        notas: ["Conjuntivite viral: autolimitada, lubrificantes — antibiótico não indicado.", "Neonatal/gonocócica: encaminhar urgência oftalmológica."],
      },
      {
        id: "tobramicina-ocular",
        nome: "Tobramicina Ocular",
        nomesComerciais: ["Tobrex"],
        linha: "primeira",
        via: "Tópica",
        doseInicial: "1–2 gotas 0,3% 4x/dia",
        mecanismo: "Aminoglicosídeo — inibe síntese proteica bacteriana (30S ribossômico)",
        indicacoes: ["Conjuntivite bacteriana", "Blefaroconjuntivite"],
        contraindicacoes: [],
        efeitosAdversos: ["Queimação local", "Hipersensibilidade ocular"],
        interacoes: [],
        monitoramento: ["Sem necessidade de monitoramento laboratorial"],
        notas: ["Boa cobertura para Staphylococcus, Streptococcus, H. influenzae, P. aeruginosa."],
      },
    ],
  },

  // ── OTORRINO ───────────────────────────────────────────────────────────────
  {
    id: "rinite-otorrino",
    nome: "Rinite Alérgica",
    categoria: "Otorrino",
    medicamentos: [
      {
        id: "budesonida-nasal",
        nome: "Budesonida Nasal",
        nomesComerciais: ["Budecort Nasal", "Rhinocort"],
        linha: "primeira",
        via: "Tópica",
        doseInicial: "256 µg/dia (2 jatos cada narina, 1x/dia) — adultos",
        mecanismo: "Glicocorticoide tópico — reduz inflamação da mucosa nasal sem absorção sistêmica significativa",
        indicacoes: ["Rinite alérgica persistente moderada/grave", "Rinite não alérgica eosinofílica (NARES)", "Adjuvante na rinossinusite crônica"],
        contraindicacoes: ["Epistaxe recorrente ativa (relativa)"],
        efeitosAdversos: ["Epistaxe leve", "Ressecamento nasal", "Cefaleia"],
        interacoes: [],
        monitoramento: ["Efeito máximo em 2–4 semanas — orientar uso regular", "Técnica de aplicação: inclinar cabeça levemente, apontar spray para lateral"],
        notas: ["Corticoide nasal é 1ª linha para rinite persistente — superior ao anti-histamínico isolado (metanálise ARIA).", "Sem supressão do eixo HPA nas doses recomendadas."],
      },
      {
        id: "loratadina-rinite",
        nome: "Loratadina",
        nomesComerciais: ["Claritin", "Histadin"],
        linha: "primeira",
        via: "VO",
        doseInicial: "10 mg/dia (adultos), 5 mg/dia (<30 kg)",
        mecanismo: "Anti-histamínico H1 de 2ª geração — antagonista seletivo periférico sem sedação",
        indicacoes: ["Rinite alérgica", "Urticária", "Conjuntivite alérgica"],
        contraindicacoes: [],
        efeitosAdversos: ["Cefaleia leve", "Raramente sedação"],
        interacoes: ["Cetoconazol, eritromicina (aumentam nível de loratadina — sem relevância clínica significativa)"],
        monitoramento: [],
        notas: ["Não sedativo — preferível à difenidramina em uso diário.", "Associar a corticoide nasal para controle sintomático superior."],
      },
    ],
  },
  {
    id: "otite-media-aguda",
    nome: "Otite Média Aguda",
    categoria: "Otorrino",
    medicamentos: [
      {
        id: "amoxicilina-otite",
        nome: "Amoxicilina",
        nomesComerciais: ["Amoxil", "Amoxicilina genérico"],
        linha: "primeira",
        via: "VO",
        doseInicial: "40–45 mg/kg/dia divididos 12/12h por 5–7 dias (adultos: 500 mg 8/8h)",
        mecanismo: "Aminopenicilina — inibe síntese de parede celular bacteriana",
        indicacoes: ["OMA (S. pneumoniae, H. influenzae, M. catarrhalis)", "Crianças <2 anos ou sintomas moderados/graves"],
        contraindicacoes: ["Alergia a penicilinas"],
        efeitosAdversos: ["Diarreia", "Rash cutâneo", "Anafilaxia (raro)"],
        interacoes: ["Varfarina (monitorar INR)"],
        monitoramento: ["Reavaliação em 48–72h se não houver melhora", "Falha: amoxicilina-clavulanato ou ceftriaxona"],
        notas: ["Aguardar 48–72h antes de antibiótico em crianças >2 anos com OMA leve (watchful waiting).", "Alta dose (80–90 mg/kg/dia) se área de alta prevalência de pneumococo resistente."],
      },
      {
        id: "amoxicilina-clavulanato-otite",
        nome: "Amoxicilina-Clavulanato",
        nomesComerciais: ["Clavulin", "Augmentin"],
        linha: "segunda",
        via: "VO",
        doseInicial: "875/125 mg 12/12h por 7–10 dias (adultos)",
        mecanismo: "Aminopenicilina + inibidor de beta-lactamase — cobertura ampliada incluindo H. influenzae produtores de beta-lactamase",
        indicacoes: ["OMA refratária à amoxicilina", "OMA recorrente", "OMA com otorreia"],
        contraindicacoes: ["Alergia a penicilinas", "Insuficiência hepática grave"],
        efeitosAdversos: ["Diarreia (mais que amoxicilina)", "Colestase hepática (raro, associada ao clavulanato)"],
        interacoes: [],
        monitoramento: [],
        notas: ["Preferir formulação com clavulanato 125 mg para minimizar diarreia."],
      },
    ],
  },

  // ── UROLOGIA ───────────────────────────────────────────────────────────────
  {
    id: "hpb-prescricao",
    nome: "Hiperplasia Prostática Benigna (HPB)",
    categoria: "Urologia",
    medicamentos: [
      {
        id: "tansulosina",
        nome: "Tansulosina",
        nomesComerciais: ["Secotex", "Tansulosin genérico"],
        linha: "primeira",
        via: "VO",
        doseInicial: "0,4 mg/dia após café da manhã",
        mecanismo: "Alfabloqueador seletivo α1A (próstata/bexiga) — relaxamento do músculo liso da próstata e colo vesical",
        indicacoes: ["HPB com sintomas moderados a graves (IPSS ≥8)", "Obstrução funcional do colo vesical"],
        contraindicacoes: ["Hipotensão ortostática grave", "Insuficiência hepática grave"],
        efeitosAdversos: ["Hipotensão ortostática (raro com α1A seletivo)", "Ejaculação retrógrada", "Tontura"],
        interacoes: ["Inibidores PDE5 (tadalafila) — cuidado com hipotensão", "CYP3A4/2D6 inibidores"],
        monitoramento: ["PA nas primeiras semanas", "IPSS após 4–8 semanas"],
        notas: ["Iniciar à noite nas primeiras semanas para reduzir risco de hipotensão.", "Efeito na ejaculação: informar o paciente previamente."],
      },
      {
        id: "dutasterida",
        nome: "Dutasterida",
        nomesComerciais: ["Avodart", "Duavert"],
        linha: "primeira",
        via: "VO",
        doseInicial: "0,5 mg/dia",
        mecanismo: "Inibidor da 5-alfaredutase tipos 1 e 2 — reduz DHT intraprostática → regressão do volume prostático",
        indicacoes: ["HPB com próstata >40 mL", "Prevenção da progressão (retenção urinária, cirurgia)"],
        contraindicacoes: ["Mulheres em idade fértil (teratogênico — categoria X)", "Hipersensibilidade"],
        efeitosAdversos: ["Disfunção erétil (5–10%)", "Diminuição da libido", "Ginecomastia", "Redução do PSA (~50% após 6–12 meses)"],
        interacoes: ["CYP3A4 inibidores (itraconazol, ritonavir) — aumentam nível"],
        monitoramento: ["PSA após 6 meses: duplicar valor para comparação com baseline", "Volume prostático por USG após 6 meses"],
        notas: ["Efeito máximo no volume prostático após 6–12 meses de uso contínuo.", "PSA reduz 50% — corrigir interpretação: PSA real × 2."],
      },
    ],
  },
  {
    id: "disfuncao-eretil-prescricao",
    nome: "Disfunção Erétil",
    categoria: "Urologia",
    medicamentos: [
      {
        id: "sildenafila",
        nome: "Sildenafila",
        nomesComerciais: ["Viagra", "Sildenafila genérico"],
        linha: "primeira",
        via: "VO",
        doseInicial: "50 mg conforme demanda (30–60 min antes)",
        doseManutencao: "Ajustar para 25 mg (efeitos adversos) ou 100 mg (resposta insuficiente)",
        mecanismo: "Inibidor PDE5 — aumenta cGMP intracavernoso → vasodilatação e ereção",
        indicacoes: ["Disfunção erétil orgânica", "Psicogênica", "Mista"],
        contraindicacoes: ["Uso de nitratos (qualquer forma) — hipotensão fatal", "Alfa-bloqueadores em dose alta", "Doença cardiovascular instável"],
        efeitosAdversos: ["Cefaleia", "Rubor facial", "Dispepsia", "Congestão nasal", "Distúrbios visuais (azul-verde)"],
        interacoes: ["Nitratos (CI absoluta)", "Alfa-bloqueadores (CI ou intervalo 4h)", "Antifúngicos azólicos (aumentam nível)"],
        monitoramento: ["Sem necessidade laboratorial rotineira", "Avaliar causa base e resposta clínica"],
        notas: ["Refeição gordurosa retarda absorção.", "Se falha: verificar estimulação adequada, corrigir hipogonadismo, intensificar tratamento causa base."],
      },
      {
        id: "tadalafila",
        nome: "Tadalafila",
        nomesComerciais: ["Cialis", "Tadalafila genérico"],
        linha: "primeira",
        via: "VO",
        doseInicial: "5 mg/dia (uso contínuo) OU 10–20 mg conforme demanda",
        mecanismo: "Inibidor PDE5 — meia-vida ~17h (vs 4h sildenafila) — permite 'janela' de 36h",
        indicacoes: ["Disfunção erétil", "HPB + DE (tadalafila 5 mg trata ambos)"],
        contraindicacoes: ["Nitratos (CI absoluta)", "Hipotensão grave"],
        efeitosAdversos: ["Cefaleia", "Lombalgia (mialgias musculares)", "Rubor", "Dispepsia"],
        interacoes: ["Nitratos (CI absoluta)", "Alfa-bloqueadores (respeitar intervalo 4h em doses altas)", "CYP3A4 inibidores"],
        monitoramento: [],
        diferencial: "Tadalafila 5 mg/dia: uso contínuo indicado para pacientes que preferem espontaneidade e para HPB + DE simultâneos.",
        notas: ["Tadalafila 5 mg/dia + tansulosina: monitorar hipotensão — iniciar com intervalo temporal.", "Dose on-demand: tomar sem relação com alimentos."],
      },
    ],
  },
]

// ─── Config maps ──────────────────────────────────────────────────────────────

const LINHA_CONFIG: Record<Linha, { label: string; color: string; bg: string; border: string }> = {
  primeira:  { label: "1ª linha",   color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200"  },
  segunda:   { label: "2ª linha",   color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200"  },
  terceira:  { label: "3ª linha",   color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  adjuvante: { label: "Adjuvante",  color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
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
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-blue-700 bg-blue-50 border-blue-200">
            <Info className="w-2.5 h-2.5" />Monitoramento obrigatório
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-red-700 bg-red-50 border-red-200">
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
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full text-green-700 bg-green-50 border border-green-200">
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

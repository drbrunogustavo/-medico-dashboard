"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  X, ChevronDown, ChevronUp, Copy, Check, Wand2, Loader2,
  BookMarked, AlertCircle, Stethoscope, FlaskConical, Pill,
  Activity, ArrowDown,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type Especialidade = "Endocrinologia" | "Nutrologia" | "Cardiologia" | "Ginecologia" | "Reumatologia" | "Neurologia" | "Dermatologia" | "Geriatria" | "Medicina do Esporte" | "Urologia" | "Otorrino" | "Geral"

interface SecaoProtocolo {
  titulo: string
  items: string[]
}

interface Protocolo {
  id: string
  nome: string
  especialidade: Especialidade
  cor: string
  emoji: string
  diagnostico: SecaoProtocolo
  exames: SecaoProtocolo
  tratamento: SecaoProtocolo
  acompanhamento: SecaoProtocolo
}

// ─── Dados ────────────────────────────────────────────────────────────────────

const PROTOCOLOS: Protocolo[] = [
  {
    id: "obesidade",
    nome: "Obesidade",
    especialidade: "Endocrinologia",
    cor: "#f59e0b",
    emoji: "⚖️",
    diagnostico: {
      titulo: "Diagnóstico",
      items: [
        "IMC ≥30 kg/m²: obesidade; ≥35: grau II; ≥40: grau III",
        "Obesidade central: CA >94 cm H / >80 cm M",
        "Avaliar composição corporal por bioimpedância ou DEXA",
        "Rastrear causas secundárias: hipotireoidismo, Cushing, insulinoma, medicamentos",
        "Classificação fenotípica: metabólica, sarcopênica, abdominal visceral",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "TSH, T4L — excluir hipotireoidismo",
        "Glicemia jejum, insulina, HOMA-IR — avaliar resistência insulínica",
        "HbA1c — avaliar disglicemia crônica",
        "Lipidograma completo — ApoB, LDL, HDL, TG",
        "Hepatograma, GGT — avaliar NASH/NAFLD",
        "Cortisol salivar noturno ou urinário 24h — excluir Cushing se suspeita",
        "Ácido úrico, função renal, função hepática",
        "Vitamina D, ferritina, ferro sérico",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "Dieta hipocalórica: déficit de 500–750 kcal/dia (evidence-based)",
        "Exercício: 150–300 min/semana aeróbico + resistido 2–3x",
        "Semaglutida SC: iniciar 0,25 mg/semana → titular até 2,4 mg (STEP-1: -14,9% peso)",
        "Tirzepatida SC: iniciar 2,5 mg/semana → titular até 15 mg (SURMOUNT-1: -20,9%)",
        "Liraglutida SC: 0,6 mg → 3,0 mg/dia (Saxenda) se tolerância",
        "Metformina: 500 mg 2x/dia → 1g 2x/dia (off-label em pré-DM)",
        "IMC ≥40 ou ≥35 com comorbidades: indicar avaliação cirurgia bariátrica",
        "Abordagem multidisciplinar: nutricionista + psicólogo + educador físico",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Retorno 30 dias: tolerância e titulação de medicação",
        "Retorno 3 meses: peso, CA, exames metabólicos",
        "Meta realista: -5 a -10% do peso em 6 meses",
        "Monitorar FC, PA, lipídios a cada consulta",
        "Reavaliar exames laboratoriais a cada 3–6 meses",
        "Vigilância para síndrome de realimentação em obesos grau III",
      ],
    },
  },
  {
    id: "dm2",
    nome: "Diabetes Mellitus tipo 2",
    especialidade: "Endocrinologia",
    cor: "#3b7fff",
    emoji: "🩸",
    diagnostico: {
      titulo: "Diagnóstico",
      items: [
        "Glicemia jejum ≥126 mg/dL em 2 ocasiões",
        "Glicemia 2h TOTG ≥200 mg/dL",
        "HbA1c ≥6,5% (método certificado NGSP/DCCT)",
        "Glicemia aleatória ≥200 mg/dL + sintomas clássicos",
        "Pré-DM: GJ 100–125 / HbA1c 5,7–6,4% / TOTG 140–199",
        "Rastrear complicações microvasculares na primeira consulta",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "HbA1c — meta <7% (geral) ou <8% (idosos/fragilizados)",
        "Glicemia de jejum e pós-prandial",
        "Microalbuminúria (RAC) — rastreio nefropatia",
        "Fundo de olho — retinopatia diabética",
        "Monofilamento + diapasão — neuropatia periférica",
        "ECG — rastreio cardiopatia",
        "Lipidograma, creatinina, TFGe",
        "TSH — hipotireoidismo frequente em DM2",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "Metformina: iniciar 500 mg 2x/dia → meta 1g 2x/dia (primeira linha — UKPDS)",
        "SGLT2i: empagliflozina 10–25 mg (benefício cardiovascular + renal — EMPA-REG)",
        "GLP-1 RA: semaglutida VO 7–14 mg ou SC 0,5–1 mg/semana",
        "DPP-4i: sitagliptina 100 mg/dia (neutro cardiovascular)",
        "Insulinização: basal (glargina/degludeca) quando HbA1c >9% ou falha oral",
        "Dieta: low-carb moderada (45–60g CHO/refeição) ou mediterrânea",
        "Exercício: reduz HbA1c 0,5–0,7% — meta 150 min/semana",
        "Automonitorização: glicemia capilar 2–4x/dia se em insulina",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "HbA1c a cada 3 meses até controle, depois a cada 6 meses",
        "Fundo de olho anual (ou a cada 2 anos se sem alteração prévia)",
        "RAC anual para rastreio nefropatia",
        "Avaliação dos pés a cada consulta",
        "Pressão arterial: meta <130/80 mmHg em DM2",
        "LDL: meta <70 mg/dL (risco alto) ou <55 mg/dL (muito alto)",
        "Vacinação: influenza anual, pneumococo, hepatite B",
      ],
    },
  },
  {
    id: "hipotireoidismo",
    nome: "Hipotireoidismo",
    especialidade: "Endocrinologia",
    cor: "#10b981",
    emoji: "🦋",
    diagnostico: {
      titulo: "Diagnóstico",
      items: [
        "Clínico: fadiga, ganho de peso, frio, constipação, pele seca, mixedema",
        "TSH >4,0 mUI/L + T4L baixo: hipotireoidismo primário manifesto",
        "TSH 4–10 mUI/L + T4L normal: hipotireoidismo subclínico",
        "TSH >10 mUI/L: tratar independente de T4L",
        "Anti-TPO positivo: confirma etiologia autoimune (Hashimoto)",
        "Excluir uso de medicamentos (amiodarona, lítio, iodetos)",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "TSH ultrassensível (primeira linha)",
        "T4 livre — avaliar reserva tireoideana",
        "T3 livre — avaliar conversão periférica",
        "Anti-TPO, Anti-Tg — etiologia autoimune",
        "USG tireoidiana — nódulos, volumetria",
        "Hemograma — anemia perniciosa associada",
        "Colesterol total e frações — dislipidemia associada",
        "CK total — miopatia hipotiroidiana",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "Levotiroxina (T4): dose inicial 1,6 mcg/kg/dia",
        "Idosos ou cardiopatas: iniciar 12,5–25 mcg/dia, titular lentamente",
        "Tomar em jejum 30–60 min antes do café da manhã",
        "Ajustar dose a cada 4–6 semanas até TSH na meta",
        "Meta TSH: 0,5–2,5 mUI/L (adulto jovem) / 1–4 mUI/L (idosos)",
        "Considerar T4 + T3 combo (liotironina) em sintomas residuais com T4 otimizado",
        "Monitorar F.C., PA, sintomas cardiovasculares durante titulação",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "TSH 4–6 semanas após ajuste de dose",
        "Após estabilização: TSH a cada 6–12 meses",
        "Gestantes: TSH a cada 4 semanas — meta <2,5 mUI/L no 1º trimestre",
        "Reavaliar necessidade de dose após emagrecimento significativo",
        "Interações: ferro, cálcio, antiácidos reduzem absorção — intervalo de 2–4h",
        "Anti-TPO positivo: rastrear outras autoimunes (DM1, celíaca, adrenal)",
      ],
    },
  },
  {
    id: "hipertireoidismo",
    nome: "Hipertireoidismo",
    especialidade: "Endocrinologia",
    cor: "#f97316",
    emoji: "🔥",
    diagnostico: {
      titulo: "Diagnóstico",
      items: [
        "Clínico: perda de peso, taquicardia, tremor, sudorese, nervosismo, diarreia",
        "TSH suprimido (<0,1 mUI/L) + T4L e/ou T3L elevados",
        "Hipertireoidismo subclínico: TSH baixo + T4L/T3L normais",
        "Doença de Graves: exoftalmia, mixedema pré-tibial, bócio difuso",
        "Bócio multinodular tóxico: scintigrafia com captação focal",
        "Tireoidite: fase tireotóxica transitória, VSG elevada",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "TSH ultrassensível + T4L + T3L",
        "Anti-TSH-R (TRAb) — diagnóstico Doença de Graves",
        "Anti-TPO — inflamação autoimune",
        "Cintilografia tireoidiana — diferencia causas",
        "USG com Doppler — fluxo e nódulos",
        "ECG — avaliar FA, taquicardia sinusal",
        "Densitometria óssea — hipertireoidismo crônico → osteoporose",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "Tionamidas: metimazol 15–40 mg/dia (preferência) ou PTU 300–600 mg/dia",
        "PTU preferido em: gestação 1º trim, crise tireotóxica, intolerância ao metimazol",
        "Beta-bloqueador (propranolol 40–120 mg/dia) para controle sintomático imediato",
        "Iodo radioativo (I-131): definitivo para Graves ou BMNT",
        "Tireoidectomia: bócio volumoso, suspeita de malignidade, falha medicamentosa",
        "Graves + oftalmopatia ativa: evitar I-131, preferir tionamida ou cirurgia",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "TSH + T4L a cada 4–6 semanas durante titulação",
        "Hemograma + transaminases antes e durante tionamidas (agranulocitose rara)",
        "Alertar sobre sintomas de agranulocitose: febre + dor de garganta — suspender imediatamente",
        "Meta eutiroidismo em 4–8 semanas com tionamida",
        "Após I-131: monitorar hipotireoidismo — TSH em 4–6 semanas",
        "Remissão Graves em 40–50% após 12–18 meses de tionamida",
      ],
    },
  },
  {
    id: "menopausa",
    nome: "Menopausa",
    especialidade: "Endocrinologia",
    cor: "#e1306c",
    emoji: "♀️",
    diagnostico: {
      titulo: "Diagnóstico",
      items: [
        "Clínico: amenorreia ≥12 meses + idade >45 anos (sem causa alternativa)",
        "FSH >30–40 UI/L + estradiol <20 pg/mL",
        "Perimenopausa: irregularidade menstrual + sintomas vasomotores",
        "Menopausa cirúrgica: bilateral ooforectomia → sintomas abruptos",
        "Sintomas: fogachos, suores noturnos, insônia, atrofia urogenital, mood, dor articular",
        "Rastrear osteoporose (FRAX), doença cardiovascular, síndrome metabólica",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "FSH, LH, estradiol basal",
        "TSH — excluir hipotireoidismo como causa de sintomas",
        "Densitometria óssea (DXA) — rastreio osteoporose",
        "Mamografia — antes de iniciar TRH",
        "Colpocitologia — rastreio",
        "Glicemia, lipidograma, PA — risco cardiovascular",
        "Testosterona livre + SHBG — avaliação libido/energia",
        "Progesterona — desnecessária pós-menopausa",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "TRH combinada (estrogênio + progestogênio): mulheres com útero",
        "Estrogênio isolado: apenas histerectomizadas",
        "Via: transdérmica (gel, adesivo, spray) — menor risco trombótico que VO",
        "Estrogênio transdérmico: estradiol gel 0,5–1,5 mg/dia ou adesivo 25–100 mcg",
        "Progestogênio: progesterona micronizada 100–200 mg/dia (preferência sobre sintéticos)",
        "Testosterona: off-label para libido/fadiga — 0,5–1% gel 0,5–1 g/dia",
        "Alternativas não-hormonais: venlafaxina, gabapentina (fogachos), ospemifeno (atrofia)",
        "Isoflavonas de soja: benefício modesto em fogachos leves",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Retorno 3 meses: reavaliação de sintomas e tolerância",
        "Mamografia anual durante TRH",
        "Densitometria: repetir em 2–3 anos (monitorar resposta)",
        "Endometrial: sangramento uterino anormal → avaliar com eco ou histeroscopia",
        "Reavaliar indicação de TRH anualmente — não há prazo máximo em mulheres sem contraindicação",
        "Síndrome genitourinária: estrogênio vaginal local — seguro mesmo com contraindicação sistêmica relativa",
      ],
    },
  },
  {
    id: "andropausa",
    nome: "Andropausa / Hipogonadismo",
    especialidade: "Endocrinologia",
    cor: "#3b7fff",
    emoji: "♂️",
    diagnostico: {
      titulo: "Diagnóstico",
      items: [
        "Clínico: fadiga, redução libido, DE, sarcopenia, depot adiposo, humor depressivo",
        "Testosterona total matinal <300 ng/dL (2 dosagens em dias diferentes)",
        "Testosterona livre <65 pg/mL (calculada por Vermeulen)",
        "Avaliar causas: hipogonadismo primário (↑LH/FSH) vs secundário (↓LH/FSH)",
        "AMS score ≥37: sintomas moderados a graves de andropausa",
        "Excluir: anemia, hipotireoidismo, DM2, apneia do sono, depressão, uso de opioides",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "Testosterona total (2x — manhã, 8–10h)",
        "SHBG — calcular testosterona livre",
        "LH, FSH — classificar tipo de hipogonadismo",
        "Prolactina — excluir prolactinoma",
        "Estradiol — converter T → E2 (aromatase)",
        "PSA + toque retal — antes de iniciar TRT",
        "Hemograma — hematócrito basal (TRT aumenta Ht)",
        "Lipidograma, glicemia, TSH",
        "Espermograma se fertilidade relevante",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "Undecanoato de testosterona IM: 1.000 mg a cada 10–14 semanas (Nebido)",
        "Cipionato/enantato IM: 100–200 mg a cada 1–2 semanas",
        "Gel transdérmico: 50–100 mg/dia (AndroGel, Testogel) — mimetica perfil fisiológico",
        "Meta: testosterona total 400–700 ng/dL",
        "Monitorar hematócrito (<54%), PSA, efeitos cardiovasculares",
        "Preservação fertilidade: HCG 1.500–3.000 UI 3x/semana (estimula endógena)",
        "Clomifeno: off-label, estimula eixo HPG — 25–50 mg/dia (hipogonadismo leve)",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Testosterona total 3–6 semanas após início — ajustar dose",
        "PSA + TR aos 3–6 meses iniciais, depois anual",
        "Hematócrito: se >54% suspender temporariamente e doar sangue",
        "Densitometria basal e após 12 meses",
        "Avaliação clínica (AMS score) a cada 6 meses",
        "Não usar em: Ca de próstata, policitemia, hematócrito >50%, ICC descompensada",
      ],
    },
  },
  {
    id: "ferro",
    nome: "Deficiência de Ferro",
    especialidade: "Nutrologia",
    cor: "#dc2626",
    emoji: "🧲",
    diagnostico: {
      titulo: "Diagnóstico",
      items: [
        "Ferritina <30 ng/mL: depleção de estoques (independente de Hb)",
        "Ferritina <20 ng/mL + sintomas: anemia ferropriva iminente",
        "Anemia ferropriva: Hb <12 F / <13 H + ferritina baixa + hipocromia/microcitose",
        "Saturação de transferrina <20%: oferta insuficiente para eritropoese",
        "TIBC elevado + ferro sérico baixo: perfil ferropênico clássico",
        "Investigar causa: perdas (menstrual, GI), absorção (celíaca, IBD), demanda",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "Ferritina sérica — melhor marcador de estoques",
        "Ferro sérico + TIBC + saturação transferrina",
        "Hemograma completo com índices hematimétricos (VCM, HCM, RDW)",
        "Reticulócitos — resposta à reposição",
        "Proteína C-reativa — ferritina é reagente de fase aguda",
        "Anti-transglutaminase IgA (tTG-IgA) — rastreio doença celíaca",
        "Pesquisa de sangue oculto nas fezes se suspeita de sangramento GI",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "Oral: sulfato ferroso 100–200 mg/dia de ferro elementar em jejum",
        "Oral alternativa: bisglicinato ferroso (melhor tolerância GI) — 25–50 mg/dia",
        "Oral: tomar em jejum + vitamina C 200 mg → aumenta absorção 3x",
        "EV: carboximaltose férrica 500–1000 mg dose única (Ferinject) — anemia grave ou intolerância oral",
        "EV: sacarato de hidróxido de ferro — infusão lenta 200 mg/dose",
        "Ajustar dieta: carne vermelha, fígado, feijão + evitar chá/café junto à dose oral",
        "Eritropoietina: apenas em anemia crônica renal com resposta insuficiente ao ferro",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Hemograma após 4 semanas: aumento de Hb ≥1 g/dL confirma resposta",
        "Ferritina após 3 meses: meta ≥50–100 ng/mL",
        "Manter reposição por 3–6 meses após normalização de Hb (repor estoques)",
        "Tratar causa base obrigatoriamente",
        "EV: repetir ferritina em 4 semanas; nova dose se necessário",
        "Refratariedade: investigar H. pylori, celíaca, sangramento oculto",
      ],
    },
  },
  {
    id: "vitamina-d",
    nome: "Deficiência de Vitamina D",
    especialidade: "Nutrologia",
    cor: "#f59e0b",
    emoji: "☀️",
    diagnostico: {
      titulo: "Diagnóstico",
      items: [
        "25-OH-D3 <20 ng/mL: deficiência (risco osso, imunidade, função muscular)",
        "25-OH-D3 20–30 ng/mL: insuficiência",
        "25-OH-D3 30–60 ng/mL: suficiência",
        "25-OH-D3 >100 ng/mL: toxicidade potencial",
        "Nível funcional ideal controverso: muitos especialistas recomendam 40–60 ng/mL",
        "Fatores de risco: pouca exposição solar, pele escura, obesidade, malabsorção, idosos",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "25-OH-vitamina D sérica (melhor marcador de reservas)",
        "Cálcio sérico — antes e durante reposição em doses altas",
        "Fósforo sérico",
        "PTH — hiperparatireoidismo secundário à deficiência",
        "Creatinina + TFGe — ajuste dose em DRC",
        "Calciúria 24h se histórico de cálculos renais",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "Deficiência leve/moderada: 2.000–4.000 UI/dia de colecalciferol (D3)",
        "Deficiência grave (<10 ng/mL): dose de ataque 50.000 UI/semana por 8 semanas",
        "Manutenção: 1.000–2.000 UI/dia após normalização (VITAL: redução eventos cardiovasculares e Ca)",
        "Tomar com refeição gordurosa (lipossolúvel) — aumenta absorção 50%",
        "D3 preferível ao D2 (ergocalciferol): conversão mais eficiente e meia-vida maior",
        "Malabsorção (cirurgia bariátrica, IBD): doses 4–10x maiores ou EV se necessário",
        "Idosos: meta >30 ng/mL → reduz quedas e fraturas",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Repetir 25-OH-D3 após 8–12 semanas de reposição",
        "Ajustar dose para manter nível desejado",
        "Cálcio sérico anualmente em doses >4.000 UI/dia",
        "Cálculo renal prévio: calciúria 24h antes e durante",
        "Manutenção indefinida: monitorar anualmente",
      ],
    },
  },
  {
    id: "sarcopenia",
    nome: "Sarcopenia",
    especialidade: "Nutrologia",
    cor: "#8b5cf6",
    emoji: "💪",
    diagnostico: {
      titulo: "Diagnóstico",
      items: [
        "EWGSOP2: baixa força + baixa quantidade/qualidade muscular ± baixo desempenho físico",
        "Força de preensão: <27 kg H / <16 kg M (dinamometria)",
        "Velocidade da marcha: <0,8 m/s ou falha no chair-stand test <5x em 15s",
        "Massa muscular: DXA (ASMM/h²: <7,0 kg/m² H / <5,5 kg/m² M)",
        "Bioimpedância: baixa massa muscular esquelética + fase ângulo <5°",
        "Rastrear causa: imobilidade, desnutrição, doenças inflamatórias, hormônios, medicamentos",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "Bioimpedância ou DEXA — composição corporal",
        "Proteína total + albumina + pré-albumina — estado nutricional",
        "Vitamina D — deficiência = fator independente para sarcopenia",
        "Testosterona + IGF-1 (GH) — anabolismo",
        "TSH — hipotireoidismo contribui",
        "CK, aldolase — miopatia inflamatória",
        "Hemograma — anemia como causa de fadiga muscular",
        "Creatinina — baixa em sarcopenia (menor síntese muscular)",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "Proteína: 1,6–2,2 g/kg/dia — distribuída igualmente nas refeições",
        "Leucina: 3–4 g por refeição para maximizar síntese proteica (mTOR)",
        "Creatina monohidratada: 3–5 g/dia → +1–2 kg massa magra em 12 semanas",
        "Exercício resistido: ≥3x/semana, progressivo, foco em grandes grupos musculares",
        "Vitamina D: manter >40 ng/mL — diretamente relacionada à força muscular",
        "HMB (β-hidroxi-β-metilbutirato): 3 g/dia em idosos com sarcopenia moderada",
        "Testosterona / GH: indicação em hipogonadismo confirmado associado",
        "Nutricional: colágeno hidrolisado 15g/dia + vit C → síntese tecido conjuntivo",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Bioimpedância/DEXA a cada 3 meses nos primeiros 6 meses",
        "Reavaliação de força a cada 6 semanas (dinamometria)",
        "Função física: teste caminhada 6 min, chair-stand a cada 3 meses",
        "Ajuste proteico baseado em resposta individual",
        "Monitorar adesão ao exercício — fator mais crítico",
        "Idosos institucionalizados: protocolo semanal de avaliação funcional",
      ],
    },
  },
  {
    id: "performance",
    nome: "Performance Esportiva",
    especialidade: "Nutrologia",
    cor: "#00c07f",
    emoji: "🏃",
    diagnostico: {
      titulo: "Avaliação Inicial",
      items: [
        "Anamnese esportiva: modalidade, volume, intensidade, histórico de lesões",
        "Composição corporal: DEXA ou bioimpedância + dobras",
        "Avaliação funcional: VO2max, força máxima, potência, mobilidade",
        "Rastreio RED-S (Relative Energy Deficiency in Sport): triagem nutricional",
        "Histórico menstrual feminino: amenorreia de atleta = RED-S",
        "Avaliar estado psicológico: burnout, overtraining",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "Hemograma — anemia esportiva (pseudo-anemia, ferropênica)",
        "Ferritina — meta >50 ng/mL em atletas de endurance",
        "Vitamina D — meta >50 ng/mL em atletas",
        "Testosterona, cortisol matinal, cortisol noturno — razão T/C",
        "TSH + T4L — interferência no metabolismo energético",
        "Magnésio sérico/eritrocitário — cãibras, fadiga muscular",
        "CK — marcador de dano muscular em overtraining",
        "Ácido láctico em repouso — metabolismo aeróbio",
      ],
    },
    tratamento: {
      titulo: "Intervenção Nutricional e Suplementação",
      items: [
        "Proteína: 1,6–2,2 g/kg/dia (endurance) / 2,0–3,0 g/kg/dia (força)",
        "CHO: 5–12 g/kg/dia dependendo de volume/intensidade (periodização nutricional)",
        "Creatina monohidratada: 3–5 g/dia — melhora 1RM e massa muscular (nível A)",
        "Beta-alanina: 3,2–6,4 g/dia — tamponamento muscular, >4 semanas",
        "Cafeína: 3–6 mg/kg 60 min pré-treino — ergogênico de nível A",
        "Bicarbonato de sódio: 0,2–0,3 g/kg pré-performance anaeróbica",
        "Magnésio bisglicinato: 300–400 mg/dia se deficiente",
        "Ômega-3: 2–3 g/dia (DHA+EPA) — anti-inflamatório, recuperação muscular",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Composição corporal mensal durante periodização intensa",
        "Exames laboratoriais a cada 3 meses durante temporada",
        "Diário de carga + monitoramento de HRV (variabilidade cardíaca)",
        "Escala de percepção de esforço (PSE) e questionário de recuperação (TQR)",
        "Ajuste nutricional para cada bloco de treinamento (base, intensificação, competição, transição)",
        "Pré-competição: carregamento de glicogênio (3–4 dias antes) para provas >90 min",
      ],
    },
  },
  // ── DHGNA ──
  {
    id: "dhgna",
    nome: "DHGNA / Esteatose Hepática",
    especialidade: "Nutrologia",
    cor: "#f59e0b",
    emoji: "🫀",
    diagnostico: {
      titulo: "Diagnóstico",
      items: [
        "DHGNA: esteatose >5% dos hepatócitos sem causa secundária (álcool, medicamentos)",
        "NASH (esteato-hepatite): esteatose + inflamação + balonização hepatocitária ± fibrose",
        "USG abdome: ecodensidade hepática aumentada (sensibilidade 60–94% para >30% de gordura)",
        "Score FIB-4 = [Idade × AST] / [Plaquetas × √ALT]: <1,30 (baixo risco fibrose); >2,67 (alto risco)",
        "Elastografia hepática (FibroScan): kPa >7,0 sugere fibrose significativa (F≥2)",
        "Biópsia: padrão-ouro para graduação de NASH e estadiamento de fibrose",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "Hepatograma (TGO, TGP, GGT, FA, Bilirrubinas)",
        "Albumina, TP/INR — função hepática sintética",
        "FIB-4 score — calculado a partir de ALT, AST, plaquetas e idade",
        "USG abdominal — esteatose, esplenomegalia, hipertensão portal",
        "Elastografia hepática (FibroScan) — fibrose avançada",
        "Glicemia, insulina, HOMA-IR, HbA1c — resistência insulínica",
        "Lipidograma, TG — associação com síndrome metabólica",
        "Ferritina, saturação de transferrina — hemocromatose como diagnóstico diferencial",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "Perda de peso ≥7–10%: reduz esteatose e NASH (intervenção mais eficaz)",
        "Dieta mediterrânea ou low-carb: evidência para redução de gordura hepática",
        "Exercício: 150–300 min/semana aeróbico + resistido — reduz TGP independentemente do peso",
        "Eliminar frutose, álcool e bebidas açucaradas — principais drivers da lipogênese hepática",
        "Vitamina E 800 UI/dia: melhora NASH histologicamente em não-diabéticos (PIVENS trial)",
        "GLP-1 RA (semaglutida): reduz marcadores de fibrose — ensaios em fase III (NASH trial)",
        "iSGLT2 (empagliflozina): reduz TGP e gordura hepática em DM2 + DHGNA",
        "Evitar hepatotóxicos: AINEs, estatinas (se TGP >3× LSN), suplementos não regulados",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Hepatograma a cada 3–6 meses até normalização",
        "FIB-4 anual: se >1,30, solicitar elastografia",
        "USG anual para vigilância de hepatocarcinoma em cirrose",
        "Repetir elastografia em 2–3 anos em fibrose F1–F2",
        "Meta metabólica: HbA1c <7%, TG <150, PA <130/80",
        "Encaminhar hepatologia se: FIB-4 >2,67, cirrose suspeita, sangramento GI",
      ],
    },
  },
  // ── GINECOLOGIA ──
  {
    id: "sop",
    nome: "SOP — Síndrome do Ovário Policístico",
    especialidade: "Ginecologia",
    cor: "#e1306c",
    emoji: "🌸",
    diagnostico: {
      titulo: "Diagnóstico (Rotterdam — 2 de 3)",
      items: [
        "Oligo/anovulação: ciclos <21d ou >35d, ou <8 ciclos/ano",
        "Hiperandrogenismo clínico: acne, hirsutismo (Ferriman-Gallwey ≥8), alopecia androgênica",
        "Hiperandrogenismo laboratorial: testosterona total elevada, DHEA-S elevado",
        "USG pélvica: ≥20 folículos de 2–9 mm em ao menos um ovário OU volume ovárico >10 mL",
        "Excluir: hiperprolactinemia, disfunção tireoidiana, hiperplasia adrenal congênita, Cushing",
        "Rastrear: síndrome metabólica, resistência insulínica, dislipidemia, saúde mental",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "Testosterona total e livre, DHEA-S, 17-OH-Progesterona",
        "LH, FSH (D2–D5): razão LH/FSH >2 sugestiva",
        "TSH — excluir hipotireoidismo",
        "Prolactina — excluir hiperprolactinemia",
        "Glicemia jejum, insulina, HOMA-IR — resistência insulínica (presente em 50–70%)",
        "HbA1c, TOTG 75g — rastreio pré-DM/DM",
        "Lipidograma completo — dislipidemia associada em 70%",
        "USG pélvica transvaginal (D3–D5 de preferência)",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "MEV: perda de 5–10% do peso melhora ciclicidade menstrual e ovulação",
        "Mioinositol 2g 2x/dia + ácido fólico: melhora sensibilidade insulínica e ovulação (1ª linha funcional)",
        "Metformina 500 mg → 1.500–2.000 mg/dia: melhora RI, ciclicidade e hiperandrogenismo",
        "ACO combinado (EE 20–30 mcg + progestogênio antiandrogênico): controle de acne, hirsutismo e proteção endometrial",
        "Espironolactona 50–200 mg/dia: antiandrogênico para hirsutismo e acne (off-label, contracepção obrigatória)",
        "Indução de ovulação (fertilidade): letrozol 2,5–5 mg D3–D7 (superior ao clomifeno — NEJM 2014)",
        "Finasterida 2,5–5 mg/dia: alopecia androgênica severa resistente",
        "Vitamina D, magnésio, ômega-3: suporte metabólico adjuvante",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Ciclo menstrual e sintomas androgenicos a cada consulta",
        "HOMA-IR e glicemia a cada 6 meses",
        "Lipidograma e PA anual",
        "USG pélvica anual — monitorar folículos e espessura endometrial",
        "Rastreio humor: ansiedade e depressão são mais frequentes em SOP",
        "Gravidez: sem contracepção + letrozol — ovulação esperada em 70–80%",
      ],
    },
  },
  {
    id: "endometriose",
    nome: "Endometriose",
    especialidade: "Ginecologia",
    cor: "#c084fc",
    emoji: "🔮",
    diagnostico: {
      titulo: "Diagnóstico",
      items: [
        "Clínico: dismenorreia severa (EVA >7), dispareunia profunda, dor pélvica crônica, infertilidade",
        "Diagnóstico definitivo: laparoscopia + biópsia (glândulas e estroma ectópico)",
        "USG transvaginal: endometrioma ovariano (cisto chocolate), nódulos retrocervicais",
        "RNM pélvica: avalia profundidade de infiltração (endometriose profunda)",
        "CA-125: elevado em endometriose severa — inespecífico, uso limitado",
        "Classificação rASRM: I (mínima) a IV (severa) pela laparoscopia",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "USG pélvica transvaginal — endometriomas, nódulos",
        "RNM pélvica com preparo intestinal — profundidade de infiltração",
        "CA-125 — monitoramento de resposta, não diagnóstico",
        "AMH — reserva ovariana (reduzida em endometriomas)",
        "FSH, LH, estradiol — função ovariana",
        "Uroressonância / colonoscopia se suspeita de endometriose urinária/intestinal",
        "Laparoscopia diagnóstica + terapêutica quando indicada",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "Dor leve: AINEs (ibuprofeno 400–600 mg 3x/dia) no período perimenstrual",
        "ACO contínuo (sem pausa): suprime ciclo, reduz dor em 70% — 1ª linha hormonal",
        "Progestágenos: dienogeste 2 mg/dia (Visanne) — padrão ouro hormonal para dor",
        "SIU-LNG (Mirena): opção para dor pélvica + contracepção",
        "Análogos de GnRH (goserelina, leuprolida): grave/refratária — add-back obrigatório >3 meses",
        "Cirurgia laparoscópica: exérese de endometriomas, ressecção de nódulos profundos",
        "Fertilidade: laparoscopia + FIV se necessário — cirurgia melhora taxa de gravidez em endometrioma",
        "Suporte: psicoterapia, fisioterapia pélvica, gestão da dor crônica",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Avaliação de dor (EVA) a cada consulta",
        "USG anual para monitorar endometriomas",
        "AMH periódico em mulheres com endometriomas — risco de falência ovariana precoce",
        "Recorrência após cirurgia: 20–30% em 5 anos — manutenção hormonal reduz recidiva",
        "Rastrear: depressão, fadiga, saúde sexual — impacto significativo na qualidade de vida",
        "Encaminhar reprodução humana se desejo de gravidez sem sucesso após 6 meses",
      ],
    },
  },
  // ── CARDIOLOGIA ──
  {
    id: "has",
    nome: "Hipertensão Arterial Sistêmica",
    especialidade: "Cardiologia",
    cor: "#ef4444",
    emoji: "❤️",
    diagnostico: {
      titulo: "Diagnóstico",
      items: [
        "PA ≥140/90 mmHg em ≥2 medições em ≥2 visitas: diagnóstico de HAS",
        "PA 130–139/80–89: pré-hipertensão (AHA/ACC 2017) — MEV obrigatória",
        "Hipertensão do avental branco: PA elevada no consultório, normal em MAPA — não tratar",
        "Hipertensão mascarada: PA normal no consultório, elevada em MAPA — maior risco CV",
        "MAPA 24h: gold standard diagnóstico — excluir fenômenos white-coat e mascarada",
        "Estratificar risco CV: Framingham, escore de risco brasileiro (ERB)",
        "Investigar HAS secundária: hiperaldosteronismo (10%), apneia do sono, doença renal, feocromocitoma",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "MAPA 24h ou MRPA — confirmar diagnóstico e avaliar padrão circadiano",
        "Glicemia, HbA1c — DM como fator de risco",
        "Creatinina + TFGe — lesão de órgão-alvo renal",
        "Microalbuminúria (RAC) — nefropatia hipertensiva precoce",
        "Potássio — hipoCalemia espontânea sugere hiperaldosteronismo",
        "ECG — HVE, arritmias",
        "Fundoscopia — retinopatia hipertensiva",
        "RAR (Aldosterona/Renina) se HAS resistente ou hipocalemia",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "MEV: perda de peso, DASH, restrição de sódio <2g/dia, exercício ≥150 min/semana, cessação tabágica",
        "1ª linha: IECA (enalapril 5–40 mg) ou BRA (losartana 50–100 mg) — especialmente DM/DRC",
        "1ª linha alternativa: BCC (anlodipino 5–10 mg) ou diurético tiazídico (HCTZ 12,5–25 mg)",
        "HAS + DM ou DRC: IECA/BRA obrigatório + iSGLT2 se TFGe >20",
        "HAS + IC: IECA + beta-bloqueador + espironolactona",
        "HAS resistente (3+ drogas): adicionar espironolactona 25–50 mg/dia (PATHWAY-2)",
        "Metas PA: <130/80 mmHg (geral) / <140/90 (idosos frágeis >75 anos)",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "PA, FC e peso a cada consulta",
        "Creatinina + K após início de IECA/BRA (em 2–4 semanas)",
        "Microalbuminúria anual em DM e DRC",
        "ECG anual — progressão de HVE",
        "Risco CV (Framingham/ERB): reclassificar anualmente",
        "HAS controlada: consulta a cada 3–6 meses",
        "Refratária: encaminhar cardiologia ou nefrologia",
      ],
    },
  },
  {
    id: "dislipidemia-av",
    nome: "Dislipidemia — Alto Risco CV",
    especialidade: "Cardiologia",
    cor: "#f97316",
    emoji: "💊",
    diagnostico: {
      titulo: "Diagnóstico e Estratificação",
      items: [
        "LDL-c calculado (Friedewald) ou direto — principal alvo",
        "Non-HDL-c = CT - HDL-c: inclui LDL + VLDL + IDL — alvo secundário",
        "ApoB: melhor marcador de risco aterogênico — cada partícula LDL/VLDL carrega 1 ApoB",
        "Muito alto risco: DCV estabelecida, DM2 com LOA, DRC G3–G4, Framingham >20%",
        "Alto risco: Framingham 10–20%, DM1 ou DM2 sem LOA, HAS grave, colesterolemia familiar",
        "Lp(a) >50 mg/dL: fator independente de risco — medir ao menos uma vez na vida",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "Lipidograma completo (CT, LDL, HDL, TG) — em jejum de 12h se TG elevado",
        "ApoB — partículas aterogênicas totais",
        "Lp(a) — risco residual genético",
        "PCR-as — inflamação vascular",
        "Glicemia, HbA1c — DM como modificador de risco",
        "TFGe, microalbuminúria — DRC como modificador de risco",
        "TSH — hipotireoidismo causa dislipidemia secundária",
        "CK basal — antes de iniciar estatina",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "Dieta: mediterrânea, redução de gordura saturada, aumento de fibras e ômega-3",
        "Estatina alta intensidade: rosuvastatina 20–40 mg ou atorvastatina 40–80 mg (reduz LDL 50–55%)",
        "Meta LDL: <70 mg/dL (alto risco) / <55 mg/dL (muito alto risco) / <50 mg/dL (DCV+ novo evento)",
        "Ezetimiba 10 mg: adicionar se meta não atingida com estatina (IMPROVE-IT: -6% eventos CV)",
        "PCSK9i (evolocumabe, alirocumabe): reduz LDL 50–60% adicional — alto custo",
        "Inclisirán: siRNA semestral — alternativa PCSK9i de longa ação",
        "TG >500: fenofibrato 200 mg/dia + ômega-3 (EPA/DHA ≥4 g/dia)",
        "Intolernância à estatina: rosuvastatina em dias alternados + ezetimiba",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Lipidograma + CK 4–8 semanas após início ou ajuste",
        "Meta atingida: lipidograma anual",
        "CK se mialgia: suspender se >10× LSN ou mialgia grave",
        "Hepático: transaminases antes e 3 meses após início (não rotina após estabilização)",
        "ApoB: meta <80 mg/dL (alto risco) / <65 mg/dL (muito alto risco)",
        "Lp(a) elevado: não muda com estatina — estratégia de minimizar outros riscos",
      ],
    },
  },
  // ── REUMATOLOGIA ──
  {
    id: "ar",
    nome: "Artrite Reumatoide",
    especialidade: "Reumatologia",
    cor: "#8b5cf6",
    emoji: "🦴",
    diagnostico: {
      titulo: "Diagnóstico (ACR/EULAR 2010 — score ≥6)",
      items: [
        "Artrite simétrica de pequenas articulações (IFP, MCF, punhos) por ≥6 semanas",
        "FR (IgM): positivo em 70–80% — inespecífico isolado",
        "Anti-CCP (ACPA): alta especificidade (95%) — diagnóstico AR mesmo FR negativo",
        "PCR e VHS: marcadores de atividade inflamatória",
        "Rigidez matinal >60 min: sugestiva de inflamação sinovial ativa",
        "Erosões ósseas em RX — artrite erosiva estabelecida",
        "Excluir: artrite psoriásica, LES, gota, infecção (artrite séptica)",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "FR + Anti-CCP — diagnóstico e prognóstico",
        "PCR-as + VHS — atividade inflamatória",
        "Hemograma — anemia de doença crônica, leucopenia (DMARD)",
        "Creatinina, TFGe — baseline antes de DMARDs",
        "Transaminases (AST, ALT) — hepatotoxicidade metotrexato",
        "RX mãos e pés — erosões, espaço articular",
        "USG articular com Doppler — sinovite, erosões subclínicas",
        "PPD/IGRA + RX tórax — antes de biológicos (rastrear TB latente)",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "Metotrexato (MTX): 10–25 mg/semana VO ou SC — anchor drug da AR",
        "Ácido fólico 5 mg/semana (24h após MTX): reduz toxicidade hematológica e hepática",
        "Leflunomida 20 mg/dia: alternativa ao MTX ou combo",
        "Hidroxicloroquina 5 mg/kg/dia: adjuvante, especialmente em AR inicial leve",
        "Corticoide (prednisona ≤10 mg/dia): bridge terapêutico — reduzir e cessar em 3–6 meses",
        "Biológico anti-TNF (adalimumabe, certolizumabe): falha a 2 DMARDs sintéticos",
        "JAK inibidores (baricitinibe, tofacitinibe): alternativa oral a biológicos",
        "Meta T2T: remissão (DAS28 <2,6) ou baixa atividade (DAS28 <3,2) em 6 meses",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "DAS28 ou CDAI a cada consulta — avaliar atividade de doença",
        "Hemograma, TGO/TGP, creatinina: mensal nos primeiros 6 meses de MTX; depois 3–6 meses",
        "RX mãos/pés anual — progressão erosiva",
        "Rastrear: dislipidemia, DCV (risco 2x maior em AR), osteoporose",
        "Vacinas: influenza, pneumococo, herpes zóster — antes de biológicos",
        "Biológico: rastrear infecções oportunistas, tuberculose",
        "Remissão sustentada >12 meses: considerar desmame gradual de DMARDs",
      ],
    },
  },
  {
    id: "fibromialgia",
    nome: "Fibromialgia",
    especialidade: "Reumatologia",
    cor: "#06b6d4",
    emoji: "🧠",
    diagnostico: {
      titulo: "Diagnóstico (ACR 2010/2016)",
      items: [
        "Dor generalizada bilateral (>3 meses) acima e abaixo da cintura, incluindo axial",
        "Índice de dor generalizada (WPI) ≥7 + pontuação de gravidade dos sintomas (SS) ≥5",
        "Ou WPI 4–6 + SS ≥9",
        "Sintomas associados: fadiga, sono não reparador, disfunção cognitiva (fibro fog)",
        "Excluir: hipotireoidismo, polimialgia reumática, LES, miosite, apneia do sono",
        "Fibromialgia não exclui outras patologias — pode coexistir com AR, espondiloartrite",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "TSH — hipotireoidismo mimetiza fibromialgia",
        "Hemograma, VHS, PCR — excluir doença inflamatória sistêmica",
        "FAN, FR, Anti-CCP — excluir autoimune",
        "CK, aldolase — excluir miopatia inflamatória",
        "Vitamina D, magnésio, B12 — deficiências agravam sintomas",
        "Polissonografia se insônia grave ou suspeita de apneia",
        "Exames normais na fibromialgia — serve para excluir outros diagnósticos",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "Educação: explicar o mecanismo (sensibilização central) — fundamental para adesão",
        "Exercício aeróbico: intervenção mais eficaz — caminhada, natação, ciclismo, 3–5x/semana",
        "Duloxetina 30 → 60–120 mg/dia: analgesia central + componente depressivo",
        "Pregabalina 75 → 300–450 mg/dia: reduz sensibilização central, melhora sono",
        "Amitriptilina 10–25 mg/noite: melhora sono e dor em baixas doses",
        "Milnaciprano (ISRSN): alternativa à duloxetina se predomina fadiga",
        "TCC (Terapia Cognitivo-Comportamental): melhor evidência psicoterapêutica",
        "Evitar opioides — ineficazes na fibromialgia e causam hiperalgesia por opioide",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "FIQ (Fibromyalgia Impact Questionnaire) — avaliar resposta",
        "EVA de dor, qualidade do sono e fadiga a cada consulta",
        "Ajuste de medicação a cada 4–8 semanas até dose terapêutica",
        "Psicoterapia: mínimo 12 sessões de TCC",
        "Encaminhar reumatologia se diagnóstico incerto ou refratariedade",
        "Fibromialgia é crônica — meta realista: redução 30% da dor + melhora funcional",
      ],
    },
  },
  // ── NEUROLOGIA ──
  {
    id: "depressao",
    nome: "Depressão Maior",
    especialidade: "Neurologia",
    cor: "#6366f1",
    emoji: "🧠",
    diagnostico: {
      titulo: "Diagnóstico (DSM-5)",
      items: [
        "≥5 sintomas por ≥2 semanas, incluindo: humor deprimido OU anedonia",
        "Outros: alteração de peso/apetite, insônia/hipersonia, fadiga, culpa excessiva, dificuldade de concentração, pensamentos de morte",
        "PHQ-9 ≥10: depressão moderada a grave",
        "Excluir: hipotireoidismo, anemia, deficiência de B12/D, apneia, medicamentos (betabloq., corticoide)",
        "Diferenciar: distimia (crônica/leve), transtorno bipolar (contraindicação antidepressivo em monot.)",
        "Avaliar ideação suicida em toda consulta",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "TSH, T4L — hipotireoidismo mimetiza depressão",
        "Hemograma, ferritina — anemia como causa de fadiga/humor",
        "Vitamina B12, folato — déficit = causa tratável",
        "Vitamina D — associada à depressão (evidência moderada)",
        "Glicemia, HbA1c — DM2 aumenta risco depressão 2x",
        "Cortisol matinal — excluir hipocortisolismo",
        "PHQ-9 + GAD-7 + escala de Hamilton — quantificar e monitorar",
        "RNM crânio se: início tardio, sintomas atípicos, déficit neurológico",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "ISRS: sertralina 50 → 200 mg/dia (1ª linha — seguro, bem tolerado)",
        "ISRS alternativa: escitalopram 10–20 mg/dia (melhor perfil de efeitos adversos)",
        "IRSN: venlafaxina 75 → 225 mg/dia (dor + depressão) ou duloxetina 60–120 mg",
        "Mirtazapina 15–45 mg/noite: insônia + depressão + perda de peso",
        "Bupropiona 150–300 mg: sem disfunção sexual + cessação tabágica",
        "Avaliar resposta em 4–6 semanas: redução PHQ-9 ≥50% = boa resposta",
        "Refratário a 2 ISRS: encaminhar psiquiatria — augmentação (lítio, aripiprazol, quetiapina)",
        "Psicoterapia: TCC — eficácia igual ao antidepressivo em leve/moderado; potencializa em grave",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "PHQ-9 a cada 4 semanas até remissão (PHQ-9 <5)",
        "Manter antidepressivo por ≥6–12 meses após remissão (reduz recaída em 50%)",
        "2º episódio: manter ≥2 anos; ≥3 episódios: tratar indefinidamente",
        "Disfunção sexual: efeito adverso comum dos ISRS — trocar por bupropiona ou mirtazapina",
        "Suicidalidade: reavaliação imediata — internação se risco alto",
        "Encaminhar psiquiatria: refratário, bipolar, psicose, alto risco suicida",
      ],
    },
  },
  {
    id: "enxaqueca",
    nome: "Enxaqueca (Migrânea)",
    especialidade: "Neurologia",
    cor: "#7c3aed",
    emoji: "⚡",
    diagnostico: {
      titulo: "Diagnóstico (IHS-3)",
      items: [
        "≥5 crises: cefaleia unilateral, pulsátil, moderada/grave, 4–72h",
        "Náusea/vômito OU foto/fonofobia durante a crise",
        "Piora com atividade física rotineira",
        "Enxaqueca com aura: sintomas neurológicos reversíveis precedendo a dor (visual, sensitivo, motor)",
        "Enxaqueca crônica: ≥15 dias/mês, dos quais ≥8 com características de migrânea",
        "Excluir cefaleia secundária: rigidez de nuca, febre, deficit neurológico, 'thunderclap headache'",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "Diagnóstico clínico — exames para excluir causa secundária",
        "RNM crânio com contraste: se: aura prolongada, progressão, >50 anos, sintomas atípicos",
        "Hemograma, TSH — causas sistêmicas de cefaleia",
        "Diário de cefaleia: frequência, duração, gatilhos, resposta ao tratamento",
        "Escala MIDAS: avaliar impacto na qualidade de vida",
        "Pressão arterial em toda consulta",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "Crise leve: paracetamol 1g ou AAS 500–1000 mg ± antiemético",
        "Crise moderada/grave: triptano (sumatriptano 50–100 mg VO ou 6 mg SC) — 1ª linha",
        "Triptanos + AINE: combinação mais eficaz que monoterapia",
        "Gepantes (rimegepanto, ubrogepanto): antagonistas CGRP — nova opção sem vasoconstricção",
        "Profilaxia (≥4 crises/mês ou MIDAS ≥11): propranolol 40–160 mg, amitriptilina 25–75 mg, topiramato 50–100 mg",
        "Anti-CGRP (fremanezumabe, erenumabe): injeção mensal/trimestral — refratários (aprovado ANVISA)",
        "Toxina botulínica A 155–195 U: enxaqueca crônica refratária",
        "Evitar uso de analgésicos >10 dias/mês (cefaleia por uso excessivo de medicamento)",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Diário de cefaleia: frequência, duração, gatilhos mensalmente",
        "MIDAS a cada 3 meses: avaliar resposta à profilaxia",
        "Profilaxia: reavaliar eficácia após 3 meses — manter se >50% redução",
        "Após 12 meses sem crise: considerar desmame gradual",
        "Cefaleia >15 dias/mês: investigar uso excessivo de analgésicos — desintoxicação",
        "Gestantes: paracetamol para crise; sumatriptano (2ª opção); propranolol para profilaxia",
      ],
    },
  },

  // ── DERMATOLOGIA ──────────────────────────────────────────────────────────────
  {
    id: "acne_protocolo",
    nome: "Acne Vulgar",
    especialidade: "Dermatologia",
    cor: "#f472b6",
    emoji: "🔬",
    diagnostico: {
      titulo: "Classificação e Diagnóstico",
      items: [
        "Leve: comedões predominantes (cravos abertos/fechados), poucas pápulas, sem nódulos",
        "Moderada: pápulas e pústulas em face/tronco, comedões abundantes, sem nódulos significativos",
        "Grave: nódulos, cistos, acne conglobata, cicatrizes em formação",
        "Adulta feminina (>25a): acne de mandíbula/queixo, piora perimenstrual → investigar SOP e hiperandrogenismo",
        "Acne neonatal/infantil: avaliar causa hormonal; acne cosmética: examinar produtos usados",
        "Documentar fotografia do rosto (baseline e seguimento)",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "Acne leve/moderada sem suspeita hormonal: CLÍNICO — sem exames necessários",
        "Acne em mulher adulta com irregularidade menstrual: testosterona total, DHEA-S, 17-OH progesterona, FSH, LH",
        "Pré-isotretinoína: TGP, TGO, triglicerídeos, colesterol, teste de gravidez (BHCG)",
        "Monitoramento mensal na isotretinoína: triglicerídeos, TGP, TGO, hemograma",
        "Acne nodular resistente: excluir uso de anabolizantes e cosméticos comedogênicos",
      ],
    },
    tratamento: {
      titulo: "Tratamento por Gravidade",
      items: [
        "LEVE: retinoide tópico (tretinoína 0,025–0,05%) + peróxido de benzoíla 2,5–5% — monoterapia ou combinados",
        "MODERADA: retinoide tópico + antibiótico oral (doxiciclina 100 mg/dia × 12 semanas) + peróxido de benzoíla",
        "GRAVE: isotretinoína 0,5–1 mg/kg/dia (dose cumulativa 120–150 mg/kg); considerar corticoide inicial se inflamação intensa",
        "Feminina hormonal: anticoncepcional com progestagênio antiandrogênico (drospirenona, dienogeste) ± espironolactona 50–100 mg/dia",
        "Evitar antibiótico oral >3–4 meses como monoterapia (resistência bacterial) — sempre associar tópico",
        "Cicatriz pós-acne: ácido glicólico, retinoides, luz pulsada, preenchimento ou CO2 fracionado (dermatologista)",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Reavaliação em 8–12 semanas de qualquer esquema",
        "Isotretinoína: consulta mensal com labs — monitorar triglicerídeos, enzimas, gravidez",
        "Resposta parcial após 12 semanas: escalar para próximo nível de tratamento",
        "Manutenção pós-tratamento: retinoide tópico 2–3x/semana (previne recidiva)",
        "Registro fotográfico a cada consulta para comparar evolução",
      ],
    },
  },
  {
    id: "psoriase",
    nome: "Psoríase",
    especialidade: "Dermatologia",
    cor: "#f472b6",
    emoji: "🧬",
    diagnostico: {
      titulo: "Diagnóstico",
      items: [
        "Clínico: placas eritematosas com descamação prateada, bem delimitadas — cotovelos, joelhos, couro cabeludo, região lombossacra",
        "Fenômeno de Koebner: lesões em áreas de trauma cutâneo",
        "Sinal da vela: raspagem revela escamas que desprendem como raspar uma vela",
        "Sinal de Auspitz: sangramento puntiforme ao remover escamas",
        "Artrite psoriásica em 30%: dactilite, entesite, oligoartrite assimétrica ou padrão de AR — rastrear sempre",
        "PASI (Psoriasis Area Severity Index): quantifica extensão e gravidade — PASI >10 = moderada/grave",
      ],
    },
    exames: {
      titulo: "Avaliação e Exames",
      items: [
        "Leve-moderada sem artropatia: clínico, sem exames obrigatórios",
        "Antes de biológicos: PPD/IGRA (tuberculose latente), HIV, hepatite B (HBsAg, anti-HBc), hepatite C",
        "Metotrexato: hemograma, TFGe, TGP, TGO basal; FAN e anti-dsDNA se suspeita lúpus",
        "Artrite psoriásica: RX de mãos/pés, VSH, PCR-as, anti-CCP (geralmente negativo), fator reumatoide",
        "Comorbidades: síndrome metabólica, DM2, DCV, depressão — avaliar em cada consulta",
        "Biópsia cutânea: se diagnóstico incerto (psoríase vs. parapsoriase, micose fungoide)",
      ],
    },
    tratamento: {
      titulo: "Tratamento Escalonado",
      items: [
        "LEVE (PASI <10, BSA <10%): corticoide tópico + análogo de vitamina D3 (calcipotriol) — combinação Dovobet®",
        "MODERADA: fototerapia UVB banda estreita (3x/semana) ou PUVA; metotrexato 15–25 mg/semana",
        "GRAVE (PASI >10) ou artrite: biológicos — anti-TNF (adalimumabe, etanercepte), anti-IL-17 (secuquinumabe, ixequizumabe), anti-IL-23 (guselcumabe, risanquizumabe)",
        "Anti-IL-17 e IL-23: taxas de PASI 90–100 acima de 80% em estudos — superiores ao anti-TNF em pele",
        "Apremilaste (inibidor de PDE4): alternativa oral para formas moderadas sem artrite",
        "Psoríase do couro cabeludo: xampu de coaltar, xampus de corticoide, calcipotriol loção",
        "Artrite psoriásica: AINEs para sintomas leves; metotrexato; biológico se falha ou artrite axial",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Alvo terapêutico: PASI 90 (redução de 90%) ou PASI 75 mínimo",
        "Reavaliação de biológico em 16 semanas — se PASI <75: trocar de mecanismo",
        "Tuberculose latente (IGRA+): tratamento com isoniazida 9 meses antes de iniciar biológico",
        "Comorbidades: controle de peso, estatina, pressão arterial — psoríase é fator de risco cardiovascular",
        "Triagem anual de artrite psoriásica (PEST questionnaire): articulações dolorosas, dactilite, entesite",
      ],
    },
  },

  // ── GERIATRIA ─────────────────────────────────────────────────────────────────
  {
    id: "fragilidade",
    nome: "Síndrome de Fragilidade no Idoso",
    especialidade: "Geriatria",
    cor: "#94a3b8",
    emoji: "🧓",
    diagnostico: {
      titulo: "Critérios de Fried (Fenotipo de Fragilidade)",
      items: [
        "1. Perda de peso não intencional: >4,5 kg ou >5% do peso no último ano",
        "2. Exaustão/fadiga: autorrelato de sentir-se exausto na maioria dos dias",
        "3. Fraqueza muscular: força de preensão palmar <26 kg (H) ou <18 kg (M) — dinamômetro",
        "4. Lentidão da marcha: tempo >6 segundos para percorrer 4,5 metros",
        "5. Baixo nível de atividade física: <383 kcal/semana (H) ou <270 kcal/semana (M)",
        "Pré-frágil: 1–2 critérios | Frágil: ≥3 critérios — maior risco de quedas, hospitalização e morte",
      ],
    },
    exames: {
      titulo: "Avaliação Laboratorial e Funcional",
      items: [
        "Hemograma: anemia como fator contribuinte",
        "TSH: hipotireoidismo causa fadiga e fraqueza",
        "Vitamina D: deficiência contribui para fraqueza muscular e quedas",
        "Albumina e proteína: estado nutricional",
        "Glicemia e HbA1c: DM não controlado piora sarcopenia",
        "Avaliação Geriátrica Ampla (AGA): cognição (MoCA/MEEM), funcionalidade (ADL/IADL), humor (GDS), nutrição (MNA), quedas",
        "Densitometria óssea: associação frequente com osteoporose",
        "Força de preensão palmar (dinamômetro) + velocidade de marcha (TUG test)",
      ],
    },
    tratamento: {
      titulo: "Intervenção Multidimensional",
      items: [
        "EXERCÍCIO: treinamento resistido progressivo 2–3x/semana — principal intervenção com evidência",
        "NUTRIÇÃO: 1,2–1,5 g/proteína/kg/dia; suplementação de whey proteína após treino; calorias adequadas",
        "Vitamina D: 800–2000 UI/dia (otimizar para 50–80 ng/mL) — melhora força muscular e reduz quedas",
        "Deprescrisção: revisar medicamentos (polifarmácia pior a fragilidade) — usar critérios de Beers",
        "Controle de comorbidades: anemia, hipotireoidismo, depressão, dor crônica",
        "Intervenção psicossocial: estimulação cognitiva, atividades sociais, suporte familiar",
        "Revisão do ambiente: banheiro adaptado, iluminação, tapetes removidos (prevenção de quedas)",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Reavaliação funcional (TUG, SPPB) a cada 3–6 meses",
        "Força de preensão: alvo >26 kg (H) e >16 kg (M)",
        "Nutrição: monitorar peso e albumina mensalmente se desnutrição",
        "Revisão de medicamentos a cada 6 meses (polifarmácia)",
        "Avaliação de quedas: diário de quedas, adaptação do ambiente",
        "Meta: regressão para pré-frágil ou manutenção da funcionalidade",
      ],
    },
  },

  // ── MEDICINA DO ESPORTE ───────────────────────────────────────────────────────
  {
    id: "overtraining",
    nome: "Síndrome do Overtraining (SOT)",
    especialidade: "Medicina do Esporte",
    cor: "#22d3ee",
    emoji: "🏃",
    diagnostico: {
      titulo: "Critérios Diagnósticos (REDS/ECSS 2023)",
      items: [
        "Queda de performance inexplicada por ≥2 semanas apesar de período adequado de recuperação",
        "Fadiga persistente desproporcional ao volume de treino",
        "Sintomas: alteração do humor (irritabilidade, depressão), distúrbios do sono, anorexia, infecções recorrentes",
        "Diagnóstico de exclusão: afastar patologias (hipotireoidismo, anemia, DM, depressão, infecção viral)",
        "Overreaching não funcional: recuperação em semanas; SOT verdadeiro: recuperação em meses a anos",
        "Atletas femininas: investigar RED-S (Deficiência Energética Relativa no Esporte) — tríade: energia, ciclo menstrual, DMO",
      ],
    },
    exames: {
      titulo: "Avaliação Laboratorial",
      items: [
        "Hemograma: anemia (ferropriva, deficiência de B12)",
        "Ferritina: <50 ng/mL prejudica performance aeróbica mesmo sem anemia",
        "TSH e T4L: hipotireoidismo mimetiza SOT",
        "Testosterona total + cortisol matinal: ratio T:C diminuído no SOT",
        "Glicemia e HbA1c: DM1/2 não controlado",
        "Vitamina D: deficiência causa fadiga e queda de performance",
        "CK total: elevação crônica em overreaching, normaliza em repouso",
        "Hormônios reprodutivos femininos (amenorreia): FSH, LH, estradiol, AMH",
        "DEXA: densidade óssea se suspeita de RED-S",
      ],
    },
    tratamento: {
      titulo: "Manejo e Recuperação",
      items: [
        "REDUÇÃO DO VOLUME: diminuir intensidade e volume em 30–50% por pelo menos 2–4 semanas",
        "REPOUSO ATIVO: treinos leves (yoga, natação recreativa, caminhada) — não repouso absoluto",
        "NUTRIÇÃO: garantir balanço energético positivo — calcular gasto energético e atingir superávit leve",
        "Carboidratos: 5–7 g/kg/dia para reposição de glicogênio",
        "Proteína: 1,6–2,0 g/kg/dia para reparo muscular",
        "Sono: 8–10h/noite — higiene do sono rigorosa",
        "Psicólogo esportivo: se componente emocional (burnout, pressão de performance)",
        "RED-S: recuperação de peso e ciclo menstrual; considerar COC se amenorreia por >6 meses",
        "Retorno ao treino: gradual (10% volume/semana) com monitoramento de HRV e performance",
      ],
    },
    acompanhamento: {
      titulo: "Monitoramento e Prevenção",
      items: [
        "HRV (Heart Rate Variability): redução sustentada precede SOT — monitorar com app ou Garmin/Polar",
        "PSE (Percepção Subjetiva de Esforço): alta PSE com mesma carga = sinal precoce",
        "POMS (Profile of Mood States): detecção precoce de alterações do humor",
        "Periodização do treino: semanas de descarga a cada 3–4 semanas de carga",
        "Labs: ferritina, vitamina D e hemograma a cada 3 meses em atletas de alto rendimento",
        "Retorno à competição: só após performance normalizar e ausência de sintomas",
      ],
    },
  },

  // ── HPB ────────────────────────────────────────────────────────────────────
  {
    id: "hpb",
    nome: "Hiperplasia Prostática Benigna (HPB)",
    especialidade: "Urologia",
    cor: "#3b82f6",
    emoji: "🔵",
    diagnostico: {
      titulo: "Diagnóstico",
      items: [
        "Sintomas do trato urinário inferior (LUTS): frequência, urgência, noctúria, jato fraco, esforço miccional",
        "IPSS (International Prostate Symptom Score): leve 0–7, moderado 8–19, grave 20–35",
        "TR (toque retal): próstata aumentada, homogênea, lisa — exclui carcinoma grosseiro",
        "PSA para rastreio de Ca próstata em homens >50 anos (ou >45 em alto risco)",
        "Fluxometria: Qmax <15 mL/s sugere obstrução",
        "USG próstata + resíduo pós-miccional: volume >80 mL e RPM >150 mL = fatores de risco para progressão",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "PSA total e livre — rastreio Ca próstata; PSA >4: considerar biópsia",
        "Ureia, creatinina — avaliar repercussão renal",
        "EAS + urocultura — descartar ITU ou hematúria",
        "USG de vias urinárias com resíduo pós-miccional",
        "Fluxometria urinária — Qmax",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "IPSS leve (0–7) + pouco incômodo: conduta expectante + medidas comportamentais",
        "Alfabloqueador (1ª linha IPSS moderado/grave): tansulosina 0,4 mg/dia OU silodosina 8 mg/dia",
        "Inibidor da 5-alfaredutase (próstata >40 mL): dutasterida 0,5 mg/dia OU finasterida 5 mg/dia",
        "Terapia combinada (próstata grande + IPSS grave): alfabloqueador + 5-ARI (estudo CombAT)",
        "Antimuscarínico/beta-3 agonista se componente hiperativo (OAB): mirabegron 50 mg/dia",
        "Inibidor PDE5 (tadalafila 5 mg/dia): HPB + disfunção erétil",
        "Indicação cirúrgica: RTU próstata, HOLEP ou cirurgia aberta — volume >80 mL, falha clínica, retenção urinária",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Retorno 4–6 semanas: avaliação de resposta sintomática e efeitos adversos",
        "PSA anual após início de 5-ARI: esperar redução ~50% em 6–12 meses (valor duplicar para comparação real)",
        "Seguimento anual: IPSS, Qmax, RPM, PSA",
        "Encaminhamento urologia: retenção urinária, hematúria, ITU recorrente, insuficiência renal, falha clínica",
      ],
    },
  },

  // ── Disfunção Erétil ───────────────────────────────────────────────────────
  {
    id: "disfuncao-eretil",
    nome: "Disfunção Erétil",
    especialidade: "Urologia",
    cor: "#8b5cf6",
    emoji: "💜",
    diagnostico: {
      titulo: "Diagnóstico",
      items: [
        "IIFE-5 (Índice Internacional de Função Erétil): 22–25 sem DE; 17–21 leve; 12–16 moderada; 5–11 grave",
        "Investigar fatores de risco: DM, HAS, tabagismo, dislipidemia, sedentarismo, obesidade, depressão",
        "Revisar medicamentos: anti-hipertensivos (betabloqueadores, diuréticos), antidepressivos, antipsicóticos",
        "DE de início súbito + erções noturnas preservadas: componente psicogênico provável",
        "DE progressiva em homem >50 com FR cardiovasculares: componente orgânico — avaliar risco CV antes de tratamento",
        "Testosterona matinal: excluir hipogonadismo como causa",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "Testosterona total (coleta 7–10h) — excluir hipogonadismo",
        "Glicemia jejum + HbA1c — DM como causa",
        "Lipidograma + ApoB — dislipidemia",
        "TSH — hipotireoidismo",
        "PSA se >45 anos antes de TRT",
        "Prolactina se suspeita de hiperprolactinemia",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "Tratar causa base: controle DM, HAS, dislipidemia, depressão, substituir medicamentos",
        "Modificação estilo de vida: exercício aeróbico ≥150 min/semana reduz DE em 30–40%",
        "Inibidores PDE5 (1ª linha): sildenafila 50 mg (conforme demanda), tadalafila 5 mg/dia (uso contínuo)",
        "Vardenafila 10 mg ou avanafila 100 mg: alternativas com perfil de início de ação diferente",
        "Hipogonadismo confirmado: TRT — melhora libido e potencializa resposta a PDE5",
        "Falha PDE5: injeção intracavernosa (alprostadil), vacuoterapia, implante peneano",
        "Componente psicogênico importante: encaminhar para psicoterapia / sexologia",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Retorno 4–6 semanas: IIFE-5, tolerância, ajuste de dose",
        "PDE5i + nitratos: contraindicação absoluta (hipotensão grave)",
        "Doença cardiovascular instável: consultar cardiologia antes de PDE5i",
        "Monitorar testosterona, hemograma, PSA em uso de TRT",
        "Acompanhamento anual com perfil metabólico e IIFE-5",
      ],
    },
  },

  // ── Rinite Alérgica ────────────────────────────────────────────────────────
  {
    id: "rinite-alergica",
    nome: "Rinite Alérgica",
    especialidade: "Otorrino",
    cor: "#06b6d4",
    emoji: "🫁",
    diagnostico: {
      titulo: "Diagnóstico",
      items: [
        "Clínico: rinorreia aquosa + espirros + obstrução nasal + prurido nasal/ocular — ≥2 sintomas por >1h/dia",
        "Classificação ARIA: intermitente (<4 dias/semana OU <4 semanas) vs. persistente",
        "Gravidade: leve (sem comprometimento) vs. moderada/grave (distúrbio sono, trabalho, qualidade de vida)",
        "Fatores desencadeantes: pólen, ácaro (Dermatophagoides), pelos de animais, fungos, baratas",
        "Rinoscopia: mucosa pálida/azulada, edemaciada, secreção aquosa",
        "Exames complementares: IgE total + IgE específica (RAST) ou teste cutâneo de leitura imediata",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "IgE total + IgE específica para aeroalérgenos (ácaro, pólen, epitélio animal, fungos)",
        "Hemograma: eosinofilia periférica sugestiva de atopia",
        "Citologia nasal: eosinófilos indicam rinite alérgica ou NARES",
        "TC seios da face se suspeita de rinossinusite associada",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "Evicção do alérgeno (fundamental): capas impermeáveis, aspiração frequente, controle umidade",
        "Corticoide intranasal (1ª linha sintomática): budesonida spray 256 µg/dia OU fluticasona 200 µg/dia",
        "Anti-histamínico oral de 2ª geração: loratadina 10 mg/dia, cetirizina 10 mg/dia, fexofenadina 120–180 mg/dia",
        "Anti-histamínico + corticoide intranasal: melhor controle que monoterapia",
        "Descongestionante (uso curto <7 dias): oximetazolina 0,05% — evitar uso crônico (rinite medicamentosa)",
        "Montelucaste: adjuvante em rinite + asma",
        "Imunoterapia alérgeno-específica (SLIT/SCIT): indicada em refratários ou polissensibilizados — remissão a longo prazo",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Retorno em 4–6 semanas: controle sintomático e aderência",
        "Corticoide intranasal: efeito máximo em 2–4 semanas — orientar uso regular",
        "Rastrear asma em todos os pacientes com rinite (conexão rinite-asma: ARIA)",
        "Imunoterapia: duração 3–5 anos, reavaliação semestral",
        "Encaminhar otorrino: desvio de septo, polipose nasal, falha ao tratamento clínico",
      ],
    },
  },

  // ── Sinusite Crônica ───────────────────────────────────────────────────────
  {
    id: "sinusite-cronica",
    nome: "Rinossinusite Crônica",
    especialidade: "Otorrino",
    cor: "#10b981",
    emoji: "🔬",
    diagnostico: {
      titulo: "Diagnóstico",
      items: [
        "Sintomas ≥12 semanas: obstrução/congestão nasal, rinorreia anterior/posterior, dor/pressão facial, hiposmia/anosmia",
        "≥2 sintomas + evidência objetiva (rinoscopia ou TC)",
        "Com pólipos (RSCcPN) vs. sem pólipos (RSCsPN): fenótipos distintos, tratamento diferente",
        "TC seios da face: padrão ouro para diagnóstico e estadiamento (Lund-Mackay score)",
        "Endoscopia nasal: avalia complexo ostiomeatal e presença de pólipos",
        "Fatores contribuintes: rinite alérgica, DRGE, desvio septal, deficiência imune, AFRS, asma",
      ],
    },
    exames: {
      titulo: "Exames",
      items: [
        "TC seios da face (coronal): estadiamento de acometimento",
        "Rinoscopia anterior ou endoscopia nasal",
        "IgE total + painel alérgenos: excluir base alérgica",
        "Culturas de secreção por endoscopia: em refratários ou suspeita de fungos/bactérias resistentes",
        "Biópsia de mucosa/pólipo: excluir neoplasia se unilateral",
        "IgA, IgG, IgM, subclasses IgG: deficiências imunes em sinusite recorrente",
      ],
    },
    tratamento: {
      titulo: "Tratamento",
      items: [
        "Irrigação nasal salina isotônica 2x/dia: clearance de muco, first-line adjuvante",
        "Corticoide intranasal contínuo: budesonida 256 µg 2x/dia ou mometasona 200 µg/dia",
        "RSCcPN moderada/grave: corticoide oral (prednisona 0,5–1 mg/kg/dia por 5–14 dias) para redução de pólipos",
        "Antibiótico oral em surto agudo: amoxicilina-clavulanato 875/125 mg 12/12h por 10–14 dias",
        "Antro-lavagem e CENS (cirurgia endoscópica nasal): refratários ao tratamento clínico",
        "Biológico (dupilumabe 300 mg SC/2 semanas): RSCcPN grave refratária — aprovado ANVISA",
        "DRGE associada: IBP + cabeceira elevada",
      ],
    },
    acompanhamento: {
      titulo: "Acompanhamento",
      items: [
        "Retorno 4–6 semanas: sintomas, rinoscopia, aderência ao corticoide intranasal",
        "Manutenção com corticoide intranasal indefinidamente para prevenir recorrência pós-cirurgia",
        "Dupilumabe: reavaliação clínica + endoscopia a cada 6 meses; suspensão se ausência de resposta em 4 meses",
        "Encaminhamento otorrino: todos RSCcPN, falha clínica, suspeita de complicação (celulite orbitária, meningite)",
        "Acompanhar asma associada: controle integrado rinite-asma-sinusite",
      ],
    },
  },
]

// ─── Components ───────────────────────────────────────────────────────────────

const ESPECIALIDADES: Especialidade[] = ["Endocrinologia", "Nutrologia", "Cardiologia", "Ginecologia", "Reumatologia", "Neurologia", "Dermatologia", "Geriatria", "Medicina do Esporte", "Geral"]
const ESP_CORES: Record<Especialidade, string> = {
  Endocrinologia:      "#f59e0b",
  Nutrologia:          "#10b981",
  Cardiologia:         "#ef4444",
  Ginecologia:         "#e1306c",
  Reumatologia:        "#8b5cf6",
  Neurologia:          "#6366f1",
  Dermatologia:        "#f472b6",
  Geriatria:           "#94a3b8",
  "Medicina do Esporte": "#22d3ee",
  Urologia:            "#3b82f6",
  Otorrino:            "#06b6d4",
  Geral:               "#7c85a0",
}

function SecaoItem({ titulo, items, cor }: { titulo: string; items: string[]; cor: string }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors"
        style={{ background: "var(--surface)" }}
      >
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider" style={{ color: cor }}>
          {titulo}
        </span>
        {open
          ? <ChevronUp className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
          : <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}
      </button>
      {open && (
        <div className="px-4 py-3 space-y-2" style={{ background: "var(--card)" }}>
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[9px] mt-1 flex-shrink-0" style={{ color: cor }}>▸</span>
              <span className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

const ETAPAS = [
  { key: "diagnostico",    label: "Diagnóstico",  icon: Stethoscope  },
  { key: "exames",         label: "Exames",       icon: FlaskConical },
  { key: "tratamento",     label: "Tratamento",   icon: Pill         },
  { key: "acompanhamento", label: "Seguimento",   icon: Activity     },
] as const

function ProtocoloStepper({ protocolo }: { protocolo: Protocolo }) {
  return (
    <div className="px-5 pt-4 pb-2 space-y-0">
      {ETAPAS.map((etapa, i) => {
        const secao  = protocolo[etapa.key]
        const Icon   = etapa.icon
        const isLast = i === ETAPAS.length - 1
        return (
          <div key={etapa.key} className="relative flex gap-4">
            {/* Coluna esquerda: ícone + linha conectora */}
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                style={{ background: `${protocolo.cor}18`, border: `2px solid ${protocolo.cor}50` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: protocolo.cor }} />
              </div>
              {!isLast && (
                <div className="w-px flex-1 my-1" style={{ background: `${protocolo.cor}25`, minHeight: "24px" }} />
              )}
            </div>

            {/* Coluna direita: conteúdo */}
            <div className={cn("flex-1 min-w-0 pb-5", isLast && "pb-2")}>
              <div className="flex items-center gap-2 mb-2.5 mt-1">
                <span
                  className="text-[11px] font-mono font-bold uppercase tracking-widest"
                  style={{ color: protocolo.cor }}
                >
                  {etapa.label}
                </span>
                <span
                  className="text-[9px] font-mono px-2 py-0.5 rounded-full"
                  style={{
                    background: `${protocolo.cor}12`,
                    color:      protocolo.cor,
                    border:     `1px solid ${protocolo.cor}30`,
                  }}
                >
                  {secao.items.length} item{secao.items.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-1.5">
                {secao.items.map((item, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <span className="text-[8px] mt-[5px] flex-shrink-0" style={{ color: protocolo.cor }}>▸</span>
                    <span className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {!isLast && (
                <div className="flex items-center gap-1.5 mt-3">
                  <ArrowDown className="w-3 h-3" style={{ color: `${protocolo.cor}55` }} />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProtocolosTab() {
  const [busca,     setBusca]    = useState("")
  const [selected,  setSelected] = useState<Protocolo | null>(null)
  const [loading,   setLoading]  = useState(false)
  const [aiText,    setAiText]   = useState<string | null>(null)
  const [aiInput,   setAiInput]  = useState("")
  const [error,     setError]    = useState<string | null>(null)
  const [copied,    setCopied]   = useState<"protocolo" | "ai" | null>(null)

  const protocolosFiltrados = useMemo(() => {
    return [...PROTOCOLOS]
      .filter(p => !busca || p.nome.toLowerCase().includes(busca.toLowerCase()))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
  }, [busca])

  const textoCompleto = (p: Protocolo) =>
    `PROTOCOLO: ${p.nome} (${p.especialidade})\n\n` +
    [p.diagnostico, p.exames, p.tratamento, p.acompanhamento]
      .map(s => `${s.titulo.toUpperCase()}\n${s.items.map(i => `• ${i}`).join("\n")}`)
      .join("\n\n")

  const copiar = (tipo: "protocolo" | "ai") => {
    const text = tipo === "protocolo" && selected
      ? textoCompleto(selected)
      : aiText ?? ""
    navigator.clipboard.writeText(text).then(() => {
      setCopied(tipo)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const personalizar = async () => {
    if (!selected || !aiInput.trim()) return
    setLoading(true); setError(null); setAiText(null)
    try {
      const res = await fetch("/api/protocolos", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          protocolo: selected.nome,
          contexto:  aiInput,
          protocolo_base: textoCompleto(selected),
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAiText(data.texto)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8">
        <div className="mb-5">
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar protocolo…"
            className="w-full text-[12px] px-4 py-2.5 rounded-xl outline-none"
            style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {protocolosFiltrados.map(p => (
            <button
              key={p.id}
              onClick={() => { setSelected(p); setAiText(null); setAiInput("") }}
              className="text-left rounded-2xl p-4 transition-all hover:scale-[1.01]"
              style={{
                background: "var(--card)",
                border: `1px solid ${selected?.id === p.id ? p.cor + "50" : "var(--border)"}`,
              }}
            >
              <div className="text-2xl mb-2">{p.emoji}</div>
              <div className="text-[13px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                {p.nome}
              </div>
              <span
                className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: `${ESP_CORES[p.especialidade]}12`,
                  color: ESP_CORES[p.especialidade],
                  border: `1px solid ${ESP_CORES[p.especialidade]}30`,
                }}
              >
                {p.especialidade}
              </span>
            </button>
          ))}
        </div>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 px-4"
          style={{ background: "rgba(8,9,14,0.85)" }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}
        >
          <div className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {/* Header */}
            <div className="px-5 py-4 flex items-start justify-between gap-3" style={{ background: `${selected.cor}08`, borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selected.emoji}</span>
                <div>
                  <div className="text-[16px] font-bold" style={{ color: "var(--text-primary)" }}>{selected.nome}</div>
                  <span className="text-[10px] font-mono" style={{ color: selected.cor }}>{selected.especialidade}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => copiar("protocolo")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all"
                  style={{
                    background: copied === "protocolo" ? "var(--accent-dim)" : "var(--surface)",
                    border: `1px solid ${copied === "protocolo" ? "var(--accent-border)" : "var(--border)"}`,
                    color: copied === "protocolo" ? "var(--accent)" : "var(--text-muted)",
                  }}
                >
                  {copied === "protocolo" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied === "protocolo" ? "Copiado" : "Copiar"}
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stepper visual */}
            <ProtocoloStepper protocolo={selected} />

            {/* AI Personalização */}
            <div className="px-5 pb-5 space-y-3">
              <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <Wand2 className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
                  <span className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>
                    Personalizar com IA
                  </span>
                </div>
                <textarea
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  placeholder="Descreva o paciente e contexto específico (ex: homem 52 anos, DM2 + obesidade grau II, falha com metformina, quer evitar injeções)…"
                  rows={3}
                  className="w-full text-[12px] px-3 py-2.5 rounded-lg outline-none resize-none"
                  style={{
                    background: "var(--card)", border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  onClick={personalizar}
                  disabled={loading || !aiInput.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-50"
                  style={{ background: "var(--accent)", color: "#080808" }}
                >
                  {loading
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando…</>
                    : <><BookMarked className="w-3.5 h-3.5" /> Gerar protocolo personalizado</>}
                </button>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg p-3 bg-red-50 border border-red-200">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-300">{error}</p>
                  </div>
                )}

                {aiText && (
                  <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--accent-border)" }}>
                    <div className="px-3 py-2 flex items-center justify-between" style={{ background: "var(--accent-dim)" }}>
                      <span className="text-[10px] font-mono font-bold" style={{ color: "var(--accent)" }}>
                        PROTOCOLO PERSONALIZADO · IA
                      </span>
                      <button
                        onClick={() => copiar("ai")}
                        className="flex items-center gap-1 text-[10px] transition-all"
                        style={{ color: copied === "ai" ? "var(--accent)" : "var(--text-muted)" }}
                      >
                        {copied === "ai" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied === "ai" ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="text-[12px] leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                        {aiText}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

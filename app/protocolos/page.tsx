"use client"

import { useState, useMemo } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  X, ChevronDown, ChevronUp, Copy, Check, Wand2, Loader2,
  BookMarked, AlertCircle,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type Especialidade = "Endocrinologia" | "Nutrologia" | "Cardiologia" | "Geral"

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
]

// ─── Components ───────────────────────────────────────────────────────────────

const ESPECIALIDADES: Especialidade[] = ["Endocrinologia", "Nutrologia", "Cardiologia", "Geral"]
const ESP_CORES: Record<Especialidade, string> = {
  Endocrinologia: "#f59e0b",
  Nutrologia:     "#10b981",
  Cardiologia:    "#ef4444",
  Geral:          "#7c85a0",
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProtocolosPage() {
  const [filtro,    setFiltro]   = useState<Especialidade | "Todos">("Todos")
  const [busca,     setBusca]    = useState("")
  const [selected,  setSelected] = useState<Protocolo | null>(null)
  const [loading,   setLoading]  = useState(false)
  const [aiText,    setAiText]   = useState<string | null>(null)
  const [aiInput,   setAiInput]  = useState("")
  const [error,     setError]    = useState<string | null>(null)
  const [copied,    setCopied]   = useState<"protocolo" | "ai" | null>(null)

  const protocolosFiltrados = useMemo(() => {
    return PROTOCOLOS.filter(p => {
      const matchEsp = filtro === "Todos" || p.especialidade === filtro
      const matchBusca = !busca || p.nome.toLowerCase().includes(busca.toLowerCase())
      return matchEsp && matchBusca
    })
  }, [filtro, busca])

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
    <div className="animate-fade-in">
      <TopBar
        title="Protocolos Clínicos"
        subtitle={`BIBLIOTECA · ${PROTOCOLOS.length} PROTOCOLOS BASEADOS EM EVIDÊNCIAS`}
      />

      <div className="p-4 md:p-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar protocolo…"
            className="flex-1 text-[12px] px-4 py-2.5 rounded-xl outline-none"
            style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <div className="flex gap-1.5 flex-wrap">
            {(["Todos", ...ESPECIALIDADES] as const).map(e => (
              <button
                key={e}
                onClick={() => setFiltro(e)}
                className="text-[11px] px-3 py-2 rounded-xl transition-all"
                style={{
                  background: filtro === e ? (e === "Todos" ? "var(--accent-dim)" : `${ESP_CORES[e as Especialidade]}15`) : "var(--surface)",
                  border: `1px solid ${filtro === e ? (e === "Todos" ? "var(--accent-border)" : `${ESP_CORES[e as Especialidade]}40`) : "var(--border)"}`,
                  color: filtro === e ? (e === "Todos" ? "var(--accent)" : ESP_CORES[e as Especialidade]) : "var(--text-muted)",
                }}
              >
                {e}
              </button>
            ))}
          </div>
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
      </div>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 px-4"
          style={{ background: "rgba(8,9,14,0.85)" }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}
        >
          <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
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

            {/* Sections */}
            <div className="p-5 space-y-3">
              <SecaoItem titulo={selected.diagnostico.titulo} items={selected.diagnostico.items} cor={selected.cor} />
              <SecaoItem titulo={selected.exames.titulo}      items={selected.exames.items}      cor={selected.cor} />
              <SecaoItem titulo={selected.tratamento.titulo}  items={selected.tratamento.items}  cor={selected.cor} />
              <SecaoItem titulo={selected.acompanhamento.titulo} items={selected.acompanhamento.items} cor={selected.cor} />
            </div>

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
                  <div className="flex items-start gap-2 rounded-lg p-3 bg-red-950/40 border border-red-500/30">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
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

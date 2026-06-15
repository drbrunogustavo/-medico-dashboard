"use client"

import { useState, useMemo } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  FlaskConical, Search, ChevronDown, ChevronRight, Copy, Check,
  Loader2, AlertTriangle, Info, Zap,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type ClassLevel = "baixo" | "normal" | "limítrofe" | "elevado" | "muito_elevado" | "deficiente" | "insuficiente" | "ótimo"

interface ExamRange {
  lab: string
  functional?: string
  unit: string
  classifyFn: (v: number, sexo?: string) => ClassLevel
}

interface ExamData {
  id: string
  name: string
  category: string
  range: ExamRange
  correlations: string[]
  conducts: string[]
  related: string[]
  notes?: string
}

interface ExamResult {
  exam: ExamData
  value: number
  level: ClassLevel
  sexo: string
}

// ─── Classification helpers ───────────────────────────────────────────────────

const LEVEL_CONFIG: Record<ClassLevel, { label: string; color: string; bg: string; border: string }> = {
  baixo:         { label: "Abaixo",     color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200"   },
  deficiente:    { label: "Deficiente", color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200"    },
  insuficiente:  { label: "Insuficiente",color:"text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  limítrofe:     { label: "Limítrofe",  color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200"  },
  normal:        { label: "Normal",     color: "text-emerald-700",bg: "bg-emerald-50",border: "border-emerald-200"},
  ótimo:         { label: "Ótimo",      color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200"  },
  elevado:       { label: "Elevado",    color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  muito_elevado: { label: "Muito elevado",color:"text-red-700",   bg: "bg-red-50",    border: "border-red-200"    },
}

// ─── Exam database ────────────────────────────────────────────────────────────

const EXAMS: ExamData[] = [
  // ── Tireoide ──
  {
    id: "tsh", name: "TSH", category: "Tireoide",
    range: {
      lab: "0,4–4,0 mUI/L", functional: "1,0–2,5 mUI/L", unit: "mUI/L",
      classifyFn: (v) => v < 0.1 ? "muito_elevado" : v < 0.4 ? "baixo" : v <= 2.5 ? "ótimo" : v <= 4.0 ? "limítrofe" : v <= 10 ? "elevado" : "muito_elevado",
    },
    correlations: ["Hipotireoidismo subclínico (TSH >4,0 com T4L normal)", "Hipertireoidismo (TSH suprimido)", "Resistência periférica a T3/T4 quando TSH elevado com T4L elevado"],
    conducts: ["TSH >4,0 com T4L normal: repetir em 3–6 meses + Anti-TPO", "TSH >10: avaliar levotiroxina independente dos sintomas", "TSH <0,4: solicitar T4L, T3L e cintilografia tireoide"],
    related: ["T4 livre", "T3 livre", "Anti-TPO", "Anti-Tg"],
  },
  {
    id: "t4l", name: "T4 Livre", category: "Tireoide",
    range: {
      lab: "0,8–1,8 ng/dL", functional: "1,0–1,5 ng/dL", unit: "ng/dL",
      classifyFn: (v) => v < 0.8 ? "baixo" : v <= 1.5 ? "ótimo" : v <= 1.8 ? "normal" : "elevado",
    },
    correlations: ["Hipotireoidismo quando baixo com TSH elevado", "Hipertireoidismo quando alto com TSH suprimido", "Síndrome do eutireoidiano doente (T4L baixo com TSH normal — doenças graves)"],
    conducts: ["T4L baixo + TSH alto: hipotireoidismo primário — avaliar reposição", "T4L alto + TSH suprimido: hipertireoidismo — solicitar T3L e cintilografia", "Correlacionar sempre com TSH — nunca interpretar isoladamente"],
    related: ["TSH", "T3 livre", "Anti-TPO"],
  },
  {
    id: "t3l", name: "T3 Livre", category: "Tireoide",
    range: {
      lab: "2,3–4,2 pg/mL", functional: "3,0–4,0 pg/mL", unit: "pg/mL",
      classifyFn: (v) => v < 2.3 ? "baixo" : v <= 4.0 ? "normal" : "elevado",
    },
    correlations: ["Conversão periférica de T4→T3 depende de deiodinase (selênio, zinco, cortisol)", "T3L baixo com T4L normal: déficit de conversão — comum em hipotireoidismo periférico funcional", "Melhor marcador de ação tecidual tireoidiana"],
    conducts: ["T3L baixo: avaliar selênio, zinco, cortisol e função hepática", "Considerar T3 (liotironina) se persistência de sintomas hipotireoidanos com T4L normal", "Não usar T3L isolado para diagnóstico — sempre correlacionar com TSH e T4L"],
    related: ["TSH", "T4 livre", "Selênio sérico"],
  },
  {
    id: "antitpo", name: "Anti-TPO", category: "Tireoide",
    range: {
      lab: "<35 UI/mL", unit: "UI/mL",
      classifyFn: (v) => v < 35 ? "normal" : v < 100 ? "limítrofe" : "elevado",
    },
    correlations: ["Tireoidite de Hashimoto (principal causa de hipotireoidismo no Brasil)", "Presente em 8–10% da população sem disfunção tireoidiana", "Associado a outras doenças autoimunes: diabetes tipo 1, vitiligo, lúpus"],
    conducts: ["Anti-TPO elevado + TSH normal: monitorar TSH a cada 6–12 meses", "Anti-TPO elevado + TSH >4,0: maior indicação de tratamento precoce", "Glúten e tireoidite: evidência limitada — não restringir sem doença celíaca confirmada"],
    related: ["TSH", "T4 livre", "Anti-Tg", "Glicemia, HbA1c"],
  },
  {
    id: "antitig", name: "Anti-Tireoglobulina (Anti-Tg)", category: "Tireoide",
    range: {
      lab: "<40 UI/mL", unit: "UI/mL",
      classifyFn: (v) => v < 40 ? "normal" : "elevado",
    },
    correlations: ["Marcador de autoimunidade tireoidiana — complementar ao Anti-TPO", "Presente em ~60–80% dos Hashimoto", "Importante no seguimento pós-tireidectomia por câncer (interfere na dosagem de tireoglobulina)"],
    conducts: ["Elevado isolado (Anti-TPO normal): monitorar TSH anualmente", "No pós-cirúrgico de Ca tireoide: Anti-Tg positivo invalida dosagem de tireoglobulina como marcador tumoral", "Não tratar com base apenas em Anti-Tg sem disfunção hormonal"],
    related: ["Anti-TPO", "TSH", "Tireoglobulina"],
  },
  // ── Ferro ──
  {
    id: "ferritina", name: "Ferritina", category: "Ferro",
    range: {
      lab: "13–150 ng/mL (M) · 30–400 ng/mL (H)", functional: "50–150 ng/mL", unit: "ng/mL",
      classifyFn: (v, s) => {
        const minLab = s === "Homem" ? 30 : 13
        if (v < 20) return "deficiente"
        if (v < 50) return "baixo"
        if (v <= 150) return "normal"
        if (v <= 300) return "elevado"
        return "muito_elevado"
      },
    },
    correlations: ["Principal reserva de ferro do organismo", "Ferritina <30: depleção de estoques (fase pré-anêmica)", "Ferritina elevada: inflamação, DHGNA, hemocromatose, síndrome metabólica"],
    conducts: ["Ferritina <30 ng/mL: repor ferro (oral ou EV conforme tolerância)", "Ferritina <50 com sintomas: queda de cabelo, fadiga, neblina mental — avaliar reposição", "Ferritina >300 ng/mL: descartar inflamação (PCR-as), DHGNA e hemocromatose (HFE)"],
    related: ["Ferro sérico", "Saturação de transferrina", "TIBC", "PCR-as", "Hemograma"],
  },
  {
    id: "ferro", name: "Ferro Sérico", category: "Ferro",
    range: {
      lab: "60–170 mcg/dL", unit: "mcg/dL",
      classifyFn: (v) => v < 60 ? "baixo" : v <= 170 ? "normal" : "elevado",
    },
    correlations: ["Alta variabilidade diurna — coletar em jejum pela manhã", "Ferro sérico baixo: deficiência de ferro, anemia de doença crônica, inflamação", "Ferro sérico alto + saturação elevada: hemocromatose, hemólise, sobrecarga de ferro"],
    conducts: ["Interpretar sempre com ferritina e saturação de transferrina", "Ferro baixo com ferritina elevada = anemia de doença crônica (não repor ferro)", "Dosagem isolada tem baixo valor diagnóstico — usar em conjunto"],
    related: ["Ferritina", "Saturação de transferrina", "TIBC", "Hemograma"],
  },
  {
    id: "satTrans", name: "Saturação de Transferrina", category: "Ferro",
    range: {
      lab: "20–50%", functional: "25–45%", unit: "%",
      classifyFn: (v) => v < 16 ? "deficiente" : v < 20 ? "baixo" : v <= 45 ? "normal" : "elevado",
    },
    correlations: ["Sat <16%: depleção funcional de ferro — eritropoiese ferro-deficiente", "Sat >45%: sobrecarga de ferro — investigar hemocromatose (gene HFE)", "Melhor marcador de biodisponibilidade de ferro para eritropoiese"],
    conducts: ["Sat <16% com anemia: ferro IV indicado (oral pode ser insuficiente)", "Sat >50% repetida: solicitar mutação HFE (C282Y, H63D)", "Correlacionar com ferritina e ferro sérico para diagnóstico preciso"],
    related: ["Ferritina", "Ferro sérico", "TIBC", "Hemograma"],
  },
  {
    id: "tibc", name: "TIBC (Capacidade de Ligação do Ferro)", category: "Ferro",
    range: {
      lab: "250–370 mcg/dL", unit: "mcg/dL",
      classifyFn: (v) => v < 250 ? "baixo" : v <= 370 ? "normal" : "elevado",
    },
    correlations: ["TIBC elevado + Sat baixa = deficiência de ferro clássica", "TIBC baixo + ferritina alta = anemia de doença crônica (resposta inflamatória)", "Reflete a quantidade total de transferrina disponível"],
    conducts: ["TIBC alto com saturação baixa: deficiência de ferro absoluta — repor", "TIBC normal/baixo com ferritina alta: investigar inflamação sistêmica (PCR-as, VHS)", "Solicitar hemograma completo para classificar a anemia"],
    related: ["Ferritina", "Ferro sérico", "Saturação de transferrina", "PCR-as"],
  },
  // ── Vitamina D ──
  {
    id: "vitD", name: "Vitamina D 25-OH", category: "Vitamina D",
    range: {
      lab: ">20 ng/mL", functional: "50–80 ng/mL", unit: "ng/mL",
      classifyFn: (v) => v < 10 ? "deficiente" : v < 20 ? "insuficiente" : v < 30 ? "limítrofe" : v <= 80 ? "normal" : "muito_elevado",
    },
    correlations: ["Deficiência associada a: osteoporose, sarcopenia, depressão, DM2, imunossupressão, câncer", "VitD funcional (50–80 ng/mL): otimiza função imune, tireoidiana e insulínica", "Toxicidade rara — apenas com suplementação excessiva (>150 ng/mL)"],
    conducts: [
      "< 20 ng/mL: reposição terapêutica — 50.000 UI/semana × 8–12 semanas, depois manutenção",
      "20–40 ng/mL: suplementação de 2.000–4.000 UI/dia",
      "Alvo funcional 50–80 ng/mL: 5.000–10.000 UI/dia (com acompanhamento)",
      "Reavaliar em 3 meses após início da reposição",
    ],
    related: ["PTH", "Cálcio sérico", "Fósforo", "Magnésio"],
  },
  // ── Hormônios Sexuais ──
  {
    id: "testosterona", name: "Testosterona Total", category: "Hormônios Sexuais",
    range: {
      lab: "300–1000 ng/dL (H) · 15–70 ng/dL (M)", functional: "500–900 ng/dL (H) · 30–60 ng/dL (M)", unit: "ng/dL",
      classifyFn: (v, s) => {
        if (s === "Homem") return v < 300 ? "baixo" : v < 500 ? "limítrofe" : v <= 900 ? "normal" : "elevado"
        return v < 15 ? "baixo" : v <= 60 ? "normal" : "elevado"
      },
    },
    correlations: ["Homens: hipogonadismo (<300 ng/dL) → fadiga, disfunção erétil, sarcopenia, depressão", "Mulheres: baixa (<15): perda libido, fadiga, sarcopenia, neblina mental", "Alta em mulheres: investigar SOP, tumor ovariano/adrenal", "Testosterona livre é mais relevante clinicamente"],
    conducts: ["Homens <300 ng/dL: solicitar SHBG, LH, FSH, prolactina e teste de repetição (manhã)", "Mulheres sintomáticas com T <15: considerar reposição com gel/creme (uso off-label no Brasil)", "Avaliar SHBG: alta SHBG reduz testosterona livre mesmo com total normal"],
    related: ["SHBG", "LH", "FSH", "Prolactina", "Estradiol"],
  },
  {
    id: "estradiol", name: "Estradiol (E2)", category: "Hormônios Sexuais",
    range: {
      lab: "20–400 pg/mL (M fase folicular) · <30 pg/mL (pós-menopausa)", unit: "pg/mL",
      classifyFn: (v) => v < 20 ? "baixo" : v <= 400 ? "normal" : "elevado",
    },
    correlations: ["Pós-menopausa: E2 <20 associado a fogachos, seca vaginal, osteoporose", "Homens: E2 >40 associado a ginecomastia, redução libido, retenção hídrica", "Fase folicular: E2 orienta foliculometria e diagnóstico de falência ovariana"],
    conducts: ["E2 baixo em mulheres pré-menopausa: solicitar LH, FSH, AMH — investigar IOP", "E2 alto em homens com testosterona baixa: investigar aromatização excessiva (obesidade)", "Correlacionar fase do ciclo menstrual para interpretação adequada"],
    related: ["LH", "FSH", "Progesterona", "AMH", "SHBG"],
  },
  {
    id: "shbg", name: "SHBG", category: "Hormônios Sexuais",
    range: {
      lab: "20–60 nmol/L (H) · 40–120 nmol/L (M)", unit: "nmol/L",
      classifyFn: (v) => v < 20 ? "baixo" : v <= 80 ? "normal" : "elevado",
    },
    correlations: ["SHBG alta: reduz hormônios livres (T, E2) — comum com uso de ACO, hipotireoidismo, anorexia", "SHBG baixa: aumenta fração livre — associada à resistência insulínica, obesidade, hipotireoidismo", "Índice de androgênio livre (FAI) = T × 100 / SHBG"],
    conducts: ["SHBG alta + sintomas hormonais: calcular T livre; considerar reduzir ACO ou trocar progestágeno", "SHBG baixa: tratar causa base (resistência insulínica, hipotireoidismo, DHGNA)", "SHBG é sensível à insulina — SHBG baixa é marcador de RI"],
    related: ["Testosterona total", "Insulina", "TSH", "Estradiol"],
  },
  {
    id: "lh", name: "LH", category: "Hormônios Sexuais",
    range: {
      lab: "1–8 mUI/mL (fase folicular) · >20 pico ovulatório", unit: "mUI/mL",
      classifyFn: (v) => v < 1 ? "baixo" : v <= 8 ? "normal" : "elevado",
    },
    correlations: ["LH + FSH elevados em mulheres: falência ovariana primária (IOP/menopausa)", "LH elevado isolado com FSH normal: fase luteal, SOP (razão LH/FSH >2)", "LH baixo: hipogonadismo hipogonadotrófico — lesão hipotálamo-hipófise"],
    conducts: ["LH alto + FSH alto em mulheres <40: investigar IOP — AMH, cariótipo", "LH/FSH >2 em mulheres: sugestivo de SOP — correlacionar com clínica e USG pélvica", "Dosar sempre no 3º dia do ciclo para referência basal"],
    related: ["FSH", "Estradiol", "AMH", "Progesterona", "Prolactina"],
  },
  {
    id: "fsh", name: "FSH", category: "Hormônios Sexuais",
    range: {
      lab: "3–10 mUI/mL (fase folicular) · >25 menopausa", unit: "mUI/mL",
      classifyFn: (v) => v < 3 ? "baixo" : v <= 10 ? "normal" : v <= 25 ? "elevado" : "muito_elevado",
    },
    correlations: ["FSH >10 no D3: reserva ovariana reduzida", "FSH >25 persistente: menopausa ou IOP", "FSH baixo: hipogonadismo central (anorexia, tumor hipofisário, uso de testosterona exógena)"],
    conducts: ["FSH >10 no D3: solicitar AMH e inibina B — avaliar urgência reprodutiva", "FSH elevado + amenorreia <40: cariótipo e anticorpos anti-ovariano", "Homens com FSH elevado + azoospermia: falência testicular (Klinefelter, atrofia)"],
    related: ["LH", "AMH", "Estradiol", "Inibina B"],
  },
  {
    id: "progesterona", name: "Progesterona", category: "Hormônios Sexuais",
    range: {
      lab: ">10 ng/mL (fase lútea) · >25 ng/mL (fase lútea adequada)", unit: "ng/mL",
      classifyFn: (v) => v < 3 ? "baixo" : v < 10 ? "limítrofe" : v <= 25 ? "normal" : "elevado",
    },
    correlations: ["Fase lútea D21: reflete ovulação — <10 ng/mL sugere anovulação ou fase lútea inadequada", "Gestação: sobe progressivamente — <25 no 1º trimestre pode indicar risco de abortamento", "Prógesteronas elevadas fora da fase lútea: tumor suprarrenal, CAH"],
    conducts: ["Progesterona D21 <10: investigar anovulação — solicitar USG ovariana e ciclo menstrual", "Fase lútea inadequada: considerar suporte com progesterona micronizada em tentativas de gestação", "Colher sempre no D21 (ou 7 dias antes da menstruação esperada)"],
    related: ["LH", "FSH", "Estradiol", "USG pélvica"],
  },
  {
    id: "dheas", name: "DHEA-S", category: "Hormônios Sexuais",
    range: {
      lab: "80–400 mcg/dL (H) · 35–340 mcg/dL (M)", unit: "mcg/dL",
      classifyFn: (v) => v < 35 ? "baixo" : v <= 350 ? "normal" : "elevado",
    },
    correlations: ["Principal androgênio adrenal — marcador de atividade adrenal", "Declina progressivamente após os 30 anos (dehydroepiandrosteronopausa)", "Elevado: SOP, hiperplasia adrenal congênita, tumor adrenal"],
    conducts: ["DHEA-S <60 com sintomas: avaliar reposição (25–50 mg/dia) em contexto de medicina funcional", "DHEA-S >500: investigar tumor adrenal (cortisol 24h, ACTH, TC adrenal)", "Não repor DHEA sem avaliação completa — risco de androgenização em mulheres"],
    related: ["Testosterona", "Cortisol", "17-OH Progesterona", "ACTH"],
  },
  {
    id: "prolactina", name: "Prolactina", category: "Hormônios Sexuais",
    range: {
      lab: "<25 ng/mL (M) · <20 ng/mL (H)", unit: "ng/mL",
      classifyFn: (v) => v <= 25 ? "normal" : v <= 100 ? "elevado" : "muito_elevado",
    },
    correlations: ["Hiperprolactinemia inibe GnRH → amenorreia, galactorreia, disfunção sexual", "Causas: prolactinoma, hipotireoidismo, metoclopramida, antipsicóticos, estresse", "Macroprolactina: forma inativa — descartar antes de tratar"],
    conducts: ["Prolactina >50: repetir em jejum sem estresse; solicitar macroprolactina", "Prolactina >100: RNM de sela túrcica para investigar adenoma", "Hipotireoidismo causa hiperprolactinemia — tratar TSH antes de qualquer outra conduta"],
    related: ["TSH", "T4 livre", "RNM sela túrcica", "LH", "FSH"],
  },
  // ── Metabolismo ──
  {
    id: "insulina", name: "Insulina de Jejum", category: "Metabolismo",
    range: {
      lab: "2–20 mcU/mL", functional: "2–8 mcU/mL", unit: "mcU/mL",
      classifyFn: (v) => v < 2 ? "baixo" : v <= 8 ? "ótimo" : v <= 20 ? "limítrofe" : "elevado",
    },
    correlations: ["Hiperinsulinemia de jejum: primeiro sinal de resistência insulínica (antes do aumento de glicemia)", "Associada à: SOP, DHGNA, obesidade visceral, acantose nigricans", "Insulina > 15 em jejum: RI significativa mesmo com HOMA < 4"],
    conducts: ["Insulina >10 com glicemia normal: confirmar com HOMA-IR e relação TG/HDL", "Abordagem: dieta hipoglicídica, exercício resistido, metformina ou inositol (SOP)", "Monitorar insulina pós-prandial (2h) para rastreio completo de RI"],
    related: ["Glicemia de jejum", "HbA1c", "HOMA-IR", "TG/HDL", "Circunferência abdominal"],
  },
  {
    id: "glicemia", name: "Glicemia de Jejum", category: "Metabolismo",
    range: {
      lab: "70–99 mg/dL", functional: "70–90 mg/dL", unit: "mg/dL",
      classifyFn: (v) => v < 70 ? "baixo" : v <= 90 ? "ótimo" : v <= 99 ? "normal" : v <= 125 ? "limítrofe" : "elevado",
    },
    correlations: ["100–125 mg/dL: pré-diabetes — 5–10× maior risco de DM2", "≥126 mg/dL: diagnóstico de DM2 (confirmado em 2 ocasiões)", "Hiperglicemia de jejum associada à dano microvascular mesmo sem DM2 formal"],
    conducts: ["Pré-diabetes: MEV intensiva (perda 5–7% peso) + metformina 500–1000mg/dia", "DM2 confirmado: metformina + avaliação de HbA1c, microalbuminúria, fundo de olho", "Hipoglicemia de jejum (<70): investigar insulinoma, hipocortisolismo, jejum prolongado"],
    related: ["HbA1c", "Insulina jejum", "HOMA-IR", "Peptídeo C", "TOTG 75g"],
  },
  {
    id: "hba1c", name: "HbA1c", category: "Metabolismo",
    range: {
      lab: "<5,7%", functional: "<5,5%", unit: "%",
      classifyFn: (v) => v < 5.5 ? "ótimo" : v < 5.7 ? "normal" : v < 6.5 ? "limítrofe" : "elevado",
    },
    correlations: ["Reflete glicemia média dos últimos 2–3 meses", "5,7–6,4%: pré-diabetes; ≥6,5%: DM2", "Hemoglobinopatias e anemia falseiam HbA1c — preferir frutosamina nesses casos"],
    conducts: ["HbA1c 5,7–6,4%: pré-diabetes — MEV + metformina; reavaliação em 3–6 meses", "HbA1c ≥6,5%: DM2 — iniciar terapia (metformina + GLP-1 RA ou iSGLT2 conforme perfil)", "Meta terapêutica geral: HbA1c <7,0% (individualizar: <6,5% em jovens; <8,0% em idosos frágeis)"],
    related: ["Glicemia jejum", "Insulina", "HOMA-IR", "Microalbuminúria"],
  },
  {
    id: "peptC", name: "Peptídeo C", category: "Metabolismo",
    range: {
      lab: "0,5–2,0 ng/mL", unit: "ng/mL",
      classifyFn: (v) => v < 0.5 ? "baixo" : v <= 2.0 ? "normal" : "elevado",
    },
    correlations: ["Marcador de produção endógena de insulina (coequipado com insulina na secreção)", "Baixo: DM1, pancreopatia, destruição de células beta", "Alto: hiperinsulinismo endógeno, resistência insulínica avançada, insulinoma"],
    conducts: ["Peptídeo C baixo em DM2: avaliar insuficiência de células beta — considerar insulina basal", "Peptídeo C alto + hipoglicemia: investigar insulinoma (TC abdome, jejum prolongado)", "Útil para diferenciar DM1 de DM2 em início tardio"],
    related: ["Insulina", "Glicemia", "HbA1c", "Anticorpos anti-GAD"],
  },
  // ── Lipídios ──
  {
    id: "apob", name: "ApoB", category: "Lipídios",
    range: {
      lab: "<100 mg/dL (baixo risco) · <80 mg/dL (alto risco)", unit: "mg/dL",
      classifyFn: (v) => v < 80 ? "ótimo" : v <= 100 ? "normal" : v <= 130 ? "limítrofe" : "elevado",
    },
    correlations: ["Melhor preditor de risco cardiovascular aterosclerótico (ASCVD)", "Cada partícula LDL, VLDL, Lp(a) carrega uma ApoB", "ApoB >LDL: indica partículas LDL small-dense — maior aterogenicidade"],
    conducts: ["ApoB >100 em risco intermediário: considerar estatina mesmo com LDL 'normal'", "Meta em alto risco: ApoB <80 mg/dL", "Usar ApoB para monitorar resposta à terapia hipolipemiante — mais sensível que LDL"],
    related: ["LDL-c", "Non-HDL-c", "Lp(a)", "PCR-as"],
  },
  {
    id: "lpa", name: "Lp(a)", category: "Lipídios",
    range: {
      lab: "<30 mg/dL ou <75 nmol/L", unit: "mg/dL",
      classifyFn: (v) => v < 30 ? "normal" : v < 50 ? "limítrofe" : "muito_elevado",
    },
    correlations: ["Fator de risco cardiovascular independente e geneticamente determinado", "Lp(a) >50 mg/dL dobra o risco de IAM", "Não reduz com estatinas — principal causa de alto risco residual"],
    conducts: ["Lp(a) >50: intensificar controle de todos os outros fatores de risco (LDL, PA, tabagismo)", "Niacina e PCSK9i reduzem Lp(a) modestamente (20–30%)", "Solicitar Lp(a) uma vez na vida em todo paciente com histórico familiar de DCV precoce"],
    related: ["LDL-c", "ApoB", "PCR-as", "Escore de Framingham"],
  },
  {
    id: "ldl", name: "LDL-c", category: "Lipídios",
    range: {
      lab: "<130 mg/dL (baixo risco) · <70 mg/dL (alto risco)", unit: "mg/dL",
      classifyFn: (v) => v < 70 ? "ótimo" : v <= 100 ? "normal" : v <= 130 ? "limítrofe" : v <= 160 ? "elevado" : "muito_elevado",
    },
    correlations: ["Principal alvo terapêutico no manejo da dislipidemia", "LDL small-dense mais aterogênico que LDL fluffy mesmo com mesma concentração", "LDL calculado pela Friedewald: impreciso quando TG >400 ou LDL <70"],
    conducts: ["Risco alto/muito alto: meta LDL <70 mg/dL (ou <55 mg/dL em muito alto risco)", "Primeira linha: estatinas de alta intensidade (rosuvastatina 20–40mg, atorvastatina 40–80mg)", "Se meta não atingida: adicionar ezetimiba e/ou PCSK9i"],
    related: ["ApoB", "HDL-c", "TG", "Non-HDL-c", "Lp(a)"],
  },
  {
    id: "hdl", name: "HDL-c", category: "Lipídios",
    range: {
      lab: ">40 mg/dL (H) · >50 mg/dL (M)", functional: ">60 mg/dL", unit: "mg/dL",
      classifyFn: (v) => v < 40 ? "baixo" : v < 60 ? "normal" : "ótimo",
    },
    correlations: ["HDL baixo é fator de risco independente para DCV", "HDL >60: fator protetor — pode atenuar risco em outras escalas", "HDL aumenta com: exercício aeróbico, ômega-3, niacina, redução de peso"],
    conducts: ["HDL <40: abordar via MEV — exercício ≥150min/sem, redução de carboidratos refinados", "Tabagismo reduz HDL — cessação é intervenção mais eficaz", "Não existe medicamento aprovado especificamente para aumentar HDL de forma segura e eficaz"],
    related: ["LDL-c", "TG", "ApoB", "Índice de Castelli"],
  },
  {
    id: "tg", name: "Triglicerídeos (TG)", category: "Lipídios",
    range: {
      lab: "<150 mg/dL", functional: "<100 mg/dL", unit: "mg/dL",
      classifyFn: (v) => v < 100 ? "ótimo" : v < 150 ? "normal" : v < 200 ? "limítrofe" : v < 500 ? "elevado" : "muito_elevado",
    },
    correlations: ["TG refletem principalmente carboidratos refinados e álcool na dieta", "TG >200 associado à RI, DHGNA, pancreatite (TG >500)", "Razão TG/HDL >3,5: marcador de resistência insulínica e síndrome metabólica"],
    conducts: ["TG 150–500: dieta baixa em carboidratos refinados, redução de álcool, exercício", "TG >500: risco de pancreatite aguda — fibratos (fenofibrato 200mg/dia)", "Ômega-3 (EPA/DHA ≥4g/dia) reduz TG em 25–30%"],
    related: ["HDL-c", "Glicemia", "Insulina", "HOMA-IR", "Ácido úrico"],
  },
  // ── Hemograma Completo ──
  {
    id: "hemoglobina", name: "Hemoglobina", category: "Hemograma Completo",
    range: {
      lab: "13,5–17,5 g/dL (H) · 12,0–15,5 g/dL (M)", functional: "14,0–17,0 g/dL (H) · 13,0–15,5 g/dL (M)", unit: "g/dL",
      classifyFn: (v, s) => {
        const limH = s === "Homem"
        if (v < 8) return "muito_elevado"
        if (limH ? v < 10 : v < 8) return "muito_elevado"
        if (limH ? v < 12 : v < 10) return "elevado"
        if (limH ? v < 13.5 : v < 12) return "baixo"
        if (limH ? v <= 17.5 : v <= 15.5) return "normal"
        return "elevado"
      },
    },
    correlations: [
      "Hb <12 (M) / <13,5 (H): anemia — classificar pelo VCM (micro/normo/macrocítica)",
      "Anemia microcítica (VCM <80): ferropriva, talassemia, anemia de doença crônica",
      "Anemia normocítica (VCM 80–100): doença crônica, hemólise, hemorragia aguda, IRC",
      "Anemia macrocítica (VCM >100): deficiência B12/folato, hipotireoidismo, hepatopatia, álcool",
      "Hb elevada (>17,5 H / >15,5 M): policitemia vera, DPOC, altitude, desidratação",
    ],
    conducts: [
      "Anemia ferropriva confirmada: ferro oral (sulfato ferroso 200mg 2–3x/dia) por 3–6 meses",
      "Anemia grave (<8 g/dL) com sintomas: avaliar transfusão + investigar causa urgente",
      "Hb limítrofe com sintomas: solicitar reticulócitos, ferritina, B12, folato, TSH",
      "Policitemia vera suspeita: JAK2 V617F + hematologista",
    ],
    related: ["VCM", "HCM", "RDW", "Ferritina", "Vitamina B12", "Folato", "Reticulócitos"],
    notes: "Sempre associar à contagem de eritrócitos e índices hematimétricos para classificação correta.",
  },
  {
    id: "hematocrito", name: "Hematócrito", category: "Hemograma Completo",
    range: {
      lab: "40–52% (H) · 36–46% (M)", functional: "42–50% (H) · 38–45% (M)", unit: "%",
      classifyFn: (v, s) => {
        const limH = s === "Homem"
        if (limH ? v < 36 : v < 33) return "baixo"
        if (limH ? v <= 52 : v <= 46) return "normal"
        return "elevado"
      },
    },
    correlations: [
      "Hematócrito = % do volume sanguíneo ocupado por hemácias — correlaciona com Hb (Ht ≈ Hb × 3)",
      "Ht baixo com Hb normal: macrocitose — B12/folato",
      "Ht alto: desidratação (pseudo-eritrocitose), DPOC, policitemia vera",
    ],
    conducts: [
      "Interpretar sempre com Hb e VCM — raramente avaliado isoladamente",
      "Ht <30%: anemia clinicamente significativa — investigar causa",
      "Ht >52% (H) / >47% (M): solicitar EPO, JAK2 e excluir causas secundárias",
    ],
    related: ["Hemoglobina", "VCM", "Eritrócitos"],
  },
  {
    id: "vcm", name: "VCM (Volume Corpuscular Médio)", category: "Hemograma Completo",
    range: {
      lab: "80–100 fL", functional: "82–98 fL", unit: "fL",
      classifyFn: (v) => v < 80 ? "baixo" : v <= 100 ? "normal" : "elevado",
    },
    correlations: [
      "VCM <80 fL (microcítica): deficiência de ferro, talassemia, anemia de doença crônica, intoxicação por chumbo",
      "VCM 80–100 fL (normocítica): doença crônica, hemólise aguda, insuficiência renal, hipotireoidismo leve",
      "VCM >100 fL (macrocítica): deficiência de B12 ou folato, hepatopatia crônica, alcoolismo, hipotireoidismo grave, metotrexato, hidroxiureia",
    ],
    conducts: [
      "Microcítica: solicitar ferritina, saturação de transferrina, eletroforese de Hb",
      "Macrocítica: solicitar B12, folato, TSH, hepatograma, reticulócitos",
      "Normocítica com anemia: solicitar reticulócitos, função renal, PCR, proteínas totais",
    ],
    related: ["HCM", "CHCM", "RDW", "Hemoglobina", "Vitamina B12", "Folato", "Ferritina"],
  },
  {
    id: "hcm", name: "HCM e CHCM", category: "Hemograma Completo",
    range: {
      lab: "HCM: 27–32 pg · CHCM: 32–36 g/dL", unit: "pg / g/dL",
      classifyFn: (v) => v < 27 ? "baixo" : v <= 32 ? "normal" : "elevado",
    },
    correlations: [
      "HCM baixo (<27 pg): hipocromia — deficiência de ferro, talassemia",
      "CHCM alto (>36 g/dL): esferocitose hereditária — células mais densas",
      "CHCM baixo (<32): hipocrômia — confirma carência de ferro funcional",
    ],
    conducts: [
      "HCM baixo com ferritina baixa: deficiência de ferro — repor",
      "HCM baixo com ferritina normal/alta: anemia de doença crônica ou talassemia — eletroforese de Hb",
      "CHCM alto isolado: investigar esferocitose — fragilidade osmótica",
    ],
    related: ["VCM", "RDW", "Ferritina", "Saturação de transferrina"],
  },
  {
    id: "leucocitos", name: "Leucócitos Totais", category: "Hemograma Completo",
    range: {
      lab: "4.000–10.000/mm³", functional: "4.500–9.000/mm³", unit: "/mm³",
      classifyFn: (v) => v < 4000 ? "baixo" : v <= 10000 ? "normal" : v <= 15000 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "Leucocitose (>10.000): infecção bacteriana, inflamação, corticoides, estresse, leucemia",
      "Leucopenia (<4.000): infecção viral, neutropenia medicamentosa, autoimune, aplasia",
      "Leucocitose >30.000: suspeitar de leucemia — solicitar frotis + hematologista",
    ],
    conducts: [
      "Leucocitose com febre e foco infeccioso: antibioticoterapia direcionada",
      "Leucopenia isolada: checar medicamentos (metotrexato, AINEs), solicitar diferencial e FAN",
      "Leucocitose >30.000 sem causa óbvia: encaminhar hematologia urgente",
    ],
    related: ["Diferencial leucocitário", "PCR", "VHS", "Hemocultura"],
  },
  {
    id: "neutrofilos", name: "Neutrófilos (Diferencial)", category: "Hemograma Completo",
    range: {
      lab: "1.800–7.000/mm³ (45–75%)", functional: "2.000–6.000/mm³", unit: "/mm³",
      classifyFn: (v) => v < 1000 ? "muito_elevado" : v < 1800 ? "baixo" : v <= 7000 ? "normal" : "elevado",
    },
    correlations: [
      "Neutrofilia: infecção bacteriana, inflamação, corticoides, estresse cirúrgico, neoplasias",
      "Neutropenia grave (<500): risco alto de infecção bacteriana grave — neutropenia febril",
      "Desvio à esquerda (bastões >10%): infecção ativa, sepse, processos inflamatórios graves",
    ],
    conducts: [
      "Neutropenia <1.000: suspender medicamentos causadores, isolar, monitorar temperatura",
      "Neutropenia febril: internação + antibioticoterapia empírica imediata",
      "Neutrofilia >10.000 sem causa óbvia: afastar infecção oculta e leucemia mieloide",
    ],
    related: ["Linfócitos", "Monócitos", "PCR", "Hemocultura", "Frotis sanguíneo"],
  },
  {
    id: "plaquetas", name: "Plaquetas", category: "Hemograma Completo",
    range: {
      lab: "150.000–400.000/mm³", functional: "180.000–350.000/mm³", unit: "/mm³",
      classifyFn: (v) => v < 50000 ? "muito_elevado" : v < 100000 ? "elevado" : v < 150000 ? "baixo" : v <= 400000 ? "normal" : "elevado",
    },
    correlations: [
      "Trombocitopenia <150.000: dengue, PTI, hiperesplenismo, medicamentos (heparina, quimio), CIVD",
      "Plaquetas <50.000: risco de sangramento espontâneo aumentado",
      "Trombocitose >450.000: reativa (infecção, inflamação, deficiência de ferro) ou trombocitemia essencial",
    ],
    conducts: [
      "Plaquetas <100.000: investigar causa — dengue NS1, anticorpos antiplaquetários, hepatograma",
      "Plaquetas <20.000 com sangramento: avaliar transfusão + hematologista urgente",
      "Trombocitose isolada com ferritina baixa: repor ferro e repetir hemograma em 4 semanas",
    ],
    related: ["TP/INR", "TTPA", "D-Dímero", "Fibrinogênio", "Hepatograma"],
  },
  {
    id: "rdw", name: "RDW (Anisocitose)", category: "Hemograma Completo",
    range: {
      lab: "11,5–14,5%", unit: "%",
      classifyFn: (v) => v <= 14.5 ? "normal" : v <= 16 ? "limítrofe" : "elevado",
    },
    correlations: [
      "RDW alto + VCM baixo: deficiência de ferro (vs. talassemia que tem RDW normal)",
      "RDW alto + VCM alto: deficiência de B12/folato, anemia hemolítica",
      "RDW alto + VCM normal: anemia mista (ferro + B12), estados iniciais de carência",
    ],
    conducts: [
      "RDW alto com VCM normal ou baixo: dosar ferritina E B12/folato — anemia mista frequente",
      "RDW normal com VCM baixo: pensar em talassemia minor — eletroforese de Hb",
      "RDW útil para diferenciar ferropenia (alto) de talassemia (normal) quando VCM baixo",
    ],
    related: ["VCM", "HCM", "Ferritina", "Vitamina B12", "Folato"],
  },
  // ── Função Renal ──
  {
    id: "creatinina", name: "Creatinina", category: "Função Renal",
    range: {
      lab: "0,7–1,2 mg/dL (H) · 0,5–1,0 mg/dL (M)", functional: "0,7–1,0 mg/dL", unit: "mg/dL",
      classifyFn: (v, s) => {
        const limH = s === "Homem"
        if (v < 0.5) return "baixo"
        if (limH ? v <= 1.2 : v <= 1.0) return "normal"
        if (limH ? v <= 1.5 : v <= 1.3) return "limítrofe"
        if (v <= 3.0) return "elevado"
        return "muito_elevado"
      },
    },
    correlations: [
      "Creatinina é produto da degradação muscular — depende de massa muscular (baixa em idosos, sarcopênicos)",
      "TFGe-CKD-EPI é mais preciso que creatinina isolada para estimar função renal",
      "Creatinina pode ser 'normal' com TFG reduzida em pacientes com baixa massa muscular",
    ],
    conducts: [
      "Sempre calcular TFGe (CKD-EPI) para classificar estágio de DRC",
      "TFGe <60 por >3 meses: DRC — ajustar medicamentos nefrotóxicos, encaminhar nefrologia",
      "Aumento agudo >0,3 mg/dL em 48h: LRA — investigar causa (hipovolemia, sepse, nefrotóxico)",
    ],
    related: ["Ureia", "Cistatina C", "Microalbuminúria", "EAS", "Potássio", "Ácido úrico"],
  },
  {
    id: "ureia", name: "Ureia e BUN", category: "Função Renal",
    range: {
      lab: "15–45 mg/dL (ureia) · BUN: 7–21 mg/dL", unit: "mg/dL",
      classifyFn: (v) => v < 15 ? "baixo" : v <= 45 ? "normal" : v <= 70 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "Ureia elevada com creatinina normal: aumento pré-renal (desidratação, sangramento GI, dieta hiperprot.)",
      "Razão ureia/creatinina >40: causa pré-renal ou sangramento digestivo",
      "Ureia baixa: desnutrição proteica grave, hepatopatia avançada (déficit de síntese hepática)",
    ],
    conducts: [
      "Ureia >70 mg/dL + creatinina elevada: avaliar diálise se sintomático (uremia)",
      "Razão ureia/creatinina >40: afastar sangramento GI alto (EDA) e hipovolemia",
      "Ureia baixa com albumina baixa: investigar desnutrição e hepatopatia",
    ],
    related: ["Creatinina", "TFGe", "Eletrólitos", "EAS"],
  },
  {
    id: "acidourico", name: "Ácido Úrico", category: "Função Renal",
    range: {
      lab: "3,4–7,0 mg/dL (H) · 2,4–6,0 mg/dL (M)", functional: "<5,5 mg/dL", unit: "mg/dL",
      classifyFn: (v, s) => {
        const limH = s === "Homem"
        if (v < 2.4) return "baixo"
        if (limH ? v <= 7.0 : v <= 6.0) return "normal"
        if (limH ? v <= 8.0 : v <= 7.0) return "limítrofe"
        return "muito_elevado"
      },
    },
    correlations: [
      "Hiperuricemia (>7 H / >6 M): gota, urolitíase, síndrome metabólica, IRC, diuréticos tiazídicos",
      "Ácido úrico >6 mg/dL: risco de gota aumenta progressivamente",
      "Frutose e álcool elevam ácido úrico — mudança dietética é fundamental",
    ],
    conducts: [
      "Hiperuricemia assintomática: dieta (reduzir purinas, álcool, frutose) + hidratação",
      "Gota aguda: colchicina 1,5 mg no início + 0,5 mg 1h depois; AINEs se sem contraindicação",
      "Gota crônica/recorrente: alopurinol 100 mg (titular até ácido úrico <6 mg/dL)",
    ],
    related: ["Creatinina", "Função Renal", "TG", "Insulina", "PCR"],
  },
  {
    id: "microalb", name: "Microalbuminúria / RAC", category: "Função Renal",
    range: {
      lab: "RAC <30 mg/g (normal) · 30–300 (microalbuminúria) · >300 (macroalbuminúria)", unit: "mg/g creatinina",
      classifyFn: (v) => v < 30 ? "normal" : v <= 300 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "Microalbuminúria é o marcador mais precoce de nefropatia diabética e hipertensiva",
      "RAC >30: risco cardiovascular aumentado independentemente da TFGe",
      "Macroalbuminúria (RAC >300): nefropatia estabelecida — progressão acelerada para DRC",
    ],
    conducts: [
      "RAC 30–300: iniciar IECA ou BRA + controle rigoroso de PA e HbA1c",
      "iSGLT2 (empagliflozina, dapagliflozina): reduzem progressão da nefropatia diabética independentemente da glicemia",
      "RAC >300: encaminhar nefrologia + considerar biópsia renal se causa incerta",
    ],
    related: ["Creatinina", "TFGe", "HbA1c", "PA", "Proteínas totais"],
    notes: "Coletar na 1ª urina da manhã. Confirmar com 2 de 3 amostras em 3–6 meses.",
  },
  {
    id: "cystC", name: "Cistatina C", category: "Função Renal",
    range: {
      lab: "0,5–1,0 mg/L", unit: "mg/L",
      classifyFn: (v) => v <= 1.0 ? "normal" : v <= 1.3 ? "limítrofe" : "elevado",
    },
    correlations: [
      "Melhor marcador de TFGe em idosos, sarcopênicos, pacientes com doença hepática (não depende de massa muscular)",
      "Detecta redução de TFG antes da creatinina se elevar",
      "Cistatina C alta com creatinina normal: função renal subestimada pela creatinina",
    ],
    conducts: [
      "Solicitar quando creatinina pode ser enganosa: idosos <60 kg, pacientes com sarcopenia, hepatopatia",
      "TFGe pela cistatina C (<60 mL/min): DRC — mesma conduta que creatinina",
      "Combinar TFGe-crea e TFGe-CysC para estimativa mais precisa",
    ],
    related: ["Creatinina", "TFGe", "Albumina", "Microalbuminúria"],
  },
  // ── Função Hepática ──
  {
    id: "tgo", name: "TGO / AST", category: "Função Hepática",
    range: {
      lab: "<40 U/L (H) · <32 U/L (M)", functional: "<25 U/L", unit: "U/L",
      classifyFn: (v) => v <= 25 ? "ótimo" : v <= 40 ? "normal" : v <= 120 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "TGO 1–3× LSN: hepatite leve, DHGNA, álcool, esforço físico intenso",
      "TGO 3–10× LSN: hepatite viral aguda, hepatotoxicidade medicamentosa, isquemia hepática",
      "TGO >10× LSN: hepatite aguda grave, lesão isquêmica, hepatotoxicidade grave",
      "Razão TGO/TGP >2: sugere álcool como causa (deficiência de piridoxina reduz TGP)",
    ],
    conducts: [
      "TGO 1–3×: investigar álcool, medicamentos hepatotóxicos, avaliar ultrasson abdominal",
      "TGO >3×: suspender hepatotóxicos potenciais, solicitar hepatite viral (A, B, C), autoanticorpos",
      "TGO >10× com sintomas: avaliar internação para hepatite fulminante",
    ],
    related: ["TGP/ALT", "GGT", "Fosfatase alcalina", "Bilirrubinas", "Albumina", "TP/INR"],
  },
  {
    id: "tgp", name: "TGP / ALT", category: "Função Hepática",
    range: {
      lab: "<56 U/L (H) · <45 U/L (M)", functional: "<25 U/L", unit: "U/L",
      classifyFn: (v) => v <= 25 ? "ótimo" : v <= 45 ? "normal" : v <= 135 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "TGP é mais específico para fígado que TGO (TGO também está em músculo e coração)",
      "TGP elevada isolada: DHGNA, hepatite C crônica, medicamentos",
      "TGP/TGO >1: padrão hepatocelular — DHGNA, hepatite viral",
      "TGO/TGP >2 com GGT elevada: padrão alcoólico",
    ],
    conducts: [
      "TGP persistentemente elevada (>3 meses): sorologias virais + USG + avaliar biópsia se >3× LSN",
      "DHGNA suspeita: ultrassom + RNM hepática + FIB-4 score para avaliar fibrose",
      "Medicamentos hepatotóxicos: paracetamol, AINEs, estatinas, antifúngicos, anticonvulsivantes",
    ],
    related: ["TGO/AST", "GGT", "Fosfatase alcalina", "Ferritina", "USG abdominal"],
  },
  {
    id: "ggt", name: "GGT", category: "Função Hepática",
    range: {
      lab: "<60 U/L (H) · <40 U/L (M)", functional: "<30 U/L", unit: "U/L",
      classifyFn: (v, s) => {
        const lim = s === "Homem" ? 60 : 40
        return v <= lim * 0.5 ? "ótimo" : v <= lim ? "normal" : v <= lim * 2 ? "elevado" : "muito_elevado"
      },
    },
    correlations: [
      "GGT é o marcador mais sensível para uso de álcool — eleva antes dos outros",
      "GGT + fosfatase alcalina elevados: colestase (cálculo biliar, colangite, cirrose)",
      "GGT isolada elevada: síndrome metabólica, DHGNA, medicamentos (anticonvulsivantes, estatinas)",
    ],
    conducts: [
      "GGT elevada isolada: pesquisar uso de álcool, DHGNA, medicamentos (anticonvulsivantes)",
      "GGT + FA elevadas: USG de vias biliares para afastar obstrução",
      "GGT >3×: investigar doença biliar, hepatopatia alcoólica, hepatite crônica",
    ],
    related: ["TGO", "TGP", "Fosfatase alcalina", "Bilirrubinas", "USG abdominal"],
  },
  {
    id: "bilirrubinas", name: "Bilirrubinas (BT, BD, BI)", category: "Função Hepática",
    range: {
      lab: "BT: 0,3–1,2 mg/dL · BD: <0,3 · BI: <0,8", unit: "mg/dL",
      classifyFn: (v) => v <= 1.2 ? "normal" : v <= 2.0 ? "limítrofe" : v <= 10 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "BI elevada isolada: síndrome de Gilbert (benigna), hemólise, reabsorção de hematoma",
      "BD elevada: colestase — cálculo, colangite, tumor de via biliar, hepatite grave",
      "BT >2 com icterícia visível: solicitar perfil completo para investigar causa",
    ],
    conducts: [
      "BI elevada isolada + outros exames normais: síndrome de Gilbert — benigna, sem tratamento",
      "BD elevada: USG abdominal + GGT + FA para afastar colestase obstrutiva",
      "Hiperbilirrubinemia + encefalopatia: falência hepática aguda — internação urgente",
    ],
    related: ["TGO", "TGP", "GGT", "Fosfatase alcalina", "Albumina", "TP/INR"],
  },
  {
    id: "albumina", name: "Albumina Sérica", category: "Função Hepática",
    range: {
      lab: "3,5–5,0 g/dL", functional: "4,0–5,0 g/dL", unit: "g/dL",
      classifyFn: (v) => v < 3.0 ? "muito_elevado" : v < 3.5 ? "elevado" : v <= 5.0 ? "normal" : "baixo",
    },
    correlations: [
      "Albumina é o principal marcador de síntese hepática — meia-vida de 20 dias",
      "Hipoalbuminemia: hepatopatia crônica, desnutrição proteica, síndrome nefrótica, enteropatia perdedora",
      "Albumina <3,0 g/dL: marcador de mau prognóstico em doenças crônicas",
    ],
    conducts: [
      "Albumina <3,5: avaliar estado nutricional, hepatograma completo, proteinúria",
      "Hipoalbuminemia + edema: síndrome nefrótica (proteinúria 24h) vs. hepatopatia (bilirrubinas)",
      "Albumina como marcador nutricional: inferior ao pré-albumina/proteína ligadora de retinol (mais rápidos)",
    ],
    related: ["TP/INR", "TGO", "TGP", "Proteinúria 24h", "Pré-albumina"],
  },
  {
    id: "inr", name: "TP / INR", category: "Função Hepática",
    range: {
      lab: "TP: 10–13s · INR: 0,8–1,2", functional: "INR 0,9–1,1", unit: "INR",
      classifyFn: (v) => v <= 1.2 ? "normal" : v <= 1.5 ? "limítrofe" : v <= 3.0 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "INR alargado na hepatopatia: déficit de síntese de fatores II, VII, IX, X (vitamina K-dependentes)",
      "INR em pacientes anticoagulados com varfarina: meta 2,0–3,0 (FA, TVP) ou 2,5–3,5 (prótese valvar)",
      "INR >1,5 sem anticoagulante: investigar hepatopatia ou coagulopatia",
    ],
    conducts: [
      "INR >1,5 com hepatopatia: hepatite grave ou cirrose descompensada — avaliar suporte e transplante",
      "INR fora do alvo em anticoagulados: ajustar dose de varfarina + checar interações",
      "INR >3,0 com sangramento: vitamina K EV + plasma fresco congelado se necessário",
    ],
    related: ["TTPA", "Fibrinogênio", "Albumina", "TGO", "TGP", "Plaquetas"],
  },
  // ── Metabolismo Ósseo ──
  {
    id: "calcio", name: "Cálcio Total e Ionizado", category: "Metabolismo Ósseo",
    range: {
      lab: "Total: 8,5–10,5 mg/dL · Ionizado: 1,12–1,32 mmol/L", functional: "9,0–10,0 mg/dL", unit: "mg/dL",
      classifyFn: (v) => v < 7.5 ? "muito_elevado" : v < 8.5 ? "elevado" : v <= 10.5 ? "normal" : v <= 11.5 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "Hipercalcemia (>10,5): hiperparatireoidismo primário (PTH elevado), hipercalcemia maligna (PTH suprimido)",
      "Hipocalcemia (<8,5): hipoparatireoidismo, deficiência grave de VitD, hipomagnesemia",
      "Sempre corrigir pelo albumina: Ca corrigido = Ca total + 0,8 × (4,0 – albumina)",
    ],
    conducts: [
      "Hipercalcemia assintomática: dosar PTH + VitD + 24h Ca urinário",
      "Hipercalcemia sintomática (>12): hidratação EV + zoledronato se maligna",
      "Hipocalcemia: gluconato de Ca EV se sintomática; carbonato de Ca oral + VitD se crônica",
    ],
    related: ["PTH intacto", "Vitamina D", "Fósforo", "Magnésio", "Albumina"],
  },
  {
    id: "fosforo", name: "Fósforo", category: "Metabolismo Ósseo",
    range: {
      lab: "2,5–4,5 mg/dL", unit: "mg/dL",
      classifyFn: (v) => v < 2.0 ? "muito_elevado" : v < 2.5 ? "baixo" : v <= 4.5 ? "normal" : "elevado",
    },
    correlations: [
      "Hiperfosfatemia: IRC (principal), hipoparatireoidismo, acidose metabólica, rabdomiólise",
      "Hipofosfatemia: desnutrição, alcoolismo, hiperparatireoidismo, síndrome de realimentação, osteomalácia",
      "Fósforo e PTH têm relação inversa: PTH alto suprime fósforo sérico",
    ],
    conducts: [
      "Hiperfosfatemia + IRC: restringir alimentos ricos em fósforo + quelantes (carbonato de Ca, sevelamer)",
      "Hipofosfatemia grave (<1,0): fosfato EV + investigar causa (síndr. realimentação, osteomalácia)",
      "Interpretar sempre com cálcio, PTH e VitD — fazem parte do mesmo eixo",
    ],
    related: ["Cálcio", "PTH", "Vitamina D", "Magnésio", "Creatinina"],
  },
  {
    id: "magnesio", name: "Magnésio Sérico", category: "Metabolismo Ósseo",
    range: {
      lab: "1,7–2,2 mg/dL", functional: "1,9–2,5 mg/dL", unit: "mg/dL",
      classifyFn: (v) => v < 1.3 ? "muito_elevado" : v < 1.7 ? "baixo" : v <= 2.2 ? "normal" : "elevado",
    },
    correlations: [
      "Magnésio sérico normal NÃO exclui deficiência intracelular — 99% do Mg é intracelular",
      "Hipomagnesemia: alcoolismo, diarreia crônica, diuréticos tiazídicos e de alça, omeprazol crônico",
      "Mg baixo causa hipocalcemia refratária e hipocalemia refratária",
    ],
    conducts: [
      "Mg baixo com sintomas (cãibras, arritmias, tremores): sulfato de Mg IM/EV",
      "Suspeita clínica forte com Mg normal sérico: dosar Mg urinário 24h ou Mg eritrocitário",
      "Omeprazol crônico: monitorar Mg a cada 6–12 meses",
    ],
    related: ["Cálcio", "Potássio", "Vitamina D", "PTH"],
    notes: "Magnésio sérico tem baixa sensibilidade para deficiência intracelular.",
  },
  {
    id: "pth", name: "PTH Intacto", category: "Metabolismo Ósseo",
    range: {
      lab: "15–65 pg/mL", functional: "20–55 pg/mL", unit: "pg/mL",
      classifyFn: (v) => v < 10 ? "muito_elevado" : v < 15 ? "baixo" : v <= 65 ? "normal" : v <= 100 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "PTH elevado + Ca elevado: hiperparatireoidismo primário (adenoma paratiroidiano em 85%)",
      "PTH elevado + Ca normal/baixo: hiperparatireoidismo secundário à deficiência de VitD ou IRC",
      "PTH suprimido + Ca elevado: hipercalcemia maligna, intoxicação por VitD",
    ],
    conducts: [
      "PTH elevado + Ca elevado: USG paratiroides + cintilografia (Sestamibi) — avaliar paratireoidectomia",
      "PTH elevado + VitD <30: corrigir VitD primeiro e repetir PTH em 3 meses",
      "PTH elevado + IRC: néfrologista + quelantes de fósforo + análogos de VitD ativa (calcitriol)",
    ],
    related: ["Vitamina D", "Cálcio", "Fósforo", "Creatinina", "Albumina"],
  },
  {
    id: "ctx", name: "CTX (Marcador de Reabsorção Óssea)", category: "Metabolismo Ósseo",
    range: {
      lab: "<0,573 ng/mL (M pré-menopausa) · <0,854 (M pós-menopausa) · <0,704 (H)", unit: "ng/mL",
      classifyFn: (v) => v < 0.3 ? "ótimo" : v <= 0.7 ? "normal" : v <= 1.0 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "CTX é fragmento do colágeno tipo I — eleva na reabsorção óssea ativa",
      "Alto em: osteoporose, Paget, hiperparatireoidismo, metástase óssea, pós-menopausa sem tratamento",
      "Baixo após bisfosfonatos/denosumabe: indica supressão de remodelação óssea",
    ],
    conducts: [
      "CTX alto + densitometria com osteoporose: iniciar bisfosfonato ou denosumabe",
      "Monitorar CTX 3–6 meses após início de antirreabsortivo — queda >50% indica boa resposta",
      "CTX muito baixo (<0,05) com uso de bisfosfonato há >5 anos: avaliar drug holiday",
    ],
    related: ["Densitometria", "P1NP", "Cálcio", "PTH", "Vitamina D"],
  },
  // ── Inflamação e Imunologia ──
  {
    id: "pcr", name: "PCR Ultrassensível (PCR-as)", category: "Inflamação e Imunologia",
    range: {
      lab: "<1,0 mg/L (baixo risco CV) · 1–3 (médio risco) · >3 (alto risco)", functional: "<1,0 mg/L", unit: "mg/L",
      classifyFn: (v) => v < 1.0 ? "ótimo" : v <= 3.0 ? "limítrofe" : v <= 10.0 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "PCR-as estratifica risco cardiovascular residual — adiciona informação além do LDL",
      "PCR-as >3 mg/L: risco CV aumentado — indicação para estatina mesmo com LDL borderline (JUPITER trial)",
      "PCR-as >10 mg/L: inflamação ativa aguda — não usar para risco CV, investigar causa infecciosa",
    ],
    conducts: [
      "PCR-as 1–3 mg/L: otimizar fatores de risco, considerar estatina em risco intermediário",
      "PCR-as >3 mg/L sem infecção: anti-inflamatório sistêmico (estilo de vida), colchicina cardiovascular",
      "Coletar em jejum, sem infecção ativa. Repetir em 2 semanas se >10 mg/L",
    ],
    related: ["LDL-c", "ApoB", "Homocisteína", "VHS", "Ferritina"],
  },
  {
    id: "vhs", name: "VHS (Velocidade de Hemossedimentação)", category: "Inflamação e Imunologia",
    range: {
      lab: "<20 mm/h (H jovem) · <30 mm/h (M jovem) · eleva com idade", unit: "mm/h",
      classifyFn: (v) => v < 20 ? "normal" : v <= 40 ? "limítrofe" : v <= 100 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "Marcador inespecífico de inflamação — eleva em infecção, neoplasia, doenças autoimunes",
      "VHS >100: mieloma múltiplo, endocardite bacteriana, arterite temporal (giant cell arteritis)",
      "VHS é influenciado por anemia (eleva), policitemia (reduz) e idade",
    ],
    conducts: [
      "VHS >100 sem causa óbvia: proteínas séricas (pico M), hemoculturas, FAN, FR, USG vasos temporais (>50 anos)",
      "VHS elevado com PCR-as normal: raramente significativo — provável interferência (anemia, gravidez)",
      "Usar PCR-as como marcador preferencial — VHS menos específico e mais lento para resposta",
    ],
    related: ["PCR", "PCR-as", "Proteínas totais", "Eletroforese de proteínas", "FAN", "FR"],
  },
  {
    id: "homocisteina", name: "Homocisteína", category: "Inflamação e Imunologia",
    range: {
      lab: "<15 µmol/L", functional: "<10 µmol/L", unit: "µmol/L",
      classifyFn: (v) => v < 10 ? "ótimo" : v <= 15 ? "normal" : v <= 30 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "Hiperhomocisteinemia: fator de risco independente para DCV, AVC, TVP e demência",
      "Causas: deficiência de B12, B6, folato; IRC; hipotireoidismo; mutação MTHFR C677T",
      "Homocisteína >15 aumenta risco CV em ~1,5× por unidade adicional",
    ],
    conducts: [
      "Homocisteína elevada: dosar B12, B6, folato + pesquisar MTHFR se <50 anos",
      "Tratamento: ácido fólico 0,8–5 mg/dia + B12 1.000 µg/dia + B6 25 mg/dia",
      "Normalização reduz homocisteína mas não provou redução de eventos CV em ensaios — tratar mesmo assim",
    ],
    related: ["Vitamina B12", "Ácido fólico", "MTHFR", "PCR-as", "Creatinina"],
  },
  {
    id: "fan", name: "FAN (Fator Antinuclear)", category: "Inflamação e Imunologia",
    range: {
      lab: "Negativo (<1:80) ou 1:80, 1:160, 1:320...", unit: "títulos",
      classifyFn: (v) => v < 80 ? "normal" : v < 160 ? "limítrofe" : "elevado",
    },
    correlations: [
      "FAN positivo em 5–15% da população saudável — não é diagnóstico de doença",
      "FAN >1:320 com sintomas: maior relevância — solicitar especificidade (Anti-dsDNA, Anti-Sm, Anti-SSA/SSB)",
      "Indicação: artralgia persistente + fotossensibilidade + rash + pleurite + citopenia inexplicada",
    ],
    conducts: [
      "FAN positivo baixo título sem sintomas: relevância clínica questionável — reavaliar em 6–12 meses",
      "FAN >1:160 com sintomas sugestivos: anti-dsDNA (lúpus), Anti-SSA/SSB (Sjögren), Anti-Scl70 (esclerodermia)",
      "FAN negativo não exclui lúpus em fase inicial — repetir se clínica sugestiva",
    ],
    related: ["Anti-dsDNA", "Anti-Sm", "Anti-SSA", "Complemento C3/C4", "FR"],
    notes: "Solicitar FAN somente com suspeita clínica — não rastrear assintomáticos.",
  },
  {
    id: "fr", name: "FR (Fator Reumatoide)", category: "Inflamação e Imunologia",
    range: {
      lab: "<14 UI/mL (negativo)", unit: "UI/mL",
      classifyFn: (v) => v < 14 ? "normal" : v < 50 ? "limítrofe" : "elevado",
    },
    correlations: [
      "FR positivo em 5–10% da população saudável — inespecífico",
      "AR soropositiva: FR positivo em 70–80% dos casos; associado a doença mais grave",
      "FR pode estar positivo em: hepatite C, endocardite, Sjögren, crioglobulinemia",
    ],
    conducts: [
      "FR positivo com artrite simétrica de pequenas articulações: solicitar Anti-CCP (mais específico para AR)",
      "Anti-CCP positivo: diagnóstico de AR muito provável — reumatologista + iniciar MTX precocemente",
      "FR positivo isolado sem sintomas: repetir em 6 meses + monitorar sintomas articulares",
    ],
    related: ["Anti-CCP", "FAN", "PCR", "VHS", "Hemograma"],
  },
  // ── Hormônios Adrenais ──
  {
    id: "cortisol", name: "Cortisol Basal (8h)", category: "Hormônios Adrenais",
    range: {
      lab: "5–25 µg/dL (às 8h)", functional: "10–20 µg/dL", unit: "µg/dL",
      classifyFn: (v) => v < 3 ? "muito_elevado" : v < 5 ? "baixo" : v <= 20 ? "normal" : v <= 35 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "Cortisol baixo (<5 µg/dL às 8h): insuficiência adrenal primária ou secundária",
      "Cortisol alto (>20 µg/dL) com sintomas Cushingoides: rastrear Cushing com cortisol salivar noturno",
      "Cortisol varia muito — sempre coletar às 8h em jejum, sem estresse",
    ],
    conducts: [
      "Cortisol <5 µg/dL: ACTH estimulado (1 µg ou 250 µg) para confirmar insuficiência adrenal",
      "Suspeita de Cushing: cortisol salivar noturno (2 amostras) ou cortisol urinário livre 24h",
      "Cortisol em vigência de estresse/doença grave: valores elevados são esperados — não interpretar isoladamente",
    ],
    related: ["ACTH", "DHEA-S", "Aldosterona", "Renina", "Glicemia"],
    notes: "Coletar entre 7h–9h. Evitar estresse físico e psicológico antes da coleta.",
  },
  {
    id: "acth", name: "ACTH", category: "Hormônios Adrenais",
    range: {
      lab: "10–60 pg/mL (às 8h)", unit: "pg/mL",
      classifyFn: (v) => v < 10 ? "baixo" : v <= 60 ? "normal" : v <= 120 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "ACTH alto + cortisol baixo: insuficiência adrenal primária (doença de Addison)",
      "ACTH baixo + cortisol baixo: insuficiência adrenal secundária (hipopituitarismo)",
      "ACTH alto + cortisol alto: Cushing ectópico (tumor produtor de ACTH) ou Doença de Cushing (adenoma hipofisário)",
    ],
    conducts: [
      "ACTH baixo + cortisol baixo: pesquisar hipopituitarismo — RNM de sela túrcica + outros eixos hipofisários",
      "ACTH alto + cortisol alto: TC adrenal + RNM hipófise para localizar tumor",
      "Insuficiência adrenal confirmada: hidrocortisona 15–25 mg/dia (matutina) ± fludrocortisona",
    ],
    related: ["Cortisol", "DHEA-S", "TSH", "GH/IGF-1", "RNM sela túrcica"],
  },
  {
    id: "aldosterona", name: "Aldosterona / Renina (RAR)", category: "Hormônios Adrenais",
    range: {
      lab: "RAR (Razão Aldosterona/Renina): <30 ng/dL por ng/mL/h", unit: "RAR",
      classifyFn: (v) => v < 20 ? "normal" : v <= 30 ? "limítrofe" : "muito_elevado",
    },
    correlations: [
      "RAR >30 com aldosterona >15 ng/dL: hiperaldosteronismo primário (adenoma ou hiperplasia bilateral)",
      "Hiperaldosteronismo primário: causa mais comum de HAS secundária (5–10% dos hipertensos)",
      "Rastrear em: HAS resistente, hipocalemia espontânea, incidentaloma adrenal",
    ],
    conducts: [
      "RAR >30: confirmar com teste de sobrecarga salina — se não suprimível: hiperaldosteronismo primário",
      "TC adrenal: adenoma unilateral (cirurgia) vs. hiperplasia bilateral (espironolactona)",
      "Espironolactona 25–100 mg/dia: tratamento clínico da hiperplasia bilateral",
    ],
    related: ["Cortisol", "ACTH", "Potássio", "PA", "TC adrenal"],
    notes: "Suspender anti-hipertensivos por 4 semanas antes se possível (especialmente espironolactona e inibidores do SRAA).",
  },
  // ── Eixo GH/IGF ──
  {
    id: "igf1", name: "IGF-1", category: "Eixo GH/IGF",
    range: {
      lab: "Varia por faixa etária: adulto 20–40 anos: 105–382 ng/mL · 40–60 anos: 71–263 ng/mL", functional: "Terço superior da faixa para a idade", unit: "ng/mL",
      classifyFn: (v) => v < 80 ? "baixo" : v <= 300 ? "normal" : v <= 400 ? "limítrofe" : "muito_elevado",
    },
    correlations: [
      "IGF-1 é o marcador de ação do GH — mais estável que GH basal (sem pulsos)",
      "IGF-1 baixo para a idade: deficiência de GH, desnutrição, hipotireoidismo, doença hepática",
      "IGF-1 alto: acromegalia (GH elevado persistente, tumor hipofisário)",
    ],
    conducts: [
      "IGF-1 baixo com sintomas (fadiga, sarcopenia, adiposidade visceral): teste de estímulo de GH (hipoglicemia insulínica ou GHRH+arginina)",
      "Reposição de GH no adulto: somente após confirmação por teste de estímulo + endocrinologista",
      "IGF-1 alto + sintomas de acromegalia: RNM hipófise + OGTT com GH (diagnóstico)",
    ],
    related: ["GH basal", "IGFBP-3", "TSH", "Albumina", "ACTH"],
  },
  // ── Vitaminas e Micronutrientes ──
  {
    id: "b12", name: "Vitamina B12", category: "Vitaminas e Micronutrientes",
    range: {
      lab: "200–900 pg/mL", functional: "400–900 pg/mL", unit: "pg/mL",
      classifyFn: (v) => v < 150 ? "deficiente" : v < 200 ? "muito_elevado" : v < 400 ? "limítrofe" : v <= 900 ? "normal" : "elevado",
    },
    correlations: [
      "B12 <200: anemia megaloblástica, neuropatia periférica, disfunção cognitiva, homocisteína elevada",
      "Deficiência subclínica (200–400): sintomas neurológicos sem anemia — frequente em veganos, idosos, uso de metformina/IBP",
      "B12 elevada: não costuma ser preocupante; raramente indica policitemia vera, leucemia ou doença hepática",
    ],
    conducts: [
      "B12 <200: cianocobalamina IM 1.000 µg/semana × 4 semanas, depois mensal × 6 meses (ou oral 1.000 µg/dia se absorção normal)",
      "B12 200–400 com sintomas: suplementar oral 1.000 µg/dia + investigar causa (metformina, IBP, vegetarianismo, gastrite atrófica)",
      "Reavaliar em 3 meses após início da reposição",
    ],
    related: ["Ácido fólico", "Homocisteína", "Hemograma", "VCM", "Ferritina"],
  },
  {
    id: "zinco", name: "Zinco Sérico", category: "Vitaminas e Micronutrientes",
    range: {
      lab: "70–120 µg/dL", functional: "80–120 µg/dL", unit: "µg/dL",
      classifyFn: (v) => v < 60 ? "deficiente" : v < 70 ? "baixo" : v <= 120 ? "normal" : "elevado",
    },
    correlations: [
      "Deficiência de zinco: queda de cabelo, dermatite acral, perda de olfato/paladar, cicatrização lenta, disfunção imune",
      "Zinco e testosterona: deficiência reduz produção de testosterona em homens",
      "Cobre e zinco competem pela absorção — excesso de zinco causa deficiência de cobre",
    ],
    conducts: [
      "Zinco <70: sulfato de zinco 220 mg (50 mg de Zn elementar) 1–2x/dia por 3 meses",
      "Não ultrapassar 40 mg/dia por longos períodos — risco de deficiência de cobre",
      "Reavaliar em 3 meses; zinco sérico tem limitações como marcador de deficiência (40% de sensibilidade)",
    ],
    related: ["Cobre", "Ferritina", "Albumina", "Testosterona"],
  },
  {
    id: "selenio", name: "Selênio Sérico", category: "Vitaminas e Micronutrientes",
    range: {
      lab: "70–120 µg/L", functional: "90–120 µg/L", unit: "µg/L",
      classifyFn: (v) => v < 50 ? "deficiente" : v < 70 ? "baixo" : v <= 120 ? "normal" : "muito_elevado",
    },
    correlations: [
      "Selênio cofator de deiodinases: deficiência prejudica conversão T4→T3 e aumenta Anti-TPO",
      "Selênio e imunidade: deficiência associada a maior suscetibilidade a infecções virais",
      "Toxicidade (selenose) com >400 µg/dia: queda de cabelo, unhas frágeis, alopecia, neuropatia",
    ],
    conducts: [
      "Selênio baixo com Hashimoto: selenometionina 200 µg/dia por 6 meses (reduz Anti-TPO)",
      "Dieta: castanha-do-pará é a fonte mais rica (1–2/dia = dose adequada)",
      "Não suplementar >200 µg/dia sem monitoramento — margem de segurança estreita",
    ],
    related: ["TSH", "T3 livre", "Anti-TPO", "Zinco"],
  },
  // ── Marcadores Cardíacos ──
  {
    id: "troponina", name: "Troponina (hs-TnI / hs-TnT)", category: "Marcadores Cardíacos",
    range: {
      lab: "hs-TnI: <16 ng/L (H) · <12 ng/L (M) · hs-TnT: <19 ng/L", unit: "ng/L",
      classifyFn: (v) => v < 12 ? "normal" : v <= 52 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "Troponina de alta sensibilidade detecta lesão miocárdica mínima — mais sensível que troponina convencional",
      "Eleva em: IAM (principal), miocardite, embolia pulmonar, sepse, insuficiência renal, cardiomiopatia",
      "Dinâmica importante: aumento >20% em 1–3h sugere IAM — não interpretar valor único isolado",
    ],
    conducts: [
      "Troponina elevada com dor torácica: protocolo de IAM — ECG urgente + 2ª dosagem em 1–3h",
      "Troponina elevada sem dor torácica: investigar miocardite, TEP, IC grave, sepse",
      "Troponina cronicamente elevada em IRC: não indica IAM — linha de base mais alta nesses pacientes",
    ],
    related: ["ECG", "CK-MB", "BNP", "Ecocardiograma", "Coronariografia"],
  },
  {
    id: "bnp", name: "BNP / NT-proBNP", category: "Marcadores Cardíacos",
    range: {
      lab: "BNP <100 pg/mL (IC improvável) · 100–400 (zona cinza) · >400 (IC muito provável)", unit: "pg/mL",
      classifyFn: (v) => v < 100 ? "normal" : v <= 400 ? "limítrofe" : "muito_elevado",
    },
    correlations: [
      "BNP liberado pelos ventrículos em resposta à sobrecarga pressórica ou volumétrica",
      "Valor preditivo negativo alto: BNP <100 pg/mL exclui IC como causa de dispneia com >95% de precisão",
      "BNP eleva também em: FA, TEP, cor pulmonale, disfunção renal",
    ],
    conducts: [
      "BNP >400 com dispneia: IC provável — ecocardiograma + cardiologista",
      "BNP 100–400: zona cinza — ecocardiograma para esclarecer + avaliar causas alternativas de dispneia",
      "Monitorar BNP na IC em tratamento: queda indica boa resposta; aumento indica descompensação",
    ],
    related: ["ECG", "Ecocardiograma", "Troponina", "Creatinina", "Eletrólitos"],
  },
  // ── Coagulação ──
  {
    id: "ttpa", name: "TTPA (Tempo de Tromboplastina Parcial Ativada)", category: "Coagulação",
    range: {
      lab: "25–40 segundos (TTPA normal) · Relação TTPA: <1,2", unit: "segundos",
      classifyFn: (v) => v <= 40 ? "normal" : v <= 55 ? "limítrofe" : "muito_elevado",
    },
    correlations: [
      "TTPA avalia via intrínseca: fatores XII, XI, IX, VIII — deficiências hemofilia A (VIII) e B (IX)",
      "TTPA prolongado + TP normal: hemofilia, doença de von Willebrand, anticoagulante lúpico",
      "TTPA prolongado + TP prolongado: hepatopatia grave, CIVD, deficiência de vitamina K",
    ],
    conducts: [
      "TTPA prolongado sem heparina: dosar fatores VIII, IX, XI; anticoagulante lúpico",
      "TTPA em uso de heparina não fracionada: meta 60–100 segundos (1,5–2,5× o normal)",
      "TTPA + TP prolongados com hepatopatia: insuficiência hepática grave — avaliar suporte e TP",
    ],
    related: ["TP/INR", "Plaquetas", "Fibrinogênio", "D-Dímero", "Fator VIII"],
  },
  {
    id: "ddimero", name: "D-Dímero", category: "Coagulação",
    range: {
      lab: "<500 ng/mL FEU (ou <0,5 µg/mL)", unit: "ng/mL FEU",
      classifyFn: (v) => v < 500 ? "normal" : v <= 1000 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "D-Dímero tem alto valor preditivo NEGATIVO — D-Dímero normal praticamente exclui TEP/TVP com baixa probabilidade clínica",
      "Eleva em: TEP, TVP, CIVD, gestação, sepse, cirurgia recente, neoplasia, COVID-19",
      "Interpretação depende da probabilidade pré-teste (escore Wells, escore de Genebra)",
    ],
    conducts: [
      "D-Dímero <500 com baixa probabilidade clínica (Wells <2): TEP/TVP improvável — sem necessidade de imagem",
      "D-Dímero elevado com suspeita de TEP: angioTC de tórax urgente",
      "D-Dímero elevado isolado sem suspeita clínica: não tem valor diagnóstico — não solicitar como rastreio",
    ],
    related: ["TTPA", "TP/INR", "Fibrinogênio", "Plaquetas", "AngioTC tórax"],
    notes: "Limiar de corte aumenta com a idade: usar D-Dímero ajustado = idade × 10 ng/mL em >50 anos.",
  },
  // ── Marcadores Tumorais ──
  {
    id: "psa", name: "PSA Total e Livre", category: "Marcadores Tumorais",
    range: {
      lab: "<4,0 ng/mL (<50 anos: <2,5) · PSA Livre/Total >25% (benigno)", unit: "ng/mL",
      classifyFn: (v) => v < 4.0 ? "normal" : v <= 10.0 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "PSA não é específico para câncer — eleva em prostatite, HBP, biopsia, ejaculação recente",
      "PSA 4–10 ng/mL: zona cinza — razão PSA livre/total <10% sugere câncer; >25% sugere HBP",
      "PSA >10 ng/mL: risco alto de câncer de próstata — biópsia indicada",
    ],
    conducts: [
      "PSA 4–10 ng/mL: solicitar PSA livre + densitometria de PSA + urologista",
      "PSA >10 ng/mL: encaminhar urologia para biópsia guiada por USG ou RM multiparamétrica",
      "Rastreio: SBU recomenda PSA + toque retal anual a partir de 50 anos (45 em alto risco)",
    ],
    related: ["PSA livre", "Fosfatase ácida", "RM próstata", "Biópsia de próstata"],
    notes: "Marcador tumoral com limitações importantes. Sempre interpretar no contexto clínico. Evitar relações sexuais 48h antes da coleta.",
  },
  {
    id: "ca125", name: "CA-125", category: "Marcadores Tumorais",
    range: {
      lab: "<35 U/mL", unit: "U/mL",
      classifyFn: (v) => v < 35 ? "normal" : v <= 200 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "CA-125 eleva em: câncer de ovário (sensibilidade 50–80%), endometriose, mioma, menstruação, gestação, cirrose",
      "Valor preditivo positivo baixo em mulheres pré-menopausa — endometriose é causa frequente",
      "Maior utilidade no acompanhamento de câncer de ovário tratado (marcador de resposta/recidiva)",
    ],
    conducts: [
      "CA-125 elevado + massa ovariana: encaminhar ginecologia/oncologia urgente",
      "CA-125 elevado sem massa: investigar endometriose, cirrose; repetir em 6 semanas",
      "Não usar como rastreio populacional de câncer de ovário — evidência não suporta",
    ],
    related: ["HE4", "USG pélvica", "CA-19-9", "CEA", "RM pélvica"],
    notes: "Não específico para câncer de ovário. Sempre correlacionar com clínica e imagem.",
  },
  {
    id: "cea", name: "CEA (Antígeno Carcinoembrionário)", category: "Marcadores Tumorais",
    range: {
      lab: "<3,0 ng/mL (não fumante) · <5,0 ng/mL (fumante)", unit: "ng/mL",
      classifyFn: (v) => v < 3.0 ? "normal" : v <= 5.0 ? "limítrofe" : v <= 20 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "CEA útil principalmente no SEGUIMENTO de câncer colorretal tratado — não para rastreio",
      "CEA eleva em: câncer de cólon, mama, pulmão, pâncreas; cirrose, doença inflamatória intestinal, tabagismo",
      "CEA >20 ng/mL com câncer conhecido: sugere doença avançada ou metástase",
    ],
    conducts: [
      "CEA elevado sem câncer conhecido: colonoscopia + TC tórax/abdome/pelve",
      "CEA em câncer colorretal tratado: dosar pré e pós-cirurgia; aumento em seguimento = provável recidiva",
      "Não usar como rastreio de câncer colorretal — colonoscopia é o padrão-ouro",
    ],
    related: ["CA-19-9", "AFP", "Colonoscopia", "TC abdome"],
    notes: "Não específico — eleva em fumantes e condições benignas. Uso principal: seguimento de ca colorretal.",
  },

  // ── Oncologia ──
  {
    id: "afp", name: "AFP (Alfa-Fetoproteína)", category: "Marcadores Tumorais",
    range: {
      lab: "<10 ng/mL", unit: "ng/mL",
      classifyFn: (v) => v < 10 ? "normal" : v <= 100 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "AFP muito elevada (>400 ng/mL) em contexto de hepatopatia: altamente sugestivo de hepatocarcinoma (CHC)",
      "AFP moderada (<400 ng/mL): cirrose, hepatite crônica ativa, teratoma, tumores de células germinativas",
      "AFP em gestação: rastreio de defeitos do tubo neural (elevada) e síndrome de Down (baixa)",
    ],
    conducts: [
      "AFP >400 ng/mL + massa hepática em cirrótico: diagnóstico de CHC sem biópsia (EASL/AASLD)",
      "AFP elevada sem massa hepática: investigar tumores germinativos (testicular, ovariano) + TC",
      "AFP em seguimento de CHC tratado: aumento após resposta = recidiva tumoral",
    ],
    related: ["USG hepática", "TC abdome", "Beta-HCG", "LDH"],
    notes: "Tumores germinativos: AFP sobe em teratoma embrionário e tumor do saco vitelínico. Seminoma puro não eleva AFP.",
  },
  {
    id: "ldh", name: "LDH (Lactato Desidrogenase)", category: "Marcadores Tumorais",
    range: {
      lab: "120–240 U/L", unit: "U/L",
      classifyFn: (v) => v < 120 ? "baixo" : v <= 240 ? "normal" : v <= 480 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "Marcador inespecífico de dano celular: presente em hemólise, infarto, hepatite, tumores",
      "LDH muito elevado + tumor: indica alta carga tumoral e agressividade (linfoma, melanoma, CHC)",
      "LDH no linfoma: importante para estadiamento e prognóstico (IPI — International Prognostic Index)",
    ],
    conducts: [
      "LDH isolada sem clínica: investigar causas comuns (esforço, hemólise) antes de tumores",
      "LDH elevada em neoplasia hematológica: estadiamento obrigatório (PET-CT, biópsia de medula)",
      "LDH como marcador de resposta: redução durante quimioterapia = boa resposta",
    ],
    related: ["Hemograma", "PCR-as", "Beta-2 microglobulina", "USG abdome"],
  },
  {
    id: "b2micro", name: "Beta-2 Microglobulina", category: "Marcadores Tumorais",
    range: {
      lab: "0,8–2,4 mg/L", unit: "mg/L",
      classifyFn: (v) => v < 0.8 ? "baixo" : v <= 2.4 ? "normal" : v <= 5.5 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "Mieloma múltiplo: componente essencial do estadiamento ISS (International Staging System)",
      "Linfoma não-Hodgkin: valor prognóstico — elevada indica doença avançada",
      "Eleva em disfunção renal (filtração reduzida) — interpretar com TFGe",
    ],
    conducts: [
      "Beta-2 >3,5 mg/L no mieloma: estadio II (ISS); >5,5 com albumina <3,5: estadio III (pior prognóstico)",
      "Descartar causa renal antes de atribuir ao tumor (solicitar creatinina + TFGe)",
      "Usar em conjunto com albumina e LDH para estadiamento hematológico completo",
    ],
    related: ["Albumina", "LDH", "Proteínas séricas", "Eletroforese de proteínas", "TFGe"],
  },

  // ── Doenças Autoimunes ──
  {
    id: "ana_fan", name: "ANA / FAN (Fator Antinuclear)", category: "Doenças Autoimunes",
    range: {
      lab: "Negativo (< 1:80)", unit: "título",
      classifyFn: (v) => v < 80 ? "normal" : v < 320 ? "limítrofe" : "elevado",
    },
    correlations: [
      "Padrão homogêneo: anti-DNA ds (lúpus), anti-histona (lúpus induzido por droga)",
      "Padrão pontilhado fino: anti-Sm, anti-Ro, anti-La (lúpus, Sjögren)",
      "Padrão nucleolar: anti-Scl-70 (esclerodermia difusa), anti-PM-Scl",
      "Padrão citoplasmático: anti-Jo-1 (polimiosite), anti-Ro citoplasmático",
      "FAN positivo em até 5–20% da população saudável (título baixo, sem significado clínico)",
    ],
    conducts: [
      "FAN positivo: complementar com painel específico (anti-DNA ds, anti-Sm, anti-Ro, anti-La, anti-Scl-70, anti-centômero)",
      "FAN 1:80 isolado sem sintomas: observar — baixo valor preditivo positivo",
      "FAN negativo com suspeita de lúpus: não exclui — solicitar anti-Ro e anti-La (podem ser positivos com FAN negativo)",
    ],
    related: ["Anti-DNA ds", "Anti-Sm", "Anti-Ro/SSA", "Anti-La/SSB", "C3", "C4"],
    notes: "O PADRÃO do FAN é tão importante quanto o título. Sempre laudar o padrão e correlacionar com clínica.",
  },
  {
    id: "anti_dna", name: "Anti-DNA de Dupla Fita (Anti-dsDNA)", category: "Doenças Autoimunes",
    range: {
      lab: "<10 UI/mL", unit: "UI/mL",
      classifyFn: (v) => v < 10 ? "normal" : v < 30 ? "limítrofe" : "elevado",
    },
    correlations: [
      "Altamente específico para Lúpus Eritematoso Sistêmico (LES) — especificidade >95%",
      "Títulos elevados correlacionam com atividade da doença, especialmente nefrite lúpica",
      "Útil no monitoramento de atividade — aumenta durante flares",
    ],
    conducts: [
      "Anti-dsDNA positivo + critérios clínicos: confirma diagnóstico de LES (ACR/EULAR 2019)",
      "Anti-dsDNA elevado em LES conhecido + queda de C3/C4: flare iminente — revisar tratamento",
      "Anti-dsDNA negativo não exclui LES — solicitar painel completo (anti-Sm, anti-Ro)",
    ],
    related: ["FAN", "Anti-Sm", "C3", "C4", "Urina 24h (proteinúria)", "Complemento"],
  },
  {
    id: "anti_ro_la", name: "Anti-Ro/SSA e Anti-La/SSB", category: "Doenças Autoimunes",
    range: {
      lab: "Negativo", unit: "resultado",
      classifyFn: (v) => v < 1 ? "normal" : "elevado",
    },
    correlations: [
      "Anti-Ro/SSA: Síndrome de Sjögren primária (>90%), LES (30–40%), lúpus neonatal",
      "Anti-La/SSB: quase sempre acompanha Anti-Ro; mais específico para Sjögren",
      "Lúpus neonatal: passagem transplacentária de Anti-Ro causa bloqueio cardíaco congênito",
      "FAN pode ser negativo em Sjögren com Anti-Ro positivo",
    ],
    conducts: [
      "Anti-Ro positivo em gestante: rastreio cardíaco fetal com ECO a partir de 16 semanas",
      "Anti-Ro/La positivo + xeroftalmia + xerostomia: critérios de Sjögren — considerar biópsia de glândula salivar",
      "Anti-Ro positivo em lúpus: maior risco de fotossensibilidade e manifestações cutâneas subagudas",
    ],
    related: ["FAN", "Anti-dsDNA", "Anti-Sm", "Biópsia de glândula salivar"],
    notes: "Anti-La isolado (sem Anti-Ro) é raro e deve ser interpretado com cautela.",
  },
  {
    id: "anti_scl70", name: "Anti-Scl-70 (Anti-Topoisomerase I)", category: "Doenças Autoimunes",
    range: {
      lab: "Negativo", unit: "resultado",
      classifyFn: (v) => v < 1 ? "normal" : "elevado",
    },
    correlations: [
      "Esclerodermia sistêmica difusa (ESP difusa) — marcador de doença extensa e rápida progressão",
      "Risco aumentado de fibrose pulmonar intersticial e envolvimento cardíaco",
      "Anti-centômero e Anti-Scl-70 raramente coexistem — diferencia subtipos de esclerodermia",
    ],
    conducts: [
      "Anti-Scl-70 positivo: TC de tórax de alta resolução (fibrose), ecocardiograma (HAP) e avaliação renal",
      "Seguimento semestral de função pulmonar (CVF, DLCO) em pacientes Anti-Scl-70 positivos",
      "Tratamento precoce da fibrose pulmonar: micofenolato ou nintedanibe — Anti-Scl-70 orienta agressividade",
    ],
    related: ["FAN", "Anti-centrômero", "TC tórax", "Ecostress", "CVF e DLCO"],
  },
  {
    id: "anca", name: "ANCA (Anticorpo Anticitoplasma de Neutrófilos)", category: "Doenças Autoimunes",
    range: {
      lab: "Negativo", unit: "resultado",
      classifyFn: (v) => v < 1 ? "normal" : "elevado",
    },
    correlations: [
      "c-ANCA (anti-PR3): Granulomatose com Poliangiite (GPA — Wegener) — especificidade >95%",
      "p-ANCA (anti-MPO): Poliangiite Microscópica (PAM), Granulomatose Eosinofílica (GEPA/Churg-Strauss)",
      "ANCA positivo + glomerulonefrite rápida progressiva: emergência nefrológica",
    ],
    conducts: [
      "ANCA positivo + síndrome pulmão-rim: biópsia renal urgente — diagnóstico e estadiamento",
      "GPA ativa (c-ANCA alto): indução com rituximabe + ciclofosfamida + corticoide",
      "Monitorar títulos de ANCA durante remissão — aumento pode preceder recidiva",
    ],
    related: ["Creatinina", "Urina (hematúria, proteinúria)", "Biópsia renal", "TC tórax"],
    notes: "ANCA positivo por ELISA deve ser confirmado por imunofluorescência para padrão c ou p.",
  },
  {
    id: "anti_ccp", name: "Anti-CCP (Anti-Peptídeos Citrulinados)", category: "Doenças Autoimunes",
    range: {
      lab: "<17 U/mL", unit: "U/mL",
      classifyFn: (v) => v < 17 ? "normal" : v < 50 ? "limítrofe" : "elevado",
    },
    correlations: [
      "Artrite Reumatoide (AR): sensibilidade 70–80%, especificidade >95% — superior ao FR",
      "Anti-CCP pode ser positivo anos antes do início clínico da AR (fase pré-clínica)",
      "Anti-CCP alto + FR alto: AR soropositiva — maior risco de erosões ósseas e dano articular",
    ],
    conducts: [
      "Anti-CCP positivo + artrite simétrica de pequenas articulações: diagnóstico de AR (ACR/EULAR 2010)",
      "Iniciar DMARD precocemente (metotrexato) — Anti-CCP alto não indica prognóstico melhor com tratamento tardio",
      "Anti-CCP negativo não exclui AR — 20–30% dos casos são soronegativos",
    ],
    related: ["FR", "PCR-as", "VHS", "Radiografia de mãos"],
  },
  {
    id: "complemento", name: "Complemento C3 e C4", category: "Doenças Autoimunes",
    range: {
      lab: "C3: 90–180 mg/dL · C4: 16–47 mg/dL", unit: "mg/dL",
      classifyFn: (v) => v < 70 ? "baixo" : v <= 180 ? "normal" : "elevado",
    },
    correlations: [
      "C3 e C4 baixos: ativação do complemento — lúpus ativo, crioglobulinemia, glomerulonefrite membranoproliferativa",
      "C3 baixo isolado: deficiência de C3, glomerulonefrite pós-estreptocócica (transitória)",
      "C4 baixo isolado: deficiência genética de C4 (comum em lúpus), uso de IECA, vasculite",
      "Complemento normal não exclui lúpus — pode ser normal em lúpus cutâneo ou em remissão",
    ],
    conducts: [
      "C3 e C4 baixos em LES + proteinúria crescente: flare renal — intensificar imunossupressão",
      "Monitorar C3 e C4 mensalmente durante flares de LES — normalização indica resposta",
      "C4 persistentemente baixo sem lúpus ativo: investigar deficiência genética de C4",
    ],
    related: ["Anti-dsDNA", "FAN", "Urina 24h", "Biópsia renal"],
  },

  // ── Gastroenterologia ──
  {
    id: "amilase", name: "Amilase e Lipase", category: "Gastroenterologia",
    range: {
      lab: "Amilase: 30–110 U/L · Lipase: 13–60 U/L", unit: "U/L",
      classifyFn: (v) => v < 30 ? "baixo" : v <= 110 ? "normal" : v <= 330 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "Lipase >3x LSN: altamente sugestivo de pancreatite aguda (mais específica que amilase)",
      "Amilase pode elevar em: parotidite, úlcera perfurada, isquemia mesentérica, cetoacidose diabética",
      "Valores altos não correlacionam com gravidade da pancreatite — usar escore de Ranson/CTSI",
    ],
    conducts: [
      "Lipase >3x LSN + dor abdominal em cinturão: diagnóstico de pancreatite aguda — sem necessidade de biópsia",
      "Pancreatite aguda leve (Ranson <3): jejum, hidratação EV, analgesia — reavaliar em 48h",
      "Pancreatite aguda grave (Ranson ≥3 ou necrose na TC): UTI, NPT, cirurgia se indicado",
    ],
    related: ["PCR-as", "TC abdome com contraste", "USG abdome", "Triglicerídeos"],
    notes: "Hiperlipasemia isolada sem dor não é pancreatite. Lipase pode persistir elevada por 7–14 dias.",
  },
  {
    id: "calprotectina", name: "Calprotectina Fecal", category: "Gastroenterologia",
    range: {
      lab: "<50 mcg/g fezes", unit: "mcg/g",
      classifyFn: (v) => v < 50 ? "normal" : v < 200 ? "limítrofe" : "elevado",
    },
    correlations: [
      "Marcador de inflamação intestinal — diferencia DII (Crohn, RCU) de SII (funcional)",
      "Calprotectina >200 mcg/g: inflamação ativa — colonoscopia indicada",
      "Calprotectina <50 mcg/g com sintomas: SII improvável doenças inflamatórias — favorece causa funcional",
    ],
    conducts: [
      "Calprotectina elevada + alteração do hábito intestinal: colonoscopia com biópsia",
      "DII em remissão: calprotectina <50 mcg/g = remissão mucosa (alvo do tratamento moderno)",
      "Uso para monitorar resposta ao tratamento biológico na DII — normalização = mucosa cicatrizada",
    ],
    related: ["Colonoscopia", "PCR-as", "Hemograma", "Albumina", "Lactoferrina fecal"],
    notes: "Armazenar fezes refrigeradas. AINEs podem elevar calprotectina falsamente.",
  },
  {
    id: "antitransglutaminase", name: "Anti-Transglutaminase IgA (anti-tTG)", category: "Gastroenterologia",
    range: {
      lab: "<10 U/mL (negativo)", unit: "U/mL",
      classifyFn: (v) => v < 10 ? "normal" : v < 30 ? "limítrofe" : "elevado",
    },
    correlations: [
      "Rastreio de doença celíaca — sensibilidade 93%, especificidade 97%",
      "Falso negativo em deficiência de IgA (prevalente em celíacos): solicitar IgA total junto",
      "Títulos altos (>10x LSN): alta probabilidade de atrofia vilositária — pode dispensar biópsia em crianças",
    ],
    conducts: [
      "Anti-tTG positivo + IgA total normal: biópsia duodenal (endoscopia) para confirmar e estadiar (Marsh)",
      "Anti-tTG positivo + IgA total baixa: falso negativo possível — solicitar anti-DGP IgG",
      "Dieta sem glúten (DSG): anti-tTG deve negativar em 12–18 meses — persistência sugere má adesão",
    ],
    related: ["IgA total", "Anti-EMA IgA", "Anti-DGP IgG", "Endoscopia + biópsia duodenal", "Hemograma", "Ferritina"],
    notes: "Nunca retirar glúten antes da confirmação diagnóstica — os anticorpos negativam e a biópsia perde a acurácia.",
  },
  {
    id: "elastase_fecal", name: "Elastase Fecal", category: "Gastroenterologia",
    range: {
      lab: ">200 mcg/g fezes (normal)", unit: "mcg/g",
      classifyFn: (v) => v > 200 ? "normal" : v > 100 ? "limítrofe" : "deficiente",
    },
    correlations: [
      "Marcador de insuficiência pancreática exócrina (IPE) — elástica produzida pelo pâncreas",
      "Elastase <100 mcg/g: IPE grave — má absorção de gorduras, esteatorréia",
      "IPE em: pancreatite crônica, fibrose cística, gastrectomia, diabetes tipo 3c",
    ],
    conducts: [
      "Elastase <200 mcg/g: reposição de enzimas pancreáticas (pancreatina) com as refeições",
      "Elastase <100 mcg/g: dosagem alta de pancreatina (25.000–75.000 UI de lipase por refeição)",
      "IPE em DM2 longa duração: investigar pâncreas com USG/TC (pancreatite crônica assintomática)",
    ],
    related: ["Lipase sérica", "Amilase", "TC abdome", "Glicemia", "Vitaminas lipossolúveis (A, D, E, K)"],
  },

  // ── Endocrinologia Avançada ──
  {
    id: "peptidoC", name: "Peptídeo C", category: "Endocrinologia Avançada",
    range: {
      lab: "1,1–4,4 ng/mL (jejum)", unit: "ng/mL",
      classifyFn: (v) => v < 0.2 ? "deficiente" : v < 1.1 ? "baixo" : v <= 4.4 ? "normal" : "elevado",
    },
    correlations: [
      "Marcador de secreção endógena de insulina — metade-vida mais longa que insulina",
      "Peptídeo C baixo (<0,2 ng/mL): DM1 com destruição das células beta (dependência insulínica)",
      "Peptídeo C normal/elevado em DM: DM2 ou DM tipo LADA (autoimune lento do adulto)",
      "Útil na suspeita de hipoglicemia factícia: Peptídeo C baixo + insulina alta = insulina exógena",
    ],
    conducts: [
      "DM com Peptídeo C >0,6 ng/mL: ainda há reserva beta — pode ser DM2 ou LADA",
      "DM jovem com Peptídeo C indetectável + GAD positivo: DM1 clássico",
      "Investigação de hipoglicemia: se Peptídeo C suprimido durante hipoglicemia = insulina exógena (factícia)",
    ],
    related: ["Insulina basal", "Glicemia", "HbA1c", "Anti-GAD", "Anti-IA2", "ZnT8"],
  },
  {
    id: "antiGAD", name: "Anticorpos Anti-GAD, Anti-IA2, ZnT8", category: "Endocrinologia Avançada",
    range: {
      lab: "Anti-GAD: <5 UI/mL · Anti-IA2 e ZnT8: negativos", unit: "UI/mL",
      classifyFn: (v) => v < 5 ? "normal" : "elevado",
    },
    correlations: [
      "Anti-GAD65: presente em 80% do DM1, também em LADA (diabetes autoimune latente do adulto)",
      "Anti-IA2 e ZnT8: aumentam especificidade para DM1 — menos prevalentes no LADA",
      "Positividade de ≥2 anticorpos: alto risco de progressão para DM1 clínico",
    ],
    conducts: [
      "DM2 suspeito sem resposta oral + anti-GAD positivo: reclassificar como LADA — iniciar insulina",
      "Parente de DM1 + anticorpos positivos: rastreio de glicemia rigoroso — considerar trialzumabe (prevenção)",
      "LADA (LADA): anti-GAD positivo + peptídeo C preservado + diagnóstico após 30 anos + sem cetoacidose inicial",
    ],
    related: ["Peptídeo C", "HbA1c", "Glicemia", "TSH", "Anti-TPO"],
    notes: "Anti-GAD também eleva em síndrome do homem rígido (stiff person syndrome) — valores 10–100x maiores.",
  },
  {
    id: "amh", name: "AMH (Hormônio Antimülleriano)", category: "Endocrinologia Avançada",
    range: {
      lab: "Férteis (20–35a): 1,0–4,0 ng/mL · Declínio após 35a", functional: "1,0–3,5 ng/mL", unit: "ng/mL",
      classifyFn: (v) => v < 0.5 ? "deficiente" : v < 1.0 ? "baixo" : v <= 4.0 ? "normal" : "elevado",
    },
    correlations: [
      "Marcador de reserva ovariana — reflete quantidade de folículos antrais",
      "AMH baixo (<1,0 ng/mL): reserva ovariana diminuída — dificuldade de concepção, menos ovócitos na FIV",
      "AMH elevado (>4,0 ng/mL): SOP — grande quantidade de folículos antrais pequenos",
      "AMH não varia significativamente durante o ciclo — pode ser dosado em qualquer dia",
    ],
    conducts: [
      "AMH <0,5 ng/mL em mulher jovem: investigar insuficiência ovariana prematura (anticorpos ovarianos, cariotipo)",
      "AMH + contagem de folículos antrais (CFA): guiam protocolo de estimulação na FIV",
      "AMH elevado + ciclo irregular: critério adicional para SOP (Rotterdam 2023)",
    ],
    related: ["FSH", "LH", "Estradiol (D3)", "Contagem de folículos antrais (USG transvaginal)", "Prolactina"],
    notes: "AMH não avalia QUALIDADE ovocitária — apenas quantidade. Idade é o principal preditor de qualidade.",
  },
  {
    id: "frutosamina", name: "Frutosamina", category: "Endocrinologia Avançada",
    range: {
      lab: "205–285 mmol/L", unit: "mmol/L",
      classifyFn: (v) => v < 205 ? "baixo" : v <= 285 ? "normal" : "elevado",
    },
    correlations: [
      "Reflete controle glicêmico das últimas 2–3 semanas (vs. HbA1c que reflete 2–3 meses)",
      "Útil quando HbA1c não é confiável: hemoglobinopatias, anemia hemolítica, gestação com anemia",
      "Frutosamina >300 mmol/L equivale aproximadamente a HbA1c >8%",
    ],
    conducts: [
      "Usar frutosamina na gestação (triagem de DMG) quando HbA1c é inacurada pela anemia ferropriva",
      "Ajuste rápido de tratamento: frutosamina mostra resposta em 2–3 semanas vs. 3 meses da HbA1c",
      "Valores baixos de albumina (desnutrição) reduzem falsamente a frutosamina",
    ],
    related: ["HbA1c", "Glicemia de jejum", "Albumina", "Hemograma"],
  },
  {
    id: "oh17prog", name: "17-OH Progesterona", category: "Endocrinologia Avançada",
    range: {
      lab: "<2 ng/mL (pré-puberdade) · <10 ng/mL (adulto, fase folicular)", unit: "ng/mL",
      classifyFn: (v) => v < 2 ? "normal" : v < 10 ? "limítrofe" : "elevado",
    },
    correlations: [
      "Marcador de Hiperplasia Adrenal Congênita (HAC) por deficiência de 21-hidroxilase",
      "Triagem neonatal: valor >10 ng/mL (metodologia específica) indica HAC — confirmar com teste de ACTH",
      "17-OHP elevada + virilização em mulher: HAC tardia (forma não clássica) — comum em medicina funcional",
    ],
    conducts: [
      "17-OHP >10 ng/mL: teste de estimulação com ACTH (250 mcg EV) — pico >10 ng/mL confirma HAC",
      "HAC não clássica com sintomas (hirsutismo, acne, irregularidade): hidrocortisona em baixa dose",
      "Coleta: fase folicular (D3–D5), manhã cedo — evitar fase lútea (eleva fisiologicamente)",
    ],
    related: ["ACTH", "Cortisol", "DHEA-S", "Androstenediona", "Testosterona total", "USG pélvica"],
  },

  // ── Neurologia/Psiquiatria ──
  {
    id: "acidoval", name: "Ácido Valproico (Nível Sérico)", category: "Neurologia/Psiquiatria",
    range: {
      lab: "50–100 mcg/mL (terapêutico)", unit: "mcg/mL",
      classifyFn: (v) => v < 50 ? "baixo" : v <= 100 ? "normal" : "muito_elevado",
    },
    correlations: [
      "Janela terapêutica estreita: abaixo de 50 mcg/mL = risco de crises; acima de 100 mcg/mL = toxicidade",
      "Toxicidade: sedação, tremor, encefalopatia hiperamonêmica (NH3 elevado sem disfunção hepática)",
      "Interações: carbamezapina reduz níveis; aspirina desloca da albumina (aumenta fração livre)",
    ],
    conducts: [
      "Coleta: nível vale (imediatamente antes da dose da manhã, em equilíbrio — após 5 meias-vidas)",
      "Nível <50 mcg/mL com crises: aumentar dose gradualmente (500 mg/semana)",
      "Nível >100 mcg/mL: reduzir dose; se encefalopatia: dosar amônia, suspender se >150 mcg/mL",
    ],
    related: ["Amônia sérica", "TGP", "TGO", "Hemograma (plaquetas)", "Outros antiepilépticos"],
    notes: "Valproato inibe plaquetas e causa trombocitopenia — monitorar hemograma a cada 6 meses.",
  },
  {
    id: "litio", name: "Lítio (Nível Sérico)", category: "Neurologia/Psiquiatria",
    range: {
      lab: "0,6–1,0 mEq/L (manutenção) · 0,8–1,2 mEq/L (fase aguda)", unit: "mEq/L",
      classifyFn: (v) => v < 0.6 ? "baixo" : v <= 1.0 ? "normal" : v <= 1.5 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "Janela terapêutica extremamente estreita — índice terapêutico muito baixo",
      "Toxicidade leve (1,5–2,0 mEq/L): tremor fino, náusea, poliúria, diarreia",
      "Toxicidade grave (>2,0 mEq/L): confusão, fasciculações, arritmias, insuficiência renal aguda",
      "AINE, diuréticos tiazídicos e dieta com restrição de sal aumentam os níveis de lítio",
    ],
    conducts: [
      "Monitorar nível 12h após a última dose (nível vale padrão)",
      "Nível >1,5 mEq/L: reduzir dose imediatamente, aumentar hidratação",
      "Nível >2,5 mEq/L ou toxicidade grave: hemodiálise de urgência",
      "Monitorar função renal, TSH e cálcio a cada 6 meses (lítio causa nefrite intersticial e hipotireoidismo)",
    ],
    related: ["Creatinina", "TFGe", "TSH", "Cálcio sérico", "Sódio sérico"],
    notes: "Lítio reduz risco de suicídio em TAB — não suspender abruptamente (rebote maníaco).",
  },
  {
    id: "prolactina_psiq", name: "Prolactina (Hiperprolactinemia por Antipsicóticos)", category: "Neurologia/Psiquiatria",
    range: {
      lab: "2–18 ng/mL (M) · 2–15 ng/mL (H)", unit: "ng/mL",
      classifyFn: (v, s) => {
        const lim = s === "Homem" ? 15 : 18
        return v < 2 ? "baixo" : v <= lim ? "normal" : v <= 50 ? "elevado" : "muito_elevado"
      },
    },
    correlations: [
      "Antipsicóticos típicos e risperidona elevam prolactina por bloqueio de receptores D2 tuberoinfundibulares",
      "Sinais de hiperprolactinemia: galactorreia, amenorreia, disfunção erétil, osteoporose",
      "Prolactina >200 ng/mL: sempre investigar macroadenoma hipofisário (mesmo com uso de antipsicótico)",
    ],
    conducts: [
      "Prolactina elevada + antipsicótico: trocar para aripiprazol ou quetiapina (não elevam prolactina)",
      "Prolactina >100 ng/mL: RM de hipófise para excluir prolactinoma",
      "Hiperprolactinemia funcional grave: cabergolina 0,25 mg 2x/semana (agonista dopaminérgico)",
    ],
    related: ["RM sela túrcica", "FSH", "LH", "Estradiol / Testosterona", "Densidade óssea (DXA)"],
    notes: "Macroprolactinemia (complexo prolactina-IgG): prolactina alta sem sintomas — dosar após precipitação com PEG.",
  },
  {
    id: "tiaminaB1", name: "Vitamina B1 / Tiamina", category: "Neurologia/Psiquiatria",
    range: {
      lab: "66–200 nmol/L (sangue total)", unit: "nmol/L",
      classifyFn: (v) => v < 66 ? "deficiente" : v <= 200 ? "normal" : "elevado",
    },
    correlations: [
      "Deficiência grave: Encefalopatia de Wernicke (confusão, oftalmoplegia, ataxia) e Síndrome de Korsakoff",
      "Grupos de risco: alcoolismo, bariátrica, hiperemese gravídica, nutrição parenteral sem tiamina, anorexia",
      "Deficiência pode ocorrer em dias a semanas (estoques hepáticos pequenos)",
    ],
    conducts: [
      "EMERGÊNCIA: suspeita de Wernicke → tiamina 500 mg EV/IM antes de qualquer glicose (glicose precipita o quadro)",
      "Reposição ambulatorial: tiamina 100 mg/dia por 1–3 meses em grupos de risco",
      "Alcoolismo em abstinência: tiamina 300 mg/dia oral como profilaxia de Wernicke",
    ],
    related: ["Glicemia", "Sódio", "RM crânio (hiperintensidade no corpo mamilar e tálamo)", "Albumina"],
    notes: "A dosagem de tiamina no sangue total é mais acurada que no soro. Resultado pode ser normal mesmo com depleção tecidual.",
  },

  // ── Imunologia/Infectologia ──
  {
    id: "igTotal", name: "Imunoglobulinas Totais (IgG, IgM, IgA, IgE)", category: "Imunologia/Infectologia",
    range: {
      lab: "IgG: 700–1600 mg/dL · IgA: 70–400 mg/dL · IgM: 40–230 mg/dL · IgE: <100 UI/mL", unit: "mg/dL",
      classifyFn: (v) => v < 400 ? "baixo" : v <= 1600 ? "normal" : "elevado",
    },
    correlations: [
      "Hipogamaglobulinemia: imunodeficiência comum variável (CVID), agamaglobulinemia de Bruton, nefrose, mieloma",
      "IgE muito elevada (>1000 UI/mL): atopia grave, aspergilose, síndrome de Hiper-IgE",
      "IgM isoladamente elevada: Macroglobulinemia de Waldenström, mononucleose infecciosa",
      "Eletroforese de proteínas para identificar pico monoclonal (mieloma, MGUS)",
    ],
    conducts: [
      "Hipogamaglobulinemia + infecções recorrentes: imunologista, dosagem de anticorpos pós-vacina (resposta funcional)",
      "IgE >1000 UI/mL: painel de alérgenos, hemograma (eosinofilia) e pesquisa de parasitoses",
      "IgM elevada isolada + linfonodomegalia: investigar linfoma e macroglobulinemia (eletroforese + imunofenotipagem)",
    ],
    related: ["Eletroforese de proteínas", "Hemograma", "IgE específica (RAST)", "Anti-TPO"],
  },
  {
    id: "cargaViralHIV", name: "Carga Viral HIV e CD4/CD8", category: "Imunologia/Infectologia",
    range: {
      lab: "Carga viral indetectável: <20–50 cópias/mL · CD4 normal: >500 células/mm³", unit: "cópias/mL",
      classifyFn: (v) => v < 50 ? "ótimo" : v <= 200 ? "normal" : v <= 1000 ? "elevado" : "muito_elevado",
    },
    correlations: [
      "Carga viral indetectável + TARV: indetectável = intransmissível (I=I — Undetectable=Untransmittable)",
      "CD4 <200 células/mm³: AIDS — profilaxia de oportunistas (SMX-TMP para PCP) independente da carga viral",
      "CD4/CD8 ratio: <1 sugere imunossupressão crônica mesmo com CD4 normal",
    ],
    conducts: [
      "Acompanhamento: carga viral + CD4 a cada 3–6 meses até estabilização; a cada 12 meses em controlados",
      "Carga viral detectável em uso de TARV: investigar adesão, interações, resistência (genotipagem)",
      "CD4 <100: profilaxia de toxoplasmose (SMX-TMP), CMV e MAC dependendo do nível",
    ],
    related: ["Hemograma", "Função hepática", "Função renal", "Glicemia", "Lipidograma", "ISTs"],
    notes: "CD4 pode variar 30% entre dias diferentes. Usar tendência (nadir) e não valores isolados.",
  },
  {
    id: "hepatiteB_status", name: "Status Sorológico Hepatite B (HBsAg, Anti-HBs, Anti-HBc)", category: "Imunologia/Infectologia",
    range: {
      lab: "Anti-HBs >10 UI/L = imunidade adequada", unit: "UI/L",
      classifyFn: (v) => v < 10 ? "deficiente" : v <= 100 ? "normal" : "ótimo",
    },
    correlations: [
      "HBsAg+, Anti-HBc+, Anti-HBs-: infecção ativa pelo HBV",
      "HBsAg-, Anti-HBc+, Anti-HBs+: infecção passada resolvida — imunidade natural",
      "HBsAg-, Anti-HBc-, Anti-HBs+: vacinado — imunidade por vacina",
      "HBsAg-, Anti-HBc+, Anti-HBs-: infecção passada ou janela imunológica — dosar HBV DNA",
      "HBsAg-, Anti-HBc-, Anti-HBs-: suscetível — vacinar",
    ],
    conducts: [
      "HBsAg positivo: solicitar HBeAg, Anti-HBe, HBV DNA, TGP, biópsia se indicado; encaminhar hepatologia",
      "Anti-HBs <10 UI/L em vacinado: reforço vacinal (1 dose); repetir sorologia em 1 mês",
      "Imunossuprimidos (biológicos, quimio): rastreio obrigatório de HBsAg e Anti-HBc; se positivo, profilaxia com tenofovir",
    ],
    related: ["HBeAg", "HBV DNA", "TGP", "TGO", "USG abdome", "Biópsia hepática"],
    notes: "AntiHBc total positivo isolado: pode ser infecção oculta — dosar HBV DNA antes de imunossupressão.",
  },
  {
    id: "hepatiteC_status", name: "Anti-HCV e PCR HCV", category: "Imunologia/Infectologia",
    range: {
      lab: "Anti-HCV: negativo · HCV RNA: indetectável", unit: "resultado",
      classifyFn: (v) => v < 1 ? "normal" : "elevado",
    },
    correlations: [
      "Anti-HCV positivo: indica contato com HCV (atual ou passado) — confirmar com PCR HCV quantitativo",
      "Anti-HCV positivo + HCV RNA positivo: hepatite C ativa — tratar com antivirais de ação direta (AAD)",
      "Anti-HCV positivo + HCV RNA negativo: cura espontânea (rara ~25%) ou resposta sustentada ao tratamento",
      "HCV RNA positivo com Anti-HCV negativo: imunodeprimido (HIV, transplantado) — janela imunológica",
    ],
    conducts: [
      "HCV RNA detectável: genotipar, estadiar fibrose (APRI, FIB-4, elastografia), encaminhar hepatologia",
      "Tratamento: AAD (sofosbuvir/velpatasvir ou glecaprevir/pibrentasvir) — RVS >97% em 8–12 semanas",
      "Pós-tratamento (RVS12): HCV RNA indetectável 12 semanas após o fim do tratamento = cura",
    ],
    related: ["HCV RNA quantitativo", "Genotipagem HCV", "TGP", "TGO", "USG abdome", "Elastografia hepática"],
  },
  {
    id: "sifilis", name: "VDRL e FTA-ABS (Sífilis)", category: "Imunologia/Infectologia",
    range: {
      lab: "VDRL: não reativo · FTA-ABS: não reativo", unit: "resultado",
      classifyFn: (v) => v < 1 ? "normal" : "elevado",
    },
    correlations: [
      "VDRL é teste não treponêmico — usado para rastreio e monitoramento de resposta ao tratamento",
      "FTA-ABS é teste treponêmico — confirmatório, permanece positivo mesmo após cura",
      "VDRL falso positivo: lúpus, gestação, infecções virais (COVID), hanseníase",
      "Neurossífilis: VDRL no LCR (mesmo com baixa sensibilidade) + VDRL sérico alto + clínica",
    ],
    related: ["FTA-ABS", "HIV", "Hepatite B e C", "Exame neurológico", "LCR se neurossífilis"],
    conducts: [
      "VDRL reagente: confirmar com FTA-ABS; se positivo → tratar com penicilina G benzatina",
      "Sífilis primária/secundária: penicilina G benzatina 2,4 mi UI IM dose única",
      "Monitorar VDRL: queda de 4 títulos (2 diluições) em 3–6 meses indica resposta adequada",
    ],
  },
  {
    id: "dengue_sorologia", name: "Dengue NS1, IgM e IgG", category: "Imunologia/Infectologia",
    range: {
      lab: "NS1: negativo · IgM: não detectado · IgG: não detectado (zona endêmica pode ser positivo)", unit: "resultado",
      classifyFn: (v) => v < 1 ? "normal" : "elevado",
    },
    correlations: [
      "NS1 antígeno: positivo do D1 ao D5 da doença (fase virêmica) — alta sensibilidade fase precoce",
      "IgM anti-dengue: aparece D5–D7, persiste 1–3 meses — confirma infecção recente",
      "IgG: memória imunológica — positivo por anos após infecção prévia ou vacina",
      "NS1 negativo + IgM negativo antes do D5: janela sorológica — repetir no D6–D7",
    ],
    conducts: [
      "NS1 positivo: dengue provável — hemograma seriado, hidratação, paracetamol (evitar AAS/AINEs)",
      "Plaquetas <100.000 ou sinais de alarme: hospitalização para observação",
      "Sinais de choque (dengue grave): expansão volêmica agressiva EV, UTI",
    ],
    related: ["Hemograma (plaquetas, hematócrito)", "ALT/AST", "Hematócrito"],
    notes: "IgG positivo isolado sem IgM: infecção antiga ou vacinação. Não tratar como dengue aguda.",
  },
]

// Group by category
const CATEGORIES = Array.from(new Set(EXAMS.map(e => e.category)))

// ─── Components ───────────────────────────────────────────────────────────────

function ClassBadge({ level }: { level: ClassLevel }) {
  const c = LEVEL_CONFIG[level]
  return (
    <span className={cn("text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border", c.color, c.bg, c.border)}>
      {c.label}
    </span>
  )
}

function ExamCard({
  exam, copied, onCopy,
}: {
  exam: ExamData
  copied: string | null
  onCopy: (id: string, text: string) => void
}) {
  const [value,  setValue]  = useState("")
  const [sexo,   setSexo]   = useState("Feminino")
  const [idade,  setIdade]  = useState("")
  const [loading, setLoading] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [error,  setError]  = useState<string | null>(null)
  const [open,   setOpen]   = useState(false)

  const numVal = parseFloat(value)
  const level  = !isNaN(numVal) && value !== "" ? exam.range.classifyFn(numVal, sexo) : null
  const cfg    = level ? LEVEL_CONFIG[level] : null

  const copyText = level && cfg
    ? `${exam.name}: ${value} ${exam.range.unit} — ${cfg.label}\nRef. lab: ${exam.range.lab}${exam.range.functional ? ` · Funcional: ${exam.range.functional}` : ""}\n\nCorrelações:\n${exam.correlations.join("\n")}\n\nConduta:\n${exam.conducts.join("\n")}`
    : ""

  const generateExplanation = async () => {
    setLoading(true); setError(null); setExplanation(null)
    try {
      const res  = await fetch("/api/interpretacao-exames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exame: exam.name, valor: value, unidade: exam.range.unit, sexo, idade }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setExplanation(data.texto)
    } catch (e) {
      setError("Erro ao gerar explicação. Verifique sua conexão.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <FlaskConical className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--accent)" }} />
          <span className="text-[13px] font-semibold text-left" style={{ color: "var(--text-primary)" }}>{exam.name}</span>
          {level && <ClassBadge level={level} />}
        </div>
        {open ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
               : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: "var(--border)" }}>
          {/* Value input */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Valor <span style={{ color: "var(--text-muted)" }}>({exam.range.unit})</span>
              </label>
              <input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="0,0"
                className="w-full px-3 py-2 rounded-lg text-[13px] font-mono outline-none"
                style={{
                  background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Sexo</label>
              <select
                value={sexo}
                onChange={e => setSexo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[13px] outline-none appearance-none"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                <option>Feminino</option>
                <option>Masculino</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Idade (anos)</label>
              <input
                type="number"
                value={idade}
                onChange={e => setIdade(e.target.value)}
                placeholder="ex: 42"
                className="w-full px-3 py-2 rounded-lg text-[13px] font-mono outline-none"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>
          </div>

          {/* References */}
          <div className="rounded-lg p-3 space-y-1" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
              <span style={{ color: "var(--text-muted)" }}>
                Lab: <span style={{ color: "var(--text-secondary)" }}>{exam.range.lab}</span>
              </span>
              {exam.range.functional && (
                <span style={{ color: "var(--text-muted)" }}>
                  Funcional: <span style={{ color: "var(--accent)" }}>{exam.range.functional}</span>
                </span>
              )}
            </div>
            {exam.notes && (
              <div className="flex items-start gap-1.5 text-[11px]">
                <Info className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }} />
                <span style={{ color: "var(--text-muted)" }}>{exam.notes}</span>
              </div>
            )}
          </div>

          {/* Result classification */}
          {level && cfg && (
            <div className={cn("rounded-xl p-3", cfg.bg, `border ${cfg.border}`)}>
              <div className={cn("text-[10px] font-mono uppercase tracking-wider mb-1", cfg.color)}>Classificação</div>
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>{value} {exam.range.unit}</span>
                <ClassBadge level={level} />
              </div>
            </div>
          )}

          {/* Correlations */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Correlações Clínicas</div>
            <div className="space-y-1.5">
              {exam.correlations.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[9px] font-mono mt-1 flex-shrink-0" style={{ color: "var(--accent)" }}>▸</span>
                  <span className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conducts */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Conduta Sugerida</div>
            <div className="space-y-1.5">
              {exam.conducts.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[9px] font-mono mt-1 flex-shrink-0 text-amber-400">→</span>
                  <span className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Related exams */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Exames Relacionados</div>
            <div className="flex flex-wrap gap-1.5">
              {exam.related.map(r => (
                <span key={r} className="text-[10px] px-2 py-0.5 rounded-full border"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  {r}
                </span>
              ))}
            </div>
          </div>

          {/* Patient explanation */}
          {explanation && (
            <div className="rounded-xl p-4" style={{ background: "rgba(0,192,127,0.06)", border: "1px solid rgba(0,192,127,0.2)" }}>
              <div className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: "var(--accent)" }}>
                Explicação para o Paciente
              </div>
              <p className="text-[12px] leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                {explanation}
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-[11px] text-red-300">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            {copyText && (
              <button
                onClick={() => onCopy(`exam-${exam.id}`, copyText)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all"
                style={{
                  background: copied === `exam-${exam.id}` ? "rgba(0,192,127,0.12)" : "var(--surface)",
                  border: `1px solid ${copied === `exam-${exam.id}` ? "rgba(0,192,127,0.3)" : "var(--border)"}`,
                  color: copied === `exam-${exam.id}` ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {copied === `exam-${exam.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === `exam-${exam.id}` ? "Copiado!" : "Copiar interpretação"}
              </button>
            )}
            <button
              onClick={generateExplanation}
              disabled={loading || !value}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all disabled:opacity-50"
              style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)", color: "var(--accent)" }}
            >
              {loading
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Gerando...</>
                : <><Zap className="w-3 h-3" /> Gerar explicação para paciente</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InterpretacaoExamesPage() {
  const [search, setSearch] = useState("")
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(
    Object.fromEntries(CATEGORIES.map(c => [c, true]))
  )
  const [copied, setCopied] = useState<string | null>(null)

  function copy(id: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return EXAMS
    const q = search.toLowerCase()
    return EXAMS.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.correlations.some(c => c.toLowerCase().includes(q))
    )
  }, [search])

  const filteredByCategory = useMemo(
    () => CATEGORIES.map(cat => ({
      cat,
      exams: filtered.filter(e => e.category === cat),
    })).filter(x => x.exams.length > 0),
    [filtered]
  )

  const toggleCat = (cat: string) =>
    setOpenCats(prev => ({ ...prev, [cat]: !prev[cat] }))

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Interpretação de Exames"
        subtitle="MEDICINA LABORATORIAL · FAIXAS FUNCIONAIS · CORRELAÇÕES CLÍNICAS"
        actions={
          <span className="text-[10px] font-mono px-3 py-1.5 rounded-lg border"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
            {EXAMS.length} exames
          </span>
        }
      />

      <div className="p-4 md:p-8 space-y-5">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar exame, categoria ou condição…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] outline-none"
            style={{
              background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-primary)",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Accordion by category */}
        {filteredByCategory.map(({ cat, exams }) => (
          <div key={cat} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <button
              onClick={() => toggleCat(cat)}
              className="w-full flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
              style={{ background: "var(--card)" }}
            >
              <div className="flex items-center gap-2.5">
                <FlaskConical className="w-4 h-4" style={{ color: "var(--accent)" }} />
                <span className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>{cat}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
                  {exams.length}
                </span>
              </div>
              {openCats[cat]
                ? <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                : <ChevronRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
            </button>

            {openCats[cat] && (
              <div className="p-4 space-y-3" style={{ background: "var(--background)", borderTop: "1px solid var(--border)" }}>
                {exams.map(exam => (
                  <ExamCard key={exam.id} exam={exam} copied={copied} onCopy={copy} />
                ))}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <FlaskConical className="w-10 h-10 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              Nenhum exame encontrado para &quot;{search}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

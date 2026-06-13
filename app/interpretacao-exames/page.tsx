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

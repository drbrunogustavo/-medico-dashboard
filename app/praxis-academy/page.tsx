import type { Metadata } from "next"
import {
  ModulePageShell, ModuleHero, FeatureGrid, ModuleFinalCTA,
  type FeatureItem,
} from "@/components/modules/shared"

export const metadata: Metadata = {
  title: "PRAXIS Academy: 38 aulas de marketing, gestão e comercial para médicos",
  description: "38 aulas em 4 trilhas: Marketing Médico, Gestão de Clínica, Comercial e Conversão, e Escalabilidade.",
  keywords: ["curso marketing médico", "gestão de clínica curso", "academy médicos", "trilhas para médicos", "escalabilidade clínica médica", "PRAXIS Academy"],
  alternates: { canonical: "/praxis-academy" },
  openGraph: {
    title: "PRAXIS Academy",
    description: "38 aulas em 4 trilhas sobre marketing, gestão, comercial e escalabilidade.",
    url: "/praxis-academy",
    type: "website",
  },
}

const TRILHAS: FeatureItem[] = [
  { title: "Marketing Médico, 12 aulas", desc: "Do zero à autoridade digital. Atraia pacientes pelo Instagram sem violar o CFM." },
  { title: "Gestão de Clínica, 10 aulas", desc: "Gerencie sua clínica como empresa: indicadores, finanças, equipe e crescimento sustentável." },
  { title: "Comercial e Conversão, 8 aulas", desc: "Transforme interessados em pacientes fiéis: scripts, CRM, fidelização e reativação." },
  { title: "Escalabilidade, 8 aulas", desc: "Da clínica solo ao grupo médico: telemedicina, segunda unidade, patrimônio e legado." },
]

export default function PraxisAcademyPage() {
  return (
    <ModulePageShell active="/praxis-academy">
      <ModuleHero
        title="PRAXIS Academy"
        subtitle="Aulas sobre o que a faculdade de medicina não cobre: marketing, gestão, vendas e crescimento da clínica."
      />

      <FeatureGrid items={TRILHAS} title="4 trilhas, 38 aulas" intro="Cada aula indica a duração e o nível, e várias levam direto à ferramenta do PRAXIS que aplica o conteúdo." />

      <ModuleFinalCTA title="Quer começar pela trilha de Marketing Médico?" />
    </ModulePageShell>
  )
}

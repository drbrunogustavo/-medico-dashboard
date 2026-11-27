"use client"

import * as React from "react"
import { Panel, PxButton, Segmented, Field, PxInput, PxSelect, PxCheckbox, Tag, EventPill, PxModal, PillNav } from "@/components/px"
import type { PillNavGroup } from "@/components/px"

const GRUPOS: PillNavGroup[] = [
  { id: "inicio", label: "Início", items: [{ label: "Painel do dia", href: "/design" }] },
  { id: "atender", label: "Atender", items: [
    { label: "Agenda", href: "/agenda" }, { label: "Pacientes", href: "/pacientes" },
    { label: "Prescrição assistida", href: "/prescricao" }, { label: "Interpretação de exames", href: "/interpretacao-exames" },
    { label: "Conversa clínica", href: "/conversa", tag: "Novo" }, { label: "Importar pacientes", href: "/importar", tag: "Migração" },
  ] },
  { id: "atrair", label: "Atrair", items: [{ label: "Reels e vídeos", href: "/reels" }, { label: "Banco de pautas", href: "/pautas" }, { label: "Carrosséis", href: "/carrossel" }] },
  { id: "gerir", label: "Gerir", items: [{ label: "Financeiro", href: "/financeiro" }, { label: "Painel executivo", href: "/executivo" }, { label: "Notas fiscais", href: "/notas-fiscais", tag: "Beta" }] },
  { id: "aprender", label: "Aprender", items: [{ label: "Praxis Academy", href: "/academy" }, { label: "Comunidade", href: "/comunidade" }] },
]

export function DesignDemo() {
  const [view, setView] = React.useState<"dia" | "semana">("semana")
  const [open, setOpen] = React.useState(false)
  const [erro, setErro] = React.useState(false)
  const [nome, setNome] = React.useState("")

  return (
    <div className="px px-ambient min-h-screen pb-40">
      <div className="mx-auto max-w-[1100px] px-6 pt-10">
        <p className="text-[13px] font-medium text-px-muted">Conferência interna, não existe em produção</p>
        <h1 className="mt-1 text-[56px] font-semibold leading-none tracking-[-0.035em]">Sistema px</h1>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Panel>
            <h2 className="text-[15px] font-semibold">Botões</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <PxButton>Salvar</PxButton>
              <PxButton variant="secondary">Cancelar</PxButton>
              <PxButton variant="quiet">Ver depois</PxButton>
              <PxButton variant="danger">Excluir</PxButton>
              <PxButton size="sm">Pequeno</PxButton>
              <PxButton loading>Salvando</PxButton>
              <PxButton disabled>Indisponível</PxButton>
            </div>
          </Panel>

          <Panel tone="dark">
            <h2 className="text-[15px] font-semibold">Painel escuro</h2>
            <p className="mt-1 text-[13px] opacity-80">Para o bloco de maior peso da tela.</p>
            <div className="mt-6 text-[44px] font-medium leading-none tracking-[-0.03em]">09:00</div>
            <PxButton variant="inverse" fullWidth className="mt-6">Abrir na agenda</PxButton>
          </Panel>

          <Panel>
            <h2 className="text-[15px] font-semibold">Etiquetas e eventos</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Tag>Rotina</Tag><Tag tone="ink">Urgente</Tag><Tag tone="accent">Prioritário</Tag>
              <Tag tone="ok">Confirmado</Tag><Tag tone="warn">Aguardando resposta</Tag><Tag tone="danger">Faltou</Tag>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <EventPill tone="ink" title="Sérgio Bastos" sub="Primeira consulta, 09:00" />
              <EventPill tone="accent" title="Tatiane Rocha" sub="Retorno, 10:30" />
              <EventPill tone="paper" title="Ana Rodrigues" sub="Consulta, 09:30" />
              <EventPill tone="slate" title="Ethan Kim" sub="Aplicação, 07:00" />
            </div>
          </Panel>

          <Panel>
            <h2 className="text-[15px] font-semibold">Seleção e formulário</h2>
            <div className="mt-4 flex flex-col gap-4">
              <Segmented label="Visualização" value={view} onChange={setView} options={[{ value: "dia", label: "Dia" }, { value: "semana", label: "Semana" }]} />
              <Field label="Paciente" htmlFor="d-nome" error={erro ? "Informe o nome do paciente." : undefined} hint="Nome como consta no prontuário.">
                <PxInput id="d-nome" value={nome} onChange={e => { setNome(e.target.value); setErro(false) }} placeholder="Digite o nome" />
              </Field>
              <Field label="Tipo de consulta" htmlFor="d-tipo">
                <PxSelect id="d-tipo" defaultValue="retorno"><option value="primeira">Primeira consulta</option><option value="retorno">Retorno</option></PxSelect>
              </Field>
              <PxCheckbox label="Enviar lembrete por WhatsApp" defaultChecked />
              <div className="flex gap-3">
                <PxButton onClick={() => { if (!nome.trim()) setErro(true); else setOpen(true) }}>Abrir janela</PxButton>
                <PxButton variant="secondary" onClick={() => setErro(true)}>Forçar erro</PxButton>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <PxModal open={open} onClose={() => setOpen(false)} title="Atribuir paciente">
        <p className="text-[13px] text-px-muted">Esc ou clique fora fecham. O foco volta ao botão que abriu.</p>
        <PxButton fullWidth className="mt-4" onClick={() => setOpen(false)}>Salvar</PxButton>
      </PxModal>

      <PillNav groups={GRUPOS} activeId="inicio" currentHref="/design" action={{ label: "Novo agendamento", onClick: () => setOpen(true) }} />
    </div>
  )
}

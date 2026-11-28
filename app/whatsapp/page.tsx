"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Panel, PxButton, Tag, PageHeader } from "@/components/px"

const USOS = [
  { href: "/regua", nome: "Régua de relacionamento", desc: "Mensagens agendadas para pacientes, enviadas no horário definido." },
  { href: "/nutricao-leads", nome: "Nutrição de leads", desc: "Sequências de mensagens para quem ainda não virou paciente." },
  { href: "/nutricao-pacientes", nome: "Nutrição de pacientes", desc: "Mensagens de acompanhamento depois da consulta." },
  { href: "/reativacao", nome: "Reativação", desc: "Mensagem gerada pela IA para pacientes inativos, enviada uma única vez." },
  { href: "/nps", nome: "Pesquisa de satisfação", desc: "Envio da pesquisa NPS ao paciente." },
  { href: "/indicacoes", nome: "Indicações", desc: "Aviso ao paciente que indicou, quando a indicação é confirmada." },
]

const PLANEJADOS = [
  { nome: "Pré-cadastro de paciente", desc: "Coleta os dados pelo WhatsApp e cria o cadastro." },
  { nome: "Agendamento de consulta", desc: "Verifica horários livres, confirma e lembra o paciente." },
  { nome: "Acompanhamento de 30 e de 90 dias", desc: "Check-ins periódicos com orientações e relatório." },
  { nome: "Triagem antes da consulta", desc: "Anamnese guiada e resumo para o médico." },
  { nome: "Recebimento de exames", desc: "Recebe o exame, a IA organiza e o médico valida antes de responder." },
]

type Estado = "carregando" | "configurada" | "nao_configurada" | "erro"

export default function WhatsAppPage() {
  const [estado, setEstado] = useState<Estado>("carregando")

  useEffect(() => {
    let ativo = true
    fetch("/api/integrations/status")
      .then(async res => {
        const data = await res.json().catch(() => null) as { zapi?: boolean } | null
        if (!res.ok || typeof data?.zapi !== "boolean") throw new Error("HTTP " + res.status)
        if (ativo) setEstado(data.zapi ? "configurada" : "nao_configurada")
      })
      .catch(e => { console.error("[whatsapp] erro ao verificar integração:", e); if (ativo) setEstado("erro") })
    return () => { ativo = false }
  }, [])

  return (
    <div className="animate-fade-in">
      <PageHeader title="Agente WhatsApp" caption="O que o WhatsApp já faz no Praxis e o que ainda não existe" />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Panel as="section" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-px-ink">Envio de mensagens</h2>
            {estado === "carregando" && <Tag tone="neutral">Verificando</Tag>}
            {estado === "configurada" && <Tag tone="ok">Z-API configurada</Tag>}
            {estado === "nao_configurada" && <Tag tone="warn">Z-API não configurada</Tag>}
            {estado === "erro" && <Tag tone="neutral">Não foi possível verificar</Tag>}
          </div>
          <p className="text-[13.5px] leading-relaxed text-px-ink">
            {estado === "nao_configurada"
              ? "Sem a Z-API configurada, nenhuma mensagem automática é enviada. Cadastre a instância em Configurações e teste a conexão."
              : "O envio automático usa a Z-API. Para conferir se a conexão está funcionando, use o teste em Configurações."}
          </p>
          <PxButton variant="secondary" size="sm" href="/configuracoes">Abrir Configurações</PxButton>
        </Panel>

        <Panel as="section" className="space-y-3">
          <div>
            <h2 className="text-[15px] font-semibold text-px-ink">Onde o WhatsApp já é usado</h2>
            <p className="text-[12.5px] text-px-muted">Cada módulo tem a própria lista de mensagens e de destinatários.</p>
          </div>
          <ul className="divide-y divide-px-line">
            {USOS.map(u => (
              <li key={u.href} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
                <div className="min-w-0">
                  <Link href={u.href} className="text-[14px] font-medium text-px-accent underline underline-offset-2">{u.nome}</Link>
                  <p className="text-[13px] text-px-muted">{u.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel as="section" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-px-ink">Agente que conversa com o paciente</h2>
            <Tag tone="neutral">Ainda não existe</Tag>
          </div>
          <p className="text-[13.5px] leading-relaxed text-px-ink">
            Hoje o Praxis envia mensagens programadas, mas não responde sozinho ao paciente no WhatsApp. Não há resposta automática, fluxo de conversa nem
            horário de atendimento configurável. Estes são os fluxos pensados para quando o agente for construído:
          </p>
          <ul className="space-y-2">
            {PLANEJADOS.map(p => (
              <li key={p.nome} className="text-[13.5px] leading-snug text-px-ink">
                <span className="font-medium">{p.nome}.</span> <span className="text-px-muted">{p.desc}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}

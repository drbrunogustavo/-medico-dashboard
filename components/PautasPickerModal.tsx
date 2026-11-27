"use client"

import { PautasModal } from "@/components/PautasModal"

interface PautasPickerModalProps {
  onSelect: (titulo: string) => void
  onClose:  () => void
}

/** Mesmo seletor do PautasModal, para páginas que só precisam do título da pauta. */
export function PautasPickerModal({ onSelect, onClose }: PautasPickerModalProps) {
  return <PautasModal onSelect={titulo => onSelect(titulo)} onClose={onClose} />
}

interface Props {
  title?: string
}

export function MobileOnlyHeader({ title }: Props) {
  if (!title) return null
  return (
    <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface border-b border-border sticky top-0 z-40">
      <span className="text-[12px] font-semibold text-text-primary truncate">{title}</span>
    </div>
  )
}

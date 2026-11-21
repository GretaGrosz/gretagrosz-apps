import { ChevronRight } from './Icons.jsx'

// Gruppierte Liste wie in den iPhone-Einstellungen
export function ListGroup({ header, footer, children, className = '' }) {
  return (
    <section className={`mb-7 ${className}`}>
      {header && <h2 className="mb-1.5 px-4 text-[13px] font-normal uppercase tracking-wide text-label2">{header}</h2>}
      <div className="overflow-hidden rounded-card bg-surface [&>*+*]:border-t [&>*+*]:border-sep/20">{children}</div>
      {footer && <p className="mt-1.5 px-4 text-[13px] text-label2">{footer}</p>}
    </section>
  )
}

// Eine Zeile: optional Icon links, Titel + Untertitel, rechts Wert und Pfeil
export function ListRow({ title, subtitle, left, right, onClick, disabled = false, chevron = true, tone, children, label, selected }) {
  const clickable = Boolean(onClick) && !disabled
  const Tag = clickable ? 'button' : 'div'
  return (
    <Tag
      type={clickable ? 'button' : undefined}
      onClick={clickable ? onClick : undefined}
      aria-label={label}
      aria-pressed={selected === undefined ? undefined : selected}
      className={`flex min-h-[48px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        clickable ? 'active:bg-fill/[0.14]' : ''
      }`}
    >
      {left}
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[17px] leading-snug ${
            disabled ? 'text-label3' : tone === 'accent' ? 'text-accent-text' : tone === 'danger' ? 'text-danger' : 'text-label'
          }`}
        >
          {title}
        </span>
        {subtitle && <span className="mt-0.5 block text-[15px] leading-snug text-label2">{subtitle}</span>}
        {children}
      </span>
      {right !== undefined && right !== null && <span className="shrink-0 text-[17px] text-label2">{right}</span>}
      {chevron && clickable && <ChevronRight className="h-4 w-4 shrink-0 text-label3" />}
    </Tag>
  )
}

// Kleines farbiges Quadrat mit Icon (wie die Symbole in den iPhone-Einstellungen)
export function IconTile({ children, tone = 'accent' }) {
  const bg = tone === 'danger' ? 'bg-danger' : tone === 'success' ? 'bg-success' : tone === 'gray' ? 'bg-label2' : 'bg-accent'
  return <span className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] text-white ${bg}`}>{children}</span>
}

export function SectionHeader({ children, className = '' }) {
  return <h2 className={`mb-1.5 px-4 text-[13px] uppercase tracking-wide text-label2 ${className}`}>{children}</h2>
}

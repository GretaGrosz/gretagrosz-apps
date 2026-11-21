// Linien-Icons (24×24) im Stil der SF Symbols: eine Strichstärke, runde Enden.
// Dekorativ (aria-hidden); die Beschriftung kommt immer vom Button oder der Zeile.
function Icon({ children, className = 'h-6 w-6', strokeWidth = 1.8, label }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {children}
    </svg>
  )
}

export const HomeIcon = (p) => (
  <Icon {...p}>
    <path d="M3.5 10.5 12 3.5l8.5 7" />
    <path d="M5.5 9v11h13V9" />
    <path d="M10 20v-6h4v6" />
  </Icon>
)

export const BookIcon = (p) => (
  <Icon {...p}>
    <path d="M12 6.5C10.5 5 8 4.5 4 4.5v14c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-14c-4 0-6.5.5-8 2Z" />
    <path d="M12 6.5v14" />
  </Icon>
)

export const QuizIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12.2 2.4 2.4 4.6-5" />
  </Icon>
)

export const CardsIcon = (p) => (
  <Icon {...p}>
    <rect x="3.5" y="7" width="13" height="13" rx="2.5" />
    <path d="M7.5 7V5.5A2 2 0 0 1 9.5 3.5h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H16.5" />
  </Icon>
)

export const CalendarIcon = (p) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    <path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2" strokeWidth="2" />
  </Icon>
)

export const GearIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </Icon>
)

export const RepeatIcon = (p) => (
  <Icon {...p}>
    <path d="M4 11.5V10a4 4 0 0 1 4-4h11" />
    <path d="m16 3 3 3-3 3" />
    <path d="M20 12.5V14a4 4 0 0 1-4 4H5" />
    <path d="m8 21-3-3 3-3" />
  </Icon>
)

export const NotebookIcon = (p) => (
  <Icon {...p}>
    <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
    <path d="M9 3.5v17" />
    <path d="m12 9.5 4 4M16 9.5l-4 4" />
  </Icon>
)

export const ClockIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
)

export const TargetIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="0.8" fill="currentColor" />
  </Icon>
)

export const GridIcon = (p) => (
  <Icon {...p}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </Icon>
)

export const PlusIcon = (p) => (
  <Icon strokeWidth={2.2} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

export const CheckIcon = (p) => (
  <Icon strokeWidth={2.6} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
)

export const XIcon = (p) => (
  <Icon strokeWidth={2.4} {...p}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </Icon>
)

export const ChevronLeft = (p) => (
  <Icon strokeWidth={2.4} {...p}>
    <path d="m14.5 5-7 7 7 7" />
  </Icon>
)

export const ChevronRight = (p) => (
  <Icon strokeWidth={2.2} {...p}>
    <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
  </Icon>
)

export const ArrowUpIcon = (p) => (
  <Icon strokeWidth={2.2} {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Icon>
)

export const DownloadIcon = (p) => (
  <Icon {...p}>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
    <path d="M5 19.5h14" />
  </Icon>
)

export const UploadIcon = (p) => (
  <Icon {...p}>
    <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
    <path d="M5 19.5h14" />
  </Icon>
)

export const GlobeIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.5 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.5-3.5-8.5s1-5.9 3.5-8.5Z" />
  </Icon>
)

export const CapIcon = (p) => (
  <Icon {...p}>
    <path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5Z" />
    <path d="M6.5 11.5v4c1.5 1.4 3.5 2 5.5 2s4-.6 5.5-2v-4" />
    <path d="M21.5 9.5v5" />
  </Icon>
)

export const FlagIcon = (p) => (
  <Icon {...p}>
    <path d="M5.5 21V4" />
    <path d="M5.5 4.5h11l-2 4 2 4h-11" />
  </Icon>
)

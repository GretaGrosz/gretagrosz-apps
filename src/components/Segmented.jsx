import { motion } from 'framer-motion'
import { SPRING } from '../motion.js'

// Segmented Control wie bei iOS; der weiße "Schlitten" gleitet zur Auswahl.
export default function Segmented({ options, value, onChange, className = 'mb-6', label, id }) {
  return (
    <div role="radiogroup" aria-label={label} className={`relative flex rounded-[9px] bg-fill/[0.14] p-0.5 ${className}`}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`relative flex min-h-[36px] flex-1 items-center justify-center px-1 text-[13px] font-semibold transition-colors ${on ? 'text-label' : 'text-label2'}`}
          >
            {on && (
              <motion.span
                layoutId={`seg-${id ?? label}`}
                transition={SPRING}
                className="absolute inset-0 rounded-[7px] bg-surface shadow-[0_2px_6px_rgb(0_0_0/0.12)] dark:bg-raised"
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

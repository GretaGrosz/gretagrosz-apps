// Buttons wie bei iOS: gefüllt in der Akzentfarbe (weiße Schrift, flach) oder grau hinterlegt.
// variant: 'primary' | 'secondary' (grau, Akzentschrift) | 'danger' (grau, rote Schrift)
export default function Button({ children, onClick, className = '', variant = 'primary', type = 'button', disabled = false, ...rest }) {
  const base =
    'inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full px-5 text-[17px] font-semibold ' +
    'transition-[opacity,transform,background-color] duration-150 active:scale-[0.98] active:opacity-80 disabled:active:scale-100 disabled:cursor-not-allowed'
  const look = disabled
    ? 'bg-fill/20 text-label3'
    : variant === 'primary'
    ? 'bg-accent text-white'
    : variant === 'danger'
    ? 'bg-fill/[0.14] text-danger'
    : 'bg-fill/[0.14] text-accent-text'
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${look} ${className}`} {...rest}>
      {children}
    </button>
  )
}

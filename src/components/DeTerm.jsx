import { useLang } from '../i18n.jsx'

// Der deutsche Fachbegriff als ruhige zweite Zeile (nur in EN/HU, wenn er sich unterscheidet) –
// so heißt es in der Schularbeit.
export default function DeTerm({ term, shown, className = '' }) {
  const { lang } = useLang()
  if (lang === 'de' || !term || term === shown || !/\p{L}/u.test(term)) return null
  return (
    <span lang="de" className={`block text-[15px] font-normal text-label2 ${className}`}>
      {term}
    </span>
  )
}

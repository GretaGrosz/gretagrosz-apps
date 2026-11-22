import { motion } from 'framer-motion'
import { LANGUAGES, useLang } from '../i18n.jsx'
import { jahrgaenge } from '../data/curriculum.js'
import { useProgress } from '../progress.jsx'
import { loadContent } from '../data/content.js'
import ShopScene from '../components/ShopScene.jsx'
import Segmented from '../components/Segmented.jsx'
import { ListGroup, ListRow } from '../components/List.jsx'
import { SPRING } from '../motion.js'
import { useAccount } from '../account/Account.jsx'
import { useAccountText } from '../account/strings.js'

// Erstes Öffnen: nur der Jahrgang. Die Sprache kommt von gretagrosz.com oder vom Gerät;
// ist sie unbekannt, steht oben ein Umschalter. Wer schon ein Konto hat, meldet sich unten an und bekommt seinen Stand.
export default function Onboarding() {
  const { lang, setLang, langKnown, t } = useLang()
  const { finishOnboarding } = useProgress()
  const account = useAccount()
  const at = useAccountText()

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-4 pb-10 pt-[calc(env(safe-area-inset-top)+28px)]">
      {!langKnown && (
        <Segmented id="ob-lang" label={t('language')} options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))} value={lang} onChange={setLang} />
      )}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <ShopScene level={0} className="mx-auto h-auto w-52" />
        <h1 className="mt-2 text-center text-[34px] font-bold leading-[41px] text-label">BW Buddy</h1>
        <h2 className="mb-5 mt-1 text-center text-[17px] text-label2">{t('obYear')}</h2>
        <ListGroup>
          {jahrgaenge.map((j) => (
            <ListRow
              key={j.id}
              title={t('yearLabel', { n: j.id })}
              onClick={() => {
                loadContent(lang, j.id).catch(() => {})
                finishOnboarding(j.id)
              }}
            />
          ))}
        </ListGroup>
        {!account.account && (
          <button onClick={() => account.open('login')} className="mx-auto block min-h-[44px] px-3 text-[15px] text-accent-text active:opacity-50">
            {at('haveAccount')}
          </button>
        )}
      </motion.div>
    </main>
  )
}

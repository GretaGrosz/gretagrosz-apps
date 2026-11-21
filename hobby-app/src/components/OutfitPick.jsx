// Finish a project: you pick one new outfit for your axolotl. It's the only way to get one.
// The outfits of that project's hobby come first. "Later" keeps the pick open on the axolotl's page (pages/StreakPage.jsx).
import { useEffect, useState } from 'react'
import { useStore, onActivity } from '../store'
import { useT } from '../i18n'
import { OUTFITS, OutfitPreview } from './Buddy'
import { Sheet, SheetHeader } from './ui'
import Mascot from '../assistant/Mascot'
import { categoryLabel } from './ProjectBits'

export function OutfitPick({ pickKey, onClose }) {
  const { data, actions, isUnlocked } = useStore()
  const { t } = useT()
  const project = data.projects.find((p) => p.id === pickKey)
  const hobby = project?.category
  const left = OUTFITS.filter((o) => !isUnlocked(o))
  const mine = left.filter((o) => o.hobby === hobby)
  const more = left.filter((o) => o.hobby !== hobby)
  const [chosen, setChosen] = useState(() => (mine[0] || more[0])?.id || null)
  const item = OUTFITS.find((o) => o.id === chosen)
  const outfit = { ...(data.me.outfit || {}), ...(item && { [item.slot]: item.id }) }

  const wear = () => {
    if (!item) return
    actions.choosePick(pickKey, item.id)
    onClose()
  }

  const grid = (items) => (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {items.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => setChosen(o.id)}
          aria-pressed={o.id === chosen}
          className={`surface flex flex-col items-center p-3 transition active:scale-[0.97] ${o.id === chosen ? 'ring-2 ring-spark' : ''}`}
        >
          <span className="flex h-14 w-full items-center justify-center">
            <OutfitPreview item={o} />
          </span>
          <span className="mt-1 text-center text-[13px] font-semibold leading-tight">{t(o.name)}</span>
        </button>
      ))}
    </div>
  )

  return (
    <Sheet onClose={onClose} label={t('Pick your outfit')}>
      <SheetHeader title={t('Pick your outfit')} onClose={onClose} />
      <div className="px-5 pb-3">
        <div className="flex flex-col items-center text-center">
          <Mascot size={150} peek outfit={outfit} mood="cheer" title="" />
          <p className="mt-2 text-[17px] text-sub">
            {project ? t('You finished {title}! Pick one new outfit.', { title: project.title }) : t('Pick one new outfit.')}
          </p>
        </div>
        {!left.length ? (
          <p className="py-8 text-center text-[17px] text-sub">{t('You have every outfit already!')}</p>
        ) : (
          <>
            {mine.length > 0 && (
              <section className="mt-5">
                <h3 className="section-label">{t('For {hobby}', { hobby: categoryLabel(t, hobby) })}</h3>
                {grid(mine)}
              </section>
            )}
            {more.length > 0 && (
              <section className="mt-5">
                <h3 className="section-label">{mine.length ? t('More outfits') : t('Outfits')}</h3>
                {grid(more)}
              </section>
            )}
          </>
        )}
        <button onClick={wear} disabled={!item} className="btn-primary btn-lg mt-5 w-full" data-autofocus>
          {t('Wear it')}
        </button>
        <button onClick={onClose} className="h-12 w-full rounded-full text-[17px] text-spark-ink active:opacity-60">
          {t('Later')}
        </button>
      </div>
    </Sheet>
  )
}

// Opens the picker the moment you finish a project (store.jsx earnPick)
export function PickSync() {
  const [key, setKey] = useState(null)
  useEffect(() => onActivity((e) => e.kind === 'pick' && setKey(e.key)), [])
  return key ? <OutfitPick pickKey={key} onClose={() => setKey(null)} /> : null
}

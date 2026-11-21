// A step only counts as done with a photo of it (except the quick video step): the photo goes into the project's progress,
// captioned with the step, and then the step is ticked. Unticking stays a plain tap.
import { useRef } from 'react'
import { useStore } from '../store'
import { usePhotoPicker } from './ui'
import { useUi } from './Layout'

export function useStepPhoto(onDone) {
  const { actions, data } = useStore()
  const ui = useUi()
  const target = useRef(null)
  const picker = usePhotoPicker(async ({ ref, ratio }) => {
    const tgt = target.current
    target.current = null
    if (!tgt) return
    actions.addEntry(tgt.projectId, { photo: ref, ratio, text: tgt.step.text })
    const p = data.projects.find((x) => x.id === tgt.projectId)
    if (p?.milestones.some((m) => m.id === tgt.step.id && !m.done)) actions.toggleStep(tgt.projectId, tgt.step.id)
    onDone?.(tgt)
    // The step's photo is a post already: offer to share it (Layout.jsx)
    if (p) ui?.offerShare?.({ projectId: p.id, project: p.title, category: p.category, text: tgt.step.text, photo: ref, ratio })
  })
  const open = (projectId, step) => {
    // The video step needs no photo (option b, Greta Nov 3): a tap ticks it
    if (step.quick) {
      if (!step.done) actions.toggleStep(projectId, step.id)
      onDone?.({ projectId, step })
      return
    }
    target.current = { projectId, step }
    picker.open()
  }
  return { ...picker, open }
}

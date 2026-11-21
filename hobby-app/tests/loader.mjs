// Lets `node --test` load Blank's code as-is: imports without an extension (Vite style) get '.js'/'.jsx' tried,
// and the one binary import in the Worker (a PDF in worker/site.js) becomes an empty module.
import { register } from 'node:module'

register(
  'data:text/javascript,' +
    encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  try {
    return await next(spec, ctx)
  } catch (e) {
    if (!/^\\.{1,2}\\//.test(spec) || /\\.[a-z]+$/.test(spec)) throw e
    for (const ext of ['.js', '.jsx']) {
      try { return await next(spec + ext, ctx) } catch {}
    }
    throw e
  }
}
export async function load(url, ctx, next) {
  if (url.endsWith('.pdf')) return { format: 'module', source: 'export default new Uint8Array()', shortCircuit: true }
  return next(url, ctx)
}`),
)

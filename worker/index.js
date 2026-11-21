// gretagrosz.com Worker. Static files in deploy/site are served by Cloudflare before this runs;
// only requests no file matches reach it. Each app's API lives in its own module:
// Yap (/yap/api/*, yap.js), Stance (/stance/api/*, stance.js), and the others below.
// Everything else goes back to the static assets (which return their usual 404).
import { yap } from './yap.js'
import { stance } from './stance.js'
import { site } from './site.js'
import { qed } from './qed.js'
import { blank } from './blank.js'
import { withLimits } from './limits.js'
import { sendDue } from './blank-reminders.js'
import { sendSessionReminders } from './blank-together.js'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    // AI, photo storage and emails behind hard ceilings under the free tiers, with a warning email at 80% (limits.js)
    // (Yap and Agora each have their own AI ceiling on top, 0 for now, so Blank gets the whole daily amount)
    if (url.pathname.startsWith('/yap/api/')) return yap(request, withLimits(env, ctx, 'yap'), ctx, url)
    if (url.pathname.startsWith('/stance/api/')) return stance(request, withLimits(env, ctx, 'agora'), ctx, url)
    env = withLimits(env, ctx)
    if (url.pathname.startsWith('/api/site/')) return site(request, env, ctx, url)
    if (url.pathname.startsWith('/qed/api/')) return qed(request, env, ctx, url)
    if (url.pathname.startsWith('/blank/api/')) return blank(request, env, ctx, url)
    return env.ASSETS.fetch(request)
  },
  // Cron (wrangler.jsonc "triggers"): every 5 minutes, the axolotl's reminders that are due (blank-reminders.js)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendDue(env).catch((e) => console.error('blank reminders cron', e)))
    // ...and the reminders for sessions planned in a project chat (blank-together.js)
    ctx.waitUntil(sendSessionReminders(env).catch((e) => console.error('blank session reminders cron', e)))
  },
}

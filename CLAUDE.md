# gretagrosz.com (BW APP)

Greta's website and apps on one Cloudflare Worker (`wrangler.jsonc`, `worker/`), deployed with `npm run deploy`.
Apps: Blank (`hobby-app/`), BW Buddy, Ten a Day (`vocab-app/`), QED (`regional-app/`), Yap, Agora (`stance-app/`), Tape (`music-app/`, offline music player at /music/, songs stay on the device in IndexedDB), Lock-In (`deutsch-app/`, German Schularbeit trainer at /deutsch/, static, progress in localStorage; build with `npm run build:deutsch`).

## Money: stay inside the free tiers (Greta's standing rule)

- Never add, enable or change anything that can cost money, or that could go over a free tier, without telling
  Greta first in plain words: what it is, the free amount, and what it would cost above that.
- Everything paid goes through the hard ceilings in `worker/limits.js` (Workers AI, R2, Resend). New code that uses
  AI, R2 or email must use `env.AI` / `env.PHOTOS` (already wrapped in `worker/index.js`) or `use()` from `limits.js`,
  never a raw binding or a direct API call that skips the ceilings.
- New paid services (a new bucket, KV, Queues, another API with a key) need a ceiling in `limits.js` before they ship.
- Ceilings sit under the free amount and pause the feature instead of billing; Greta gets an email at 80%.
- QED's Anthropic key is separate and has its own daily caps in `worker/qed.js`.


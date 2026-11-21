# The axolotl's accessories

One file per slot: `head.jsx` (hats), `eyes.jsx` (glasses & face), `neck.jsx`, `gills.jsx`, each with its own
`.css` for idle motion. `src/components/Buddy.jsx` collects them, renders them on the axolotl and runs the
put-on animation (drop / slide / pop + sparkles). Item files only draw.

## Item shape

```js
{
  id: 'lilypad',            // stable, stored in saves
  name: 'Lily pad',         // English, short, funny; German goes in src/de.js
  slot: 'head',             // head | eyes | neck | gills
  hobby: 'outdoors',        // a category from src/data.js: shown first when you finish a project of that hobby
  box: '62 -6 84 66',       // head/eyes/neck: viewBox (x y w h, axolotl coords) that crops the item for the wardrobe tile
  axo: <>…</>,              // head/eyes/neck: SVG in the axolotl's 200×200 box (see geometry)
  tip: ({ r, i, side }) => <>…</>, // gills only: SVG centred on ONE gill tip at (0,0); r = tip radius (≈8, 9.6 when tiny),
                            //   i = 0..3 (top → bottom), side = 'l' | 'r'. Called 8 times, once per gill tip.
}
```

Every item is wrapped by Buddy.jsx in `<g class="axo-acc axo-acc-{id}">`, so idle motion in the css file is keyed on
`.axo .axo-acc-{id} .something`. Rules for the css:
- animate only `transform` and `opacity`; any element you transform needs `transform-box` + `transform-origin`
  (use `transform-box: view-box` and origins in axolotl px, or `fill-box` + %)
- never CSS-transform an element that also has a `transform` attribute (the CSS replaces it) — wrap it in a `<g>`
- pause with the rest: add your selectors to `.axo[data-axo-paused] … { animation-play-state: paused }`
- `@media (prefers-reduced-motion: reduce) { … { animation: none } }`
- keyframe names prefixed `acc-{id}-`

## Geometry (axolotl viewBox 0 0 200 200, head group, already tilted the way it's drawn)

- Ink outline `#4A1A0E`, stroke ~2–2.5 for main outlines, round joins. Skin pinks `#F5C8BB / #EFB4A5 / #E39E8D`.
  Match this style: chunky, rounded, flat colours with one soft highlight, dark-brown outlines (not black).
- Head outline path: `M48 89C46.5 76 59 62 78 55C95 48.5 119 46 138 53C150 57.5 158 65 157.5 75C157 87 138 97.5 120 102C102 106.5 76 106.5 62 101.5C53 98.5 48.5 94.5 48 89Z`
  Top of head ≈ y 48 at x 104–115; the head is tilted ~-9° (right side higher). A hat anchors around (104, 52).
- Gill bases hide behind the head at x≈62–74 (left) and x≈128–148 (right) — hats wider than ~x 72…140 cover them.
- Gill tips (cx, cy, r): left (49,18,8) (25,30,7.5) (10,56,8) (18,86,7.5); right (151,8,8) (172,26,7.5) (190,47,8) (183,73,7.5).
- Eyes: left socket centre (69, 85) rx 14 ry 11.5 tilted -8°; right (138, 74.5) rx 13.5 ry 11.5 tilted -12°.
  The bridge between them runs ~(86,82.5)→(121,73). Glasses must keep the eyes readable (tinted/transparent lenses
  or a fun opaque gag like pixel shades).
- Seam (centre line of the face) (97.5,51)→(105.5,103). Mouth at (106, 95.5) tilted -9°.
- Neck / chin: underside of head ~y 100–106 between x 60–150. In the "peek" pose the paws rest at (57,120) and
  (148,115) and are drawn ON TOP of neck items; in the full-body pose the torso is
  `M80 100C63 114 59 145 70 160C80 173 128 173 138 160C149 145 145 114 128 100Z`. A neck item lives around y 98–130.
- Outfits render after the face inside the head group, so they're in front of the face, behind the paws.

## Preview

`sh /private/tmp/claude-501/-Users-gretagrosz/790a68d4-bffb-4795-a46e-f840371e0680/scratchpad/preview/shot.sh <slot>` renders
every item of that slot on the axolotl (peek, full body, behind a prop, tiny, wardrobe tile, put-on frames) to a PNG
and prints its path. Read the PNG and iterate until it's genuinely adorable.

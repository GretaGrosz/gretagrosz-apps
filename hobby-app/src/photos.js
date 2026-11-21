// Idea photos from Unsplash (unsplash.com/license), self-hosted as WebP in public/ideas/ (440 and 900 px wide)

export const PHOTOS = {
  bench: { ratio: 1.5, by: 'Cphotos' },
  birdhouse: { ratio: 1.0, by: 'Chris Haws' },
  camera: { ratio: 1.5, by: 'Yoann Siloine' },
  canoe: { ratio: 0.668, by: 'SaiKrishna Saketh Yellapragada' },
  cinnamon: { ratio: 1.5, by: 'Anisa Cakesandbakes' },
  circuit: { ratio: 0.668, by: 'Blaz Erzetic' },
  climb: { ratio: 1.5, by: 'Se. Tsuchiya' },
  console: { ratio: 0.668, by: 'Branden Skeli' },
  embroidery: { ratio: 0.668, by: 'Ksenia Yakovleva' },
  flowers: { ratio: 0.706, by: 'Alexandra Marta' },
  focaccia: { ratio: 0.668, by: 'Paula Berto' },
  guitar: { ratio: 0.668, by: 'Jefferson Santos' },
  journal: { ratio: 1.5, by: 'Marcos Paulo Prado' },
  knit: { ratio: 1.004, by: 'rocknwool' },
  lemons: { ratio: 1.5, by: 'Ramina M' },
  linocut: { ratio: 1.5, by: 'Jonathan Castañeda' },
  mountain: { ratio: 1.5, by: 'Guillaume Briard' },
  pasta: { ratio: 1.5, by: 'Karolina Kołodziejczak' },
  pixels: { ratio: 1.37, by: 'Tasha Kostyuk' },
  plant: { ratio: 0.651, by: 'vadim kaipov' },
  pottery: { ratio: 0.668, by: 'Taylor Heery' },
  radio: { ratio: 0.71, by: 'Ian Talmacs' },
  ramen: { ratio: 1.0, by: 'Michele Blackwell' },
  runner: { ratio: 0.668, by: 'Felix yu' },
  sewing: { ratio: 0.762, by: 'Omar Alrawi' },
  sketch: { ratio: 0.75, by: 'DHANYA A V' },
  sourdough: { ratio: 1.388, by: 'Franzi Meyer' },
  synth: { ratio: 0.668, by: 'Nikita Turkovich' },
  tomato: { ratio: 1.332, by: 'Per Lööv' },
  tools: { ratio: 0.668, by: 'Barn Images' },
  trail: { ratio: 1.5, by: 'Venti Views' },
}

// The photo file for a plan: small for grids, large for the detail sheet
export const photoFile = (key, w = 440) => `${import.meta.env.BASE_URL}ideas/${key}-${w > 440 ? 900 : 440}.webp`

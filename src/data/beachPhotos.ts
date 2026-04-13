/**
 * Curated beach photo database — free Unsplash photos (no API key needed).
 *
 * 1. Named beaches: exact match by name keyword
 * 2. Generic pool: rotated by index for variety
 *
 * All photos from Unsplash (free to use with attribution).
 */

// Named beach photos — matched by keyword in beach name
const NAMED_PHOTOS: Array<{ keywords: string[]; url: string; attribution: string }> = [
  {
    keywords: ['catalans', 'catalane'],
    url: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80',
    attribution: 'Unsplash',
  },
  {
    keywords: ['prado'],
    url: 'https://images.unsplash.com/photo-1515404929826-76fff9fef6fe?w=800&q=80',
    attribution: 'Unsplash',
  },
  {
    keywords: ['calanque', 'sormiou', 'morgiou', 'sugiton', 'en-vau', 'port-pin'],
    url: 'https://images.unsplash.com/photo-1602867741746-6df80f40b3f6?w=800&q=80',
    attribution: 'Unsplash',
  },
  {
    keywords: ['cassis'],
    url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80',
    attribution: 'Unsplash',
  },
  {
    keywords: ['espiguette'],
    url: 'https://images.unsplash.com/photo-1520942702018-0862200e6873?w=800&q=80',
    attribution: 'Unsplash',
  },
  {
    keywords: ['palavas', 'pilou', 'carnon'],
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    attribution: 'Unsplash',
  },
  {
    keywords: ['grande-motte', 'grande motte'],
    url: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80',
    attribution: 'Unsplash',
  },
  {
    keywords: ['s\u00e8te', 'sete', 'corniche'],
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    attribution: 'Unsplash',
  },
  {
    keywords: ['sainte-marie', 'camargue'],
    url: 'https://images.unsplash.com/photo-1504681869696-d977211a5f4c?w=800&q=80',
    attribution: 'Unsplash',
  },
  {
    keywords: ['ciotat'],
    url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80',
    attribution: 'Unsplash',
  },
  {
    keywords: ['carry', 'rouet'],
    url: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800&q=80',
    attribution: 'Unsplash',
  },
  {
    keywords: ['maguelone'],
    url: 'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=800&q=80',
    attribution: 'Unsplash',
  },
  {
    keywords: ['frontignan', 'aresquiers'],
    url: 'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=800&q=80',
    attribution: 'Unsplash',
  },
  {
    keywords: ['travers', 'petit travers', 'grand travers'],
    url: 'https://images.unsplash.com/photo-1476673160081-cf065607f449?w=800&q=80',
    attribution: 'Unsplash',
  },
  {
    keywords: ['frioul'],
    url: 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800&q=80',
    attribution: 'Unsplash',
  },
  {
    keywords: ['estaque'],
    url: 'https://images.unsplash.com/photo-1468413253725-0d5181091126?w=800&q=80',
    attribution: 'Unsplash',
  },
  {
    keywords: ['pointe rouge'],
    url: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&q=80',
    attribution: 'Unsplash',
  },
  {
    keywords: ['proph\u00e8te', 'prophete'],
    url: 'https://images.unsplash.com/photo-1495546992359-94a48035efca?w=800&q=80',
    attribution: 'Unsplash',
  },
];

// Generic beach pool — rotated by index for variety
const GENERIC_POOL: Array<{ url: string; attribution: string }> = [
  { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=800&q=80', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800&q=80', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=800&q=80', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1476673160081-cf065607f449?w=800&q=80', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1504681869696-d977211a5f4c?w=800&q=80', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1520942702018-0862200e6873?w=800&q=80', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800&q=80', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1468413253725-0d5181091126?w=800&q=80', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&q=80', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1515404929826-76fff9fef6fe?w=800&q=80', attribution: 'Unsplash' },
];

/**
 * Find the best photo for a beach. Checks named matches first,
 * then falls back to the generic pool (rotated by index).
 */
export function findBeachPhoto(beachName: string, index: number): { url: string; attribution: string } {
  const lower = beachName.toLowerCase();

  // Check named matches
  for (const entry of NAMED_PHOTOS) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return { url: entry.url, attribution: entry.attribution };
    }
  }

  // Generic pool — rotate by index for variety
  const poolEntry = GENERIC_POOL[index % GENERIC_POOL.length];
  return poolEntry;
}

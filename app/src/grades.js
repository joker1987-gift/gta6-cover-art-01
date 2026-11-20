// Neon Coast Cover Studio — colour grades.
// A grade is a canvas recipe: a filter applied while the photo is drawn,
// plus two overlay washes (sky and shadow) blended over the panel so the
// whole cover shares one sunset / neon mood.

export const GRADES = [
  {
    id: 'sunset-drive',
    name: 'Sunset Drive',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.02)',
    sky: 'rgba(255, 122, 61, 0.20)',
    shadow: 'rgba(43, 16, 84, 0.22)',
    wash: 'rgba(255, 183, 77, 0.10)',
  },
  {
    id: 'neon-nights',
    name: 'Neon Nights',
    filter: 'saturate(1.5) contrast(1.16) brightness(0.98)',
    sky: 'rgba(255, 45, 149, 0.18)',
    shadow: 'rgba(8, 20, 64, 0.30)',
    wash: 'rgba(0, 229, 255, 0.10)',
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    filter: 'saturate(1.22) contrast(1.04) brightness(1.07) sepia(0.22)',
    sky: 'rgba(255, 196, 86, 0.22)',
    shadow: 'rgba(94, 44, 10, 0.18)',
    wash: 'rgba(255, 224, 138, 0.12)',
  },
  {
    id: 'vice-teal',
    name: 'Vice Teal',
    filter: 'saturate(1.28) contrast(1.1) hue-rotate(-8deg)',
    sky: 'rgba(0, 194, 203, 0.18)',
    shadow: 'rgba(4, 40, 52, 0.26)',
    wash: 'rgba(255, 110, 180, 0.08)',
  },
  {
    id: 'midnight-noir',
    name: 'Midnight Noir',
    filter: 'saturate(0.55) contrast(1.24) brightness(0.94)',
    sky: 'rgba(64, 72, 138, 0.20)',
    shadow: 'rgba(0, 0, 10, 0.38)',
    wash: 'rgba(140, 160, 220, 0.07)',
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// Deterministic PRNG (mulberry32) so grain and texture renders are
// byte-stable between runs — screenshots must never flicker.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

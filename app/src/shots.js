// Neon Coast Cover Studio — deterministic screenshot scenes.
// The app honours ?shot=cover|editor|portrait|square. Each scene pins the
// layout, grade, size and lettering so a capture is reproducible: same
// URL, same pixels, every time.

export const SIZES = [
  { id: 'landscape', label: '1920 × 1080', w: 1920, h: 1080 },
  { id: 'portrait', label: '1080 × 1350', w: 1080, h: 1350 },
  { id: 'square', label: '1080 × 1080', w: 1080, h: 1080 },
];

export const SHOT_SCENES = {
  cover: {
    mode: 'cover',
    file: '1-cover.jpg',
    sizeId: 'landscape',
    layoutId: 'hero-grid',
    gradeId: 'sunset-drive',
  },
  editor: {
    mode: 'editor',
    file: '2-editor.jpg',
    sizeId: 'landscape',
    layoutId: 'hero-grid',
    gradeId: 'neon-nights',
  },
  portrait: {
    mode: 'cover',
    file: '3-cover-portrait.jpg',
    sizeId: 'portrait',
    layoutId: 'classic-nine',
    gradeId: 'vice-teal',
  },
  square: {
    mode: 'cover',
    file: '4-cover-square.jpg',
    sizeId: 'square',
    layoutId: 'mosaic-six',
    gradeId: 'golden-hour',
  },
};

export function sceneFromUrl(url) {
  const key = new URL(url).searchParams.get('shot');
  if (!key) return null;
  return SHOT_SCENES[key] || null;
}

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) || SIZES[0];
}

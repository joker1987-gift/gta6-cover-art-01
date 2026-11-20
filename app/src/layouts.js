// Neon Coast Cover Studio — panel layouts.
// Each layout is a list of panel rectangles in normalised cover
// coordinates (0..1 on both axes). The renderer multiplies them by the
// export size, so one layout works for landscape, portrait and square.

function rect(x, y, w, h) {
  return { x, y, w, h };
}

export const LAYOUTS = [
  {
    id: 'hero-grid',
    name: 'Hero Grid',
    panels: [
      rect(0, 0, 0.62, 0.66),
      rect(0.62, 0, 0.38, 0.33),
      rect(0.62, 0.33, 0.38, 0.33),
      rect(0, 0.66, 0.34, 0.34),
      rect(0.34, 0.66, 0.33, 0.34),
      rect(0.67, 0.66, 0.33, 0.34),
    ],
  },
  {
    id: 'classic-nine',
    name: 'Classic Nine',
    panels: [
      rect(0, 0, 1 / 3, 1 / 3), rect(1 / 3, 0, 1 / 3, 1 / 3), rect(2 / 3, 0, 1 / 3, 1 / 3),
      rect(0, 1 / 3, 1 / 3, 1 / 3), rect(1 / 3, 1 / 3, 1 / 3, 1 / 3), rect(2 / 3, 1 / 3, 1 / 3, 1 / 3),
      rect(0, 2 / 3, 1 / 3, 1 / 3), rect(1 / 3, 2 / 3, 1 / 3, 1 / 3), rect(2 / 3, 2 / 3, 1 / 3, 1 / 3),
    ],
  },
  {
    id: 'story-strip',
    name: 'Story Strip',
    panels: [
      rect(0, 0, 1, 0.46),
      rect(0, 0.46, 0.5, 0.27),
      rect(0.5, 0.46, 0.5, 0.27),
      rect(0, 0.73, 1, 0.27),
    ],
  },
  {
    id: 'duo-clash',
    name: 'Duo Clash',
    panels: [
      rect(0, 0, 0.52, 1),
      rect(0.52, 0, 0.48, 0.55),
      rect(0.52, 0.55, 0.48, 0.45),
    ],
  },
  {
    id: 'full-bleed',
    name: 'Full Bleed + Insets',
    panels: [
      rect(0, 0, 1, 1),
      rect(0.03, 0.05, 0.3, 0.3),
      rect(0.67, 0.05, 0.3, 0.3),
    ],
  },
  {
    id: 'mosaic-six',
    name: 'Mosaic Six',
    // Tiles exactly: a three-column top band over a two-block base,
    // with the middle column split into a short and a tall cell.
    panels: [
      rect(0, 0, 0.4, 0.5),
      rect(0.4, 0, 0.3, 0.32),
      rect(0.7, 0, 0.3, 0.5),
      rect(0.4, 0.32, 0.3, 0.18),
      rect(0, 0.5, 0.45, 0.5),
      rect(0.45, 0.5, 0.55, 0.5),
    ],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

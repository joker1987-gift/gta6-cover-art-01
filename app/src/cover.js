// Neon Coast Cover Studio — the cover renderer.
// Pure canvas 2D: panels with cover-fit photos, a shared colour grade,
// print textures and the lettering block. No network, no DOM lookups —
// the editor and the offscreen exporter both call drawCover.

import { seededRandom } from './grades.js';

// Cover-fit geometry for one panel. The photo is scaled so it always
// covers the panel, then positioned by a focal point (0..1 of the real
// overflow on each axis) and a zoom multiplier. Because the offset is a
// fraction of the actual overflow, a photo can never show a gap.
export function coverFit(imgW, imgH, panelW, panelH, focal, zoom) {
  const scale = Math.max(panelW / imgW, panelH / imgH) * zoom;
  const dw = imgW * scale;
  const dh = imgH * scale;
  const overflowX = Math.max(0, dw - panelW);
  const overflowY = Math.max(0, dh - panelH);
  return {
    scale, dw, dh,
    dx: -overflowX * focal.x,
    dy: -overflowY * focal.y,
    overflowX, overflowY,
  };
}

// Smart default framing: bias the crop toward the upper third, where
// faces and subjects usually sit, and keep the subject band clear of the
// lettering block that lives along the bottom of the cover.
export function smartFocal(panel, panelIndex) {
  const bottomRow = panel.y + panel.h > 0.8;
  return {
    x: 0.5,
    y: bottomRow ? 0.18 : 0.3,
    panelIndex,
  };
}

function drawPanel(ctx, img, panel, W, H, panelState, grade) {
  const px = panel.x * W;
  const py = panel.y * H;
  const pw = panel.w * W;
  const ph = panel.h * H;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  if (img) {
    const fit = coverFit(img.naturalWidth || img.width, img.naturalHeight || img.height,
      pw, ph, panelState.focal, panelState.zoom);
    ctx.filter = grade.filter;
    ctx.drawImage(img, px + fit.dx, py + fit.dy, fit.dw, fit.dh);
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = '#1b1035';
    ctx.fillRect(px, py, pw, ph);
  }
  // Grade washes: warm sky from the top, deep shadow from the bottom.
  const sky = ctx.createLinearGradient(0, py, 0, py + ph);
  sky.addColorStop(0, grade.sky);
  sky.addColorStop(0.55, grade.wash);
  sky.addColorStop(1, grade.shadow);
  ctx.fillStyle = sky;
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();
  return { px, py, pw, ph };
}

// ---- print textures (all deterministic) ----

function drawGrain(ctx, W, H, seed) {
  const rand = seededRandom(seed);
  const cell = Math.max(2, Math.round(W / 480));
  ctx.save();
  for (let y = 0; y < H; y += cell) {
    for (let x = 0; x < W; x += cell) {
      const v = rand();
      if (v > 0.62) {
        ctx.fillStyle = v > 0.86 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
        ctx.fillRect(x, y, cell, cell);
      }
    }
  }
  ctx.restore();
}

function drawHalftone(ctx, W, H) {
  // A dot screen that gathers strength toward the lettering band.
  const gap = Math.max(10, Math.round(W / 110));
  const bandTop = H * 0.62;
  ctx.save();
  ctx.fillStyle = 'rgba(10, 4, 24, 0.20)';
  for (let y = bandTop; y < H; y += gap) {
    const t = (y - bandTop) / (H - bandTop);
    for (let x = 0; x < W; x += gap) {
      const r = (gap * 0.22) * (0.4 + t);
      ctx.beginPath();
      ctx.arc(x + gap / 2, y + gap / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawVignette(ctx, W, H) {
  const r = Math.hypot(W, H) * 0.62;
  const g = ctx.createRadialGradient(W / 2, H * 0.42, r * 0.42, W / 2, H * 0.5, r);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(5,2,14,0.52)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawInkEdges(ctx, rects, W) {
  ctx.save();
  ctx.strokeStyle = '#0d0618';
  ctx.lineWidth = Math.max(3, W * 0.006);
  for (const r of rects) ctx.strokeRect(r.px, r.py, r.pw, r.ph);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = Math.max(1, W * 0.0016);
  for (const r of rects) {
    ctx.beginPath();
    ctx.moveTo(r.px, r.py + r.ph);
    ctx.lineTo(r.px, r.py);
    ctx.lineTo(r.px + r.pw, r.py);
    ctx.stroke();
  }
  ctx.restore();
}

// ---- lettering ----

const TITLE_FONT = '"Arial Narrow", "Helvetica Neue", Impact, sans-serif';
const SCRIPT_FONT = '"Segoe Script", "Brush Script MT", "Comic Sans MS", cursive';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLettering(ctx, W, H, text) {
  const u = W / 1000; // scale unit so lettering tracks the export size
  // Bottom shade so the type always sits on a readable ground.
  const shade = ctx.createLinearGradient(0, H * 0.52, 0, H);
  shade.addColorStop(0, 'rgba(8,3,18,0)');
  shade.addColorStop(0.62, 'rgba(8,3,18,0.42)');
  shade.addColorStop(1, 'rgba(8,3,18,0.78)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, H * 0.52, W, H * 0.48);

  // Location pill, top left.
  ctx.save();
  ctx.font = `700 ${Math.round(21 * u)}px ${TITLE_FONT}`;
  const loc = (text.location || '').toUpperCase();
  const pillW = ctx.measureText(loc).width + 44 * u;
  ctx.fillStyle = 'rgba(10,5,22,0.72)';
  roundRect(ctx, 28 * u, 26 * u, pillW, 40 * u, 20 * u);
  ctx.fill();
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 2 * u;
  ctx.stroke();
  ctx.fillStyle = '#ffe9c4';
  ctx.textBaseline = 'middle';
  ctx.fillText(loc, 50 * u, 47 * u);
  ctx.restore();

  drawStars(ctx, W, H, text.stars, u);
  drawBadge(ctx, W, H, u);

  // Script subtitle above the title. A thin dark stroke under the neon
  // glow keeps the script readable where it crosses a bright panel.
  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = `${Math.round(44 * u)}px ${SCRIPT_FONT}`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(18,4,31,0.85)';
  ctx.lineWidth = 5 * u;
  ctx.strokeText(text.subtitle || '', 44 * u, H - 158 * u);
  ctx.fillStyle = '#ffd9ec';
  ctx.shadowColor = 'rgba(255,45,149,0.85)';
  ctx.shadowBlur = 14 * u;
  ctx.fillText(text.subtitle || '', 44 * u, H - 158 * u);
  ctx.restore();

  // The big title: sunset gradient fill, heavy dark outline.
  ctx.save();
  const title = (text.title || '').toUpperCase();
  let size = 118 * u;
  ctx.font = `900 ${Math.round(size)}px ${TITLE_FONT}`;
  const maxW = W - 210 * u;
  while (ctx.measureText(title).width > maxW && size > 30 * u) {
    size -= 6 * u;
    ctx.font = `900 ${Math.round(size)}px ${TITLE_FONT}`;
  }
  const grad = ctx.createLinearGradient(0, H - 150 * u, 0, H - 30 * u);
  grad.addColorStop(0, '#ffe259');
  grad.addColorStop(0.5, '#ff7518');
  grad.addColorStop(1, '#ff2d95');
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#12041f';
  ctx.lineWidth = 13 * u;
  ctx.strokeText(title, 40 * u, H - 42 * u);
  ctx.fillStyle = grad;
  ctx.fillText(title, 40 * u, H - 42 * u);
  ctx.restore();
}

function drawStars(ctx, W, H, count, u) {
  const n = Math.max(0, Math.min(5, count | 0));
  ctx.save();
  ctx.font = `${Math.round(30 * u)}px sans-serif`;
  ctx.textAlign = 'right';
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < n ? '#ffd23f' : 'rgba(255,255,255,0.35)';
    ctx.fillText('★', W - 30 * u - (4 - i) * 34 * u, 52 * u);
  }
  ctx.restore();
}

function drawBadge(ctx, W, H, u) {
  const cx = W - 74 * u;
  const cy = H - 74 * u;
  const r = 52 * u;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#12041f';
  ctx.fill();
  ctx.lineWidth = 4 * u;
  ctx.strokeStyle = '#ffb347';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 9 * u, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,45,149,0.9)';
  ctx.lineWidth = 2 * u;
  ctx.stroke();
  ctx.fillStyle = '#ffe259';
  ctx.font = `900 ${Math.round(44 * u)}px ${TITLE_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VI', cx, cy + 2 * u);
  ctx.restore();
}

// ---- the whole cover ----

export function drawCover(ctx, W, H, state, images) {
  ctx.save();
  ctx.fillStyle = '#0d0618';
  ctx.fillRect(0, 0, W, H);
  const rects = [];
  state.layout.panels.forEach((panel, i) => {
    const ps = state.panels[i] || { focal: { x: 0.5, y: 0.3 }, zoom: 1, photo: i };
    const img = images[ps.photo % Math.max(1, images.length)] || null;
    rects.push(drawPanel(ctx, img, panel, W, H, ps, state.grade));
  });
  if (state.fx.halftone) drawHalftone(ctx, W, H);
  if (state.fx.grain) drawGrain(ctx, W, H, 20261119);
  drawLettering(ctx, W, H, state.text);
  if (state.fx.ink) drawInkEdges(ctx, rects, W);
  if (state.fx.vignette) drawVignette(ctx, W, H);
  // Outer frame.
  ctx.strokeStyle = '#0d0618';
  ctx.lineWidth = Math.max(4, W * 0.008);
  ctx.strokeRect(0, 0, W, H);
  ctx.restore();
}

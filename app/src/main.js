// Neon Coast Cover Studio — editor wiring.
// Owns the state, loads photos (bundled samples first, then anything the
// visitor drops in), renders the live canvas through cover.js and exports
// a full-size PNG offscreen. Everything runs locally; photos never leave
// the machine.

import { LAYOUTS, layoutById } from './layouts.js';
import { GRADES, gradeById } from './grades.js';
import { SIZES, sizeById, sceneFromUrl } from './shots.js';
import { drawCover, smartFocal } from './cover.js';

const SAMPLES = ['samples/boulevard.jpg', 'samples/pier.jpg', 'samples/neon.jpg'];
const MAX_PHOTOS = 6;

const state = {
  layout: LAYOUTS[0],
  grade: GRADES[0],
  size: SIZES[0],
  panels: [],
  fx: { halftone: true, grain: true, vignette: true, ink: true },
  text: {
    title: 'NEON COAST',
    subtitle: 'where the night never pays',
    location: 'PALM BAY',
    stars: 4,
  },
  selected: 0,
};

const images = [];
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

function resetPanels() {
  state.panels = state.layout.panels.map((panel, i) => ({
    photo: images.length ? i % images.length : 0,
    focal: smartFocal(panel, i),
    zoom: 1,
  }));
  state.selected = 0;
}

function render() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const box = canvas.getBoundingClientRect();
  const targetW = Math.max(320, Math.round(box.width * dpr));
  const scale = targetW / state.size.w;
  canvas.width = targetW;
  canvas.height = Math.round(state.size.h * scale);
  drawCover(ctx, canvas.width, canvas.height, state, images);
  drawSelection();
}

function drawSelection() {
  if (document.body.dataset.mode === 'cover') return;
  const panel = state.layout.panels[state.selected];
  if (!panel) return;
  const W = canvas.width;
  const H = canvas.height;
  ctx.save();
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = Math.max(2, W * 0.004);
  ctx.setLineDash([12, 8]);
  ctx.strokeRect(panel.x * W + 3, panel.y * H + 3, panel.w * W - 6, panel.h * H - 6);
  ctx.restore();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSamples() {
  for (const src of SAMPLES) {
    try { images.push(await loadImage(src)); } catch { /* keep going */ }
  }
}

// ---- photo intake: picker + drag and drop ----

async function addPhotoFiles(files) {
  for (const file of files) {
    if (images.length >= MAX_PHOTOS) break;
    if (!file.type.startsWith('image/')) continue;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      images.push(img);
      // Point the selected panel at the photo that just arrived.
      if (state.panels[state.selected]) state.panels[state.selected].photo = images.length - 1;
    } catch { /* skip unreadable files */ }
  }
  render();
}

// ---- panel interaction: select, drag to reposition, wheel to zoom ----

let drag = null;

function canvasPoint(evt) {
  const box = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - box.left) / box.width,
    y: (evt.clientY - box.top) / box.height,
  };
}

function panelAt(pt) {
  const panels = state.layout.panels;
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (pt.x >= p.x && pt.x <= p.x + p.w && pt.y >= p.y && pt.y <= p.y + p.h) return i;
  }
  return -1;
}

canvas.addEventListener('pointerdown', (evt) => {
  const pt = canvasPoint(evt);
  const idx = panelAt(pt);
  if (idx < 0) return;
  state.selected = idx;
  syncPanelControls();
  const ps = state.panels[idx];
  drag = { startX: evt.clientX, startY: evt.clientY, focal: { ...ps.focal } };
  canvas.setPointerCapture(evt.pointerId);
  render();
});

canvas.addEventListener('pointermove', (evt) => {
  if (!drag) return;
  const panel = state.layout.panels[state.selected];
  const ps = state.panels[state.selected];
  const img = images[ps.photo % Math.max(1, images.length)];
  if (!img || !panel) return;
  const box = canvas.getBoundingClientRect();
  // Convert the pointer travel into focal movement using the panel's
  // real overflow, mirroring coverFit so the drag feels 1:1.
  const pw = panel.w * box.width;
  const ph = panel.h * box.height;
  const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * ps.zoom;
  const ox = Math.max(1, img.naturalWidth * scale - pw);
  const oy = Math.max(1, img.naturalHeight * scale - ph);
  ps.focal.x = clamp01(drag.focal.x - (evt.clientX - drag.startX) / ox);
  ps.focal.y = clamp01(drag.focal.y - (evt.clientY - drag.startY) / oy);
  render();
});

canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (evt) => {
  evt.preventDefault();
  const ps = state.panels[state.selected];
  if (!ps) return;
  ps.zoom = Math.min(3, Math.max(1, ps.zoom * (evt.deltaY < 0 ? 1.08 : 0.93)));
  syncPanelControls();
  render();
}, { passive: false });

function clamp01(v) { return Math.min(1, Math.max(0, v)); }

// Arrow keys nudge the selected panel's framing a step at a time —
// finer control than dragging when a face sits near the title block.
window.addEventListener('keydown', (evt) => {
  // Never steal arrows from a text field or slider being edited.
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  const step = 0.04;
  const ps = state.panels[state.selected];
  if (!ps) return;
  if (evt.key === 'ArrowLeft') ps.focal.x = clamp01(ps.focal.x - step);
  else if (evt.key === 'ArrowRight') ps.focal.x = clamp01(ps.focal.x + step);
  else if (evt.key === 'ArrowUp') ps.focal.y = clamp01(ps.focal.y - step);
  else if (evt.key === 'ArrowDown') ps.focal.y = clamp01(ps.focal.y + step);
  else return;
  evt.preventDefault();
  render();
});

// ---- controls ----

const $ = (id) => document.getElementById(id);

function buildChips(container, items, currentId, onPick) {
  container.innerHTML = '';
  items.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (item.id === currentId ? ' on' : '');
    b.textContent = item.name || item.label;
    b.addEventListener('click', () => onPick(item));
    container.appendChild(b);
  });
}

function refreshChips() {
  buildChips($('layoutChips'), LAYOUTS, state.layout.id, (item) => {
    state.layout = item;
    resetPanels();
    refreshChips();
    render();
  });
  buildChips($('gradeChips'), GRADES, state.grade.id, (item) => {
    state.grade = item;
    refreshChips();
    render();
  });
  buildChips($('sizeChips'), SIZES, state.size.id, (item) => {
    state.size = item;
    refreshChips();
    render();
  });
}

function syncPanelControls() {
  const ps = state.panels[state.selected];
  if (!ps) return;
  $('zoomRange').value = String(Math.round(ps.zoom * 100));
  $('panelLabel').textContent =
    `Panel ${state.selected + 1} of ${state.layout.panels.length} — photo ${ps.photo + 1}`;
}

function bindControls() {
  $('fileInput').addEventListener('change', (e) => addPhotoFiles([...e.target.files]));
  const drop = $('dropZone');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('hot'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('hot'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('hot');
    addPhotoFiles([...e.dataTransfer.files]);
  });
  $('titleInput').addEventListener('input', (e) => { state.text.title = e.target.value; render(); });
  $('subtitleInput').addEventListener('input', (e) => { state.text.subtitle = e.target.value; render(); });
  $('locationInput').addEventListener('input', (e) => { state.text.location = e.target.value; render(); });
  $('starsRange').addEventListener('input', (e) => { state.text.stars = Number(e.target.value); render(); });
  $('zoomRange').addEventListener('input', (e) => {
    const ps = state.panels[state.selected];
    if (ps) { ps.zoom = Number(e.target.value) / 100; render(); }
  });
  $('cyclePhoto').addEventListener('click', () => {
    const ps = state.panels[state.selected];
    if (ps && images.length) {
      ps.photo = (ps.photo + 1) % images.length;
      syncPanelControls();
      render();
    }
  });
  for (const key of ['halftone', 'grain', 'vignette', 'ink']) {
    $(`fx-${key}`).addEventListener('change', (e) => { state.fx[key] = e.target.checked; render(); });
  }
  $('exportBtn').addEventListener('click', exportPng);
  window.addEventListener('resize', render);
}

// ---- export: render offscreen at full size, download a real PNG ----

function exportPng() {
  const off = document.createElement('canvas');
  off.width = state.size.w;
  off.height = state.size.h;
  drawCover(off.getContext('2d'), off.width, off.height, state, images);
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-cover-${state.size.w}x${state.size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
}

// ---- boot: samples, scene overrides, first paint ----

async function boot() {
  bindControls();
  await loadSamples();
  const scene = sceneFromUrl(window.location.href);
  if (scene) {
    state.layout = layoutById(scene.layoutId);
    state.grade = gradeById(scene.gradeId);
    state.size = sizeById(scene.sizeId);
    document.body.dataset.mode = scene.mode;
    if (scene.mode === 'cover') document.body.classList.add('shot-cover');
  } else {
    document.body.dataset.mode = 'editor';
  }
  resetPanels();
  refreshChips();
  syncPanelControls();
  render();
  // A second paint after fonts settle keeps captures deterministic.
  requestAnimationFrame(() => {
    render();
    document.body.dataset.ready = '1';
  });
}

boot();

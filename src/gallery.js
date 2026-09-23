import './gallery.css';
import {ROOMS, initialLayout} from './data.js';
import {loadLayout} from './model.js';

const $ = selector => document.querySelector(selector);
const gallery = $('#gallery');
const lightbox = $('#lightbox');
const params = new URLSearchParams(location.search);
const descriptions = {
  living: 'Дулаан модон өнгө, зөөлөн эдлэл, байгалийн гэрэлтэй гэр бүлийн амрах орчин.',
  kitchen: 'Хоол бэлтгэх, хамтдаа суух орчныг нэг хэв маягаар холбосон интерьерийн санал.',
  guest: 'Тайван өнгө, модон материалтай тухтай унтлагын өрөөний санал.',
  bath1: 'Цайвар өнгө, зөөлөн гэрэлтүүлэгтэй угаалгын өрөөний интерьер.',
  utility: 'Техникийн өрөөний цэвэрхэн, эмх цэгцтэй орчны санал.',
  hall1: 'Үүднээс гэрийн бусад хэсэгт үргэлжлэх дулаан, энгийн өнгө төрх.',
  stairs1: 'Давхруудыг холбох шатны хэсгийн материал, гэрэлтүүлгийн санал.',
  terrace: 'Гадаа амарч, хамтдаа цаг өнгөрөөх террасын тохижилт.',
  master: 'Тайван уур амьсгал, дулаан модон өнгөтэй эцэг эхийн унтлагын өрөө.',
  kids: 'Хоёр хүүхдийн амрах, суралцах орчны интерьерийн санал.',
  child: 'Нэг хүүхдийн өрөөний авсаархан, тухтай тохижилтын санал.',
  bath2: 'Хоёрдугаар давхрын ариун цэврийн өрөөний материал, гэрэлтүүлгийн санал.',
  hall2: 'Унтлагын өрөөнүүдийг холбох тайван, дулаан өнгөтэй хонгил.',
  stairs2: 'Дээд давхрын шатны хэсгийн нэгдмэл өнгө, материалын шийдэл.',
  balcony: 'Гадаах орчныг мэдрэх, амарч суух тагтны тохижилт.',
};
const rooms = ROOMS.map(room => ({...room, description: descriptions[room.id]}));
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
const photoPath = (room, thumbnail = false) => `./renders/imagegen/${room.id}${thumbnail ? '-thumb' : ''}.webp`;
let mode = params.get('mode') === '3d' ? '3d' : 'photo';
let floor = 'all';
let perspective = 'inside';
let layoutChoice = params.get('layout') === 'base' ? 'base' : 'saved';
let currentId = null;
let openingButton = null;
let renderVersion = 0;
let modalVersion = 0;
let storage;
try { storage = localStorage; } catch { storage = {getItem: () => null}; }
const layouts = {base: initialLayout(), saved: loadLayout(storage)};
const imageCache = new Map();
const inflight = new Map();
let engine;
let queue = Promise.resolve();
const cacheKey = room => `${layoutChoice}/${perspective}/${room.id}`;
const imagePath = room => mode === 'photo' ? photoPath(room) : imageCache.get(cacheKey(room)) || '';
const downloadName = room => `selbe-${room.id}.${mode === 'photo' ? 'webp' : 'png'}`;
const visibleRooms = () => rooms.filter(room => floor === 'all' || room.floor === Number(floor));

function ensureImage(room) {
  if (mode === 'photo') return Promise.resolve(photoPath(room));
  const key = cacheKey(room), view = perspective, layout = layouts[layoutChoice];
  if (imageCache.has(key)) return Promise.resolve(imageCache.get(key));
  if (inflight.has(key)) return inflight.get(key);
  const pending = queue.then(async () => {
    await new Promise(resolve => requestAnimationFrame(resolve));
    if (!engine) {
      const {PlannerScene} = await import('./scene.js');
      engine = new PlannerScene($('#render-engine'), {}, {animate: false});
    }
    const src = engine.renderRoom(room.id, layout, view);
    imageCache.set(key, src);
    return src;
  });
  queue = pending.catch(() => {});
  inflight.set(key, pending);
  pending.finally(() => inflight.delete(key)).catch(() => {});
  return pending;
}

async function fillImages() {
  if (mode !== '3d') return;
  const version = renderVersion;
  const requested = new URLSearchParams(location.search).get('room');
  const list = visibleRooms().sort((a, b) => Number(b.id === requested) - Number(a.id === requested));
  for (const room of list) {
    if (version !== renderVersion) return;
    try {
      const src = await ensureImage(room);
      if (version !== renderVersion) return;
      const img = gallery.querySelector(`[data-open="${room.id}"] img`);
      if (img) img.src = src;
      const link = gallery.querySelector(`[data-download="${room.id}"]`);
      if (link) { link.href = src; link.removeAttribute('aria-disabled'); }
    } catch (error) {
      if (version !== renderVersion) return;
      $('#render-status').textContent = 'Энэ хөтөчид 3D харагдац үүссэнгүй. Интерьерийн зургуудыг үзэх боломжтой.';
      $('#render-status').hidden = false;
      console.error(error);
      return;
    }
  }
}

function renderGallery() {
  renderVersion++;
  const filtered = visibleRooms();
  const isPhoto = mode === 'photo';
  $('#result-count').textContent = `${filtered.length} зураг`;
  $('#live-controls').hidden = isPhoto;
  $('#render-status').hidden = true;
  $('#mode-description').textContent = isPhoto
    ? 'Өрөө тус бүрийн материал, гэрэлтүүлэг, уур амьсгалыг нэг зурагт.'
    : 'Энэ төхөөрөмжид хадгалсан тавилгын байрлал, өнгийг 3D загвараас харна.';
  document.querySelectorAll('[data-mode]').forEach(button => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  gallery.innerHTML = [0, 1].filter(index => floor === 'all' || index === Number(floor)).map(index => {
    const list = filtered.filter(room => room.floor === index);
    return `<section class="floor-section" aria-labelledby="floor-${index}"><div class="floor-heading"><h2 id="floor-${index}">${index + 1}-р давхар</h2><span>${list.length} өрөө, хэсэг</span></div><div class="room-grid">${list.map((room, roomIndex) => {
      const src = imagePath(room);
      const imageAttributes = isPhoto
        ? `src="${photoPath(room, true)}" srcset="${photoPath(room, true)} 768w, ${photoPath(room)} 1536w" sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 900px) calc((100vw - 69px) / 2), 400px"`
        : src ? `src="${src}"` : '';
      return `<article class="room-card"><button class="room-image-button" data-open="${room.id}" aria-label="${escapeHtml(room.name)} — ${index + 1}-р давхар, зургийг томруулж үзэх"><img ${imageAttributes} alt="${escapeHtml(room.name)}: ${isPhoto ? 'интерьерийн зураг' : '3D төлөвлөлт'}" width="1536" height="1024" loading="${index === 0 && roomIndex < 3 ? 'eager' : 'lazy'}" decoding="async" /><span class="room-number">${String(rooms.indexOf(room) + 1).padStart(2, '0')}</span><span class="open-mark" aria-hidden="true">↗</span></button><div class="card-caption"><div class="card-copy"><h3>${escapeHtml(room.name)}</h3><div class="card-meta"><span>${room.area.toFixed(2)} м²</span><span aria-hidden="true">·</span><span>${escapeHtml(room.tag)}</span></div></div><a class="card-download" data-download="${room.id}" href="${src || '#'}" ${src ? '' : 'aria-disabled="true"'} download="${downloadName(room)}" aria-label="${escapeHtml(room.name)} — ${index + 1}-р давхар, зураг татах" title="Зураг татах">↓</a></div></article>`;
    }).join('')}</div></section>`;
  }).join('');
  gallery.querySelectorAll('img').forEach(image => {
    image.addEventListener('error', () => {
      image.hidden = true;
      const message = document.createElement('span');
      message.className = 'image-unavailable';
      message.textContent = 'Зургийг ачаалж чадсангүй';
      image.parentElement.append(message);
    }, {once: true});
  });
  document.querySelectorAll('[data-floor]').forEach(button => {
    const active = button.dataset.floor === floor;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function setQuery(name, value) {
  const url = new URL(location.href);
  if (value === null) url.searchParams.delete(name);
  else url.searchParams.set(name, value);
  history.replaceState(null, '', url);
}

async function showRoom(id, opener = null) {
  const room = rooms.find(item => item.id === id);
  if (!room) return;
  if (opener) openingButton = opener;
  currentId = room.id;
  const version = ++modalVersion;
  const filtered = visibleRooms();
  const index = filtered.findIndex(item => item.id === id);
  $('#render-counter').textContent = `${String(index + 1).padStart(2, '0')} / ${String(filtered.length).padStart(2, '0')} · СЭЛБЭ`;
  $('#render-meta').textContent = `${room.floor + 1}-Р ДАВХАР / ${room.area.toFixed(2)} М² / ${mode === 'photo' ? 'ИНТЕРЬЕРИЙН ЗУРАГ' : '3D ТӨЛӨВЛӨЛТ'}`;
  $('#render-title').textContent = room.name;
  $('#render-description').textContent = mode === 'photo' ? room.description : 'Сонгосон төлөвлөлтийн тавилга, өнгө, материалтай 3D харагдац.';
  const image = $('#render-image');
  const download = $('#download-render');
  image.hidden = true;
  image.removeAttribute('src');
  image.alt = `${room.name}: ${mode === 'photo' ? room.description : '3D төлөвлөлт'}`;
  $('#image-error').hidden = true;
  $('#image-loading').hidden = false;
  download.removeAttribute('href');
  download.setAttribute('aria-disabled', 'true');
  $('#previous-render').disabled = filtered.length < 2;
  $('#next-render').disabled = filtered.length < 2;
  if (!lightbox.open) lightbox.showModal();
  setQuery('room', id);
  try {
    const src = await ensureImage(room);
    if (version !== modalVersion) return;
    image.src = src;
    image.hidden = false;
    download.href = src;
    download.download = downloadName(room);
    download.removeAttribute('aria-disabled');
  } catch (error) {
    if (version !== modalVersion) return;
    $('#image-loading').hidden = true;
    $('#image-error').hidden = false;
    $('#image-error').textContent = '3D харагдац үүссэнгүй. Интерьерийн зураг горимоор үзээрэй.';
    console.error(error);
  }
}

function refresh() {
  renderGallery();
  fillImages();
  if (lightbox.open && currentId) showRoom(currentId);
}

function step(direction) {
  const filtered = visibleRooms();
  const index = filtered.findIndex(room => room.id === currentId);
  if (filtered.length) showRoom(filtered[(index + direction + filtered.length) % filtered.length].id);
}

gallery.addEventListener('click', event => {
  if (event.target.closest('[aria-disabled="true"]')) event.preventDefault();
  const button = event.target.closest('[data-open]');
  if (button) showRoom(button.dataset.open, button);
});
document.querySelectorAll('[data-floor]').forEach(button => button.addEventListener('click', () => {
  floor = button.dataset.floor;
  refresh();
}));
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  mode = button.dataset.mode;
  setQuery('mode', mode === '3d' ? '3d' : null);
  setQuery('layout', mode === '3d' ? layoutChoice : null);
  refresh();
}));
$('#layout-choice').value = layoutChoice;
$('#layout-choice').addEventListener('change', event => {
  layoutChoice = event.target.value;
  setQuery('layout', layoutChoice);
  refresh();
});
$('#perspective-choice').addEventListener('change', event => {
  perspective = event.target.value;
  refresh();
});
$('#close-render').addEventListener('click', () => lightbox.close());
$('#previous-render').addEventListener('click', () => step(-1));
$('#next-render').addEventListener('click', () => step(1));
lightbox.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    step(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
lightbox.addEventListener('click', event => {
  if (event.target !== lightbox) return;
  const rect = lightbox.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) lightbox.close();
});
lightbox.addEventListener('close', () => {
  modalVersion++;
  currentId = null;
  setQuery('room', null);
  openingButton?.focus({preventScroll: true});
  openingButton = null;
});
$('#render-image').addEventListener('load', () => { $('#image-loading').hidden = true; });
$('#render-image').addEventListener('error', () => {
  $('#render-image').hidden = true;
  $('#image-loading').hidden = true;
  $('#image-error').textContent = 'Зургийг ачаалж чадсангүй. Дахин ачаалаад үзээрэй.';
  $('#image-error').hidden = false;
  $('#download-render').removeAttribute('href');
  $('#download-render').setAttribute('aria-disabled', 'true');
});
$('#download-render').addEventListener('click', event => {
  if (event.currentTarget.getAttribute('aria-disabled') === 'true') event.preventDefault();
});
refresh();
if (rooms.some(room => room.id === params.get('room'))) showRoom(params.get('room'));
window.addEventListener('pagehide', () => engine?.dispose());

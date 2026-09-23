const $ = selector => document.querySelector(selector);
const gallery = $('#gallery');
const lightbox = $('#lightbox');
let rooms = [];
let floor = 'all';
let currentId = null;
let openingButton = null;
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const imagePath = room => `./renders/${room.id}.png`;
const visibleRooms = () => rooms.filter(room => floor === 'all' || room.floor === Number(floor));

function renderGallery() {
  const filtered = visibleRooms();
  $('#result-count').textContent = `${filtered.length} зураг`;
  gallery.innerHTML = [0, 1].filter(index => floor === 'all' || index === Number(floor)).map(index => {
    const list = filtered.filter(room => room.floor === index);
    return `<section class="floor-section" aria-labelledby="floor-${index}"><div class="floor-heading"><h2 id="floor-${index}">${index + 1}-р давхар</h2><span>${list.length} өрөө, хэсэг</span></div><div class="room-grid">${list.map(room => `<article class="room-card"><button class="room-image-button" data-open="${room.id}" aria-label="${escapeHtml(room.name)} — рендерийг томруулж үзэх"><img src="${imagePath(room)}" alt="${escapeHtml(room.name)}: интерьерийн концепц рендер" width="1536" height="1024" loading="lazy" decoding="async" /><span class="room-number">${String(rooms.indexOf(room) + 1).padStart(2, '0')}</span><span class="open-mark" aria-hidden="true">↗</span></button><div class="card-caption"><div class="card-copy"><h3>${escapeHtml(room.name)}</h3><div class="card-meta"><span>${room.area.toFixed(2)} м²</span><span aria-hidden="true">·</span><span>${escapeHtml(room.tag)}</span></div></div><a class="card-download" href="${imagePath(room)}" download="selbe-${room.id}.png" aria-label="${escapeHtml(room.name)} — зураг татах" title="Зураг татах">↓</a></div></article>`).join('')}</div></section>`;
  }).join('');
  gallery.querySelectorAll('img').forEach(image => {
    image.addEventListener('error', () => {
      image.hidden = true;
      const message = document.createElement('span');
      message.className = 'image-unavailable';
      message.textContent = 'Зургийг ачаалж чадсангүй';
      image.parentElement.append(message);
    }, {once:true});
  });
  document.querySelectorAll('[data-floor]').forEach(button => {
    const active = button.dataset.floor === floor;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function showRoom(id, opener = null) {
  const room = rooms.find(room => room.id === id);
  if (!room) return;
  if (opener) openingButton = opener;
  currentId = room.id;
  const filtered = visibleRooms();
  const index = filtered.findIndex(item => item.id === id);
  $('#render-counter').textContent = `${String(index + 1).padStart(2, '0')} / ${String(filtered.length).padStart(2, '0')} · СЭЛБЭ`;
  $('#render-meta').textContent = `${room.floor + 1}-Р ДАВХАР / ${room.area.toFixed(2)} М² / AI КОНЦЕПЦ`;
  $('#render-title').textContent = room.name;
  $('#render-description').textContent = room.description;
  const image = $('#render-image');
  image.hidden = false;
  $('#image-error').hidden = true;
  image.alt = `${room.name}: ${room.description}`;
  image.src = imagePath(room);
  $('#download-render').href = imagePath(room);
  $('#download-render').download = `selbe-${room.id}.png`;
  $('#previous-render').disabled = filtered.length < 2;
  $('#next-render').disabled = filtered.length < 2;
  if (!lightbox.open) lightbox.showModal();
  const url = new URL(location.href);
  url.searchParams.set('room', id);
  history.replaceState(null, '', url);
}

function step(direction) {
  const filtered = visibleRooms();
  const index = filtered.findIndex(room => room.id === currentId);
  if (!filtered.length) return;
  showRoom(filtered[(index + direction + filtered.length) % filtered.length].id);
}

gallery.addEventListener('click', event => {
  const button = event.target.closest('[data-open]');
  if (button) showRoom(button.dataset.open, button);
});
document.querySelectorAll('[data-floor]').forEach(button => button.addEventListener('click', () => {
  floor = button.dataset.floor;
  renderGallery();
}));
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
  const url = new URL(location.href);
  url.searchParams.delete('room');
  history.replaceState(null, '', url);
  openingButton?.focus({preventScroll:true});
  openingButton = null;
});
$('#render-image').addEventListener('error', () => {
  $('#render-image').hidden = true;
  $('#image-error').hidden = false;
});

try {
  const response = await fetch('./renders/rooms.json');
  if (!response.ok) throw new Error('Room metadata unavailable');
  rooms = await response.json();
  renderGallery();
  const requestedRoom = new URLSearchParams(location.search).get('room');
  if (rooms.some(room => room.id === requestedRoom)) showRoom(requestedRoom);
} catch (error) {
  gallery.innerHTML = '<p class="load-error">Галерейг ачаалж чадсангүй. Хуудсаа дахин ачаалаад үзээрэй.</p>';
  $('#result-count').textContent = '';
  console.error(error);
}

import './gallery.css';
import {ROOMS,initialLayout} from './data.js';
import {loadLayout} from './model.js';
import {PlannerScene} from './scene.js';
const $ = selector => document.querySelector(selector);
const gallery = $('#gallery');
const lightbox = $('#lightbox');
let rooms = [];
let floor = 'all';
let currentId = null;
let openingButton = null;
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const imageCache=new Map(),inflight=new Map();
let perspective='inside',layoutChoice=new URLSearchParams(location.search).get('layout')==='saved'?'saved':'base';
let storage;try{storage=localStorage;}catch{storage={getItem:()=>null};}
const layouts={base:initialLayout(),saved:loadLayout(storage)};
let engine,queue=Promise.resolve();
const cacheKey=room=>`${layoutChoice}/${perspective}/${room.id}`;
const imagePath=room=>imageCache.get(cacheKey(room))||'';
function ensureImage(room){
 const key=cacheKey(room),view=perspective,layout=layouts[layoutChoice];
 if(imageCache.has(key))return Promise.resolve(imageCache.get(key));
 if(inflight.has(key))return inflight.get(key);
 const pending=queue.then(async()=>{
  await new Promise(resolve=>requestAnimationFrame(resolve));
  if(!engine)engine=new PlannerScene($('#render-engine'),{},{animate:false});
  const url=engine.renderRoom(room.id,layout,view);imageCache.set(key,url);return url;
 });
 queue=pending.catch(()=>{});inflight.set(key,pending);return pending;
}
async function fillImages(){
 const requested=new URLSearchParams(location.search).get('room');
 const list=[...rooms].sort((a,b)=>Number(b.id===requested)-Number(a.id===requested));
 const selection=`${layoutChoice}/${perspective}`;
 for(const room of list){
  try{const src=await ensureImage(room);if(selection!==`${layoutChoice}/${perspective}`)return;
   const img=gallery.querySelector(`[data-open="${room.id}"] img`);if(img){img.src=src;img.alt=`${room.name}: шинэчилсэн 3D загварын рендер`;}
   const link=gallery.querySelector(`[data-download="${room.id}"]`);if(link){link.href=src;link.removeAttribute('aria-disabled');}
  }catch(error){console.error(error);const img=gallery.querySelector(`[data-open="${room.id}"] img`);if(img)img.alt='WebGL дүрслэл үүссэнгүй';}
 }
}
const visibleRooms = () => rooms.filter(room => floor === 'all' || room.floor === Number(floor));

function renderGallery() {
  const filtered = visibleRooms();
  $('#result-count').textContent = `${filtered.length} зураг`;
  gallery.innerHTML = [0, 1].filter(index => floor === 'all' || index === Number(floor)).map(index => {
    const list = filtered.filter(room => room.floor === index);
    return `<section class="floor-section" aria-labelledby="floor-${index}"><div class="floor-heading"><h2 id="floor-${index}">${index + 1}-р давхар</h2><span>${list.length} өрөө, хэсэг</span></div><div class="room-grid">${list.map(room => `<article class="room-card"><button class="room-image-button" data-open="${room.id}" aria-label="${escapeHtml(room.name)} — рендерийг томруулж үзэх"><img ${imagePath(room)?`src="${imagePath(room)}"`:""} alt="${escapeHtml(room.name)}: 3D загварын рендер" width="1536" height="1024" loading="lazy" decoding="async" /><span class="room-number">${String(rooms.indexOf(room) + 1).padStart(2, '0')}</span><span class="open-mark" aria-hidden="true">↗</span></button><div class="card-caption"><div class="card-copy"><h3>${escapeHtml(room.name)}</h3><div class="card-meta"><span>${room.area.toFixed(2)} м²</span><span aria-hidden="true">·</span><span>${escapeHtml(room.tag)}</span></div></div><a class="card-download" data-download="${room.id}" href="${imagePath(room)||'#'}" ${imagePath(room)?'':'aria-disabled="true"'} download="selbe-${room.id}.png" aria-label="${escapeHtml(room.name)} — зураг татах" title="Зураг татах">↓</a></div></article>`).join('')}</div></section>`;
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

async function showRoom(id, opener = null) {
  const room = rooms.find(room => room.id === id);
  if (!room) return;
  if (opener) openingButton = opener;
  currentId = room.id;
  const filtered = visibleRooms();
  const index = filtered.findIndex(item => item.id === id);
  $('#render-counter').textContent = `${String(index + 1).padStart(2, '0')} / ${String(filtered.length).padStart(2, '0')} · СЭЛБЭ`;
  $('#render-meta').textContent = `${room.floor + 1}-Р ДАВХАР / ${room.area.toFixed(2)} М² / 3D РЕНДЕР`;
  $('#render-title').textContent = room.name;
  $('#render-description').textContent = room.description;
  const image = $('#render-image');
  image.hidden = false;
  $('#image-error').hidden = true;
  image.alt = `${room.name}: ${room.description}`;
  image.removeAttribute('src');
  try{const src=await ensureImage(room);if(currentId!==id)return;image.src=src;}catch(error){$('#image-error').hidden=false;console.error(error);return;}
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
  renderGallery();fillImages();
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

const descriptions={living:'БА-1: доод цонхны талд буйдан, зүүн хананд ТВ, дөрвөн кресло, хоёр дугуй ширээ. Ц-1 ба Ц-6.',kitchen:'БА-1: 8 суудалтай ширээ, шулуун гал тогоо; Ц-2, Ц-4 ба тусдаа гадагш гарах хаалга.',guest:'БА-1: орны толгой дээд хананд, ширээ дээд баруун хэсэгт. Ц-4: 1500×1800 мм-ийг фасад/түүврээр авсан.',utility:'БА-19: резинэн будагтай шал. Төхөөрөмжийн байрлал эх архитектурын зурагт тодорхойгүй тул тоноглоогүй.',stairs1:'БА-17: 300 мм гишгүүр, 150 мм өргөлт, шилэн хашлага. Ц-3: 1200×4000 мм, давхар дамнасан нээлхий.',stairs2:'БА-17: +3.00 м дээд тавцан, хоёр марш, шилэн хашлага; Ц-3-ийн дээд хэсэг.',terrace:'БА-18: чулуун шал, WPC хашлага. Талбайн 57.92/56.65 м² зөрүү шийдэгдээгүй.',balcony:'Керамик шал, шилэн хашлага. ГШХ-1 нүх 2400×2400 мм; рамны хүснэгт зөрчилтэй.',bath1:'БА-3/16: ванн дээд хананд, угаалтуур ба суултуур зүүн талд; Ц-5.',bath2:'БА-4: ванн дээд хананд, угаалтуур ба суултуур баруун талд; Ц-5.',master:'L хэлбэрийн мастер өрөө. Ц-2, Ц-4, Ц-7, ГШХ-1. Тавилга: санал болгосон байрлал.',kids:'Ц-4 босоо цонх. Хоёр орны тавилга нь санал; PDF-д ердийн унтлагын өрөө гэж нэрлэсэн.',child:'Ц-4 босоо цонхтой нарийн унтлагын өрөө. Тавилга: санал болгосон байрлал.',hall1:'Үүд, шат, гал тогоо, угаалгын болон унтлагын өрөөг холбох хэсэг. ГХ-2 өндөр 2800 мм нь огтлолд тулгуурласан түр суурь.',hall2:'БА-4: гурван унтлагын өрөө, угаалгын өрөө болон шатны холбоос.'};
rooms=ROOMS.map(r=>({...r,description:descriptions[r.id]}));
$('#layout-choice').value=layoutChoice;
$('#layout-choice').onchange=e=>{layoutChoice=e.target.value;const url=new URL(location.href);url.searchParams.set('layout',layoutChoice);history.replaceState(null,'',url);renderGallery();fillImages();};
$('#perspective-choice').onchange=e=>{perspective=e.target.value;renderGallery();fillImages();};
gallery.addEventListener('click',e=>{if(e.target.closest('[aria-disabled="true"]'))e.preventDefault();});
renderGallery();fillImages();
const requestedRoom=new URLSearchParams(location.search).get('room');
if(rooms.some(r=>r.id===requestedRoom))showRoom(requestedRoom);
window.addEventListener('pagehide',()=>engine?.dispose());

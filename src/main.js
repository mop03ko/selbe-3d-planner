import './style.css';
import {ROOMS,THEMES,CATALOG,initialLayout} from './data.js';
import {loadLayout,STORE_KEY,History,validateLayout,itemWarnings,pointInPoly} from './model.js';
import {PlannerScene} from './scene.js';

const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={cube:'M12 3 3 8v9l9 5 9-5V8L12 3Zm0 10L3 8m9 5 9-5m-9 5v9',plus:'M12 5v14M5 12h14',undo:'M9 5 4 10l5 5M4 10h10a6 6 0 0 1 6 6v3',redo:'m15 5 5 5-5 5m5-5H10a6 6 0 0 0-6 6v3',download:'M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5',upload:'M12 16V4m-4 4 4-4 4 4M4 16v5h16v-5',camera:'M8 6 9 3h6l1 3h5v15H3V6h5Zm8 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z',rotate:'M20 9a8 8 0 1 0 0 7m0-13v6h-6',trash:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',copy:'M8 8h13v13H8V8ZM16 8V3H3v13h5',move:'M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4m12-8 4 4-4 4',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z',lock:'M6 10h12v11H6V10Zm2 0V6a4 4 0 0 1 8 0v4',home:'m3 11 9-8 9 8M5 9v12h14V9M9 21v-8h6v8',menu:'M4 6h16M4 12h16M4 18h16',close:'m6 6 12 12M6 18 18 6',help:'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4m0 3v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',palette:'M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 1-4c-1-1 0-3 2-3h2a3 3 0 0 0 3-3 9 9 0 0 0-10-8ZM7 9h.01M11 6h.01m5 2h.01M6 14h.01',sofa:'M5 12V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5M3 12h18v7H3v-7Zm2 7v2m14-2v2M3 12V9m18 3V9',grid:'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7',arrow:'m9 5 7 7-7 7',check:'m5 12 4 4L19 6',save:'M5 3h13l3 3v15H3V3h2Zm2 0v7h10V3M7 21v-7h10v7',sun:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z'};
function icon(name,cls=''){return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.cube}"/></svg>`;}
function iconButton(id,name,label,extra=''){return `<button id="${id}" class="icon-button" title="${label}" aria-label="${label}" ${extra}>${icon(name)}</button>`;}
let storage;try{storage=window.localStorage;if(import.meta.env.DEV&&new URLSearchParams(location.search).has('qa')){const memory=new Map();storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};}}catch{storage={getItem:()=>null,setItem:()=>{throw Error('storage unavailable');}};}
let layout=loadLayout(storage),history=new History(layout),floor=0,room='all',selected=null,tab='furniture',scene;
let toastTimer,saveTimer;
$('#app').innerHTML=`
<header class="topbar">
 <div class="brand"><span class="brand-mark">${icon('cube')}</span><div><strong>СЭЛБЭ<span class="brand-dot">.</span></strong><span class="brand-sub">ОРОН ЗАЙН СТУДИ</span></div></div>
 <div class="project-title">Гэр бүлийн сууц <span>4–6 хүн</span></div>
 <div class="top-actions"><span id="save-status">Төхөөрөмждөө хадгална</span>${iconButton('undo','undo','Буцаах (Ctrl+Z)')}${iconButton('redo','redo','Дахин хийх (Ctrl+Shift+Z)')}<span class="divider"></span>${iconButton('import','upload','Хувилбар оруулах')}${iconButton('export','download','Хувилбар татах')}<button class="primary compact" id="save">${icon('save')}<span>Хадгалах</span></button></div>
</header>
<main class="workspace">
 <aside class="left-panel" aria-label="Давхар ба өрөөнүүд">
  <div class="panel-heading"><div><span class="eyebrow">ТАНЫ СУУЦ</span><h1>Өрөөнүүд</h1></div><span class="count-pill">2 давхар</span></div>
  <div class="floor-tabs" role="group" aria-label="Давхар"><button data-floor="0" class="active">1-р давхар</button><button data-floor="1">2-р давхар</button></div>
  <div class="floor-summary"><span id="floor-area">97.81 м²</span><span>дотор талбай</span></div>
  <nav id="room-list" class="room-list" aria-label="Өрөө сонгох"></nav>
  <div class="left-bottom"><a href="./renders.html" class="render-gallery-link">${icon('camera')}<span>Өрөөний рендерүүд<small>15 өрөө, хэсгийн интерьер</small></span>${icon('arrow')}</a><button id="inspiration" class="inspiration-button">${icon('palette')}<span>Интерьерийн санаанууд</span>${icon('arrow')}</button><button id="mobile-import" class="quiet mobile-import">${icon('upload')}Хувилбар оруулах</button><button id="guide" class="quiet">${icon('help')}Хэрхэн ашиглах вэ?</button><button id="source" class="source-note">Эх зурагт суурилсан концепц ${icon('arrow')}</button></div>
 </aside>
 <section class="stage" aria-label="3D ажлын талбар">
  <div id="viewport"></div>
  <div class="stage-top"><div class="view-tabs" role="group" aria-label="Харагдац"><button data-view="3d" class="active">${icon('cube')}3D</button><button data-view="top">${icon('grid')}Дээрээс</button><button data-view="inside">${icon('eye')}Дотор</button></div><button id="wall-toggle" class="floating-button">${icon('home')}<span>Бүтэн хана</span></button></div>
  <div class="scene-caption"><span class="eyebrow">СЭЛБЭ / <span id="floor-caption">01</span></span><h2 id="scene-title">Нэгдүгээр давхар</h2><span id="scene-meta">Бүх өрөөний зохион байгуулалт</span><a id="room-render-link" class="room-render-link" href="./renders.html" hidden>${icon('camera')}Энэ өрөөний рендер ${icon('arrow')}</a></div>
  <div class="stage-tools"><button id="mode-move" class="tool active" title="Тавилга зөөх" aria-label="Тавилга зөөх">${icon('move')}</button><button id="mode-orbit" class="tool" title="Эргүүлж харах" aria-label="Эргүүлж харах">${icon('eye')}</button><span></span>${iconButton('zoom-in','plus','Ойртуулах')}<button id="zoom-out" class="icon-button" aria-label="Холдуулах" title="Холдуулах">−</button>${iconButton('home-view','home','Бүх давхрыг харах')}${iconButton('capture','camera','Зураг татах')}</div>
  <div class="stage-bottom"><span class="interaction-hint">${icon('move')}Тавилга дээр дарж чирнэ · Хоосон зайг чирж эргүүлнэ</span><label class="snap-control"><input id="snap" type="checkbox" checked/>5 см алхам</label></div>
  <div id="loading" class="loading">${icon('cube')}<span>Сууцыг бэлдэж байна…</span></div>
 </section>
 <aside class="right-panel" aria-label="Тавилга ба заслын тохиргоо"><div class="editor-tabs" role="tablist"><button data-tab="furniture" role="tab" class="active">${icon('sofa')}Тавилга</button><button data-tab="finishes" role="tab">${icon('palette')}Засал</button></div><div id="editor" class="editor-content"></div></aside>
</main>
<nav class="mobile-nav" aria-label="Гар утасны удирдлага"><button data-mobile="rooms">${icon('menu')}Өрөөнүүд</button><button data-mobile="scene" class="active">${icon('cube')}3D харах</button><button data-mobile="edit">${icon('palette')}Тохируулах</button></nav>
<dialog id="modal"><div class="dialog-heading"><h2 id="modal-title"></h2>${iconButton('close-modal','close','Хаах')}</div><div id="modal-body"></div></dialog>
<div id="toast" role="status" aria-live="polite"></div><input id="file-input" type="file" accept=".json,application/json" hidden />`;

function notify(message){const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3300);}
function saveNow(explicit=false){try{storage.setItem(STORE_KEY,JSON.stringify(layout));$('#save-status').textContent='Энэ төхөөрөмжид хадгалсан';if(explicit)notify('Хувилбар энэ төхөөрөмжид хадгалагдлаа.');}catch{$('#save-status').textContent='Файл болгон татаж хадгалаарай';if(explicit)notify('Хадгалах сан ашиглах боломжгүй. «Хувилбар татах»-ыг ашиглаарай.');}}
function commit(rebuild=true){history.push(layout);clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveNow(),250);if(rebuild)scene.update(layout,floor);renderEditor();renderHistory();renderRooms();}
function renderHistory(){$('#undo').disabled=history.index===0;$('#redo').disabled=history.index===history.entries.length-1;}
function renderRooms(){
 const list=ROOMS.filter(r=>r.floor===floor);$('#floor-area').textContent=(floor===0?'97.81':'83.15')+' м²';$('#floor-caption').textContent=floor===0?'01':'02';
 $('#room-list').innerHTML=`<button class="room-button ${room==='all'?'active':''}" data-room="all"><span class="room-number">${icon('grid')}</span><span><strong>Бүх өрөөг харах</strong><small>${list.length} өрөө, хэсэг</small></span>${icon('arrow')}</button>`+list.map((r,i)=>`<button class="room-button ${room===r.id?'active':''}" data-room="${r.id}"><span class="room-number">${String(i+1).padStart(2,'0')}</span><span><strong>${r.name}</strong><small>${r.tag}</small></span><span class="room-area">${r.area.toFixed(2)}<small>м²</small></span></button>`).join('');
 const r=list.find(r=>r.id===room);$('#scene-title').textContent=r?r.name:(floor===0?'Нэгдүгээр давхар':'Хоёрдугаар давхар');$('#scene-meta').textContent=r?`${r.area.toFixed(2)} м² · ${layout.items.filter(i=>i.room===r.id).length} тавилга`:'Бүх өрөөний зохион байгуулалт';
 $('#room-render-link').hidden=!r;$('#room-render-link').href=r?`./renders.html?room=${encodeURIComponent(r.id)}`:'./renders.html';
 document.querySelectorAll('[data-floor]').forEach(b=>b.classList.toggle('active',Number(b.dataset.floor)===floor));
}
function selectRoom(id){room=id;selected=null;renderRooms();scene.select(null);scene.focus(room);renderEditor();document.body.dataset.mobile='scene';}
function selectItem(id){selected=id;scene.select(id);renderEditor();}
function field(label,id,value,extra=''){return `<label class="field"><span>${label}</span><input id="${id}" type="number" value="${value}" ${extra}/></label>`;}
function renderEditor(){
 const el=$('#editor'),item=layout.items.find(i=>i.id===selected&&i.floor===floor);
 document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-selected',b.dataset.tab===tab?'true':'false');});
 if(tab==='finishes'){
  const r=ROOMS.find(r=>r.id===room),s=r?layout.surfaces[r.id]:null;
  el.innerHTML=`<div class="editor-heading"><span class="eyebrow">ӨНГӨ · МАТЕРИАЛ</span><h2>Гэрийн уур амьсгал</h2><p>Нэг хэв маягийг бүх өрөөнд туршаарай.</p></div><div class="theme-list">${Object.entries(THEMES).map(([id,t])=>`<button data-theme="${id}" class="theme-card ${layout.theme===id?'active':''}"><span class="theme-swatches">${[t.wall,t.wood,t.accent].map(c=>`<i style="background:${c}"></i>`).join('')}</span><span>${t.name}</span>${layout.theme===id?icon('check'):''}</button>`).join('')}</div><hr/><label class="field"><span>Тусдаа өрөөний засал</span><select id="finish-room"><option value="all">Өрөө сонгох</option>${ROOMS.filter(r=>r.floor===floor).map(r=>`<option value="${r.id}" ${room===r.id?'selected':''}>${r.name}</option>`).join('')}</select></label>${s?`<label class="color-field"><span>Ханын өнгө</span><input type="color" id="wall-color" value="${s.wall}"/></label><span class="section-label">Шалны материал</span><div class="floor-materials">${[['oak','Цайвар царс','#c4a17c'],['ash','Цайвар мод','#ded0b5'],['walnut','Бараан мод','#806249'],['tile','Чулуун хавтан','#c8c7bc'],['deck','Гадна мод','#9c8263']].map(([id,name,color])=>`<button data-material="${id}" class="material-button ${s.floor===id?'active':''}"><i style="background:${color}"></i>${name}</button>`).join('')}</div>`:'<p class="subtle">Зүүн талаас эсвэл дээрх жагсаалтаас өрөөгөө сонгоно.</p>'}<button class="wide outline" id="open-inspiration">${icon('eye')}Гал тогооны санааны зураг</button>`;
  el.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{const t=THEMES[b.dataset.theme];layout.theme=b.dataset.theme;for(const r of ROOMS){layout.surfaces[r.id].wall=t.wall;if(!r.tile&&!r.outdoor)layout.surfaces[r.id].floor=t.floor;}layout.items.forEach(i=>delete i.color);commit();notify('Бүх өрөөний өнгө, материал шинэчлэгдлээ.');});
  $('#finish-room').onchange=e=>{room=e.target.value;renderRooms();scene.focus(room);renderEditor();};
  if(s){$('#wall-color').onchange=e=>{layout.surfaces[r.id].wall=e.target.value;commit();};el.querySelectorAll('[data-material]').forEach(b=>b.onclick=()=>{layout.surfaces[r.id].floor=b.dataset.material;commit();});}
  $('#open-inspiration').onclick=showInspiration;return;
 }
 const list=layout.items.filter(i=>i.floor===floor&&(room==='all'||i.room===room));
 el.innerHTML=`<button class="primary wide" id="add-furniture">${icon('plus')}Тавилга нэмэх</button>${item?`
  <div class="selected-heading"><span class="eyebrow">СОНГОСОН ТАВИЛГА</span><h2>${esc(item.label)}</h2><span class="subtle">${ROOMS.find(r=>r.id===item.room).name}</span></div>
  <div id="warnings" class="warnings"></div>
  <label class="field"><span>Нэр</span><input type="text" id="item-label" value="${esc(item.label)}" maxlength="80"/></label>
  <span class="section-label">Хэмжээ · см</span><div class="dimensions">${field('Өргөн','item-w',Math.round(item.w*100),'min="15" max="500" step="5"')}${field('Гүн','item-d',Math.round(item.d*100),'min="15" max="500" step="5"')}${field('Өндөр','item-h',Math.round(item.h*100),'min="1" max="300" step="5"')}</div>
  <div class="rotation-row"><label class="field"><span>Эргэлт · градус</span><input id="item-rotation" type="number" value="${Math.round(((item.rotation%360)+360)%360)}" step="15" min="0" max="360"/></label><button id="rotate-item" class="outline" title="90° эргүүлэх">${icon('rotate')}90°</button></div>
  <label class="color-field"><span>Тавилгын өнгө</span><input id="item-color" type="color" value="${item.color||THEMES[layout.theme][CATALOG[item.type].role]||'#eeeae0'}"/></label>
  <label class="lock-field"><input id="item-lock" type="checkbox" ${item.locked?'checked':''}/>${icon('lock')}Байрлал түгжих</label>
  <div class="position-fields">${field('X байрлал · м','item-x',item.x.toFixed(2),'step="0.05" min="-2" max="16"')}${field('Y байрлал · м','item-z',item.z.toFixed(2),'step="0.05" min="-2" max="17"')}</div>
  <div class="nudge"><span>10 см шилжүүлэх</span><div><button data-nudge="-0.1,0" aria-label="Зүүн тийш 10 см">←</button><button data-nudge="0,-0.1" aria-label="Дээш 10 см">↑</button><button data-nudge="0,0.1" aria-label="Доош 10 см">↓</button><button data-nudge="0.1,0" aria-label="Баруун тийш 10 см">→</button></div></div>
  <div class="item-actions"><button id="duplicate" class="outline">${icon('copy')}Хувилах</button><button id="delete" class="outline danger">${icon('trash')}Устгах</button></div><hr/>
 `:`<div class="empty-selection"><div class="empty-icon">${icon('move')}</div><h2>Тавилгаа сонгоорой</h2><p>3D зураг эсвэл доорх жагсаалтаас сонгож, байрлал ба хэмжээг өөрчилнө.</p></div>`}
 <div class="list-heading"><span>${room==='all'?'Энэ давхрын тавилга':'Өрөөний тавилга'}</span><span>${list.length}</span></div><div class="furniture-list">${list.map(i=>`<button data-item="${i.id}" class="furniture-row ${i.id===selected?'active':''}">${icon(i.type==='bed'||i.type==='single'?'home':i.type==='wardrobe'?'grid':'sofa')}<span><strong>${esc(i.label)}</strong><small>${Math.round(i.w*100)} × ${Math.round(i.d*100)} см</small></span>${i.locked?icon('lock'):''}</button>`).join('')||'<p class="subtle">Тавилга нэмээд туршиж үзээрэй.</p>'}</div><button id="reset-layout" class="quiet reset-button">Эхний төлөвлөлтөд буцаах</button>`;
 $('#add-furniture').onclick=showCatalog;$('#reset-layout').onclick=()=>{if(confirm('Бүх өрөөний өөрчлөлтийг эхний төлөвлөлтөд буцаах уу? Буцаах товчоор сэргээж болно.')){layout=initialLayout();selected=null;commit();notify('Эхний төлөвлөлт сэргээгдлээ.');}};
 el.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{selectItem(b.dataset.item);});
 if(!item)return;
 renderWarnings(item);
 $('#item-label').onchange=e=>{item.label=e.target.value.trim()||CATALOG[item.type].name;commit(false);};
 for(const key of ['w','d','h','rotation','x','z'])$('#item-'+key).onchange=e=>{
  if(item.locked){notify('Эхлээд байрлалын түгжээг тайлаарай.');renderEditor();return;}
  const v=Number(e.target.value);const limits={w:[.15,5],d:[.15,5],h:[.01,3],rotation:[0,360],x:[-2,16],z:[-2,17]};
  if(!Number.isFinite(v)){renderEditor();return;}const n=['w','d','h'].includes(key)?v/100:v;item[key]=Math.max(limits[key][0],Math.min(limits[key][1],n));commit();
 };
 $('#item-color').onchange=e=>{item.color=e.target.value;commit();};$('#item-lock').onchange=e=>{item.locked=e.target.checked;commit(false);};
 $('#rotate-item').onclick=rotateSelected;$('#duplicate').onclick=duplicateSelected;$('#delete').onclick=deleteSelected;
 el.querySelectorAll('[data-nudge]').forEach(b=>b.onclick=()=>{if(item.locked){notify('Байрлал түгжээтэй.');return;}const [x,z]=b.dataset.nudge.split(',').map(Number);item.x=Math.max(-2,Math.min(16,+(item.x+x).toFixed(2)));item.z=Math.max(-2,Math.min(17,+(item.z+z).toFixed(2)));commit();});
}
function renderWarnings(item){const w=$('#warnings');if(!w)return;const warnings=itemWarnings(item,layout);w.innerHTML=warnings.map(s=>`<span>${esc(s)}</span>`).join('');w.hidden=!warnings.length;}
function rotateSelected(){const i=layout.items.find(i=>i.id===selected);if(!i)return;if(i.locked){notify('Эхлээд байрлалын түгжээг тайлаарай.');return;}i.rotation=(i.rotation+90)%360;commit();}
function duplicateSelected(){const i=layout.items.find(i=>i.id===selected);if(!i)return;if(layout.items.length>=250){notify('250 хүртэл тавилга нэмэх боломжтой.');return;}const n={...i,id:crypto.randomUUID(),x:Math.min(16,i.x+.3),z:Math.min(17,i.z+.3),locked:false};layout.items.push(n);selected=n.id;commit();}
function deleteSelected(){const i=layout.items.find(i=>i.id===selected);if(!i)return;if(i.locked){notify('Устгахын өмнө түгжээг тайлаарай.');return;}layout.items=layout.items.filter(i=>i.id!==selected);selected=null;commit();notify('Тавилга устлаа. Буцаах товчоор сэргээж болно.');}
function showDialog(title,body){$('#modal-title').textContent=title;$('#modal-body').innerHTML=body;$('#modal').showModal();}
function showCatalog(){
 const cats=[...new Set(Object.values(CATALOG).map(c=>c.category))];
 showDialog('Тавилга нэмэх',`<label class="field"><span>Өрөө</span><select id="catalog-room">${ROOMS.filter(r=>r.floor===floor&&!r.fixed).map(r=>`<option value="${r.id}" ${r.id===room?'selected':''}>${r.name}</option>`).join('')}</select></label><div class="catalog">${cats.map(cat=>`<h3>${cat}</h3><div class="catalog-grid">${Object.entries(CATALOG).filter(([,c])=>c.category===cat).map(([type,c])=>`<button data-add="${type}"><span class="catalog-icon">${icon(type==='plant'?'sun':type==='wardrobe'?'grid':type==='bed'||type==='single'?'home':'sofa')}</span><strong>${c.name}</strong><small>${Math.round(c.w*100)} × ${Math.round(c.d*100)} см</small>${icon('plus')}</button>`).join('')}</div>`).join('')}</div>`);
 $('#modal-body').querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{if(layout.items.length>=250){notify('250 хүртэл тавилга нэмэх боломжтой.');return;}const r=ROOMS.find(r=>r.id===$('#catalog-room').value),c=CATALOG[b.dataset.add];const item={id:crypto.randomUUID(),type:b.dataset.add,label:c.name,room:r.id,floor:r.floor,x:r.focus[0],z:r.focus[1],w:c.w,d:c.d,h:c.h,rotation:0};layout.items.push(item);room=r.id;selected=item.id;$('#modal').close();scene.focus(room);commit();notify('Тавилга нэмэгдлээ. Чирж байрлуулаарай.');});
}
function showInspiration(){showDialog('Гал тогооны 3 өнгө төрх',`<p class="dialog-intro">Өмнө боловсруулсан интерьерийн санаанууд. 3D студид ижил өнгөний хослолыг туршиж болно.</p><div class="inspiration-grid">${Object.entries(THEMES).map(([id,t])=>`<article><img src="${t.image}" alt="${t.name} гал тогооны концепц зураг" loading="lazy"/><div><h3>${t.name}</h3><button class="outline" data-inspire="${id}">Энэ өнгийг турших ${icon('arrow')}</button></div></article>`).join('')}</div><p class="subtle">Эдгээр нь AI-аар бүтээсэн өнгө, материалын санааны зургууд.</p>`);$('#modal-body').querySelectorAll('[data-inspire]').forEach(b=>b.onclick=()=>{layout.theme=b.dataset.inspire;const t=THEMES[layout.theme];for(const r of ROOMS){layout.surfaces[r.id].wall=t.wall;if(!r.tile&&!r.outdoor)layout.surfaces[r.id].floor=t.floor;}layout.items.forEach(i=>delete i.color);tab='finishes';$('#modal').close();commit();});}
function download(data,name,mime){const a=document.createElement('a'),url=typeof data==='string'&&data.startsWith('data:')?data:URL.createObjectURL(new Blob([data],{type:mime}));a.href=url;a.download=name;a.click();if(!url.startsWith('data:'))setTimeout(()=>URL.revokeObjectURL(url),1000);}

try{scene=new PlannerScene($('#viewport'),{
 select:id=>{selected=id;tab='furniture';renderEditor();},
 moving:i=>{if($('#item-x'))$('#item-x').value=i.x.toFixed(2);if($('#item-z'))$('#item-z').value=i.z.toFixed(2);renderWarnings(i);},
 changed:()=>commit(false),room:id=>selectRoom(id)
});scene.update(layout,0);scene.home();$('#loading').remove();}
catch(error){console.error(error);$('#loading').innerHTML=`${icon('cube')}<strong>3D дүрслэл ассангүй.</strong><span>WebGL дэмждэг Chrome эсвэл Edge хөтөчөөр нээж үзээрэй.</span><button class="outline" onclick="location.reload()">Дахин ачаалах</button>`;}
renderRooms();renderEditor();renderHistory();
$('#room-list').onclick=e=>{const b=e.target.closest('[data-room]');if(b)selectRoom(b.dataset.room);};
document.querySelectorAll('[data-floor]').forEach(b=>b.onclick=()=>{floor=Number(b.dataset.floor);room=scene.view==='inside'?(floor===0?'living':'master'):'all';selected=null;scene.setFloor(floor);scene.focus(room);renderRooms();renderEditor();});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{
 const v=b.dataset.view;if(v==='inside'&&room==='all'){room=floor===0?'living':'master';renderRooms();renderEditor();}
 scene.setView(v,room);document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));$('#wall-toggle span').textContent=scene.fullWalls?'Нам хана':'Бүтэн хана';
});
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;renderEditor();});
$('#wall-toggle').onclick=()=>{scene.fullWalls=!scene.fullWalls;scene.update(layout);$('#wall-toggle span').textContent=scene.fullWalls?'Нам хана':'Бүтэн хана';};
for(const mode of ['move','orbit'])$('#mode-'+mode).onclick=()=>{scene.mode=mode;$('#mode-move').classList.toggle('active',mode==='move');$('#mode-orbit').classList.toggle('active',mode==='orbit');};
$('#snap').onchange=e=>scene.snap=e.target.checked;$('#zoom-in').onclick=()=>scene.zoom(1);$('#zoom-out').onclick=()=>scene.zoom(-1);$('#home-view').onclick=()=>{scene.setView('3d','all');document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view==='3d'));$('#wall-toggle span').textContent='Бүтэн хана';selectRoom('all');};
$('#save').setAttribute('aria-label','Хадгалах');$('#wall-toggle').setAttribute('aria-label','Ханын өндрийг солих');
$('#save').onclick=()=>saveNow(true);$('#undo').onclick=()=>{const l=history.undo();if(l){layout=l;if(!layout.items.some(i=>i.id===selected))selected=null;scene.update(layout,floor);renderEditor();renderRooms();renderHistory();saveNow();}};
$('#redo').onclick=()=>{const l=history.redo();if(l){layout=l;scene.update(layout,floor);renderEditor();renderRooms();renderHistory();saveNow();}};
$('#export').onclick=()=>{download(JSON.stringify(layout,null,2),'selbe-layout.json','application/json');notify('Хувилбарын файл татагдлаа.');};
$('#import').onclick=()=>$('#file-input').click();$('#mobile-import').onclick=()=>$('#file-input').click();$('#file-input').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>3000000)throw Error('Файл 3 МБ-аас бага байх ёстой.');const next=validateLayout(JSON.parse(await f.text()));layout=next;selected=null;commit();notify('Хувилбар амжилттай орлоо.');}catch(err){notify(err.message||'Хувилбарын файлыг уншиж чадсангүй.');}e.target.value='';};
$('#capture').onclick=()=>{download(scene.screenshot(),`selbe-floor-${floor+1}.png`,'image/png');notify('Одоогийн 3D харагдац зураг болж татагдлаа.');};
$('#inspiration').onclick=showInspiration;
$('#guide').onclick=()=>showDialog('Хэрхэн ашиглах вэ?',`<div class="guide-grid"><article><b>01</b><h3>Өрөөгөө сонго</h3><p>Давхар болон өрөөн дээр дарж ойртуулна. «Дотор» нь хүний нүдний өндөрт харуулна.</p></article><article><b>02</b><h3>Тавилгаа турш</h3><p>Тавилга дээр дарж чирнэ. Баруун хэсэгт хэмжээ, эргэлт, өнгийг өөрчилнө. Түгжээтэй тавилгыг эхлээд тайлна.</p></article><article><b>03</b><h3>Харагдацаа удирд</h3><p>Хоосон зайг чирж эргүүлнэ. Хулганын дугуйгаар ойртуулна. Баруун товчоор чирж дүрсийг шилжүүлнэ. Гар утсанд хоёр хуруугаар томруулж болно.</p></article><article><b>04</b><h3>Хувилбараа хадгал</h3><p>Өөрчлөлт энэ төхөөрөмжийн хөтөчид автоматаар хадгалагдана. Өөр төхөөрөмжид ашиглахын тулд файл татаж аваад оруулна.</p></article></div><p class="subtle">R · 90° эргүүлэх &nbsp; Delete · устгах &nbsp; Ctrl+Z · буцаах &nbsp; Ctrl+Shift+Z · дахин хийх</p>`);
$('#source').onclick=()=>showDialog('Төлөвлөлтийн эх сурвалж',`<div class="source-details"><span class="eyebrow">SELBE AJLIIN ZURAG.PDF</span><h3>4–6 хүний гэр бүлийн сууц</h3><p>БА-3, БА-4 давхрын байгуулалт болон өмнөх тавилгын төлөвлөлтөд тулгуурлан бүтээв. Дотор талбай: 180.96 м². Террас: 57.92 м², тагт: 10.60 м²; эдгээрийн талбайг эх зурагт 30%-иар жигнэсэн.</p><p>Өрөөний талбайг эх хүснэгтээс авсан. 3D загвар нь схемчилсэн концепц бөгөөд барилга угсралт, тавилга үйлдвэрлэлийн хэмжээсийн зураг биш. Хана, хаалга, цонх, шалны хил нь суурь төлөвлөлтөөр тогтмол.</p><p>Давхцлын анхааруулга нь тавилгын хэвтээ хүрээ болон хаалганы ойр орчмыг шалгана. Явах замын өргөн, бүрэн хаалганы нээлт, инженерийн шугам, аюулгүй байдлын нормыг баталгаажуулахгүй. Усны цэг, гал тогооны байрлалыг өөрчлөхөд газар дээр нь шалгуулна.</p><p>Хувилбарууд зөвхөн таны хөтөчид хадгалагдана. GitHub Pages дээр хувийн хувилбар автоматаар хуваалцахгүй.</p></div>`);
$('#close-modal').onclick=()=>$('#modal').close();$('#modal').onclick=e=>{if(e.target===$('#modal'))$('#modal').close();};
document.querySelectorAll('[data-mobile]').forEach(b=>b.onclick=()=>{document.body.dataset.mobile=b.dataset.mobile;document.querySelectorAll('[data-mobile]').forEach(x=>x.classList.toggle('active',x===b));});
document.addEventListener('keydown',e=>{
 if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||$('#modal').open)return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$(e.shiftKey?'#redo':'#undo').click();}
 else if(e.key.toLowerCase()==='r')rotateSelected();else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteSelected();}
 else if(e.key==='Escape'){selected=null;scene.select(null);renderEditor();}
});
// Progressive enhancement: supported browsers can discover local planner actions.
const modelContext=document.modelContext||navigator.modelContext;
if(modelContext?.registerTool){
 const tools=[{
  name:'get_selbe_layout',description:'Read the current Selbe room layout, furniture and placement warnings. Coordinates and dimensions are in metres.',
  inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},
  execute:async()=>JSON.stringify({floor,room,layout,rooms:ROOMS.map(({id,name,floor,area})=>({id,name,floor,area})),warnings:layout.items.flatMap(i=>itemWarnings(i,layout).map(message=>({id:i.id,message})))})
 },{
  name:'focus_selbe_room',description:'Show a room in the Selbe 3D planner. Changes only the viewing position, not furniture or the saved layout.',
  inputSchema:{type:'object',properties:{roomId:{type:'string',enum:ROOMS.map(r=>r.id)}},required:['roomId'],additionalProperties:false},annotations:{consequentialHint:false},
  execute:async({roomId})=>{const r=ROOMS.find(r=>r.id===roomId);if(!r)throw Error('Unknown room');if(!scene)throw Error('3D is unavailable');floor=r.floor;scene.setFloor(floor);selectRoom(r.id);return JSON.stringify({room:r.name,floor:floor+1});}
 }];
 for(const tool of tools)try{Promise.resolve(modelContext.registerTool(tool)).catch(()=>{});}catch{}
}



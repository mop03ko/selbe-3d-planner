import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ROOMS, THEMES, CATALOG, FLOOR_OUTLINES, wallsFor } from './data.js';
import { corners, pointInPoly, itemWarnings } from './model.js';

const texCache=new Map();
function texture(type){
 if(texCache.has(type))return texCache.get(type);
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');
 let seed=38;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 const colors={oak:['#c9b18e','#c0a27c'],ash:['#d9ccb4','#cabea5'],walnut:['#97806a','#8b745e'],deck:['#a89274','#988065'],tile:['#d5d3c9','#d9d8cf'],fabric:['#e0ddd6','#d9d6d0']};
 const pal=colors[type]||colors.oak;ctx.fillStyle=pal[0];ctx.fillRect(0,0,512,512);
 if(type==='tile'){
  ctx.fillStyle=pal[1];ctx.fillRect(2,2,253,253);ctx.fillRect(258,258,253,253);ctx.strokeStyle='#b7b7ae';ctx.lineWidth=2;
  for(let i=0;i<=512;i+=256){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,512);ctx.moveTo(0,i);ctx.lineTo(512,i);ctx.stroke();}
 }else if(type==='fabric'){
  for(let i=0;i<512;i+=3){ctx.strokeStyle=i%2?'#dedbd5':'#c9c6bf';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,512);ctx.moveTo(0,i);ctx.lineTo(512,i);ctx.stroke();}
 }else{
  for(let i=0;i<8;i++){const x=i*64;ctx.fillStyle=i%3?pal[0]:pal[1];ctx.fillRect(x,0,64,512);ctx.strokeStyle='rgba(71,52,36,.13)';ctx.lineWidth=1;ctx.strokeRect(x,0,64,512);
   for(let j=0;j<25;j++){ctx.strokeStyle=`rgba(92,66,38,${.015+rand()*.065})`;ctx.beginPath();const a=x+rand()*64;ctx.moveTo(a,0);ctx.bezierCurveTo(a+rand()*9,170,a-rand()*8,360,a+rand()*3,512);ctx.stroke();}
   const y=90+(i*197)%390;ctx.strokeStyle='rgba(71,52,36,.13)';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+64,y);ctx.stroke();
  }
 }
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(type==='tile'?.65:.55,type==='tile'?.65:.3);t.anisotropy=4;texCache.set(type,t);return t;
}
function material(color,roughness=.8,map){return new THREE.MeshStandardMaterial({color,roughness,map:map?texture(map):null});}
function part(group,x,y,z,w,h,d,mat,round=0){
 const geo=round?new RoundedBoxGeometry(w,h,d,2,Math.min(round,w/4,h/4,d/4)):new THREE.BoxGeometry(w,h,d);
 const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
}
function cyl(group,x,y,z,rad,h,mat,top=rad){const m=new THREE.Mesh(new THREE.CylinderGeometry(top,rad,h,16),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
function floorShape(poly){const shape=new THREE.Shape();poly.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();return shape;}

function furniture(item,theme){
 const g=new THREE.Group();const {w,d}=item,c=CATALOG[item.type],h=c.h,col=item.color||theme[c.role]||'#eeeae0';
 const wood=material(item.color&&c.role==='wood'?item.color:theme.wood,.63),fabric=material(col,.93,'fabric'),base=material(col,.77),dark=material('#35413d',.57),white=material('#f4f0e8',.5),metal=material('#a8aca6',.28),stone=material('#e5dfd3',.45);
 const legs=(height,spread=.08)=>{for(const x of [-w/2+spread,w/2-spread])for(const z of [-d/2+spread,d/2-spread])part(g,x,height/2,z,.045,height,.045,wood,.008);};
 switch(item.type){
 case 'bed':case 'single':{
  legs(.18,.10);part(g,0,.23,0,w,.22,d,wood,.05);part(g,0,.41,.03,w-.05,.19,d-.04,white,.065);
  part(g,0,h/2,-d/2+.04,w+.03,h,.085,wood,.035);
  part(g,0,.54,d*.16,w-.07,.11,d*.61,fabric,.055);
  const n=w>1.4?2:1;for(let i=0;i<n;i++)part(g,(i-(n-1)/2)*(w/n),.565,-d*.30,w/n-.12,.13,d*.23,white,.06);
  break;}
 case 'sofa':case 'armchair':{
  legs(.16,.10);part(g,0,.30,0,w,.32,d,fabric,.075);part(g,0,h-.21,-d/2+.12,w,.42,.22,fabric,.07);
  for(const x of [-w/2+.105,w/2-.105])part(g,x,.48,0,.21,.44,d,fabric,.075);
  const n=item.type==='sofa'?3:1;for(let i=0;i<n;i++)part(g,(i-(n-1)/2)*(w-.42)/n,.515,.035,(w-.45)/n,.16,d-.28,fabric,.065);
  if(w>1.3){const pillow=part(g,-w*.28,.68,-d*.12,.36,.36,.15,material(theme.accent,.95,'fabric'),.06);pillow.rotation.z=.13;}break;}
 case 'desk':case 'dining':case 'coffee':case 'bench':{
  const ht=item.type==='coffee'?.38:h;legs(ht-.05,.10);part(g,0,ht-.03,0,w,.07,d,item.type==='bench'?fabric:wood,.03);
  if(item.type==='desk'){part(g,w*.3,ht-.16,0,w*.28,.2,d*.85,wood,.015);part(g,0,ht+.013,-d*.19,w*.34,.022,d*.36,dark,.012);}
  if(item.type==='dining'){cyl(g,0,ht+.095,0,.13,.16,stone,.075);const leaves=cyl(g,0,ht+.24,0,.12,.2,material(theme.accent),.04);leaves.rotation.z=.2;}break;}
 case 'chair':{
  legs(.44,.055);part(g,0,.45,0,w,.07,d,wood,.025);part(g,0,h-.14,-d/2+.03,w,.27,.045,wood,.023);part(g,0,.50,0,w-.055,.045,d-.055,fabric,.028);break;}
 case 'wardrobe':{
  part(g,0,h/2,0,w,h,d,wood,.014);const doors=Math.max(2,Math.round(w/.55));
  for(let i=0;i<doors;i++){const x=-w/2+(i+.5)*w/doors;part(g,x,h/2,d/2+.004,w/doors-.014,h-.05,.018,base,.004);part(g,x+w/doors*.3,h*.5,d/2+.025,.012,.24,.018,dark,.005);}break;}
 case 'shelf':{
  for(const x of [-w/2+.025,w/2-.025])part(g,x,h/2,0,.05,h,d,wood);
  for(let k=0;k<5;k++){const y=k*(h-.08)/4+.04;part(g,0,y,0,w,.04,d,wood);if(k<4)for(let j=0;j<3;j++)part(g,-w*.30+j*.09,y+.15,0,.06,.26,d*.65,material([theme.accent,theme.fabric,'#af9a83'][j]),.003);}break;}
 case 'nightstand':{
  part(g,0,h/2,0,w,h,d,wood,.03);part(g,0,h*.7,d/2,.20,.012,.02,dark);
  cyl(g,0,h+.07,0,.10,.13,stone);cyl(g,0,h+.23,0,.14,.15,white,.10);break;}
 case 'tv':{
  part(g,0,.25,0,w,.5,d,wood,.025);part(g,0,.54,0,.5,.05,.20,dark);part(g,0,1.02,-.02,w*.87,.82,.04,dark,.015);part(g,0,1.02,.006,w*.84,.76,.008,material('#2d3b3a',.22));break;}
 case 'rug':part(g,0,.017,0,w,.025,d,fabric,.02);break;
 case 'kitchen':{
  const fridge=Math.min(.6,w*.17),run=w-fridge;
  part(g,-w/2+fridge/2,h/2,0,fridge,h,d,base,.013);
  part(g,-w/2+fridge/2,h*.70,d/2+.012,fridge-.025,h*.58,.02,base,.008);part(g,-w/2+fridge/2,h*.195,d/2+.012,fridge-.025,h*.37,.02,base,.008);
  part(g,-w/2+fridge-.08,h*.55,d/2+.035,.018,.4,.024,metal,.005);
  const start=-w/2+fridge,top=.90;
  part(g,fridge/2,.43,0,run,.86,d,base,.014);part(g,fridge/2,top-.02,0,run+.015,.055,d+.035,stone,.008);
  part(g,fridge/2,1.2,-d/2+.01,run,.58,.025,stone);part(g,fridge/2,2.02,-.1,run,.76,d-.2,base,.011);
  const modules=6,mw=run/modules;
  for(let i=0;i<modules;i++){const x=start+(i+.5)*mw;
   part(g,x,.44,d/2+.008,mw-.012,.79,.018,base,.004);part(g,x,.76,d/2+.026,mw*.33,.012,.02,metal,.004);
   part(g,x,2.02,d/2-.19,mw-.011,.74,.016,base,.004);
  }
  part(g,start+run*.75,top+.005,0,.56,.016,d*.75,dark,.014);for(const dx of [-.14,.14])for(const dz of [-.12,.12])cyl(g,start+run*.75+dx,top+.018,dz,.07,.005,metal);
  part(g,start+run*.75,.47,d/2+.035,.55,.51,.026,dark,.016);part(g,start+run*.75,.48,d/2+.052,.45,.35,.012,material('#46524c',.2));
  part(g,start+run*.17,top+.006,0,.49,.012,d*.62,metal,.025);part(g,start+run*.17,top+.008,0,.39,.013,d*.46,dark,.03);
  cyl(g,start+run*.17,1.02,-d*.34,.018,.27,metal);part(g,start+run*.17,1.155,-d*.23,.035,.035,d*.25,metal,.014);
  const strip=part(g,fridge/2,1.628,-d*.12,run-.1,.016,.025,material('#ffe6b8'));strip.material.emissive=new THREE.Color('#f8cc85');strip.material.emissiveIntensity=.5;
  break;}
 case 'bath':{
  part(g,0,h/2,0,w,h,d,white,.1);part(g,0,h+.004,0,w-.16,.016,d-.16,material('#8db9be',.16),.09);part(g,0,h+.012,0,w-.22,.01,d-.22,material('#b9d1ce',.2),.08);cyl(g,-w*.35,h+.12,-d*.25,.015,.22,metal);break;}
 case 'sink':{
  part(g,0,.37,0,w,.74,d,wood,.022);part(g,0,.78,0,w+.02,.1,d+.015,white,.03);part(g,0,.837,.02,w*.6,.012,d*.52,material('#d0d8d1'),.04);cyl(g,0,.93,-d*.34,.015,.23,metal);part(g,0,.93,-d*.24,.026,.026,.14,metal);break;}
 case 'toilet':{
  cyl(g,0,.20,.055,w*.36,.4,white,w*.42);const bowl=cyl(g,0,.43,.055,w*.48,.10,white);bowl.scale.z=1.25;
  part(g,0,.53,-d*.32,w*.85,.36,d*.23,white,.04);break;}
 case 'washer':case 'utility':{
  part(g,0,h/2,0,w,h,d,white,.04);
  if(item.type==='washer'){const door=cyl(g,0,h*.46,d/2+.012,w*.31,.045,dark);door.rotation.x=Math.PI/2;}else{part(g,0,h*.76,d/2+.015,w*.55,.19,.025,dark,.01);}
  break;}
 case 'plant':{
  cyl(g,0,.20,0,w*.4,.4,stone,w*.34);cyl(g,0,.59,0,.014,.48,wood);
  for(let i=0;i<7;i++){const a=i*2.4;const leaf=new THREE.Mesh(new THREE.SphereGeometry(.17,8,6),material(theme.accent));leaf.scale.set(.55,1.9,.25);leaf.position.set(Math.sin(a)*.12,.52+i*.075,Math.cos(a)*.12);leaf.rotation.z=Math.sin(a)*.65;g.add(leaf);}break;}
 }
 // All parts share a single selectable parent and use metres, not screen pixels.
 g.position.set(item.x,.025,item.z);g.rotation.y=item.rotation*Math.PI/180;g.scale.y=item.h/c.h;g.userData.itemId=item.id;
 g.traverse(m=>{if(m.isMesh)m.userData.itemId=item.id;});return g;
}

export class PlannerScene{
 constructor(container,callbacks){
  this.el=container;this.cb=callbacks;this.floor=0;this.view='3d';this.fullWalls=false;this.mode='move';this.snap=true;this.selected=null;this.layout=null;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#e8eae4');
  this.camera=new THREE.PerspectiveCamera(42,1,.05,180);this.camera.position.set(17,19,24);
  this.renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:false,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;this.el.append(this.renderer.domElement);
  this.renderer.domElement.setAttribute('aria-label','Сууцын 3D зохион байгуулалт');this.renderer.domElement.setAttribute('role','img');
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.dampingFactor=.09;this.controls.target.set(5,0,6);
  this.controls.maxPolarAngle=Math.PI*.49;this.controls.minDistance=1;this.controls.maxDistance=48;this.controls.screenSpacePanning=false;
  this.scene.add(new THREE.HemisphereLight('#fff7e9','#909c8b',2.7));
  const sun=new THREE.DirectionalLight('#fff0d5',3.1);sun.position.set(-5,17,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:.1,far:50});sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;this.scene.add(sun);
  const fill=new THREE.DirectionalLight('#e5efff',1.0);fill.position.set(14,10,-6);this.scene.add(fill);
  this.world=new THREE.Group();this.scene.add(this.world);this.arch=new THREE.Group();this.furn=new THREE.Group();this.labels=new THREE.Group();this.world.add(this.arch,this.furn,this.labels);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),material('#e8eae4'));ground.rotation.x=-Math.PI/2;ground.position.y=-.20;ground.receiveShadow=true;this.scene.add(ground);this.ground=ground;
  this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.plane=new THREE.Plane(new THREE.Vector3(0,1,0),-.025);this.meshes=new Map();this.drag=null;this.frame=null;
  this.bindPointer();this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(container);this.resize();this.animate();
 }
 clear(group){group.traverse(o=>{if(o.isMesh||o.isLine){o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();}});group.clear();}
 resize(){const {width,height}=this.el.getBoundingClientRect();if(!width||!height)return;this.renderer.setSize(width,height);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();}
 animate=()=>{this.frame=requestAnimationFrame(this.animate);this.controls.update();this.renderer.render(this.scene,this.camera);};
 update(layout,floor=this.floor){this.layout=layout;this.floor=floor;this.ground.position.y=floor===1?-3.2:-.20;this.clear(this.arch);this.clear(this.furn);this.clear(this.labels);this.meshes.clear();this.buildArchitecture();
  for(const item of layout.items.filter(i=>i.floor===floor)){const g=furniture(item,THEMES[layout.theme]);this.furn.add(g);this.meshes.set(item.id,g);}
  this.select(this.selected);
 }
 buildArchitecture(){
  const theme=THEMES[this.layout.theme],f=this.floor,wallH=this.fullWalls?3:.48;
  const shape=floorShape(FLOOR_OUTLINES[f]);
  if(f===1){const hole=floorShape([[.10,3.6],[3.8,3.6],[3.8,5.8],[.1,5.8]]);shape.holes.push(hole);}
  const base=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:false}),material('#c4c5b9'));base.rotation.x=-Math.PI/2;base.position.y=-.16;base.receiveShadow=true;this.arch.add(base);
  for(const room of ROOMS.filter(r=>r.floor===f)){
   if(!(f===1&&room.fixed)){
    const floor=new THREE.Mesh(new THREE.ShapeGeometry(floorShape(room.poly)),material('#ffffff',.88,this.layout.surfaces[room.id].floor));floor.rotation.x=-Math.PI/2;floor.position.y=.008;floor.receiveShadow=true;floor.userData.roomId=room.id;this.arch.add(floor);
   }
   if(room.outdoor)this.addRailing(room);
  }
  for(const wall of wallsFor(f)){
   const len=Math.hypot(wall.b[0]-wall.a[0],wall.b[1]-wall.a[1]),ux=(wall.b[0]-wall.a[0])/len,uz=(wall.b[1]-wall.a[1])/len;
   const cuts=[0,len,...wall.openings.flatMap(o=>[o.s,o.e])];
   for(const r of ROOMS.filter(r=>r.floor===f&&!r.outdoor))for(const p of r.poly){const s=(p[0]-wall.a[0])*ux+(p[1]-wall.a[1])*uz;if(s>.01&&s<len-.01)cuts.push(s);}
   const sorted=[...new Set(cuts.map(v=>+v.toFixed(4)))].sort((a,b)=>a-b);
   for(let k=0;k<sorted.length-1;k++){
    const s=sorted[k],e=sorted[k+1],mid=(s+e)/2;if(e-s<.01)continue;
    const opening=wall.openings.find(o=>mid>o.s&&mid<o.e),x=wall.a[0]+ux*mid,z=wall.a[1]+uz*mid;
    const room=ROOMS.find(r=>r.floor===f&&!r.outdoor&&(pointInPoly(x-uz*.19,z+ux*.19,r.poly)||pointInPoly(x+uz*.19,z-ux*.19,r.poly)));
    const mat=material(room?this.layout.surfaces[room.id].wall:theme.wall,.92);
    const piece=(lo,hi)=>{lo=Math.min(lo,wallH);hi=Math.min(hi,wallH);if(hi-lo<.01)return;const m=part(this.arch,x,(lo+hi)/2,z,e-s+.003,hi-lo,wall.outer?.23:.125,mat);m.rotation.y=-Math.atan2(uz,ux);};
    if(opening){piece(0,opening.sill);piece(opening.sill+opening.h,3);}else piece(0,3);
   }
   for(const o of wall.openings){
    const x=wall.a[0]+ux*(o.s+o.e)/2,z=wall.a[1]+uz*(o.s+o.e)/2,width=o.e-o.s;
    if(this.fullWalls&&o.type==='window'){
     const g=new THREE.Group();g.position.set(x,o.sill,z);g.rotation.y=-Math.atan2(uz,ux);this.arch.add(g);
     const frame=material('#626d64',.5);for(const dx of [-width/2,width/2,0])part(g,dx,o.h/2,0,.035,o.h,.07,frame);
     for(const yy of [0,o.h])part(g,0,yy,0,width,.035,.07,frame);
     const glass=new THREE.Mesh(new THREE.BoxGeometry(width-.04,o.h-.04,.015),new THREE.MeshPhysicalMaterial({color:'#b6d0ce',transparent:true,opacity:.18,roughness:.1,metalness:.0,depthWrite:false}));glass.position.y=o.h/2;g.add(glass);
    }else if(o.type==='window'){
     const m=part(this.arch,x,.04,z,width,.028,.13,material('#7ba8a2'));m.rotation.y=-Math.atan2(uz,ux);
    }
    if(o.type==='door'){
     const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=-Math.atan2(uz,ux);this.arch.add(g);
     for(const dx of [-width/2,width/2])part(g,dx,wallH/2,0,.035,wallH,.16,material(theme.wood));
     if(this.fullWalls)part(g,0,o.h,0,width,.045,.16,material(theme.wood));
     const pts=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI/2;pts.push(new THREE.Vector3(-width/2+Math.cos(a)*width,.025,Math.sin(a)*width));}
     const arc=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineDashedMaterial({color:'#8a9f95',dashSize:.07,gapSize:.055}));arc.computeLineDistances();g.add(arc);
    }
   }
  }
  this.stairs();
  const chimneyH=this.fullWalls?3:1.1;
  part(this.arch,2.2,chimneyH/2,6.225,1.6,chimneyH,.4,material('#aea89a'),.014);
  if(f===0){part(this.arch,2.2,.48,6.435,1.2,.56,.028,material('#333d36'),.018);part(this.arch,2.2,.33,6.455,.8,.06,.014,material('#c18a47'));}
 }
 addRailing(room){
  const railing=new THREE.Group();this.arch.add(railing);const mat=material('#68776c');
  const edges=room.id==='balcony'?[[[-.35,10.05],[-.35,11.95]],[[-.35,11.95],[4.95,11.95]],[[4.95,10.05],[4.95,11.95]]]:[[[12.15,-.35],[12.15,13.85]],[[-.35,13.85],[12.15,13.85]]];
  for(const [a,b] of edges){const len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(len/.9);for(let i=0;i<=n;i++){const t=i/n;part(railing,a[0]+(b[0]-a[0])*t,.46,a[1]+(b[1]-a[1])*t,.025,.92,.025,mat);}
   const beam=part(railing,(a[0]+b[0])/2,.92,(a[1]+b[1])/2,len,.032,.04,mat);beam.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);
  }
 }
 stairs(){
  const offset=this.floor===1?-3:0,mat=material('#b5a48b');
  for(let i=0;i<8;i++){
   const h=(i+1)*.1875;part(this.arch,3.73-i*.34,offset+h/2,5.28,.34,h,1.13,mat);
   const h2=1.5+(i+1)*.1875;part(this.arch,1.35+i*.34,offset+h2/2,4.1,.34,h2,1.13,mat);
  }
  part(this.arch,.6,offset+.75,4.7,1.2,1.5,2.4,mat);
  if(this.floor===1){const rail=material('#637064');for(let i=0;i<9;i++)part(this.arch,1.2+i*.3,.48,4.70,.022,.96,.022,rail);part(this.arch,2.5,.96,4.7,2.7,.035,.035,rail);}
 }
 select(id){this.selected=id;this.selection?.removeFromParent();if(this.selection){this.selection.geometry.dispose();this.selection.material.dispose();}this.selection=null;const item=this.layout?.items.find(i=>i.id===id&&i.floor===this.floor);if(!item)return;
  const pts=corners(item,.04).map(([x,z])=>new THREE.Vector3(x,.035,z));pts.push(pts[0]);const bad=itemWarnings(item,this.layout).length>0;
  this.selection=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:bad?'#bd6540':'#17876f',depthTest:false}));this.selection.renderOrder=99;this.scene.add(this.selection);
 }
 moveMesh(item){const mesh=this.meshes.get(item.id);if(mesh){mesh.position.set(item.x,.025,item.z);mesh.rotation.y=item.rotation*Math.PI/180;}this.select(item.id);}
 setFloor(f){this.update(this.layout,f);this.home();}
 setView(view,room){this.view=view;this.controls.enableRotate=view!=='top';this.fullWalls=view==='inside';this.update(this.layout);this.focus(room||'all');}
 focus(id){const room=ROOMS.find(r=>r.id===id);const center=room?room.focus:[5.5,this.floor?5.4:6.5];
  if(this.view==='inside'&&room){const bounds=room.poly.reduce((b,p)=>[Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])],[Infinity,Infinity,-Infinity,-Infinity]);
   // Choose an interior point near the lower edge, then look into the selected room.
   let pos=[center[0],center[1]+.7];for(const p of [[bounds[2]-.45,bounds[3]-.45],[bounds[0]+.45,bounds[3]-.45],pos])if(pointInPoly(...p,room.poly)){pos=p;break;}
   const target=room.id==='master'?[7.5,5.8]:center;
   if(room.id==='master')pos=[9.05,8.7];
   this.camera.position.set(pos[0],1.65,pos[1]);this.controls.target.set(target[0],1.15,target[1]);this.controls.maxPolarAngle=Math.PI*.73;
  }else{
   this.controls.maxPolarAngle=Math.PI*.49;
   const extent=room?Math.max(...room.poly.map(p=>Math.hypot(p[0]-center[0],p[1]-center[1])))*2:14;
   const size=Math.max(3.7,extent);let dist=(room?size*.92:16.5)*Math.max(1,1/this.camera.aspect);
   if(this.view==='top'){this.camera.position.set(center[0],dist*1.55,center[1]+.001);this.controls.target.set(center[0],0,center[1]);}
   else{this.camera.position.set(center[0]+dist*.75,dist*1.0,center[1]+dist*.95);this.controls.target.set(center[0],.1,center[1]);}
  }this.controls.update();
 }
 home(){this.focus('all');}
 zoom(delta){const v=this.camera.position.clone().sub(this.controls.target);v.multiplyScalar(delta>0?.83:1.2);this.camera.position.copy(this.controls.target).add(v);this.controls.update();}
 hit(event){const r=this.renderer.domElement.getBoundingClientRect();this.pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hit=this.ray.intersectObjects(this.furn.children,true)[0];return hit?.object.userData.itemId;}
 groundPoint(event){const r=this.renderer.domElement.getBoundingClientRect();this.pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const v=new THREE.Vector3();return this.ray.ray.intersectPlane(this.plane,v)?v:null;}
 bindPointer(){const el=this.renderer.domElement;
  el.addEventListener('pointerdown',e=>{
   if(e.button!==0||this.mode==='orbit')return;const id=this.hit(e);if(!id)return;const item=this.layout.items.find(i=>i.id===id);this.cb.select(id);this.select(id);
   if(item.locked)return;const p=this.groundPoint(e);if(!p)return;
   e.stopImmediatePropagation();this.controls.enabled=false;this.drag={id,px:p.x,pz:p.z,x:item.x,z:item.z,changed:false};el.setPointerCapture(e.pointerId);el.style.cursor='grabbing';
  },true);
  el.addEventListener('pointermove',e=>{if(this.drag){e.stopImmediatePropagation();const p=this.groundPoint(e);if(!p)return;const item=this.layout.items.find(i=>i.id===this.drag.id);const step=this.snap?.05:.005;
    item.x=Math.max(-2,Math.min(16,Math.round((this.drag.x+p.x-this.drag.px)/step)*step));item.z=Math.max(-2,Math.min(17,Math.round((this.drag.z+p.z-this.drag.pz)/step)*step));
    this.drag.changed=Math.abs(item.x-this.drag.x)+Math.abs(item.z-this.drag.z)>.01;this.moveMesh(item);this.cb.moving(item);return;}
   if(e.pointerType==='mouse')el.style.cursor=this.mode==='move'&&this.hit(e)?'grab':'default';
  },true);
  const end=e=>{if(!this.drag)return;e.stopImmediatePropagation();const changed=this.drag.changed;this.drag=null;this.controls.enabled=true;el.style.cursor='default';if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);if(changed)this.cb.changed();};
  el.addEventListener('pointerup',end,true);el.addEventListener('pointercancel',end,true);
  el.addEventListener('dblclick',e=>{const id=this.hit(e);if(id){const item=this.layout.items.find(i=>i.id===id);this.cb.room(item.room);}});
 }
 screenshot(){this.renderer.render(this.scene,this.camera);return this.renderer.domElement.toDataURL('image/png');}
 projectItem(id){const item=this.layout.items.find(i=>i.id===id);if(!item)return null;const p=new THREE.Vector3(item.x,Math.min(item.h,.7),item.z).project(this.camera);const r=this.renderer.domElement.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};}
}

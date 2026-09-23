import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ROOMS, THEMES, CATALOG, FLOOR_OUTLINES, wallsFor, CLEAR_HEIGHTS, STAIR } from './data.js';
import { corners, pointInPoly, itemWarnings } from './model.js';

const texCache=new Map();
function texture(type){
 if(texCache.has(type))return texCache.get(type);
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');
 let seed=38;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 const colors={oak:['#c4a780','#b99a72'],ash:['#d9ccb4','#cabea5'],walnut:['#97806a','#8b745e'],deck:['#a89274','#988065'],tile:['#d5d3c9','#d9d8cf'],fabric:['#f4f1eb','#e9e5dd'],grain:['#eee9df','#e4ddd1'],plaster:['#f7f5f0','#eeebe4'],limestone:['#eee6d7','#e1d6c2']};
 const pal=colors[type]||colors.oak;ctx.fillStyle=pal[0];ctx.fillRect(0,0,512,512);
 if(type==='plaster'||type==='limestone'){
  for(let i=0;i<18000;i++){ctx.fillStyle=rand()>.5?'rgba(255,255,255,.12)':'rgba(106,88,63,.035)';const r=type==='limestone'?1+rand()*3:1;ctx.fillRect(rand()*512,rand()*512,r,r);}
 }else if(type==='grain'){
  for(let i=0;i<650;i++){const x=rand()*512;ctx.strokeStyle=`rgba(100,76,48,${.02+rand()*.09})`;ctx.lineWidth=.3+rand()*.8;ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+12,180,x-9,350,x+4,512);ctx.stroke();}
 }else if(type==='tile'){
  for(let x=0;x<512;x+=128)for(let y=0;y<512;y+=128){ctx.fillStyle=rand()>.5?pal[0]:pal[1];ctx.fillRect(x+2,y+2,124,124);
   for(let n=0;n<90;n++){ctx.fillStyle=`rgba(255,255,255,${rand()*.055})`;ctx.fillRect(x+rand()*124,y+rand()*124,1,1);}}
  ctx.strokeStyle='rgba(130,117,98,.17)';ctx.lineWidth=1;for(let i=0;i<=512;i+=128){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,512);ctx.moveTo(0,i);ctx.lineTo(512,i);ctx.stroke();}
 }else if(type==='fabric'){
  for(let i=0;i<512;i+=3){ctx.strokeStyle=i%2?'#ede9e0':'#dfd9ce';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,512);ctx.moveTo(0,i);ctx.lineTo(512,i);ctx.stroke();}
  for(let i=0;i<6500;i++){ctx.fillStyle=rand()>.5?'rgba(255,255,255,.13)':'rgba(80,72,60,.08)';ctx.fillRect(rand()*512,rand()*512,1,2);}
 }else{
  for(let i=0;i<8;i++){const x=i*64;ctx.fillStyle=i%3?pal[0]:pal[1];ctx.fillRect(x,0,64,512);
   for(let j=0;j<90;j++){ctx.strokeStyle=`rgba(92,66,38,${.015+rand()*.055})`;ctx.lineWidth=.3+rand();ctx.beginPath();const a=x+rand()*64;ctx.moveTo(a,0);ctx.bezierCurveTo(a+rand()*7,170,a-rand()*7,360,a+rand()*3,512);ctx.stroke();}
   ctx.strokeStyle='rgba(61,43,29,.18)';ctx.lineWidth=2;ctx.strokeRect(x+.5,0,63,512);
   for(const y of [110+(i*113)%95,335+(i*71)%90]){ctx.strokeStyle='rgba(71,52,36,.19)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+64,y);ctx.stroke();}
  }
 }
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(type==='tile'?.75:.55,type==='tile'?.75:.3);t.anisotropy=8;texCache.set(type,t);return t;
}
function material(color,roughness=.8,map){
 const tex=map?texture(map):null;
 return new THREE.MeshStandardMaterial({color,roughness,map:tex,bumpMap:tex,bumpScale:map==='fabric'?.002:map==='plaster'?.0006:.0012,envMapIntensity:.55});
}
function contactShadow(group,w,d){
 let tex=texCache.get('contact');
 if(!tex){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),gradient=ctx.createRadialGradient(32,32,5,32,32,32);gradient.addColorStop(0,'rgba(44,30,19,.5)');gradient.addColorStop(.6,'rgba(44,30,19,.24)');gradient.addColorStop(1,'rgba(44,30,19,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;texCache.set('contact',tex);}
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(w*1.12,d*1.12),new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.32,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.position.y=-.012;shadow.userData.contactShadow=true;shadow.raycast=()=>{};group.add(shadow);
}
function part(group,x,y,z,w,h,d,mat,round=0){
 const geo=round?new RoundedBoxGeometry(w,h,d,4,Math.min(round,w/4,h/4,d/4)):new THREE.BoxGeometry(w,h,d);
 const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
}
function cyl(group,x,y,z,rad,h,mat,top=rad){const m=new THREE.Mesh(new THREE.CylinderGeometry(top,rad,h,32),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
function floorShape(poly){const shape=new THREE.Shape();poly.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();return shape;}

function furniture(item,theme){
 const g=new THREE.Group();const {w,d}=item,c=CATALOG[item.type],h=c.h,col=item.color||theme[c.role]||'#eeeae0';
 const wood=material(item.color&&c.role==='wood'?item.color:theme.wood,.48,'grain'),fabric=material(col,.93,'fabric'),base=material(col,.77),dark=material('#35413d',.57),white=material('#f4f0e8',.5),metal=new THREE.MeshStandardMaterial({color:'#8a8070',metalness:.75,roughness:.3}),stone=material('#efe4d0',.58,'limestone');
 const legs=(height,spread=.08)=>{for(const x of [-w/2+spread,w/2-spread])for(const z of [-d/2+spread,d/2-spread])part(g,x,height/2,z,.045,height,.045,wood,.008);};
 switch(item.type){
 case 'bed':case 'single':{
  legs(.18,.10);part(g,0,.23,0,w,.22,d,wood,.05);part(g,0,.41,.03,w-.05,.19,d-.04,white,.065);
  part(g,0,h/2,-d/2+.04,w+.03,h,.085,wood,.035);
  for(let x=-w/2+.035;x<w/2;x+=.07)part(g,x,h/2,-d/2+.092,.035,h-.045,.012,wood,.004);
  part(g,0,.54,d*.16,w-.07,.11,d*.61,fabric,.055);
  part(g,0,.609,d*.34,w-.12,.022,d*.22,material(theme.accent,.96,'fabric'),.01);
  const n=w>1.4?2:1;for(let i=0;i<n;i++)part(g,(i-(n-1)/2)*(w/n),.565,-d*.30,w/n-.12,.13,d*.23,white,.06);
  break;}
 case 'sofa':case 'armchair':{
  legs(.16,.10);part(g,0,.30,0,w,.32,d,fabric,.075);part(g,0,h-.21,-d/2+.12,w,.42,.22,fabric,.07);
  for(const x of [-w/2+.105,w/2-.105])part(g,x,.48,0,.21,.44,d,fabric,.075);
  const n=item.type==='sofa'?3:1;for(let i=0;i<n;i++)part(g,(i-(n-1)/2)*(w-.42)/n,.515,.035,(w-.45)/n,.16,d-.28,fabric,.065);
  if(w>1.3){for(const side of [-1,1]){const pillow=part(g,side*w*.28,.69,-d*.10,.34,.36,.15,material(side<0?theme.accent:'#d3bea0',.95,'fabric'),.065);pillow.rotation.z=-side*.13;}}
  for(let i=0;i<n;i++){const cushion=part(g,(i-(n-1)/2)*(w-.38)/n,.70,-d*.25,(w-.42)/n,.30,.14,fabric,.06);cushion.rotation.x=-.10;}break;}
 case 'desk':case 'dining':case 'coffee':case 'bench':{
  const ht=item.type==='coffee'?.38:h;legs(ht-.05,.10);part(g,0,ht-.03,0,w,.07,d,item.type==='bench'?fabric:wood,.03);
  if(item.type==='desk'){part(g,w*.3,ht-.16,0,w*.28,.2,d*.85,wood,.015);part(g,0,ht+.013,-d*.19,w*.34,.022,d*.36,dark,.012);}
  if(item.type==='dining'){cyl(g,0,ht+.095,0,.13,.16,stone,.075);const leaves=cyl(g,0,ht+.24,0,.12,.2,material(theme.accent),.04);leaves.rotation.z=.2;}break;}
 case 'chair':{
  const upholstery=material(item.color||theme.fabric,.94,'fabric');legs(.44,.055);part(g,0,.45,0,w,.07,d,wood,.025);part(g,0,h-.15,-d/2+.055,w,.30,.10,upholstery,.045);part(g,0,.51,0,w-.025,.09,d-.025,upholstery,.04);break;}
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
 case 'roundtable':{cyl(g,0,h-.035,0,w/2,.07,stone);cyl(g,0,(h-.06)/2,0,w*.18,h-.06,wood);break;}
 case 'rug':{const rug=material(item.color||'#c4b197',1,'fabric');part(g,0,.012,0,w,.018,d,rug,.008);for(const x of [-w/2+.03,w/2-.03])part(g,x,.022,0,.025,.003,d-.04,material('#b19b7d',1,'fabric'));break;}
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
  for(let i=0;i<7;i++){const a=i*2.4;const leaf=new THREE.Mesh(new THREE.SphereGeometry(.17,8,6),material('#687452',.9));leaf.scale.set(.55,1.9,.25);leaf.position.set(Math.sin(a)*.12,.52+i*.075,Math.cos(a)*.12);leaf.rotation.z=Math.sin(a)*.65;g.add(leaf);}break;}
 }
 if(item.type!=='rug')contactShadow(g,w,d);
 // All parts share a single selectable parent and use metres, not screen pixels.
 g.position.set(item.x,.025,item.z);g.rotation.y=item.rotation*Math.PI/180;g.scale.y=item.h/c.h;g.userData.itemId=item.id;
 g.traverse(m=>{if(m.isMesh)m.userData.itemId=item.id;});return g;
}

export class PlannerScene{
 constructor(container,callbacks={},options={}){
  this.el=container;this.cb=callbacks;this.floor=0;this.view='3d';this.fullWalls=false;this.mode='move';this.snap=true;this.selected=null;this.layout=null;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#eee8de');this.rendering=false;
  this.camera=new THREE.PerspectiveCamera(42,1,.05,180);this.camera.position.set(17,19,24);
  this.renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:false,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(options.animate===false?1:Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.0;this.el.append(this.renderer.domElement);
  const envScene=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(this.renderer);this.envTarget=pmrem.fromScene(envScene,.04);this.scene.environment=this.envTarget.texture;envScene.dispose();pmrem.dispose();
  this.renderer.domElement.setAttribute('aria-label','Сууцын 3D зохион байгуулалт');this.renderer.domElement.setAttribute('role','img');
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.dampingFactor=.09;this.controls.target.set(5,0,6);
  this.controls.maxPolarAngle=Math.PI*.49;this.controls.minDistance=1;this.controls.maxDistance=48;this.controls.screenSpacePanning=false;
  this.scene.add(new THREE.HemisphereLight('#fff4e3','#b3a38f',1.05));
  const sun=new THREE.DirectionalLight('#ffe8c7',3.1);sun.position.set(-6,11,16);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.radius=3;Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:.1,far:50});sun.shadow.bias=-.0005;sun.shadow.normalBias=.012;this.scene.add(sun);
  const fill=new THREE.DirectionalLight('#e5edf5',.45);fill.position.set(14,10,-6);this.scene.add(fill);
  this.world=new THREE.Group();this.scene.add(this.world);this.arch=new THREE.Group();this.furn=new THREE.Group();this.labels=new THREE.Group();this.world.add(this.arch,this.furn,this.labels);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),material('#eee8de'));ground.rotation.x=-Math.PI/2;ground.position.y=-.20;ground.receiveShadow=true;this.scene.add(ground);this.ground=ground;
  this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.plane=new THREE.Plane(new THREE.Vector3(0,1,0),-.025);this.meshes=new Map();this.drag=null;this.frame=null;
  this.bindPointer();this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(container);this.resize();if(options.animate!==false)this.animate();
 }
 clear(group){group.traverse(o=>{if(o.isMesh||o.isLine){o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();}});group.clear();}
 resize(){const {width,height}=this.el.getBoundingClientRect();if(!width||!height)return;this.renderer.setSize(width,height);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();}
 animate=()=>{this.frame=requestAnimationFrame(this.animate);this.controls.update();this.renderer.render(this.scene,this.camera);};
 update(layout,floor=this.floor){this.layout=layout;this.floor=floor;this.ground.position.y=floor===1?-3.2:-.20;this.clear(this.arch);this.interiorCeiling=null;this.clear(this.furn);this.clear(this.labels);this.meshes.clear();this.buildArchitecture();
  for(const item of layout.items.filter(i=>i.floor===floor)){const g=furniture(item,THEMES[layout.theme]);this.furn.add(g);this.meshes.set(item.id,g);}
  this.select(this.selected);this.setInteriorCeiling(this.activeRoom);
 }
 buildArchitecture(){
  const theme=THEMES[this.layout.theme],f=this.floor,wallH=this.fullWalls?CLEAR_HEIGHTS[f]:.48;
  const shape=floorShape(FLOOR_OUTLINES[f]);
  if(f===1){const hole=floorShape([[.10,3.6],[3.8,3.6],[3.8,5.8],[.1,5.8]]);shape.holes.push(hole);}
  const base=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:false}),material('#c4c5b9'));base.rotation.x=-Math.PI/2;base.position.y=-.16;base.receiveShadow=true;this.arch.add(base);
  for(const room of ROOMS.filter(r=>r.floor===f)){
   if(!(f===1&&room.fixed)){
    const floor=new THREE.Mesh(new THREE.ShapeGeometry(floorShape(room.poly)),material(this.layout.surfaces[room.id].floor==='resin'?'#b8b8ae':'#ffffff',.88,this.layout.surfaces[room.id].floor==='resin'?null:this.layout.surfaces[room.id].floor));floor.rotation.x=-Math.PI/2;floor.position.y=.008;floor.receiveShadow=true;floor.userData.roomId=room.id;this.arch.add(floor);
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
    const sideRoom=side=>ROOMS.find(r=>r.floor===f&&!r.outdoor&&pointInPoly(x-uz*.19*side,z+ux*.19*side,r.poly));
    const plus=sideRoom(1),minus=sideRoom(-1),thickness=wall.outer?.45:.125;
    const shift=wall.outer?(plus?-1:1)*thickness/2:0,wx=x-uz*shift,wz=z+ux*shift;
    const finish=(room,tiled)=>material(room?this.layout.surfaces[room.id].wall:theme.wall,.92,tiled&&room?.id.startsWith('bath')?'limestone':'plaster');
    const piece=(lo,hi)=>{
     lo=Math.max(0,Math.min(lo,wallH));hi=Math.max(0,Math.min(hi,wallH));if(hi-lo<.01)return;
     const levels=[lo,...(lo<2.4&&hi>2.4?[2.4]:[]),hi];
     for(let j=0;j<levels.length-1;j++){
      const bottom=levels[j],top=levels[j+1],edge=finish(plus||minus,false);
      const mats=[edge,edge,edge,edge,finish(plus,top<=2.4),finish(minus,top<=2.4)];
      const m=part(this.arch,wx,(bottom+top)/2,wz,e-s+.003,top-bottom,thickness,mats);m.rotation.y=-Math.atan2(uz,ux);
     }
    };
    if(opening){piece(0,opening.sill);piece(opening.sill+opening.h,CLEAR_HEIGHTS[f]);}else piece(0,CLEAR_HEIGHTS[f]);
    // Skirting follows existing solid walls only; door thresholds stay open.
    if(!opening||opening.sill>.1){for(const [side,room] of [[1,plus],[-1,minus]])if(room){const offset=side*(thickness/2+.012);const trim=part(this.arch,wx-uz*offset,.045,wz+ux*offset,e-s,.09,.018,material('#d8cbb9',.8),.004);trim.rotation.y=-Math.atan2(uz,ux);}}
   }
   for(const o of wall.openings){
    const x=wall.a[0]+ux*(o.s+o.e)/2,z=wall.a[1]+uz*(o.s+o.e)/2,width=o.e-o.s;
    if(this.fullWalls){
     const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=-Math.atan2(uz,ux);this.arch.add(g);
     if(o.type==='window'||o.pattern)this.glazing(g,o,wallH);
     else{
      const frame=material(o.mark==='DT'?'#787e78':(theme.door||'#b99468'),.58,'grain');
      for(const dx of [-width/2,width/2])part(g,dx,o.h/2,0,.045,o.h,.18,frame);
      part(g,0,o.h,0,width,.045,.18,frame);
      // Open leaves make the swing and circulation visible without hiding rooms.
      const leaf=new THREE.Group();leaf.position.x=-width/2;leaf.rotation.y=this.view==='inside'?0:(o.swing||1)*Math.PI*.43;g.add(leaf);
      const leafHeight=o.h-.035;part(leaf,width/2,leafHeight/2,0,width-.055,leafHeight,.038,frame,.008);
      part(leaf,width-.13,1.03,.035,.10,.018,.025,material('#655c4b',.32));
      if(o.vent)for(let j=0;j<7;j++)part(leaf,width/2,.24+j*.027,.025,width*.5,.008,.007,material('#676e66'));
     }
    }else if(o.type==='window'){
     const m=part(this.arch,x,.04,z,width,.028,.13,material('#7ba8a2'));m.rotation.y=-Math.atan2(uz,ux);
    }
    if(o.type==='door'&&!this.rendering){
     const pts=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI/2;const lx=-width/2+Math.cos(a)*width,lz=Math.sin(a)*width;pts.push(new THREE.Vector3(x+ux*lx-uz*lz,.025,z+uz*lx+ux*lz));}
     const arc=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineDashedMaterial({color:'#8a9f95',dashSize:.07,gapSize:.055}));arc.computeLineDistances();this.arch.add(arc);
    }
   }
  }
  this.stairs();
  const chimneyH=this.fullWalls?CLEAR_HEIGHTS[f]:1.1;
  part(this.arch,2.2,chimneyH/2,6.225,1.6,chimneyH,.4,material('#aea89a'),.014);
  if(f===0){part(this.arch,2.2,.48,6.435,1.2,.56,.028,material('#333d36'),.018);part(this.arch,2.2,.33,6.455,.8,.06,.014,material('#c18a47'));}
 }
 glazing(g,o,wallH){
  const width=o.w,low=Math.max(0,o.sill),high=Math.min(wallH,o.sill+o.h);
  if(high<=low)return;
  const frame=material('#454e4b',.38),glass=new THREE.MeshPhysicalMaterial({color:'#dcebea',transparent:true,opacity:.14,roughness:.12,metalness:0,depthWrite:false});
  const vertical=x=>part(g,x,(low+high)/2,0,.045,high-low,.075,frame);
  const horizontal=(y,left=-width/2,right=width/2)=>{if(y>=low&&y<=high)part(g,(left+right)/2,y,0,right-left,.045,.075,frame);};
  vertical(-width/2);vertical(width/2);
  horizontal(o.sill);horizontal(o.sill+o.h);
  const panel=part(g,0,(low+high)/2,0,width-.06,high-low-.025,.014,glass);panel.castShadow=false;
  if(['wide','three'].includes(o.pattern)){
   const side=o.pattern==='wide'?.65:.6;vertical(-width/2+side);vertical(width/2-side);horizontal(o.sill+1.135);
  }else if(o.pattern==='asymmetric'){vertical(.035);horizontal(o.sill+1.135,.035,width/2);}
  else if(o.pattern==='stair'){vertical(0);for(const h of [1.13,2.5])horizontal(o.sill+h);}
  else if(o.pattern==='balcony'){for(const x of [-.8,0,.8])vertical(x);horizontal(2.02);}
  else if(o.pattern==='entry'){vertical(-width/2+.5);horizontal(2.1);}
  else if(o.pattern==='glazed-door')horizontal(2.1);
  else horizontal(o.sill+1.135);
  if(o.type==='window'&&o.sill>=0){const sill=part(g,0,o.sill-.025,0,width+.08,.045,.32,material('#e5dfd3',.55));sill.castShadow=false;}
 }

 addRailing(room){
  const railing=new THREE.Group();this.arch.add(railing);const mat=material(room.id==='balcony'?'#626b67':'#817563');
  const glass=new THREE.MeshPhysicalMaterial({color:'#c8dedc',transparent:true,opacity:.17,roughness:.12,depthWrite:false});
  const edges=room.id==='balcony'?[[[-.35,10.05],[-.35,11.95]],[[-.35,11.95],[4.95,11.95]],[[4.95,10.05],[4.95,11.95]]]:[[[12.15,-.35],[12.15,13.85]],[[-.35,13.85],[12.15,13.85]]];
  for(const [a,b] of edges){const len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(len/1.5),angle=-Math.atan2(b[1]-a[1],b[0]-a[0]);
   for(let i=0;i<=n;i++){const t=i/n;part(railing,a[0]+(b[0]-a[0])*t,.48,a[1]+(b[1]-a[1])*t,.07,.97,.07,mat);}
   const beam=part(railing,(a[0]+b[0])/2,.97,(a[1]+b[1])/2,len,.045,.05,mat);beam.rotation.y=angle;
   if(room.id==='balcony'){const panel=part(railing,(a[0]+b[0])/2,.49,(a[1]+b[1])/2,len-.08,.90,.015,glass);panel.rotation.y=angle;panel.castShadow=false;}
   else for(let t=.15;t<len;t+=.16)part(railing,a[0]+(b[0]-a[0])*t/len,.48,a[1]+(b[1]-a[1])*t/len,.03,.90,.03,mat);
  }
 }
 stairs(){
  const offset=this.floor===1?-3:0,mat=material('#d6c8b3',.7,'limestone'),glass=new THREE.MeshPhysicalMaterial({color:'#ccdedb',transparent:true,opacity:.2,roughness:.12,depthWrite:false});
  for(let i=0;i<STAIR.treads;i++){
   const h=(i+1)*STAIR.rise;part(this.arch,3.75-i*STAIR.tread,offset+h/2,5.275,STAIR.tread,h,STAIR.flightWidth,mat);
   const h2=1.5+(i+1)*STAIR.rise;part(this.arch,1.35+i*STAIR.tread,offset+h2/2,4.025,STAIR.tread,h2,STAIR.flightWidth,mat);
  }
  part(this.arch,.6,offset+.75,4.65,STAIR.landing,1.5,2.4,mat);
  const guard=(x1,y1,x2,y2)=>{const pts=[new THREE.Vector3(x1,y1,4.65),new THREE.Vector3(x2,y2,4.65),new THREE.Vector3(x2,y2+STAIR.guardHeight,4.65),new THREE.Vector3(x1,y1+STAIR.guardHeight,4.65)];
   const geo=new THREE.BufferGeometry().setFromPoints([pts[0],pts[1],pts[2],pts[0],pts[2],pts[3]]);geo.computeVertexNormals();const panel=new THREE.Mesh(geo,glass);panel.material.side=THREE.DoubleSide;this.arch.add(panel);
   const rail=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,Math.hypot(x2-x1,y2-y1),12),material('#737c75',.35));rail.position.set((x1+x2)/2,(y1+y2)/2+STAIR.guardHeight,4.65);rail.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(x2-x1,y2-y1,0).normalize());this.arch.add(rail);
  };
  guard(3.9,offset+.15,1.2,offset+1.5);guard(1.2,offset+1.5,3.9,offset+3);
 }

 select(id){this.selected=id;this.selection?.removeFromParent();if(this.selection){this.selection.geometry.dispose();this.selection.material.dispose();}this.selection=null;const item=this.layout?.items.find(i=>i.id===id&&i.floor===this.floor);if(!item)return;
  const pts=corners(item,.04).map(([x,z])=>new THREE.Vector3(x,.035,z));pts.push(pts[0]);const bad=itemWarnings(item,this.layout).length>0;
  this.selection=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:bad?'#bd6540':'#17876f',depthTest:false}));this.selection.renderOrder=99;this.scene.add(this.selection);
 }
 moveMesh(item){const mesh=this.meshes.get(item.id);if(mesh){mesh.position.set(item.x,.025,item.z);mesh.rotation.y=item.rotation*Math.PI/180;}this.select(item.id);}
 setFloor(f){this.update(this.layout,f);this.home();}
 setView(view,room){this.view=view;this.controls.enableRotate=view!=='top';this.fullWalls=view==='inside';this.update(this.layout);this.focus(room||'all');}
 setInteriorCeiling(id){
  if(this.interiorCeiling){this.interiorCeiling.removeFromParent();this.interiorCeiling.geometry.dispose();this.interiorCeiling.material.dispose();this.interiorCeiling=null;}
  const room=ROOMS.find(r=>r.id===id&&r.floor===this.floor);
  if(this.view!=='inside'||!room||room.outdoor||room.fixed)return;
  const mat=material('#f5efe5',.95,'plaster');mat.side=THREE.DoubleSide;
  const ceiling=new THREE.Mesh(new THREE.ShapeGeometry(floorShape(room.poly)),mat);
  ceiling.rotation.x=-Math.PI/2;ceiling.position.y=CLEAR_HEIGHTS[this.floor];this.arch.add(ceiling);this.interiorCeiling=ceiling;
 }
 focus(id){this.activeRoom=id;this.setInteriorCeiling(id);const room=ROOMS.find(r=>r.id===id);const center=room?room.focus:[5.5,this.floor?5.4:6.5];
  if(this.view==='inside'&&room){
   const views={living:[[4.22,1.65,10.75],[1.85,1.15,8.4]],kitchen:[[4.95,1.65,9.15],[7.65,1.3,6.15]],guest:[[4.35,1.65,2.35],[1.6,1.05,.8]],bath1:[[6.85,1.65,2.35],[5.95,1.05,.65]],bath2:[[5.65,1.65,2.35],[6.55,1.05,.55]],utility:[[8.3,1.65,2.35],[8.5,1.2,.3]],hall1:[[8.95,1.65,3.4],[4.6,1.1,4.8]],stairs1:[[3.75,1.65,5.6],[1.3,1.7,4.7]],master:[[8.95,1.65,9.05],[6.5,1.1,5.6]],kids:[[4.5,1.65,2.3],[1.4,1,.95]],child:[[7.1,1.65,4.1],[8.3,1.1,.7]],hall2:[[5.1,1.65,5.5],[5.55,1.15,3.2]],stairs2:[[3.6,1.65,5.55],[.65,.4,4.5]],terrace:[[11.5,1.65,13.4],[6.5,1.1,10.8]],balcony:[[4.45,1.65,11.45],[1.8,1.1,9.55]]};
   const [pos,target]=views[room.id];this.camera.fov=['bath1','bath2','child','hall2','utility'].includes(room.id)?66:58;this.camera.updateProjectionMatrix();
   this.camera.position.set(...pos);this.controls.target.set(...target);this.controls.maxPolarAngle=Math.PI*.73;
  }else{
   this.camera.fov=42;this.camera.updateProjectionMatrix();
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
 renderRoom(roomId,layout,view='inside'){
  const room=ROOMS.find(r=>r.id===roomId);if(!room)throw Error('Unknown room');
  this.rendering=true;this.selected=null;this.view=view;this.fullWalls=true;this.update(layout,room.floor);this.focus(room.id);
  this.controls.update();return this.screenshot();
 }
 dispose(){cancelAnimationFrame(this.frame);this.ro.disconnect();this.controls.dispose();this.clear(this.arch);this.clear(this.furn);this.clear(this.labels);this.ground.geometry.dispose();this.ground.material.dispose();this.envTarget.dispose();this.renderer.dispose();this.renderer.domElement.remove();}
 screenshot(){this.renderer.render(this.scene,this.camera);return this.renderer.domElement.toDataURL('image/png');}
 projectItem(id){const item=this.layout.items.find(i=>i.id===id);if(!item)return null;const p=new THREE.Vector3(item.x,Math.min(item.h,.7),item.z).project(this.camera);const r=this.renderer.domElement.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};}
}

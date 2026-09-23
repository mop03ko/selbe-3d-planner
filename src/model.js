import {ROOMS,CATALOG,THEMES,initialLayout,wallsFor,PLAN_REVISION} from './data.js';
export const LEGACY_STORE_KEY='selbe-layout-v1';
export const STORE_KEY='selbe-layout-v2';
export function pointInPoly(x,z,poly){
 let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const [a,b]=poly[i],[c,d]=poly[j];
  const cross=(x-a)*(d-b)-(z-b)*(c-a);
  if(Math.abs(cross)<1e-7&&x>=Math.min(a,c)-1e-7&&x<=Math.max(a,c)+1e-7&&z>=Math.min(b,d)-1e-7&&z<=Math.max(b,d)+1e-7)return true;
  if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)inside=!inside;
 }return inside;
}
export function corners(item,margin=0){const rad=item.rotation*Math.PI/180,c=Math.cos(rad),s=Math.sin(rad);return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>{const x=a*(item.w/2+margin),z=b*(item.d/2+margin);return [item.x+x*c+z*s,item.z-x*s+z*c];});}
export function polygonsOverlap(a,b,tolerance=.025){
 for(const poly of [a,b])for(let i=0;i<poly.length;i++){
  const p=poly[i],q=poly[(i+1)%poly.length],axis=[-(q[1]-p[1]),q[0]-p[0]],len=Math.hypot(...axis);axis[0]/=len;axis[1]/=len;
  const pa=a.map(v=>v[0]*axis[0]+v[1]*axis[1]),pb=b.map(v=>v[0]*axis[0]+v[1]*axis[1]);
  if(Math.max(...pa)<=Math.min(...pb)+tolerance||Math.max(...pb)<=Math.min(...pa)+tolerance)return false;
 }return true;
}
export function itemWarnings(item,layout){
 const warnings=[],room=ROOMS.find(r=>r.id===item.room),poly=corners(item,-.025);
 if(!poly.every(([x,z])=>pointInPoly(x,z,room.poly)))warnings.push('Өрөөний хязгаараас гарсан');
 if(item.type!=='rug'){
  const other=layout.items.find(i=>i.id!==item.id&&i.floor===item.floor&&i.type!=='rug'&&polygonsOverlap(corners(item),corners(i)));
  if(other)warnings.push(`${other.label}тай давхцаж байна`);
 }
 // Openings remain accessible: warn about furniture in the doorway approach.
 for(const wall of wallsFor(item.floor))for(const o of wall.openings.filter(o=>o.type==='door')){
  const len=Math.hypot(wall.b[0]-wall.a[0],wall.b[1]-wall.a[1]),ux=(wall.b[0]-wall.a[0])/len,uz=(wall.b[1]-wall.a[1])/len;
  const a=[wall.a[0]+ux*o.s,wall.a[1]+uz*o.s],b=[wall.a[0]+ux*o.e,wall.a[1]+uz*o.e],nx=-uz*.35,nz=ux*.35;
  const opening=[[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]];
  if(item.type!=='rug'&&polygonsOverlap(poly,opening)){warnings.push('Хаалганы ойролцоо зай бага');break;}
 }
 return [...new Set(warnings)];
}
const hex=/^#[0-9a-f]{6}$/i;
export function validateLayout(raw){
 if(!raw||![1,2].includes(raw.version)||!Object.hasOwn(THEMES,raw.theme)||!Array.isArray(raw.items)||raw.items.length>250)throw Error('Тохирох Сэлбэ хувилбарын файл биш.');
 const ids=new Set();const items=raw.items.map(i=>{
  const room=ROOMS.find(r=>r.id===i?.room);
  if(!i||typeof i.id!=='string'||!/^[-\w]{1,80}$/.test(i.id)||ids.has(i.id)||!Object.hasOwn(CATALOG,i.type)||!room||i.floor!==room.floor||typeof i.label!=='string'||i.label.length>80)throw Error('Тавилгын мэдээлэл буруу байна.');
  for(const key of ['x','z','w','d','h','rotation'])if(typeof i[key]!=='number'||!Number.isFinite(i[key]))throw Error('Хэмжээс тоон утгатай байх ёстой.');
  if(i.x< -3||i.x>17||i.z< -3||i.z>18||i.w<.15||i.w>5||i.d<.15||i.d>5||i.h<.01||i.h>3)throw Error('Хэмжээс зөвшөөрөгдөх хязгаараас гарсан.');
  if(i.color&&!hex.test(i.color))throw Error('Өнгө буруу байна.');ids.add(i.id);
  return {id:i.id,room:i.room,floor:i.floor,type:i.type,label:i.label,x:i.x,z:i.z,w:i.w,d:i.d,h:i.h,rotation:((i.rotation%360)+360)%360,locked:!!i.locked,...(i.color?{color:i.color}:{})};
 });
 const surfaces={};for(const r of ROOMS){const s=raw.surfaces?.[r.id];if(!s||!hex.test(s.wall)||!['oak','ash','walnut','tile','deck','resin'].includes(s.floor))throw Error('Өрөөний материалын мэдээлэл дутуу.');surfaces[r.id]={wall:s.wall,floor:s.floor};}
 return {version:2,planRevision:PLAN_REVISION,theme:raw.theme,items,surfaces};
}
export function loadLayout(storage){try{const raw=storage.getItem(STORE_KEY);return raw?validateLayout(JSON.parse(raw)):initialLayout();}catch{return initialLayout();}}
export class History{
 constructor(layout){this.entries=[JSON.stringify(layout)];this.index=0;}
 push(layout){const s=JSON.stringify(layout);if(s===this.entries[this.index])return;this.entries.splice(this.index+1);this.entries.push(s);if(this.entries.length>60)this.entries.shift();this.index=this.entries.length-1;}
 undo(){if(this.index>0)return JSON.parse(this.entries[--this.index]);return null;}
 redo(){if(this.index<this.entries.length-1)return JSON.parse(this.entries[++this.index]);return null;}
}

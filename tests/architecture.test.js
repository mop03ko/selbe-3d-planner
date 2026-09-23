import test from 'node:test';
import assert from 'node:assert/strict';
import {wallsFor,STAIR,initialLayout,OPENING_TYPES,PLAN_REVISION} from '../src/data.js';
import {loadLayout,validateLayout,STORE_KEY,LEGACY_STORE_KEY} from '../src/model.js';
test('Source window schedule, stair alignment and door heights stay consistent',()=>{
 const byMark=(f,m)=>wallsFor(f).flatMap(w=>w.openings).filter(o=>o.mark===m);
 assert.equal(byMark(0,'C4').length,2);assert.equal(byMark(1,'C4').length,3);
 for(const f of [0,1]){
  for(const w of wallsFor(f))for(const o of w.openings){assert(o.s>=0);assert(o.e<=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1])+1e-6);assert(Math.abs(o.e-o.s-OPENING_TYPES[o.mark].w)<1e-8);}
  for(const o of byMark(f,'C4'))assert.deepEqual([o.w,o.h,o.sill],[1.5,1.8,f?.7:.6]);
  const stair=byMark(f,'C3')[0];assert.equal(stair.h,4);assert.equal(stair.sill+f*3,1.5);
  assert(byMark(f,'D1').every(o=>o.h===2.2));
  assert.equal(byMark(f,'C2')[0].w,3.6);
 }
 assert.equal(STAIR.rise*STAIR.risers,1.5);assert(Math.abs(STAIR.tread*STAIR.treads-2.7)<1e-8);
});
test('Furniture and finishes reflect the audited ground-floor scheme',()=>{
 const l=initialLayout();assert.equal(l.planRevision,PLAN_REVISION);
 assert.equal(l.items.filter(i=>i.room==='kitchen'&&i.type==='chair').length,8);
 assert.equal(l.items.filter(i=>i.room==='living'&&i.type==='armchair').length,4);
 assert.equal(l.items.filter(i=>i.room==='living'&&i.type==='roundtable').length,2);
 const sofa=l.items.find(i=>i.type==='sofa');assert(sofa.z>10);assert.equal(sofa.rotation,180);
 assert.equal(l.surfaces.utility.floor,'resin');assert.equal(l.surfaces.terrace.floor,'tile');assert.equal(l.surfaces.balcony.floor,'tile');
});
test('Legacy saved layouts are preserved and remain explicitly importable',()=>{
 const legacy={...initialLayout(),version:1};delete legacy.planRevision;legacy.items[0].x=2.1;
 const values=new Map([[LEGACY_STORE_KEY,JSON.stringify(legacy)]]),before=values.get(LEGACY_STORE_KEY);
 const l=loadLayout({getItem:k=>values.get(k)});assert.equal(l.version,2);assert.equal(values.get(LEGACY_STORE_KEY),before);assert(!values.has(STORE_KEY));
 assert.equal(validateLayout(legacy).items[0].x,2.1);assert.equal(validateLayout(legacy).version,2);
});

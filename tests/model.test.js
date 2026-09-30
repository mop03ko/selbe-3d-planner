import test from 'node:test';
import assert from 'node:assert/strict';
import {ROOMS,initialLayout,DEFAULT_ITEMS} from '../src/data.js';
import {validateLayout,pointInPoly,corners,polygonsOverlap,itemWarnings,History,loadLayout,STORE_KEY,LEGACY_STORE_KEY} from '../src/model.js';

test('Both source floors and all source room areas are represented',()=>{
 assert.equal(ROOMS.length,15);assert.equal(ROOMS.filter(r=>r.floor===0).length,8);
 assert.equal(Math.round(ROOMS.filter(r=>!r.outdoor).reduce((a,r)=>a+r.area,0)*100)/100,180.96);
 const layout=initialLayout();assert.doesNotThrow(()=>validateLayout(layout));
 for(const i of layout.items)assert.deepEqual(itemWarnings(i,layout),[],`${i.room}/${i.type} must start in a valid location`);
});
test('A moved object detects overlap and a rotated footprint stays mathematically correct',()=>{
 const layout=initialLayout(),sofa=layout.items.find(i=>i.type==='sofa'),table=layout.items.find(i=>i.type==='coffee');
 assert.equal(Math.round((Math.max(...corners(sofa).map(p=>p[0]))-Math.min(...corners(sofa).map(p=>p[0])))*1000),871);
 sofa.x=table.x;sofa.z=table.z;assert(itemWarnings(sofa,layout).some(x=>x.includes('давхцаж')));
 sofa.x=20;assert(itemWarnings(sofa,layout).some(x=>x.includes('хязгаараас')));
});
test('Concave rooms and touching furniture are handled correctly',()=>{
 const p=ROOMS.find(r=>r.id==='guest').poly;assert(pointInPoly(1,3,p));assert(!pointInPoly(4.8,3,p));
 assert(!polygonsOverlap([[0,0],[1,0],[1,1],[0,1]],[[1,0],[2,0],[2,1],[1,1]]));
});
test('Exports round trip while malformed imports fail before state replacement',()=>{
 const layout=initialLayout();layout.items[0].x+=.1;layout.items[0].color='#123456';
 assert.equal(validateLayout(JSON.parse(JSON.stringify(layout))).items[0].x,layout.items[0].x);
 for(const mutation of [l=>l.items[0].w=NaN,l=>l.items[0].room='unknown',l=>l.items[0].color='url(test)',l=>l.items[1].id=l.items[0].id,l=>l.version=9,l=>delete l.surfaces.guest,l=>l.items[0]=null,l=>l.items[0].id='" onclick="test',l=>l.items[0].type='__proto__',l=>l.theme='constructor']){
  const l=initialLayout();mutation(l);assert.throws(()=>validateLayout(l));
 }
});
test('Undo, redo and branch edits retain independent snapshots',()=>{
 const layout=initialLayout(),h=new History(layout),x=layout.items[0].x;
 layout.items[0].x+=1;h.push(layout);layout.items[0].x+=1;h.push(layout);
 assert.equal(h.undo().items[0].x,x+1);assert.equal(h.undo().items[0].x,x);assert.equal(h.redo().items[0].x,x+1);
 const fork=h.undo();fork.items[0].x=7;h.push(fork);assert.equal(h.redo(),null);assert.equal(h.undo().items[0].x,x);
});
test('Corrupt or unavailable local storage does not prevent opening the app',()=>{
 assert.equal(loadLayout({getItem:()=>'{'}).items.length,DEFAULT_ITEMS.length);
 assert.equal(loadLayout({getItem:()=>{throw Error('blocked')}}).items.length,DEFAULT_ITEMS.length);
});

test('January 2026 plan has eight dining seats and revised bedrooms',()=>{
 const l=initialLayout();
 assert.equal(l.items.filter(i=>i.room==='kitchen'&&i.type==='chair').length,8);
 assert.equal(l.items.filter(i=>i.type==='bed').length,3);
 assert.equal(l.items.filter(i=>i.type==='single').length,1);
 assert.equal(l.items.filter(i=>i.room==='master'&&i.type==='armchair').length,4);
 assert.equal(l.surfaces.master.floor,'tile');
 assert.equal(l.surfaces.kitchen.floor,'herringbone');
});

test('New defaults never overwrite the previous local plan; existing revision edits survive reload',()=>{
 const legacy=initialLayout();legacy.theme='natural';legacy.items[0].x=2.25;
 for(const surface of Object.values(legacy.surfaces))surface.floor='oak';
 const legacyJson=JSON.stringify(legacy),map=new Map([[LEGACY_STORE_KEY,legacyJson]]);
 const storage={getItem:key=>map.get(key),setItem:(key,value)=>map.set(key,value)};
 assert.equal(loadLayout(storage).theme,'ano2026');
 assert.equal(map.get(LEGACY_STORE_KEY),legacyJson);
 assert.equal(validateLayout(JSON.parse(legacyJson)).items[0].x,2.25);
 const revision=initialLayout();revision.items[0].x=1.9;storage.setItem(STORE_KEY,JSON.stringify(revision));
 assert.equal(loadLayout(storage).items[0].x,1.9);
 assert.equal(map.get(LEGACY_STORE_KEY),legacyJson);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {ROOMS,initialLayout} from '../src/data.js';
import {validateLayout,pointInPoly,corners,polygonsOverlap,itemWarnings,History,loadLayout} from '../src/model.js';

test('Both source floors and all source room areas are represented',()=>{
 assert.equal(ROOMS.length,15);assert.equal(ROOMS.filter(r=>r.floor===0).length,8);
 assert.equal(Math.round(ROOMS.filter(r=>!r.outdoor).reduce((a,r)=>a+r.area,0)*100)/100,180.96);
 const layout=initialLayout();assert.equal(layout.items.length,60);assert.doesNotThrow(()=>validateLayout(layout));
 for(const i of layout.items)assert.deepEqual(itemWarnings(i,layout),[],`${i.room}/${i.type} must start in a valid location`);
});
test('A moved object detects overlap and a rotated footprint stays mathematically correct',()=>{
 const layout=initialLayout(),sofa=layout.items.find(i=>i.type==='sofa'),table=layout.items.find(i=>i.type==='roundtable');
 sofa.rotation=90;
 assert.equal(Math.round((Math.max(...corners(sofa).map(p=>p[0]))-Math.min(...corners(sofa).map(p=>p[0])))*100),85);
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
 assert.equal(loadLayout({getItem:()=>'{'}).items.length,60);
 assert.equal(loadLayout({getItem:()=>{throw Error('blocked')}}).items.length,60);
});

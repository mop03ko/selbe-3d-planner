import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {ROOMS} from '../src/data.js';

test('Every source page and legacy image is reachable with explicit attribution',()=>{
 const rooms=JSON.parse(readFileSync(new URL('../public/renders/rooms.json',import.meta.url),'utf8'));
 const pages=[];
 assert.deepEqual(rooms.map(r=>r.id).sort(),ROOMS.map(r=>r.id).sort());
 for(const room of rooms){
  for(const image of room.images)assert(existsSync(new URL('../public/'+image,import.meta.url)),image);
  assert(existsSync(new URL(`../public/renders/${room.id}.png`,import.meta.url)));
  assert(room.legacyDescription);
  if(room.sourcePages){assert.match(room.credit,/ANO Design/);assert.equal(room.sourcePages.length,room.images.length);pages.push(...room.sourcePages);}
  else assert.match(room.credit,/AI/);
 }
 assert.deepEqual(pages.sort((a,b)=>a-b),Array.from({length:40},(_,i)=>i+2));
});

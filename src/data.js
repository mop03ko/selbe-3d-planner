export const THEMES = {
  ano2026:{name:'ANO · 2026 ажлын зураг',wall:'#f2eee5',wood:'#bea584',fabric:'#e3d9c8',accent:'#c45f32',kitchen:'#eee5d2',upper:'#cd622f',floor:'herringbone',image:'./references/ano-2026/interior-06.jpg'},
  natural:{name:'Дулаан байгалийн', wall:'#f3eee4',wood:'#b99162',fabric:'#c9c0aa',accent:'#82927c',kitchen:'#e7dfcd',floor:'oak',image:'./inspiration/kitchen-natural.png'},
  sage:{name:'Бүдэг ногоон',wall:'#f3f1e9',wood:'#c2a77d',fabric:'#d0cfc4',accent:'#78927b',kitchen:'#829078',floor:'ash',image:'./inspiration/kitchen-sage.png'},
  walnut:{name:'Хушга + шаргал',wall:'#e5ded2',wood:'#775942',fabric:'#b5a391',accent:'#a66f51',kitchen:'#aaa18f',floor:'oak',image:'./inspiration/kitchen-walnut.png'},
};
const R=(x,z,w,d)=>[[x,z],[x+w,z],[x+w,z+d],[x,z+d]];
export const ROOMS=[
  {id:'living',floor:0,name:'Зочны өрөө',area:25.04,tag:'Нийтийн',poly:R(0,6.025,4.6,5.575),focus:[2.4,8.8]},
  {id:'kitchen',floor:0,name:'Гал тогоо · хооллох',area:21.09,tag:'Нийтийн',poly:[[5.7,5.225],[9.6,5.225],[9.6,9.6],[4.6,9.6],[4.6,6.025],[5.7,6.025]],focus:[7.2,7.5]},
  {id:'guest',floor:0,name:'Унтлагын өрөө · 1-р давхар',area:16.48,tag:'Унтлагын',poly:[[0,0],[5.175,0],[5.175,2.675],[3.775,2.675],[3.775,3.375],[0,3.375]],focus:[2.5,1.65]},
  {id:'bath1',floor:0,name:'Угаалгын өрөө',area:5.21,tag:'Үйлчилгээ',poly:R(5.3,0,1.95,2.675),focus:[6.28,1.3],tile:true},
  {id:'utility',floor:0,name:'Техникийн өрөө',area:5.95,tag:'Үйлчилгээ',poly:R(7.375,0,2.225,2.675),focus:[8.5,1.3],tile:true},
  {id:'hall1',floor:0,name:'Үүд · хонгил',area:14.68,tag:'Холбоос',poly:[[3.9,2.8],[9.6,2.8],[9.6,5.10],[5.575,5.10],[5.575,6.025],[3.9,6.025]],focus:[6.4,3.85]},
  {id:'stairs1',floor:0,name:'Шатны хэсэг',area:9.36,tag:'Холбоос',poly:R(0,3.5,3.9,2.4),focus:[2,4.7],fixed:true},
  {id:'terrace',floor:0,name:'Террас',area:57.92,tag:'Гадна',poly:[[10.05,-.35],[12.15,-.35],[12.15,13.85],[-.35,13.85],[-.35,12.05],[4.6,12.05],[4.6,10.05],[10.05,10.05]],focus:[7,11.7],outdoor:true},
  {id:'master',floor:1,name:'Эцэг эхийн өрөө',area:33.95,tag:'Унтлагын',poly:[[5.825,4.625],[9.6,4.625],[9.6,9.6],[1.4,9.6],[1.4,6.025],[5.825,6.025]],focus:[5.8,7.5]},
  {id:'kids',floor:1,name:'Унтлагын өрөө · 2 хүн',area:16.48,tag:'Унтлагын',poly:[[0,0],[5.175,0],[5.175,2.675],[3.775,2.675],[3.775,3.375],[0,3.375]],focus:[2.5,1.65]},
  {id:'child',floor:1,name:'Унтлагын өрөө · 1 хүн',area:10.94,tag:'Унтлагын',poly:[[7.375,0],[9.6,0],[9.6,4.5],[6.825,4.5],[6.825,2.8],[7.375,2.8]],focus:[8.35,2.2]},
  {id:'bath2',floor:1,name:'Ариун цэврийн өрөө',area:5.21,tag:'Үйлчилгээ',poly:R(5.3,0,1.95,2.675),focus:[6.28,1.3],tile:true},
  {id:'hall2',floor:1,name:'Хонгил',area:7.27,tag:'Холбоос',poly:[[3.9,2.8],[6.7,2.8],[6.7,4.5],[5.7,4.5],[5.7,5.9],[3.9,5.9]],focus:[5.2,4.2]},
  {id:'stairs2',floor:1,name:'Шатны хэсэг',area:9.3,tag:'Холбоос',poly:R(0,3.5,3.9,2.4),focus:[2,4.7],fixed:true},
  {id:'balcony',floor:1,name:'Тагт',area:10.6,tag:'Гадна',poly:[[-.35,6.025],[1.17,6.025],[1.17,9.83],[4.83,9.83],[4.83,11.95],[-.35,11.95]],focus:[2.3,11],outdoor:true},
];
export const FLOOR_OUTLINES=[[[0,0],[9.6,0],[9.6,9.6],[4.6,9.6],[4.6,11.6],[0,11.6]],[[0,0],[9.6,0],[9.6,9.6],[1.4,9.6],[1.4,6.025],[0,6.025]]];
// Wall segment openings: start/end distance from a, sill and height in metres.
const win=(s,e,sill=.8,h=1.8)=>({s,e,sill,h,type:'window'});
const door=(s,e)=>({s,e,sill:0,h:2.6,type:'door'});
const wall=(a,b,openings=[],outer=false)=>({a,b,openings,outer});
export function wallsFor(f){
 const upper=f===1;
 let w=[wall([0,0],[9.6,0],upper?[win(5.95,6.55)]:[win(5.95,6.55),win(8.1,8.7)],true),
 wall([0,0],[0,upper?6.025:11.6],upper?[win(1.1,2.6),win(4.2,5.4,1.8,.4)]:[win(1.1,2.6),win(4.2,5.4,1.8,.4),win(6.5,7.3)],true),
 wall([9.6,0],[9.6,9.6],upper?[win(1.1,2.6),win(6.2,7.7)]:[door(2.85,4.35),door(6.55,7.45),win(7.85,9.35)],true),
 wall([0,3.375],[3.775,3.375]),wall([3.775,2.675],[3.775,3.375]),
 wall([3.775,2.675],[5.3,2.675],[door(.3,1.26)]),wall([5.2375,0],[5.2375,2.675]),
 wall([5.3,2.675],[7.375,2.675],[door(.3,1.16)]),
 wall([7.3125,0],[7.3125,2.675]),wall([0,6.025],[3.9,6.025])];
 if(upper)w.push(wall([7.375,2.8],[6.825,2.8]),wall([6.825,2.8],[6.825,4.5],[door(0,.96)]),wall([6.825,4.5625],[9.6,4.5625]),
 wall([3.9,6.025],[5.825,6.025],[door(.64,1.6)]),wall([5.825,4.625],[5.825,6.025]),
 wall([1.4,6.025],[1.4,9.6],[win(1.075,2.875)],true),wall([1.4,9.6],[9.6,9.6],[door(.8,3.2),win(4.5,7.7)],true));
 else w.push(wall([7.375,2.675],[9.6,2.675],[door(.875,1.835)]),wall([5.7,5.225],[9.6,5.225]),wall([5.7,5.225],[5.7,6.025]),
 wall([4.6,9.6],[9.6,9.6],[win(.6,4.2)],true),wall([4.6,9.6],[4.6,11.6],[],true),wall([0,11.6],[4.6,11.6],[win(.8,4.2)],true));
 return w;
}
export const CATALOG={
 sofa:{name:'Буйдан',w:2.6,d:.95,h:.85,category:'Зочны',role:'fabric'},
 armchair:{name:'Зөөлөн сандал',w:.8,d:.8,h:.8,category:'Зочны',role:'accent'},
 coffee:{name:'Кофены ширээ',w:1.2,d:.6,h:.4,category:'Зочны',role:'wood'},
 tv:{name:'ТВ + тавиур',w:1.8,d:.35,h:1.4,category:'Зочны',role:'wood'},
 rug:{name:'Хивс',w:2.4,d:1.7,h:.02,category:'Зочны',role:'fabric'},
 bed:{name:'Хоёр хүний ор',w:1.8,d:2,h:.95,category:'Унтлагын',role:'fabric'},
 single:{name:'Нэг хүний ор',w:.9,d:2,h:.85,category:'Унтлагын',role:'fabric'},
 nightstand:{name:'Орны хажуугийн шүүгээ',w:.5,d:.45,h:.5,category:'Унтлагын',role:'wood'},
 wardrobe:{name:'Хувцасны шүүгээ',w:1.8,d:.6,h:2.35,category:'Хадгалалт',role:'wood'},
 shelf:{name:'Номын тавиур',w:1.2,d:.35,h:1.5,category:'Хадгалалт',role:'wood'},
 desk:{name:'Ажлын ширээ',w:1.35,d:.6,h:.75,category:'Ажлын',role:'wood'},
 dining:{name:'Хоолны ширээ',w:1.8,d:.9,h:.76,category:'Гал тогоо',role:'wood'},
 chair:{name:'Сандал',w:.45,d:.45,h:.85,category:'Ажлын',role:'wood'},
 kitchen:{name:'Шулуун гал тогоо',w:3.9,d:.6,h:2.4,category:'Гал тогоо',role:'kitchen'},
 bench:{name:'Үүдний сандал',w:1,d:.45,h:.48,category:'Хадгалалт',role:'wood'},
 bath:{name:'Ванн',w:1.75,d:.72,h:.57,category:'Угаалгын',role:'white'},
 sink:{name:'Угаалтуур',w:.5,d:.5,h:.85,category:'Угаалгын',role:'white'},
 toilet:{name:'Суултуур',w:.4,d:.65,h:.72,category:'Угаалгын',role:'white'},
 washer:{name:'Угаалгын машин',w:.6,d:.6,h:.85,category:'Угаалгын',role:'white'},
 utility:{name:'Техникийн төхөөрөмж',w:1.2,d:.7,h:1.7,category:'Угаалгын',role:'white'},
 plant:{name:'Тасалгааны ургамал',w:.45,d:.45,h:1.1,category:'Зочны',role:'accent'},
};
let next=0;const items=[];
function put(room,type,x,z,w,d,rotation=0,options={}){
 const r=ROOMS.find(r=>r.id===room),c=CATALOG[type];items.push({id:`base-${++next}`,room,floor:r.floor,type,label:c.name,x:x+w/2,z:z+d/2,w,d,h:c.h,rotation,...options});
}
function seat(room,x,z,rot=0){put(room,'chair',x,z,.45,.45,rot);}

// Coordinates in metres, simplified from ANO Design 2026/01 sheets 3 and 23.
// This helper accepts a centre to avoid swapped footprints on rotated furniture.
function centre(room,type,x,z,w,d,rotation=0,options={}){put(room,type,x-w/2,z-d/2,w,d,rotation,options);}
for(const r of ['guest','kids']){
 put(r,'bed',1.06,.05,1.65,2);
 put(r,'nightstand',.51,.05,.5,.4);put(r,'nightstand',2.76,.05,.5,.4);
 put(r,'desk',3.34,.05,1.2,.5,0,{label:'Гоёлын ширээ'});seat(r,3.72,.68,180);
 centre(r,'wardrobe',4.88,.875,1.65,.55,-90,{color:'#e7dfd0'});
 put(r,'tv',.688,3.0,2.4,.35,180,{color:'#e7dfd0'});
}
put('utility','utility',7.65,.2,1.2,.7,0,{locked:true});
for(const r of ['bath1','bath2']){
 put(r,'bath',5.325,.025,r==='bath1'?1.8:1.9,.8,0,{locked:true});
 centre(r,'sink',6.95,1.3,.5,.55,-90,{locked:true});
 centre(r,'toilet',6.85,2.05,.4,.65,-90,{locked:true});
}
put('hall1','wardrobe',5.75,4.55,2.45,.5,180,{color:'#e8dfcc'});
put('hall1','bench',8.25,4.55,1.15,.5,180,{color:'#c45f32'});
put('kitchen','kitchen',5.7,5.225,3.6,.6,0,{locked:true});
put('kitchen','dining',6.2,7.65,2,1);
for(const x of [6.38,6.98,7.58]){seat('kitchen',x,7.12);seat('kitchen',x,8.75,180);}
seat('kitchen',5.65,7.92,-90);seat('kitchen',8.32,7.92,90);
put('living','rug',.55,7.55,3.5,3.8,0,{color:'#baa693'});
centre('living','sofa',3.7,9.15,2.203,.871,-90);
centre('living','tv',.175,8.95,2.4,.35,90,{color:'#ece5d9'});
put('living','coffee',1.5,8.58,1.2,1.2);
for(const [x,z,rot,color] of [[.755,7.05,0,'#c45f32'],[2,7.05,0,'#e3d9c8'],[.755,10.4,180,'#e3d9c8'],[2,10.4,180,'#c45f32']])put('living','armchair',x,z,.998,.868,rot,{color});
put('living','plant',.1,11.05,.4,.4);
put('terrace','dining',6,11,1.8,.9);for(const x of [6.2,7.15]){seat('terrace',x,10.49);seat('terrace',x,11.95,180);}
put('child','single',7.5,.05,.95,2);put('child','nightstand',8.55,.05,.45,.4);
put('child','wardrobe',7.95,3.9,1.6,.55,180,{color:'#e8dfd1'});
put('master','wardrobe',5.9,4.65,3.6,.5,0,{color:'#b5aaa0',label:'Хувцас солих хэсгийн шүүгээ'});
put('master','bed',7.15,5.95,1.65,2);put('master','nightstand',6.6,5.95,.5,.4);put('master','nightstand',8.85,5.95,.5,.4);
put('master','bench',7.38,8.08,1.2,.4,0,{label:'Орны хөлний сандал'});
centre('master','sofa',1.95,7.87,2.203,.749,90);
put('master','coffee',3,7.4,1,1);
for(const x of [2.85,3.75]){put('master','armchair',x,6.55,.601,.626,0,{color:'#c4b8a7'});put('master','armchair',x,8.65,.601,.626,180,{color:'#c4b8a7'});}
put('balcony','armchair',.2,10.65,.65,.65);
export const DEFAULT_ITEMS=items;
export function initialLayout(){return {version:1,theme:'ano2026',items:structuredClone(DEFAULT_ITEMS),surfaces:Object.fromEntries(ROOMS.map(r=>[r.id,{wall:THEMES.ano2026.wall,floor:r.outdoor?'deck':r.tile||r.id==='master'?'tile':'herringbone'}]))};}

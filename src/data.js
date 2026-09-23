export const THEMES = {
  natural:{name:'Рендерийн дулаан өнгө', wall:'#eee5d8',wood:'#856047',fabric:'#e8ddca',accent:'#a56c4d',kitchen:'#d9d0bf',door:'#b99468',floor:'oak',image:'./inspiration/kitchen-natural.png'},
  sage:{name:'Бүдэг ногоон',wall:'#f3f1e9',wood:'#c2a77d',fabric:'#d0cfc4',accent:'#78927b',kitchen:'#829078',floor:'ash',image:'./inspiration/kitchen-sage.png'},
  walnut:{name:'Хушга + шаргал',wall:'#e5ded2',wood:'#775942',fabric:'#b5a391',accent:'#a66f51',kitchen:'#aaa18f',floor:'oak',image:'./inspiration/kitchen-walnut.png'},
};
const R=(x,z,w,d)=>[[x,z],[x+w,z],[x+w,z+d],[x,z+d]];
export const ROOMS=[
  {id:'living',floor:0,name:'Зочны өрөө',area:25.04,tag:'Нийтийн',poly:R(0,6.025,4.6,5.575),focus:[2.4,8.8]},
  {id:'kitchen',floor:0,name:'Гал тогоо · хооллох',area:21.09,tag:'Нийтийн',poly:[[5.7,5.225],[9.6,5.225],[9.6,9.6],[4.6,9.6],[4.6,6.025],[5.7,6.025]],focus:[7.2,7.5]},
  {id:'guest',floor:0,name:'Унтлагын өрөө',area:16.48,tag:'Унтлагын',poly:[[0,0],[5.175,0],[5.175,2.675],[3.775,2.675],[3.775,3.375],[0,3.375]],focus:[2.5,1.65]},
  {id:'bath1',floor:0,name:'Угаалгын өрөө',area:5.21,tag:'Үйлчилгээ',poly:R(5.3,0,1.95,2.675),focus:[6.28,1.3],tile:true},
  {id:'utility',floor:0,name:'Техникийн өрөө',area:5.95,tag:'Үйлчилгээ',poly:R(7.375,0,2.225,2.675),focus:[8.5,1.3],tile:true,finish:'resin'},
  {id:'hall1',floor:0,name:'Үүд · хонгил',area:14.68,tag:'Холбоос',poly:[[3.9,2.8],[9.6,2.8],[9.6,5.10],[5.575,5.10],[5.575,6.025],[3.9,6.025]],focus:[6.4,3.85]},
  {id:'stairs1',floor:0,name:'Шатны хэсэг',area:9.36,tag:'Холбоос',poly:R(0,3.5,3.9,2.4),focus:[2,4.7],fixed:true},
  {id:'terrace',floor:0,name:'Террас',area:57.92,tag:'Гадна',poly:[[10.05,-.35],[12.15,-.35],[12.15,13.85],[-.35,13.85],[-.35,12.05],[4.6,12.05],[4.6,10.05],[10.05,10.05]],focus:[7,11.7],outdoor:true},
  {id:'master',floor:1,name:'Эцэг эхийн өрөө',area:33.95,tag:'Унтлагын',poly:[[5.825,4.625],[9.6,4.625],[9.6,9.6],[1.4,9.6],[1.4,6.025],[5.825,6.025]],focus:[5.8,7.5]},
  {id:'kids',floor:1,name:'Унтлагын өрөө · 16.48 м²',area:16.48,tag:'Унтлагын',poly:[[0,0],[5.175,0],[5.175,2.675],[3.775,2.675],[3.775,3.375],[0,3.375]],focus:[2.5,1.65]},
  {id:'child',floor:1,name:'Унтлагын өрөө · 10.94 м²',area:10.94,tag:'Унтлагын',poly:[[7.375,0],[9.6,0],[9.6,4.5],[6.825,4.5],[6.825,2.8],[7.375,2.8]],focus:[8.35,2.2]},
  {id:'bath2',floor:1,name:'Ариун цэврийн өрөө',area:5.21,tag:'Үйлчилгээ',poly:R(5.3,0,1.95,2.675),focus:[6.28,1.3],tile:true},
  {id:'hall2',floor:1,name:'Хонгил',area:7.27,tag:'Холбоос',poly:[[3.9,2.8],[6.7,2.8],[6.7,4.5],[5.7,4.5],[5.7,5.9],[3.9,5.9]],focus:[5.2,4.2]},
  {id:'stairs2',floor:1,name:'Шатны хэсэг',area:9.3,tag:'Холбоос',poly:R(0,3.5,3.9,2.4),focus:[2,4.7],fixed:true,tile:true},
  {id:'balcony',floor:1,name:'Тагт',area:10.6,tag:'Гадна',poly:R(-.35,10.05,5.3,1.9),focus:[2.3,11],outdoor:true},
];
export const FLOOR_OUTLINES=[[[0,0],[9.6,0],[9.6,9.6],[4.6,9.6],[4.6,11.6],[0,11.6]],[[0,0],[9.6,0],[9.6,9.6],[1.4,9.6],[1.4,6.025],[0,6.025]]];
// Metres; internal-face coordinates. Conflicting source values remain explicit.
export const PLAN_REVISION='2026-09-23-audit';
export const FLOOR_HEIGHT=3;
export const CLEAR_HEIGHTS=[2.80,2.85];
export const OPENING_TYPES={
 C1:{label:'Ц-1',w:3.4,h:1.8,pattern:'wide',source:'БА-12'},
 C2:{label:'Ц-2',w:3.6,h:1.8,pattern:'wide',source:'БА-12'},
 C3:{label:'Ц-3',w:1.2,h:4,pattern:'stair',source:'БА-7, 8, 12'},
 C4:{label:'Ц-4',w:1.5,h:1.8,pattern:'asymmetric',source:'БА-8, 9, 12',assumption:'БА-3/4: 2000×800; фасад ба түүвэр: 1500×1800'},
 C5:{label:'Ц-5',w:.6,h:1.8,pattern:'narrow',source:'БА-12'},
 C6:{label:'Ц-6',w:.8,h:1.8,pattern:'narrow',source:'БА-13'},
 C7:{label:'Ц-7',w:1.8,h:1.8,pattern:'three',source:'БА-13'},
 D1:{label:'Х-1',w:.96,h:2.2,source:'БА-11'},
 D2:{label:'Х-2',w:.86,h:2.2,source:'БА-11',vent:true},
 DT:{label:'ТХ-1',w:.96,h:2.2,source:'БА-11',assumption:'БА-3: 1000 өргөн; БА-11: 960'},
 GX1:{label:'ГХ-1',w:.9,h:2.4,pattern:'glazed-door',source:'БА-9, 11',assumption:'Нүүр зураг 2400; хүснэгт 2800 өндөр'},
 GX2:{label:'ГХ-2',w:1.5,h:2.8,pattern:'entry',source:'БА-7, 9, 11',assumption:'Огтлол 2800; хүснэгт/нүүр 2400 өндөр'},
 BAL:{label:'ГШХ-1',w:2.4,h:2.4,pattern:'balcony',source:'БА-4, 8, 13',assumption:'Нүх/зураг 2400; рамны хүснэгт 2770 зөрчилтэй'}
};
export const STAIR={rise:.15,tread:.30,risers:10,treads:9,landing:1.2,flightWidth:1.15,guardHeight:.85};
export function wallsFor(f){
 const upper=f===1, sill=upper?.7:.6;
 const opening=(mark,s,type='window',bottom=sill)=>({...OPENING_TYPES[mark],mark,s,e:s+OPENING_TYPES[mark].w,type,sill:bottom});
 const win=(mark,s,bottom=sill)=>opening(mark,s,'window',bottom);
 const door=(mark,s,swing=1)=>({...opening(mark,s,'door',0),swing});
 const wall=(a,b,openings=[],outer=false)=>({a,b,openings,outer});
 let w=[wall([0,0],[9.6,0],upper?[win('C5',5.8)]:[win('C5',6.45),win('C5',8.325)],true),
 wall([0,0],[0,upper?6.025:11.6],upper?[win('C4',1.1),win('C3',4.2,1.5-f*FLOOR_HEIGHT)]:[win('C4',1.1),win('C3',4.2,1.5),win('C6',6.5)],true),
 wall([9.6,0],[9.6,9.6],upper?[win('C4',1.1),win('C4',6.2)]:[door('GX2',2.85),door('GX1',6.55),win('C4',7.85)],true),
 wall([0,3.375],[3.775,3.375]),wall([3.775,2.675],[3.775,3.375]),
 wall([3.775,2.675],[5.3,2.675],[door('D1',.3)]),wall([5.2375,0],[5.2375,2.675]),
 wall([5.3,2.675],[7.375,2.675],[door('D2',upper?.3:1)]),
 wall([7.3125,0],[7.3125,2.675]),wall([0,6.025],[3.9,6.025])];
 if(upper)w.push(wall([7.375,2.8],[6.825,2.8]),wall([6.825,2.8],[6.825,4.5],[door('D1',0)]),wall([6.825,4.5625],[9.6,4.5625]),
 wall([3.9,6.025],[5.825,6.025],[door('D1',.64,-1)]),wall([5.825,4.625],[5.825,6.025]),
 wall([1.4,6.025],[1.4,9.6],[win('C7',1.075)],true),wall([1.4,9.6],[9.6,9.6],[door('BAL',.8),win('C2',4.5)],true));
 else w.push(wall([7.375,2.675],[9.6,2.675],[door('DT',.875)]),wall([5.7,5.225],[9.6,5.225]),wall([5.7,5.225],[5.7,6.025]),
 wall([4.6,9.6],[9.6,9.6],[win('C2',.6)],true),wall([4.6,9.6],[4.6,11.6],[],true),wall([0,11.6],[4.6,11.6],[win('C1',.8)],true));
 return w;
}
export const CATALOG={
 sofa:{name:'Буйдан',w:2.6,d:.95,h:.85,category:'Зочны',role:'fabric'},
 armchair:{name:'Зөөлөн сандал',w:.8,d:.8,h:.8,category:'Зочны',role:'accent'},
 coffee:{name:'Кофены ширээ',w:1.2,d:.6,h:.4,category:'Зочны',role:'wood'},
 tv:{name:'ТВ + тавиур',w:1.8,d:.35,h:1.4,category:'Зочны',role:'wood'},
 roundtable:{name:'Дугуй кофены ширээ',w:.7,d:.7,h:.4,category:'Зочны',role:'wood'},
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
// Ground-floor furniture follows БА-1. Upper-floor furniture remains a proposal.
put('guest','bed',1.35,.12,1.6,2);put('guest','nightstand',.85,.15,.4,.4);put('guest','nightstand',3.05,.15,.4,.4);
put('guest','desk',3.55,.1,.95,.55);seat('guest',3.8,.7,180);put('guest','wardrobe',4.575,.1,.6,1.45,90);
put('guest','bench',1.2,2.82,2,.4);
// Architectural sheets do not specify mechanical equipment locations.
for(const r of ['bath1','bath2']){
 put(r,'bath',5.4,.12,1.75,.72,0,{locked:true});
 put(r,'sink',r==='bath1'?5.4:6.7,1.05,.45,.55,0,{locked:true});
 put(r,'toilet',r==='bath1'?5.50:6.70,1.82,.4,.65,0,{locked:true});
}
put('hall1','wardrobe',7.4,4.55,1.8,.55,180);put('hall1','bench',6.1,4.65,1,.45,180);
put('kitchen','kitchen',5.7,5.225,3.9,.6,0,{locked:true});put('kitchen','dining',6.25,7.55,2.15,.9);
for(const x of [6.3,7.05,7.8]){seat('kitchen',x,7.02);seat('kitchen',x,8.53,180);}
seat('kitchen',5.7,7.77,-90);seat('kitchen',8.5,7.77,90);
put('living','rug',.7,7.9,3.3,2.85);
put('living','sofa',1.1,10.55,2.4,.85,180);
put('living','tv',-.55,9.075,1.8,.35,90);
put('living','roundtable',1.7,8.55,.7,.7);put('living','roundtable',1.8,9.35,.55,.55);
put('living','armchair',.8,7.3,.72,.72);put('living','armchair',1.9,7.3,.72,.72);
put('living','armchair',3.25,8.4,.72,.72,-90);put('living','armchair',3.25,9.35,.72,.72,-90);
put('living','plant',.3,10.8,.35,.35);put('living','plant',4.05,10.8,.35,.35);
put('terrace','dining',6,11,1.8,.9);for(const x of [6.2,7.15]){seat('terrace',x,10.49);seat('terrace',x,11.95,180)}
put('kids','single',.8,-.45,.9,2,-90);put('kids','single',.8,1.825,.9,2,-90);
put('kids','desk',2.7,.1,1.6,.6);seat('kids',2.85,.8,180);seat('kids',3.7,.8,180);put('kids','wardrobe',4.15,.525,1.45,.6,90);
put('child','single',7.5,.15,.9,2);put('child','wardrobe',7.5,3.9,1.2,.6,180);put('child','desk',8.825,3.025,1,.55,90);seat('child',8.5,3.1,-90);
put('master','bed',6.6,4.825,1.8,2);put('master','nightstand',6,4.875,.5,.45);put('master','nightstand',8.5,4.875,.5,.45);
put('master','wardrobe',4.05,7.8,1.8,.6,-90);put('master','desk',6.6,9,1.8,.6,180);seat('master',7.2,8.35);put('master','armchair',1.75,7.95,.75,.75);put('master','rug',6.25,6.75,2.7,1.55);
put('balcony','armchair',.2,10.65,.65,.65);
// Correct the guest wardrobe to use local furniture dimensions with a rotated footprint.
const gw=items.find(i=>i.room==='guest'&&i.type==='wardrobe');gw.w=1.45;gw.d=.6;
export const DEFAULT_ITEMS=items;
export function initialLayout(){return {version:2,planRevision:PLAN_REVISION,theme:'natural',items:structuredClone(DEFAULT_ITEMS),surfaces:Object.fromEntries(ROOMS.map(r=>[r.id,{wall:THEMES.natural.wall,floor:r.finish||(r.outdoor||r.tile?'tile':'oak')}]))};}

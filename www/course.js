/* Experimental first stage: authored polar paths and shared render/collision geometry. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.FallJumpCourse=api;})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const TAU=Math.PI*2,CELLS=24,STEP=TAU/CELLS,INNER=54,WIDTH=36;
 const TITLES=['Primeiros caminhos','Passagem estreita','Escolha seu caminho','Ilhas suspensas','Ponte de vidro','Escadaria','Caminho em zigue-zague','Travessia delicada','Pátio da patrulha','Pedras suspensas','Duas rotas','Última travessia'];
 const TIPS=[
  'Joystick para os lados: contorne a torre. Para cima e para baixo: afaste ou aproxime da coluna. Alcance a saída dourada.',
  'Mantenha-se no caminho estreito. Soltar o joystick interrompe o movimento.',
  'Escolha a rota interna, mais segura, ou a externa, com moedas e um obstáculo para saltar.',
  'Dois toques para saltar entre as ilhas. Solte o controle no ar para ajustar a aterrissagem.',
  'A ponte azul cede após um instante. Atravesse sem parar ou salte sobre ela.',
  'Salte para subir os degraus. Desça com cuidado até a saída.',
  'Mude de faixa para acompanhar as curvas do caminho.',
  'Uma conexão estreita une as duas partes. Planeje sua travessia.',
  'Há espaço para desviar da patrulha. Golpes e pisões também funcionam.',
  'Alterne entre a faixa interna e a externa usando o salto.',
  'As duas rotas têm desafios diferentes. Escolha seu caminho até a saída.',
  'Combine movimento, saltos e travessias para completar a fase.'
 ];
 const norm=a=>((a%TAU)+TAU)%TAU;
 const radius=lane=>INNER+WIDTH*(lane+.5);
 function tileAt(area,angle,r){
  const lane=Math.floor((r-INNER)/WIDTH),cell=Math.floor(norm(angle)/STEP);
  if(lane<0||lane>2)return null;
  return area.tiles.find(t=>t.lane===lane&&t.cell===cell&&!t.collapsed)||null;
 }
 function makeArea(index){
  const map=new Map();
  function add(lane,cell,extra={}){const key=lane+':'+cell;map.set(key,{lane,cell,height:0,fragile:false,coin:false,exit:false,collapsed:false,standFrames:0,...map.get(key),...extra});}
  function line(lane,from,to,extra={}){for(let cell=from;cell<=to;cell++)add(lane,cell,extra);}
  function wide(from,to){for(let lane=0;lane<3;lane++)line(lane,from,to);}
  let exit={lane:1,cell:11},patrol=null;
  if(index===0){wide(0,6);exit={lane:1,cell:7};add(2,3,{coin:true});}
  else if(index===1){wide(0,1);line(1,2,9);exit={lane:1,cell:10};add(1,7,{coin:true});}
  else if(index===2||index===10){
   line(1,0,1);line(0,0,10);line(2,0,10);line(1,9,10);add(2,5,{height:20});add(2,3,{coin:true});add(2,8,{coin:true});
   if(index===10){add(0,4,{fragile:true});patrol={lane:2,from:6,to:8};}
  }
  else if(index===3){line(1,0,3);line(1,6,9);line(1,12,14);exit={lane:1,cell:15};add(1,8,{coin:true});}
  else if(index===4){wide(0,2);line(1,3,6,{fragile:true});wide(7,10);add(2,9,{coin:true});}
  else if(index===5){line(1,0,2);line(1,3,5,{height:16});line(1,6,8,{height:32});line(1,9,10,{height:16});line(1,11,11);exit={lane:1,cell:12};add(1,7,{coin:true});}
  else if(index===6){add(1,0);line(0,0,4);add(1,4);line(2,4,8);add(1,8);line(0,8,12);exit={lane:0,cell:13};patrol={lane:2,from:5,to:7};add(2,6,{coin:true});}
  else if(index===7){add(1,0);line(0,0,5);add(1,5,{fragile:true});line(2,5,10);add(2,7,{fragile:true});exit={lane:2,cell:11};add(2,9,{coin:true});}
  else if(index===8){wide(0,10);add(2,3,{height:16});add(2,6,{height:16});add(0,8,{coin:true});patrol={lane:1,from:4,to:8};}
  else if(index===9){add(1,0);line(0,0,3);line(1,4,6,{height:16});line(2,7,10);exit={lane:2,cell:11};add(1,5,{coin:true});patrol={lane:2,from:8,to:9};}
  else{add(1,0);line(0,0,4);line(1,4,9);add(1,6,{fragile:true});line(2,9,14);exit={lane:2,cell:15};patrol={lane:2,from:11,to:13};add(0,3,{coin:true});add(1,8,{coin:true});add(2,14,{coin:true});}
  add(exit.lane,exit.cell,{exit:true,height:0,fragile:false,coin:false});
  return {index,title:TITLES[index],tip:TIPS[index],entry:{lane:1,cell:0},exit,tiles:[...map.values()],patrol};
 }
 function point(t){const angle=(t.cell+.5)*STEP;return {x:Math.sin(angle)*radius(t.lane),z:Math.cos(angle)*radius(t.lane)};}
 function route(area){
  const start=area.tiles.find(t=>t.lane===area.entry.lane&&t.cell===area.entry.cell),seen=new Set([start]),queue=[start];
  if(!start)return {ok:false,visited:0};
  for(let i=0;i<queue.length;i++){
   const a=queue[i];if(a.exit)return {ok:true,visited:seen.size};const pa=point(a);
   for(const b of area.tiles){if(seen.has(b)||b.height-a.height>40)continue;const pb=point(b);
    // Conservative hop budget, below the actual jump range; adjacent tiles are walkable.
    if(Math.hypot(pa.x-pb.x,pa.z-pb.z)<=90){seen.add(b);queue.push(b);}
   }
  }
  return {ok:false,visited:seen.size};
 }
 function validate(plan){return plan.level===1&&plan.count===12&&plan.platforms.length===12&&plan.platforms.every((p,i)=>p.course&&p.course.index===i&&p.y===i*205&&p.course.tiles.every(t=>Number.isInteger(t.lane)&&Number.isInteger(t.cell)&&t.lane>=0&&t.lane<3&&t.cell>=0&&t.cell<CELLS&&t.height>=0&&t.height<=32)&&route(p.course).ok);}
 function generate(seed){
  return {level:1,seed:seed>>>0,count:12,label:'EXPLORAÇÃO',phase:0,intensity:.3,attempts:1,experimental:true,
   platforms:Array.from({length:12},(_,i)=>({y:i*205,angle:i*.7,gap:.8,danger:0,passed:false,broken:false,special:null,seed:(seed+i*37)>>>0,course:makeArea(i)})),
   segments:Array.from({length:12},(_,i)=>({type:'course-'+i,from:i,to:i}))};
 }
 return {STEP,INNER,WIDTH,radius,tileAt,route,validate,generate};
});

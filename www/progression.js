/* Local stage records and permanent talents. No network or real-money purchases. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.FallJumpProgression=api;})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const KEY='fall-jump-progression-v1',MAX_LEVEL=999;
 const TALENTS=Object.freeze([
  {id:'vitality',name:'Vitalidade',description:'+10 de vida máxima por nível.',max:3,costs:[30,60,100]},
  {id:'agility',name:'Espada ágil',description:'Reduz a espera entre os golpes da espada.',max:3,costs:[30,60,100]},
  {id:'guard',name:'Fôlego protetor',description:'+0,17 s de proteção após dano por nível.',max:3,costs:[30,60,100]}
 ]);
 const integer=(n,fallback,min,max)=>Number.isSafeInteger(n)?Math.max(min,Math.min(max,n)):fallback;
 const count=level=>5*(40+Math.min(40,6*Math.floor((level-1)/2)));
 function normalize(raw){
  const r=raw&&typeof raw==='object'?raw:{};
  const state={layoutVersion:2,selected:1,unlocked:integer(r.unlocked,1,1,MAX_LEVEL),best:{},completed:{},talents:{}};
  state.selected=integer(r.selected,1,1,state.unlocked);
  for(let level=1;level<=state.unlocked;level++){
   if(r.best?.[level])state.best[level]=integer(r.best[level],0,0,count(level));
   if(r.layoutVersion===2&&r.completed?.[level]===true){state.completed[level]=true;state.best[level]=count(level);}
  }
  for(const t of TALENTS)state.talents[t.id]=integer(r.talents?.[t.id],0,0,t.max);
  return state;
 }
 function load(storage){try{return normalize(JSON.parse(storage.getItem(KEY)));}catch(e){return normalize();}}
 function save(storage,state){try{storage.setItem(KEY,JSON.stringify(normalize(state)));return true;}catch(e){return false;}}
 function select(state,level){if(!Number.isSafeInteger(level)||level<1||level>state.unlocked)return false;state.selected=level;return true;}
 function record(state,level,passed,win=false){
  if(!Number.isSafeInteger(level)||level<1||level>state.unlocked)return false;
  const reached=integer(passed,0,0,count(level));state.best[level]=Math.max(state.best[level]||0,reached);
  if(win&&reached===count(level)){state.completed[level]=true;state.unlocked=Math.max(state.unlocked,Math.min(MAX_LEVEL,level+1));}
  return true;
 }
 function upgrade(state,wallet,id){
  const t=TALENTS.find(t=>t.id===id);if(!t)return {ok:false,reason:'unknown'};
  const rank=state.talents[id];if(rank>=t.max)return {ok:false,reason:'max'};
  const cost=t.costs[rank];if(!Number.isSafeInteger(wallet.coins)||wallet.coins<cost)return {ok:false,reason:'coins'};
  wallet.coins-=cost;state.talents[id]++;return {ok:true,cost};
 }
 return {KEY,MAX_LEVEL,TALENTS,count,normalize,load,save,select,record,upgrade};
});

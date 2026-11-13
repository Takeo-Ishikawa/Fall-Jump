/* Fall Jump 1.4 — coleção local, sem compras reais ou acesso à rede. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.FallJumpSkins=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const KEY='fall-jump-skins-v1';
 const LIMIT=100000000;
 const CATALOG=Object.freeze([
  Object.freeze({id:'melon',name:'Melancia',price:0,light:'#c4dfcb',mid:'#94bfa7',dark:'#527d65',detail:'#527d65',pattern:'stripes'}),
  Object.freeze({id:'lemon',name:'Limão',price:60,light:'#f4e6b8',mid:'#e8cb86',dark:'#b29554',detail:'#b29554',pattern:'stripes'}),
  Object.freeze({id:'blueberry',name:'Mirtilo',price:140,light:'#d1d7ed',mid:'#a0aed4',dark:'#68769e',detail:'#56638b',pattern:'dots'}),
  Object.freeze({id:'strawberry',name:'Morango',price:260,light:'#f1cbd0',mid:'#dea2ae',dark:'#b27385',detail:'#fff0c9',pattern:'seeds'})
 ]);
 const IDS=new Set(CATALOG.map(s=>s.id));
 const byId=id=>CATALOG.find(s=>s.id===id)||null;
 function normalize(value){
  const input=value&&typeof value==='object'?value:{};
  const raw=Number(input.coins);
  const coins=Number.isFinite(raw)&&raw>=0?Math.min(LIMIT,Math.floor(raw)):0;
  const owned=['melon'];
  if(Array.isArray(input.owned))for(const id of input.owned){
   if(IDS.has(id)&&!owned.includes(id))owned.push(id);
  }
  const selected=owned.includes(input.selected)?input.selected:'melon';
  return {coins,owned,selected};
 }
 function load(storage){
  try{return normalize(JSON.parse(storage.getItem(KEY)||'null'));}
  catch(_){return normalize();}
 }
 function save(storage,state){
  try{storage.setItem(KEY,JSON.stringify(normalize(state)));return true;}
  catch(_){return false;}
 }
 function earn(state,amount){
  if(!Number.isSafeInteger(amount)||amount<=0)return 0;
  const earned=Math.min(amount,LIMIT-state.coins);
  state.coins+=earned;
  return earned;
 }
 function coinsForPlatform(passed){
  return Number.isSafeInteger(passed)&&passed>0&&passed%4===0?2:0;
 }
 function coinsForLevel(){return 12;}
 function choose(state,id){
  const skin=byId(id);
  if(!skin)return {ok:false,reason:'unknown'};
  if(state.owned.includes(id)){
   state.selected=id;
   return {ok:true,action:'equipped',price:0};
  }
  if(state.coins<skin.price)return {ok:false,reason:'coins',missing:skin.price-state.coins};
  state.coins-=skin.price;
  state.owned.push(id);
  state.selected=id;
  return {ok:true,action:'unlocked',price:skin.price};
 }
 return {KEY,CATALOG,byId,normalize,load,save,earn,choose,coinsForPlatform,coinsForLevel};
});

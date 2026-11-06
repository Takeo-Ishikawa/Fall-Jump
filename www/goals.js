/* Fall Jump 1.5 — missões diárias e conquistas locais.
 * Progresso persistente com resgate manual e único por objetivo; sem rede.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.FallJumpGoals=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const KEY='fall-jump-goals-v1';
 const MAX_COUNT=100000000;
 const METRICS=['platforms','wins','fevers','bonus','smashes','combo5','bestCombo'];
 const ACHIEVEMENTS=Object.freeze([
  {id:'steps100',title:'Primeiros saltos',metric:'platforms',target:100,reward:30},
  {id:'steps500',title:'Queda incansável',metric:'platforms',target:500,reward:90},
  {id:'combo10',title:'Mestre dos combos',metric:'bestCombo',target:10,reward:50},
  {id:'fever10',title:'Energia imbatível',metric:'fevers',target:10,reward:60},
  {id:'wins5',title:'Explorador',metric:'wins',target:5,reward:60},
  {id:'bonus25',title:'Caçador de ouro',metric:'bonus',target:25,reward:50}
 ]);
 const DAILY_POOL=Object.freeze([
  {id:'descents',title:'Descer 40 plataformas',metric:'platforms',target:40,reward:12},
  {id:'breaks',title:'Romper 10 plataformas',metric:'smashes',target:10,reward:14},
  {id:'heat',title:'Ativar Fever 2 vezes',metric:'fevers',target:2,reward:18},
  {id:'winner',title:'Concluir 1 fase',metric:'wins',target:1,reward:20},
  {id:'gold',title:'Passar por 5 plataformas douradas',metric:'bonus',target:5,reward:16},
  {id:'combos',title:'Fazer 3 combos de 5',metric:'combo5',target:3,reward:16}
 ]);
 const dailyIds=new Set(DAILY_POOL.map(x=>x.id));
 const achievementIds=new Set(ACHIEVEMENTS.map(x=>x.id));
 function localDay(date){
  const d=date instanceof Date?date:new Date();
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+day;
 }
 function validDay(day){return typeof day==='string'&&/^\d{4}-\d\d-\d\d$/.test(day)&&Number.isFinite(Date.parse(day+'T00:00:00Z'))}
 function clampCount(value){return Number.isSafeInteger(value)&&value>0?Math.min(MAX_COUNT,value):0}
 function missionsFor(day){
  const date=validDay(day)?day:'2026-01-01';
  const epoch=Math.floor(Date.parse(date+'T00:00:00Z')/86400000);
  const start=((epoch%DAILY_POOL.length)+DAILY_POOL.length)%DAILY_POOL.length;
  return [0,2,4].map(offset=>DAILY_POOL[(start+offset)%DAILY_POOL.length]);
 }
 function normalize(input,today){
  const day=validDay(today)?today:localDay();
  const data=input&&typeof input==='object'?input:{};
  const totals={};
  for(const name of METRICS)totals[name]=clampCount(data.totals&&data.totals[name]);
  const awards=Array.isArray(data.awards)?[...new Set(data.awards.filter(id=>achievementIds.has(id)))]:[];
  let dailyDay=validDay(data.daily&&data.daily.day)?data.daily.day:day;
  if(day>dailyDay)dailyDay=day; // avançar o dia, nunca retroceder o relógio
  const sameDay=dailyDay===data.daily?.day;
  const selected=missionsFor(dailyDay);
  const progress={};
  for(const mission of selected){
   progress[mission.id]=sameDay?clampCount(data.daily?.progress?.[mission.id]):0;
  }
  const claimed=sameDay&&Array.isArray(data.daily?.claimed)
   ?[...new Set(data.daily.claimed.filter(id=>selected.some(x=>x.id===id)))]:[];
  return {totals,awards,daily:{day:dailyDay,progress,claimed}};
 }
 function create(today){return normalize(null,today)}
 function load(storage,today){
  try{return normalize(JSON.parse(storage.getItem(KEY)||'null'),today)}
  catch(_){return create(today)}
 }
 function save(storage,state){
  try{storage.setItem(KEY,JSON.stringify(state));return true}
  catch(_){return false}
 }
 function refreshDay(state,today){
  const next=validDay(today)?today:localDay();
  if(next<=state.daily.day)return false;
  state.daily={day:next,progress:Object.fromEntries(missionsFor(next).map(m=>[m.id,0])),claimed:[]};
  return true;
 }
 function capAdd(old,delta){return Math.min(MAX_COUNT,old+delta)}
 function record(state,event,today){
  refreshDay(state,today);
  const updates={};
  const oldCombo=state.totals.bestCombo;
  const oldTotals={...state.totals};
  if(event&&typeof event==='object'){
   for(const metric of METRICS.filter(n=>n!=='bestCombo'))updates[metric]=clampCount(event[metric]);
   const combo=clampCount(event.combo);
   if(combo>state.totals.bestCombo)state.totals.bestCombo=combo;
  }
  for(const metric of Object.keys(updates))state.totals[metric]=capAdd(state.totals[metric],updates[metric]);
  const newlyReady=[];
  for(const goal of ACHIEVEMENTS){
   const previous=goal.metric==='bestCombo'?oldCombo:oldTotals[goal.metric];
   if(previous<goal.target&&state.totals[goal.metric]>=goal.target&&!state.awards.includes(goal.id)){
    newlyReady.push({id:goal.id,title:goal.title,reward:goal.reward,kind:'achievement'});
   }
  }
  for(const mission of missionsFor(state.daily.day)){
   const before=state.daily.progress[mission.id]||0;
   state.daily.progress[mission.id]=capAdd(before,updates[mission.metric]||0);
   if(before<mission.target&&state.daily.progress[mission.id]>=mission.target&&!state.daily.claimed.includes(mission.id)){
    newlyReady.push({id:mission.id,title:mission.title,reward:mission.reward,kind:'daily'});
   }
  }
  // Não creditar moedas aqui: o jogador recebe somente quando toca em Resgatar.
  return newlyReady;
 }
 function claim(state,kind,id,today){
  refreshDay(state,today);
  const daily=kind==='daily';
  const goals=daily?missionsFor(state.daily.day):kind==='achievement'?ACHIEVEMENTS:[];
  const goal=goals.find(item=>item.id===id);
  if(!goal)return null;
  const claimed=daily?state.daily.claimed:state.awards;
  const progress=daily?state.daily.progress[id]||0:state.totals[goal.metric]||0;
  if(claimed.includes(id)||progress<goal.target)return null;
  claimed.push(id);
  return {id:goal.id,title:goal.title,reward:goal.reward,kind:daily?'daily':'achievement'};
 }
 function nextResetMs(now,storedDay){
  const date=now instanceof Date?now:new Date();
  const local=localDay(date);
  const day=validDay(storedDay)&&storedDay>local?storedDay:local;
  const [year,month,dateNum]=day.split('-').map(Number);
  const midnight=new Date(year,month-1,dateNum+1,0,0,0,0).getTime();
  return Math.max(0,midnight-date.getTime());
 }
 function formatCountdown(ms){
  const seconds=Math.ceil(Math.max(0,ms)/1000);
  const hours=Math.floor(seconds/3600);
  const minutes=Math.floor(seconds%3600/60);
  const remainder=seconds%60;
  return [hours,minutes,remainder].map(n=>String(n).padStart(2,'0')).join(':');
 }
 function getStatus(state){
  return {day:state.daily.day,daily:missionsFor(state.daily.day).map(goal=>({
   ...goal,progress:Math.min(goal.target,state.daily.progress[goal.id]||0),
   claimed:state.daily.claimed.includes(goal.id),ready:!state.daily.claimed.includes(goal.id)&&(state.daily.progress[goal.id]||0)>=goal.target
  })),achievements:ACHIEVEMENTS.map(goal=>({
   ...goal,progress:Math.min(goal.target,state.totals[goal.metric]||0),
   claimed:state.awards.includes(goal.id),ready:!state.awards.includes(goal.id)&&(state.totals[goal.metric]||0)>=goal.target
  }))};
 }
 return {KEY,create,normalize,load,save,record,claim,refreshDay,localDay,missionsFor,getStatus,nextResetMs,formatCountdown,ACHIEVEMENTS,DAILY_POOL};
});

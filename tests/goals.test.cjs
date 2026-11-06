'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const goals=require('../www/goals.js');
function memory(){const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)}}
const DAY='2026-11-06',NEXT='2026-11-07';

test('três missões distintas por dia, data local reproduzível',()=>{
 assert.equal(goals.missionsFor(DAY).length,3);
 assert.deepEqual(goals.missionsFor(DAY),goals.missionsFor(DAY));
 assert.notDeepEqual(goals.missionsFor(DAY),goals.missionsFor(NEXT));
 assert.equal(new Set(goals.missionsFor(DAY).map(m=>m.id)).size,3);
});
test('completar objetivos não credita nem marca como resgatados até clicar',()=>{
 const state=goals.create(DAY);
 const first=goals.record(state,{platforms:100,combo:10},DAY);
 assert.ok(first.some(x=>x.id==='steps100'));
 assert.ok(first.some(x=>x.id==='combo10'));
 assert.deepEqual(state.awards,[]);
 assert.equal(goals.getStatus(state).achievements.find(x=>x.id==='combo10').ready,true);
 assert.deepEqual(goals.record(state,{platforms:1,combo:10},DAY),[]);
 const reward=goals.claim(state,'achievement','combo10',DAY);
 assert.deepEqual(reward,{id:'combo10',title:'Mestre dos combos',reward:50,kind:'achievement'});
 assert.equal(goals.claim(state,'achievement','combo10',DAY),null);
 assert.equal(goals.getStatus(state).achievements.find(x=>x.id==='combo10').ready,false);
 assert.equal(goals.getStatus(state).achievements.find(x=>x.id==='combo10').claimed,true);
});
test('resgate de missão diária só depois de concluir, com recompensa única',()=>{
 const state=goals.create(DAY);
 const goal=goals.missionsFor(DAY)[0];
 assert.equal(goals.claim(state,'daily',goal.id,DAY),null);
 goals.record(state,{platforms:100,wins:3,fevers:3,bonus:20,smashes:20,combo5:6},DAY);
 assert.equal(goals.getStatus(state).daily.every(x=>x.ready),true);
 const reward=goals.claim(state,'daily',goal.id,DAY);
 assert.equal(reward.reward,goal.reward);
 assert.equal(goals.claim(state,'daily',goal.id,DAY),null);
 assert.equal(goals.getStatus(state).daily.find(x=>x.id===goal.id).claimed,true);
 assert.equal(goals.claim(state,'daily','invalid',DAY),null);
 assert.equal(goals.claim(state,'wrong',goal.id,DAY),null);
});
test('missões não resgatadas expiram na virada do dia; conquistas permanecem',()=>{
 const state=goals.create(DAY);
 goals.record(state,{platforms:100,wins:3,fevers:3,bonus:20,smashes:20,combo5:6},DAY);
 const old=goals.missionsFor(DAY)[0];
 assert.ok(goals.claim(state,'achievement','steps100',DAY));
 assert.equal(goals.refreshDay(state,NEXT),true);
 assert.equal(goals.getStatus(state).daily.every(x=>!x.claimed&&x.progress===0),true);
 assert.equal(goals.getStatus(state).achievements.find(x=>x.id==='steps100').claimed,true);
 assert.equal(goals.claim(state,'daily',old.id,NEXT),null);
 assert.equal(goals.refreshDay(state,DAY),false);
});
test('contagem regressiva até meia-noite local é correta, inclusive dia curto de DST',()=>{
 const now=new Date(2026,10,6,23,59,30,400);
 const remaining=goals.nextResetMs(now,DAY);
 assert.equal(remaining,29600);
 assert.equal(goals.formatCountdown(remaining),'00:00:30');
 const start=new Date(2026,10,6,0,0,0);
 assert.equal(goals.nextResetMs(start,DAY),24*3600000);
 assert.equal(goals.formatCountdown(0),'00:00:00');
 assert.equal(goals.formatCountdown(3599999),'01:00:00');
 // A data persistida à frente do relógio não permite renovar antes do previsto.
 assert.ok(goals.nextResetMs(now,'2026-11-08')>24*3600000);
});
test('resgates e progressos anteriores persistem após reiniciar, sem duplicar',()=>{
 const storage=memory();
 const state=goals.create(DAY);
 goals.record(state,{platforms:500,fevers:10,combo:10},DAY);
 assert.ok(goals.claim(state,'achievement','steps500',DAY));
 assert.equal(goals.save(storage,state),true);
 const read=goals.load(storage,DAY);
 assert.deepEqual(read,state);
 assert.equal(goals.claim(read,'achievement','steps500',DAY),null);
 assert.equal(goals.getStatus(read).achievements.find(g=>g.id==='fever10').ready,true);
});
test('migra dados da versão 1.5: recompensas já concedidas seguem resgatadas',()=>{
 const state=goals.normalize({totals:{platforms:500,bestCombo:10},awards:['steps100','steps100'],
 daily:{day:DAY,progress:Object.fromEntries(goals.missionsFor(DAY).map(m=>[m.id,99])),claimed:[goals.missionsFor(DAY)[0].id]}},DAY);
 assert.equal(goals.claim(state,'achievement','steps100',DAY),null);
 assert.equal(goals.getStatus(state).achievements.find(g=>g.id==='steps100').claimed,true);
 assert.equal(goals.claim(state,'daily',goals.missionsFor(DAY)[0].id,DAY),null);
 assert.equal(goals.getStatus(state).achievements.find(g=>g.id==='steps500').ready,true);
 const storage=memory();goals.save(storage,state);
 assert.deepEqual(goals.load(storage,DAY),state);
});
test('dados inválidos não liberam resgates e armazenamento indisponível não quebra',()=>{
 const bad={totals:{platforms:-500,wins:NaN,fevers:1e40,bestCombo:3},
 awards:['steps100','steps100','bogus'],daily:{day:DAY,progress:{descents:-1},claimed:['bogus']}};
 const state=goals.normalize(bad,DAY);
 assert.equal(state.totals.platforms,0);
 assert.deepEqual(state.awards,['steps100']);
 assert.deepEqual(goals.record(state,{platforms:-100,combo:-12},DAY),[]);
 assert.equal(goals.claim(state,'achievement','steps500',DAY),null);
 const broken={getItem(){return '{invalid'},setItem(){throw Error('blocked')}};
 assert.deepEqual(goals.load(broken,DAY),goals.create(DAY));
 assert.equal(goals.save(broken,state),false);
});

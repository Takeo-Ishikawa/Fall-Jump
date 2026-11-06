'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const goals=require('../www/goals.js');
function memory(){const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)}}
const DAY='2026-11-06',NEXT='2026-11-07';

test('seleciona três missões distintas e mantém escolhas do mesmo dia',()=>{
 const selected=goals.missionsFor(DAY),again=goals.missionsFor(DAY);
 assert.equal(selected.length,3);
 assert.deepEqual(selected,again);
 assert.equal(new Set(selected.map(m=>m.id)).size,3);
 assert.notDeepEqual(goals.missionsFor(DAY),goals.missionsFor(NEXT));
});
test('progresso de plataformas e conquista é cumulativo com recompensa uma só vez',()=>{
 const state=goals.create(DAY);
 assert.deepEqual(goals.record(state,{platforms:99,combo:9},DAY),[]);
 const one=goals.record(state,{platforms:1,combo:10},DAY);
 assert.ok(one.some(p=>p.id==='steps100'&&p.reward===30));
 assert.ok(one.some(p=>p.id==='combo10'&&p.reward===50));
 assert.deepEqual(goals.record(state,{platforms:300,combo:10},DAY).filter(x=>x.kind==='achievement'),[]);
 const next=goals.record(state,{platforms:100},DAY);
 assert.deepEqual(next.filter(x=>x.kind==='achievement').map(x=>x.id),['steps500']);
 assert.equal(state.totals.bestCombo,10);
});
test('três missões diárias mudam no dia seguinte, sem reiniciar conquistas',()=>{
 const state=goals.create(DAY),missions=goals.missionsFor(DAY);
 const event={platforms:100,wins:3,fevers:3,bonus:20,smashes:20,combo5:6,combo:9};
 const reward=goals.record(state,event,DAY);
 for(const mission of missions)assert.equal(reward.filter(x=>x.id===mission.id).length,1);
 assert.deepEqual(goals.record(state,event,DAY).filter(x=>x.kind==='daily'),[]);
 assert.equal(goals.getStatus(state).daily.every(x=>x.claimed),true);
 goals.refreshDay(state,NEXT);
 assert.equal(goals.getStatus(state).daily.every(x=>!x.claimed&&x.progress===0),true);
 assert.equal(goals.getStatus(state).achievements.find(x=>x.id==='steps100').claimed,true);
 assert.equal(state.totals.platforms,200);
});
test('não retrocede data quando o relógio do aparelho é alterado',()=>{
 const state=goals.create(NEXT);
 goals.record(state,{wins:1},DAY);
 assert.equal(state.daily.day,NEXT);
 assert.equal(goals.refreshDay(state,DAY),false);
 assert.equal(state.daily.day,NEXT);
});
test('recupera armazenamento inválido e mantém objetivos concedidos',()=>{
 const storage=memory();
 const state=goals.create(DAY);
 goals.record(state,{platforms:500,fevers:10,combo:10},DAY);
 assert.ok(goals.save(storage,state));
 const reloaded=goals.load(storage,DAY);
 assert.deepEqual(reloaded,state);
 assert.equal(goals.record(reloaded,{platforms:1},DAY).some(x=>x.id==='steps500'),false);
 const invalid={getItem(){return '{invalid';},setItem(){throw Error('blocked')}};
 assert.deepEqual(goals.load(invalid,DAY),goals.create(DAY));
 assert.equal(goals.save(invalid,state),false);
});
test('suporta estados legados e valores malformados sem conceder moedas por métricas negativas',()=>{
 const raw={totals:{platforms:-500,wins:NaN,fevers:1e40,bestCombo:3},
 awards:['steps100','steps100','bogus'],daily:{day:DAY,progress:{descents:-1},claimed:['bogus']}};
 const state=goals.normalize(raw,DAY);
 assert.equal(state.totals.platforms,0);
 assert.equal(state.totals.wins,0);
 assert.equal(state.totals.fevers,0);
 assert.deepEqual(state.awards,['steps100']);
 assert.deepEqual(goals.record(state,{platforms:-100,wins:0,combo:-12},DAY),[]);
});
test('não modifica estoque da loja: apenas emite valores de recompensa',()=>{
 const state=goals.create(DAY);
 const out=goals.record(state,{platforms:100,combo:10},DAY);
 assert.ok(out.reduce((n,x)=>n+x.reward,0)>0);
 assert.equal(Object.prototype.hasOwnProperty.call(state,'coins'),false);
});

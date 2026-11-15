'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),p=require('../www/progression.js');
test('progresso registra o melhor avanço sem regredir e libera fase apenas ao concluir',()=>{
 const s=p.normalize();p.record(s,1,12);p.record(s,1,5);assert.equal(s.best[1],12);assert.equal(s.unlocked,1);assert.equal(p.select(s,2),false);
 p.record(s,1,20,true);assert.equal(s.unlocked,1);p.record(s,1,40,true);assert.equal(s.unlocked,2);assert.equal(p.select(s,2),true);assert.equal(s.selected,2);
 assert.equal(p.record(s,3,40,true),false);
});
test('progresso e talentos persistem; dados inválidos são limitados',()=>{
 const storage={value:null,getItem(){return this.value},setItem(k,v){this.value=v}};const s=p.normalize();p.record(s,1,40,true);p.select(s,2);s.talents.vitality=2;p.save(storage,s);assert.deepEqual(p.load(storage),s);
 storage.value='invalid';assert.equal(p.load(storage).selected,1);const bad=p.normalize({unlocked:-10,selected:400,best:{1:999},talents:{vitality:999,agility:'x'}});assert.equal(bad.selected,1);assert.equal(bad.best[1],40);assert.equal(bad.talents.vitality,3);assert.equal(bad.talents.agility,0);
});
test('talentos custam moedas, têm limite e rejeitam compra sem saldo',()=>{
 const s=p.normalize(),wallet={coins:29};assert.equal(p.upgrade(s,wallet,'vitality').ok,false);assert.equal(wallet.coins,29);
 wallet.coins=200;for(let i=0;i<3;i++)assert.equal(p.upgrade(s,wallet,'vitality').ok,true);assert.equal(wallet.coins,10);assert.equal(s.talents.vitality,3);assert.equal(p.upgrade(s,wallet,'vitality').reason,'max');assert.equal(p.upgrade(s,wallet,'unknown').reason,'unknown');
});

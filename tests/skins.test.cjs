'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const shop=require('../www/skins.js');
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};};
test('uma nova instalação começa com melancia grátis, sem moedas',()=>{
 const s=shop.load(memory());
 assert.deepEqual(s,{coins:0,owned:['melon'],selected:'melon'});
 assert.equal(shop.choose(s,'melon').action,'equipped');
});
test('moedas e aparências desbloqueadas são persistidas e equipadas',()=>{
 const storage=memory(),s=shop.load(storage);
 for(let p=1;p<=40;p++)shop.earn(s,shop.coinsForPlatform(p));
 shop.earn(s,shop.coinsForLevel());
 assert.equal(s.coins,32);
 assert.equal(shop.choose(s,'lemon').ok,false);
 assert.equal(shop.choose(s,'lemon').missing,28);
 shop.earn(s,28);
 assert.deepEqual(shop.choose(s,'lemon'),{ok:true,action:'unlocked',price:60});
 assert.equal(s.coins,0);
 assert.equal(shop.choose(s,'melon').action,'equipped');
 assert.equal(shop.choose(s,'lemon').action,'equipped');
 assert.ok(shop.save(storage,s));
 assert.deepEqual(shop.load(storage),{coins:0,owned:['melon','lemon'],selected:'lemon'});
});
test('não permite comprar com moedas insuficientes ou itens inexistentes',()=>{
 const s=shop.normalize({coins:50});
 const old=JSON.stringify(s);
 assert.equal(shop.choose(s,'blueberry').reason,'coins');
 assert.equal(shop.choose(s,'invalid').reason,'unknown');
 assert.equal(JSON.stringify(s),old);
 shop.earn(s,90);
 assert.equal(shop.choose(s,'blueberry').ok,true);
 assert.equal(s.coins,0);
 assert.equal(shop.choose(s,'blueberry').price,0);
});
test('recupera dados inválidos e não duplica aparências',()=>{
 const broken={getItem(){return '{bad-json';},setItem(){throw Error('blocked');}};
 assert.deepEqual(shop.load(broken),shop.normalize());
 assert.equal(shop.save(broken,shop.normalize()),false);
 assert.deepEqual(shop.normalize({coins:-3,owned:['lemon','lemon','bogus'],selected:'bogus'}),{coins:0,owned:['melon','lemon'],selected:'melon'});
 assert.equal(shop.normalize({coins:1e30}).coins,100000000);
});
test('recompensas não se confundem com pontuação nem Fever',()=>{
 const state=shop.normalize();
 let awarded=0;
 for(let i=1;i<=80;i++)awarded+=shop.coinsForPlatform(i);
 assert.equal(awarded,40);
 assert.equal(shop.coinsForLevel(),12);
 assert.equal(shop.coinsForPlatform(0),0);
 assert.equal(shop.coinsForPlatform(-4),0);
 assert.equal(shop.coinsForPlatform(5),0);
 assert.equal(shop.earn(state,-100),0);
 assert.equal(shop.earn(state,1.2),0);
 assert.equal(shop.earn(state,52),52);
});

test('economia de 100 fases: recompensa limitada, compras únicas e recarga segura',()=>{
 const storage=memory(),state=shop.load(storage);
 let expected=0;
 for(let level=1;level<=100;level++){
  const platforms=40+Math.min(40,6*Math.floor((level-1)/2));
  for(let passed=1;passed<=platforms;passed++){
   const reward=shop.coinsForPlatform(passed);
   assert.equal(reward,passed%4===0?2:0);
   expected+=reward;
   assert.equal(shop.earn(state,reward),reward);
  }
  expected+=12;
  assert.equal(shop.earn(state,shop.coinsForLevel()),12);
  assert.equal(state.coins,expected);
  assert.equal(shop.save(storage,state),true);
  assert.deepEqual(shop.load(storage),state);
 }
 const original=state.coins;
 for(const item of shop.CATALOG.slice(1)){
  const first=shop.choose(state,item.id);
  assert.equal(first.ok,true);
  assert.equal(first.price,item.price);
  const after=state.coins;
  const again=shop.choose(state,item.id);
  assert.equal(again.action,'equipped');
  assert.equal(state.coins,after,'repetir escolha não pode cobrar moedas');
 }
 assert.equal(state.coins,original-shop.CATALOG.slice(1).reduce((sum,item)=>sum+item.price,0));
 assert.equal(shop.save(storage,state),true);
 assert.deepEqual(shop.load(storage),state);
});

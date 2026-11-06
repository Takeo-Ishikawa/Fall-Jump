'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fever = require('../www/fever.js');

test('cinco passagens pela abertura ativam Fever por quatro segundos', () => {
  const state = fever.create();
  assert.equal(fever.GAP_TARGET, 5);
  for (let i = 0; i < 4; i++) {
    assert.equal(fever.onGap(state), false);
    assert.equal(state.charge, i + 1);
    assert.equal(fever.active(state), false);
  }
  assert.equal(fever.onGap(state), true);
  assert.equal(fever.active(state), true);
  assert.equal(state.remaining, 240);
  assert.equal(state.charge, 0);
  assert.equal(state.activations, 1);
  assert.equal(fever.multiplier(state), 2);
});

test('quicar cancela carga parcial, mas não interrompe Fever ativado', () => {
  const state = fever.create();
  fever.onGap(state); fever.onGap(state); fever.onGap(state);
  fever.onBounce(state);
  assert.equal(state.charge, 0);
  assert.equal(fever.multiplier(state), 1);
  for (let i = 0; i < fever.GAP_TARGET; i++) fever.onGap(state);
  assert.equal(fever.active(state), true);
  fever.onBounce(state);
  assert.equal(fever.active(state), true);
});

test('tempo acaba em exatamente 240 passos, sem carga automática durante Fever', () => {
  const state = fever.create();
  for (let i = 0; i < fever.GAP_TARGET; i++) fever.onGap(state);
  for (let i = 0; i < 100; i++) assert.equal(fever.onGap(state), false);
  assert.equal(state.charge, 0);
  for (let i = 1; i < fever.DURATION_FRAMES; i++) {
    assert.equal(fever.tick(state), false);
    assert.equal(fever.active(state), true);
  }
  assert.equal(fever.tick(state), true);
  assert.equal(fever.tick(state), false);
  assert.equal(fever.active(state), false);
  assert.equal(fever.multiplier(state), 1);
  assert.equal(fever.progress(state), 0);
  assert.equal(fever.onGap(state), false);
  assert.equal(state.charge, 1);
});

test('indicador e reset são determinísticos para novas partidas', () => {
  const state = fever.create();
  assert.equal(fever.progress(state), 0);
  fever.onGap(state);
  assert.equal(fever.progress(state), 0.2);
  for (let i = 0; i < 4; i++) fever.onGap(state);
  assert.equal(fever.progress(state), 1);
  fever.tick(state);
  assert.ok(fever.progress(state) < 1);
  fever.reset(state);
  assert.deepEqual(state, fever.create());
});
test('Fever rompe discos normais e bônus, mas jamais neutraliza áreas perigosas', () => {
  const state=fever.create();
  assert.equal(fever.contact(state,{gap:false,danger:false,fragile:false}),'bounce');
  assert.equal(fever.contact(state,{gap:false,danger:false,fragile:true}),'smash');
  assert.equal(fever.contact(state,{gap:false,danger:true,fragile:true}),'lose');
  for(let i=0;i<fever.GAP_TARGET;i++)fever.onGap(state);
  assert.equal(fever.contact(state,{gap:false,danger:false,fragile:false}),'smash');
  assert.equal(fever.contact(state,{gap:false,danger:false,fragile:true}),'smash');
  assert.equal(fever.contact(state,{gap:false,danger:true,fragile:false}),'lose');
  assert.equal(fever.contact(state,{gap:true,danger:false,fragile:false}),'gap');
  fever.reset(state);
  assert.equal(fever.contact(state,{gap:false,danger:false,fragile:false}),'bounce');
});


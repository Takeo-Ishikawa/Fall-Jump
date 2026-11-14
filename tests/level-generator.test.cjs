'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const generator = require('../www/level-generator.js');

test('gerador determinístico para fase e seed fixas', () => {
  const a = generator.generateLevel(14, 123456789);
  const b = generator.generateLevel(14, 123456789);
  assert.deepEqual(a, b);
  assert.equal(generator.generateLevel(1, 0).seed, 0);
});

test('fases de 1 a 100 geradas e atravessáveis em simulação conservadora', () => {
  for (const level of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 50, 100]) {
    for (let i = 0; i < 100; i++) {
      const plan = generator.generateLevel(level, (level * 7919 + i * 104729) >>> 0);
      assert.ok(generator.validateLevel(plan), 'nível inválido: ' + level + ', seed ' + plan.seed);
      assert.ok(generator.simulateRoute(plan).ok, 'sem rota válida');
      assert.equal(plan.platforms.length, 40 + Math.min(40, 6 * Math.floor((level - 1) / 2)));
      assert.ok(plan.platforms.length >= 40 && plan.platforms.length <= 80);
      assert.ok(plan.platforms.every((p, j) => p.y === j * generator.SPACING));
      assert.equal(plan.platforms[0].danger, 0);
      for (let j = 1; j < plan.platforms.length; j++) {
        const p = plan.platforms[j], previous = plan.platforms[j - 1];
        assert.ok(!(p.danger > 0 && previous.danger > 0), 'perigos consecutivos');
        assert.ok(!(p.special && previous.special), 'especiais consecutivas');
      }
    }
  }
});

test('torres maiores combinam trechos longos, com diferentes identidades de desafio', () => {
  for (const level of [1, 2, 3, 4, 5, 10, 13]) {
    const plan = generator.generateLevel(level, 424242);
    const segmentLength = s => s.to - s.from + 1;
    assert.ok(plan.segments.length >= 4, 'fase inteira não pode ser um padrão único');
    assert.ok(plan.segments.every(s => segmentLength(s) >= 1));
    assert.equal(plan.segments[0].from, 0);
    assert.equal(plan.segments.at(-1).to, plan.count - 1);
    assert.ok(plan.segments.some(s => segmentLength(s) >= 4), 'deve conter sequência prolongada');
    assert.ok(new Set(plan.segments.map(s => s.type)).size >= 2, 'variação modular insuficiente');
  }
  for (let phase = 0; phase < 5; phase++) {
    const plan = generator.generateLevel(phase + 1, 333);
    assert.equal(plan.phase, phase);
  }
});

test('a semente produz variações e não apenas os mesmos layouts', () => {
  const signatures = new Set();
  for (let seed = 1; seed <= 35; seed++) {
    const plan = generator.generateLevel(10, seed);
    const signature = plan.platforms.map(p => p.angle.toFixed(3) + ':' + p.gap.toFixed(3)).join('|');
    signatures.add(signature);
  }
  assert.ok(signatures.size >= 25, 'variação insuficiente');
});

test('respiro reduz intensidade em relação ao desafio do ciclo anterior', () => {
  for (let start of [1, 6, 11, 21]) {
    const challenge = generator.difficultyFor(start + 3);
    const recovery = generator.difficultyFor(start + 4);
    assert.ok(recovery.intensity < challenge.intensity);
  }
});

test('nunca inclui condições ilegais no plano', () => {
  const plan = generator.generateLevel(5, 987654321);
  assert.ok(generator.validateLevel(plan));
  const invalid = structuredClone(plan);
  invalid.platforms[3].gap = 0.10;
  assert.equal(generator.validateLevel(invalid), false);
  invalid.platforms[3].gap = plan.platforms[3].gap;
  invalid.platforms[2].danger = 0.4;
  assert.equal(generator.validateLevel(invalid), false);
  const impossible = structuredClone(plan);
  const last = impossible.platforms.length - 1;
  impossible.platforms[last].angle = generator.signedAngle(impossible.platforms[last - 1].angle + Math.PI);
  assert.equal(generator.simulateRoute(impossible).ok, false, 'uma mudança de 180° não pode ser instantânea');
});

test('auditoria de variedade e segurança em diferentes ciclos de dificuldade', () => {
 for (const level of [1,2,3,4,5,10,20,30,50,75,100]) {
  const layouts=new Set();
  const patterns=new Set();
  for (let seed=1;seed<=24;seed++) {
   const plan=generator.generateLevel(level,(seed*2654435761)>>>0);
   assert.ok(generator.validateLevel(plan),`fase ${level}, seed ${seed}: plano inválido`);
   assert.ok(generator.simulateRoute(plan).ok,`fase ${level}, seed ${seed}: rota impossível`);
   assert.equal(plan.platforms[0].danger,0,'primeira plataforma deve ser segura');
   assert.equal(plan.platforms.at(-1).danger,0,'última plataforma deve ser segura');
   const signature=plan.platforms.map(p=>[p.angle.toFixed(2),p.gap.toFixed(2),p.danger.toFixed(2),p.special||'-'].join(':')).join('|');
   layouts.add(signature);
   for(const segment of plan.segments)patterns.add(segment.type);
  }
  assert.ok(layouts.size>=20,`fase ${level}: diversidade insuficiente (${layouts.size}/24)`);
  assert.ok(patterns.size>=2,`fase ${level}: poucos tipos de trecho`);
 }
});

test('curva de dificuldade preserva o ciclo de desafio e respiro',()=>{
 for(let start=1;start<=96;start+=5){
  const intensities=Array.from({length:5},(_,offset)=>generator.difficultyFor(start+offset).intensity);
  assert.ok(intensities[0]<intensities[1]);
  assert.ok(intensities[1]<intensities[2]);
  assert.ok(intensities[2]<intensities[3]);
  assert.ok(intensities[4]<intensities[3]);
 }
});

 test('aberturas menores mantêm largura entre 0,65 e 1,20 radianos',()=>{
  const generator=require('../www/level-generator.js');
  for(let level=1;level<=30;level++)for(const p of generator.generateLevel(level,12345+level).platforms){
   assert.ok(p.gap>=.65&&p.gap<=1.20);
  }
 });

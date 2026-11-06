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
      assert.equal(plan.platforms.length, 10 + Math.min(4, Math.floor((level - 1) / 3)));
      assert.ok(plan.platforms.every((p, j) => p.y === j * 137));
      assert.equal(plan.platforms[0].danger, 0);
      for (let j = 1; j < plan.platforms.length; j++) {
        const p = plan.platforms[j], previous = plan.platforms[j - 1];
        assert.ok(!(p.danger > 0 && previous.danger > 0), 'perigos consecutivos');
        assert.ok(!(p.special && previous.special), 'especiais consecutivas');
      }
    }
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

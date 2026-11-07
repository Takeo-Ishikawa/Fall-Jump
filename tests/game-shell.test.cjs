'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

test('inicialização, controles e primeiros frames do jogo carregam sem exceções', () => {
  const html = fs.readFileSync(path.join(root, 'www/index.html'), 'utf8');
  const tags = [...html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g)];
  assert.deepEqual(tags.filter(x => x[1]).map(x => x[1]), ['level-generator.js', 'fever.js', 'skins.js', 'goals.js']);
  const inline = tags.find(x => !x[1])?.[2];
  assert.ok(inline, 'o script principal deve estar presente');
  assert.doesNotThrow(() => new Function(inline), 'sintaxe do script principal');

  const Goals=require('../www/goals.js');
  const goalsReady=Goals.create(Goals.localDay(new Date()));
  Goals.record(goalsReady,{platforms:100,combo:10},goalsReady.daily.day);
  const nodes = new Map(), canvasEvents = {};
  const gradient = { addColorStop() {} };
  const ctx = new Proxy({}, {
    get(target, key) {
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient;
      if (key in target) return target[key];
      return () => {};
    },
    set(target, key, value) { target[key] = value; return true; }
  });
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, {
      style: {}, textContent: '', hidden: false,
      classList: { add() {}, remove() {}, toggle() {} },
      setAttribute() {}, addEventListener(event, listener) {
        if (selector === '#game') canvasEvents[event] = listener;
      },
      setPointerCapture() {}, getContext: () => ctx
    });
    return nodes.get(selector);
  };
  let scheduledFrame;
  const browser = {
    innerWidth: 390, innerHeight: 780, location: { protocol: 'file:', search: '' },
    addEventListener() {}, FallJumpLevelGenerator: require('../www/level-generator.js'),
    FallJumpFever: require('../www/fever.js'),
    FallJumpSkins: require('../www/skins.js'),
    FallJumpGoals: require('../www/goals.js')
  };
  const sandbox = {
    document: { querySelector: node, documentElement: { clientWidth: 390 }, addEventListener() {} },
    window: browser, location: browser.location,
    navigator: {}, localStorage: {
      getItem(key) {return key===Goals.KEY?JSON.stringify(goalsReady):null;},
      setItem(key,value){if(key===Goals.KEY)Object.assign(goalsReady,JSON.parse(value));}
    },
    innerWidth: 390, innerHeight: 780, devicePixelRatio: 1,
    requestAnimationFrame(fn) { scheduledFrame = fn; },
    URLSearchParams, Math, console
  };
  assert.doesNotThrow(() => vm.runInNewContext(inline, sandbox, { timeout: 5000 }));
  assert.equal(typeof scheduledFrame, 'function');
  assert.ok(node('#feverAmount').textContent.includes('/5'));
  assert.equal(typeof node('#restart').onclick, 'function');
  assert.equal(node('#coinCount').textContent,'0');
  assert.ok(node('#goalsButton').textContent.includes('para resgatar'));
  assert.equal(typeof node('#skinsButton').onclick,'function');
  node('#skinsButton').onclick();
  assert.equal(node('#shopSection').hidden,false);
  node('#skin-lemon').onclick();
  assert.ok(node('#shopFeedback').textContent.includes('Faltam 60'));
  node('#restart').onclick(); // Voltar do catálogo ao menu
  assert.equal(node('#shopSection').hidden,true);
  assert.equal(typeof node('#goalsButton').onclick,'function');
  node('#goalsButton').onclick();
  assert.equal(node('#goalsSection').hidden,false);
  assert.ok(node('#daily-name-0').textContent.length>0);
  assert.ok(node('#goalsCountdown').textContent.includes('Novas missões em '));
  assert.ok(node('#goalsOverview').textContent.includes('para resgatar'));
  assert.equal(node('#daily-claim-0').disabled,true);
  assert.ok(node('#ach-name-0').textContent.length>0);
  assert.equal(node('#ach-claim-0').disabled,false);
  assert.equal(node('#ach-claim-0').textContent,'Resgatar +30');
  node('#ach-claim-0').onclick();
  assert.equal(node('#coinCount').textContent,'30');
  assert.equal(node('#ach-claim-0').disabled,true);
  assert.equal(node('#rewardMedalAmount').textContent,'+30 MOEDAS');
  assert.equal(node('#rewardMedalName').textContent,'Primeiros saltos');
  assert.equal(node('#goalCelebration').style.opacity,undefined);
  assert.ok(!node('#goalsOverview').textContent.includes('2 recompensas disponíveis'));
  node('#ach-claim-0').onclick();
  assert.equal(node('#coinCount').textContent,'30');
  node('#restart').onclick(); // Voltar das missões para o menu
  assert.equal(node('#goalsSection').hidden,true);
  node('#restart').onclick(); // Iniciar a partida
  assert.equal(typeof canvasEvents.pointerdown, 'function');
  canvasEvents.pointerdown({ clientX: 170, pointerId: 1 });
  for (let i = 0; i < 80; i++) scheduledFrame(i * 1000 / 60);
  assert.ok(node('#level').textContent.includes('NÍVEL 1'));
  assert.ok(node('#stageSeed').textContent.includes('FASE #'));
  assert.ok(Number(node('#score').textContent) >= 0);
});

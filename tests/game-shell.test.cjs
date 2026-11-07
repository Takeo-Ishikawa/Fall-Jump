'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

test('estrutura HTML tem menus e indicadores reais, sem IDs duplicados ou divs abertas',()=>{
 const html=fs.readFileSync(path.join(root,'www/index.html'),'utf8');
 const required=['panelBack','menuInstructions','pauseInstructions','goalsDailyTab','goalsAchievementTab','goalsDailyGroup','goalsAchievementGroup','progressCount','resultSummary','resultPlatforms','resultCombo','resultCoins','restart','menuButton','help','pause'];
 for(const id of required){
  const count=html.split('id="'+id+'"').length-1;
  assert.equal(count,1,'id ausente ou duplicado: '+id);
 }
 for(const tag of ['div','button','span','h3']){
  const opening=(html.match(new RegExp('<'+tag+'(?:\\s|>)','g'))||[]).length;
  const closing=(html.match(new RegExp('</'+tag+'>','g'))||[]).length;
  assert.equal(opening,closing,'tags desequilibradas: '+tag);
 }
 assert.ok(html.includes('touch-action:pan-y'),'painel deve permitir rolagem vertical');
});

test('inicialização, controles e primeiros frames do jogo carregam sem exceções', () => {
  const html = fs.readFileSync(path.join(root, 'www/index.html'), 'utf8');
  const tags = [...html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g)];
  assert.deepEqual(tags.filter(x => x[1]).map(x => x[1]), ['level-generator.js', 'fever.js', 'skins.js', 'goals.js']);
  const inline = tags.find(x => !x[1])?.[2];
  assert.ok(inline, 'o script principal deve estar presente');
  assert.doesNotThrow(() => new Function(inline), 'sintaxe do script principal');
  const endHook='resize();reset();refreshBest();menu();requestAnimationFrame(update)})();';
  assert.ok(inline.includes(endHook),'inicialização deve ser reconhecível para o teste');
  const instrumented=inline.replace(endHook,'window.__fjTest={end,completePlatform,getPlatforms:()=>platforms};'+endHook);

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
  assert.doesNotThrow(() => vm.runInNewContext(instrumented, sandbox, { timeout: 5000 }));
  assert.equal(typeof scheduledFrame, 'function');
  assert.ok(node('#feverAmount').textContent.includes('/5'));
  assert.equal(typeof node('#restart').onclick, 'function');
  assert.equal(node('#coinCount').textContent,'0');
  assert.ok(node('#goalsButton').textContent.includes('para resgatar'));
  assert.equal(node('#menuInstructions').style.display,'block');
  assert.equal(node('#help').style.display,'none');
  node('#menuInstructions').onclick();
  assert.equal(node('#message').textContent,'Como jogar');
  assert.equal(node('#restart').textContent,'Voltar ao menu');
  assert.equal(node('#goalsButton').style.display,'none');
  assert.equal(node('#legend').hidden,false);
  assert.equal(node('#panelBack').style.display,'block');
  node('#panelBack').onclick();
  assert.equal(node('#message').textContent,'FALL JUMP');
  assert.equal(typeof node('#skinsButton').onclick,'function');
  node('#skinsButton').onclick();
  assert.equal(node('#shopSection').hidden,false);
  node('#skin-lemon').onclick();
  assert.ok(node('#shopFeedback').textContent.includes('Faltam 60'));
  assert.equal(node('#panelBack').style.display,'block');
  node('#panelBack').onclick(); // Navegação acessível no topo da loja
  assert.equal(node('#shopSection').hidden,true);
  assert.equal(typeof node('#goalsButton').onclick,'function');
  node('#goalsButton').onclick();
  assert.equal(node('#goalsSection').hidden,false);
  assert.equal(node('#panelBack').style.display,'block');
  node('#goalsDailyTab').onclick();
  assert.equal(node('#goalsDailyGroup').hidden,false);
  assert.equal(node('#goalsAchievementGroup').hidden,true);
  node('#goalsAchievementTab').onclick();
  assert.equal(node('#goalsDailyGroup').hidden,true);
  assert.equal(node('#goalsAchievementGroup').hidden,false);
  node('#goalsDailyTab').onclick();
  assert.ok(node('#daily-name-0').textContent.length>0);
  assert.ok(node('#goalsCountdown').textContent.includes('Novas missões em '));
  assert.ok(node('#goalsOverview').textContent.includes('para resgatar'));
  assert.equal(node('#daily-claim-0').disabled,true);
  assert.ok(node('#ach-name-0').textContent.length>0);
  assert.equal(node('#ach-claim-0').disabled,false);
  assert.equal(node('#ach-claim-0').textContent,'Resgatar +30');
  const readyBeforeClaim=Number(node('#goalsOverview').textContent.match(/^\d+/)[0]);
  node('#ach-claim-0').onclick();
  assert.equal(node('#coinCount').textContent,'30');
  assert.equal(node('#ach-claim-0').disabled,true);
  assert.equal(node('#rewardMedalAmount').textContent,'+30 MOEDAS');
  assert.equal(node('#rewardMedalName').textContent,'Primeiros saltos');
  assert.equal(node('#goalCelebration').style.opacity,undefined);
  const readyAfterClaim=Number(node('#goalsOverview').textContent.match(/^\d+/)?.[0]||0);
  assert.equal(readyAfterClaim,readyBeforeClaim-1);
  node('#ach-claim-0').onclick();
  assert.equal(node('#coinCount').textContent,'30');
  node('#panelBack').onclick(); // Voltar das missões sem descer a tela inteira
  assert.equal(node('#goalsSection').hidden,true);
  node('#restart').onclick(); // Iniciar a partida
  assert.equal(node('#progressCount').textContent,'0 / 40');
  assert.equal(node('#resultSummary').hidden,true);
  assert.equal(node('#help').style.display,'block');
  node('#help').onclick(); // Ajuda acessível durante a partida
  assert.equal(node('#message').textContent,'Como jogar');
  node('#restart').onclick(); // Continuar após ler ajuda
  assert.equal(node('#pause').style.display,'block');
  node('#pause').onclick();
  assert.equal(node('#message').textContent,'Pausado');
  assert.equal(node('#pauseInstructions').style.display,'block');
  node('#pauseInstructions').onclick();
  assert.equal(node('#message').textContent,'Como jogar');
  node('#restart').onclick(); // Continuar após ajuda da pausa
  node('#pause').onclick();
  node('#menuButton').onclick(); // Solicitar saída
  assert.equal(node('#message').textContent,'Sair da partida?');
  assert.equal(node('#restart').textContent,'Continuar jogando');
  assert.equal(node('#menuButton').textContent,'Sair da partida');
  node('#restart').onclick(); // Cancelar saída deve preservar partida
  assert.equal(node('#overlay').style.display,'none');
  node('#pause').onclick();
  node('#menuButton').onclick();
  node('#menuButton').onclick(); // Confirmar saída de fato
  assert.equal(node('#message').textContent,'FALL JUMP');
  node('#restart').onclick(); // Nova partida
  assert.equal(typeof canvasEvents.pointerdown, 'function');
  canvasEvents.pointerdown({ clientX: 170, pointerId: 1 });
  for (let i = 0; i < 80; i++) scheduledFrame(i * 1000 / 60);
  assert.ok(node('#level').textContent.includes('NÍVEL 1'));
  assert.ok(node('#stageSeed').textContent.includes('FASE #'));
  assert.ok(Number(node('#score').textContent) >= 0);
  const platforms=browser.__fjTest.getPlatforms();
  assert.equal(platforms.length,40);
  for(const platform of platforms)browser.__fjTest.completePlatform(platform);
  assert.equal(node('#message').textContent,'Nível 1 concluído!');
  assert.equal(node('#resultSummary').hidden,false);
  assert.equal(node('#resultPlatforms').textContent,'40 / 40');
  assert.equal(node('#resultCombo').textContent,'40');
  assert.equal(node('#resultCoins').textContent,'+32');
  assert.equal(node('#progressCount').textContent,'40 / 40');
  node('#restart').onclick(); // Próxima fase
  assert.equal(node('#level').textContent,'NÍVEL 2');
  assert.equal(node('#progressCount').textContent,'0 / 40');
  assert.equal(node('#resultSummary').hidden,true);
  browser.__fjTest.end(false);
  assert.equal(node('#message').textContent,'Fim de jogo');
  assert.equal(node('#restart').textContent,'Tentar novamente');
  node('#restart').onclick();
  assert.equal(node('#level').textContent,'NÍVEL 2','a derrota não deve reiniciar no nível 1');
  assert.equal(node('#score').textContent,0,'nova tentativa zera apenas a pontuação');
  assert.equal(node('#progressCount').textContent,'0 / 40');
  assert.equal(node('#resultSummary').hidden,true);
});

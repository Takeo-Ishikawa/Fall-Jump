'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function game(){
 const html=fs.readFileSync(path.join(__dirname,'../www/index.html'),'utf8');
 const source=[...html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g)].find(m=>!m[1])[2];
 const nodes=new Map(),gradient={addColorStop(){}};
 const ctx=new Proxy({}, {get:(_,k)=>k.startsWith('create')?()=>gradient:()=>{},set:()=>true});
 const node=id=>{if(!nodes.has(id))nodes.set(id,{style:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},setPointerCapture(){},getContext:()=>ctx});return nodes.get(id)};
 const win={addEventListener(){},FallJumpLevelGenerator:require('../www/level-generator.js'),FallJumpFever:require('../www/fever.js'),FallJumpSkins:require('../www/skins.js'),FallJumpGoals:require('../www/goals.js')};
 const sandbox={window:win,document:{querySelector:node,documentElement:{clientWidth:390},addEventListener(){}},innerWidth:390,innerHeight:844,devicePixelRatio:1,location:{protocol:'file:',search:'?seed=123'},navigator:{},localStorage:{getItem(){return null},setItem(){}},requestAnimationFrame(){},URLSearchParams,console};
 const hook='resize();reset();refreshBest();menu();requestAnimationFrame(update)})();';
 const expose=`window.motion={approachEnemy:(offset,velocity)=>{const e=enemies[0];e.speed=0;walkAngle=norm(rotation+e.platform.angle+e.angle);ballX=Math.sin(walkAngle)*walkRadius;ballZ=Math.cos(walkAngle)*walkRadius;ballY=e.platform.y-2*enemyHeight-contactRadius+offset;vy=velocity;grounded=null;jumping=true},enemies:()=>enemies,makeEnemies:createEnemies,stepEnemies:updateEnemies,collides:enemyCollision,putEnemy:(offset=0)=>{const p=platforms[0],angle=norm(walkAngle-rotation-p.angle+offset);enemies=[{platform:p,min:angle-.6,max:angle+.6,angle,direction:1,speed:.007,phase:0,hp:3,hitFlash:0,defeated:false}]},down,move,up,cancel:cancelGesture,start:()=>{startGame();down({clientX:170,pointerId:1})},step:simulateStep,platforms:()=>platforms,rotate:a=>rotation=norm(a),state:()=>({x:ballX,z:ballZ,y:ballY,vy,angle:walkAngle,phase:walkPhase,grounded:grounded?.y,passed:levelPassed,mode}),pause:()=>pauseBtn.onclick(),resume:resumeGame,fever:()=>{for(let i=0;i<5;i++)Fever.onGap(feverState)}};`;
 vm.runInNewContext(source.replace(hook,expose+hook),sandbox);
 const g=win.motion;g.start();
 for(const p of g.platforms()){p.angle=Math.PI;p.gap=.8;p.danger=0;p.special=null;}
 g.rotate(0);return g;
}
function steps(g,n){for(let i=0;i<n;i++)g.step();}
test('caminha sobre superfície sem impulso vertical; pausa congela posição e passada',()=>{
 const g=game(),initial=g.state();steps(g,60);const walking=g.state();
 assert.ok(walking.x>initial.x+30);assert.equal(walking.y,initial.y);assert.equal(walking.vy,0);assert.equal(walking.passed,0);
 g.pause();const paused=g.state();steps(g,120);assert.deepEqual(g.state(),paused);
 g.resume();g.step();assert.ok(g.state().angle>paused.angle);
});
test('alcançar abertura inicia queda; pouso na plataforma seguinte não produz salto',()=>{
 const g=game();steps(g,30);const angle=g.state().angle;
 g.rotate(angle-Math.PI);g.step();assert.equal(g.state().passed,1);assert.equal(g.state().grounded,undefined);assert.ok(g.state().vy>0);
 // The next platform presents a solid safe surface underneath the fall.
 g.rotate(0);
 g.platforms()[1].angle=g.state().angle+Math.PI;
 for(let i=0;i<70;i++){g.step();assert.ok(g.state().vy>=0,'não deve haver impulso de salto');}
 assert.equal(g.state().grounded,205);assert.equal(g.state().passed,1);assert.equal(g.state().vy,0);
});
test('caminhar sobre perigo encerra a tentativa, inclusive durante Fever',()=>{
 for(const powered of [false,true]){const g=game();if(powered)g.fever();const p=g.platforms()[0];p.angle=-1.4;p.danger=.8;g.step();assert.equal(g.state().mode,'gameover');}
});
test('plataforma frágil e Fever liberam a queda sem salto',()=>{
 for(const powered of [false,true]){const g=game();if(powered)g.fever();else g.platforms()[0].special='fragile';g.step();assert.equal(g.platforms()[0].broken,true);assert.equal(g.state().passed,1);assert.ok(g.state().vy>0);}
});
test('reiniciar restaura posição inicial apoiada e limpa a passada',()=>{
 const g=game();steps(g,90);g.start();assert.equal(g.state().grounded,0);assert.equal(g.state().angle,0);assert.equal(g.state().phase,0);assert.equal(g.state().vy,0);assert.equal(g.state().passed,0);
});

function tap(g,time,x=170,y=400,duration=40){
 g.down({clientX:x,clientY:y,pointerId:1,timeStamp:time,button:0});
 g.up({clientX:x,clientY:y,pointerId:1,timeStamp:time+duration});
}
test('dois toques saltam para frente e pousam sem iniciar outro salto',()=>{
 const g=game(),initial=g.state();tap(g,100);assert.equal(g.state().vy,0);
 tap(g,250);assert.ok(g.state().vy<0);assert.equal(g.state().grounded,undefined);
 steps(g,12);assert.ok(g.state().y<initial.y-30);assert.ok(g.state().angle>initial.angle);
 steps(g,40);assert.equal(g.state().grounded,0);assert.equal(g.state().vy,0);assert.equal(g.state().y,initial.y);
});
test('não permite salto adicional no ar nem durante queda por abertura',()=>{
 const g=game();tap(g,100);tap(g,230);steps(g,10);const velocity=g.state().vy;
 tap(g,500);tap(g,630);assert.equal(g.state().vy,velocity);
 const falling=game();falling.rotate(-Math.PI);falling.step();const fallSpeed=falling.state().vy;
 tap(falling,100);tap(falling,230);assert.equal(falling.state().vy,fallSpeed);
});
test('arrastar, segurar, toques distantes ou lentos não geram salto',()=>{
 for(const scenario of ['drag','hold','distant','slow']){
  const g=game();tap(g,100);
  if(scenario==='drag'){
   g.down({clientX:170,clientY:400,pointerId:1,timeStamp:220});
   g.move({clientX:210,clientY:400,pointerId:1});
   g.move({clientX:170,clientY:400,pointerId:1});
   g.up({clientX:170,clientY:400,pointerId:1,timeStamp:260});
  }else if(scenario==='hold')tap(g,220,170,400,400);
  else if(scenario==='distant')tap(g,220,250);
  else tap(g,700);
  assert.equal(g.state().vy,0,scenario);assert.equal(g.state().grounded,0,scenario);
 }
});
test('pausa e cancelamento apagam o primeiro toque pendente',()=>{
 for(const pause of [false,true]){
  const g=game();tap(g,100);
  if(pause){g.pause();tap(g,180);g.resume();}else g.cancel();
  tap(g,250);assert.equal(g.state().vy,0);
 }
});
test('botão secundário e toque simultâneo não contam como salto',()=>{
 const g=game();tap(g,100);
 g.down({clientX:170,clientY:400,pointerId:2,timeStamp:200,isPrimary:false});
 tap(g,250);assert.equal(g.state().vy,0);
 g.cancel();tap(g,500);
 g.down({clientX:170,clientY:400,pointerId:1,timeStamp:650,button:2});
 g.up({clientX:170,clientY:400,pointerId:1,timeStamp:690});assert.equal(g.state().vy,0);
});

test('patrulhas são determinísticas e evitam início, aberturas, perigo e discos frágeis',()=>{
 const g=game(),generator=require('../www/level-generator.js');
 for(let level=1;level<=30;level++){
  const disks=generator.generateLevel(level,level*12345).platforms;
  const patrols=g.makeEnemies(disks);
  assert.equal(JSON.stringify(patrols),JSON.stringify(g.makeEnemies(disks)));
  assert.ok(patrols.length>0&&patrols.length<disks.length/3);
  for(const e of patrols){
   assert.ok(disks.indexOf(e.platform)>=3);assert.notEqual(e.platform.special,'fragile');
   assert.ok(e.min>e.platform.gap/2&&e.max<Math.PI*2-e.platform.gap/2);
   if(e.platform.danger)assert.ok(e.min>e.platform.gap+.53+e.platform.danger);
  }
 }
});
test('inimigo inverte a direção nas extremidades sem sair do trecho',()=>{
 const g=game();g.putEnemy();const e=g.enemies()[0];const directions=new Set();
 for(let i=0;i<1000;i++){g.stepEnemies();assert.ok(e.angle>=e.min&&e.angle<=e.max);directions.add(e.direction);}
 assert.equal(directions.size,2);
});
test('contato com inimigo causa derrota mesmo durante Fever',()=>{
 for(const powered of [false,true]){const g=game();g.putEnemy();if(powered)g.fever();g.step();assert.equal(g.state().mode,'gameover');}
});
test('salto suficientemente alto passa por cima; inimigos de plataformas removidas não colidem',()=>{
 const g=game();tap(g,100);tap(g,230);steps(g,12);g.putEnemy();
 assert.equal(g.collides(),false,'personagem acima do inimigo');g.step();assert.equal(g.state().mode,'playing');
 const grounded=game();grounded.putEnemy();assert.equal(grounded.collides(),true);
 grounded.platforms()[0].broken=true;assert.equal(grounded.collides(),false);
 grounded.platforms()[0].broken=false;grounded.platforms()[0].passed=true;assert.equal(grounded.collides(),false);
});
test('pausa congela as patrulhas; retomada move e reinício recria os inimigos',()=>{
 const g=game();const initial=g.enemies().map(e=>e.angle);assert.ok(initial.length);
 g.pause();steps(g,100);assert.deepEqual(g.enemies().map(e=>e.angle),initial);
 g.resume();g.step();assert.notDeepEqual(g.enemies().map(e=>e.angle),initial);
 g.start();assert.deepEqual(g.enemies().map(e=>e.angle),initial);
});

test('três pisões distintos derrotam o inimigo; todos os acertos fazem quicar',()=>{
 const g=game();g.putEnemy();const e=g.enemies()[0];
 for(let hit=1;hit<=3;hit++){
  g.approachEnemy(-5,10);g.step();assert.equal(e.hp,3-hit);
  assert.ok(g.state().vy<0);assert.equal(g.state().mode,'playing');assert.equal(g.state().grounded,undefined);
  assert.equal(e.defeated,hit===3);steps(g,6);assert.equal(e.hp,3-hit,'um contato não pode contar duas vezes');
 }
 const stopped=e.angle;g.stepEnemies();assert.equal(e.angle,stopped);
 g.approachEnemy(10,0);assert.equal(g.collides(),false,'inimigo derrotado não machuca');
});
test('contato na subida ou de lado não conta como pisão',()=>{
 const g=game();g.putEnemy();g.approachEnemy(15,-2);g.step();
 assert.equal(g.enemies()[0].hp,3);assert.equal(g.state().mode,'gameover');
 const side=game();side.putEnemy();side.step();assert.equal(side.enemies()[0].hp,3);assert.equal(side.state().mode,'gameover');
});
test('queda rápida atravessando a cabeça conta como pisão, inclusive com Fever',()=>{
 const g=game();g.putEnemy();g.fever();g.approachEnemy(-1,14);g.step();
 assert.equal(g.enemies()[0].hp,2);assert.ok(g.state().vy<0);assert.equal(g.state().mode,'playing');
 assert.equal(g.state().passed,0,'pisão não conclui a plataforma nem concede seu bônus');
});
test('pausa preserva dano e reação do inimigo; reinício restaura três acertos',()=>{
 const g=game();g.putEnemy();g.approachEnemy(-5,10);g.step();const e=g.enemies()[0];
 g.pause();const flash=e.hitFlash;steps(g,100);assert.equal(e.hp,2);assert.equal(e.hitFlash,flash);
 g.start();assert.ok(g.enemies().every(enemy=>enemy.hp===3&&!enemy.defeated));
});

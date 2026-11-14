'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function game(storage=new Map()){
 const html=fs.readFileSync(path.join(__dirname,'../www/index.html'),'utf8');
 const source=[...html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g)].find(m=>!m[1])[2];
 const nodes=new Map(),gradient={addColorStop(){}};
 const ctx=new Proxy({}, {get:(_,k)=>k.startsWith('create')?()=>gradient:()=>{},set:()=>true});
 const node=id=>{if(!nodes.has(id))nodes.set(id,{style:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},setPointerCapture(){},getContext:()=>ctx});return nodes.get(id)};
 const win={addEventListener(){},FallJumpLevelGenerator:require('../www/level-generator.js'),FallJumpFever:require('../www/fever.js'),FallJumpSkins:require('../www/skins.js'),FallJumpGoals:require('../www/goals.js')};
 const sandbox={window:win,document:{querySelector:node,documentElement:{clientWidth:390},addEventListener(){}},innerWidth:390,innerHeight:844,devicePixelRatio:1,location:{protocol:'file:',search:'?seed=123'},navigator:{},localStorage:{getItem(key){return storage.get(key)??null},setItem(key,value){storage.set(key,value)}},requestAnimationFrame(){},URLSearchParams,console};
 const hook='resize();reset();refreshBest();menu();requestAnimationFrame(update)})();';
 const expose=`window.motion={hurt:hurtByEnemy,next:()=>startGame(true),equip:toggleSword,attack:swordAttack,ui:id=>document.querySelector(id),equipment:openEquipment,menu,position:a=>{walkAngle=norm(a);ballX=Math.sin(walkAngle)*walkRadius;ballZ=Math.cos(walkAngle)*walkRadius},camera:a=>cameraAngle=a,spawnAngle:()=>norm(platforms[0].angle+platforms[0].gap/2+.3),approachEnemy:(offset,velocity)=>{const e=enemies[0];e.speed=0;walkAngle=norm(rotation+e.platform.angle+e.angle);ballX=Math.sin(walkAngle)*walkRadius;ballZ=Math.cos(walkAngle)*walkRadius;ballY=e.platform.y-2*enemyHeight-contactRadius+offset;vy=velocity;grounded=null;jumping=true},enemies:()=>enemies,makeEnemies:createEnemies,stepEnemies:updateEnemies,collides:enemyCollision,putEnemy:(offset=0)=>{const p=platforms[0],angle=norm(walkAngle-rotation-p.angle+offset);enemies=[{platform:p,min:angle-.6,max:angle+.6,angle,direction:1,speed:.007,phase:0,hp:3,hitFlash:0,defeated:false}]},down,move,up,cancel:cancelGesture,start:()=>{startGame();down({clientX:170,pointerId:1})},step:simulateStep,platforms:()=>platforms,rotate:a=>rotation=norm(a),state:()=>({x:ballX,z:ballZ,y:ballY,vy,angle:walkAngle,camera:cameraAngle,rotation,health,hurtFrames,facing,equippedSword,attackCooldown,attackFrames,phase:walkPhase,grounded:grounded?.y,passed:levelPassed,mode}),pause:()=>pauseBtn.onclick(),resume:resumeGame,fever:()=>{for(let i=0;i<5;i++)Fever.onGap(feverState)}};`;
 vm.runInNewContext(source.replace(hook,expose+hook),sandbox);
 const g=win.motion;g.start();
 for(const p of g.platforms()){p.angle=Math.PI;p.gap=.8;p.danger=0;p.special=null;}
 g.rotate(0);g.position(0);return g;
}
function steps(g,n){for(let i=0;i<n;i++)g.step();}
test('caminha sobre superfície sem impulso vertical; pausa congela posição e passada',()=>{
 const g=game(),initial=g.state();steps(g,30);assert.equal(g.state().x,initial.x,'sem arraste não caminha');g.move({clientX:230,pointerId:1});steps(g,60);const walking=g.state();
 assert.ok(walking.x>initial.x+30);assert.equal(walking.y,initial.y);assert.equal(walking.vy,0);assert.equal(walking.passed,0);
 g.pause();const paused=g.state();steps(g,120);assert.deepEqual(g.state(),paused);
 g.move({clientX:250,pointerId:1});assert.deepEqual(g.state(),paused);g.resume();g.down({clientX:170,pointerId:1});g.move({clientX:180,pointerId:1});g.step();assert.ok(g.state().angle>paused.angle);
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
 const g=game();steps(g,90);g.start();assert.equal(g.state().grounded,0);assert.equal(g.state().angle,g.spawnAngle());assert.equal(g.state().phase,0);assert.equal(g.state().vy,0);assert.equal(g.state().passed,0);
});

function tap(g,time,x=170,y=400,duration=40){
 g.down({clientX:x,clientY:y,pointerId:1,timeStamp:time,button:0});
 g.up({clientX:x,clientY:y,pointerId:1,timeStamp:time+duration});
}
test('dois toques saltam e permitem ajustar posição no ar sem outro salto',()=>{
 const g=game(),initial=g.state();tap(g,100);assert.equal(g.state().vy,0);
 tap(g,250);assert.ok(g.state().vy<0);assert.equal(g.state().grounded,undefined);
 steps(g,12);assert.ok(g.state().y<initial.y-30);assert.equal(g.state().angle,initial.angle);g.down({clientX:170,pointerId:1});g.move({clientX:190,pointerId:1});assert.ok(g.state().angle>initial.angle);
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
test('contato com inimigo tira cinco pontos mesmo durante Fever',()=>{
 for(const powered of [false,true]){const g=game();g.putEnemy();if(powered)g.fever();g.step();assert.equal(g.state().health,95);assert.equal(g.state().mode,'playing');g.step();assert.equal(g.state().health,95);}
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
 assert.equal(g.enemies()[0].hp,3);assert.equal(g.state().health,95);assert.equal(g.state().mode,'playing');
 const side=game();side.putEnemy();side.step();assert.equal(side.enemies()[0].hp,3);assert.equal(side.state().health,95);assert.equal(side.state().mode,'playing');
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

test('arraste move o personagem e a câmera acompanha pelo caminho curto sem girar plataformas',()=>{
 const g=game(),angles=g.platforms().map(p=>p.angle);
 g.move({clientX:210,pointerId:1});const target=g.state().angle,firstCamera=g.state().camera;
 steps(g,80);assert.equal(g.state().angle,target);assert.ok(Math.abs(g.state().camera-target)<.001);
 assert.equal(g.state().rotation,0);assert.deepEqual(g.platforms().map(p=>p.angle),angles);
 g.position(.03);g.camera(Math.PI*2-.03);g.step();assert.ok(g.state().camera>Math.PI*2-.03);
 steps(g,80);assert.ok(Math.abs(g.state().camera-.03)<.001);
});

test('equipamento pode ser equipado, retirado e restaurado entre sessões',()=>{
 const storage=new Map(),g=game(storage);assert.equal(g.state().equippedSword,false);g.equipment();
 assert.equal(g.ui('#equipmentSection').hidden,false);assert.equal(g.ui('#panelBack').style.display,'block');assert.equal(g.ui('#restart').style.display,'none');
 g.equip();assert.equal(g.state().equippedSword,true);assert.equal(game(storage).state().equippedSword,true);
 g.equip();assert.equal(game(storage).state().equippedSword,false);
 assert.equal(game(new Map([['fall-jump-equipment-v1','invalid']])).state().equippedSword,false);
});
test('espada só ataca equipada em partida e botão some nos menus',()=>{
 const g=game();assert.equal(g.attack(),false);g.equip();assert.equal(g.ui('#attack').style.display,'block');
 g.pause();assert.equal(g.ui('#attack').style.display,'none');assert.equal(g.attack(),false);
 g.resume();assert.equal(g.ui('#attack').style.display,'block');g.equip();assert.equal(g.ui('#attack').style.display,'none');
});
test('golpe atinge apenas à frente, respeita alcance e intervalo e derrota com três acertos',()=>{
 const g=game();g.equip();g.putEnemy(.35);const e=g.enemies()[0];e.speed=0;
 for(let hit=1;hit<=3;hit++){
  assert.equal(g.attack(),true);assert.equal(e.hp,3-hit);assert.equal(g.attack(),false);assert.equal(e.hp,3-hit);steps(g,24);
 }
 assert.equal(e.defeated,true);
 const far=game();far.equip();far.putEnemy(.8);far.attack();assert.equal(far.enemies()[0].hp,3);
 const behind=game();behind.equip();behind.putEnemy(-.35);behind.attack();assert.equal(behind.enemies()[0].hp,3);
});
test('golpe segue última direção do arraste e pausa congela recarga',()=>{
 const g=game();g.equip();g.move({clientX:160,pointerId:1});assert.equal(g.state().facing,-1);
 g.putEnemy(-.35);g.enemies()[0].speed=0;g.attack();assert.equal(g.enemies()[0].hp,2);g.pause();const cooldown=g.state().attackCooldown;steps(g,50);assert.equal(g.state().attackCooldown,cooldown);
 g.resume();steps(g,24);assert.equal(g.state().attackCooldown,0);
});

test('vida começa em 100, dano tem proteção de um segundo e pausa congela a proteção',()=>{
 const g=game();assert.equal(g.state().health,100);g.hurt();assert.equal(g.state().health,95);g.hurt();assert.equal(g.state().health,95);
 steps(g,59);g.hurt();assert.equal(g.state().health,95);g.pause();const cooldown=g.state().hurtFrames;steps(g,100);assert.equal(g.state().hurtFrames,cooldown);
 g.resume();g.step();g.hurt();assert.equal(g.state().health,90);
});
test('vida acompanha a próxima fase, volta a 100 em nova tentativa e zero causa derrota',()=>{
 const g=game();g.hurt();g.next();assert.equal(g.state().health,95);g.start();assert.equal(g.state().health,100);
 for(let i=0;i<20;i++){g.hurt();if(i<19)steps(g,60);}
 assert.equal(g.state().health,0);assert.equal(g.state().mode,'gameover');g.start();assert.equal(g.state().health,100);
});

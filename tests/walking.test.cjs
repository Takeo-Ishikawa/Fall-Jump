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
 const expose=`window.motion={start:()=>{startGame();down({clientX:170,pointerId:1})},step:simulateStep,platforms:()=>platforms,rotate:a=>rotation=norm(a),state:()=>({x:ballX,z:ballZ,y:ballY,vy,angle:walkAngle,phase:walkPhase,grounded:grounded?.y,passed:levelPassed,mode}),pause:()=>pauseBtn.onclick(),resume:resumeGame,fever:()=>{for(let i=0;i<5;i++)Fever.onGap(feverState)}};`;
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

'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../www/course.js'),G=require('../www/level-generator.js');
test('fase experimental tem doze áreas válidas com percursos e saídas alcançáveis',()=>{
 const p=C.generate(123);assert.ok(C.validate(p));assert.equal(G.platformCount(1),12);assert.equal(G.platformCount(2),200);
 const types=new Set(p.platforms.map(p=>p.course.title));assert.equal(types.size,12);
 for(const p of C.generate(123).platforms){const a=p.course;assert.ok(C.route(a).ok);assert.ok(a.tiles.some(t=>t.exit));assert.ok(C.tileAt(a,(a.entry.cell+.5)*C.STEP,C.radius(a.entry.lane)));}
});
test('pisos de renderização e colisão compartilham buracos, alturas, pontes e saída',()=>{
 const areas=C.generate(7).platforms.map(p=>p.course);assert.equal(C.tileAt(areas[3],4.5*C.STEP,108),null);assert.equal(C.tileAt(areas[5],6.5*C.STEP,108).height,32);
 const bridge=C.tileAt(areas[4],4.5*C.STEP,108);assert.equal(bridge.fragile,true);bridge.collapsed=true;assert.equal(C.tileAt(areas[4],4.5*C.STEP,108),null);
 assert.equal(C.tileAt(areas[0],7.5*C.STEP,108).exit,true);assert.equal(C.tileAt(areas[0],.5*C.STEP,10),null);
});
test('validação rejeita percurso sem entrada ou saída e patrulhas ficam em piso sólido',()=>{
 const p=C.generate(1);p.platforms[0].course.tiles=[];assert.equal(C.validate(p),false);
 for(const p of C.generate(1).platforms){const a=p.course;if(a.patrol)for(const cell of [a.patrol.from,a.patrol.to])assert.ok(C.tileAt(a,(cell+.5)*C.STEP,C.radius(a.patrol.lane)));}
});

'use strict';
// Author the course once; Godot reads plain data without a JavaScript runtime.
const fs=require('node:fs'),path=require('node:path');
const course=require('../www/course.js');
const output=path.join(__dirname,'../godot/data/course.json');
const plan=course.generate(123);
if(!course.validate(plan))throw new Error('Invalid authored course');
fs.writeFileSync(output,JSON.stringify(plan.platforms.map(p=>p.course),null,2)+'\n');
console.log('Synced 12 authored areas to godot/data/course.json');

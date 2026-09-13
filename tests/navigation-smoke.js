const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const source=fs.readFileSync('lastset-navigation.js','utf8');
const listeners={};
const document={
  documentElement:{dataset:{}},
  addEventListener(type,fn){listeners[type]=fn;},
  querySelector(){return null;}
};

const context={
  console,
  document,
  Element:function Element(){},
  setTimeout:fn=>fn(),
  state:{
    view:'day',
    tab:'today',
    selectedDate:'2026-09-13',
    month:new Date('2026-09-01T12:00:00'),
    resistanceDraft:{sets:[]},
    cardioDraft:{}
  },
  render(){},
  topbar(){return '<header>base</header>';}
};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'lastset-navigation.js'});

const nav=context.LastSetNavigation;
assert(nav,'navigation API should exist');
assert.strictEqual(nav.version,'0.13.1');

// Direct Today is a top level destination and must not show Back.
nav.clearHistory();
context.state.view='day';
context.state.tab='today';
assert.strictEqual(nav.hasBack(),false,'direct Today must not show Back');

// Calendar -> selected day -> Back returns to Calendar.
nav.clearHistory();
context.state.view='calendar';
context.state.tab='calendar';
context.state.selectedDate='2026-09-13';
nav.pushCurrent();
context.state.view='day';
context.state.tab='calendar';
context.state.selectedDate='2026-09-09';
assert.strictEqual(nav.hasBack(),true,'calendar opened day should show Back');
assert.strictEqual(nav.goBack(),true);
assert.strictEqual(context.state.view,'calendar');
assert.strictEqual(context.state.tab,'calendar');
assert.strictEqual(nav.hasBack(),false);

// Today -> exercise list -> exercise log backs out in order.
nav.clearHistory();
context.state.view='day';
context.state.tab='today';
context.state.selectedDate='2026-09-13';
nav.pushCurrent();
context.state.view='exercise-list';
nav.pushCurrent();
context.state.view='exercise-log';
assert.strictEqual(nav.goBack(),true);
assert.strictEqual(context.state.view,'exercise-list');
assert.strictEqual(nav.goBack(),true);
assert.strictEqual(context.state.view,'day');
assert.strictEqual(context.state.tab,'today');
assert.strictEqual(nav.hasBack(),false);

// Returning from a nested flow to a Calendar opened day keeps only Calendar as the parent.
nav.clearHistory();
context.state.view='calendar';
context.state.tab='calendar';
context.state.selectedDate='2026-09-13';
nav.pushCurrent();
context.state.view='day';
context.state.tab='calendar';
context.state.selectedDate='2026-09-09';
nav.pushCurrent();
context.state.view='exercise-list';
nav.pushCurrent();
context.state.view='exercise-log';
context.state.view='day';
context.state.tab='calendar';
context.state.selectedDate='2026-09-09';
nav._test.collapseToCurrent();
assert.strictEqual(nav._test.stack.length,1,'nested completion should keep Calendar as the only parent');
assert.strictEqual(nav._test.stack[0].view,'calendar');
assert.strictEqual(nav.hasBack(),true);
nav.goBack();
assert.strictEqual(context.state.view,'calendar');

console.log('navigation smoke tests passed');

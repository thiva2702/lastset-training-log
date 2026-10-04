const assert=require('assert');

const previous=global.__LASTSET_TEST_ONLY__;
global.__LASTSET_TEST_ONLY__=true;
require('../lastset-memory.js');

const T=global.LastSetMemoryTest;
assert(T,'LastSet memory test API missing');

const catalogue=[
  {id:'bench',name:'Bench Press',equipment:'Barbell',muscles:['Chest'],loadType:'external',aliases:['bench','bench press']},
  {id:'pull',name:'Pull Up',equipment:'Bodyweight',muscles:['Back'],loadType:'bodyweight',aliases:['pull up','pull ups']},
  {id:'assist',name:'Assisted Dip',equipment:'Machine',muscles:['Triceps'],loadType:'assisted',aliases:['assisted dip','assisted dips']},
  {id:'plank',name:'Plank',equipment:'Bodyweight',muscles:['Core'],loadType:'timed',aliases:['plank']}
];

const data={sessions:{
  '2026-09-28':[{type:'resistance',exercises:[
    {exerciseId:'bench',name:'Bench Press',sets:[{weight:80,reps:10},{weight:80,reps:10},{weight:80,reps:8}]},
    {exerciseId:'pull',name:'Pull Up',sets:[{weight:0,reps:8},{weight:0,reps:7}]}
  ]}],
  '2026-09-21':[{type:'resistance',exercises:[
    {exerciseId:'bench',name:'Bench Press',sets:[{weight:77.5,reps:10},{weight:77.5,reps:9},{weight:77.5,reps:8}]}
  ]}]
},memory:{version:1,aliases:{}}};

const record=T.findExerciseRecord(data,'bench','2026-10-05');
assert(record);
assert.equal(record.date,'2026-09-28');

const profile=T.buildMemoryProfile(data,'2026-10-05',catalogue);
assert.equal(profile.find(x=>x.exerciseId==='bench').sessionCount,2);
assert.equal(profile.find(x=>x.exerciseId==='bench').sets[0].weightKg,80);

const explicit=T.parseMemoryReference(
  'bench same as last time',
  data,
  '2026-10-05',
  catalogue
);
assert(explicit);
assert.equal(explicit.items.length,1);
assert.equal(explicit.items[0].exerciseId,'bench');
assert.deepEqual(explicit.items[0].sets.map(s=>[s.weightKg,s.reps]),[[80,10],[80,10],[80,8]]);
assert.equal(explicit.memoryAssumptions[0].sourceDate,'2026-09-28');

const heavier=T.parseMemoryReference(
  'bench same as last time but 82.5 kg today',
  data,
  '2026-10-05',
  catalogue
);
assert.deepEqual(heavier.items[0].sets.map(s=>s.weightKg),[82.5,82.5,82.5]);
assert.deepEqual(heavier.items[0].sets.map(s=>s.reps),[10,10,8]);

const parsed={items:[{kind:'resistance',exerciseId:'bench',name:'Bench Press',loadType:'external',sets:[]}]};
T.attachMemorySuggestions(parsed,data,'2026-10-05',catalogue);
assert(parsed.items[0].memorySuggestion);
assert.equal(parsed.items[0].memorySuggestion.sourceDate,'2026-09-28');

const accepted=T.applyMemorySuggestion(parsed.items[0]);
assert.deepEqual(accepted.sets.map(s=>[s.weightKg,s.reps]),[[80,10],[80,10],[80,8]]);
assert.equal(accepted.memory.kind,'accepted-suggestion');
assert.equal(accepted.memorySuggestion,undefined);

const partial={kind:'resistance',exerciseId:'bench',name:'Bench Press',loadType:'external',sets:[
  {weightKg:82.5,reps:null},{weightKg:82.5,reps:null},{weightKg:82.5,reps:null}
],memorySuggestion:{sourceDate:'2026-09-28',sets:explicit.items[0].sets}};
const filled=T.applyMemorySuggestion(partial);
assert.deepEqual(filled.sets.map(s=>[s.weightKg,s.reps]),[[82.5,10],[82.5,10],[82.5,8]]);

const learn=T.parseLearnAliasCommand('when I say incline DB, I mean Bench Press',catalogue);
assert.deepEqual(learn,{phrase:'incline db',exerciseId:'bench',name:'Bench Press'});
assert.equal(T.rememberAlias(data,learn),true);
const rewritten=T.applyLearnedAliases('incline DB 80 kg 8 reps',data,catalogue);
assert.equal(rewritten.text,'Bench Press 80 kg 8 reps');
assert.equal(rewritten.applied[0].exerciseId,'bench');

assert.equal(T.parseMemoryReference('same as last time',data,'2026-10-05',catalogue),null);
assert.equal(T.parseMemoryReference('bench 80 kg 10 reps',data,'2026-10-05',catalogue),null);

global.__LASTSET_TEST_ONLY__=previous;
console.log('LastSet memory smoke tests passed');
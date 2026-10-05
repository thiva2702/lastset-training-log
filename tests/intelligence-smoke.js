const assert=require('assert');
global.__LASTSET_TEST_ONLY__=true;
require('../lastset-intelligence.js');
const T=global.LastSetIntelligenceTest;
const cat=[
{id:'bench',name:'Bench Press',muscles:['Chest'],filterMuscles:['Chest'],loadType:'external',aliases:['bench']},
{id:'row',name:'Seated Row',muscles:['Back'],filterMuscles:['Back'],loadType:'external',aliases:['row']},
{id:'dip',name:'Assisted Dip',muscles:['Chest','Triceps'],filterMuscles:['Chest'],loadType:'assisted',aliases:['assisted dip']}
];
const db={sessions:{
'2026-09-29':[{type:'resistance',exercises:[{exerciseId:'bench',name:'Bench Press',sets:[{weight:80,reps:10},{weight:80,reps:10},{weight:80,reps:8}]},{exerciseId:'dip',name:'Assisted Dip',loadType:'assisted',sets:[{weight:25,reps:10},{weight:25,reps:9}]}]}],
'2026-09-22':[{type:'resistance',exercises:[{exerciseId:'bench',name:'Bench Press',sets:[{weight:77.5,reps:10},{weight:77.5,reps:9},{weight:77.5,reps:8}]}]}],
'2026-09-20':[{type:'resistance',exercises:[{exerciseId:'row',name:'Seated Row',sets:[{weight:60,reps:12},{weight:60,reps:10}]}]}]
},profile:{progressionPreference:'reps_first'}};
let p=T.parseWorkoutMemory('same chest workout as last week',db,'2026-10-05',cat);
assert(p&&p.items.some(x=>x.exerciseId==='bench'));
p=T.parseWorkoutMemory('same chest workout but skip assisted dip and bench 82.5 kg',db,'2026-10-05',cat);
assert.equal(p.items.length,1);assert.equal(p.items[0].sets[0].weightKg,82.5);
const m=T.progressMetric(db,'bench',cat,'2026-10-05',db.profile);
assert.equal(m.sessions,2);assert.equal(m.best.weight,80);assert.equal(m.target.sets[2].reps,9);
assert.equal(T.isPR(db,'2026-10-05',{exerciseId:'bench',name:'Bench Press',sets:[{weight:82.5,reps:8}]},cat),true);
const sumdb=clone=>clone;
const future=JSON.parse(JSON.stringify(db));future.sessions['2026-10-05']=[{type:'resistance',exercises:[{exerciseId:'bench',name:'Bench Press',sets:[{weight:82.5,reps:8}]}]}];
const sum=T.workoutSummary(future,'2026-10-05',cat);assert(sum.prs.includes('Bench Press'));
let s=T.observeCorrection(db,'incline press','bench','Bench Press');assert.equal(s,null);s=T.observeCorrection(db,'incline press','bench','Bench Press');assert(s&&s.count===2);assert(T.acceptCorrectionLearning(db,s));assert.equal(db.memory.aliases['incline press'].exerciseId,'bench');
assert(T.recordZeroSearch(db,'iso low row'));assert(T.recordZeroSearch(db,'iso low row'));assert.equal(db.telemetry.zeroResultSearches[0].count,2);
assert(T.fuzzyTokens('lat puldown','lat pulldown machine back'));
console.log('LastSet intelligence smoke tests passed');
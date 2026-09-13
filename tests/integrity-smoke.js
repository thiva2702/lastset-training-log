const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

global.__LASTSET_TEST_ONLY__=true;
vm.runInThisContext(fs.readFileSync('lastset-integrity.js','utf8'),{filename:'lastset-integrity.js'});
const T=global.LastSetIntegrityTest;
assert(T,'test API missing');

const created=new Date('2026-09-13T10:00:00+08:00').getTime();
const demo={sessions:{'2026-09-09':[{id:'x',type:'resistance',createdAt:created,exercises:[{exerciseId:'chest-press',name:'Chest Press',sets:[{weight:50,reps:12},{weight:55,reps:10},{weight:55,reps:8}]}]}]},profile:{}};
assert.equal(T.stripLegacyDemoSession(demo),true);
assert.deepEqual(demo.sessions,{});

const legit={sessions:{'2026-09-08':[{id:'x',type:'resistance',createdAt:created,exercises:[{exerciseId:'chest-press',name:'Chest Press',sets:[{weight:50,reps:12},{weight:55,reps:10},{weight:55,reps:8}]}]}]},profile:{}};
assert.equal(T.stripLegacyDemoSession(legit),false);
assert.equal(legit.sessions['2026-09-08'].length,1);

const fresh=T.emptyUserData('Alice',{weightUnit:'lb',heightCm:170,bodyWeightKg:70});
assert.equal(fresh.profile.name,'Alice');
assert.equal(fresh.profile.weightUnit,'kg');
assert.equal(fresh.profile.heightCm,0);
assert.equal(fresh.profile.bodyWeightKg,0);
const reset=T.emptyUserData('Alice',{weightUnit:'lb',heightCm:170,bodyWeightKg:70},true);
assert.equal(reset.profile.weightUnit,'lb');
assert.equal(reset.profile.heightCm,170);
assert.equal(reset.profile.bodyWeightKg,70);
assert.deepEqual(fresh.sessions,{});
assert.deepEqual(fresh.templates,[]);

assert.equal(T.targetDateForTemplate('profile','2026-09-09','2026-09-13'),'2026-09-13');
assert.equal(T.targetDateForTemplate('day','2026-09-09','2026-09-13'),'2026-09-09');

const catalogue=[
 {id:'press',loadType:'external'},
 {id:'pull',loadType:'bodyweight'},
 {id:'assist',loadType:'assisted'},
 {id:'plank',loadType:'timed'}
];
const data={sessions:{
 '2026-09-01':[{type:'resistance',exercises:[
  {exerciseId:'press',name:'Press',sets:[{weight:50,reps:10},{weight:55,reps:6}]},
  {exerciseId:'pull',name:'Pull Up',sets:[{weight:0,reps:8},{weight:0,reps:10}]},
  {exerciseId:'assist',name:'Assisted Pull Up',sets:[{weight:50,reps:10},{weight:30,reps:6}]},
  {exerciseId:'plank',name:'Plank',sets:[{durationSeconds:45},{durationSeconds:60}]}
 ]}],
 '2026-09-05':[{type:'resistance',exercises:[
  {exerciseId:'press',name:'Press',sets:[{weight:55,reps:8}]},
  {exerciseId:'pull',name:'Pull Up',sets:[{weight:5,reps:6}]}
 ]}]
}};
const rows=T.buildProgressRows(data,catalogue);
const by=id=>rows.find(r=>r.id===id);
assert.equal(by('press').bestLabel,'Best 55 kg × 8');
assert.equal(by('press').sessions,2);
assert.equal(by('assist').bestLabel,'Best 30 kg assistance × 6');
assert.equal(by('plank').bestLabel,'Best 60 sec');
assert.equal(by('pull').bestLabel,'Best BW + 5 kg × 6');

assert.equal(T.validateBackup({sessions:{},profile:{}}),true);
assert.equal(T.validateBackup({sessions:[]}),false);
assert.equal(T.validateCardioNumbers({duration:30,heartRate:150}),'');
assert.equal(T.validateCardioNumbers({duration:30,heartRate:999}),'Heart rate looks invalid');

console.log('LastSet integrity smoke tests passed');

// Phase 0 Data Trust: strict backup structure and workout round-trip.
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
global.__LASTSET_TEST_ONLY__=true;
vm.runInThisContext(fs.readFileSync('lastset-integrity.js','utf8'),{filename:'lastset-integrity.js'});
const {validateBackup}=global.LastSetIntegrityTest;
assert.equal(typeof validateBackup,'function');

const original={
  sessions:{
    '2026-10-10':[
      {id:'res-1',type:'resistance',exercises:[
        {exerciseId:'bench-press',name:'Barbell Bench Press',sets:[
          {weight:80,reps:8,setType:'working'},
          {weight:85,reps:6,setType:'working'},
          {weight:85,reps:5,setType:'working'}
        ],note:'Keep shoulder blades tight'},
        {exerciseId:'incline-db',sets:[{weight:30,reps:10,setType:'warmup'},{weight:30,reps:10,setType:'working'}]}
      ]},
      {id:'cardio-1',type:'cardio',activity:'Treadmill',duration:15},
      {id:'mobility-1',type:'mobility',activity:'Yoga',duration:20}
    ]
  },
  profile:{name:'Data Trust Test',weightUnit:'kg'},
  templates:[{id:'push',name:'Push Day',exerciseIds:['bench-press']}],
  favorites:['bench-press'],
  plans:{},schemaVersion:11
};

assert.equal(validateBackup(original),true,'complete valid backup should pass');
const restored=JSON.parse(JSON.stringify(original));
assert.deepStrictEqual(restored,original,'full workout backup round-trips precisely');
const sets=restored.sessions['2026-10-10'][0].exercises[0].sets;
assert.deepStrictEqual(sets.map(s=>[s.weight,s.reps]),[[80,8],[85,6],[85,5]]);

function invalid(mutator,label){
  const c=JSON.parse(JSON.stringify(original));mutator(c);
  assert.equal(validateBackup(c),false,label);
}
invalid(v=>{v.sessions['2026-10-10']={not:'an array'};},'reject wrong session collection');
invalid(v=>{v.sessions['2026-10-10'][0].exercises={not:'an array'};},'reject corrupt exercise collection');
invalid(v=>{v.sessions['2026-10-10'][0].exercises[0].sets=[null];},'reject corrupt set record');
invalid(v=>{v.sessions['2026-10-10'][0].exercises[0].sets[0].weight='not a weight';},'reject corrupt weight');
invalid(v=>{v.sessions['2026-10-10'][0].exercises[0].sets[0].reps='six';},'reject corrupt reps');
invalid(v=>{v.templates={broken:true};},'reject corrupt templates');
invalid(v=>{v.sessions['unparseable-date']=[];},'reject malformed workout date');

console.log('LastSet P0 backup structure and data trust tests passed');

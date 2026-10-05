const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const source=fs.readFileSync('lastset-profile-equipment.js','utf8');

const store=new Map();
const localStorage={
  getItem:key=>store.has(key)?store.get(key):null,
  setItem:(key,value)=>store.set(key,String(value)),
  removeItem:key=>store.delete(key)
};

const initialData={
  sessions:{},templates:[],favorites:[],exerciseSettings:{},plans:{},dayMeta:{},
  profile:{name:'Display A',userLabel:'Account A',weightUnit:'kg',heightCm:175,bodyWeightKg:80,progressionPreference:'reps_first'}
};
localStorage.setItem('lastset-user-spaces-v1',JSON.stringify({version:1,activeId:'u1',users:[{id:'u1',name:'Account A',data:JSON.parse(JSON.stringify(initialData))}]}));

const document={
  head:{appendChild(){}},
  documentElement:{dataset:{}},
  createElement(){return {id:'',textContent:'',appendChild(){},setAttribute(){}};},
  addEventListener(){},
  querySelector(){return null;},
  querySelectorAll(){return [];},
  getElementById(){return null;}
};

const sandbox={
  console,
  localStorage,
  document,
  data:JSON.parse(JSON.stringify(initialData)),
  EXERCISES:[],
  state:{view:'profile',tab:'profile',exerciseEquipmentFilter:'',selectedExercise:null},
  saveData(value){ localStorage.setItem('lastset-data-v1',JSON.stringify(value)); },
  safeStorageSet(value){ localStorage.setItem('lastset-data-v1',JSON.stringify(value)); },
  profileScreen(){return '';},
  saveProfile(){},
  progressScreen(){return '';},
  loadTypeLabelV11(){return 'External weight';},
  formatSetV11(){return '';},
  formatNumber:n=>String(n),
  escapeHtml:s=>String(s),
  dateLabel:s=>String(s),
  showToast(){},
  setTimeout,
  clearTimeout
};

vm.runInNewContext(source,sandbox,{filename:'lastset-profile-equipment.js'});

assert.ok(sandbox.EXERCISES.filter(e=>e.equipment==='EZ Bar').length>=4,'EZ Bar library missing');
assert.ok(sandbox.EXERCISES.filter(e=>e.equipment==='Kettlebell').length>=10,'Kettlebell library missing');
assert.ok(sandbox.EXERCISES.filter(e=>e.equipment==='Resistance Band').length>=10,'Resistance Band library missing');
assert.ok(sandbox.EXERCISES.filter(e=>e.equipment==='Smith Machine').length>=7,'Smith Machine library missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='band-assisted-pull-up'),'Band Assisted Pull Up missing');
assert.equal(sandbox.EXERCISES.find(e=>e.id==='band-assisted-pull-up').loadType,'assisted','Band assisted pull up must progress by reducing assistance');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='band-push-up'),'Resistance Band Push Up missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='converging-chest-press-machine'),'Converging Chest Press missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='diverging-lat-pulldown-machine'),'Diverging Lat Pulldown missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='diverging-low-row-machine'),'Diverging Low Row missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='rear-delt-pec-fly-rear-delt'),'Rear Delt mode missing for dual machine');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='rear-delt-pec-fly-pec-fly'),'Pec Fly mode missing for dual machine');
assert.equal(sandbox.EXERCISES.filter(e=>e.machineFamily==='Multi-Press').length,3,'Multi-Press must expose flat, incline and shoulder modes separately');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='diverging-seated-row-machine'),'Diverging Seated Row missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='converging-shoulder-press-machine'),'Converging Shoulder Press missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='machine-biceps-curl'),'Machine Biceps Curl missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='seated-dip-triceps-press'),'Seated Dip / Triceps Press missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='assisted-dip'),'Assisted Dip missing');
assert.equal(sandbox.EXERCISES.find(e=>e.id==='assisted-dip').loadType,'assisted','Assisted Dip must progress by reducing assistance');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='machine-lateral-raise'),'Machine Lateral Raise missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='standing-lateral-raise-machine'),'Standing Lateral Raise missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='converging-shoulder-press-machine'),'Converging Shoulder Press missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='dual-axis-chest-press'),'Dual Axis Chest Press missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='dual-axis-pulldown'),'Dual Axis Pulldown missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='calf-extension-machine'),'Calf Extension missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='prone-leg-curl'),'Prone Leg Curl missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='seated-leg-curl'),'Seated Leg Curl missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='arc-leg-press'),'Arc Leg Press missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='glute-extension-machine'),'Glute Extension missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='glute-bridge-machine'),'Glute Bridge Machine missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='sit-stand-hip-abduction'),'Sit / Stand Hip Abduction missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='rotary-torso-machine'),'Rotary Torso missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='back-extension-machine'),'Back Extension Machine missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='abdominal-crunch-machine'),'Abdominal Crunch Machine missing');
assert.ok(sandbox.EXERCISES.some(e=>e.id==='advanced-abdominal-crunch'),'Advanced Abdominal Crunch missing');

const allAliases=sandbox.EXERCISES.flatMap(e=>e.aliases||[]).map(x=>String(x).toLowerCase());
assert.ok(!allAliases.some(a=>a.includes('precor')),'Canonical machine library must not require brand names');
assert.ok(!allAliases.some(a=>/\b(?:rsl|vsl|dsl)\d+/.test(a)),'Canonical machine library must not require manufacturer model codes');

assert.ok(sandbox.EXERCISES.find(e=>e.id==='lat-pulldown').aliases.includes('pulldown seated row'),'Pulldown / Seated Row machine name should resolve to Pulldown');
assert.ok(sandbox.EXERCISES.find(e=>e.id==='seated-row').aliases.includes('pulldown seated row'),'Pulldown / Seated Row machine name should resolve to Seated Row');
assert.ok(sandbox.EXERCISES.find(e=>e.id==='hip-abduction').aliases.includes('inner outer thigh'),'Inner / Outer Thigh should resolve to Hip Abduction');
assert.ok(sandbox.EXERCISES.find(e=>e.id==='hip-adduction').aliases.includes('inner outer thigh'),'Inner / Outer Thigh should resolve to Hip Adduction');

const genericLegCurl=sandbox.EXERCISES.find(e=>e.id==='leg-curl');
if(genericLegCurl){
  assert.ok(!genericLegCurl.aliases.includes('seated leg curl'),'Generic Leg Curl must not steal exact Seated Leg Curl searches');
  assert.ok(!genericLegCurl.aliases.includes('lying leg curl'),'Generic Leg Curl must not steal exact Prone Leg Curl searches');
}


sandbox.data.profile.name='Display B';
sandbox.saveData(sandbox.data);
const registry=JSON.parse(localStorage.getItem('lastset-user-spaces-v1'));
assert.equal(registry.users[0].name,'Account A','Display name must not rename user identity');
assert.equal(registry.users[0].data.profile.userLabel,'Account A','Stable user label missing');

const profileHtml=sandbox.profileScreen();
assert.ok(profileHtml.includes('Current user'),'Profile must show current user');
assert.ok(profileHtml.includes('does not switch users'),'Display name explanation missing');
assert.ok(profileHtml.includes('Gender, optional'),'Gender field missing');
assert.ok(profileHtml.includes('Prefer not to say'),'Gender privacy option missing');

assert.ok(source.includes("btn.dataset.action='profile-top'"),'Top profile icon navigation missing');
assert.ok(source.includes("'EZ Bar','Dumbbell','Kettlebell'"),'Expanded equipment chips missing');

console.log('PASS v0.13.6 canonical machine library smoke tests');

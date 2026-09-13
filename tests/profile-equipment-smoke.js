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

console.log('PASS v0.13.0 profile and equipment smoke tests');

(() => {
'use strict';

const VERSION='0.14.0';
const REGISTRY_KEY='lastset-user-spaces-v1';
const STORAGE_KEY='lastset-data-v1';
const MIGRATION_KEY='lastset-v0140-onboarding-migration-v1';
const clone=v=>JSON.parse(JSON.stringify(v));

function cleanName(value){
  return String(value||'').trim().replace(/\s+/g,' ');
}
function meaningfulName(value){
  const name=cleanName(value).toLowerCase();
  return !!name && !['current user','new user','unnamed user','you','user'].includes(name);
}
function profileComplete(profile){
  return !!profile && profile.onboardingComplete===true && meaningfulName(profile.name||profile.userLabel) && ['kg','lb'].includes(profile.weightUnit||'kg');
}
function readRegistry(storage){
  try{
    const raw=(storage||localStorage).getItem(REGISTRY_KEY);
    const parsed=raw?JSON.parse(raw):null;
    return parsed&&Array.isArray(parsed.users)?parsed:{version:1,activeId:null,users:[]};
  }catch(_){return {version:1,activeId:null,users:[]};}
}
function writeRegistry(reg,storage){
  try{(storage||localStorage).setItem(REGISTRY_KEY,JSON.stringify(reg));return true;}catch(_){return false;}
}
function migrateExisting(target,storage){
  const store=storage||localStorage;
  try{if(store.getItem(MIGRATION_KEY)==='1') return false;}catch(_){}
  const reg=readRegistry(store);
  let changed=false;
  reg.users.forEach(user=>{
    user.data=user.data||{sessions:{},profile:{}};
    user.data.profile=user.data.profile||{};
    const name=user.data.profile.name||user.data.profile.userLabel||user.name||'';
    if(meaningfulName(name) && user.data.profile.onboardingComplete!==true){
      user.data.profile.onboardingComplete=true;
      if(!user.data.profile.weightUnit) user.data.profile.weightUnit='kg';
      changed=true;
    }
  });
  if(target){
    target.profile=target.profile||{};
    const name=target.profile.name||target.profile.userLabel||'';
    if(meaningfulName(name) && target.profile.onboardingComplete!==true){
      target.profile.onboardingComplete=true;
      if(!target.profile.weightUnit) target.profile.weightUnit='kg';
      changed=true;
    }
    const active=reg.users.find(u=>u.id===reg.activeId);
    if(active && target.profile.onboardingComplete===true){
      active.data=clone(target);
      active.name=cleanName(target.profile.userLabel||target.profile.name||active.name);
      changed=true;
    }
  }
  if(changed) writeRegistry(reg,store);
  try{store.setItem(MIGRATION_KEY,'1');}catch(_){}
  return changed;
}
function freshUserData(profile){
  return {
    sessions:{},aliases:{},machines:{},
    profile:Object.assign({
      name:'',userLabel:'',weightUnit:'kg',gender:'prefer_not_to_say',
      heightCm:0,bodyWeightKg:0,progressionPreference:'reps_first',
      onboardingComplete:true
    },profile||{}),
    templates:[],favorites:[],exerciseSettings:{},plans:{},dayMeta:{},
    telemetry:{zeroResultSearches:[]},imports:[],schemaVersion:11
  };
}
function bodyWeightKg(shown,unit){
  const n=Number(shown)||0;
  if(!n) return 0;
  return Math.round((unit==='lb'?n*0.453592:n)*10)/10;
}
function newUserRecord(profile,id,now){
  const clean=Object.assign({},profile||{});
  clean.name=cleanName(clean.name);
  clean.userLabel=clean.name;
  clean.weightUnit=clean.weightUnit==='lb'?'lb':'kg';
  clean.onboardingComplete=true;
  clean.userId=id;
  const data=freshUserData(clean);
  return {id,name:clean.name,data,updatedAt:now||Date.now()};
}

if(typeof globalThis!=='undefined'&&globalThis.__LASTSET_TEST_ONLY__){
  globalThis.LastSetOnboardingTest={cleanName,meaningfulName,profileComplete,readRegistry,writeRegistry,migrateExisting,freshUserData,bodyWeightKg,newUserRecord};
  return;
}
if(typeof window==='undefined'||typeof document==='undefined') return;

function esc(v){return typeof escapeHtml==='function'?escapeHtml(v):String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function db(){return typeof data!=='undefined'?data:null;}
function profile(){const d=db();if(!d)return {};d.profile=d.profile||{};return d.profile;}
function currentReg(){return readRegistry(localStorage);}
function makeId(){return 'user_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);}

try{
  if(migrateExisting(db(),localStorage) && typeof safeStorageSet==='function') safeStorageSet(data);
}catch(_){}

let draftAvatar='';
let newUserDraftOpen=false;

function avatarPreview(name,avatar){
  if(avatar){
    return '<span class="ls-onboard-avatar has-photo"><img src="'+avatar+'" alt=""></span>';
  }
  const initial=(cleanName(name)||'Y').slice(0,1).toUpperCase();
  return '<span class="ls-onboard-avatar">'+esc(initial)+'</span>';
}

function setupFields(values,prefix){
  const p=values||{};
  const unit=p.weightUnit==='lb'?'lb':'kg';
  const kg=Number(p.bodyWeightKg)||0;
  const shown=kg?(unit==='lb'?Math.round((kg/0.453592)*10)/10:kg):'';
  return '<div class="ls-onboard-fields">'+
    '<div class="field"><label>Display name <b>*</b></label><input id="'+prefix+'-name" maxlength="40" autocomplete="name" value="'+esc(p.name||'')+'" placeholder="Your name"></div>'+
    '<div class="field"><label>Weight unit <b>*</b></label><select id="'+prefix+'-unit"><option value="kg"'+(unit==='kg'?' selected':'')+'>kg</option><option value="lb"'+(unit==='lb'?' selected':'')+'>lb</option></select></div>'+
    '<div class="grid-2"><div class="field"><label>Height, cm <span>optional</span></label><input id="'+prefix+'-height" inputmode="decimal" type="number" min="80" max="250" step="0.1" value="'+(Number(p.heightCm)||'')+'" placeholder="175"></div>'+
    '<div class="field"><label>Body weight <span>optional</span></label><input id="'+prefix+'-weight" inputmode="decimal" type="number" min="20" max="1000" step="0.1" value="'+shown+'" placeholder="'+(unit==='lb'?'165':'75')+'"></div></div>'+
    '<div class="field"><label>Gender <span>optional</span></label><select id="'+prefix+'-gender"><option value="prefer_not_to_say"'+((p.gender||'prefer_not_to_say')==='prefer_not_to_say'?' selected':'')+'>Prefer not to say</option><option value="male"'+(p.gender==='male'?' selected':'')+'>Male</option><option value="female"'+(p.gender==='female'?' selected':'')+'>Female</option></select></div>'+
  '</div>';
}
function valuesFrom(prefix){
  const name=cleanName(document.getElementById(prefix+'-name')?.value||'');
  const unit=document.getElementById(prefix+'-unit')?.value==='lb'?'lb':'kg';
  return {
    name,userLabel:name,weightUnit:unit,
    heightCm:Number(document.getElementById(prefix+'-height')?.value)||0,
    bodyWeightKg:bodyWeightKg(document.getElementById(prefix+'-weight')?.value,unit),
    gender:document.getElementById(prefix+'-gender')?.value||'prefer_not_to_say',
    progressionPreference:'reps_first',
    onboardingComplete:true
  };
}
async function processAvatar(file){
  if(!file) return '';
  if(globalThis.LastSetIdentity&&typeof globalThis.LastSetIdentity.resizeAvatar==='function'){
    return globalThis.LastSetIdentity.resizeAvatar(file);
  }
  return '';
}
function wireAvatar(root,prefix,nameProvider){
  const input=root.querySelector('[data-onboard-photo]');
  const btn=root.querySelector('[data-onboard-photo-button]');
  const preview=root.querySelector('[data-onboard-avatar-preview]');
  if(btn&&input) btn.onclick=()=>input.click();
  if(input) input.onchange=async()=>{
    const file=input.files?.[0];if(!file)return;
    try{
      draftAvatar=await processAvatar(file);
      if(preview) preview.innerHTML=avatarPreview(nameProvider(),draftAvatar);
      if(btn) btn.textContent=draftAvatar?'Change photo':'Upload photo';
    }catch(err){if(typeof showToast==='function')showToast(err?.message||'Could not use that photo');}
  };
}
function completionOverlay(name){
  document.querySelector('.ls-onboard-finish')?.remove();
  const overlay=document.createElement('div');
  overlay.className='ls-onboard-finish';
  overlay.innerHTML='<div class="ls-onboard-finish-card"><img src="./assets/lastset-mark.svg?v=0139" alt=""><div class="ls-onboard-kicker">Profile saved</div><h2>You\'re ready, '+esc(name)+'.</h2><p>How do you want to start?</p><button class="primary" data-start="describe">Smart Log a workout</button><button class="secondary" data-start="exercise-list">Browse exercises</button><button class="secondary" data-start="day">Go to Today</button></div>';
  document.body.appendChild(overlay);
  overlay.querySelectorAll('[data-start]').forEach(btn=>btn.onclick=()=>{
    const view=btn.dataset.start;
    state.selectedDate=isoDate(new Date());
    state.tab='today';
    state.view=view;
    if(view==='describe'){state.aiDraft='';state.aiParsed=null;state.aiError='';state.aiSource='';state.aiCorrection='';state.smartConversation=[];}
    overlay.remove();render();
  });
}
function saveInitialProfile(){
  const v=valuesFrom('ls-onboard');
  if(!meaningfulName(v.name)){showToast('Enter your display name');return;}
  const d=db();if(!d)return;
  d.profile=Object.assign({},d.profile||{},v);
  if(draftAvatar)d.profile.avatarDataUrl=draftAvatar;
  saveData(d);
  draftAvatar='';
  render();
  completionOverlay(v.name);
}
function chooseExistingUser(){
  const reg=currentReg();
  const users=reg.users.filter(u=>u.id!==reg.activeId&&profileComplete(u.data?.profile));
  if(!users.length)return;
  const overlay=document.createElement('div');
  overlay.className='ls-users-modal ls-onboard-existing';
  overlay.innerHTML='<div class="ls-users-panel"><div class="ls-users-head"><div><div class="ls-onboard-kicker">Existing profiles</div><h3>Choose a user</h3></div><button data-existing-close>×</button></div><div class="ls-users-list">'+users.map(u=>'<button class="ls-onboard-user-row" data-existing-user="'+esc(u.id)+'"><strong>'+esc(u.name||u.data?.profile?.name||'User')+'</strong><span>Open this profile</span></button>').join('')+'</div></div>';
  document.body.appendChild(overlay);
  overlay.querySelector('[data-existing-close]').onclick=()=>overlay.remove();
  overlay.querySelectorAll('[data-existing-user]').forEach(btn=>btn.onclick=()=>{
    const target=reg.users.find(u=>u.id===btn.dataset.existingUser);if(!target)return;
    reg.activeId=target.id;writeRegistry(reg);
    data=clone(target.data);data.profile=data.profile||{};data.profile.userId=target.id;
    if(typeof safeStorageSet==='function')safeStorageSet(data);else localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
    overlay.remove();
    state.selectedDate=isoDate(new Date());state.month=new Date();state.month=new Date(state.month.getFullYear(),state.month.getMonth(),1);state.tab='today';state.view='day';
    render();
  });
}
function onboardingHtml(){
  const p=profile();
  const other=currentReg().users.filter(u=>u.id!==currentReg().activeId&&profileComplete(u.data?.profile)).length;
  return '<main class="ls-onboard-screen"><section class="ls-onboard-card"><div class="ls-onboard-brand"><img src="./assets/lastset-mark.svg?v=0139" alt=""><div><strong>Last<span>Set</span></strong><small>BETA</small></div></div>'+
    '<div class="ls-onboard-kicker">Welcome to LastSet</div><h1>Your training starts with you.</h1><p>Create your profile before logging your first workout. Only your name and preferred weight unit are required.</p>'+
    '<div class="ls-onboard-photo-row"><div data-onboard-avatar-preview>'+avatarPreview(p.name||p.userLabel,p.avatarDataUrl||draftAvatar)+'</div><div><strong>Profile photo</strong><small>Optional · stored on this device</small><button class="secondary" type="button" data-onboard-photo-button>'+(p.avatarDataUrl||draftAvatar?'Change photo':'Upload photo')+'</button><input hidden data-onboard-photo type="file" accept="image/*"></div></div>'+
    setupFields(p,'ls-onboard')+
    '<button class="primary ls-onboard-save" data-onboard-save>SAVE PROFILE & START TRAINING</button>'+
    (other?'<button class="ls-onboard-existing-link" data-onboard-existing>Choose an existing user instead</button>':'')+
    '<div class="ls-onboard-privacy">Profile and training data stay in LastSet storage on this device.</div>'+
  '</section></main>';
}
function renderOnboarding(){
  const app=document.getElementById('app');if(!app)return;
  app.innerHTML=onboardingHtml();
  const root=app.querySelector('.ls-onboard-screen');
  wireAvatar(root,'ls-onboard',()=>document.getElementById('ls-onboard-name')?.value||'');
  root.querySelector('[data-onboard-save]').onclick=saveInitialProfile;
  root.querySelector('[data-onboard-existing]')?.addEventListener('click',chooseExistingUser);
}

function newUserModal(){
  if(newUserDraftOpen)return;
  newUserDraftOpen=true;draftAvatar='';
  document.querySelector('.ls-users-modal')?.remove();
  const overlay=document.createElement('div');
  overlay.className='ls-users-modal ls-v014-new-user';
  overlay.innerHTML='<div class="ls-users-panel ls-new-profile-panel"><div class="ls-users-head"><div><div class="ls-onboard-kicker">New LastSet user</div><h3>Create profile</h3></div><button data-v14-new-close>×</button></div>'+
    '<p class="muted">Nothing is created until you save this profile.</p>'+
    '<div class="ls-new-profile-photo"><div data-onboard-avatar-preview>'+avatarPreview('', '')+'</div><div><strong>Profile photo</strong><small>Optional</small><button class="secondary" type="button" data-onboard-photo-button>Upload photo</button><input hidden data-onboard-photo type="file" accept="image/*"></div></div>'+
    setupFields({},'ls-new-profile')+
    '<button class="primary" data-v14-create-user>Save profile & create user</button><button class="secondary" data-v14-new-cancel>Cancel</button></div>';
  document.body.appendChild(overlay);
  const close=()=>{newUserDraftOpen=false;draftAvatar='';overlay.remove();};
  overlay.querySelector('[data-v14-new-close]').onclick=close;
  overlay.querySelector('[data-v14-new-cancel]').onclick=close;
  wireAvatar(overlay,'ls-new-profile',()=>document.getElementById('ls-new-profile-name')?.value||'');
  overlay.querySelector('[data-v14-create-user]').onclick=()=>{
    const v=valuesFrom('ls-new-profile');
    if(!meaningfulName(v.name)){showToast('Enter the new user name');return;}
    if(typeof saveData==='function')saveData(data);
    const reg=currentReg(),id=makeId(),record=newUserRecord(Object.assign({},v,draftAvatar?{avatarDataUrl:draftAvatar}:{}),id);
    reg.activeId=id;reg.users.push(record);writeRegistry(reg);
    data=clone(record.data);
    if(typeof safeStorageSet==='function')safeStorageSet(data);else localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
    close();
    state.selectedDate=isoDate(new Date());state.month=new Date();state.month=new Date(state.month.getFullYear(),state.month.getMonth(),1);state.tab='today';state.view='day';
    render();completionOverlay(v.name);
  };
}

const baseRender=typeof render==='function'?render:null;
if(baseRender){
  render=function(){
    if(!profileComplete(profile())){renderOnboarding();document.documentElement.dataset.lastsetOnboarding=VERSION;return;}
    baseRender();
    document.documentElement.dataset.lastsetOnboarding=VERSION;
  };
}

document.addEventListener('click',event=>{
  const start=event.target.closest?.('[data-user-new]');
  if(start){
    event.preventDefault();event.stopImmediatePropagation();newUserModal();return;
  }
},true);

if(typeof render==='function')render();

globalThis.LastSetOnboarding={version:VERSION,profileComplete,newUserModal};
})();
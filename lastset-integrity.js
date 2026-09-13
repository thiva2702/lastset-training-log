(() => {
  'use strict';

  const VERSION = '0.12.9';
  const USER_SPACES_KEY = 'lastset-user-spaces-v1';

  const clone = value => JSON.parse(JSON.stringify(value));
  const dateOnlyFromTimestamp = ts => {
    const d = new Date(Number(ts));
    if (!Number.isFinite(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const dayDiff = (laterIso, earlierIso) => {
    const a = Date.parse(`${laterIso}T12:00:00`);
    const b = Date.parse(`${earlierIso}T12:00:00`);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return Math.round((a-b)/86400000);
  };

  function isLegacyDemoSession(date, session){
    if (!session || session.type !== 'resistance' || !Array.isArray(session.exercises) || session.exercises.length !== 1) return false;
    const ex = session.exercises[0];
    if (!ex || !['chest-press','Chest Press','Chest Press Machine'].includes(ex.exerciseId || ex.name)) return false;
    const sets = ex.sets || [];
    const sig = [[50,12],[55,10],[55,8]];
    if (sets.length !== sig.length) return false;
    const exact = sets.every((s,i)=>Number(s.weight)===sig[i][0] && Number(s.reps)===sig[i][1]);
    if (!exact || ex.note || session.label) return false;
    const createdDate = dateOnlyFromTimestamp(session.createdAt);
    return createdDate ? dayDiff(createdDate,date) === 4 : false;
  }

  function stripLegacyDemoSession(value){
    let changed = false;
    if (!value || !value.sessions || typeof value.sessions !== 'object') return changed;
    Object.keys(value.sessions).forEach(date=>{
      const before = Array.isArray(value.sessions[date]) ? value.sessions[date] : [];
      const after = before.filter(session=>!isLegacyDemoSession(date,session));
      if (after.length !== before.length) changed = true;
      if (after.length) value.sessions[date] = after;
      else delete value.sessions[date];
    });
    return changed;
  }

  function emptyUserData(name='', previousProfile={}){
    return {
      sessions:{}, aliases:{}, machines:{},
      profile:{
        name:String(name||'').trim(),
        weightUnit:previousProfile.weightUnit||'kg',
        heightCm:Number(previousProfile.heightCm)||0,
        bodyWeightKg:Number(previousProfile.bodyWeightKg)||0,
        progressionPreference:previousProfile.progressionPreference||'reps_first'
      },
      templates:[], favorites:[], exerciseSettings:{}, plans:{}, dayMeta:{}, schemaVersion:11
    };
  }

  function targetDateForTemplate(originView, selectedDate, todayIso){
    return originView === 'profile' ? todayIso : selectedDate;
  }

  function loadTypeForItem(item, catalogue){
    const ex = (catalogue||[]).find(x=>x.id===item.exerciseId);
    return ex?.loadType || item.loadType || 'external';
  }

  function buildProgressRows(value, catalogue){
    const history = {};
    Object.entries(value?.sessions||{}).forEach(([date,sessions])=>{
      (sessions||[]).filter(s=>s.type==='resistance').forEach(session=>{
        (session.exercises||[]).forEach(item=>{
          const id=item.exerciseId||item.name;
          if(!id) return;
          const type=loadTypeForItem(item,catalogue);
          if(!history[id]) history[id]={id,name:item.name||id,type,dates:new Set(),lastDate:date,best:null};
          const h=history[id];
          h.type=type; h.dates.add(date); if(date>h.lastDate)h.lastDate=date;
          (item.sets||[]).filter(s=>s.setType!=='warmup').forEach(set=>{
            if(type==='timed'){
              const sec=Number(set.durationSeconds)||0;
              if(sec>0 && (!h.best || sec>h.best.sec)) h.best={sec};
              return;
            }
            const reps=Number(set.reps)||0;
            if(reps<=0) return;
            const weight=set.weight==null?null:Number(set.weight);
            if(type==='assisted'){
              if(weight==null || !Number.isFinite(weight)) return;
              if(!h.best || weight<h.best.weight || (weight===h.best.weight && reps>h.best.reps)) h.best={weight,reps};
            }else if(type==='bodyweight'){
              const added=Number.isFinite(weight)&&weight>0?weight:0;
              if(!h.best || added>h.best.added || (added===h.best.added && reps>h.best.reps)) h.best={added,reps};
            }else{
              const w=Number.isFinite(weight)?weight:0;
              if(!h.best || w>h.best.weight || (w===h.best.weight && reps>h.best.reps)) h.best={weight:w,reps};
            }
          });
        });
      });
    });
    return Object.values(history).map(h=>{
      let bestLabel='No completed working sets';
      if(h.best){
        if(h.type==='timed') bestLabel=`Best ${h.best.sec} sec`;
        else if(h.type==='assisted') bestLabel=`Best ${h.best.weight} kg assistance × ${h.best.reps}`;
        else if(h.type==='bodyweight') bestLabel=h.best.added>0?`Best BW + ${h.best.added} kg × ${h.best.reps}`:`Best ${h.best.reps} reps`;
        else bestLabel=`Best ${h.best.weight} kg × ${h.best.reps}`;
      }
      return {id:h.id,name:h.name,type:h.type,sessions:h.dates.size,lastDate:h.lastDate,bestLabel};
    }).sort((a,b)=>b.lastDate.localeCompare(a.lastDate));
  }

  function validateBackup(value){
    if(!value || typeof value!=='object' || Array.isArray(value)) return false;
    if(!value.sessions || typeof value.sessions!=='object' || Array.isArray(value.sessions)) return false;
    if(value.profile!=null && (typeof value.profile!=='object' || Array.isArray(value.profile))) return false;
    return true;
  }

  function validateCardioNumbers(values){
    const checks=[
      ['Duration',values.duration,0,1440],['Distance',values.distance,0,1000],['Average speed',values.avgSpeed,0,120],
      ['Incline',values.incline,0,50],['Heart rate',values.heartRate,0,260],['Calories',values.calories,0,20000],
      ['Resistance level',values.resistanceLevel,0,100],['Cadence',values.cadence,0,300],['Power',values.power,0,3000],
      ['Level',values.level,0,100],['Floors',values.floors,0,10000]
    ];
    for(const [label,raw,min,max] of checks){
      const n=Number(raw)||0;
      if(n<min || n>max) return `${label} looks invalid`;
    }
    return '';
  }

  const TEST_API={isLegacyDemoSession,stripLegacyDemoSession,emptyUserData,targetDateForTemplate,buildProgressRows,validateBackup,validateCardioNumbers};
  if(typeof globalThis!=='undefined' && globalThis.__LASTSET_TEST_ONLY__){
    globalThis.LastSetIntegrityTest=TEST_API;
    return;
  }
  if(typeof window==='undefined' || typeof document==='undefined') return;

  const baseLoadData = typeof loadData==='function' ? loadData : null;
  const baseSaveData = typeof saveData==='function' ? saveData : null;
  const baseSaveCardio = typeof saveCardio==='function' ? saveCardio : null;
  const baseSaveExercise = typeof saveExercise==='function' ? saveExercise : null;

  function storageAvailable(){
    try{
      const key='__lastset_storage_test__';
      localStorage.setItem(key,'1');
      const ok=localStorage.getItem(key)==='1';
      localStorage.removeItem(key);
      return ok;
    }catch(_){ return false; }
  }

  function readRegistry(){
    try{
      const raw=localStorage.getItem(USER_SPACES_KEY);
      const parsed=raw?JSON.parse(raw):null;
      if(parsed && Array.isArray(parsed.users)) return parsed;
    }catch(_){ }
    return {version:1,activeId:null,users:[]};
  }
  function writeRegistry(reg){
    try{ localStorage.setItem(USER_SPACES_KEY,JSON.stringify(reg)); return true; }
    catch(_){ return false; }
  }
  function userId(){ return `user_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }

  let syncingRegistry=false;
  function ensureRegistry(){
    const reg=readRegistry();
    let changed=false;
    if(!reg.activeId || !reg.users.some(u=>u.id===reg.activeId)){
      const id=data?.profile?.userId || userId();
      data.profile=data.profile||{};
      data.profile.userId=id;
      reg.activeId=id;
      const existing=reg.users.find(u=>u.id===id);
      const snapshot=clone(data);
      if(existing){ existing.data=snapshot; existing.name=data.profile.name||existing.name||'Current user'; existing.updatedAt=Date.now(); }
      else reg.users.push({id,name:data.profile.name||'Current user',data:snapshot,updatedAt:Date.now()});
      changed=true;
      if(baseSaveData) baseSaveData(data);
    }
    if(changed) writeRegistry(reg);
    return reg;
  }

  function syncActiveSnapshot(value){
    if(syncingRegistry) return;
    syncingRegistry=true;
    try{
      const reg=ensureRegistry();
      let user=reg.users.find(u=>u.id===reg.activeId);
      if(!user){ user={id:reg.activeId||userId(),name:'Current user',data:null,updatedAt:0}; reg.activeId=user.id; reg.users.push(user); }
      user.name=value?.profile?.name||user.name||'Current user';
      user.data=clone(value);
      user.updatedAt=Date.now();
      writeRegistry(reg);
    }finally{ syncingRegistry=false; }
  }

  if(baseLoadData){
    loadData=function(){
      const value=baseLoadData();
      if(stripLegacyDemoSession(value) && baseSaveData) baseSaveData(value);
      return value;
    };
  }

  if(typeof data!=='undefined' && stripLegacyDemoSession(data) && baseSaveData) baseSaveData(data);

  if(baseSaveData){
    saveData=function(value){
      baseSaveData(value);
      syncActiveSnapshot(value);
    };
  }
  ensureRegistry();
  syncActiveSnapshot(data);

  function resetViewTo(date){
    state.selectedDate=date;
    state.month=new Date(`${date}T12:00:00`);
    state.month=new Date(state.month.getFullYear(),state.month.getMonth(),1);
    state.tab=date===isoDate(new Date())?'today':'calendar';
    state.view='day';
    state.selectedExercise=null; state.editingExercise=null; state.editingCardioId=null;
    state.resistanceDraft={sets:[]}; state.cardioDraft={};
  }

  function switchToUser(id){
    const reg=readRegistry();
    const target=reg.users.find(u=>u.id===id);
    if(!target || !validateBackup(target.data)) return;
    syncActiveSnapshot(data);
    reg.activeId=id;
    writeRegistry(reg);
    data=clone(target.data);
    data.profile=data.profile||{}; data.profile.userId=id;
    if(baseSaveData) baseSaveData(data);
    resetViewTo(isoDate(new Date()));
    render();
    showToast(`Switched to ${data.profile.name||'user'}`);
  }

  function createNewUser(name,deleteCurrent){
    const reg=readRegistry();
    const currentId=reg.activeId;
    if(!deleteCurrent) syncActiveSnapshot(data);
    else reg.users=reg.users.filter(u=>u.id!==currentId);
    const id=userId();
    const fresh=emptyUserData(name,data.profile||{});
    fresh.profile.userId=id;
    reg.activeId=id;
    reg.users.push({id,name:name||'New user',data:clone(fresh),updatedAt:Date.now()});
    writeRegistry(reg);
    data=fresh;
    if(baseSaveData) baseSaveData(data);
    resetViewTo(isoDate(new Date()));
    render();
    showToast('New user started fresh');
  }

  function deleteInactiveUser(id){
    const reg=readRegistry();
    if(id===reg.activeId) return false;
    reg.users=reg.users.filter(u=>u.id!==id);
    writeRegistry(reg);
    return true;
  }

  function openUsersManager(){
    document.querySelector('.ls-users-modal')?.remove();
    const reg=readRegistry();
    const active=reg.activeId;
    const overlay=document.createElement('div');
    overlay.className='ls-users-modal';
    overlay.innerHTML=`<div class="ls-users-panel"><div class="ls-users-head"><div><div class="ls-integrity-kicker">Profiles</div><h3>Users and training data</h3></div><button type="button" data-users-close>×</button></div>
      <p class="muted">Each user keeps separate workout history, Saved Workouts and progress.</p>
      <div class="ls-users-list">${reg.users.map(u=>`<div class="ls-user-row"><div><strong>${escapeHtml(u.name||'Unnamed user')}</strong><small>${u.id===active?'Current user':'Stored profile'}</small></div><div class="ls-user-actions">${u.id===active?'<span class="session-tag">Active</span>':`<button class="secondary" type="button" data-user-switch="${u.id}">Switch</button><button class="mini-btn danger" type="button" data-user-delete="${u.id}">Delete</button>`}</div></div>`).join('')}</div>
      <button class="primary" type="button" data-user-new>Start a new user</button>
    </div>`;
    document.body.appendChild(overlay);
    const close=()=>overlay.remove();
    overlay.querySelector('[data-users-close]').onclick=close;
    overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
    overlay.querySelectorAll('[data-user-switch]').forEach(btn=>btn.onclick=()=>{close();switchToUser(btn.dataset.userSwitch);});
    overlay.querySelectorAll('[data-user-delete]').forEach(btn=>btn.onclick=()=>{
      const u=reg.users.find(x=>x.id===btn.dataset.userDelete);
      if(!confirm(`Permanently delete ${u?.name||'this user'} and all stored training data?`)) return;
      deleteInactiveUser(btn.dataset.userDelete); close(); openUsersManager();
    });
    overlay.querySelector('[data-user-new]').onclick=()=>openNewUserDialog(close);
  }

  function openNewUserDialog(closeParent){
    closeParent?.();
    document.querySelector('.ls-new-user-modal')?.remove();
    const reg=readRegistry();
    const current=reg.users.find(u=>u.id===reg.activeId);
    const overlay=document.createElement('div');
    overlay.className='ls-users-modal ls-new-user-modal';
    overlay.innerHTML=`<div class="ls-users-panel"><div class="ls-users-head"><div><div class="ls-integrity-kicker">New user</div><h3>Start fresh</h3></div><button type="button" data-new-close>×</button></div>
      <label class="ls-integrity-label">Name</label><input class="ls-integrity-input" id="ls-new-user-name" maxlength="40" placeholder="New user name">
      <div class="ls-choice-card"><strong>Keep ${escapeHtml(current?.name||'current user')} and start fresh</strong><p>Your existing workouts stay stored and you can switch back later.</p><button class="primary" type="button" data-new-keep>Keep existing data and start new user</button></div>
      <div class="ls-choice-card danger"><strong>Delete current user and start fresh</strong><p>This permanently removes the current user’s stored history after one more confirmation.</p><button class="secondary" type="button" data-new-delete>Delete current data and start new user</button></div>
    </div>`;
    document.body.appendChild(overlay);
    const close=()=>overlay.remove();
    overlay.querySelector('[data-new-close]').onclick=close;
    const name=()=>overlay.querySelector('#ls-new-user-name').value.trim();
    overlay.querySelector('[data-new-keep]').onclick=()=>{ if(!name()){showToast('Enter the new user name');return;} close(); createNewUser(name(),false); };
    overlay.querySelector('[data-new-delete]').onclick=()=>{
      if(!name()){showToast('Enter the new user name');return;}
      if(!confirm(`Permanently delete ${current?.name||'the current user'} and all training data? This cannot be undone unless you exported a backup.`)) return;
      close(); createNewUser(name(),true);
    };
  }

  repeatLastResistanceWorkout=function(){
    if(getResistanceSession(state.selectedDate)){ showToast('A resistance workout already exists for this day'); return; }
    const last=findLastResistanceWorkout(state.selectedDate);
    if(!last){ showToast('No previous resistance workout found'); return; }
    data.plans=data.plans||{};
    data.plans[state.selectedDate]={
      templateId:null,
      name:last.session.label||'Previous workout',
      exerciseIds:[...new Set((last.session.exercises||[]).map(e=>e.exerciseId).filter(Boolean))],
      source:'previous-workout', sourceDate:last.date, createdAt:Date.now()
    };
    saveData(data);
    render();
    showToast('Previous workout added as a plan');
  };

  let templateOriginView='day';
  const baseStartTemplate = typeof startTemplate==='function' ? startTemplate : null;
  if(baseStartTemplate){
    startTemplate=function(id){
      const t=(data.templates||[]).find(x=>x.id===id); if(!t)return;
      const today=isoDate(new Date());
      const target=targetDateForTemplate(templateOriginView,state.selectedDate,today);
      state.selectedDate=target;
      data.plans=data.plans||{};
      data.plans[target]={templateId:t.id,name:t.name,exerciseIds:[...t.exerciseIds],createdAt:Date.now()};
      const r=getResistanceSession(target); if(r)r.label=t.name;
      saveData(data);
      state.tab=target===today?'today':'calendar'; state.view='day';
      showToast(`${t.name} ready`);
    };
  }

  function mergeSmartResistance(parsed){
    const resistanceItems=parsed.items.filter(it=>it.kind==='resistance');
    if(!resistanceItems.length) return;
    let session=getResistanceSession(state.selectedDate);
    if(!session){
      session={id:cryptoId(),type:'resistance',createdAt:Date.now(),exercises:[]};
      if(!data.sessions[state.selectedDate])data.sessions[state.selectedDate]=[];
      data.sessions[state.selectedDate].push(session);
    }
    resistanceItems.forEach(it=>{
      const ex=EXERCISES.find(e=>e.id===it.exerciseId);
      const type=it.loadType||ex?.loadType||'external';
      const sets=(it.sets||[]).filter(s=>type==='timed'?Number(s.durationSeconds)>0:Number(s.reps)>0).map(s=>
        type==='timed'
          ? {durationSeconds:Number(s.durationSeconds),weight:0,reps:0,setType:s.setType||'working'}
          : {weight:s.weightKg==null?(type==='bodyweight'?0:null):Number(s.weightKg),reps:Number(s.reps),setType:s.setType||'working'}
      );
      const note=[it.notes,'Logged with Smart Log'].filter(Boolean).join(' · ');
      const existing=session.exercises.find(e=>e.exerciseId===it.exerciseId);
      if(existing){
        existing.sets=[...(existing.sets||[]),...sets];
        existing.loadType=type;
        if(note && !(existing.note||'').includes(note)) existing.note=[existing.note,note].filter(Boolean).join(' · ');
      }else{
        session.exercises.push({exerciseId:it.exerciseId||`smart-${slugify(it.name)}`,name:it.name,loadType:type,sets,note});
      }
    });
  }

  saveSmartLogWorkout=function(){
    const p=state.aiParsed;
    if(!p||!Array.isArray(p.items)||!p.items.length){showToast('Nothing to log');return;}
    if(getSmartMissing(p)){showToast('Answer the missing detail before saving');return;}
    removeRestSessions(state.selectedDate);
    mergeSmartResistance(p);
    p.items.filter(it=>it.kind==='cardio').forEach(it=>{
      if(!data.sessions[state.selectedDate])data.sessions[state.selectedDate]=[];
      data.sessions[state.selectedDate].push({id:cryptoId(),type:'cardio',activity:it.name||'Other',duration:it.durationMinutes||0,distance:it.distanceKm||0,environment:it.environment||'',avgSpeed:it.avgSpeed||0,incline:it.incline==null?0:it.incline,pace:it.pace||'',speedIntervals:it.speedIntervals||[],intervalMinutes:it.intervalMinutes||0,cooldown:!!it.cooldown,resistanceLevel:it.resistanceLevel||0,cadence:it.cadence||0,power:it.power||0,level:it.level||0,floors:it.floors||0,heartRate:it.heartRate||0,calories:it.calories||0,notes:[it.notes,'Logged with Smart Log'].filter(Boolean).join(' · '),createdAt:Date.now()});
    });
    saveData(data);
    state.aiParsed=null; state.aiDraft=''; state.aiError=''; state.aiSource=''; state.aiCorrection=''; state.smartConversation=[]; state.aiLoading=false; state.view='day';
    showToast('Smart workout logged');
  };

  progressScreen=function(){
    const rows=buildProgressRows(data,EXERCISES);
    return `<main class="container"><h2 style="margin:4px 0 14px">Progress</h2><div class="card">${rows.length?rows.map(h=>`<div class="progress-row"><strong>${escapeHtml(h.name)}</strong><span>${h.sessions} session${h.sessions===1?'':'s'} · ${escapeHtml(h.bestLabel)} · Last ${dateLabel(h.lastDate)}</span></div>`).join(''):`<div class="empty">Your exercise history will appear here.</div>`}</div>${(data.templates||[]).length?`<div class="section-title">Saved Workouts</div><div class="card">${data.templates.map(t=>`<div class="progress-row"><strong>${escapeHtml(t.name)}</strong><span>${t.exerciseIds.length} exercises</span></div>`).join('')}</div>`:''}</main>`;
  };

  if(baseSaveCardio){
    saveCardio=function(){
      const values={duration:valueNum('cardio-duration'),distance:valueNum('cardio-distance'),avgSpeed:valueNum('cardio-speed'),incline:valueNum('cardio-incline'),heartRate:valueNum('cardio-hr'),calories:valueNum('cardio-cal'),resistanceLevel:valueNum('cardio-resistance'),cadence:valueNum('cardio-cadence'),power:valueNum('cardio-power'),level:valueNum('cardio-level'),floors:valueNum('cardio-floors')};
      const error=validateCardioNumbers(values); if(error){showToast(error);return;}
      baseSaveCardio();
    };
  }
  if(baseSaveExercise){
    saveExercise=function(addNext=false){
      const e=EXERCISES.find(x=>x.id===state.selectedExercise);
      for(const s of state.resistanceDraft.sets||[]){
        if(e?.loadType==='timed'){
          const sec=Number(s.durationSeconds)||0; if(sec<0||sec>7200){showToast('Timed set looks invalid');return;}
        }else{
          const reps=Number(s.reps)||0; const weight=String(s.weight??'').trim()===''?0:Number(s.weight);
          if(reps<0||reps>500){showToast('Rep count looks invalid');return;}
          if(!Number.isFinite(weight)||weight<0||weight>1000){showToast(e?.loadType==='assisted'?'Assistance value looks invalid':'Weight looks invalid');return;}
        }
      }
      baseSaveExercise(addNext);
    };
  }

  function importBackupFile(file){
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const parsed=JSON.parse(String(reader.result||''));
        if(!validateBackup(parsed)) throw new Error('Invalid LastSet backup');
        if(!confirm('Replace the current user’s training data with this backup? Other stored users will not be changed.')) return;
        data=parsed;
        data.profile=data.profile||{};
        const reg=ensureRegistry(); data.profile.userId=reg.activeId;
        if(typeof migrateV10==='function')migrateV10();
        if(typeof migrateV11==='function')migrateV11();
        stripLegacyDemoSession(data);
        saveData(data);
        resetViewTo(isoDate(new Date())); render(); showToast('Backup imported');
      }catch(err){ showToast('That file is not a valid LastSet backup'); }
    };
    reader.readAsText(file);
  }

  const style=document.createElement('style');
  style.id='lastset-integrity-style';
  style.textContent=`
    .ls-integrity-card{border:1px solid rgba(169,255,80,.32);background:linear-gradient(135deg,rgba(28,20,45,.98),rgba(14,28,26,.96));border-radius:20px;padding:15px;margin:12px 0}.ls-integrity-kicker{text-transform:uppercase;letter-spacing:.16em;font-size:10px;font-weight:900;color:#a9ff50}.ls-integrity-card strong{display:block;font-size:15px;margin-top:4px}.ls-integrity-card p{font-size:11px;line-height:1.45;color:var(--muted);margin:5px 0 11px}.ls-integrity-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ls-storage-ok{color:#a9ff50}.ls-storage-bad{color:#ff8f9b}.ls-users-modal{position:fixed;inset:0;z-index:1300;background:rgba(5,3,12,.86);backdrop-filter:blur(12px);display:flex;align-items:flex-end;justify-content:center;padding:10px}.ls-users-panel{width:min(680px,100%);max-height:92vh;overflow:auto;background:#110d1c;border:1px solid #493066;border-radius:24px;padding:18px;box-shadow:0 -18px 60px rgba(0,0,0,.55)}.ls-users-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.ls-users-head h3{margin:3px 0 0}.ls-users-head>button{width:38px;height:38px;border-radius:11px;border:1px solid #493066;background:#1a1228;color:#fff;font-size:20px}.ls-users-list{display:grid;gap:8px;margin:14px 0}.ls-user-row{display:flex;justify-content:space-between;align-items:center;gap:10px;border:1px solid #352747;border-radius:14px;background:#151020;padding:11px}.ls-user-row strong,.ls-user-row small{display:block}.ls-user-row small{font-size:10px;color:var(--muted);margin-top:3px}.ls-user-actions{display:flex;align-items:center;gap:6px}.ls-user-actions .secondary{width:auto;padding:8px 10px}.ls-integrity-label{display:block;font-size:11px;font-weight:800;color:#b9adc9;margin:14px 0 6px}.ls-integrity-input{width:100%;border:1px solid #493066;border-radius:13px;background:#100c18;color:#fff;padding:12px}.ls-choice-card{border:1px solid #352747;border-radius:15px;padding:13px;margin-top:12px}.ls-choice-card strong{font-size:13px}.ls-choice-card p{font-size:11px;color:var(--muted);line-height:1.45}.ls-choice-card.danger{border-color:#60303b}@media(max-width:430px){.ls-users-modal{padding:0}.ls-users-panel{border-radius:22px 22px 0 0;max-height:94vh}.ls-integrity-actions{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function normalizeTerminology(){
    document.querySelectorAll('.plan-head .muted').forEach(el=>{if(/saved Training Day/i.test(el.textContent||''))el.textContent="Today's saved workout";});
    document.querySelectorAll('button,strong,.section-title,h2,h3').forEach(el=>{
      const text=(el.textContent||'').trim();
      if(text==='Saved Training Days')el.textContent='Saved Workouts';
      if(text==='Choose Training Day')el.textContent='Choose Saved Workout';
      if(text==='Save today’s exercises as a Training Day')el.textContent='Save today’s exercises as a workout';
      if(text==='Update saved Training Day')el.textContent='Update saved workout';
    });
  }

  function decorateMachineBeta(){
    document.querySelectorAll('.action').forEach(btn=>{
      const strong=btn.querySelector('strong'); if(strong?.textContent.trim()!=='Scan Machine')return;
      strong.textContent='Machine Scan Beta';
      const sub=btn.querySelector('.text span'); if(sub)sub.textContent='Photo assisted identification, limited beta';
    });
  }

  function decorateTemplatesTarget(){
    if(state.view!=='templates')return;
    const today=isoDate(new Date());
    const target=targetDateForTemplate(templateOriginView,state.selectedDate,today);
    document.querySelectorAll('[data-template-start]').forEach(btn=>{
      btn.textContent=target===today?'Start today':`Use on ${new Date(target+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})}`;
    });
  }

  function decorateProfileIntegrity(){
    if(state.view!=='profile')return;
    const main=document.querySelector('main.container'); if(!main)return;
    if(!main.querySelector('[data-integrity-users]')){
      const reg=readRegistry(); const current=reg.users.find(u=>u.id===reg.activeId);
      const card=document.createElement('section'); card.className='ls-integrity-card'; card.dataset.integrityUsers='1';
      card.innerHTML=`<div class="ls-integrity-kicker">User data</div><strong>${escapeHtml(current?.name||data.profile?.name||'Current user')}</strong><p>Switch users without mixing training history. Starting a new user can keep this data stored, or delete it only after a separate confirmation.</p><div class="ls-integrity-actions"><button class="secondary" type="button" data-manage-users>Manage users</button><button class="secondary" type="button" data-import-backup>Import backup</button></div><div style="font-size:10px;margin-top:9px" class="${storageAvailable()?'ls-storage-ok':'ls-storage-bad'}">${storageAvailable()?'● Device storage healthy':'● Device storage unavailable — export a backup before continuing'}</div><input type="file" accept="application/json,.json" data-backup-input hidden>`;
      const saved=main.querySelector('[data-saved-workouts-entry="profile"]');
      if(saved)saved.insertAdjacentElement('afterend',card); else main.appendChild(card);
      card.querySelector('[data-manage-users]').onclick=openUsersManager;
      const fileInput=card.querySelector('[data-backup-input]');
      card.querySelector('[data-import-backup]').onclick=()=>fileInput.click();
      fileInput.onchange=()=>{const f=fileInput.files?.[0];if(f)importBackupFile(f);fileInput.value='';};
    }
    const reset=document.querySelector('[data-action="clear-data"]'); if(reset)reset.textContent="Reset current user's training data";
    const version=[...document.querySelectorAll('.muted')].find(el=>/LastSet v0\.12/i.test(el.textContent||''));
    if(version)version.textContent=`LastSet v${VERSION} Trust + Data Integrity`;
  }

  let lastRenderedView=state.view;
  const baseRender=render;
  render=function(){
    const before=lastRenderedView;
    baseRender();
    if(state.view==='templates' && before!=='templates') templateOriginView=before;
    normalizeTerminology(); decorateMachineBeta(); decorateTemplatesTarget(); decorateProfileIntegrity();
    EXERCISES.forEach(ex=>{ex.primary=[ex.primaryMuscle,...(ex.secondaryMuscles||[]),...(ex.filterMuscles||[]),...(ex.aliases||[]),ex.movement].filter(Boolean).join(' ');});
    document.documentElement.dataset.lastsetIntegrity='v0129';
    lastRenderedView=state.view;
  };

  document.addEventListener('click',event=>{
    const reset=event.target.closest?.('[data-action="clear-data"]');
    if(!reset)return;
    event.preventDefault(); event.stopImmediatePropagation();
    const name=data.profile?.name||'current user';
    if(!confirm(`Reset training data for ${name}? Sessions, Saved Workouts and plans for this user will be cleared. Other users are kept.`))return;
    const profile=clone(data.profile||{});
    data=emptyUserData(profile.name||'',profile); data.profile.userId=readRegistry().activeId;
    saveData(data); resetViewTo(isoDate(new Date())); render(); showToast('Current user training data reset');
  },true);

  render();
})();
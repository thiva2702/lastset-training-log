(() => {
  'use strict';

  const VERSION = '0.13.0';
  const USER_SPACES_KEY = 'lastset-user-spaces-v1';

  const clone = value => JSON.parse(JSON.stringify(value));

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

  function stableLabel(user){
    return String(user?.data?.profile?.userLabel || user?.name || user?.data?.profile?.name || 'Current user').trim() || 'Current user';
  }

  function repairUserLabels(){
    if(typeof data==='undefined') return;
    const reg=readRegistry();
    let changed=false;
    reg.users.forEach(user=>{
      user.data=user.data||{sessions:{},profile:{}};
      user.data.profile=user.data.profile||{};
      const label=stableLabel(user);
      if(user.data.profile.userLabel!==label){ user.data.profile.userLabel=label; changed=true; }
      if(user.name!==label){ user.name=label; changed=true; }
    });
    data.profile=data.profile||{};
    const active=reg.users.find(u=>u.id===reg.activeId);
    const label=String(data.profile.userLabel || stableLabel(active) || data.profile.name || 'Current user').trim() || 'Current user';
    if(data.profile.userLabel!==label){ data.profile.userLabel=label; changed=true; }
    if(!data.profile.gender) data.profile.gender='prefer_not_to_say';
    if(active){
      active.name=label;
      active.data=active.data||clone(data);
      active.data.profile=active.data.profile||{};
      active.data.profile.userLabel=label;
      if(!active.data.profile.gender) active.data.profile.gender=data.profile.gender;
    }
    if(changed) writeRegistry(reg);
    try{
      if(typeof safeStorageSet==='function') safeStorageSet(data);
    }catch(_){ }
  }

  repairUserLabels();

  const priorSaveData=typeof saveData==='function'?saveData:null;
  if(priorSaveData){
    saveData=function(value){
      value=value||{};
      value.profile=value.profile||{};
      const before=readRegistry();
      const active=before.users.find(u=>u.id===before.activeId);
      const label=String(value.profile.userLabel || active?.data?.profile?.userLabel || active?.name || value.profile.name || 'Current user').trim() || 'Current user';
      value.profile.userLabel=label;
      if(!value.profile.gender) value.profile.gender=active?.data?.profile?.gender || 'prefer_not_to_say';
      priorSaveData(value);
      const after=readRegistry();
      after.users.forEach(user=>{
        user.data=user.data||{};
        user.data.profile=user.data.profile||{};
        const userLabel=String(user.data.profile.userLabel || user.name || user.data.profile.name || 'Current user').trim() || 'Current user';
        user.data.profile.userLabel=userLabel;
        user.name=userLabel;
      });
      const activeAfter=after.users.find(u=>u.id===after.activeId);
      if(activeAfter){
        activeAfter.name=label;
        activeAfter.data=activeAfter.data||clone(value);
        activeAfter.data.profile=activeAfter.data.profile||{};
        activeAfter.data.profile.userLabel=label;
        activeAfter.data.profile.gender=value.profile.gender;
      }
      writeRegistry(after);
    };
  }

  function ensureExercise(exercise){
    if(typeof EXERCISES==='undefined') return;
    const existing=EXERCISES.find(x=>x.id===exercise.id);
    if(existing){
      Object.assign(existing,exercise,{aliases:[...new Set([...(existing.aliases||[]),...(exercise.aliases||[])])]});
      return existing;
    }
    EXERCISES.push(exercise);
    return exercise;
  }

  [
    {id:'ez-bar-curl',name:'EZ Bar Biceps Curl',equipment:'EZ Bar',muscles:['Biceps','Forearms'],primaryMuscle:'Biceps',secondaryMuscles:['Arms'],filterMuscles:['Biceps','Arms'],movement:'Elbow Flexion',loadType:'external',aliases:['ez bar curl','ez curl bar curl','ez curl','e z bar curl','easy curl bar curl']},
    {id:'ez-bar-preacher-curl',name:'EZ Bar Preacher Curl',equipment:'EZ Bar',muscles:['Biceps'],primaryMuscle:'Biceps',secondaryMuscles:[],filterMuscles:['Biceps'],movement:'Elbow Flexion',loadType:'external',aliases:['ez bar preacher curl','ez preacher curl','preacher curl ez bar']},
    {id:'ez-bar-reverse-curl',name:'EZ Bar Reverse Curl',equipment:'EZ Bar',muscles:['Biceps','Forearms'],primaryMuscle:'Arms',secondaryMuscles:['Biceps'],filterMuscles:['Arms','Biceps'],movement:'Elbow Flexion',loadType:'external',aliases:['ez bar reverse curl','reverse ez curl','ez reverse curl']},
    {id:'ez-bar-skull-crusher',name:'EZ Bar Skull Crusher',equipment:'EZ Bar',muscles:['Triceps'],primaryMuscle:'Triceps',secondaryMuscles:[],filterMuscles:['Triceps'],movement:'Elbow Extension',loadType:'external',aliases:['ez bar skull crusher','ez skull crusher','ez bar lying triceps extension','ez bar triceps extension']},

    {id:'kettlebell-goblet-squat',name:'Kettlebell Goblet Squat',equipment:'Kettlebell',muscles:['Quads','Glutes','Core'],primaryMuscle:'Legs',secondaryMuscles:['Glutes','Core'],filterMuscles:['Legs','Glutes','Core'],movement:'Knee Dominant',loadType:'external',aliases:['kettlebell goblet squat','kb goblet squat','goblet squat kettlebell']},
    {id:'kettlebell-swing',name:'Kettlebell Swing',equipment:'Kettlebell',muscles:['Glutes','Hamstrings','Core'],primaryMuscle:'Glutes',secondaryMuscles:['Legs','Core'],filterMuscles:['Glutes','Legs','Core'],movement:'Hip Dominant',loadType:'external',aliases:['kettlebell swing','kb swing','kettlebell swings']},
    {id:'kettlebell-deadlift',name:'Kettlebell Deadlift',equipment:'Kettlebell',muscles:['Glutes','Hamstrings','Back'],primaryMuscle:'Glutes',secondaryMuscles:['Legs','Back'],filterMuscles:['Glutes','Legs','Back'],movement:'Hip Dominant',loadType:'external',aliases:['kettlebell deadlift','kb deadlift']},
    {id:'kettlebell-rdl',name:'Kettlebell Romanian Deadlift',equipment:'Kettlebell',muscles:['Hamstrings','Glutes'],primaryMuscle:'Legs',secondaryMuscles:['Glutes'],filterMuscles:['Legs','Glutes'],movement:'Hip Dominant',loadType:'external',aliases:['kettlebell romanian deadlift','kettlebell rdl','kb rdl']},
    {id:'kettlebell-shoulder-press',name:'Kettlebell Shoulder Press',equipment:'Kettlebell',muscles:['Shoulders','Triceps'],primaryMuscle:'Shoulders',secondaryMuscles:['Triceps'],filterMuscles:['Shoulders','Triceps'],movement:'Vertical Press',loadType:'external',aliases:['kettlebell shoulder press','kettlebell overhead press','kb press']},
    {id:'kettlebell-row',name:'Kettlebell Row',equipment:'Kettlebell',muscles:['Back','Biceps'],primaryMuscle:'Back',secondaryMuscles:['Biceps'],filterMuscles:['Back','Biceps'],movement:'Horizontal Pull',loadType:'external',aliases:['kettlebell row','single arm kettlebell row','kb row']},
    {id:'kettlebell-floor-press',name:'Kettlebell Floor Press',equipment:'Kettlebell',muscles:['Chest','Triceps','Shoulders'],primaryMuscle:'Chest',secondaryMuscles:['Triceps','Shoulders'],filterMuscles:['Chest','Triceps','Shoulders'],movement:'Horizontal Press',loadType:'external',aliases:['kettlebell floor press','kb floor press']},
    {id:'kettlebell-reverse-lunge',name:'Kettlebell Reverse Lunge',equipment:'Kettlebell',muscles:['Quads','Glutes'],primaryMuscle:'Legs',secondaryMuscles:['Glutes'],filterMuscles:['Legs','Glutes'],movement:'Knee Dominant',loadType:'external',aliases:['kettlebell reverse lunge','kb reverse lunge','kettlebell lunge']},
    {id:'kettlebell-clean',name:'Kettlebell Clean',equipment:'Kettlebell',muscles:['Glutes','Hamstrings','Shoulders','Back'],primaryMuscle:'Glutes',secondaryMuscles:['Legs','Shoulders','Back'],filterMuscles:['Glutes','Legs','Shoulders','Back'],movement:'Power',loadType:'external',aliases:['kettlebell clean','kb clean']},
    {id:'kettlebell-snatch',name:'Kettlebell Snatch',equipment:'Kettlebell',muscles:['Glutes','Hamstrings','Shoulders','Back'],primaryMuscle:'Shoulders',secondaryMuscles:['Glutes','Legs','Back'],filterMuscles:['Shoulders','Glutes','Legs','Back'],movement:'Power',loadType:'external',aliases:['kettlebell snatch','kb snatch']},

    {id:'band-squat',name:'Resistance Band Squat',equipment:'Resistance Band',muscles:['Quads','Glutes'],primaryMuscle:'Legs',secondaryMuscles:['Glutes'],filterMuscles:['Legs','Glutes'],movement:'Knee Dominant',loadType:'band',aliases:['resistance band squat','band squat','banded squat']},
    {id:'band-push-up',name:'Resistance Band Push Up',equipment:'Resistance Band',muscles:['Chest','Triceps','Shoulders'],primaryMuscle:'Chest',secondaryMuscles:['Triceps','Shoulders'],filterMuscles:['Chest','Triceps','Shoulders'],movement:'Horizontal Press',loadType:'band',aliases:['resistance band push up','band push up','banded push up','resisted push up']},
    {id:'band-assisted-pull-up',name:'Band Assisted Pull Up',equipment:'Resistance Band',muscles:['Back','Biceps'],primaryMuscle:'Back',secondaryMuscles:['Biceps'],filterMuscles:['Back','Biceps'],movement:'Vertical Pull',loadType:'band',aliases:['band assisted pull up','banded pull up','resistance band pull up','band pull up']},
    {id:'band-row',name:'Resistance Band Row',equipment:'Resistance Band',muscles:['Back','Biceps'],primaryMuscle:'Back',secondaryMuscles:['Biceps'],filterMuscles:['Back','Biceps'],movement:'Horizontal Pull',loadType:'band',aliases:['resistance band row','band row','banded row']},
    {id:'band-chest-press',name:'Resistance Band Chest Press',equipment:'Resistance Band',muscles:['Chest','Triceps','Shoulders'],primaryMuscle:'Chest',secondaryMuscles:['Triceps','Shoulders'],filterMuscles:['Chest','Triceps','Shoulders'],movement:'Horizontal Press',loadType:'band',aliases:['resistance band chest press','band chest press','banded chest press']},
    {id:'band-shoulder-press',name:'Resistance Band Shoulder Press',equipment:'Resistance Band',muscles:['Shoulders','Triceps'],primaryMuscle:'Shoulders',secondaryMuscles:['Triceps'],filterMuscles:['Shoulders','Triceps'],movement:'Vertical Press',loadType:'band',aliases:['resistance band shoulder press','band shoulder press','band overhead press']},
    {id:'band-biceps-curl',name:'Resistance Band Biceps Curl',equipment:'Resistance Band',muscles:['Biceps'],primaryMuscle:'Biceps',secondaryMuscles:[],filterMuscles:['Biceps'],movement:'Elbow Flexion',loadType:'band',aliases:['resistance band curl','band biceps curl','band curl','banded curl']},
    {id:'band-triceps-extension',name:'Resistance Band Triceps Extension',equipment:'Resistance Band',muscles:['Triceps'],primaryMuscle:'Triceps',secondaryMuscles:[],filterMuscles:['Triceps'],movement:'Elbow Extension',loadType:'band',aliases:['resistance band triceps extension','band triceps extension','band tricep extension']},
    {id:'band-lateral-raise',name:'Resistance Band Lateral Raise',equipment:'Resistance Band',muscles:['Shoulders'],primaryMuscle:'Shoulders',secondaryMuscles:[],filterMuscles:['Shoulders'],movement:'Accessory',loadType:'band',aliases:['resistance band lateral raise','band lateral raise','band side raise']},
    {id:'band-face-pull',name:'Resistance Band Face Pull',equipment:'Resistance Band',muscles:['Rear Delts','Upper Back'],primaryMuscle:'Shoulders',secondaryMuscles:['Back'],filterMuscles:['Shoulders','Back'],movement:'Horizontal Pull',loadType:'band',aliases:['resistance band face pull','band face pull']},
    {id:'band-pull-apart',name:'Band Pull Apart',equipment:'Resistance Band',muscles:['Rear Delts','Upper Back'],primaryMuscle:'Shoulders',secondaryMuscles:['Back'],filterMuscles:['Shoulders','Back'],movement:'Accessory',loadType:'band',aliases:['band pull apart','resistance band pull apart','band pull aparts']},
    {id:'band-good-morning',name:'Resistance Band Good Morning',equipment:'Resistance Band',muscles:['Hamstrings','Glutes','Back'],primaryMuscle:'Legs',secondaryMuscles:['Glutes','Back'],filterMuscles:['Legs','Glutes','Back'],movement:'Hip Dominant',loadType:'band',aliases:['resistance band good morning','band good morning','banded good morning']},

    {id:'smith-squat',name:'Smith Machine Squat',equipment:'Smith Machine',muscles:['Quads','Glutes'],primaryMuscle:'Legs',secondaryMuscles:['Glutes'],filterMuscles:['Legs','Glutes'],movement:'Knee Dominant',loadType:'external',aliases:['smith machine squat','smith squat']},
    {id:'smith-bench-press',name:'Smith Machine Bench Press',equipment:'Smith Machine',muscles:['Chest','Triceps','Shoulders'],primaryMuscle:'Chest',secondaryMuscles:['Triceps','Shoulders'],filterMuscles:['Chest','Triceps','Shoulders'],movement:'Horizontal Press',loadType:'external',aliases:['smith machine bench press','smith bench press','smith chest press']},
    {id:'smith-incline-bench-press',name:'Smith Machine Incline Bench Press',equipment:'Smith Machine',muscles:['Upper Chest','Triceps','Shoulders'],primaryMuscle:'Chest',secondaryMuscles:['Triceps','Shoulders'],filterMuscles:['Chest','Triceps','Shoulders'],movement:'Horizontal Press',angle:'Incline',loadType:'external',aliases:['smith incline bench press','smith machine incline press','incline smith press']},
    {id:'smith-shoulder-press',name:'Smith Machine Shoulder Press',equipment:'Smith Machine',muscles:['Shoulders','Triceps'],primaryMuscle:'Shoulders',secondaryMuscles:['Triceps'],filterMuscles:['Shoulders','Triceps'],movement:'Vertical Press',loadType:'external',aliases:['smith machine shoulder press','smith shoulder press','smith overhead press']},
    {id:'smith-rdl',name:'Smith Machine Romanian Deadlift',equipment:'Smith Machine',muscles:['Hamstrings','Glutes'],primaryMuscle:'Legs',secondaryMuscles:['Glutes'],filterMuscles:['Legs','Glutes'],movement:'Hip Dominant',loadType:'external',aliases:['smith machine romanian deadlift','smith rdl','smith machine rdl']},
    {id:'smith-hip-thrust',name:'Smith Machine Hip Thrust',equipment:'Smith Machine',muscles:['Glutes'],primaryMuscle:'Glutes',secondaryMuscles:[],filterMuscles:['Glutes'],movement:'Hip Dominant',loadType:'external',aliases:['smith machine hip thrust','smith hip thrust']},
    {id:'smith-calf-raise',name:'Smith Machine Calf Raise',equipment:'Smith Machine',muscles:['Calves'],primaryMuscle:'Legs',secondaryMuscles:[],filterMuscles:['Legs'],movement:'Accessory',loadType:'external',aliases:['smith machine calf raise','smith calf raise']}
  ].forEach(ensureExercise);

  if(typeof loadTypeLabelV11==='function'){
    const baseLoadTypeLabel=loadTypeLabelV11;
    loadTypeLabelV11=function(exercise){
      if(exercise?.loadType==='band') return 'Band resistance';
      return baseLoadTypeLabel(exercise);
    };
  }

  if(typeof formatSetV11==='function'){
    const baseFormatSet=formatSetV11;
    formatSetV11=function(exercise,set){
      if(exercise?.loadType==='band'){
        const reps=Number(set?.reps)||0;
        const weight=set?.weight==null||set?.weight===''?null:Number(set.weight);
        return Number.isFinite(weight)&&weight>0 ? `${formatNumber(weight)} kg band × ${reps}` : `Band × ${reps}`;
      }
      return baseFormatSet(exercise,set);
    };
  }

  function progressRows(){
    const history={};
    Object.entries(data?.sessions||{}).forEach(([date,sessions])=>{
      (sessions||[]).filter(s=>s.type==='resistance').forEach(session=>{
        (session.exercises||[]).forEach(item=>{
          const ex=EXERCISES.find(x=>x.id===item.exerciseId);
          const type=ex?.loadType||item.loadType||'external';
          const id=item.exerciseId||item.name;
          if(!id) return;
          if(!history[id]) history[id]={name:item.name||ex?.name||id,type,dates:new Set(),lastDate:date,best:null};
          const h=history[id]; h.type=type; h.dates.add(date); if(date>h.lastDate) h.lastDate=date;
          (item.sets||[]).filter(s=>s.setType!=='warmup').forEach(set=>{
            if(type==='timed'){
              const sec=Number(set.durationSeconds)||0;
              if(sec>0 && (!h.best||sec>h.best.sec)) h.best={sec};
              return;
            }
            const reps=Number(set.reps)||0;
            if(reps<=0) return;
            const weight=set.weight==null||set.weight===''?null:Number(set.weight);
            if(type==='assisted'){
              if(weight==null||!Number.isFinite(weight)) return;
              if(!h.best||weight<h.best.weight||(weight===h.best.weight&&reps>h.best.reps)) h.best={weight,reps};
            }else if(type==='bodyweight'){
              const added=Number.isFinite(weight)&&weight>0?weight:0;
              if(!h.best||added>h.best.added||(added===h.best.added&&reps>h.best.reps)) h.best={added,reps};
            }else if(type==='band'){
              const rated=Number.isFinite(weight)&&weight>0?weight:null;
              if(rated!=null){
                if(!h.best||h.best.rated==null||rated>h.best.rated||(rated===h.best.rated&&reps>h.best.reps)) h.best={rated,reps};
              }else if(!h.best||(h.best.rated==null&&reps>h.best.reps)) h.best={rated:null,reps};
            }else{
              const w=Number.isFinite(weight)?weight:0;
              if(!h.best||w>h.best.weight||(w===h.best.weight&&reps>h.best.reps)) h.best={weight:w,reps};
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
        else if(h.type==='band') bestLabel=h.best.rated!=null?`Best ${h.best.rated} kg band × ${h.best.reps}`:`Best ${h.best.reps} reps · band resistance not recorded`;
        else bestLabel=`Best ${h.best.weight} kg × ${h.best.reps}`;
      }
      return {...h,sessions:h.dates.size,bestLabel};
    }).sort((a,b)=>b.lastDate.localeCompare(a.lastDate));
  }

  progressScreen=function(){
    const rows=progressRows();
    return `<main class="container"><h2 style="margin:4px 0 14px">Progress</h2><div class="card">${rows.length?rows.map(h=>`<div class="progress-row"><strong>${escapeHtml(h.name)}</strong><span>${h.sessions} session${h.sessions===1?'':'s'} · ${escapeHtml(h.bestLabel)} · Last ${dateLabel(h.lastDate)}</span></div>`).join(''):`<div class="empty">Your exercise history will appear here.</div>`}</div>${(data.templates||[]).length?`<div class="section-title">Saved Workouts</div><div class="card">${data.templates.map(t=>`<div class="progress-row"><strong>${escapeHtml(t.name)}</strong><span>${t.exerciseIds.length} exercises</span></div>`).join('')}</div>`:''}</main>`;
  };

  profileScreen=function(){
    data.profile=data.profile||{};
    repairUserLabels();
    const unit=data.profile.weightUnit||'kg';
    const kg=Number(data.profile.bodyWeightKg)||0;
    const shownWeight=kg ? (unit==='lb' ? Math.round((kg/0.453592)*10)/10 : Math.round(kg*10)/10) : '';
    const gender=data.profile.gender||'prefer_not_to_say';
    const label=data.profile.userLabel||'Current user';
    return `<main class="container"><div class="card pad"><h2 style="margin-top:0">Profile</h2>
      <section class="ls-profile-identity"><div><span>Current user</span><strong>${escapeHtml(label)}</strong><small>Workout history, progress and Saved Workouts belong to this user.</small></div><button class="secondary" type="button" data-profile-manage-users>Switch user</button></section>
      <div class="field"><label>Display name</label><input id="profile-name" type="text" maxlength="40" value="${escapeHtml(data.profile.name||'')}" placeholder="Example: Thiva"><div class="muted" style="font-size:11px;margin-top:5px">Used in Smart Log and greetings. Changing this does not switch users or move training history.</div></div>
      <div class="field"><label>Gender, optional</label><select id="profile-gender"><option value="male" ${gender==='male'?'selected':''}>Male</option><option value="female" ${gender==='female'?'selected':''}>Female</option><option value="prefer_not_to_say" ${gender==='prefer_not_to_say'?'selected':''}>Prefer not to say</option></select><div class="muted" style="font-size:11px;margin-top:5px">Stored with this user profile. LastSet does not use this for calculations yet.</div></div>
      <div class="ls-profile-grid"><div class="field"><label>Height, cm</label><input id="profile-height" type="number" inputmode="decimal" min="80" max="250" step="0.1" value="${data.profile.heightCm||''}" placeholder="175"></div><div class="field"><label>Body weight, ${unit}</label><input id="profile-bodyweight" type="number" inputmode="decimal" min="20" max="500" step="0.1" value="${shownWeight}" placeholder="75"></div></div>
      <div class="field"><label>Weight unit</label><select id="profile-weight-unit"><option value="kg" ${unit==='kg'?'selected':''}>kg</option><option value="lb" ${unit==='lb'?'selected':''}>lb</option></select></div>
      <div class="field"><label>Progression preference</label><select id="profile-progression"><option value="reps_first" ${data.profile.progressionPreference!=='weight_first'?'selected':''}>Increase reps first, then weight</option><option value="weight_first" ${data.profile.progressionPreference==='weight_first'?'selected':''}>Increase weight first when sets are clean</option></select></div>
      <div class="ls-profile-note">Height, body weight and gender stay with this user profile on this device.</div>
      <button class="primary" data-action="save-profile">Save profile</button>
      <div class="card" style="padding:12px;margin:14px 0 12px"><strong style="font-size:13px">Smart Log stays on device</strong><div class="muted" style="font-size:11px;margin-top:5px;line-height:1.45">Workout descriptions are interpreted locally in your browser. No paid API is required.</div></div>
      <button class="secondary" data-action="export-data">Export training data</button><button class="secondary" style="margin-top:8px" data-action="clear-data">Reset current user's training data</button><div class="muted" style="font-size:11px;margin-top:14px;text-align:center">LastSet v${VERSION} Profile + Equipment</div>
    </div></main>`;
  };

  saveProfile=function(){
    data.profile=data.profile||{};
    const newUnit=document.getElementById('profile-weight-unit')?.value||'kg';
    const shown=Number(document.getElementById('profile-bodyweight')?.value)||0;
    data.profile.name=(document.getElementById('profile-name')?.value||'').trim();
    data.profile.gender=document.getElementById('profile-gender')?.value||'prefer_not_to_say';
    data.profile.heightCm=Number(document.getElementById('profile-height')?.value)||0;
    data.profile.weightUnit=newUnit;
    data.profile.bodyWeightKg=shown ? Math.round((newUnit==='lb'?shown*0.453592:shown)*10)/10 : 0;
    data.profile.progressionPreference=document.getElementById('profile-progression')?.value||'reps_first';
    saveData(data);
    showToast('Profile saved');
  };

  const style=document.createElement('style');
  style.id='lastset-profile-equipment-style';
  style.textContent=`.ls-profile-identity{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid rgba(169,255,80,.34);background:linear-gradient(135deg,rgba(30,21,47,.98),rgba(14,28,25,.96));border-radius:16px;padding:13px;margin:0 0 15px}.ls-profile-identity span,.ls-profile-identity strong,.ls-profile-identity small{display:block}.ls-profile-identity span{text-transform:uppercase;letter-spacing:.14em;color:#a9ff50;font-size:9px;font-weight:900}.ls-profile-identity strong{font-size:15px;margin-top:3px}.ls-profile-identity small{font-size:10px;color:var(--muted);margin-top:3px;line-height:1.4}.ls-profile-identity .secondary{width:auto;white-space:nowrap;padding:9px 11px}.ls-equipment-filter{overflow-x:auto;scrollbar-width:none}.ls-equipment-filter::-webkit-scrollbar{display:none}.ls-equipment-filter .ls-filter-chip{flex:0 0 auto}@media(max-width:430px){.ls-profile-identity{align-items:flex-start;flex-direction:column}.ls-profile-identity .secondary{width:100%}}`;
  document.head.appendChild(style);

  const equipmentLabels=['All','Barbell','EZ Bar','Dumbbell','Kettlebell','Cable','Resistance Band','Machine','Smith Machine','Bodyweight'];

  function wireTopProfile(){
    const btn=document.querySelector('.topbar-inner > .icon-btn');
    if(!btn) return;
    btn.setAttribute('aria-label','Profile');
    btn.setAttribute('title','Profile');
    btn.dataset.action='profile-top';
    btn.onclick=event=>{ event.preventDefault(); state.tab='profile'; state.view='profile'; render(); };
  }

  function rebuildEquipmentChips(){
    if(typeof state==='undefined' || state.view!=='exercise-list') return;
    const row=document.querySelector('.ls-equipment-filter');
    if(!row) return;
    const current=String(state.exerciseEquipmentFilter||'');
    row.innerHTML='';
    equipmentLabels.forEach(label=>{
      const btn=document.createElement('button');
      btn.type='button'; btn.className='ls-filter-chip'+((label==='All'&&!current)||label===current?' active':''); btn.textContent=label;
      btn.onclick=()=>{
        state.exerciseEquipmentFilter=label==='All'?'':label;
        const select=document.getElementById('equipment-filter'); if(select) select.value=state.exerciseEquipmentFilter;
        rebuildEquipmentChips();
        if(typeof applyExerciseFilters==='function') applyExerciseFilters(); else if(typeof filterExercises==='function') filterExercises();
      };
      row.appendChild(btn);
    });
  }

  function decorateBandLogger(){
    if(typeof state==='undefined' || state.view!=='exercise-log') return;
    const exercise=EXERCISES.find(e=>e.id===state.selectedExercise);
    if(exercise?.loadType!=='band') return;
    const hint=document.querySelector('.load-hint');
    if(hint) hint.textContent='Enter reps. If the band has a known resistance rating, record it in kg; otherwise leave it blank and note the band colour or tension.';
    document.querySelectorAll('[data-set-weight]').forEach(input=>input.placeholder='band kg');
    const increment=document.getElementById('exercise-increment');
    if(increment){
      const label=increment.closest('.field')?.querySelector('label'); if(label) label.textContent='Band resistance step, optional';
      const note=increment.closest('.field')?.querySelector('.mini-note'); if(note) note.textContent='Use notes for band colour or tension when a kg rating is not known.';
    }
  }

  function wireProfileUserButton(){
    if(typeof state==='undefined' || state.view!=='profile') return;
    const btn=document.querySelector('[data-profile-manage-users]');
    if(btn) btn.onclick=()=>{ const existing=document.querySelector('[data-manage-users]'); if(existing) existing.click(); else showToast('User manager is not available yet'); };
  }

  function decorate(){
    repairUserLabels();
    wireTopProfile();
    rebuildEquipmentChips();
    decorateBandLogger();
    wireProfileUserButton();
    if(typeof EXERCISES!=='undefined') EXERCISES.forEach(ex=>{ex.primary=[ex.primaryMuscle,...(ex.secondaryMuscles||[]),...(ex.filterMuscles||[]),...(ex.aliases||[]),ex.movement,ex.equipment].filter(Boolean).join(' ');});
    document.documentElement.dataset.lastsetProfileEquipment='v0130';
  }

  if(typeof render==='function'){
    const previousRender=render;
    render=function(){ previousRender(); decorate(); };
    render();
  }else document.addEventListener('DOMContentLoaded',decorate,{once:true});
})();

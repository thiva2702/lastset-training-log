(() => {
  'use strict';

  const MOTTOES = [
    'Show up today.',
    'Small steps. Big results.',
    'Stronger than yesterday.',
    'Progress over perfection.',
    'One workout at a time.',
    'Earn your tomorrow.',
    'Consistency builds strength.',
    'Keep moving forward.',
    'Discipline beats motivation.',
    'You came this far. Keep going.'
  ];

  function nextMotto(){
    try{
      const key='lastset-motto-index-v12';
      let idx=Number(localStorage.getItem(key));
      if(!Number.isFinite(idx)) idx=-1;
      idx=(idx+1)%MOTTOES.length;
      localStorage.setItem(key,String(idx));
      return MOTTOES[idx];
    }catch(_){
      return MOTTOES[Math.floor(Math.random()*MOTTOES.length)];
    }
  }
  const OPEN_MOTTO=nextMotto();

  function ensureExercise(exercise){
    if(typeof EXERCISES==='undefined') return;
    const existing=EXERCISES.find(x=>x.id===exercise.id);
    if(existing){ Object.assign(existing,exercise,{aliases:[...new Set([...(existing.aliases||[]),...(exercise.aliases||[])])]}); return existing; }
    EXERCISES.push(exercise);
    return exercise;
  }

  ensureExercise({
    id:'assisted-dip',
    name:'Assisted Dip',
    equipment:'Machine',
    muscles:['Chest','Triceps','Shoulders'],
    aliases:['assisted dip','assisted dips','assisted triceps dip','assisted chest dip','dip assist machine','assisted dip machine','dip machine'],
    loadType:'assisted',
    primaryMuscle:'Triceps',
    secondaryMuscles:['Chest','Shoulders'],
    filterMuscles:['Triceps','Chest','Shoulders'],
    movement:'Vertical Press',
    angle:'Standard'
  });

  const assistedPull=typeof EXERCISES!=='undefined' ? EXERCISES.find(x=>x.id==='assisted-pull-up') : null;
  if(assistedPull){
    assistedPull.loadType='assisted';
    assistedPull.primaryMuscle=assistedPull.primaryMuscle||'Back';
    assistedPull.secondaryMuscles=assistedPull.secondaryMuscles||['Biceps'];
    assistedPull.filterMuscles=[...new Set([...(assistedPull.filterMuscles||[]),'Back','Biceps'])];
    assistedPull.aliases=[...new Set([...(assistedPull.aliases||[]),'assisted pull ups','assisted pullups','assisted chin up','assisted chin ups','pull up assist machine'])];
  }

  ['pull-up','triceps-dip'].forEach(id=>{
    const e=typeof EXERCISES!=='undefined' ? EXERCISES.find(x=>x.id===id) : null;
    if(e) e.loadType='bodyweight';
  });

  if(typeof parseSmartWorkout==='function'){
    const baseParseSmartWorkout=parseSmartWorkout;
    parseSmartWorkout=function(text){
      const source=String(text||'');
      const parsed=baseParseSmartWorkout(source);
      if(!parsed || !Array.isArray(parsed.items)) return parsed;
      const lower=source.toLowerCase();
      const pct=(source.match(/\b(\d+(?:\.\d+)?)\s*%/)||[])[1];
      parsed.items.forEach(it=>{
        if(it.kind==='cardio' && /^(running|walking)$/i.test(it.name||'') && it.incline==null && pct!=null){
          it.incline=Number(pct);
        }
        if(it.kind!=='resistance') return;
        const assistedDip=/\bassisted\s+(?:triceps\s+|chest\s+)?dips?\b/i.test(lower) || /\bdip\s+assist(?:ance|ed)?\b/i.test(lower);
        const assistedPU=/\bassisted\s+(?:pull\s*ups?|pullups?|chin\s*ups?)\b/i.test(lower) || /\bpull\s*up\s+assist(?:ance|ed)?\b/i.test(lower);
        if(assistedDip && (it.exerciseId==='triceps-dip' || /\bdip/i.test(it.name||''))){
          const e=EXERCISES.find(x=>x.id==='assisted-dip');
          if(e){ it.exerciseId=e.id; it.name=e.name; it.equipment=e.equipment; it.loadType='assisted'; it.primaryMuscles=e.muscles||[]; }
        }
        if(assistedPU && (it.exerciseId==='pull-up' || /pull\s*up|pullup|chin\s*up/i.test(it.name||''))){
          const e=EXERCISES.find(x=>x.id==='assisted-pull-up');
          if(e){ it.exerciseId=e.id; it.name=e.name; it.equipment=e.equipment; it.loadType='assisted'; it.primaryMuscles=e.muscles||[]; }
        }
      });
      return parsed;
    };
  }

  if(typeof profileScreen==='function'){
    profileScreen=function(){
      data.profile=data.profile||{};
      const unit=data.profile.weightUnit||'kg';
      const kg=Number(data.profile.bodyWeightKg)||0;
      const shownWeight=kg ? (unit==='lb' ? Math.round((kg/0.453592)*10)/10 : Math.round(kg*10)/10) : '';
      return `<main class="container"><div class="card pad"><h2 style="margin-top:0">Profile</h2>
        <div class="field"><label>Display name</label><input id="profile-name" type="text" maxlength="40" value="${escapeHtml(data.profile.name||'')}" placeholder="Example: Thiva"><div class="muted" style="font-size:11px;margin-top:5px">Smart Log uses this name in the conversation.</div></div>
        <div class="ls-profile-grid">
          <div class="field"><label>Height, cm</label><input id="profile-height" type="number" inputmode="decimal" min="80" max="250" step="0.1" value="${data.profile.heightCm||''}" placeholder="175"></div>
          <div class="field"><label>Body weight, ${unit}</label><input id="profile-bodyweight" type="number" inputmode="decimal" min="20" max="500" step="0.1" value="${shownWeight}" placeholder="75"></div>
        </div>
        <div class="field"><label>Weight unit</label><select id="profile-weight-unit"><option value="kg" ${unit==='kg'?'selected':''}>kg</option><option value="lb" ${unit==='lb'?'selected':''}>lb</option></select></div>
        <div class="field"><label>Progression preference</label><select id="profile-progression"><option value="reps_first" ${data.profile.progressionPreference!=='weight_first'?'selected':''}>Increase reps first, then weight</option><option value="weight_first" ${data.profile.progressionPreference==='weight_first'?'selected':''}>Increase weight first when sets are clean</option></select></div>
        <div class="ls-profile-note">Height and body weight stay on your device. Body weight can be used when LastSet evaluates pull ups, dips, push ups and other bodyweight training.</div>
        <button class="primary" data-action="save-profile">Save profile</button>
        <div class="card" style="padding:12px;margin:14px 0 12px"><strong style="font-size:13px">Smart Log stays on device</strong><div class="muted" style="font-size:11px;margin-top:5px;line-height:1.45">Workout descriptions are interpreted locally in your browser. No paid API is required.</div></div>
        <button class="secondary" data-action="export-data">Export training data</button>
        <button class="secondary" style="margin-top:8px" data-action="clear-data">Reset prototype data</button>
        <div class="muted" style="font-size:11px;margin-top:14px;text-align:center">LastSet v0.12 Purple + Green</div>
      </div></main>`;
    };
  }

  if(typeof saveProfile==='function'){
    saveProfile=function(){
      data.profile=data.profile||{};
      const newUnit=document.getElementById('profile-weight-unit')?.value||'kg';
      const shown=Number(document.getElementById('profile-bodyweight')?.value)||0;
      data.profile.name=(document.getElementById('profile-name')?.value||'').trim();
      data.profile.heightCm=Number(document.getElementById('profile-height')?.value)||0;
      data.profile.weightUnit=newUnit;
      data.profile.bodyWeightKg=shown ? Math.round((newUnit==='lb'?shown*0.453592:shown)*10)/10 : 0;
      data.profile.progressionPreference=document.getElementById('profile-progression')?.value||'reps_first';
      saveData(data);
      showToast('Profile saved');
    };
  }

  let equipmentFilter='All';
  if(typeof filterExercises==='function'){
    const baseFilterExercises=filterExercises;
    filterExercises=function(term){
      baseFilterExercises(term||'');
      document.querySelectorAll('[data-exercise]').forEach(row=>{
        if(row.style.display==='none') return;
        if(equipmentFilter==='All') return;
        const e=EXERCISES.find(x=>x.id===row.dataset.exercise);
        if(!e) return;
        const matches=equipmentFilter==='Machine'
          ? /machine/i.test(e.equipment||'')
          : equipmentFilter==='Bodyweight'
            ? e.loadType==='bodyweight' || /bodyweight/i.test(e.equipment||'')
            : String(e.equipment||'').toLowerCase().includes(equipmentFilter.toLowerCase());
        if(!matches) row.style.display='none';
      });
    };
  }

  function decorateBrand(){
    const strong=document.querySelector('.brand strong');
    if(strong) strong.innerHTML='Last<span class="brand-set">Set</span>';
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content','#090713');
  }

  function decorateDay(){
    if(typeof state==='undefined' || state.view!=='day') return;
    const main=document.querySelector('main.container');
    if(!main || main.querySelector('.ls-hero')) return;
    const first=main.firstElementChild;
    if(!first) return;
    const originalDate=first.querySelector('h2')?.textContent || (typeof dateLabel==='function'?dateLabel(state.selectedDate):'Today');
    first.className='ls-hero';
    first.removeAttribute('style');
    first.innerHTML=`<span class="ls-date">${escapeHtml(originalDate)}</span><h1 class="ls-motto">${escapeHtml(OPEN_MOTTO)}</h1><div class="ls-motto-sub">Remember today. Build tomorrow.</div><div class="ls-scribble">Stronger<br>than<br>yesterday</div>`;
  }

  function decorateExerciseList(){
    if(typeof state==='undefined' || state.view!=='exercise-list') return;
    const main=document.querySelector('main.container');
    const search=main?.querySelector('.search');
    if(!main || !search) return;
    if(!main.querySelector('.ls-exercise-hero')){
      const hero=document.createElement('div');
      hero.className='ls-exercise-hero';
      hero.innerHTML='<div class="ls-eyebrow">Exercises</div><h2>Find your next set.</h2><p>Search, filter or browse your exercise library.</p>';
      main.insertBefore(hero,search);
    }
    if(!main.querySelector('.ls-equipment-filter')){
      const row=document.createElement('div');
      row.className='ls-equipment-filter';
      ['All','Barbell','Dumbbell','Machine','Bodyweight','Cable'].forEach(label=>{
        const b=document.createElement('button');
        b.type='button'; b.className='ls-filter-chip'+(label===equipmentFilter?' active':''); b.textContent=label;
        b.onclick=()=>{
          equipmentFilter=label;
          main.querySelectorAll('.ls-filter-chip').forEach(x=>x.classList.toggle('active',x.textContent===label));
          const input=document.getElementById('exercise-search');
          if(typeof filterExercises==='function') filterExercises(input?.value||'');
        };
        row.appendChild(b);
      });
      search.insertAdjacentElement('afterend',row);
    }
    const input=document.getElementById('exercise-search');
    if(input && !input.placeholder.includes('...')) input.placeholder='Search exercises...';
    if(typeof filterExercises==='function') filterExercises(input?.value||'');
  }

  function switchMovementMode(mode){
    const id=state.selectedExercise;
    const isPull=id==='pull-up'||id==='assisted-pull-up';
    const base=isPull?'pull-up':'triceps-dip';
    const assisted=isPull?'assisted-pull-up':'assisted-dip';
    const currentDraft=state.resistanceDraft?.sets||[];
    if(mode==='assisted'){
      state.selectedExercise=assisted;
      state.lsWeightedMode=false;
      state.resistanceDraft.sets=currentDraft.map(s=>({...s,weight:''}));
    }else{
      state.selectedExercise=base;
      state.lsWeightedMode=mode==='weighted';
      state.resistanceDraft.sets=currentDraft.map(s=>({...s,weight:mode==='bodyweight'?'':s.weight}));
    }
    render();
  }

  function decorateMovementMode(){
    if(typeof state==='undefined' || state.view!=='exercise-log') return;
    const id=state.selectedExercise;
    if(!['pull-up','assisted-pull-up','triceps-dip','assisted-dip'].includes(id)) return;
    const card=document.querySelector('main.container .card.pad');
    if(!card || card.querySelector('.ls-mode-panel')) return;
    const isAssisted=id.startsWith('assisted-');
    const active=isAssisted?'assisted':(state.lsWeightedMode?'weighted':'bodyweight');
    const panel=document.createElement('div');
    panel.className='ls-mode-panel';
    panel.innerHTML=`<div class="ls-mode-title">How are you doing this movement?</div><div class="ls-mode-row"><button class="ls-mode-btn ${active==='bodyweight'?'active':''}" data-ls-mode="bodyweight">Bodyweight</button><button class="ls-mode-btn ${active==='assisted'?'active':''}" data-ls-mode="assisted">Assisted</button><button class="ls-mode-btn ${active==='weighted'?'active':''}" data-ls-mode="weighted">Weighted</button></div>`;
    const chips=card.querySelector('.chip-row');
    if(chips) chips.insertAdjacentElement('afterend',panel); else card.prepend(panel);
    panel.querySelectorAll('[data-ls-mode]').forEach(b=>b.onclick=()=>switchMovementMode(b.dataset.lsMode));
    if(active==='weighted'){
      card.querySelectorAll('[data-set-weight]').forEach(i=>i.placeholder='added kg');
      const hint=card.querySelector('.load-hint');
      if(hint) hint.textContent='Enter the added external load and completed reps. Your profile body weight remains stored separately.';
    }
    if(active==='bodyweight'){
      const hint=card.querySelector('.load-hint');
      if(hint && data.profile?.bodyWeightKg) hint.textContent=`Log your reps. Current profile body weight: ${formatNumber(data.profile.bodyWeightKg)} kg. Added load is optional.`;
    }
  }

  function renameStrengthLanguage(){
    document.querySelectorAll('.action strong,.section-title,h2,h3').forEach(el=>{
      if(el.textContent.trim()==='Strength Training') el.textContent='Resistance Training';
    });
  }

  function decorateUI(){
    decorateBrand();
    decorateDay();
    decorateExerciseList();
    decorateMovementMode();
    renameStrengthLanguage();
    document.documentElement.dataset.lastsetTheme='amirtha';
  }

  if(typeof render==='function'){
    const baseRender=render;
    render=function(){ baseRender(); decorateUI(); };
    render();
  }else{
    document.addEventListener('DOMContentLoaded',decorateUI,{once:true});
  }
})();

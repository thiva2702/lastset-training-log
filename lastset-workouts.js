(() => {
  'use strict';

  let workoutReturnView = 'profile';
  let builderState = null;

  const css = `
  .ls-saved-workouts-card{border:1px solid rgba(169,255,80,.42);background:linear-gradient(135deg,rgba(31,24,48,.98),rgba(17,32,29,.96));border-radius:20px;padding:16px;margin:14px 0;box-shadow:0 14px 38px rgba(0,0,0,.2)}
  .ls-saved-workouts-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
  .ls-saved-workouts-kicker{color:#a9ff50;text-transform:uppercase;letter-spacing:.16em;font-size:10px;font-weight:900;margin-bottom:5px}
  .ls-saved-workouts-card strong{font-size:16px;display:block}
  .ls-saved-workouts-card p{color:var(--muted);font-size:12px;line-height:1.45;margin:5px 0 12px}
  .ls-saved-workouts-names{font-size:12px;color:#d7c9ee;line-height:1.5;margin:0 0 12px}
  .ls-workouts-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin:4px 0 16px}
  .ls-workouts-top h2{margin:2px 0 4px;font-size:24px}.ls-workouts-top p{margin:0;color:var(--muted);font-size:12px;line-height:1.45}
  .ls-workouts-new{width:auto!important;min-width:92px;padding:11px 14px!important}
  .ls-workout-card{padding:15px;margin-bottom:10px}.ls-workout-card h3{margin:0;font-size:16px}.ls-workout-card .ls-workout-meta{color:var(--muted);font-size:11px;margin:4px 0 9px}.ls-workout-card .ls-workout-exercises{font-size:12px;color:#d9cbed;line-height:1.55;margin-bottom:12px}
  .ls-workout-actions{display:grid;grid-template-columns:1.3fr .8fr .8fr;gap:7px}.ls-workout-actions button{margin:0!important;padding:10px!important}
  .ls-workouts-empty{text-align:center;padding:28px 18px}.ls-workouts-empty .ls-empty-icon{font-size:30px;margin-bottom:8px}.ls-workouts-empty strong{display:block;font-size:16px}.ls-workouts-empty p{color:var(--muted);font-size:12px;line-height:1.5;margin:6px auto 14px;max-width:320px}
  .ls-workout-builder{position:fixed;inset:0;z-index:1000;background:rgba(5,3,12,.82);backdrop-filter:blur(12px);display:flex;align-items:flex-end;justify-content:center;padding:10px}
  .ls-workout-builder-panel{width:min(680px,100%);max-height:92vh;overflow:auto;background:#110d1c;border:1px solid #493066;border-radius:24px 24px 18px 18px;box-shadow:0 -18px 60px rgba(0,0,0,.5);padding:18px}
  .ls-builder-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.ls-builder-head h3{margin:0;font-size:20px}.ls-builder-close{width:38px;height:38px;border-radius:12px;border:1px solid #493066;background:#171122;color:#f6f0ff;font-size:20px}
  .ls-builder-label{display:block;color:#b9adc9;font-size:11px;font-weight:800;margin:12px 0 6px}.ls-builder-input{width:100%;border:1px solid #493066;border-radius:13px;background:#100c18;color:#fff;padding:12px;outline:none}.ls-builder-input:focus{border-color:#9d5cff;box-shadow:0 0 0 3px rgba(157,92,255,.15)}
  .ls-selected-list,.ls-exercise-picker{display:grid;gap:7px}.ls-selected-row,.ls-pick-row{display:flex;align-items:center;gap:8px;border:1px solid #352747;border-radius:13px;background:#151020;padding:9px 10px}.ls-selected-row .ls-name,.ls-pick-row .ls-name{flex:1;min-width:0}.ls-name strong{font-size:12px;display:block}.ls-name span{font-size:10px;color:var(--muted)}
  .ls-tiny{border:1px solid #493066;background:#1a1228;color:#eee2ff;border-radius:9px;padding:7px 9px;font-size:11px}.ls-tiny:disabled{opacity:.4}.ls-tiny.danger{color:#ff8f9b;border-color:#60303b}.ls-tiny.add{color:#b5ff63;border-color:#4c6c31}
  .ls-builder-footer{position:sticky;bottom:-18px;background:linear-gradient(180deg,rgba(17,13,28,0),#110d1c 24%);padding:24px 0 2px;display:grid;grid-template-columns:.8fr 1.5fr;gap:8px}
  @media(max-width:430px){.ls-workout-actions{grid-template-columns:1fr 1fr}.ls-workout-actions .primary{grid-column:1/-1}.ls-workout-builder{padding:0}.ls-workout-builder-panel{border-radius:22px 22px 0 0;max-height:94vh}.ls-workouts-new{min-width:80px}.ls-saved-workouts-card{margin:12px 0}}
  `;

  function injectStyles(){
    if(document.getElementById('lastset-workouts-style')) return;
    const style=document.createElement('style');
    style.id='lastset-workouts-style';
    style.textContent=css;
    document.head.appendChild(style);
  }

  function esc(value){
    return String(value??'').replace(/[&<>'"]/g,ch=>({
      '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
    }[ch]));
  }

  function templates(){
    if(typeof data==='undefined') return [];
    if(!Array.isArray(data.templates)) data.templates=[];
    return data.templates;
  }

  function exerciseById(id){
    return typeof EXERCISES!=='undefined' ? EXERCISES.find(e=>e.id===id) : null;
  }

  function exerciseNames(ids,limit=4){
    const names=(ids||[]).map(id=>exerciseById(id)?.name||id).filter(Boolean);
    if(names.length<=limit) return names.join(' · ');
    return `${names.slice(0,limit).join(' · ')} · +${names.length-limit} more`;
  }

  function save(){
    if(typeof saveData==='function') saveData(data);
  }

  function toast(message){
    if(typeof showToast==='function') showToast(message);
  }

  function goToWorkouts(origin){
    workoutReturnView=origin||((typeof state!=='undefined'&&state.view)||'profile');
    if(typeof state!=='undefined') state.view='templates';
    if(typeof render==='function') render();
  }

  function managerScreen(){
    const list=templates();
    const current=(typeof getResistanceSession==='function' && typeof state!=='undefined') ? getResistanceSession(state.selectedDate) : null;
    const cards=list.map(t=>{
      const ids=Array.isArray(t.exerciseIds)?t.exerciseIds:[];
      return `<section class="card ls-workout-card">
        <h3>${esc(t.name||'Saved workout')}</h3>
        <div class="ls-workout-meta">${ids.length} ${ids.length===1?'exercise':'exercises'}</div>
        <div class="ls-workout-exercises">${esc(exerciseNames(ids))}</div>
        <div class="ls-workout-actions">
          <button class="primary" data-template-start="${esc(t.id)}">Start today</button>
          <button class="secondary" data-workout-edit="${esc(t.id)}">Edit</button>
          <button class="secondary" data-workout-delete="${esc(t.id)}">Delete</button>
        </div>
      </section>`;
    }).join('');

    return `<main class="container ls-workouts-screen">
      <div class="ls-workouts-top">
        <div><div class="ls-saved-workouts-kicker">Workout library</div><h2>Saved Workouts</h2><p>Create routines once, then start them without rebuilding every exercise.</p></div>
        <button class="primary ls-workouts-new" type="button" data-workout-create>+ New</button>
      </div>
      ${current?.exercises?.length?`<section class="ls-saved-workouts-card"><div class="ls-saved-workouts-kicker">Today</div><strong>Save today as a workout</strong><p>Turn the exercises you logged today into a reusable routine.</p><button class="secondary" type="button" data-workout-save-today>Save today’s exercises</button></section>`:''}
      <div class="section-title">Your workouts</div>
      ${cards||`<section class="card ls-workouts-empty"><div class="ls-empty-icon">🏋️</div><strong>No saved workouts yet</strong><p>Create Push Day, Pull Day, Legs, Upper Body, or any routine you want to reuse.</p><button class="primary" type="button" data-workout-create>Create first workout</button></section>`}
    </main>`;
  }

  function overrideManagerScreen(){
    try{ templatesScreen=managerScreen; }catch(_){ }
  }

  function decorateRepeatButton(){
    if(typeof state==='undefined' || state.view!=='day') return;
    const btn=document.querySelector('[data-action="repeat-last-workout"]');
    if(btn) btn.textContent='Use previous workout today';
  }

  function makeSavedWorkoutsCard(context){
    const list=templates();
    const names=list.slice(0,3).map(t=>t.name).filter(Boolean).join(' · ');
    const section=document.createElement('section');
    section.className='ls-saved-workouts-card';
    section.dataset.savedWorkoutsEntry=context;
    section.innerHTML=`<div class="ls-saved-workouts-head"><div><div class="ls-saved-workouts-kicker">Saved workouts</div><strong>${list.length?`${list.length} saved ${list.length===1?'routine':'routines'}`:'Build your workout library'}</strong></div><span class="session-tag">${list.length}</span></div>
      <p>${list.length?'Start a routine in one tap and log what you actually perform today.':'Create reusable routines such as Push Day, Pull Day or Legs.'}</p>
      ${names?`<div class="ls-saved-workouts-names">${esc(names)}</div>`:''}
      <button class="secondary" type="button" data-open-saved-workouts>${list.length?'Choose or manage workouts':'Create saved workout'}</button>`;
    return section;
  }

  function decorateDay(){
    if(typeof state==='undefined' || state.view!=='day') return;
    const main=document.querySelector('main.container');
    if(!main) return;

    const old=[...main.querySelectorAll('.quick-workout')].find(card=>/Saved Training Days/i.test(card.textContent||''));
    if(old) old.remove();

    if(!main.querySelector('[data-saved-workouts-entry="day"]')){
      const card=makeSavedWorkoutsCard('day');
      const actionList=main.querySelector('.action-list');
      if(actionList) main.insertBefore(card,actionList);
      else main.appendChild(card);
    }
    main.querySelector('[data-open-saved-workouts]')?.addEventListener('click',()=>goToWorkouts('day'));
  }

  function decorateProfile(){
    if(typeof state==='undefined' || state.view!=='profile') return;
    const main=document.querySelector('main.container');
    if(!main || main.querySelector('[data-saved-workouts-entry="profile"]')) return;
    const card=makeSavedWorkoutsCard('profile');
    const first=main.querySelector('.card.pad');
    if(first) first.insertAdjacentElement('afterend',card); else main.prepend(card);
    card.querySelector('[data-open-saved-workouts]')?.addEventListener('click',()=>goToWorkouts('profile'));
  }

  function currentDayExerciseIds(){
    if(typeof getResistanceSession!=='function' || typeof state==='undefined') return [];
    const session=getResistanceSession(state.selectedDate);
    return (session?.exercises||[]).map(e=>e.exerciseId).filter(Boolean);
  }

  function openBuilder(editId=null,presetIds=null){
    const existing=editId?templates().find(t=>t.id===editId):null;
    builderState={
      editId:existing?.id||null,
      name:existing?.name||'',
      ids:[...(presetIds||existing?.exerciseIds||[])]
    };
    drawBuilder();
  }

  function drawBuilder(){
    document.querySelector('.ls-workout-builder')?.remove();
    if(!builderState) return;

    const overlay=document.createElement('div');
    overlay.className='ls-workout-builder';
    overlay.innerHTML=`<div class="ls-workout-builder-panel" role="dialog" aria-modal="true" aria-label="Saved workout editor">
      <div class="ls-builder-head"><div><div class="ls-saved-workouts-kicker">${builderState.editId?'Edit workout':'New workout'}</div><h3>${builderState.editId?'Adjust saved workout':'Create saved workout'}</h3></div><button class="ls-builder-close" type="button" aria-label="Close">×</button></div>
      <label class="ls-builder-label" for="ls-workout-name">Workout name</label>
      <input class="ls-builder-input" id="ls-workout-name" maxlength="50" placeholder="Example: Push Day" value="${esc(builderState.name)}">
      <label class="ls-builder-label">Exercises in this workout</label>
      <div class="ls-selected-list"></div>
      <label class="ls-builder-label" for="ls-workout-search">Add exercises</label>
      <input class="ls-builder-input" id="ls-workout-search" placeholder="Search exercises...">
      <div class="ls-exercise-picker" style="margin-top:8px"></div>
      <div class="ls-builder-footer"><button class="secondary" type="button" data-builder-cancel>Cancel</button><button class="primary" type="button" data-builder-save>Save workout</button></div>
    </div>`;
    document.body.appendChild(overlay);

    const close=()=>{builderState=null;overlay.remove();};
    overlay.querySelector('.ls-builder-close').onclick=close;
    overlay.querySelector('[data-builder-cancel]').onclick=close;
    overlay.addEventListener('click',e=>{if(e.target===overlay) close();});
    overlay.querySelector('#ls-workout-name').oninput=e=>{builderState.name=e.target.value;};
    overlay.querySelector('#ls-workout-search').oninput=()=>renderPicker(overlay);
    overlay.querySelector('[data-builder-save]').onclick=saveBuilder;
    renderSelected(overlay);
    renderPicker(overlay);
  }

  function renderSelected(overlay){
    const box=overlay.querySelector('.ls-selected-list');
    if(!box) return;
    if(!builderState.ids.length){
      box.innerHTML='<div class="muted" style="font-size:11px;padding:7px 2px">No exercises selected yet.</div>';
      return;
    }
    box.innerHTML=builderState.ids.map((id,index)=>{
      const ex=exerciseById(id);
      return `<div class="ls-selected-row"><div class="ls-name"><strong>${esc(ex?.name||id)}</strong><span>${esc(ex?.equipment||'')}</span></div><button class="ls-tiny" type="button" data-move="up" data-index="${index}" ${index===0?'disabled':''}>↑</button><button class="ls-tiny" type="button" data-move="down" data-index="${index}" ${index===builderState.ids.length-1?'disabled':''}>↓</button><button class="ls-tiny danger" type="button" data-remove="${index}">Remove</button></div>`;
    }).join('');
    box.querySelectorAll('[data-remove]').forEach(btn=>btn.onclick=()=>{
      builderState.ids.splice(Number(btn.dataset.remove),1);
      renderSelected(overlay);renderPicker(overlay);
    });
    box.querySelectorAll('[data-move]').forEach(btn=>btn.onclick=()=>{
      const i=Number(btn.dataset.index);
      const j=btn.dataset.move==='up'?i-1:i+1;
      if(j<0||j>=builderState.ids.length) return;
      [builderState.ids[i],builderState.ids[j]]=[builderState.ids[j],builderState.ids[i]];
      renderSelected(overlay);
    });
  }

  function renderPicker(overlay){
    const box=overlay.querySelector('.ls-exercise-picker');
    if(!box || typeof EXERCISES==='undefined') return;
    const query=(overlay.querySelector('#ls-workout-search')?.value||'').trim().toLowerCase();
    const matches=EXERCISES.filter(ex=>!query || `${ex.name} ${ex.equipment||''} ${ex.primary||''}`.toLowerCase().includes(query)).slice(0,18);
    box.innerHTML=matches.map(ex=>{
      const added=builderState.ids.includes(ex.id);
      return `<div class="ls-pick-row"><div class="ls-name"><strong>${esc(ex.name)}</strong><span>${esc(ex.equipment||'')}</span></div><button class="ls-tiny add" type="button" data-add="${esc(ex.id)}" ${added?'disabled':''}>${added?'Added':'Add'}</button></div>`;
    }).join('') || '<div class="muted" style="font-size:11px;padding:8px 2px">No matching exercises.</div>';
    box.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=()=>{
      if(!builderState.ids.includes(btn.dataset.add)) builderState.ids.push(btn.dataset.add);
      renderSelected(overlay);renderPicker(overlay);
    });
  }

  function saveBuilder(){
    if(!builderState) return;
    const name=builderState.name.trim();
    if(!name){toast('Give this workout a name');return;}
    if(!builderState.ids.length){toast('Add at least one exercise');return;}

    if(builderState.editId){
      const item=templates().find(t=>t.id===builderState.editId);
      if(item){item.name=name;item.exerciseIds=[...builderState.ids];}
    }else{
      templates().push({id:`template_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,name,exerciseIds:[...builderState.ids]});
    }
    save();
    builderState=null;
    document.querySelector('.ls-workout-builder')?.remove();
    toast('Saved workout updated');
    if(typeof render==='function') render();
  }

  function wireManager(){
    if(typeof state==='undefined' || state.view!=='templates') return;
    document.querySelectorAll('[data-workout-create]').forEach(btn=>btn.onclick=()=>openBuilder());
    document.querySelectorAll('[data-workout-edit]').forEach(btn=>btn.onclick=()=>openBuilder(btn.dataset.workoutEdit));
    document.querySelectorAll('[data-workout-delete]').forEach(btn=>btn.onclick=()=>{
      const id=btn.dataset.workoutDelete;
      const item=templates().find(t=>t.id===id);
      if(!window.confirm(`Delete ${item?.name||'this saved workout'}?`)) return;
      data.templates=templates().filter(t=>t.id!==id);
      save();render();
    });
    const saveToday=document.querySelector('[data-workout-save-today]');
    if(saveToday) saveToday.onclick=()=>openBuilder(null,currentDayExerciseIds());
  }

  function decorate(){
    injectStyles();
    decorateRepeatButton();
    decorateDay();
    decorateProfile();
    wireManager();
    document.documentElement.dataset.lastsetWorkouts='v0128';
  }

  document.addEventListener('click',event=>{
    const back=event.target.closest?.('[data-action="back"]');
    if(!back || typeof state==='undefined' || state.view!=='templates') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    state.view=workoutReturnView||'profile';
    render();
  },true);

  overrideManagerScreen();
  if(typeof render==='function'){
    const previousRender=render;
    render=function(){
      previousRender();
      decorate();
    };
    render();
  }else{
    document.addEventListener('DOMContentLoaded',decorate,{once:true});
  }
})();

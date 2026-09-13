(() => {
  'use strict';

  function equipmentMatches(actual, filter){
    const a=String(actual||'').trim().toLowerCase();
    const f=String(filter||'').trim().toLowerCase();
    if(!f) return true;
    if(f==='machine') return a.includes('machine');
    if(f==='bodyweight') return a==='bodyweight';
    return a===f;
  }

  function stableApplyExerciseFilters(){
    if(typeof state==='undefined' || state.view!=='exercise-list') return;

    const search=(document.getElementById('exercise-search')?.value||'').trim();
    const muscle=String(state.exerciseMuscleFilter||'');
    const equipment=String(state.exerciseEquipmentFilter||'');
    const favs=new Set((typeof data!=='undefined' && Array.isArray(data.favorites)) ? data.favorites : []);
    let visible=0;

    document.querySelectorAll('[data-exercise-row]').forEach(row=>{
      const open=row.querySelector('[data-exercise]');
      if(open){
        open.style.display='flex';
        open.hidden=false;
      }

      const id=row.dataset.exerciseRow||'';
      const corpus=row.dataset.search||'';
      const muscles=(row.dataset.muscles||'').split('|').filter(Boolean);
      const secondary=(row.dataset.secondary||'').split('|').filter(Boolean);
      const actualEquipment=row.dataset.equipment||'';

      const okSearch=!search || (
        typeof fuzzySearchMatchV11==='function'
          ? fuzzySearchMatchV11(search,corpus)
          : corpus.includes(search.toLowerCase())
      );
      const okMuscle=!muscle || muscles.includes(muscle);
      const okEquipment=equipmentMatches(actualEquipment,equipment);
      const okFavourite=!state.exerciseFavoritesOnly || favs.has(id);
      const show=okSearch && okMuscle && okEquipment && okFavourite;

      row.style.display=show?'flex':'none';
      if(show) visible++;

      const isPrimary=!!muscle && row.dataset.primary===muscle;
      const isSecondary=!!muscle && !isPrimary && secondary.includes(muscle);
      const badge=row.querySelector('.muscle-match-badge');
      if(badge){
        if(isPrimary){
          badge.textContent='Primary match';
          badge.className='muscle-match-badge primary-match';
          badge.style.display='inline-flex';
        }else if(isSecondary){
          badge.textContent='Secondary match';
          badge.className='muscle-match-badge secondary-match';
          badge.style.display='inline-flex';
        }else{
          badge.style.display='none';
        }
      }
      row.style.order=isPrimary?'0':isSecondary?'1':'2';
    });

    const list=document.querySelector('.exercise-list');
    if(list){
      let empty=list.parentElement?.querySelector('.ls-filter-empty');
      if(!empty){
        empty=document.createElement('div');
        empty.className='ls-filter-empty';
        empty.textContent='No exercises match these filters. Clear a filter or try another combination.';
        list.insertAdjacentElement('afterend',empty);
      }
      empty.style.display=visible?'none':'block';
    }
  }

  function syncEquipmentChips(){
    if(typeof state==='undefined' || state.view!=='exercise-list') return;
    const active=String(state.exerciseEquipmentFilter||'');

    document.querySelectorAll('.ls-filter-chip').forEach(chip=>{
      const label=chip.textContent.trim();
      chip.classList.toggle('active', label==='All' ? !active : label===active);
      chip.onclick=()=>{
        state.exerciseEquipmentFilter=label==='All'?'':label;
        const select=document.getElementById('equipment-filter');
        if(select) select.value=state.exerciseEquipmentFilter;
        syncEquipmentChips();
        stableApplyExerciseFilters();
      };
    });
  }

  function wireStableFilterUI(){
    if(typeof state==='undefined' || state.view!=='exercise-list') return;

    const search=document.getElementById('exercise-search');
    if(search) search.oninput=stableApplyExerciseFilters;

    const muscle=document.getElementById('muscle-filter');
    if(muscle){
      muscle.onchange=()=>{
        state.exerciseMuscleFilter=muscle.value||'';
        stableApplyExerciseFilters();
      };
    }

    const equipment=document.getElementById('equipment-filter');
    if(equipment){
      equipment.onchange=()=>{
        state.exerciseEquipmentFilter=equipment.value||'';
        syncEquipmentChips();
        stableApplyExerciseFilters();
      };
    }

    const clear=document.querySelector('[data-action="clear-exercise-filters"]');
    if(clear){
      clear.onclick=()=>{
        state.exerciseFavoritesOnly=false;
        state.exerciseMuscleFilter='';
        state.exerciseEquipmentFilter='';
        if(search) search.value='';
        if(muscle) muscle.value='';
        if(equipment) equipment.value='';
        syncEquipmentChips();
        stableApplyExerciseFilters();
        document.querySelector('[data-action="favorites-filter"]')?.classList.remove('active');
      };
    }

    syncEquipmentChips();
    stableApplyExerciseFilters();
  }

  try{ applyExerciseFilters=stableApplyExerciseFilters; }catch(_){ }
  try{ filterExercises=stableApplyExerciseFilters; }catch(_){ }

  function applyHotfixes(){
    wireStableFilterUI();
    document.documentElement.dataset.lastsetHotfix='v0123';
  }

  if(typeof render==='function'){
    const previousRender=render;
    render=function(){
      previousRender();
      applyHotfixes();
    };
    render();
  }else{
    document.addEventListener('DOMContentLoaded',applyHotfixes,{once:true});
  }
})();

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

  function firstCardioBoundary(source, fromIndex, toIndex){
    const start=Math.max(0,Number(fromIndex)||0);
    const end=Math.max(start,Number.isFinite(Number(toIndex))?Number(toIndex):source.length);
    const tail=source.slice(start,end);
    const match=/\b(?:then\s+)?(?:treadmill(?:\s+(?:run|walk))?|running|run|jogging|jog|walking|walk|stationary\s+bike|exercise\s+bike|spin\s+bike|cycling|cycle|biking|rowing\s+machine|rower|rowing|swimming|swim|elliptical|cross\s+trainer|stair\s+machine|stairmaster|stair\s+climb|stairs)\b/i.exec(tail);
    return match ? start + match.index : end;
  }

  function installSmartLogBoundaryFix(){
    if(typeof parseSmartWorkout!=='function' || parseSmartWorkout.__lastsetBoundaryFixV0124) return;
    const baseParseSmartWorkout=parseSmartWorkout;

    const fixed=function(text){
      const source=String(text||'');
      const parsed=baseParseSmartWorkout(source);
      try{
        if(!parsed || !Array.isArray(parsed.items) || typeof parseExerciseSetsV11!=='function') return parsed;

        const resistance=parsed.items.filter(item=>item?.kind==='resistance');
        if(!resistance.length) return parsed;

        const mentions=typeof findExerciseMentions==='function'
          ? (findExerciseMentions(source)||[]).slice().sort((a,b)=>a.start-b.start)
          : [];

        const used=new Set();
        if(mentions.length){
          mentions.forEach((mention,index)=>{
            const nextStart=index+1<mentions.length?mentions[index+1].start:source.length;
            const end=firstCardioBoundary(source,mention.end,nextStart);
            const segment=source.slice(mention.start,end).trim();
            if(!segment) return;

            let itemIndex=resistance.findIndex((item,i)=>!used.has(i) && item.exerciseId===mention.exercise?.id);
            if(itemIndex<0) itemIndex=resistance.findIndex((_,i)=>!used.has(i));
            if(itemIndex<0) return;
            used.add(itemIndex);

            const item=resistance[itemIndex];
            const exercise=mention.exercise || (typeof EXERCISES!=='undefined' ? EXERCISES.find(e=>e.id===item.exerciseId) : null);
            if(!exercise) return;

            const sets=parseExerciseSetsV11(exercise,segment);
            if(Array.isArray(sets) && sets.length){
              item.sets=sets;
              item.loadType=exercise.loadType||item.loadType;
            }
          });
        }else if(resistance.length===1){
          const item=resistance[0];
          const exercise=typeof EXERCISES!=='undefined' ? EXERCISES.find(e=>e.id===item.exerciseId) : null;
          if(exercise){
            const end=firstCardioBoundary(source,0,source.length);
            if(end<source.length){
              const sets=parseExerciseSetsV11(exercise,source.slice(0,end));
              if(Array.isArray(sets) && sets.length) item.sets=sets;
            }
          }
        }

        return typeof finalizeSmartParsed==='function' ? finalizeSmartParsed(parsed) : parsed;
      }catch(err){
        console.warn('LastSet mixed workout boundary fix skipped',err);
        return parsed;
      }
    };

    fixed.__lastsetBoundaryFixV0124=true;
    try{ parseSmartWorkout=fixed; }catch(_){ }
  }

  try{ applyExerciseFilters=stableApplyExerciseFilters; }catch(_){ }
  try{ filterExercises=stableApplyExerciseFilters; }catch(_){ }

  function applyHotfixes(){
    wireStableFilterUI();
    installSmartLogBoundaryFix();
    document.documentElement.dataset.lastsetHotfix='v0124';
  }

  installSmartLogBoundaryFix();

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

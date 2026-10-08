(() => {
  'use strict';

  const VERSION='0.15.0';
  const BULB='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 15.7c-1.7-1.1-2.8-3-2.8-5.2a6.3 6.3 0 0 1 12.6 0c0 2.2-1.1 4.1-2.8 5.2-.7.5-1 1.1-1.1 1.8h-4.8c-.1-.7-.4-1.3-1.1-1.8Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9.7 20h4.6M10.2 17.5h3.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';

  const GROUPS=Object.freeze({
    Chest:{side:'front',regions:['Upper Chest','Mid Chest','Lower Chest']},
    Shoulders:{side:'front',regions:['Front Delts','Side Delts','Rear Delts']},
    Arms:{side:'front',regions:['Biceps','Triceps','Forearms']},
    Core:{side:'front',regions:['Abs','Obliques']},
    Back:{side:'back',regions:['Lats','Upper Back','Traps','Lower Back']},
    Legs:{side:'front',regions:['Quads','Hamstrings','Glutes','Calves','Adductors']}
  });

  const EQUIPMENT=Object.freeze([
    {id:'all',label:'All'},
    {id:'bodyweight',label:'Bodyweight'},
    {id:'free',label:'Barbell / Free weight'},
    {id:'dumbbell',label:'Dumbbells'},
    {id:'machine',label:'Machines'},
    {id:'cable',label:'Cable / Rope'}
  ]);

  const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

  function modelGender(profile){
    const value=norm(profile?.gender);
    return /female|woman|girl/.test(value)?'female':'male';
  }

  function equipmentBucket(ex){
    const value=norm(ex?.equipment);
    if(value.includes('bodyweight'))return'bodyweight';
    if(value.includes('dumbbell'))return'dumbbell';
    if(value.includes('cable')||value.includes('rope'))return'cable';
    if(value.includes('barbell')||value.includes('free weight')||value.includes('kettlebell'))return'free';
    if(value.includes('machine')||value.includes('plate loaded')||value.includes('smith'))return'machine';
    return'other';
  }

  function hasMuscle(ex,name){
    const target=norm(name);
    return [...(ex?.muscles||[]),...(ex?.filterMuscles||[]),ex?.primaryMuscle,...(ex?.secondaryMuscles||[])]
      .filter(Boolean).some(v=>norm(v)===target);
  }

  function exerciseMatchesRegion(ex,region){
    const n=norm(ex?.name),movement=norm(ex?.movement),angle=norm(ex?.angle);
    switch(region){
      case'Upper Chest':return hasMuscle(ex,'Upper Chest')||(hasMuscle(ex,'Chest')&&(angle.includes('incline')||n.includes('incline')));
      case'Mid Chest':return hasMuscle(ex,'Chest')&&!/(incline|decline|dip)/.test(n+' '+angle);
      case'Lower Chest':return hasMuscle(ex,'Chest')&&(angle.includes('decline')||n.includes('decline')||n.includes('dip'));
      case'Front Delts':return hasMuscle(ex,'Shoulders')&&(n.includes('front raise')||movement.includes('vertical press')||(/shoulder press/.test(n)&&!n.includes('rear')));
      case'Side Delts':return hasMuscle(ex,'Shoulders')&&(n.includes('lateral')||n.includes('side raise')||n.includes('side lateral'));
      case'Rear Delts':return hasMuscle(ex,'Rear Delts')||n.includes('rear delt')||n.includes('reverse pec')||n.includes('face pull');
      case'Biceps':return hasMuscle(ex,'Biceps');
      case'Triceps':return hasMuscle(ex,'Triceps');
      case'Forearms':return hasMuscle(ex,'Forearms');
      case'Abs':return hasMuscle(ex,'Abs')||hasMuscle(ex,'Core')||n.includes('crunch')||n.includes('plank')||n.includes('leg raise');
      case'Obliques':return n.includes('oblique')||movement.includes('rotation')||n.includes('rotary')||n.includes('wood chop');
      case'Lats':return hasMuscle(ex,'Lats')||movement.includes('vertical pull')||n.includes('pulldown')||n.includes('pull up');
      case'Upper Back':return hasMuscle(ex,'Upper Back')||movement.includes('horizontal pull')||n.includes('row')||n.includes('face pull')||n.includes('reverse pec');
      case'Traps':return hasMuscle(ex,'Traps')||n.includes('shrug');
      case'Lower Back':return n.includes('back extension')||n.includes('deadlift')||(hasMuscle(ex,'Back')&&movement.includes('hip dominant'));
      case'Quads':return hasMuscle(ex,'Quads');
      case'Hamstrings':return hasMuscle(ex,'Hamstrings');
      case'Glutes':return hasMuscle(ex,'Glutes');
      case'Calves':return hasMuscle(ex,'Calves');
      case'Adductors':return hasMuscle(ex,'Adductors');
      default:return false;
    }
  }

  function filterExploreExercises(catalogue,region,equipment='all'){
    if(!region)return[];
    return (catalogue||[])
      .filter(ex=>exerciseMatchesRegion(ex,region))
      .filter(ex=>equipment==='all'||equipmentBucket(ex)===equipment)
      .sort((a,b)=>{
        const ap=norm(a.primaryMuscle)===norm(region)?1:0,bp=norm(b.primaryMuscle)===norm(region)?1:0;
        if(ap!==bp)return bp-ap;
        return String(a.name||'').localeCompare(String(b.name||''));
      });
  }

  function addExerciseToPlan(db,date,exerciseId,now=Date.now()){
    if(!db||!date||!exerciseId)return false;
    db.plans=db.plans||{};
    const plan=db.plans[date]||(db.plans[date]={templateId:null,name:'Muscle Explorer plan',exerciseIds:[],createdAt:now,source:'explore'});
    plan.exerciseIds=Array.isArray(plan.exerciseIds)?plan.exerciseIds:[];
    if(plan.exerciseIds.includes(exerciseId))return false;
    plan.exerciseIds.push(exerciseId);
    plan.updatedAt=now;
    return true;
  }

  if(typeof globalThis!=='undefined'&&globalThis.__LASTSET_TEST_ONLY__){
    globalThis.LastSetExploreTest={modelGender,equipmentBucket,exerciseMatchesRegion,filterExploreExercises,addExerciseToPlan};
    return;
  }

  if(typeof window==='undefined')return;

  const cat=()=>typeof EXERCISES!=='undefined'?EXERCISES:[];
  const db=()=>typeof data!=='undefined'?data:null;
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(v):String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=()=>typeof isoDate==='function'?isoDate(new Date()):new Date().toISOString().slice(0,10);

  function initState(){
    if(typeof state==='undefined')return;
    state.exploreSide=state.exploreSide||'front';
    state.exploreGroup=state.exploreGroup||'';
    state.exploreRegion=state.exploreRegion||'';
    state.exploreEquipment=state.exploreEquipment||'all';
    state.exploreExerciseId=state.exploreExerciseId||'';
    state.explorePlanDate=state.explorePlanDate||today();
    state.exploreZoom=Number(state.exploreZoom)||1;
  }

  function anatomySvg(side,gender){
    if(globalThis.LastSetAnatomy?.render){
      return globalThis.LastSetAnatomy.render({side,gender,activeGroup:state.exploreGroup,activeRegion:state.exploreRegion});
    }
    const available=side==='back'?['Shoulders','Back','Arms','Legs']:['Shoulders','Chest','Arms','Core','Legs'];
    return '<div class="ls-anatomy-fallback" role="group" aria-label="Choose muscle group">'+
      available.map(group=>'<button data-explore-group="'+group+'" type="button">'+group+'</button>').join('')+'</div>';
  }

  function guide(ex){
    const m=norm(ex?.movement),eq=norm(ex?.equipment);
    let setup='Set your position so the target muscle can move through a comfortable range.';
    let action='Use a controlled range and keep tension on the target muscle.';
    let avoid='Avoid using momentum just to move more load.';
    if(eq.includes('machine'))setup='Adjust the seat, pads and start position so the machine lines up comfortably with your joints.';
    else if(eq.includes('dumbbell'))setup='Choose a stable position and control the dumbbells before the first rep.';
    else if(eq.includes('barbell'))setup='Set your grip and body position, then brace before the working set.';
    else if(eq.includes('cable'))setup='Set the cable height and attachment so the line of pull matches the movement.';
    if(m.includes('horizontal press')){action='Press while keeping the upper back stable, then control the return.';avoid='Avoid bouncing the load or letting the shoulders roll forward.';}
    else if(m.includes('vertical pull')){action='Drive the elbows down and control the return to the stretch.';avoid='Avoid turning the movement into a backward-leaning row.';}
    else if(m.includes('horizontal pull')){action='Pull the elbows back while keeping the torso stable.';avoid='Avoid jerking the torso to move the weight.';}
    else if(m.includes('knee dominant')){action='Keep the knees tracking with the feet and drive through the whole foot.';avoid='Avoid collapsing the knees inward or shortening range only to add load.';}
    else if(m.includes('hip dominant')){action='Drive through the hips while keeping the trunk braced.';avoid='Avoid finishing by overextending the lower back.';}
    return {setup,action,avoid};
  }

  function exerciseCard(ex){
    const selected=state.exploreExerciseId===ex.id;
    const plannedToday=(db()?.plans?.[today()]?.exerciseIds||[]).includes(ex.id);
    const last=typeof findLastExercise==='function'?findLastExercise(ex.id,today()):null;
    const lastText=last?.sets?.length?'Last: '+last.sets.filter(s=>s.setType!=='warmup').map(s=>(s.weight??0)+'×'+(s.reps??0)).join(', '):'No previous log';
    const g=guide(ex);
    return '<article class="ls-explore-exercise '+(selected?'selected':'')+'">'+
      '<button class="ls-explore-exercise-main" data-explore-exercise="'+esc(ex.id)+'">'+
        '<div><strong>'+esc(ex.name)+'</strong><span>'+esc(ex.equipment)+' · '+esc((ex.muscles||[]).slice(0,3).join(' · '))+'</span><small>'+esc(lastText)+'</small></div><b>›</b>'+
      '</button>'+
      (selected?'<div class="ls-explore-learn">'+
        '<div class="ls-learn-row"><span>Setup</span><p>'+esc(g.setup)+'</p></div>'+
        '<div class="ls-learn-row"><span>Do</span><p>'+esc(g.action)+'</p></div>'+
        '<div class="ls-learn-row"><span>Avoid</span><p>'+esc(g.avoid)+'</p></div>'+
        '<div class="ls-explore-actions"><button class="primary" data-explore-today="'+esc(ex.id)+'">'+(plannedToday?'✓ Added to Today':'＋ Add to Today')+'</button></div>'+
        '<div class="ls-plan-date"><input type="date" data-explore-plan-date value="'+esc(state.explorePlanDate)+'" min="'+today()+'"><button class="secondary" data-explore-plan="'+esc(ex.id)+'">Plan for date</button></div>'+
      '</div>':'')+
    '</article>';
  }

  function exploreScreen(){
    initState();
    const gender=modelGender(db()?.profile);
    const group=GROUPS[state.exploreGroup];
    const regions=group?.regions||[];
    const results=state.exploreRegion?filterExploreExercises(cat(),state.exploreRegion,state.exploreEquipment):[];
    return '<main class="container ls-explore-screen">'+
      '<section class="ls-explore-hero"><div class="ls-explore-bulb">'+BULB+'</div><div><div class="ls-explore-kicker">Learn · choose · train</div><h2>Muscle Explorer</h2><p>Tap the body, choose your focus and equipment, then add an exercise straight to your training plan.</p></div></section>'+
      '<section class="card ls-anatomy-card">'+
        '<div class="ls-anatomy-head"><div><strong>'+(gender==='female'?'Female':'Male')+' anatomy</strong><span>Original interactive atlas · based on your profile</span></div><div class="ls-side-toggle"><button class="'+(state.exploreSide==='front'?'active':'')+'" data-explore-side="front">Front</button><button class="'+(state.exploreSide==='back'?'active':'')+'" data-explore-side="back">Back</button></div></div>'+
        '<div class="ls-anatomy-stage"><div class="ls-anatomy-zoom-frame" style="transform:scale('+state.exploreZoom+')">'+anatomySvg(state.exploreSide,gender)+'</div><div class="ls-zoom-controls" aria-label="Anatomy zoom"><button type="button" data-explore-zoom="in" aria-label="Zoom in">+</button><button type="button" data-explore-zoom="out" aria-label="Zoom out">−</button><button type="button" data-explore-zoom="reset" aria-label="Reset zoom">⟳</button></div></div>'+
        '<div class="ls-anatomy-hint">'+(state.exploreGroup?'Selected: <strong>'+esc(state.exploreGroup)+'</strong>':'Tap a muscle group to explore')+'</div>'+
      '</section>'+
      (group?'<section class="card ls-explore-step ls-explore-sheet" role="region" aria-label="Muscle focus and exercises">'+
        '<div class="ls-sheet-grabber" aria-hidden="true"></div><div class="ls-sheet-head"><div><small>SELECT A MUSCLE</small><strong>'+esc(state.exploreRegion||state.exploreGroup)+'</strong><span>Choose a specific muscle to see exercises</span></div><button type="button" class="ls-sheet-close" data-explore-close aria-label="Close muscle selection">×</button></div>'+
        '<div class="ls-chip-grid ls-muscle-options">'+regions.map(r=>'<button class="ls-explore-chip '+(state.exploreRegion===r?'active':'')+'" data-explore-region="'+esc(r)+'" aria-pressed="'+(state.exploreRegion===r)+'"><span class="ls-option-thumb" aria-hidden="true"></span><span>'+esc(r)+'</span></button>').join('')+'</div>'+
        (state.exploreRegion?'<div class="ls-sheet-equipment"><strong>Equipment</strong><div class="ls-equipment-grid">'+EQUIPMENT.map(x=>'<button class="ls-explore-chip '+(state.exploreEquipment===x.id?'active':'')+'" data-explore-equipment="'+x.id+'">'+esc(x.label)+'</button>').join('')+'</div></div>':'')+
        (state.exploreRegion?'<div class="ls-explore-results"><div class="ls-result-head"><strong>Common exercises</strong><span>'+results.length+' found</span></div>'+
          (results.length?results.map(exerciseCard).join(''):'<div class="empty">No exercises match this equipment. Try All.</div>')+'</div>':'')+
      '</section>':'')+
    '</main>';
  }

  function navButton(view,label,icon){
    const active=view==='day'?state.tab==='today':state.tab===view;
    return '<button class="nav-btn '+(active?'active':'')+'" data-nav="'+view+'" aria-label="'+label+'" '+(active?'aria-current="page"':'')+'><span class="nicon">'+icon+'</span><span class="nav-label">'+label+'</span></button>';
  }

  function exploreBottomNav(){
    const icons=globalThis.LastSetBrand?.icons||{};
    return '<nav class="bottom-nav ls-brand-nav ls-five-nav" aria-label="Primary navigation"><div class="bottom-nav-inner">'+
      navButton('calendar','Calendar',icons.calendar||'')+
      navButton('day','Today',icons.today||'')+
      navButton('explore','Explore',BULB)+
      navButton('progress','Progress',icons.progress||'')+
      navButton('profile','Profile',icons.profile||'')+
    '</div></nav>';
  }

  function addPlan(id,date){
    const target=db();
    const ex=cat().find(x=>x.id===id);
    if(!target||!ex)return;
    const changed=addExerciseToPlan(target,date,id);
    if(changed){
      if(typeof saveData==='function')saveData(target);
      if(typeof showToast==='function')showToast(ex.name+' added to '+(date===today()?'Today':'plan'));
    }else if(typeof showToast==='function')showToast(ex.name+' is already planned');
    render();
  }

  initState();

  if(typeof planCard==='function'){
    const previousPlanCard=planCard;
    planCard=function(plan){
      let html=previousPlanCard(plan);
      if(plan?.source==='explore'){
        html=html.replace("Today\\'s saved Training Day",'Built in Muscle Explorer');
        html=html.replace('<button class="mini-btn" data-action="open-templates">Change</button>','<span class="session-tag">Explore</span>');
      }
      return html;
    };
  }

  if(typeof screen==='function'){
    const previousScreen=screen;
    screen=function(){
      if(state.view==='explore')return exploreScreen();
      return previousScreen();
    };
  }

  if(typeof bottomNav==='function')bottomNav=exploreBottomNav;

  document.addEventListener('click',event=>{
    const group=event.target.closest?.('[data-explore-group]');
    if(group){
      event.preventDefault();
      const name=group.dataset.exploreGroup;
      state.exploreGroup=name;
      state.exploreRegion=name==='Arms'?'Biceps':'';
      state.exploreExerciseId='';
      render();return;
    }
    const close=event.target.closest?.('[data-explore-close]');
    if(close){event.preventDefault();state.exploreGroup='';state.exploreRegion='';state.exploreExerciseId='';render();return;}
    const zoom=event.target.closest?.('[data-explore-zoom]');
    if(zoom){event.preventDefault();state.exploreZoom=zoom.dataset.exploreZoom==='reset'?1:Math.max(1,Math.min(2.2,Number((state.exploreZoom+(zoom.dataset.exploreZoom==='in'?0.2:-0.2)).toFixed(2))));render();return;}
    const side=event.target.closest?.('[data-explore-side]');
    if(side){event.preventDefault();state.exploreSide=side.dataset.exploreSide;state.exploreGroup='';state.exploreRegion='';state.exploreExerciseId='';render();return;}
    const region=event.target.closest?.('[data-explore-region]');
    if(region){event.preventDefault();state.exploreRegion=region.dataset.exploreRegion;state.exploreExerciseId='';render();return;}
    const equipment=event.target.closest?.('[data-explore-equipment]');
    if(equipment){event.preventDefault();state.exploreEquipment=equipment.dataset.exploreEquipment;state.exploreExerciseId='';render();return;}
    const exercise=event.target.closest?.('[data-explore-exercise]');
    if(exercise){event.preventDefault();state.exploreExerciseId=state.exploreExerciseId===exercise.dataset.exploreExercise?'':exercise.dataset.exploreExercise;render();return;}
    const addToday=event.target.closest?.('[data-explore-today]');
    if(addToday){event.preventDefault();addPlan(addToday.dataset.exploreToday,today());return;}
    const plan=event.target.closest?.('[data-explore-plan]');
    if(plan){event.preventDefault();addPlan(plan.dataset.explorePlan,state.explorePlanDate||today());return;}
  },true);

  document.addEventListener('change',event=>{
    const date=event.target.closest?.('[data-explore-plan-date]');
    if(date){state.explorePlanDate=date.value||today();}
  },true);

  document.addEventListener('keydown',event=>{
    const group=event.target.closest?.('[data-explore-group]');
    if(group&&(event.key==='Enter'||event.key===' ')){event.preventDefault();group.dispatchEvent(new MouseEvent('click',{bubbles:true}));}
  });

  if(typeof render==='function')render();

  globalThis.LastSetExplore={version:VERSION,exploreScreen,filterExploreExercises,addExerciseToPlan};
})();
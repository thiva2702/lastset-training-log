(() => {
  'use strict';

  const VERSION='0.14.1';
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
    const plan=db.plans[date]||(db.plans[date]={templateId:null,name:'Planned workout',exerciseIds:[],createdAt:now,source:'explore'});
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
  }

  function hotspot(group,label,shape){
    const active=state.exploreGroup===group?' active':'';
    return '<g class="ls-muscle-hit'+active+'" data-explore-group="'+group+'" role="button" tabindex="0" aria-label="'+esc(label||group)+'">'+shape+'</g>';
  }

  function anatomySvg(side,gender){
    const female=gender==='female';
    const torso=female
      ?'<path class="ls-body-base" d="M91 74Q120 59 149 74L157 153Q146 179 151 217Q120 235 89 217Q94 179 83 153Z"/>'
      :'<path class="ls-body-base" d="M82 74Q120 55 158 74L166 164Q153 194 143 222H97Q87 194 74 164Z"/>';
    const arms=female
      ?'<rect class="ls-body-base" x="62" y="82" width="22" height="142" rx="11"/><rect class="ls-body-base" x="156" y="82" width="22" height="142" rx="11"/>'
      :'<rect class="ls-body-base" x="54" y="80" width="27" height="149" rx="13"/><rect class="ls-body-base" x="159" y="80" width="27" height="149" rx="13"/>';
    const legs=female
      ?'<path class="ls-body-base" d="M92 211h26l-5 172H80l7-118Z"/><path class="ls-body-base" d="M122 211h26l5 54 7 118h-33Z"/>'
      :'<path class="ls-body-base" d="M91 214h27l-4 169H78l8-119Z"/><path class="ls-body-base" d="M122 214h27l5 50 8 119h-36Z"/>';
    const head='<circle class="ls-body-base" cx="120" cy="39" r="24"/><rect class="ls-body-base" x="111" y="59" width="18" height="22" rx="7"/>';
    let hits='';
    if(side==='front'){
      hits+=hotspot('Shoulders','Shoulders','<ellipse cx="79" cy="92" rx="22" ry="18"/><ellipse cx="161" cy="92" rx="22" ry="18"/>');
      hits+=hotspot('Chest','Chest','<path d="M91 98Q120 88 149 98L145 144Q120 153 95 144Z"/>');
      hits+=hotspot('Arms','Arms','<rect x="58" y="106" width="20" height="88" rx="10"/><rect x="162" y="106" width="20" height="88" rx="10"/>');
      hits+=hotspot('Core','Core','<rect x="99" y="149" width="42" height="68" rx="16"/>');
      hits+=hotspot('Legs','Legs','<path d="M89 225h27l-6 94H83Z"/><path d="M124 225h27l7 94h-28Z"/>');
    }else{
      hits+=hotspot('Shoulders','Rear shoulders','<ellipse cx="79" cy="92" rx="22" ry="18"/><ellipse cx="161" cy="92" rx="22" ry="18"/>');
      hits+=hotspot('Back','Back','<path d="M91 96Q120 84 149 96L151 174Q137 198 120 204Q103 198 89 174Z"/>');
      hits+=hotspot('Arms','Triceps and arms','<rect x="58" y="106" width="20" height="88" rx="10"/><rect x="162" y="106" width="20" height="88" rx="10"/>');
      hits+=hotspot('Legs','Glutes and legs','<ellipse cx="105" cy="220" rx="22" ry="18"/><ellipse cx="135" cy="220" rx="22" ry="18"/><path d="M89 242h27l-6 76H83Z"/><path d="M124 242h27l7 76h-28Z"/><path d="M83 321h27l-3 60H79Z"/><path d="M130 321h27l4 60h-31Z"/>');
    }
    return '<svg class="ls-anatomy '+gender+'" viewBox="0 0 240 410" aria-label="'+(gender==='female'?'Female':'Male')+' anatomy, '+side+' view">'+head+torso+arms+legs+hits+'</svg>';
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
        '<div class="ls-anatomy-head"><div><strong>'+(gender==='female'?'Female':'Male')+' anatomy</strong><span>Based on this user profile · male is the default</span></div><div class="ls-side-toggle"><button class="'+(state.exploreSide==='front'?'active':'')+'" data-explore-side="front">Front</button><button class="'+(state.exploreSide==='back'?'active':'')+'" data-explore-side="back">Back</button></div></div>'+
        '<div class="ls-anatomy-stage">'+anatomySvg(state.exploreSide,gender)+'</div>'+
        '<div class="ls-anatomy-hint">'+(state.exploreGroup?'Selected: <strong>'+esc(state.exploreGroup)+'</strong>':'Tap a highlighted muscle area')+'</div>'+
      '</section>'+
      (group?'<section class="card ls-explore-step"><div class="ls-step-no">1</div><div class="ls-step-copy"><strong>Choose your focus</strong><span>'+esc(state.exploreGroup)+'</span></div><div class="ls-chip-grid">'+regions.map(r=>'<button class="ls-explore-chip '+(state.exploreRegion===r?'active':'')+'" data-explore-region="'+esc(r)+'">'+esc(r)+'</button>').join('')+'</div></section>':'')+
      (state.exploreRegion?'<section class="card ls-explore-step"><div class="ls-step-no">2</div><div class="ls-step-copy"><strong>Choose equipment</strong><span>'+esc(state.exploreRegion)+'</span></div><div class="ls-equipment-grid">'+EQUIPMENT.map(x=>'<button class="ls-explore-chip '+(state.exploreEquipment===x.id?'active':'')+'" data-explore-equipment="'+x.id+'">'+esc(x.label)+'</button>').join('')+'</div></section>':'')+
      (state.exploreRegion?'<section class="ls-explore-results"><div class="ls-result-head"><div><strong>'+results.length+' exercise'+(results.length===1?'':'s')+'</strong><span>'+esc(state.exploreRegion)+' · '+esc(EQUIPMENT.find(x=>x.id===state.exploreEquipment)?.label||'All')+'</span></div></div>'+
        (results.length?results.map(exerciseCard).join(''):'<div class="card empty">No exercises match this combination yet. Try another equipment type.</div>')+
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
      state.exploreRegion='';
      state.exploreExerciseId='';
      if(GROUPS[name]?.side)state.exploreSide=GROUPS[name].side;
      render();return;
    }
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
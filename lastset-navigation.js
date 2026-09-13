(() => {
  'use strict';

  const VERSION='0.13.1';
  const navStack=[];
  const TOP_LEVEL_VIEWS=new Set(['calendar','progress','profile']);

  function cloneState(){
    try{
      const snap=JSON.parse(JSON.stringify(state));
      if(state.month instanceof Date) snap.month=state.month.toISOString();
      return snap;
    }catch(_){
      return {
        view:state.view,
        tab:state.tab,
        selectedDate:state.selectedDate,
        month:state.month instanceof Date?state.month.toISOString():state.month
      };
    }
  }

  function restoreState(snap){
    if(!snap) return false;
    Object.keys(state).forEach(key=>{ if(!(key in snap)) delete state[key]; });
    Object.assign(state,JSON.parse(JSON.stringify(snap)));
    if(snap.month) state.month=new Date(snap.month);
    return true;
  }

  function isTodayTopLevel(){
    return state.view==='day' && state.tab==='today' && navStack.length===0;
  }

  function isTopLevel(){
    return TOP_LEVEL_VIEWS.has(state.view) || isTodayTopLevel();
  }

  function hasBack(){
    return navStack.length>0 && !isTopLevel();
  }

  function pushCurrent(){
    const snap=cloneState();
    const last=navStack[navStack.length-1];
    if(last && last.view===snap.view && last.tab===snap.tab && last.selectedDate===snap.selectedDate) return;
    navStack.push(snap);
    if(navStack.length>30) navStack.shift();
  }

  function clearHistory(){ navStack.length=0; }

  function collapseToCurrent(){
    const currentView=state.view;
    const currentDate=state.selectedDate;
    for(let i=navStack.length-1;i>=0;i--){
      const snap=navStack[i];
      if(snap.view===currentView && (currentView!=='day' || snap.selectedDate===currentDate)){
        navStack.splice(i);
        return;
      }
    }
    if(isTopLevel()) clearHistory();
  }

  function goBack(){
    const snap=navStack.pop();
    if(!snap) return false;
    restoreState(snap);
    render();
    return true;
  }

  function topbarHtml(){
    const showBack=hasBack();
    return `<header class="topbar"><div class="topbar-inner">
      <div style="display:flex;align-items:center;gap:10px">${showBack?`<button class="icon-btn" data-action="back" aria-label="Back" title="Back">‹</button>`:''}<div class="brand"><strong>LastSet</strong><span>Remember today. Build tomorrow.</span></div></div>
      <button class="icon-btn" data-action="today">⌾</button>
    </div></header>`;
  }

  if(typeof topbar==='function') topbar=topbarHtml;

  const OPENERS=[
    '[data-date]',
    '[data-exercise]',
    '[data-plan-exercise]',
    '[data-add-exercise]',
    '[data-edit-exercise]',
    '[data-cardio]',
    '[data-edit-cardio]',
    '[data-open-saved-workouts]',
    '[data-action="open-templates"]',
    '[data-action="finish-workout"]'
  ];

  const COLLAPSE_ACTIONS=new Set([
    'save-exercise','save-next','save-cardio','confirm-ai-workout','assessment-done'
  ]);

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target.closest('button,[data-date],[data-exercise],[data-plan-exercise],[data-cardio],[data-day-action],[data-add-exercise],[data-edit-exercise],[data-edit-cardio],[data-open-saved-workouts],[data-template-start]'):null;
    if(!target) return;

    if(target.matches('[data-action="back"]')){
      event.preventDefault();
      event.stopImmediatePropagation();
      goBack();
      return;
    }

    if(target.matches('[data-nav]') || target.matches('[data-action="profile-top"]')){
      clearHistory();
      return;
    }

    if(target.matches('[data-template-start]')){
      setTimeout(()=>{ collapseToCurrent(); render(); },0);
      return;
    }

    const action=target.getAttribute('data-action')||'';
    if(COLLAPSE_ACTIONS.has(action)){
      setTimeout(()=>{ collapseToCurrent(); render(); },0);
      return;
    }

    const dayAction=target.getAttribute('data-day-action')||'';
    if(dayAction && dayAction!=='rest'){
      pushCurrent();
      return;
    }

    if(OPENERS.some(selector=>target.matches(selector))){
      pushCurrent();
    }
  },true);

  const previousRender=typeof render==='function'?render:null;
  if(previousRender){
    render=function(){
      previousRender();
      const back=document.querySelector('[data-action="back"]');
      if(back){
        back.setAttribute('aria-label','Back');
        back.setAttribute('title','Back');
      }
      document.documentElement.dataset.lastsetNavigation=VERSION;
    };
    render();
  }

  globalThis.LastSetNavigation={
    version:VERSION,
    clearHistory,
    pushCurrent,
    goBack,
    hasBack,
    _test:{cloneState,restoreState,collapseToCurrent,isTopLevel,stack:navStack}
  };
})();

(() => {
  'use strict';

  const SUBLINES={
    'Show up today.':'Progress lives in consistency.',
    'Small steps. Big results.':'Every good session counts.',
    'Stronger than yesterday.':'Build on what you did before.',
    'Progress over perfection.':'Momentum matters more than flawless days.',
    'One workout at a time.':'Win the session in front of you.',
    'Earn your tomorrow.':'Today is where progress starts.',
    'Consistency builds strength.':'Keep stacking solid days.',
    'Keep moving forward.':'A little better still counts.',
    'Discipline beats motivation.':'Train even when the mood is missing.',
    'You came this far. Keep going.':'Do not waste the work already done.'
  };

  const userIcon=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 19c.7-4.1 3.1-6.1 6.5-6.1s5.8 2 6.5 6.1"/></svg>`;
  const backIcon=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg>`;
  const icons={
    barbell:`<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M13 24h22"/><path d="M9 17v14M13 15v18M35 15v18M39 17v14"/></svg>`,
    dumbbell:`<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M15 24h18"/><path d="M9 18v12M13 16v16M35 16v16M39 18v12"/></svg>`,
    machine:`<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 39V9h24v30M11 15h24M17 39V26h12v13M21 20h4"/></svg>`,
    bodyweight:`<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="24" cy="10" r="4"/><path d="M24 14v12M13 20l11 4 11-4M17 39l7-13 7 13"/></svg>`,
    cable:`<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M11 39V9h26v30M11 14h26M24 14v10M20 24h8M18 39l6-15 6 15"/></svg>`,
    cardio:`<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="28" cy="9" r="4"/><path d="M24 16l-5 9 7 4 4 10M20 23l-7 5M26 29l8-6"/></svg>`
  };

  function iconForExercise(e){
    const eq=String(e?.equipment||'').toLowerCase();
    if(e?.loadType==='bodyweight'||e?.loadType==='assisted') return icons.bodyweight;
    if(eq.includes('dumbbell')) return icons.dumbbell;
    if(eq.includes('barbell')) return icons.barbell;
    if(eq.includes('cable')) return icons.cable;
    if(eq.includes('machine')||eq.includes('plate')) return icons.machine;
    return icons.barbell;
  }

  function decorateChrome(){
    document.querySelectorAll('.icon-btn').forEach(btn=>{
      if(btn.dataset.action==='back') btn.innerHTML=backIcon;
      else if(btn.dataset.action==='today') btn.innerHTML=userIcon;
    });
    const brand=document.querySelector('.brand strong');
    if(brand) brand.innerHTML='Last<span class="brand-set">Set</span>';
  }

  function decorateDay(){
    if(typeof state==='undefined'||state.view!=='day') return;
    const main=document.querySelector('main.container');
    if(!main) return;
    main.classList.add('ls-day-screen');
    const hero=main.querySelector('.ls-hero');
    if(hero){
      const motto=hero.querySelector('.ls-motto');
      const sub=hero.querySelector('.ls-motto-sub');
      if(motto&&sub&&SUBLINES[motto.textContent.trim()]) sub.textContent=SUBLINES[motto.textContent.trim()];
      if(!hero.querySelector('.ls-hero-art')){
        const art=document.createElement('div'); art.className='ls-hero-art'; hero.appendChild(art);
      }
    }

    const actionList=main.querySelector('.action-list');
    if(actionList) actionList.classList.add('ls-action-grid');

    main.querySelectorAll('.section-title').forEach(el=>{
      if(el.textContent.trim()==='Sessions') el.textContent="Today's Sessions";
    });

    main.querySelectorAll('.quick-workout').forEach(card=>{
      const strong=card.querySelector('strong');
      if(!strong) return;
      if(/repeat last resistance workout/i.test(strong.textContent)){
        card.classList.add('ls-repeat-card');
        if(!card.querySelector('.ls-repeat-label')){
          const label=document.createElement('span');
          label.className='ls-repeat-label'; label.textContent='Repeat last workout';
          strong.parentElement?.insertBefore(label,strong);
          strong.textContent='Previous resistance session';
        }
        const btn=card.querySelector('.primary'); if(btn) btn.textContent='Copy workout to today  →';
      }
    });
  }

  function decorateExerciseRows(){
    if(typeof state==='undefined'||state.view!=='exercise-list') return;
    const main=document.querySelector('main.container'); if(!main) return;
    main.querySelectorAll('.exercise-row[data-exercise]').forEach(row=>{
      if(row.querySelector('.ls-ex-thumb')) return;
      const e=typeof EXERCISES!=='undefined'?EXERCISES.find(x=>x.id===row.dataset.exercise):null;
      const first=row.firstElementChild;
      if(!first) return;
      const wrap=document.createElement('span'); wrap.className='ls-row-main';
      const thumb=document.createElement('span'); thumb.className='ls-ex-thumb'; thumb.innerHTML=iconForExercise(e);
      first.parentNode.insertBefore(wrap,first); wrap.appendChild(thumb); wrap.appendChild(first);
    });
  }

  function decorateCalendar(){
    if(typeof state==='undefined'||state.view!=='calendar') return;
    const main=document.querySelector('main.container');
    if(main) main.classList.add('ls-calendar-screen');
  }

  function decorateNav(){
    const labels=[...document.querySelectorAll('.nav-btn')];
    labels.forEach(btn=>{
      const txt=btn.textContent.trim();
      if(txt.includes('Today')) btn.title='Home';
    });
  }

  function decorate(){
    decorateChrome(); decorateDay(); decorateExerciseRows(); decorateCalendar(); decorateNav();
    document.documentElement.dataset.lastsetPremium='v0121';
  }

  if(typeof render==='function'){
    const previous=render;
    render=function(){ previous(); decorate(); };
    render();
  } else document.addEventListener('DOMContentLoaded',decorate,{once:true});
})();

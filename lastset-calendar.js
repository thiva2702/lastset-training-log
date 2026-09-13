(() => {
  'use strict';

  function parseLocalDate(iso){
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||''));
    if(!m) return null;
    return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12,0,0,0);
  }

  function monthPrefix(){
    if(typeof state==='undefined' || !(state.month instanceof Date)) return '';
    return `${state.month.getFullYear()}-${String(state.month.getMonth()+1).padStart(2,'0')}`;
  }

  function monthTrainingEntries(){
    const prefix=monthPrefix();
    if(!prefix || typeof data==='undefined') return [];
    return Object.entries(data.sessions||{})
      .filter(([date,sessions])=>date.startsWith(prefix) && Array.isArray(sessions) && sessions.some(s=>s?.type!=='rest'))
      .sort((a,b)=>a[0].localeCompare(b[0]));
  }

  function calendarMetrics(){
    const entries=monthTrainingEntries();
    const sessions=entries.flatMap(([,items])=>items||[]);
    const resistance=sessions.filter(s=>s?.type==='resistance').length;
    const cardio=sessions.filter(s=>s?.type==='cardio').length;
    const weeks=new Set(entries.map(([date])=>{
      const d=parseLocalDate(date);
      if(!d) return '';
      const first=new Date(d.getFullYear(),d.getMonth(),1);
      return Math.floor((d.getDate()+first.getDay()-1)/7)+1;
    }).filter(Boolean)).size;
    return {entries,days:entries.length,resistance,cardio,weeks};
  }

  function plural(n,one,many){ return Number(n)===1?one:many; }

  function latestSummary(entries){
    if(!entries.length) return null;
    const [date,sessions]=entries[entries.length-1];
    const resistance=(sessions||[]).find(s=>s?.type==='resistance');
    const cardio=(sessions||[]).find(s=>s?.type==='cardio');
    const d=parseLocalDate(date);
    const dateText=d?d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}):date;

    if(resistance){
      const names=(resistance.exercises||[]).map(x=>x?.name).filter(Boolean);
      const detail=names.length?names.slice(0,2).join(' · '):'Resistance session';
      return {date,dateText,title:'Last resistance session',detail};
    }
    if(cardio){
      return {date,dateText,title:'Last cardio session',detail:cardio.activity||'Cardio training'};
    }
    return {date,dateText,title:'Last training day',detail:'Training logged'};
  }

  function makeHero(metrics){
    const hero=document.createElement('section');
    hero.className='ls-calendar-hero';
    hero.innerHTML=`<div class="ls-calendar-hero-copy"><div class="ls-calendar-kicker">Monthly rhythm</div><h2>Consistency compounds.</h2><p>${metrics.days} ${plural(metrics.days,'training day','training days')} · ${metrics.resistance} resistance · ${metrics.cardio} cardio</p></div>`;
    return hero;
  }

  function decorateStats(card,metrics){
    const stats=card.querySelector('.stats');
    if(!stats) return;
    stats.classList.add('ls-calendar-stats');
    const current=[...stats.querySelectorAll('.stat')];
    const kinds=['training','resistance','cardio'];
    current.forEach((stat,i)=>{ if(kinds[i]) stat.dataset.kind=kinds[i]; });

    let weeks=stats.querySelector('[data-kind="weeks"]');
    if(!weeks){
      weeks=document.createElement('div');
      weeks.className='stat';
      weeks.dataset.kind='weeks';
      stats.appendChild(weeks);
    }
    weeks.innerHTML=`<strong>${metrics.weeks}</strong><span>Active ${plural(metrics.weeks,'week','weeks')}</span>`;
  }

  function decorateInsight(card,metrics){
    let insight=card.querySelector('.ls-calendar-insight');
    if(insight) insight.remove();
    insight=document.createElement('div');
    insight.className='ls-calendar-insight';
    const latest=latestSummary(metrics.entries);

    if(!latest){
      insight.innerHTML=`<div class="ls-calendar-insight-mark">+</div><div class="ls-calendar-insight-copy"><div class="ls-calendar-insight-label">This month</div><strong>Your first session starts the story.</strong><span>Log a workout and LastSet will build your monthly rhythm here.</span></div>`;
    }else{
      insight.innerHTML=`<div class="ls-calendar-insight-mark">✓</div><div class="ls-calendar-insight-copy"><div class="ls-calendar-insight-label">Latest training</div><strong>${latest.dateText} · ${latest.title}</strong><span>${latest.detail}</span></div><button type="button" data-open-calendar-latest="${latest.date}">Open</button>`;
      const btn=insight.querySelector('[data-open-calendar-latest]');
      if(btn) btn.onclick=()=>{
        state.selectedDate=btn.dataset.openCalendarLatest;
        state.tab='calendar';
        state.view='day';
        render();
      };
    }
    card.appendChild(insight);
  }

  function decorateCalendarExperience(){
    if(typeof state==='undefined' || state.view!=='calendar') return;
    const main=document.querySelector('main.container');
    if(!main) return;
    main.classList.add('ls-calendar-screen');
    const card=main.querySelector('.card.pad');
    if(!card) return;
    card.classList.add('ls-calendar-card');

    const metrics=calendarMetrics();
    let hero=main.querySelector(':scope > .ls-calendar-hero');
    if(!hero){
      hero=makeHero(metrics);
      main.insertBefore(hero,card);
    }else{
      const p=hero.querySelector('p');
      if(p) p.textContent=`${metrics.days} ${plural(metrics.days,'training day','training days')} · ${metrics.resistance} resistance · ${metrics.cardio} cardio`;
    }

    decorateStats(card,metrics);
    decorateInsight(card,metrics);
    document.documentElement.dataset.lastsetCalendar='v0125';
  }

  if(typeof render==='function'){
    const previousRender=render;
    render=function(){
      previousRender();
      decorateCalendarExperience();
    };
    render();
  }else{
    document.addEventListener('DOMContentLoaded',decorateCalendarExperience,{once:true});
  }
})();

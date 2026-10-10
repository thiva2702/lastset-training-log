/* LastSet Mobility & Recovery: duration-based activity logging, no data migration. */
(() => {
  'use strict';
  if (globalThis.LastSetMobility) return;
  const VERSION = '0.30.0';
  const ACTIVITIES = [
    {name:'Yoga', icon:'🧘', hint:'Hatha, Vinyasa, Yin, Power or General Yoga'},
    {name:'Pilates', icon:'🤸', hint:'Mat, Reformer or general Pilates'},
    {name:'Stretching', icon:'🙆', hint:'A guided or independent stretching session'},
    {name:'Mobility Drills', icon:'🔄', hint:'Joint mobility and controlled movement'},
    {name:'Foam Rolling', icon:'🌀', hint:'Self-massage and recovery work'}
  ];
  const YOGA_STYLES=['General Yoga','Hatha','Vinyasa','Yin','Power','Restorative','Other'];
  const PILATES_STYLES=['General Pilates','Mat','Reformer','Other'];
  const INTENSITIES=['Gentle','Moderate','Intense'];
  const allowed=new Set(ACTIVITIES.map(a=>a.name));
  let editingId=null;
  let draft={};
  const older={
    screen,dayAction,bindEvents,sessionCard,calendarScreen,progressScreen,
    parseSmartWorkout,aiActivityHtml,getSmartMissing,handleSmartConversationReply,
    saveSmartLogWorkout
  };

  function clampMinutes(v) {
    const n=Number(v);
    return Number.isFinite(n)&&n>0&&n<=720?n:0;
  }
  function parseDuration(value){
    const s=String(value||'');
    const matches=[...s.matchAll(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|h|minutes?|mins?|min)\b/gi)];
    if(matches.length){
      let total=0;
      for(const m of matches)total+=Number(m[1])*(/^h/i.test(m[2])?60:1);
      return clampMinutes(Math.round(total));
    }
    return 0;
  }
  function identifyActivity(text){
    const s=String(text||'').toLowerCase();
    if(/\b(?:yoga|yogi|vinyasa|hatha|yin yoga|power yoga|restorative yoga)\b/.test(s))return 'Yoga';
    if(/\bpilates\b/.test(s))return 'Pilates';
    if(/\b(?:foam roll(?:ing|er)?|self myofascial release)\b/.test(s))return 'Foam Rolling';
    if(/\b(?:mobility|joint mobility|mobility drills?)\b/.test(s))return 'Mobility Drills';
    if(/\b(?:stretching|stretches|stretch routine)\b/.test(s))return 'Stretching';
    return '';
  }
  function extractStyle(text,activity){
    const s=String(text||'').toLowerCase();
    if(activity==='Yoga'){
      if(/\bvinyasa\b/.test(s))return 'Vinyasa';
      if(/\bhatha\b/.test(s))return 'Hatha';
      if(/\byin yoga\b/.test(s))return 'Yin';
      if(/\bpower yoga\b/.test(s))return 'Power';
      if(/\brestorative\b/.test(s))return 'Restorative';
      return 'General Yoga';
    }
    if(activity==='Pilates'){
      if(/\breformer\b/.test(s))return 'Reformer';
      if(/\bmat pilates\b/.test(s))return 'Mat';
      return 'General Pilates';
    }
    return '';
  }
  function extractIntensity(text){
    const s=String(text||'').toLowerCase();
    if(/\b(?:intense|high.intensity|challenging|hard|vigorous)\b/.test(s))return 'Intense';
    if(/\b(?:moderate|medium|medium.intensity)\b/.test(s))return 'Moderate';
    return 'Gentle';
  }
  function detectMobility(text){
    const activity=identifyActivity(text);
    if(!activity)return null;
    return {kind:'mobility',name:activity,style:extractStyle(text,activity),durationMinutes:parseDuration(text),intensity:extractIntensity(text)};
  }
  function choices(list,value){
    return list.map(x=>'<option value="'+escapeHtml(x)+'"'+(x===value?' selected':'')+'>'+escapeHtml(x)+'</option>').join('');
  }
  function activityIcon(name){
    return ACTIVITIES.find(a=>a.name===name)?.icon||'🧘';
  }
  function mobilityListScreen(){
    return '<main class="container ls-mobility"><div class="section-title">Mobility &amp; Recovery</div>'+
      '<p class="muted ls-mobility-intro">Choose an activity, then log its duration. No sets or equipment needed.</p>'+
      '<div class="exercise-list">'+ACTIVITIES.map(a=>'<button class="exercise-row ls-mobility-choice" data-mobility-activity="'+escapeHtml(a.name)+'">'+
       '<span><strong>'+a.icon+' '+escapeHtml(a.name)+'</strong><small>'+escapeHtml(a.hint)+'</small></span><span>›</span></button>').join('')+'</div></main>';
  }
  function mobilityLogScreen(){
    const name=allowed.has(draft.activity)?draft.activity:'Yoga';
    const styles=name==='Yoga'?YOGA_STYLES:name==='Pilates'?PILATES_STYLES:null;
    const styleValue=styles?.includes(draft.style)?draft.style:styles?.[0];
    const duration=clampMinutes(draft.duration)||'';
    return '<main class="container ls-mobility"><div class="card pad">'+
      (editingId?'<div class="editing-pill">Editing saved mobility session</div>':'')+
      '<h2 class="ls-mobility-heading">'+activityIcon(name)+' '+escapeHtml(name)+'</h2>'+
      (styles?'<div class="field"><label for="mobility-style">'+(name==='Yoga'?'Yoga style':'Pilates type')+'</label><select id="mobility-style">'+choices(styles,styleValue)+'</select></div>':'')+
      '<div class="field"><label for="mobility-duration">Duration (minutes) *</label><input id="mobility-duration" type="number" inputmode="numeric" min="1" max="720" required placeholder="45" value="'+duration+'"></div>'+
      '<div class="field"><label for="mobility-intensity">Session intensity</label><select id="mobility-intensity">'+choices(INTENSITIES,INTENSITIES.includes(draft.intensity)?draft.intensity:'Gentle')+'</select></div>'+
      '<div class="field"><label for="mobility-notes">Notes (optional)</label><textarea id="mobility-notes" placeholder="How did you feel?">'+escapeHtml(draft.notes||'')+'</textarea></div>'+
      '<button class="primary" data-action="save-mobility">'+(editingId?'Save Changes':'Save '+escapeHtml(name))+'</button>'+
      '</div></main>';
  }
  function openNew(name){
    if(!allowed.has(name))return;
    editingId=null;
    draft={activity:name,style:name==='Yoga'?'General Yoga':name==='Pilates'?'General Pilates':'',intensity:'Gentle',duration:'',notes:''};
    state.view='mobility-log';
    render();
  }
  function openSaved(id){
    const s=sessionsFor(state.selectedDate).find(x=>x.type==='mobility'&&x.id===id);
    if(!s||!allowed.has(s.activity))return;
    editingId=id;draft={...s};state.view='mobility-log';render();
  }
  function back(){
    if(state.view==='mobility-log'){
      if(!editingId){state.view='mobility-list';}
      else {state.view='day';editingId=null;}
      draft={};render();return;
    }
    editingId=null;draft={};state.view='day';render();
  }
  function saveMobility(){
    const duration=clampMinutes(document.getElementById('mobility-duration')?.value);
    if(!duration){showToast('Enter a duration between 1 and 720 minutes');return;}
    const name=draft.activity;
    if(!allowed.has(name))return;
    const style=String(document.getElementById('mobility-style')?.value||'');
    const intensity=String(document.getElementById('mobility-intensity')?.value||'Gentle');
    const notes=String(document.getElementById('mobility-notes')?.value||'').trim().slice(0,2000);
    const values={activity:name,style,intensity:INTENSITIES.includes(intensity)?intensity:'Gentle',duration,notes};
    if(editingId){
      const s=sessionsFor(state.selectedDate).find(x=>x.type==='mobility'&&x.id===editingId);
      if(!s)return;
      Object.assign(s,values);saveData(data);
    }else{
      removeRestSessions(state.selectedDate);
      addSession(state.selectedDate,{id:cryptoId(),type:'mobility',...values,createdAt:Date.now()});
    }
    globalThis.LastSetDiagnostics?.note('Mobility session saved: '+name);
    editingId=null;draft={};state.view='day';showToast('Mobility session saved');
  }
  function mobilityCard(s){
    const bits=[s.style,s.duration?Number(s.duration)+' min':'',s.intensity].filter(Boolean);
    return '<div class="card session-card ls-mobility-session">'+
      '<div class="session-head"><strong>'+activityIcon(s.activity)+' '+escapeHtml(s.activity||'Mobility')+'</strong>'+
      '<div class="session-head-actions"><span class="session-tag">Mobility</span>'+
      '<button class="mini-btn" data-edit-mobility="'+escapeHtml(s.id)+'">Edit</button>'+
      '<button class="mini-btn danger" data-delete-session="'+escapeHtml(s.id)+'">Delete</button></div></div>'+
      '<div class="exercise-line"><div>'+escapeHtml(bits.join(' · '))+'</div>'+
      (s.notes?'<div class="ls-mobility-notes">'+escapeHtml(s.notes)+'</div>':'')+'</div></div>';
  }
  function monthMobility(){
    const month=state.month,y=month.getFullYear(),m=String(month.getMonth()+1).padStart(2,'0');
    return Object.entries(data.sessions||{}).filter(([k])=>k.startsWith(y+'-'+m)).flatMap(([,ss])=>ss.filter(s=>s.type==='mobility'));
  }
  function historyMobility(){
    return Object.entries(data.sessions||{}).flatMap(([date,ss])=>
      ss.filter(s=>s.type==='mobility').map(s=>({...s,date})));
  }
  function resetSmart(){
    state.aiParsed=null;state.aiDraft='';state.aiError='';state.aiSource='';
    state.aiCorrection='';state.smartConversation=[];state.aiLoading=false;state.view='day';
  }
  // Do not modify any existing session or localStorage key.
  dayAction=function(actionName){
    if(actionName==='mobility'){editingId=null;draft={};state.view='mobility-list';render();return;}
    if(actionName==='scan'){showToast('Machine Scan is coming later');return;}
    return older.dayAction(actionName);
  };
  screen=function(){
    if(state.view==='mobility-list')return mobilityListScreen();
    if(state.view==='mobility-log')return mobilityLogScreen();
    // Feature flag: retained prototype code, but no accessible Machine Scan entry point.
    if(state.view==='scan'){state.view='day';return dayScreen();}
    return older.screen();
  };
  bindEvents=function(){
    older.bindEvents();
    document.querySelectorAll('[data-mobility-activity]').forEach(b=>b.onclick=()=>openNew(b.dataset.mobilityActivity));
    document.querySelectorAll('[data-edit-mobility]').forEach(b=>b.onclick=()=>openSaved(b.dataset.editMobility));
    const save=document.querySelector('[data-action="save-mobility"]');
    if(save)save.onclick=saveMobility;
    if(state.view==='mobility-list'||state.view==='mobility-log'){
      const b=document.querySelector('[data-action="back"]');
      if(b)b.onclick=back;
    }
  };
  sessionCard=function(s){return s?.type==='mobility'?mobilityCard(s):older.sessionCard(s);};
  calendarScreen=function(){
    const base=older.calendarScreen();
    const total=monthMobility().length;
    return base.replace('<div class="stats">','<div class="stats ls-stats-four">')
      .replace('Cardio</span></div></div>','Cardio</span></div>'+
        '<div class="stat ls-mobility-stat"><strong>'+total+'</strong><span>Mobility</span></div></div>');
  };
  progressScreen=function(){
    const base=older.progressScreen();
    const sessions=historyMobility();
    const total=sessions.reduce((n,s)=>n+(Number(s.duration)||0),0);
    const summary='<div class="card pad ls-mobility-progress-card">'+
      '<strong>🧘 Mobility &amp; Recovery</strong><div class="ls-mobility-progress-numbers">'+
      '<span><b>'+sessions.length+'</b> sessions</span><span><b>'+total+'</b> minutes</span></div>'+
      (sessions.length?'<div class="muted ls-mobility-recent">Latest: '+escapeHtml(sessions.sort((a,b)=>b.date.localeCompare(a.date))[0].activity)+' · '+escapeHtml(sessions[0].date)+'</div>':'<div class="muted ls-mobility-recent">Yoga, Pilates, stretching and recovery sessions will appear here.</div>')+
      '</div>';
    // The v0.14 Progress page no longer begins with a plain .card; inject
    // at the actual <main> boundary instead of targeting the legacy layout.
    return base.replace(/<main\b[^>]*>/i,tag=>tag+summary);
  };
  parseSmartWorkout=function(text){
    const mobility=detectMobility(text);
    if(!mobility)return older.parseSmartWorkout(text);
    // A mobility-only sentence must never be interpreted as a strength exercise or cardio.
    const other=/\b(?:run(?:ning)?|walk(?:ing)?|cycl(?:ing|e)|swim(?:ming)?|row(?:ing)?|treadmill|bench press|bicep curls?|chest press|squats?|deadlift|push.?ups?)\b/i.test(text);
    if(!other){
      return {summary:'Likely '+mobility.name,confidence:.96,needsConfirmation:true,items:[mobility]};
    }
    const result=older.parseSmartWorkout(text);
    const items=(result?.items||[]).filter(it=>it.kind==='cardio'||(it.kind==='resistance'&&Boolean(it.exerciseId)));
    items.push(mobility);
    return {...result,summary:'I found '+items.length+' activities',items,needsConfirmation:true};
  };
  aiActivityHtml=function(it,index){
    if(it.kind!=='mobility')return older.aiActivityHtml(it,index);
    const bits=[it.style,it.durationMinutes?it.durationMinutes+' min':'Duration not provided',it.intensity].filter(Boolean);
    return '<div class="ai-activity ls-mobility-preview"><div class="ai-activity-head"><div><strong>'+
      activityIcon(it.name)+' '+escapeHtml(it.name)+'</strong><small>'+
      escapeHtml(bits.join(' · '))+'</small></div><span class="session-tag">Mobility</span></div></div>';
  };
  getSmartMissing=function(p){
    // Keep the existing resistance/cardio checks for mixed Smart Logs.
    const old=older.getSmartMissing(p);
    if(old)return old;
    const i=(p?.items||[]).findIndex(it=>it.kind==='mobility'&&!clampMinutes(it.durationMinutes));
    return i<0?null:{type:'mobility-duration',itemIndex:i,question:'How long was your mobility session?',
      helper:'Duration in minutes or hours is enough. No sets or reps required.',
      placeholder:'Example: 45 minutes'};
  };
  handleSmartConversationReply=function(){
    const missing=getSmartMissing(state.aiParsed);
    if(missing?.type!=='mobility-duration')return older.handleSmartConversationReply();
    const reply=(document.getElementById('ai-correction')?.value||'').trim();
    const duration=parseDuration(reply);
    if(!duration){showToast('Reply with a duration, e.g. 45 minutes');return;}
    state.aiParsed.items[missing.itemIndex].durationMinutes=duration;
    state.smartConversation.push({name:profileName(),answer:reply});
    state.aiCorrection='';render();
  };
  saveSmartLogWorkout=function(){
    const entries=state.aiParsed?.items||[];
    const mobility=entries.filter(it=>it.kind==='mobility');
    if(!mobility.length)return older.saveSmartLogWorkout();
    if(getSmartMissing(state.aiParsed)){showToast('Answer the missing detail before saving');return;}
    const other=entries.filter(it=>it.kind!=='mobility');
    // Add the mobility sessions without using the existing cardio/resistance serializer.
    if(other.length){
      state.aiParsed={...state.aiParsed,items:other};
      older.saveSmartLogWorkout();
    }else{
      resetSmart();
    }
    removeRestSessions(state.selectedDate);
    for(const it of mobility){
      if(!allowed.has(it.name)||!clampMinutes(it.durationMinutes))continue;
      addSession(state.selectedDate,{
        id:cryptoId(),type:'mobility',activity:it.name,style:it.style||'',
        intensity:INTENSITIES.includes(it.intensity)?it.intensity:'Gentle',
        duration:clampMinutes(it.durationMinutes),notes:'Logged with Smart Log',createdAt:Date.now()
      });
    }
    state.view='day';showToast('Mobility session logged');
  };

  globalThis.LastSetMobility=Object.freeze({version:VERSION,activities:ACTIVITIES.map(a=>a.name),
    parseDuration,identifyActivity,detectMobility});
  // Everything is loaded after the base app scripts. Rebind the existing home screen.
  if(typeof document!=='undefined'&&document.getElementById('app'))render();
})();

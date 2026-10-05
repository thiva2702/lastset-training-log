(() => {
'use strict';
const VERSION='0.13.7';
const clone=v=>JSON.parse(JSON.stringify(v));
const norm=s=>String(s||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9.%+/-]+/g,' ').replace(/\s+/g,' ').trim();
const fmt=n=>Number.isInteger(Number(n))?String(Number(n)):String(Math.round(Number(n)*10)/10);
const dates=(db,before)=>Object.keys(db?.sessions||{}).filter(d=>!before||d<before).sort().reverse();
const exById=(cat,id)=>(cat||[]).find(e=>e.id===id);
const typeOf=(cat,item)=>item?.loadType||exById(cat,item?.exerciseId)?.loadType||'external';

function resistanceSessions(db,before){
  const out=[];
  for(const date of dates(db,before)){
    for(const session of db.sessions?.[date]||[]){
      if(session?.type==='resistance'&&(session.exercises||[]).length) out.push({date,session});
    }
  }
  return out;
}
function muscleMatch(session,keyword,catalogue){
  const q=norm(keyword);
  if(!q) return true;
  return (session.exercises||[]).some(item=>{
    const ex=exById(catalogue,item.exerciseId);
    const hay=norm([item.name,ex?.name,...(ex?.muscles||[]),...(ex?.filterMuscles||[]),ex?.primaryMuscle,...(ex?.secondaryMuscles||[])].join(' '));
    return hay.includes(q);
  });
}
function workoutCue(text){
  return /\b(?:same (?:workout|session|day)|same .* workout|repeat (?:my )?(?:last|previous)|same as (?:last week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|last (?:chest|back|legs?|push|pull|upper|lower) (?:day|workout))\b/i.test(String(text||''));
}
function weekdayIndex(text){
  const ds=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const n=norm(text); const d=ds.find(x=>n.includes(x)); return d?ds.indexOf(d):null;
}
function workoutKeyword(text){
  const n=norm(text);
  for(const k of ['chest','back','legs','leg','push','pull','upper','lower','shoulders','arms']){
    if(n.includes(k+' workout')||n.includes(k+' day')||n.includes('last '+k)||n.includes('same '+k)) return k==='leg'?'legs':k;
  }
  return null;
}
function findWorkoutReference(text,db,before,catalogue){
  if(!workoutCue(text)) return null;
  const wi=weekdayIndex(text), key=workoutKeyword(text);
  for(const record of resistanceSessions(db,before)){
    if(wi!=null && new Date(record.date+'T12:00:00').getDay()!==wi) continue;
    if(key && !muscleMatch(record.session,key,catalogue)) continue;
    return record;
  }
  return null;
}
function savedToParsed(record,catalogue){
  const items=(record.session.exercises||[]).map(item=>{
    const ex=exById(catalogue,item.exerciseId), type=item.loadType||ex?.loadType||'external';
    return {
      kind:'resistance',exerciseId:item.exerciseId,name:item.name||ex?.name||'Exercise',
      equipment:ex?.equipment||'Resistance',primaryMuscles:ex?.muscles||[],loadType:type,
      sets:(item.sets||[]).map(set=>type==='timed'
        ?{durationSeconds:Number(set.durationSeconds)||0,setType:set.setType||'working'}
        :{weightKg:set.weight==null?(type==='bodyweight'?0:null):Number(set.weight),reps:Number(set.reps)||0,setType:set.setType||'working'}),
      notes:item.note||null,memory:{kind:'workout-reference',sourceDate:record.date}
    };
  });
  return {summary:`Remembered workout from ${record.date}`,confidence:.99,needsConfirmation:true,clarification:null,items,
    memoryWorkout:{sourceDate:record.date,exerciseCount:items.length}};
}
function findMentionedExercise(text,catalogue){
  const n=norm(text);
  const matches=[];
  for(const ex of catalogue||[]){
    for(const a of [ex.name,...(ex.aliases||[])]){
      const q=norm(a); if(q&&n.includes(q)) matches.push({ex,len:q.length});
    }
  }
  matches.sort((a,b)=>b.len-a.len);
  return matches[0]?.ex||null;
}
function applyWorkoutModifiers(parsed,text,catalogue){
  const next=clone(parsed); const source=String(text||'');
  const skip=/\b(?:skip|remove|without)\s+([^,.]+)/i.exec(source);
  if(skip){
    const ex=findMentionedExercise(skip[1],catalogue);
    if(ex) next.items=next.items.filter(x=>x.exerciseId!==ex.id);
  }
  for(const item of next.items){
    const ex=exById(catalogue,item.exerciseId); if(!ex) continue;
    const aliases=[ex.name,...(ex.aliases||[])].sort((a,b)=>b.length-a.length);
    const alias=aliases.find(a=>norm(source).includes(norm(a))); if(!alias) continue;
    const at=norm(source).indexOf(norm(alias)); const tail=source.slice(Math.max(0,at));
    const w=/\b(\d+(?:\.\d+)?)\s*(kg|kgs?|lb|lbs|pounds?)\b/i.exec(tail);
    if(w && item.loadType!=='bodyweight'&&item.loadType!=='timed'){
      let kg=Number(w[1]); if(/lb|pound/i.test(w[2])) kg=Math.round(kg*.453592*10)/10;
      item.sets=(item.sets||[]).map(s=>({...s,weightKg:kg}));
    }
    const sc=/\b(\d{1,2})\s*sets?\b/i.exec(tail);
    if(sc){
      const count=Number(sc[1]); const sets=item.sets||[];
      if(sets.length>count)item.sets=sets.slice(0,count);
      else while(item.sets.length<count)item.sets.push(clone(item.sets[item.sets.length-1]||{weightKg:null,reps:null,setType:'working'}));
    }
  }
  next.summary=`Remembered ${next.items.length} exercises from ${next.memoryWorkout?.sourceDate||'history'}`;
  return next;
}
function parseWorkoutMemory(text,db,before,catalogue){
  const rec=findWorkoutReference(text,db,before,catalogue); if(!rec)return null;
  return applyWorkoutModifiers(savedToParsed(rec,catalogue),text,catalogue);
}

function workingSets(item){return (item?.sets||[]).filter(s=>s.setType!=='warmup');}
function setScore(type,s){
  if(type==='timed')return Number(s.durationSeconds)||0;
  const reps=Number(s.reps)||0,w=Number(s.weight)||0;
  if(type==='assisted')return reps>0?(100000-Math.max(0,w)*100+reps):0;
  if(type==='bodyweight')return Math.max(0,w)*1000+reps;
  return w*1000+reps;
}
function exerciseHistory(db,exerciseId,catalogue,before){
  const out=[];
  for(const date of dates(db,before)){
    for(const session of db.sessions?.[date]||[]){
      if(session.type!=='resistance')continue;
      const item=(session.exercises||[]).find(x=>x.exerciseId===exerciseId); if(!item)continue;
      const type=typeOf(catalogue,item), sets=workingSets(item);
      if(sets.length)out.push({date,item,type,sets});
    }
  }
  return out;
}
function volume(type,sets){
  if(type==='timed')return sets.reduce((a,s)=>a+(Number(s.durationSeconds)||0),0);
  if(type==='assisted'||type==='bodyweight')return sets.reduce((a,s)=>a+(Number(s.reps)||0),0);
  return sets.reduce((a,s)=>a+(Number(s.weight)||0)*(Number(s.reps)||0),0);
}
function bestSet(type,sets){
  let best=null;
  for(const s of sets){if(!best||setScore(type,s)>setScore(type,best))best=s;}
  return best?clone(best):null;
}
function targetFor(history,catalogue,profile){
  if(!history?.length)return null;
  const last=history[0], type=last.type, sets=clone(last.sets);
  if(!sets.length)return null;
  if(type==='timed'){
    let i=sets.reduce((bi,s,j,a)=>(Number(s.durationSeconds)||0)<(Number(a[bi].durationSeconds)||0)?j:bi,0);
    sets[i].durationSeconds=(Number(sets[i].durationSeconds)||0)+5;
    return {sets,reason:'Add 5 seconds to the shortest hold.'};
  }
  if(type==='assisted'){
    let i=sets.reduce((bi,s,j,a)=>(Number(s.reps)||0)<(Number(a[bi].reps)||0)?j:bi,0);
    sets[i].reps=(Number(sets[i].reps)||0)+1;
    return {sets,reason:'Add one rep before reducing assistance.'};
  }
  let i=sets.reduce((bi,s,j,a)=>(Number(s.reps)||0)<(Number(a[bi].reps)||0)?j:bi,0);
  if(profile?.progressionPreference==='weight_first' && sets.every(s=>(Number(s.reps)||0)>=10)){
    const ex=exById(catalogue,last.item.exerciseId), inc=Number(ex?.defaultIncrement)||2.5;
    sets.forEach(s=>{if(s.weight!=null)s.weight=(Number(s.weight)||0)+inc;});
    return {sets,reason:`Increase load by about ${fmt(inc)} kg and rebuild reps cleanly.`};
  }
  sets[i].reps=(Number(sets[i].reps)||0)+1;
  return {sets,reason:'Beat the lowest working set by one rep.'};
}
function progressMetric(db,exerciseId,catalogue,before,profile){
  const h=exerciseHistory(db,exerciseId,catalogue,before); if(!h.length)return null;
  const ex=exById(catalogue,exerciseId), type=h[0].type, latest=h[0], best=h.map(x=>bestSet(type,x.sets)).filter(Boolean).reduce((a,b)=>!a||setScore(type,b)>setScore(type,a)?b:a,null);
  const recent=h.slice(0,6).reverse();
  const vols=recent.map(x=>volume(type,x.sets));
  const trend=vols.length>1&&vols[0]>0?Math.round(((vols[vols.length-1]-vols[0])/vols[0])*1000)/10:null;
  return {exerciseId,name:latest.item.name||ex?.name||exerciseId,type,sessions:h.length,lastDate:latest.date,lastSets:clone(latest.sets),best,trend,recent:recent.map((x,i)=>({date:x.date,volume:vols[i],best:bestSet(type,x.sets)})),target:targetFor(h,catalogue,profile)};
}
function allProgress(db,catalogue,before,profile){
  const ids=new Set();
  for(const {session} of resistanceSessions(db,before))for(const e of session.exercises||[])if(e.exerciseId)ids.add(e.exerciseId);
  return [...ids].map(id=>progressMetric(db,id,catalogue,before,profile)).filter(Boolean).sort((a,b)=>b.lastDate.localeCompare(a.lastDate));
}
function isPR(db,date,item,catalogue){
  const type=typeOf(catalogue,item), current=bestSet(type,workingSets(item)); if(!current)return false;
  const prev=exerciseHistory(db,item.exerciseId,catalogue,date).map(x=>bestSet(type,x.sets)).filter(Boolean);
  return !prev.length||prev.every(s=>setScore(type,current)>setScore(type,s));
}
function workoutSummary(db,date,catalogue){
  const ss=db?.sessions?.[date]||[], res=ss.find(s=>s.type==='resistance'), cardio=ss.filter(s=>s.type==='cardio');
  const improvements=[], prs=[]; let working=0;
  for(const item of res?.exercises||[]){
    const type=typeOf(catalogue,item), sets=workingSets(item); working+=sets.length;
    const hist=exerciseHistory(db,item.exerciseId,catalogue,date);
    if(isPR(db,date,item,catalogue))prs.push(item.name);
    if(hist.length){
      const now=volume(type,sets), before=volume(type,hist[0].sets);
      if(now>before) improvements.push({name:item.name,delta:before?Math.round(((now-before)/before)*1000)/10:null});
    }
  }
  return {exerciseCount:res?.exercises?.length||0,workingSets:working,cardioCount:cardio.length,improvements,prs};
}

function memoryStore(db){db.memory=db.memory||{};db.memory.correctionObservations=db.memory.correctionObservations||{};db.memory.aliases=db.memory.aliases||{};return db.memory;}
function correctionKey(source){return norm(source).slice(0,120);}
function observeCorrection(db,source,targetId,targetName){
  const key=correctionKey(source);if(!key||!targetId)return null;
  const store=memoryStore(db), rec=store.correctionObservations[key]||{counts:{},names:{}};
  rec.counts[targetId]=(rec.counts[targetId]||0)+1; rec.names[targetId]=targetName; rec.updatedAt=Date.now(); store.correctionObservations[key]=rec;
  const count=rec.counts[targetId]; return count>=2?{phrase:key,exerciseId:targetId,name:targetName,count}:null;
}
function acceptCorrectionLearning(db,suggestion){if(!suggestion)return false;const store=memoryStore(db);store.aliases[suggestion.phrase]={exerciseId:suggestion.exerciseId,name:suggestion.name,updatedAt:Date.now(),source:'correction-learning'};return true;}

function searchStore(db){db.telemetry=db.telemetry||{};db.telemetry.zeroResultSearches=db.telemetry.zeroResultSearches||[];return db.telemetry.zeroResultSearches;}
function recordZeroSearch(db,query){
  const q=norm(query);if(q.length<3)return false;const arr=searchStore(db),existing=arr.find(x=>x.query===q);
  if(existing){existing.count++;existing.lastAt=Date.now();}else arr.push({query:q,count:1,lastAt:Date.now()});
  arr.sort((a,b)=>b.lastAt-a.lastAt);if(arr.length>50)arr.length=50;return true;
}
function fuzzyTokens(query,text){
  const q=norm(query),t=norm(text);if(!q)return true;if(t.includes(q))return true;
  const qs=q.split(' ').filter(Boolean),ts=t.split(' ').filter(Boolean);
  const edit=(a,b)=>{const d=Array(b.length+1).fill(0).map((_,i)=>i);for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const tmp=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=tmp;}}return d[b.length];};
  return qs.every(x=>ts.some(y=>y.startsWith(x)||x.startsWith(y)||(x.length>=4&&edit(x,y)<=1)));
}

if(typeof globalThis!=='undefined'&&globalThis.__LASTSET_TEST_ONLY__){
  globalThis.LastSetIntelligenceTest={findWorkoutReference,parseWorkoutMemory,applyWorkoutModifiers,exerciseHistory,progressMetric,allProgress,targetFor,isPR,workoutSummary,observeCorrection,acceptCorrectionLearning,recordZeroSearch,fuzzyTokens};
  return;
}
if(typeof window==='undefined')return;
const cat=()=>typeof EXERCISES!=='undefined'?EXERCISES:[];
const db=()=>typeof data!=='undefined'?data:null;
const today=()=>typeof state!=='undefined'?state.selectedDate:null;

if(typeof parseSmartWorkout==='function'){
  const base=parseSmartWorkout;
  parseSmartWorkout=function(text){
    const remembered=parseWorkoutMemory(text,db(),today(),cat());
    if(remembered)return typeof finalizeSmartParsed==='function'?finalizeSmartParsed(remembered):remembered;
    return base(text);
  };
}
if(typeof applySmartCorrection==='function'){
  const base=applySmartCorrection;
  applySmartCorrection=function(parsed,correction){
    const before=clone(parsed), result=base(parsed,correction);
    try{
      const old=(before?.items||[]).filter(x=>x.kind==='resistance');
      const now=(result?.parsed?.items||[]).filter(x=>x.kind==='resistance');
      if(old.length===1&&now.length===1&&old[0].exerciseId!==now[0].exerciseId&&state?.aiDraft){
        const suggestion=observeCorrection(db(),state.aiDraft,now[0].exerciseId,now[0].name);
        if(suggestion){result.parsed.correctionLearningSuggestion=suggestion;saveData(data);}
      }
    }catch(_){}
    return result;
  };
}
function setText(set,type){
  if(type==='timed')return `${Number(set.durationSeconds)||0}s`;
  if(type==='assisted')return `${fmt(set.weight??set.weightKg)} kg assist × ${Number(set.reps)||0}`;
  if(type==='bodyweight'&&!(Number(set.weight??set.weightKg)>0))return `BW × ${Number(set.reps)||0}`;
  return `${fmt(set.weight??set.weightKg)} kg × ${Number(set.reps)||0}`;
}
function progressHtml(){
  const rows=allProgress(db(),cat(),null,data.profile);
  return `<main class="container"><div class="ls-i-head"><div><div class="ls-i-kicker">Training intelligence</div><h2>Progress</h2><p>Recent performance, PRs and a conservative next target from your own history.</p></div></div>
  ${rows.length?rows.map(m=>`<section class="card ls-i-progress"><div class="ls-i-row"><div><strong>${escapeHtml(m.name)}</strong><small>${m.sessions} sessions · Last ${escapeHtml(dateLabel(m.lastDate))}</small></div>${m.trend==null?'':`<span class="ls-i-trend ${m.trend>=0?'up':'down'}">${m.trend>=0?'+':''}${m.trend}%</span>`}</div>
  <div class="ls-i-grid"><div><span>Last</span><strong>${m.lastSets.map(s=>escapeHtml(setText(s,m.type))).join(' · ')}</strong></div><div><span>Best</span><strong>${escapeHtml(setText(m.best,m.type))}</strong></div></div>
  ${m.target?`<div class="ls-i-target"><span>Next target</span><strong>${m.target.sets.map(s=>escapeHtml(setText(s,m.type))).join(' · ')}</strong><small>${escapeHtml(m.target.reason)}</small></div>`:''}</section>`).join(''):`<div class="card pad"><div class="empty">Log a few workouts and LastSet will build your progress view here.</div></div>`}
  </main>`;
}
try{progressScreen=progressHtml;}catch(_){}

if(typeof aiParsedHtml==='function'){
  const base=aiParsedHtml;
  aiParsedHtml=function(parsed){
    let html=base(parsed);
    if(parsed?.memoryWorkout)html=html.replace('<div class="preview-list">',`<div class="ls-i-memory"><div class="ls-i-kicker">🧠 Workout memory</div><strong>Using your workout from ${escapeHtml(dateLabel(parsed.memoryWorkout.sourceDate))}</strong><p>${parsed.items.length} exercises remembered. Review before saving.</p></div><div class="preview-list">`);
    if(parsed?.correctionLearningSuggestion){
      const s=parsed.correctionLearningSuggestion;
      html=html.replace('<div class="preview-list">',`<div class="ls-i-memory"><div class="ls-i-kicker">🧠 I noticed a pattern</div><strong>Use “${escapeHtml(s.phrase)}” as ${escapeHtml(s.name)} by default?</strong><p>You corrected this the same way ${s.count} times.</p><div class="ls-i-actions"><button class="secondary" data-learn-correction="no">Not now</button><button class="primary" data-learn-correction="yes">Use by default</button></div></div><div class="preview-list">`);
    }
    return html;
  };
}
function summaryCard(date){
  const sum=workoutSummary(db(),date,cat()); if(!sum.exerciseCount&&!sum.cardioCount)return '';
  return `<section class="card ls-i-summary"><div class="ls-i-kicker">Workout summary</div><strong>${sum.exerciseCount} exercises · ${sum.workingSets} working sets${sum.cardioCount?` · ${sum.cardioCount} cardio`:''}</strong>
    ${sum.prs.length?`<p>🏆 PR: ${escapeHtml(sum.prs.join(' · '))}</p>`:''}
    ${sum.improvements.length?`<p>📈 Improved: ${sum.improvements.map(x=>escapeHtml(x.name)+(x.delta!=null?` +${x.delta}%`:'' )).join(' · ')}</p>`:''}</section>`;
}
if(typeof dayScreen==='function'){
  const base=dayScreen;
  dayScreen=function(){const html=base();const card=summaryCard(state.selectedDate);return card?html.replace('<div class="action-list">',card+'<div class="action-list">'):html;};
}
if(typeof fuzzySearchMatchV11==='function'){
  const base=fuzzySearchMatchV11;
  fuzzySearchMatchV11=function(q,t){return base(q,t)||fuzzyTokens(q,t);};
}
if(typeof applyExerciseFilters==='function'){
  const base=applyExerciseFilters;
  applyExerciseFilters=function(){
    base();
    clearTimeout(window.__lsZeroSearchTimer);
    const input=document.getElementById('exercise-search'),q=input?.value?.trim();
    if(!q)return;
    window.__lsZeroSearchTimer=setTimeout(()=>{
      const visible=[...document.querySelectorAll('[data-exercise-row]')].filter(r=>r.style.display!=='none');
      if(!visible.length&&recordZeroSearch(db(),q)){saveData(data);}
    },700);
  };
}
document.addEventListener('click',e=>{
  const yes=e.target.closest?.('[data-learn-correction="yes"]');
  const no=e.target.closest?.('[data-learn-correction="no"]');
  if(yes||no){
    e.preventDefault();
    if(yes&&state?.aiParsed?.correctionLearningSuggestion){acceptCorrectionLearning(db(),state.aiParsed.correctionLearningSuggestion);saveData(data);showToast('LastSet will remember that wording');}
    if(state?.aiParsed)delete state.aiParsed.correctionLearningSuggestion;
    render();
  }
},true);

const style=document.createElement('style');style.id='lastset-intelligence-style';style.textContent=`
.ls-i-head h2{margin:2px 0 4px}.ls-i-head p{margin:0 0 14px;color:var(--muted);font-size:12px}.ls-i-kicker{text-transform:uppercase;letter-spacing:.14em;font-size:9px;font-weight:900;color:#a9ff50;margin-bottom:5px}.ls-i-progress,.ls-i-summary{padding:14px;margin-bottom:10px}.ls-i-row{display:flex;justify-content:space-between;gap:10px}.ls-i-row strong{display:block}.ls-i-row small{display:block;color:var(--muted);font-size:10px;margin-top:3px}.ls-i-trend{font-weight:900;font-size:12px}.ls-i-trend.up{color:#a9ff50}.ls-i-trend.down{color:#ff8f9b}.ls-i-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.ls-i-grid>div,.ls-i-target{border:1px solid #342746;border-radius:12px;padding:9px;background:#120e1b}.ls-i-grid span,.ls-i-target span{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.1em}.ls-i-grid strong,.ls-i-target strong{display:block;font-size:11px;margin-top:4px;line-height:1.4}.ls-i-target{margin-top:8px;border-color:rgba(169,255,80,.35)}.ls-i-target small{display:block;color:var(--muted);font-size:9px;margin-top:5px}.ls-i-memory{border:1px solid rgba(157,92,255,.5);background:#151020;border-radius:15px;padding:12px;margin:10px 0}.ls-i-memory strong{font-size:12px}.ls-i-memory p,.ls-i-summary p{font-size:10px;color:var(--muted);line-height:1.45}.ls-i-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.ls-i-actions button{margin:0!important}
`;document.head.appendChild(style);
document.documentElement.dataset.lastsetIntelligence=VERSION;
})();
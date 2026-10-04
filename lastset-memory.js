(() => {
  'use strict';

  const VERSION = '0.13.4';

  const clone = value => JSON.parse(JSON.stringify(value));

  function normalizePhrase(value){
    return String(value || '')
      .toLowerCase()
      .replace(/[“”"'’]/g, '')
      .replace(/[^a-z0-9%+./ -]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function escapeRegExp(value){
    return String(value || '').replace(/[.*+?^$()|[\]{}\\]/g, '\\$&');
  }

  function formatDate(iso){
    if(!iso) return '';
    try{
      return new Date(iso + 'T12:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short'});
    }catch(_){
      return iso;
    }
  }

  function formatNumber(value){
    const n=Number(value);
    if(!Number.isFinite(n)) return '';
    return Number.isInteger(n) ? String(n) : String(Math.round(n*10)/10);
  }

  function catalogueExercise(catalogue,id){
    return Array.isArray(catalogue) ? catalogue.find(e => e.id === id) : null;
  }

  function exerciseLoadType(catalogue,exercise){
    return exercise?.loadType || catalogueExercise(catalogue,exercise?.exerciseId)?.loadType || 'external';
  }

  function savedExerciseToItem(exercise,catalogue,sourceDate){
    const catalog=catalogueExercise(catalogue,exercise?.exerciseId);
    const loadType=exerciseLoadType(catalogue,exercise);
    const sets=(exercise?.sets || []).map(set => {
      if(loadType === 'timed'){
        return {
          durationSeconds:Number(set.durationSeconds) || 0,
          setType:set.setType || 'working'
        };
      }
      return {
        weightKg:set.weight == null ? (loadType === 'bodyweight' ? 0 : null) : Number(set.weight),
        reps:Number(set.reps) || 0,
        setType:set.setType || 'working'
      };
    });

    return {
      kind:'resistance',
      exerciseId:exercise?.exerciseId || catalog?.id || null,
      name:exercise?.name || catalog?.name || 'Exercise',
      equipment:catalog?.equipment || 'Resistance',
      primaryMuscles:catalog?.muscles || [],
      loadType,
      sets,
      durationMinutes:null,
      distanceKm:null,
      notes:exercise?.note || null,
      memory:{
        kind:'history',
        sourceDate
      }
    };
  }

  function sessionDates(data,beforeDate){
    return Object.keys(data?.sessions || {})
      .filter(date => !beforeDate || date < beforeDate)
      .sort()
      .reverse();
  }

  function findExerciseRecord(data,exerciseId,beforeDate,weekdayIndex=null){
    for(const date of sessionDates(data,beforeDate)){
      if(weekdayIndex != null){
        const dt=new Date(date+'T12:00:00');
        if(dt.getDay() !== weekdayIndex) continue;
      }
      for(const session of data.sessions?.[date] || []){
        if(session?.type !== 'resistance') continue;
        const exercise=(session.exercises || []).find(item => item.exerciseId === exerciseId);
        if(exercise) return {date,session,exercise};
      }
    }
    return null;
  }

  function exerciseFrequency(data,exerciseId,beforeDate){
    let count=0;
    for(const date of sessionDates(data,beforeDate)){
      const seen=(data.sessions?.[date] || []).some(session =>
        session?.type === 'resistance' &&
        (session.exercises || []).some(item => item.exerciseId === exerciseId)
      );
      if(seen) count++;
    }
    return count;
  }

  function buildMemoryProfile(data,beforeDate,catalogue){
    const profile=[];
    const seen=new Set();

    for(const date of sessionDates(data,beforeDate)){
      for(const session of data.sessions?.[date] || []){
        if(session?.type !== 'resistance') continue;
        for(const exercise of session.exercises || []){
          if(!exercise?.exerciseId || seen.has(exercise.exerciseId)) continue;
          seen.add(exercise.exerciseId);
          const item=savedExerciseToItem(exercise,catalogue,date);
          profile.push({
            exerciseId:exercise.exerciseId,
            name:item.name,
            sourceDate:date,
            sessionCount:exerciseFrequency(data,exercise.exerciseId,beforeDate),
            sets:item.sets
          });
        }
      }
    }

    return profile;
  }

  function fallbackExerciseMentions(text,catalogue){
    const source=normalizePhrase(text);
    const candidates=[];

    for(const exercise of catalogue || []){
      for(const alias of [exercise.name,...(exercise.aliases || [])]){
        const normalized=normalizePhrase(alias);
        if(!normalized) continue;
        const index=source.indexOf(normalized);
        if(index >= 0) candidates.push({exercise,start:index,end:index+normalized.length,alias:normalized});
      }
    }

    candidates.sort((a,b) => a.start-b.start || b.alias.length-a.alias.length);
    const out=[];
    for(const candidate of candidates){
      if(out.some(hit => candidate.start >= hit.start && candidate.start < hit.end)) continue;
      out.push(candidate);
    }
    return out;
  }

  function memoryCue(text){
    return /\b(?:same as (?:last time|usual|before|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|as usual|use (?:my )?last|repeat (?:my )?last|usual (?:sets?|weight|reps?))\b/i.test(String(text || ''));
  }

  function weekdayFromText(text){
    const weekdays=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const normalized=normalizePhrase(text);
    const name=weekdays.find(day => normalized.includes(day));
    return name ? weekdays.indexOf(name) : null;
  }

  function resizeSets(sets,count){
    const next=(sets || []).map(set => ({...set}));
    if(!Number.isInteger(count) || count < 1 || count > 20) return next;
    if(next.length > count) return next.slice(0,count);
    while(next.length < count){
      const seed=next[next.length-1] || {weightKg:null,reps:null,setType:'working'};
      next.push({...seed});
    }
    return next;
  }

  function applyExplicitMemoryOverrides(item,text){
    const next=clone(item);
    const source=String(text || '');
    const loadType=next.loadType || 'external';

    const countMatch=/\b(\d{1,2})\s*sets?\b/i.exec(source);
    if(countMatch) next.sets=resizeSets(next.sets,Number(countMatch[1]));

    const weights=[...source.matchAll(/\b(\d+(?:\.\d+)?)\s*(kg|kgs?|kilos?|lb|lbs|pounds?)\b/gi)];
    if(weights.length && loadType !== 'timed' && loadType !== 'bodyweight'){
      const last=weights[weights.length-1];
      const raw=Number(last[1]);
      const kg=/lb|pound/i.test(last[2]) ? Math.round(raw*0.453592*10)/10 : raw;
      if(Number.isFinite(kg) && kg >= 0){
        next.sets=(next.sets || []).map(set => ({...set,weightKg:kg}));
      }
    }

    const repMatch=/\b(?:but|today|now|this time|instead)[^.!?]{0,30}?\b(\d{1,3})\s*reps?\b/i.exec(source);
    if(repMatch){
      const reps=Number(repMatch[1]);
      if(Number.isFinite(reps) && reps > 0 && reps <= 500){
        next.sets=(next.sets || []).map(set => ({...set,reps}));
      }
    }

    return next;
  }

  function parseMemoryReference(text,data,beforeDate,catalogue,mentions){
    if(!memoryCue(text)) return null;

    const foundMentions=(mentions && mentions.length) ? mentions : fallbackExerciseMentions(text,catalogue);
    if(!foundMentions.length) return null;

    const weekday=weekdayFromText(text);
    const items=[];
    const assumptions=[];

    for(const mention of foundMentions){
      const exercise=mention.exercise;
      if(!exercise?.id || items.some(item => item.exerciseId === exercise.id)) continue;
      const record=findExerciseRecord(data,exercise.id,beforeDate,weekday);
      if(!record) continue;
      const base=savedExerciseToItem(record.exercise,catalogue,record.date);
      const item=applyExplicitMemoryOverrides(base,text);
      item.memory={
        kind:'explicit-reference',
        sourceDate:record.date,
        sourceExerciseId:exercise.id
      };
      items.push(item);
      assumptions.push({
        itemIndex:items.length-1,
        exerciseId:exercise.id,
        name:item.name,
        sourceDate:record.date,
        reason:'You asked LastSet to reuse your previous training.'
      });
    }

    if(!items.length) return null;

    return {
      summary:items.length === 1
        ? `Remembered ${items[0].name} from ${formatDate(assumptions[0].sourceDate)}`
        : `Remembered ${items.length} exercises from your history`,
      confidence:0.99,
      needsConfirmation:true,
      clarification:null,
      items,
      memoryAssumptions:assumptions
    };
  }

  function needsSuggestion(item){
    if(item?.kind !== 'resistance' || !item.exerciseId) return false;
    const sets=item.sets || [];
    if(!sets.length) return true;

    if(item.loadType === 'timed'){
      return sets.some(set => !Number(set.durationSeconds));
    }

    if(sets.some(set => set.reps == null || Number(set.reps) <= 0)) return true;
    if(item.loadType === 'external' || item.loadType === 'assisted'){
      return sets.some(set => set.weightKg == null);
    }
    return false;
  }

  function attachMemorySuggestions(parsed,data,beforeDate,catalogue){
    if(!parsed || !Array.isArray(parsed.items)) return parsed;
    const next=parsed;

    next.items.forEach(item => {
      if(!needsSuggestion(item) || item.memory?.kind === 'explicit-reference') return;
      const record=findExerciseRecord(data,item.exerciseId,beforeDate);
      if(!record) return;
      const remembered=savedExerciseToItem(record.exercise,catalogue,record.date);
      if(!remembered.sets.length) return;
      item.memorySuggestion={
        sourceDate:record.date,
        sets:remembered.sets,
        sessionCount:exerciseFrequency(data,item.exerciseId,beforeDate)
      };
    });

    return next;
  }

  function applyMemorySuggestion(item){
    if(!item?.memorySuggestion) return item;
    const next=clone(item);
    const suggestion=next.memorySuggestion;

    if(!Array.isArray(next.sets) || !next.sets.length){
      next.sets=clone(suggestion.sets || []);
    }else{
      next.sets=next.sets.map((set,index) => {
        const remembered=(suggestion.sets || [])[index];
        if(!remembered) return set;
        if(next.loadType === 'timed'){
          return {
            ...set,
            durationSeconds:Number(set.durationSeconds) || Number(remembered.durationSeconds) || 0
          };
        }
        return {
          ...set,
          weightKg:set.weightKg == null ? remembered.weightKg : set.weightKg,
          reps:set.reps == null || Number(set.reps) <= 0 ? remembered.reps : set.reps
        };
      });
    }

    next.memory={
      kind:'accepted-suggestion',
      sourceDate:suggestion.sourceDate
    };
    delete next.memorySuggestion;
    return next;
  }

  function parseLearnAliasCommand(text,catalogue){
    const source=String(text || '').trim();
    let match=/\bwhen i say\s+["“]?(.+?)["”]?\s*,?\s*i mean\s+["“]?(.+?)["”]?\s*$/i.exec(source);
    if(!match) match=/\bremember(?: that)?\s+["“]?(.+?)["”]?\s+(?:means|is)\s+["“]?(.+?)["”]?\s*$/i.exec(source);
    if(!match) return null;

    const phrase=normalizePhrase(match[1]);
    const target=String(match[2] || '').trim();
    if(!phrase || phrase.length < 2) return null;

    const mentions=fallbackExerciseMentions(target,catalogue);
    const exercise=mentions[0]?.exercise || null;
    return exercise ? {phrase,exerciseId:exercise.id,name:exercise.name} : null;
  }

  function memoryStore(data){
    data.memory=data.memory || {};
    data.memory.version=1;
    data.memory.aliases=data.memory.aliases || {};
    return data.memory;
  }

  function rememberAlias(data,learned){
    if(!data || !learned) return false;
    const store=memoryStore(data);
    store.aliases[learned.phrase]={
      exerciseId:learned.exerciseId,
      name:learned.name,
      updatedAt:Date.now()
    };
    return true;
  }

  function applyLearnedAliases(text,data,catalogue){
    let output=String(text || '');
    const aliases=data?.memory?.aliases || {};
    const applied=[];

    const entries=Object.entries(aliases)
      .sort((a,b) => b[0].length-a[0].length);

    for(const [phrase,record] of entries){
      const exercise=catalogueExercise(catalogue,record?.exerciseId);
      if(!exercise) continue;
      const re=new RegExp(`(^|\\b)${escapeRegExp(phrase)}(?=\\b|$)`,'ig');
      if(!re.test(output)) continue;
      re.lastIndex=0;
      output=output.replace(re,(full,prefix) => `${prefix}${exercise.name}`);
      applied.push({phrase,exerciseId:exercise.id,name:exercise.name});
    }

    return {text:output,applied};
  }

  function setPatternLabel(sets,loadType){
    if(!Array.isArray(sets) || !sets.length) return 'No saved sets';
    if(loadType === 'timed'){
      return sets.map(set => `${Number(set.durationSeconds)||0}s`).join(' · ');
    }
    return sets.map(set => {
      const weight=set.weightKg == null ? '' : `${formatNumber(set.weightKg)} kg × `;
      return `${weight}${Number(set.reps)||0}`;
    }).join(' · ');
  }

  if(typeof globalThis !== 'undefined' && globalThis.__LASTSET_TEST_ONLY__){
    globalThis.LastSetMemoryTest={
      normalizePhrase,
      findExerciseRecord,
      buildMemoryProfile,
      fallbackExerciseMentions,
      parseMemoryReference,
      attachMemorySuggestions,
      applyMemorySuggestion,
      parseLearnAliasCommand,
      rememberAlias,
      applyLearnedAliases,
      setPatternLabel
    };
    return;
  }

  if(typeof window === 'undefined') return;

  function catalogue(){
    return typeof EXERCISES !== 'undefined' ? EXERCISES : [];
  }

  function currentData(){
    return typeof data !== 'undefined' ? data : null;
  }

  function currentDate(){
    return typeof state !== 'undefined' ? state.selectedDate : null;
  }

  function currentMentions(text){
    try{
      if(typeof findExerciseMentions === 'function'){
        const mentions=findExerciseMentions(text);
        if(Array.isArray(mentions) && mentions.length) return mentions;
      }
    }catch(_){ }
    return fallbackExerciseMentions(text,catalogue());
  }

  if(typeof parseSmartWorkout === 'function' && !parseSmartWorkout.__lastsetMemoryV0134){
    const baseParseSmartWorkout=parseSmartWorkout;

    const fixed=function(text){
      const source=String(text || '');
      const db=currentData();
      const cat=catalogue();

      const explicit=parseMemoryReference(source,db,currentDate(),cat,currentMentions(source));
      if(explicit){
        return typeof finalizeSmartParsed === 'function' ? finalizeSmartParsed(explicit) : explicit;
      }

      const learned=applyLearnedAliases(source,db,cat);
      const parsed=baseParseSmartWorkout(learned.text);
      if(parsed && learned.applied.length){
        parsed.memoryLearnedAliases=learned.applied;
      }
      return attachMemorySuggestions(parsed,db,currentDate(),cat);
    };

    fixed.__lastsetMemoryV0134=true;
    try{ parseSmartWorkout=fixed; }catch(_){ }
  }

  if(typeof applySmartCorrection === 'function' && !applySmartCorrection.__lastsetMemoryV0134){
    const baseApplySmartCorrection=applySmartCorrection;

    const fixed=function(parsed,correction){
      const learned=parseLearnAliasCommand(correction,catalogue());
      if(learned){
        rememberAlias(currentData(),learned);
        if(typeof saveData === 'function' && currentData()) saveData(currentData());

        const next=clone(parsed || {items:[]});
        const resistance=(next.items || []).filter(item => item?.kind === 'resistance');
        if(resistance.length === 1){
          const exercise=catalogueExercise(catalogue(),learned.exerciseId);
          if(exercise){
            resistance[0].exerciseId=exercise.id;
            resistance[0].name=exercise.name;
            resistance[0].equipment=exercise.equipment;
            resistance[0].primaryMuscles=exercise.muscles || [];
            resistance[0].loadType=exercise.loadType || resistance[0].loadType || 'external';
          }
        }
        next.summary=`Remembered “${learned.phrase}” as ${learned.name}`;
        next.memoryLearnedNow=learned;
        return {changed:true,parsed:next};
      }

      return baseApplySmartCorrection(parsed,correction);
    };

    fixed.__lastsetMemoryV0134=true;
    try{ applySmartCorrection=fixed; }catch(_){ }
  }

  function memoryBannerHtml(parsed){
    const explicit=parsed?.memoryAssumptions || [];
    const learned=parsed?.memoryLearnedAliases || [];
    const suggestions=(parsed?.items || [])
      .map((item,index) => ({item,index}))
      .filter(x => x.item?.memorySuggestion);

    const pieces=[];

    if(explicit.length){
      const sources=[...new Set(explicit.map(x => x.sourceDate).filter(Boolean))];
      pieces.push(`<div class="ls-memory-card ls-memory-used"><div class="ls-memory-kicker">🧠 LastSet Memory</div><strong>Using your previous training</strong><p>Remembered from ${sources.map(formatDate).join(', ')} because you asked to reuse it. Review the sets below before saving.</p></div>`);
    }

    if(learned.length){
      pieces.push(`<div class="ls-memory-card"><div class="ls-memory-kicker">🧠 Learned phrase</div><strong>${learned.map(x => `${escapeHtml(x.phrase)} → ${escapeHtml(x.name)}`).join(' · ')}</strong><p>This preference is stored only with your current LastSet user.</p></div>`);
    }

    for(const {item,index} of suggestions){
      const suggestion=item.memorySuggestion;
      pieces.push(`<div class="ls-memory-card"><div class="ls-memory-kicker">🧠 From your history</div><strong>${escapeHtml(item.name || 'Exercise')} · ${escapeHtml(formatDate(suggestion.sourceDate))}</strong><p>${escapeHtml(setPatternLabel(suggestion.sets,item.loadType))}</p><button type="button" class="secondary" data-memory-use="${index}">Use last sets</button><small>${suggestion.sessionCount || 1} previous session${suggestion.sessionCount===1?'':'s'} found. Nothing is filled until you tap this.</small></div>`);
    }

    return pieces.join('');
  }

  if(typeof aiParsedHtml === 'function' && !aiParsedHtml.__lastsetMemoryV0134){
    const baseAiParsedHtml=aiParsedHtml;
    const fixed=function(parsed){
      let html=baseAiParsedHtml(parsed);
      const banner=memoryBannerHtml(parsed);
      if(banner){
        html=html.replace('<div class="preview-list">',banner+'<div class="preview-list">');
      }
      return html;
    };
    fixed.__lastsetMemoryV0134=true;
    try{ aiParsedHtml=fixed; }catch(_){ }
  }

  function profileMemoryHtml(){
    const db=currentData();
    const aliases=Object.keys(db?.memory?.aliases || {});
    const recent=buildMemoryProfile(db,currentDate(),catalogue()).slice(0,5);

    return `<section class="ls-memory-profile">
      <div class="ls-memory-kicker">🧠 LastSet Memory</div>
      <strong>${recent.length ? `${recent.length}+ recent exercise patterns available` : 'Memory starts with your workout history'}</strong>
      <p>LastSet can reuse previous sets when you ask, suggest recent patterns when details are missing, and remember phrases you explicitly teach it. It never silently fills a remembered workout value.</p>
      ${recent.length ? `<div class="ls-memory-recent">${recent.map(item => `<span>${escapeHtml(item.name)} · ${escapeHtml(formatDate(item.sourceDate))}</span>`).join('')}</div>` : ''}
      <div class="ls-memory-profile-actions"><span>${aliases.length} learned phrase${aliases.length===1?'':'s'}</span>${aliases.length?'<button type="button" class="secondary" data-memory-clear>Clear learned phrases</button>':''}</div>
    </section>`;
  }

  if(typeof profileScreen === 'function' && !profileScreen.__lastsetMemoryV0134){
    const baseProfileScreen=profileScreen;
    const fixed=function(){
      const html=baseProfileScreen();
      return html.replace('</main>',profileMemoryHtml()+'</main>');
    };
    fixed.__lastsetMemoryV0134=true;
    try{ profileScreen=fixed; }catch(_){ }
  }

  const style=document.createElement('style');
  style.id='lastset-memory-style';
  style.textContent=`
    .ls-memory-card,.ls-memory-profile{border:1px solid rgba(169,255,80,.34);background:linear-gradient(135deg,rgba(31,24,48,.98),rgba(15,31,28,.97));border-radius:16px;padding:12px;margin:10px 0}
    .ls-memory-card strong,.ls-memory-profile strong{display:block;font-size:13px}
    .ls-memory-card p,.ls-memory-profile p{margin:5px 0 9px;color:var(--muted);font-size:11px;line-height:1.45}
    .ls-memory-kicker{text-transform:uppercase;letter-spacing:.14em;font-size:9px;font-weight:900;color:#a9ff50;margin-bottom:5px}
    .ls-memory-card button{width:auto!important;padding:8px 11px!important;margin:0 0 7px!important}
    .ls-memory-card small{display:block;color:var(--muted);font-size:9px;line-height:1.4}
    .ls-memory-used{border-color:rgba(157,92,255,.52)}
    .ls-memory-recent{display:flex;flex-wrap:wrap;gap:6px;margin:9px 0}
    .ls-memory-recent span{border:1px solid #3a2a4d;background:#151020;border-radius:999px;padding:6px 8px;font-size:9px;color:#ddd2ee}
    .ls-memory-profile{margin:14px 0}
    .ls-memory-profile-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:10px;color:var(--muted)}
    .ls-memory-profile-actions button{width:auto!important;padding:8px 10px!important;margin:0!important}
  `;
  document.head.appendChild(style);

  document.addEventListener('click',event => {
    const use=event.target.closest?.('[data-memory-use]');
    if(use){
      event.preventDefault();
      const index=Number(use.dataset.memoryUse);
      if(!state?.aiParsed?.items?.[index]) return;
      state.aiParsed.items[index]=applyMemorySuggestion(state.aiParsed.items[index]);
      if(typeof finalizeSmartParsed === 'function') state.aiParsed=finalizeSmartParsed(state.aiParsed);
      state.aiError='';
      state.aiCorrection='';
      if(typeof render === 'function') render();
      if(typeof showToast === 'function') showToast('Last sets added from memory');
      return;
    }

    const clear=event.target.closest?.('[data-memory-clear]');
    if(clear){
      event.preventDefault();
      const db=currentData();
      if(!db) return;
      const count=Object.keys(db.memory?.aliases || {}).length;
      if(!count) return;
      if(!confirm('Clear learned phrases for this user? Workout history will not be changed.')) return;
      memoryStore(db).aliases={};
      if(typeof saveData === 'function') saveData(db);
      if(typeof render === 'function') render();
      if(typeof showToast === 'function') showToast('Learned phrases cleared');
    }
  },true);

  document.documentElement.dataset.lastsetMemory=VERSION;
})();
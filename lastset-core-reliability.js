(() => {
  'use strict';

  const VERSION = '0.13.3';

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function toKg(value, unit){
    const raw = Number(value);
    if(!Number.isFinite(raw)) return null;
    return /lb|pound/i.test(String(unit || ''))
      ? Math.round(raw * 0.453592 * 10) / 10
      : raw;
  }

  function stripEffortRepReferences(text){
    return String(text || '')
      .replace(/\b(?:started\s+)?(?:struggling|struggled|shaking|slowing|burning)\s+(?:after|from)\s+(?:rep\s*)?\d+\b/gi, ' ')
      .replace(/\b(?:felt\s+)?(?:hard|tough|heavy)\s+(?:after|from)\s+(?:rep\s*)?\d+\b/gi, ' ')
      .replace(/\b(?:form|technique)\s+(?:broke|failed|went\s+bad)\s+(?:after|from)\s+(?:rep\s*)?\d+\b/gi, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function parseWeightSetPlan(text, loadType){
    const type = String(loadType || 'external');
    if(type === 'timed' || type === 'bodyweight') return null;

    const source = stripEffortRepReferences(text);

    const full = /\b(\d+(?:\.\d+)?)\s*(kg|kgs?|kilos?|lb|lbs|pounds?)?\s*(?:for\s*)?(\d{1,2})\s*sets?\s*(?:of|x|×|at)?\s*(\d{1,3})\s*(?:reps?)?\b/i.exec(source);
    if(full){
      const weightKg = toKg(full[1], full[2]);
      const count = Number(full[3]);
      const reps = Number(full[4]);
      if(weightKg != null && weightKg >= 0 && weightKg <= 2200 && Number.isInteger(count) && count >= 1 && count <= 20 && Number.isInteger(reps) && reps >= 1 && reps <= 500){
        return Array.from({length:count}, () => ({weightKg, reps, setType:'working'}));
      }
    }

    const withFor = /\b(\d+(?:\.\d+)?)\s*(kg|kgs?|kilos?|lb|lbs|pounds?)?\s+for\s+(\d{1,2})\s*sets?\b/i.exec(source);
    const withUnit = /\b(\d+(?:\.\d+)?)\s*(kg|kgs?|kilos?|lb|lbs|pounds?)\s+(\d{1,2})\s*sets?\b/i.exec(source);
    const match = withFor || withUnit;
    if(match){
      const weightKg = toKg(match[1], match[2]);
      const count = Number(match[3]);
      if(weightKg != null && weightKg >= 0 && weightKg <= 2200 && Number.isInteger(count) && count >= 1 && count <= 20){
        return Array.from({length:count}, () => ({weightKg, reps:null, setType:'working'}));
      }
    }

    return null;
  }

  function exerciseType(item, catalogue){
    const ex = Array.isArray(catalogue) ? catalogue.find(e => e.id === item?.exerciseId) : null;
    return item?.loadType || ex?.loadType || 'external';
  }

  function requiredSmartMissing(parsed, catalogue){
    const items = parsed?.items || [];

    for(let i = 0; i < items.length; i++){
      const item = items[i];

      if(item?.kind === 'resistance'){
        if(!item.exerciseId){
          return {
            type:'exercise',
            itemIndex:i,
            question:'What exercise did you do?',
            helper:'Name the exercise or describe the equipment and movement.',
            placeholder:'Example: incline chest press machine'
          };
        }

        const type = exerciseType(item, catalogue);

        if(type === 'timed'){
          if(!Array.isArray(item.sets) || !item.sets.length){
            return {
              type:'timed',
              itemIndex:i,
              question:`How long did you hold each ${item.name || 'timed'} set?`,
              helper:'Seconds are enough.',
              placeholder:'Example: 45 sec, 45 sec, 60 sec'
            };
          }
          const missingDuration = item.sets
            .map((set, index) => ({set, index}))
            .filter(x => !Number(x.set?.durationSeconds))
            .map(x => x.index);
          if(missingDuration.length){
            return {
              type:'timed',
              itemIndex:i,
              setIndexes:missingDuration,
              question:'How long was the incomplete set?',
              helper:'Seconds are enough.',
              placeholder:'Example: 45 sec'
            };
          }
          continue;
        }

        if(!Array.isArray(item.sets) || !item.sets.length){
          return {
            type:'sets',
            itemIndex:i,
            question:type === 'bodyweight' ? `How many reps did you do for ${item.name}?` : 'What weight and reps did you do?',
            helper:type === 'bodyweight' ? 'Reps are enough for a normal bodyweight set.' : `I already identified ${item.name || 'the exercise'}.`,
            placeholder:type === 'bodyweight' ? 'Example: 15, 12 and 10' : 'Example: 40 kg 12 reps, then 45 kg 10 and 10'
          };
        }

        const missingReps = item.sets
          .map((set, index) => ({set, index}))
          .filter(x => x.set?.reps == null || Number(x.set.reps) <= 0)
          .map(x => x.index);

        if(missingReps.length){
          return {
            type:'reps',
            itemIndex:i,
            setIndexes:missingReps,
            question:'How many reps did you do?',
            helper:'You can give several sets at once, for example “12, 10 and 8”.',
            placeholder:'Example: 12, 10 and 8'
          };
        }

        const weightRequired = type === 'external' || type === 'assisted';
        if(weightRequired){
          const missingWeight = item.sets
            .map((set, index) => ({set, index}))
            .filter(x => x.set?.weightKg == null)
            .map(x => x.index);

          if(missingWeight.length){
            return {
              type:'weight',
              itemIndex:i,
              setIndexes:missingWeight,
              question:type === 'assisted' ? 'How much assistance did you use?' : 'What weight did you use?',
              helper:type === 'assisted' ? 'Lower assistance means the movement is harder.' : 'If the weight was the same for every set, one value is enough.',
              placeholder:type === 'assisted' ? 'Example: 25 kg assistance' : 'Example: 50 kg'
            };
          }
        }
      }

      if(item?.kind === 'cardio'){
        if(!Number(item.durationMinutes) && !Number(item.distanceKm)){
          return {
            type:'cardio',
            itemIndex:i,
            question:`How long or how far did you do ${item.name || 'cardio'}?`,
            helper:'Duration or distance is enough. Incline, resistance level, speed and environment are optional.',
            placeholder:'Example: 20 minutes or 3 km'
          };
        }
      }
    }

    return null;
  }

  function firstCardioBoundary(source, fromIndex, toIndex){
    const text = String(source || '');
    const start = Math.max(0, Number(fromIndex) || 0);
    const end = Math.max(start, Number.isFinite(Number(toIndex)) ? Number(toIndex) : text.length);
    const tail = text.slice(start, end);
    const match = /\b(?:then\s+)?(?:treadmill(?:\s+(?:run|walk))?|running|run|jogging|jog|walking|walk|stationary\s+bike|exercise\s+bike|spin\s+bike|cycling|cycle|biking|rowing\s+machine|rower|rowing|swimming|swim|elliptical|cross\s+trainer|stair\s+machine|stairmaster|stair\s+climb|stairs)\b/i.exec(tail);
    return match ? start + match.index : end;
  }

  function applyReliabilityCorrection(parsed, correction){
    if(!parsed || !Array.isArray(parsed.items)) return {changed:false, parsed};

    const next = clone(parsed);
    const source = String(correction || '');
    const lower = source.toLowerCase();
    let changed = false;

    const resistance = () => [...next.items].reverse().find(item => item?.kind === 'resistance' && Array.isArray(item.sets) && item.sets.length);
    const cardio = () => [...next.items].reverse().find(item => item?.kind === 'cardio');

    let match = lower.match(/\bset\s*(\d+)\b.*?\b(\d+(?:\.\d+)?)\s*(kg|kgs?|lb|lbs|pounds?)\b/i);
    if(match){
      const item = resistance();
      const index = Number(match[1]) - 1;
      if(item?.sets?.[index]){
        item.sets[index].weightKg = toKg(match[2], match[3]);
        changed = true;
      }
    }

    match = lower.match(/\b(?:weight|load|assistance)\s*(?:was|is|=|at)?\s*(\d+(?:\.\d+)?)\s*(kg|kgs?|lb|lbs|pounds?)\b/i);
    if(match){
      const item = resistance();
      if(item){
        const value = toKg(match[1], match[2]);
        item.sets.forEach(set => { set.weightKg = value; });
        changed = true;
      }
    }

    match = lower.match(/\b(?:duration|time)\s*(?:was|is|=|at)?\s*(\d+(?:\.\d+)?)\s*(minutes?|mins?|min|seconds?|secs?|sec)\b/i);
    if(match){
      const item = cardio();
      if(item){
        item.durationMinutes = /sec/i.test(match[2]) ? Math.round((Number(match[1]) / 60) * 100) / 100 : Number(match[1]);
        changed = true;
      }
    }

    match = lower.match(/\bincline\s*(?:was|is|=|at)?\s*(\d+(?:\.\d+)?)\s*%?/i);
    if(match){
      const item = cardio();
      if(item){
        item.incline = Number(match[1]);
        changed = true;
      }
    }

    match = lower.match(/\b(?:bike\s+)?(?:resistance\s+)?level\s*(?:was|is|=|at)?\s*(\d+(?:\.\d+)?)/i);
    if(match){
      const item = cardio();
      if(item){
        if(item.name === 'Cycling') item.resistanceLevel = Number(match[1]);
        else item.level = Number(match[1]);
        changed = true;
      }
    }

    if(changed){
      next.summary = next.items.length === 1 ? `Updated ${next.items[0].name || 'activity'}` : `Updated ${next.items.length} activities`;
      next.clarification = null;
      next.confidence = Math.max(Number(next.confidence) || 0.7, 0.92);
    }

    return {changed, parsed:next};
  }

  if(typeof globalThis !== 'undefined' && globalThis.__LASTSET_TEST_ONLY__){
    globalThis.LastSetCoreReliabilityTest = {
      stripEffortRepReferences,
      parseWeightSetPlan,
      requiredSmartMissing,
      firstCardioBoundary,
      applyReliabilityCorrection
    };
    return;
  }

  if(typeof window === 'undefined') return;

  if(typeof parseExerciseSetsV11 === 'function' && !parseExerciseSetsV11.__lastsetCoreReliabilityV0133){
    const baseParseExerciseSets = parseExerciseSetsV11;
    const fixed = function(exercise, text){
      const cleaned = stripEffortRepReferences(text);
      const plan = parseWeightSetPlan(cleaned, exercise?.loadType);
      if(plan) return plan;
      return baseParseExerciseSets(exercise, cleaned);
    };
    fixed.__lastsetCoreReliabilityV0133 = true;
    try{ parseExerciseSetsV11 = fixed; }catch(_){ }
  }

  if(typeof getSmartMissing === 'function' && !getSmartMissing.__lastsetCoreReliabilityV0133){
    const fixed = function(parsed){
      return requiredSmartMissing(parsed, typeof EXERCISES !== 'undefined' ? EXERCISES : []);
    };
    fixed.__lastsetCoreReliabilityV0133 = true;
    try{ getSmartMissing = fixed; }catch(_){ }
  }

  if(typeof parseSmartWorkout === 'function' && !parseSmartWorkout.__lastsetCoreReliabilityV0133){
    const baseParseSmartWorkout = parseSmartWorkout;
    const fixed = function(text){
      const source = String(text || '');
      const parsed = baseParseSmartWorkout(source);

      try{
        if(!parsed || !Array.isArray(parsed.items) || typeof findExerciseMentions !== 'function' || typeof parseExerciseSetsV11 !== 'function') return parsed;

        const mentions = (findExerciseMentions(source) || []).slice().sort((a,b) => a.start - b.start);
        const resistanceItems = parsed.items.filter(item => item?.kind === 'resistance');
        const used = new Set();

        mentions.forEach((mention, index) => {
          const nextStart = index + 1 < mentions.length ? mentions[index + 1].start : source.length;
          const end = firstCardioBoundary(source, mention.end, nextStart);
          const segment = source.slice(mention.start, end).trim();
          if(!segment) return;

          let itemIndex = resistanceItems.findIndex((item, i) => !used.has(i) && item.exerciseId === mention.exercise?.id);
          if(itemIndex < 0) itemIndex = resistanceItems.findIndex((_, i) => !used.has(i));
          if(itemIndex < 0) return;
          used.add(itemIndex);

          const item = resistanceItems[itemIndex];
          const exercise = mention.exercise || (typeof EXERCISES !== 'undefined' ? EXERCISES.find(e => e.id === item.exerciseId) : null);
          if(!exercise) return;

          const sets = parseExerciseSetsV11(exercise, segment);
          if(Array.isArray(sets) && sets.length){
            item.sets = sets;
            item.loadType = exercise.loadType || item.loadType;
          }
        });

        return typeof finalizeSmartParsed === 'function' ? finalizeSmartParsed(parsed) : parsed;
      }catch(err){
        console.warn('LastSet reliability normalization skipped', err);
        return parsed;
      }
    };
    fixed.__lastsetCoreReliabilityV0133 = true;
    try{ parseSmartWorkout = fixed; }catch(_){ }
  }

  if(typeof applySmartCorrection === 'function' && !applySmartCorrection.__lastsetCoreReliabilityV0133){
    const baseApplySmartCorrection = applySmartCorrection;
    const fixed = function(parsed, correction){
      const base = baseApplySmartCorrection(parsed, correction);
      const input = base?.parsed || parsed;
      const extra = applyReliabilityCorrection(input, correction);
      if(extra.changed) return extra;
      return base;
    };
    fixed.__lastsetCoreReliabilityV0133 = true;
    try{ applySmartCorrection = fixed; }catch(_){ }
  }

  document.documentElement.dataset.lastsetCoreReliability = VERSION;
})();
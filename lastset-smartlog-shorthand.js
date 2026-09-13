(() => {
  'use strict';

  const VERSION='0.13.2';

  function parseWeightSetCountShorthand(text){
    const source=String(text||'');
    const match=/\b(\d+(?:\.\d+)?)\s*(kg|kgs?|kilos?|lb|lbs|pounds?)\s*(\d{1,2})\s*[x×]\s*(\d{1,3})\b/i.exec(source);
    if(!match) return null;

    const rawWeight=Number(match[1]);
    const count=Number(match[3]);
    const reps=Number(match[4]);
    if(!Number.isFinite(rawWeight)||rawWeight<0||rawWeight>2200) return null;
    if(!Number.isInteger(count)||count<1||count>20) return null;
    if(!Number.isInteger(reps)||reps<1||reps>500) return null;

    const weightKg=/lb|pound/i.test(match[2])
      ? Math.round(rawWeight*0.453592*10)/10
      : rawWeight;

    return Array.from({length:count},()=>({weightKg,reps,setType:'working'}));
  }

  function parseInlineCardioMetrics(text){
    const source=String(text||'');
    let avgSpeed=null;
    let incline=null;

    const speedMatch=/\b(\d+(?:\.\d+)?)\s*(km\s*\/\s*h|kmh|kph|mph)\b/i.exec(source);
    if(speedMatch){
      const rawSpeed=Number(speedMatch[1]);
      if(Number.isFinite(rawSpeed)&&rawSpeed>0&&rawSpeed<=120){
        avgSpeed=/mph/i.test(speedMatch[2])
          ? Math.round(rawSpeed*1.60934*10)/10
          : rawSpeed;
      }
    }

    const inclineMatch=/(?:\b(\d+(?:\.\d+)?)\s*%\s*(?:incline|grade)\b|\b(?:incline|grade)\s*(?:of|at|was|is)?\s*(\d+(?:\.\d+)?)\s*%?)/i.exec(source);
    if(inclineMatch){
      const rawIncline=Number(inclineMatch[1]||inclineMatch[2]);
      if(Number.isFinite(rawIncline)&&rawIncline>=0&&rawIncline<=50) incline=rawIncline;
    }

    return {avgSpeed,incline};
  }

  if(typeof globalThis!=='undefined'&&globalThis.__LASTSET_TEST_ONLY__){
    globalThis.LastSetSmartLogShorthandTest={parseWeightSetCountShorthand,parseInlineCardioMetrics};
    return;
  }

  if(typeof window==='undefined') return;

  const baseExerciseParser=typeof parseExerciseSetsV11==='function'?parseExerciseSetsV11:null;
  if(baseExerciseParser&&!baseExerciseParser.__lastsetWeightSetCountV0132){
    const fixed=function(exercise,text){
      const shorthand=parseWeightSetCountShorthand(text);
      if(shorthand && exercise?.loadType!=='timed' && exercise?.loadType!=='bodyweight') return shorthand;
      return baseExerciseParser(exercise,text);
    };
    fixed.__lastsetWeightSetCountV0132=true;
    try{ parseExerciseSetsV11=fixed; }catch(_){ }
  }

  const baseGeneralParser=typeof parseSetsEnhanced==='function'?parseSetsEnhanced:null;
  if(baseGeneralParser&&!baseGeneralParser.__lastsetWeightSetCountV0132){
    const fixed=function(text){
      const shorthand=parseWeightSetCountShorthand(text);
      return shorthand||baseGeneralParser(text);
    };
    fixed.__lastsetWeightSetCountV0132=true;
    try{ parseSetsEnhanced=fixed; }catch(_){ }
  }

  const baseCardioParser=typeof parseCardioActivities==='function'?parseCardioActivities:null;
  if(baseCardioParser&&!baseCardioParser.__lastsetInlineCardioMetricsV0132){
    const fixed=function(text){
      const parsed=baseCardioParser(text);
      if(!Array.isArray(parsed)||!parsed.length) return parsed;
      const metrics=parseInlineCardioMetrics(text);
      if(metrics.avgSpeed==null&&metrics.incline==null) return parsed;
      return parsed.map(item=>{
        if(!item||item.kind!=='cardio') return item;
        const next={...item};
        if((next.avgSpeed==null||Number(next.avgSpeed)===0)&&metrics.avgSpeed!=null) next.avgSpeed=metrics.avgSpeed;
        if(next.incline==null&&metrics.incline!=null) next.incline=metrics.incline;
        return next;
      });
    };
    fixed.__lastsetInlineCardioMetricsV0132=true;
    try{ parseCardioActivities=fixed; }catch(_){ }
  }

  document.documentElement.dataset.lastsetSmartlogShorthand=VERSION;
})();

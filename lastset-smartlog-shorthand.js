(() => {
  'use strict';

  const VERSION='0.14.0.2';

  const SPOKEN_NUMBERS=Object.freeze({
    one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
    eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,
    seventeen:17,eighteen:18,nineteen:19,twenty:20
  });

  function spokenNumber(value){
    const raw=String(value??'').toLowerCase().trim();
    if(Object.prototype.hasOwnProperty.call(SPOKEN_NUMBERS,raw)) return SPOKEN_NUMBERS[raw];
    const n=Number(raw);
    return Number.isFinite(n)?n:null;
  }

  function parseWeightSetCountShorthand(text){
    const source=String(text||'').toLowerCase().replace(/,/g,' ').replace(/\s+/g,' ').trim();
    const N='(?:\\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)';
    const U='(?:kg|kgs?|kilos?|lb|lbs|pounds?)';
    const F='(?:\\s+(?:both|each|per|hand|hands|arm|arms|side|sides)){0,5}';

    let match=new RegExp('\\b(\\d+(?:\\.\\d+)?)\\s*('+U+')\\s*('+N+')\\s*[x×]\\s*('+N+')\\b','i').exec(source);
    let rawWeight,unit,count,reps;

    if(match){
      rawWeight=Number(match[1]);unit=match[2];count=spokenNumber(match[3]);reps=spokenNumber(match[4]);
    }else{
      // Natural speech: "55 kg 10 reps three sets"
      match=new RegExp('\\b(\\d+(?:\\.\\d+)?)\\s*('+U+')'+F+'\\s*('+N+')\\s*reps?\\s*(?:for\\s*)?('+N+')\\s*sets?\\b','i').exec(source);
      if(match){
        rawWeight=Number(match[1]);unit=match[2];reps=spokenNumber(match[3]);count=spokenNumber(match[4]);
      }else{
        // Also support "55 kg three sets of 10 reps"
        match=new RegExp('\\b(\\d+(?:\\.\\d+)?)\\s*('+U+')'+F+'\\s*('+N+')\\s*sets?\\s*(?:of|x|×|at)?\\s*('+N+')\\s*(?:reps?)?\\b','i').exec(source);
        if(match){
          rawWeight=Number(match[1]);unit=match[2];count=spokenNumber(match[3]);reps=spokenNumber(match[4]);
        }
      }
    }

    if(!match) return null;
    if(!Number.isFinite(rawWeight)||rawWeight<0||rawWeight>2200) return null;
    if(!Number.isInteger(count)||count<1||count>20) return null;
    if(!Number.isInteger(reps)||reps<1||reps>500) return null;

    const weightKg=/lb|pound/i.test(unit)
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
    globalThis.LastSetSmartLogShorthandTest={spokenNumber,parseWeightSetCountShorthand,parseInlineCardioMetrics};
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

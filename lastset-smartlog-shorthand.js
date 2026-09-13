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

  if(typeof globalThis!=='undefined'&&globalThis.__LASTSET_TEST_ONLY__){
    globalThis.LastSetSmartLogShorthandTest={parseWeightSetCountShorthand};
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

  document.documentElement.dataset.lastsetSmartlogShorthand=VERSION;
})();

/* LastSet Muscle Explorer catalogue expansion v0.29.0.
   Existing IDs and saved workout data remain unchanged. */
(() => {
  'use strict';
  if(typeof EXERCISES==='undefined')return;

  // Ordered primary emphasis is a practical training guide, not muscle-head isolation.
  const additions=[
    ['incline-cable-fly','Incline Cable Fly','Cable',['Upper Chest','Chest','Shoulders'],['incline cable fly','incline cable chest fly']],
    ['low-to-high-cable-fly','Low to High Cable Fly','Cable',['Upper Chest','Chest'],['low to high fly','low to high cable crossover']],
    ['high-to-low-cable-fly','High to Low Cable Fly','Cable',['Chest','Lower Chest'],['high to low fly','high to low cable crossover']],
    ['flat-dumbbell-fly','Flat Dumbbell Fly','Dumbbell',['Chest'],['dumbbell chest fly','flat dumbbell chest fly']],
    ['decline-barbell-bench-press','Decline Barbell Bench Press','Barbell',['Chest','Lower Chest','Triceps'],['decline barbell bench press','decline bench press']],
    ['decline-dumbbell-bench-press','Decline Dumbbell Bench Press','Dumbbell',['Chest','Lower Chest','Triceps'],['decline dumbbell bench press','decline dumbbell press']],
    ['chest-dip','Chest Dip','Bodyweight',['Chest','Lower Chest','Triceps'],['chest dip','forward lean dip','leaning dip']],
    ['single-arm-cable-chest-press','Single Arm Cable Chest Press','Cable',['Chest','Triceps'],['one arm cable chest press','single arm cable press']],
    ['cross-body-hammer-curl','Cross Body Hammer Curl','Dumbbell',['Brachialis','Biceps','Brachioradialis'],['cross body hammer curl','pinwheel curl']],
    ['rope-hammer-curl','Rope Hammer Curl','Cable',['Brachialis','Biceps','Brachioradialis'],['cable rope hammer curl','rope hammer curl']],
    ['high-cable-biceps-curl','High Cable Biceps Curl','Cable',['Biceps','Biceps Short Head'],['high cable curl','double biceps cable curl']],
    ['chin-up','Chin Up','Bodyweight',['Biceps','Back','Lats'],['chin up','chinup','supinated pull up']],
    ['standing-barbell-curl','Standing Barbell Curl','Barbell',['Biceps'],['barbell curl','straight bar curl']],
    ['alternating-dumbbell-curl','Alternating Dumbbell Curl','Dumbbell',['Biceps'],['alternate dumbbell curl','alternating curl']],
    ['zottman-curl','Zottman Curl','Dumbbell',['Biceps','Forearms','Brachioradialis'],['zottman curl']],
    ['drag-curl','Barbell Drag Curl','Barbell',['Biceps','Biceps Long Head'],['drag curl','barbell drag curl']],
    ['dumbbell-preacher-curl','Dumbbell Preacher Curl','Dumbbell',['Biceps','Biceps Short Head'],['single arm preacher curl','dumbbell preacher curl']],
    ['close-grip-bench-press','Close Grip Bench Press','Barbell',['Triceps','Chest','Shoulders'],['close grip bench press','narrow grip bench']],
    ['cable-triceps-kickback','Cable Triceps Kickback','Cable',['Triceps'],['cable kickback','triceps cable kickback']],
    ['dumbbell-triceps-kickback','Dumbbell Triceps Kickback','Dumbbell',['Triceps'],['dumbbell kickback','triceps kickback']],
    ['cross-body-cable-triceps-extension','Cross Body Cable Triceps Extension','Cable',['Triceps','Triceps Lateral Head'],['cross body triceps extension','cross body cable extension']],
    ['ez-bar-overhead-triceps-extension','EZ Bar Overhead Triceps Extension','EZ Bar',['Triceps','Triceps Long Head'],['ez bar overhead triceps extension','ez french press']],
    ['diamond-push-up','Diamond Push Up','Bodyweight',['Triceps','Chest'],['diamond push up','close grip push up']],
    ['arnold-press','Arnold Press','Dumbbell',['Shoulders','Front Delts','Triceps'],['arnold press','arnold shoulder press']],
    ['dumbbell-rear-delt-raise','Dumbbell Rear Delt Raise','Dumbbell',['Rear Delts','Upper Back'],['bent over rear delt raise','reverse dumbbell fly']],
    ['incline-rear-delt-raise','Incline Bench Rear Delt Raise','Dumbbell',['Rear Delts','Upper Back'],['chest supported rear delt raise','incline reverse fly']],
    ['cable-front-raise','Cable Front Raise','Cable',['Shoulders','Front Delts'],['cable front raise']],
    ['landmine-shoulder-press','Landmine Shoulder Press','Barbell',['Shoulders','Front Delts','Triceps'],['landmine press','one arm landmine press']],
    ['t-bar-row','T Bar Row','Barbell',['Back','Upper Back','Lats','Biceps'],['t bar row','landmine row']],
    ['one-arm-dumbbell-row','Single Arm Dumbbell Row','Dumbbell',['Back','Lats','Upper Back','Biceps'],['dumbbell row','single arm dumbbell row','one arm dumbbell row']],
    ['neutral-grip-lat-pulldown','Neutral Grip Lat Pulldown','Cable',['Back','Lats','Biceps'],['close neutral grip pulldown','neutral grip lat pulldown']],
    ['wide-grip-lat-pulldown','Wide Grip Lat Pulldown','Cable',['Back','Lats','Biceps'],['wide grip lat pulldown']],
    ['inverted-row','Inverted Row','Bodyweight',['Back','Upper Back','Biceps'],['inverted row','bodyweight row','australian pull up']],
    ['barbell-shrug','Barbell Shrug','Barbell',['Traps','Upper Back'],['barbell shrug']],
    ['front-squat','Front Squat','Barbell',['Quads','Glutes','Core'],['barbell front squat','front squat']],
    ['dumbbell-step-up','Dumbbell Step Up','Dumbbell',['Quads','Glutes'],['dumbbell step up','weighted step up']],
    ['dumbbell-goblet-squat','Dumbbell Goblet Squat','Dumbbell',['Quads','Glutes','Core'],['goblet squat','dumbbell goblet squat']],
    ['dumbbell-reverse-lunge','Dumbbell Reverse Lunge','Dumbbell',['Quads','Glutes'],['reverse lunge','dumbbell reverse lunge']],
    ['standing-calf-raise','Standing Calf Raise','Machine',['Calves'],['standing calf raise','standing calf raise machine']],
    ['seated-calf-raise','Seated Calf Raise','Machine',['Calves'],['seated calf raise','seated calf raise machine']],
    ['donkey-calf-raise','Donkey Calf Raise','Machine',['Calves'],['donkey calf raise']],
    ['cable-glute-kickback','Cable Glute Kickback','Cable',['Glutes','Hamstrings'],['glute cable kickback','cable kickback glute']],
    ['nordic-hamstring-curl','Nordic Hamstring Curl','Bodyweight',['Hamstrings'],['nordic curl','nordic hamstring curl']],
    ['barbell-good-morning','Barbell Good Morning','Barbell',['Hamstrings','Glutes','Lower Back'],['barbell good morning','good morning']],
    ['reverse-crunch','Reverse Crunch','Bodyweight',['Abs'],['reverse crunch','reverse abdominal crunch']],
    ['ab-wheel-rollout','Ab Wheel Rollout','Other',['Abs','Core'],['ab wheel','ab roller','ab rollout']],
    ['side-plank','Side Plank','Bodyweight',['Obliques','Core'],['side plank']],
    ['cable-woodchop','Cable Woodchop','Cable',['Obliques','Core'],['cable woodchopper','cable wood chop']],
    ['pallof-press','Pallof Press','Cable',['Obliques','Core'],['pallof press','cable anti rotation press']],
    ['bicycle-crunch','Bicycle Crunch','Bodyweight',['Abs','Obliques'],['bicycle crunch']],
    ['dead-bug','Dead Bug','Bodyweight',['Core','Abs'],['dead bug']],
    ['russian-twist','Russian Twist','Bodyweight',['Obliques','Abs'],['russian twist']],
    ['hanging-knee-raise','Hanging Knee Raise','Bodyweight',['Abs','Hip Flexors'],['hanging knee raise']],
    ['decline-sit-up','Decline Sit Up','Bodyweight',['Abs','Hip Flexors'],['decline situp','decline sit up']],
    ['cable-wrist-curl','Cable Wrist Curl','Cable',['Forearms','Wrist Flexors'],['cable wrist curl']],
    ['wrist-roller','Wrist Roller','Other',['Forearms','Wrist Flexors','Wrist Extensors'],['wrist roller','forearm roller']],
    ['plate-pinch-hold','Plate Pinch Hold','Other',['Forearms','Grip'],['plate pinch','plate pinch hold']]
  ];

  const known=new Set(EXERCISES.map(ex=>ex.id));
  let added=0;
  for(const [id,name,equipment,muscles,aliases] of additions){
    if(known.has(id))continue;
    EXERCISES.push({id,name,equipment,muscles:[...muscles],primaryMuscle:muscles[0],
      secondaryMuscles:muscles.slice(1),filterMuscles:[...muscles],aliases:[...aliases],
      movement:'Accessory',loadType:'external'});
    known.add(id);added++;
  }

  // Keep catalogue labels consistent so existing exercises are not hidden from Explorer.
  const general=new Set(['Arms','Legs','Core','Back']);
  for(const ex of EXERCISES){
    ex.muscles=Array.isArray(ex.muscles)?ex.muscles:[];
    ex.secondaryMuscles=Array.isArray(ex.secondaryMuscles)?ex.secondaryMuscles:[];
    ex.filterMuscles=[...new Set([...(ex.filterMuscles||[]),...ex.muscles].filter(Boolean))];
    if(!ex.primaryMuscle || (general.has(ex.primaryMuscle)&&ex.muscles.length)){
      ex.primaryMuscle=ex.muscles[0]||ex.primaryMuscle||'';
    }
  }
  // Explicit anatomical corrections. No previous IDs, set logs or routines are modified.
  const overrides={
    'hammer-curl':{primaryMuscle:'Brachialis',filterMuscles:['Brachialis','Brachioradialis','Biceps','Forearms']},
    'reverse-barbell-curl':{primaryMuscle:'Brachioradialis',filterMuscles:['Brachioradialis','Brachialis','Biceps','Forearms']},
    'assisted-pull-up':{primaryMuscle:'Back',filterMuscles:['Back','Lats','Biceps']},
    'straight-arm-pulldown':{primaryMuscle:'Lats',filterMuscles:['Lats','Back']},
    'reverse-grip-triceps-pushdown':{primaryMuscle:'Triceps',filterMuscles:['Triceps','Triceps Medial Head']}
  };
  for(const ex of EXERCISES){
    const fix=overrides[ex.id];if(!fix)continue;
    ex.primaryMuscle=fix.primaryMuscle;
    ex.filterMuscles=[...new Set([...(ex.filterMuscles||[]),...(fix.filterMuscles||[])])];
  }
  globalThis.LastSetMuscleLibrary=Object.freeze({version:'0.29.0',added,expectedAdditionCount:additions.length});
})();
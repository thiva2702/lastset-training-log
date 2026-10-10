/* LastSet P1/P2 side, region, catalogue and rendering invariants. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const atlasCode=fs.readFileSync('lastset-atlas-regions.js','utf8');
const anatomical={console};
anatomical.globalThis=anatomical;
vm.createContext(anatomical);
vm.runInContext(atlasCode,anatomical);
const atlas=anatomical.LastSetAtlasRegions;
for(const gender of ['male','female']){
  const frames=gender==='male'?atlas.maleHiRes:atlas.femaleHiRes;
  const details=gender==='male'?atlas.maleHiResDetail:atlas.femaleHiResDetail;
  for(const side of ['front','back']){
    const muscles=Object.values(frames[side]).flat().map(x=>x.region);
    if(side==='front'){
      assert(!muscles.includes('Triceps'),gender+' front must not offer triceps');
      assert(muscles.includes('Biceps'),gender+' front needs biceps');
    }else{
      assert(!muscles.includes('Biceps'),gender+' back must not offer biceps');
      assert(muscles.includes('Triceps'),gender+' back needs triceps');
    }
    assert(frames[side].Arms.some(x=>x.region==='Forearms'));
  }
  assert(details.front.Biceps.some(x=>x.region==='Brachialis'));
  assert(details.back.Triceps.some(x=>x.region==='Long Head'));
}
const index=fs.readFileSync('index.html','utf8');
const start=index.indexOf('const EXERCISES = [');
const end=index.indexOf('\n];',start);
assert(start>0&&end>start);
const context={console};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(index.slice(start,end+3),context);
vm.runInContext(fs.readFileSync('lastset-muscle-library.js','utf8'),context);
vm.runInContext('globalThis.OUTPUT=EXERCISES;',context);
const list=context.OUTPUT;
assert.equal(new Set(list.map(x=>x.id)).size,list.length,'Exercise IDs must be unique');
assert(list.length>=127,'Base and supplementary library exercises must load');
assert.equal(context.LastSetMuscleLibrary.added,57);
for(const name of ['Cross Body Hammer Curl','Incline Cable Fly','Close Grip Bench Press',
                  'Standing Calf Raise','Side Plank','Cable Woodchop','T Bar Row',
                  'Reverse Crunch','Seated Calf Raise','EZ Bar Overhead Triceps Extension']){
  assert(list.some(e=>e.name===name),'Missing exercise '+name);
}
context.__LASTSET_TEST_ONLY__=true;
vm.runInContext(fs.readFileSync('lastset-explore.js','utf8'),context);
const T=context.LastSetExploreTest;
for(const side of ['front','back']){
  for(const [group,options] of Object.entries(T.SIDE_REGIONS[side])){
    assert.deepEqual(Array.from(T.focusChoices(group,'',side)),Array.from(options));
  }
}
assert(!T.focusChoices('Arms','', 'front').includes('Triceps'));
assert(!T.focusChoices('Arms','', 'back').includes('Biceps'));
assert(!T.focusChoices('Shoulders','', 'front').includes('Rear Delts'));
assert(!T.focusChoices('Shoulders','', 'back').includes('Front Delts'));
for(const item of ['Biceps','Triceps','Forearms'])
  assert(T.focusChoices('Arms',item,item==='Triceps'?'back':'front').includes('Normal'));
assert.equal(T.resolveFocusMuscle('Biceps','Normal'),'Biceps');
assert.equal(T.resolveFocusMuscle('Triceps','Normal'),'Triceps');
assert(T.exerciseMatchesRegion(list.find(x=>x.id==='incline-cable-fly'),'Chest'));
assert(T.exerciseMatchesRegion(list.find(x=>x.id==='cable-woodchop'),'Obliques'));
assert(T.exerciseMatchesRegion(list.find(x=>x.id==='barbell-good-morning'),'Lower Back'));
assert(T.exerciseMatchesRegion(list.find(x=>x.id==='dumbbell-rear-delt-raise'),'Rear Delts'));
assert(T.exerciseMatchesRegion(list.find(x=>x.id==='close-grip-bench-press'),'Triceps'));
assert(T.rankExploreExercises(list,'Chest').primary.some(x=>x.id==='incline-cable-fly'));
assert(T.rankExploreExercises(list,'Brachialis').primary.some(x=>x.id==='cross-body-hammer-curl'));
assert(T.rankExploreExercises(list,'Triceps').primary.some(x=>x.id==='close-grip-bench-press'));
assert(T.rankExploreExercises(list,'Calves').primary.some(x=>x.id==='seated-calf-raise'));
assert(T.rankExploreExercises(list,'Obliques').primary.some(x=>x.id==='cable-woodchop'));
assert(T.rankExploreExercises(list,'Upper Back').primary.some(x=>x.id==='t-bar-row'));
assert(T.rankExploreExercises(list,'Core').primary.some(x=>x.id==='dead-bug'));
assert.equal(T.equipmentBucket({equipment:'Resistance Band'}),'band');
assert.equal(T.equipmentBucket({equipment:'EZ Bar'}),'free');
assert.equal(T.equipmentBucket({equipment:'Smith Machine'}),'machine');
assert.equal(T.equipmentBucket({equipment:'Kettlebell'}),'free');
assert.equal(T.equipmentBucket({equipment:'Plate Loaded Machine'}),'machine');
assert(T.rankExploreExercises(list,'Biceps','free').primary.some(x=>x.id==='standing-barbell-curl'));
console.log('P1/P2 muscle front/back selection and exercise catalogue checks passed:',list.length,'exercises');

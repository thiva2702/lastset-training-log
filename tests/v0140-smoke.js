const assert=require('assert');
global.__LASTSET_TEST_ONLY__=true;
require('../lastset-v0140.js');
const T=global.LastSetV14Test;
assert(T,'v0.14 test API missing');

assert.equal(
  T.resolveVoiceTranscript('', 'Chest press machine 55 KG 10 reps three sets'),
  'Chest press machine 55 KG 10 reps three sets'
);
assert.equal(
  T.resolveVoiceTranscript('Chest press machine', 'Chest press machine 55 KG 10 reps three sets'),
  'Chest press machine 55 KG 10 reps three sets'
);
assert.equal(
  T.normalizeVoiceTranscript('Dumbbell literal race 10 KG both hand 12 reps three sets'),
  'Dumbbell lateral raise 10 KG both hand 12 reps three sets'
);
const cat=[
{id:'bench',name:'Bench Press',equipment:'Barbell',movement:'Horizontal Press',primaryMuscle:'Chest',muscles:['Chest','Triceps'],loadType:'external',aliases:['bench','barbell bench press']},
{id:'row',name:'Seated Row',equipment:'Machine',movement:'Horizontal Pull',primaryMuscle:'Back',muscles:['Back','Biceps'],loadType:'external',aliases:['machine row','seated cable row']},
{id:'dip',name:'Assisted Dip',equipment:'Machine',movement:'Dip',primaryMuscle:'Triceps',muscles:['Triceps','Chest'],loadType:'assisted',aliases:['assisted dips']}
];
const rows=T.parseCsv('Date,Workout Name,Exercise Name,Set Order,Weight,Weight Unit,Reps\n2026-10-01,Push,Bench Press,1,80,kg,10\n2026-10-01,Push,Bench Press,2,80,kg,8');
assert.equal(rows.length,3);
assert.equal(T.detectCsvFormat(rows[0]),'Strong');
assert.equal(T.parseDateValue('2026-10-01 05:00:00'),'2026-10-01');
assert.equal(T.matchExerciseName('barbell bench press',cat).exerciseId,'bench');
assert.equal(T.matchExerciseName('seated cabel row',cat).exerciseId,'row');
const strong=T.csvPreview('Date,Workout Name,Exercise Name,Set Order,Weight,Weight Unit,Reps\n2026-10-01,Push,Bench Press,1,80,kg,10\n2026-10-01,Push,Unknown Machine,2,40,kg,12',cat);
assert.equal(strong.format,'Strong');
assert.equal(strong.records.length,2);
assert.equal(strong.matchedRows,1);
assert.deepEqual(strong.unmatched,['Unknown Machine']);
const hevy=T.csvPreview('title,start_time,exercise_title,set_index,set_type,weight_kg,reps\nPush,2026-10-02T05:00:00,Bench Press,0,normal,82.5,8',cat);
assert.equal(hevy.format,'Hevy');
assert.equal(hevy.matchedRows,1);
const value={sessions:{},profile:{name:'Tester'}};
const applied=T.applyImport(value,strong,{'Unknown Machine':'row'},cat,{id:'imp1',fileName:'strong.csv',createdAt:1},(()=>{let i=0;return()=>('s'+(++i));})());
assert.equal(applied.sessionCount,1);
assert.equal(value.sessions['2026-10-01'][0].exercises.length,2);
assert.equal(value.sessions['2026-10-01'][0].importId,'imp1');
assert.equal(T.rollbackImport(value,'imp1'),1);
assert.equal(value.sessions['2026-10-01'],undefined);
const histData={sessions:{
'2026-10-01':[{type:'resistance',exercises:[{exerciseId:'bench',name:'Bench Press',sets:[{weight:80,reps:10},{weight:80,reps:8}]}]}],
'2026-10-08':[{type:'resistance',exercises:[{exerciseId:'bench',name:'Bench Press',sets:[{weight:82.5,reps:8}]}]}]
}};
const hist=T.historyForExercise(histData,'bench',cat);
assert.equal(hist.length,2);
assert.equal(T.bestSet(hist[0]).weight,82.5);
const series=T.chartSeries(hist,12);
assert.equal(series[0].value,80);
assert.equal(series[1].value,82.5);
const guide=T.guideForExercise(cat[0]);
assert(guide.action.toLowerCase().includes('press'));
assert(T.formatSetLine({weight:25,reps:10},'assisted').includes('assist'));
console.log('LastSet v0.14 capture/progress/import smoke tests passed');
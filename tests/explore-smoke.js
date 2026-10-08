const assert=require('assert');
global.__LASTSET_TEST_ONLY__=true;
require('../lastset-explore.js');
const T=global.LastSetExploreTest;
assert(T,'Explore test API missing');

assert.equal(T.modelGender({gender:'Female'}),'female');
assert.equal(T.modelGender({gender:'Male'}),'male');
assert.equal(T.modelGender({gender:'Prefer not to say'}),'male');
assert.equal(T.modelGender({}),'male');

const catalogue=[
  {id:'incline',name:'Incline Dumbbell Press',equipment:'Dumbbell',muscles:['Upper Chest','Triceps'],primaryMuscle:'Chest',angle:'Incline',movement:'Horizontal Press'},
  {id:'flat',name:'Bench Press',equipment:'Barbell',muscles:['Chest','Triceps'],primaryMuscle:'Chest',angle:'Flat',movement:'Horizontal Press'},
  {id:'decline',name:'Decline Chest Press Machine',equipment:'Machine',muscles:['Chest','Triceps'],primaryMuscle:'Chest',angle:'Decline',movement:'Horizontal Press'},
  {id:'pulldown',name:'Lat Pulldown',equipment:'Cable',muscles:['Back','Biceps'],primaryMuscle:'Back',movement:'Vertical Pull'},
  {id:'lateral',name:'Dumbbell Lateral Raise',equipment:'Dumbbell',muscles:['Shoulders'],primaryMuscle:'Shoulders',movement:'Shoulder Abduction'},
  {id:'dip',name:'Triceps Dip',equipment:'Bodyweight',muscles:['Triceps','Chest'],primaryMuscle:'Triceps'}
];

assert(T.exerciseMatchesRegion(catalogue[0],'Upper Chest'));
assert(T.exerciseMatchesRegion(catalogue[1],'Mid Chest'));
assert(T.exerciseMatchesRegion(catalogue[2],'Lower Chest'));
assert(T.exerciseMatchesRegion(catalogue[3],'Lats'));
assert(T.exerciseMatchesRegion(catalogue[4],'Side Delts'));
assert(T.exerciseMatchesRegion(catalogue[5],'Lower Chest'));
assert.equal(T.equipmentBucket(catalogue[0]),'dumbbell');
assert.equal(T.equipmentBucket(catalogue[1]),'free');
assert.equal(T.equipmentBucket(catalogue[2]),'machine');
assert.equal(T.equipmentBucket(catalogue[3]),'cable');
assert.equal(T.equipmentBucket(catalogue[5]),'bodyweight');

const upperDb=T.filterExploreExercises(catalogue,'Upper Chest','dumbbell');
assert.deepEqual(upperDb.map(x=>x.id),['incline']);

const db={plans:{}};
assert.equal(T.addExerciseToPlan(db,'2026-10-09','incline',100),true);
assert.deepEqual(db.plans['2026-10-09'].exerciseIds,['incline']);
assert.equal(T.addExerciseToPlan(db,'2026-10-09','incline',101),false);
assert.deepEqual(db.plans['2026-10-09'].exerciseIds,['incline']);
const forearmCatalogue=[
 {id:'hammer',name:'Hammer Curl',equipment:'Dumbbell',muscles:['Biceps','Forearms']},
 {id:'barbell-wrist-curl',name:'Barbell Wrist Curl',equipment:'Barbell',muscles:['Forearms','Wrist Flexors']},
 {id:'reverse-wrist-curl',name:'Reverse Wrist Curl',equipment:'Barbell',muscles:['Forearms','Wrist Extensors']},
 {id:'reverse-barbell-curl',name:'Reverse Barbell Curl',equipment:'Barbell',muscles:['Forearms','Brachioradialis']},
 {id:'farmers-carry',name:'Farmer Carry',equipment:'Dumbbell',muscles:['Forearms']}
];
for(const [region,id] of [['Brachioradialis','hammer'],['Brachioradialis','reverse-barbell-curl'],['Wrist Flexors','barbell-wrist-curl'],['Wrist Extensors','reverse-wrist-curl'],['Other Forearms','farmers-carry']]){
 assert(T.filterExploreExercises(forearmCatalogue,region).some(x=>x.id===id),'Missing forearm region '+region+' '+id);
}
assert(!T.filterExploreExercises(forearmCatalogue,'Wrist Extensors').some(x=>x.id==='barbell-wrist-curl'),'Do not confuse wrist flexion with extension');

assert.deepEqual(T.focusChoices('Arms','Biceps'),['Long Head','Short Head','Brachialis']);
assert.deepEqual(T.focusChoices('Arms','Triceps'),['Long Head','Lateral Head','Medial Head']);
assert.deepEqual(T.focusChoices('Chest','Upper Chest'),['Upper Chest','Mid Chest','Lower Chest']);
const specialists=[
 ['Biceps Long Head','Incline Dumbbell Curl','Biceps'],
 ['Biceps Short Head','Preacher Curl','Biceps'],
 ['Brachialis','Hammer Curl','Biceps'],
 ['Triceps Long Head','Overhead Triceps Extension','Triceps'],
 ['Triceps Lateral Head','Triceps Pushdown','Triceps'],
 ['Triceps Medial Head','Reverse Grip Triceps Pushdown','Triceps']
];
for(const [region,name,muscle] of specialists)assert(T.exerciseMatchesRegion({name,muscles:[muscle]},region),region+' matching failed');
console.log('LastSet Muscle Explorer smoke tests passed');
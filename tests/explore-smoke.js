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
console.log('LastSet Muscle Explorer smoke tests passed');
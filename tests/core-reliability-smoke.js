const assert = require('assert');

const previous = global.__LASTSET_TEST_ONLY__;
global.__LASTSET_TEST_ONLY__ = true;
require('../lastset-core-reliability.js');

const T = global.LastSetCoreReliabilityTest;
assert(T, 'Expected core reliability test helpers');

assert.equal(
  T.stripEffortRepReferences('Bench 80 kg 8 reps, struggled after rep 6'),
  'Bench 80 kg 8 reps,'
);
assert.equal(
  T.stripEffortRepReferences('Leg press 100 kg 10 reps. Form broke after rep 7'),
  'Leg press 100 kg 10 reps.'
);

assert.deepStrictEqual(
  T.parseWeightSetPlan('Leg press 100 for 2 sets', 'external'),
  [
    {weightKg:100,reps:null,setType:'working'},
    {weightKg:100,reps:null,setType:'working'}
  ]
);
assert.deepStrictEqual(
  T.parseWeightSetPlan('Chest press 176 lb for 2 sets of 8 reps', 'external'),
  [
    {weightKg:79.8,reps:8,setType:'working'},
    {weightKg:79.8,reps:8,setType:'working'}
  ]
);
assert.strictEqual(T.parseWeightSetPlan('Pull ups 3 sets of 8', 'bodyweight'), null);
assert.strictEqual(T.parseWeightSetPlan('Plank 3 sets of 45 sec', 'timed'), null);

const catalogue = [
  {id:'press',loadType:'external'},
  {id:'pull',loadType:'bodyweight'},
  {id:'assist',loadType:'assisted'},
  {id:'plank',loadType:'timed'},
  {id:'band',loadType:'band'}
];

assert.strictEqual(T.requiredSmartMissing({
  items:[{kind:'cardio',name:'Running',durationMinutes:20,distanceKm:null,environment:null,incline:null}]
}, catalogue), null);

assert.equal(T.requiredSmartMissing({
  items:[{kind:'cardio',name:'Running',durationMinutes:null,distanceKm:null}]
}, catalogue).type, 'cardio');

assert.strictEqual(T.requiredSmartMissing({
  items:[{kind:'resistance',exerciseId:'pull',name:'Pull Up',sets:[{weightKg:0,reps:8}]}]
}, catalogue), null);

assert.strictEqual(T.requiredSmartMissing({
  items:[{kind:'resistance',exerciseId:'band',name:'Band Row',sets:[{weightKg:null,reps:12}]}]
}, catalogue), null);

assert.equal(T.requiredSmartMissing({
  items:[{kind:'resistance',exerciseId:'press',name:'Press',sets:[{weightKg:80,reps:null},{weightKg:80,reps:null}]}]
}, catalogue).type, 'reps');

assert.equal(T.requiredSmartMissing({
  items:[{kind:'resistance',exerciseId:'assist',name:'Assisted Dip',sets:[{weightKg:null,reps:10}]}]
}, catalogue).type, 'weight');

assert.equal(T.requiredSmartMissing({
  items:[{kind:'resistance',exerciseId:'plank',name:'Plank',sets:[{durationSeconds:0}]}]
}, catalogue).type, 'timed');

const mixed = 'Leg press 100 kg 2 sets of 10 then cycling 15 min level 6';
const cyclingAt = mixed.toLowerCase().indexOf('cycling');
assert.equal(T.firstCardioBoundary(mixed, 0, mixed.length), cyclingAt);

let correction = T.applyReliabilityCorrection({
  items:[{kind:'resistance',name:'Bench Press',sets:[{weightKg:80,reps:10},{weightKg:80,reps:8}]}]
}, 'set 2 was 82.5 kg');
assert.equal(correction.changed, true);
assert.equal(correction.parsed.items[0].sets[1].weightKg, 82.5);

correction = T.applyReliabilityCorrection({
  items:[{kind:'cardio',name:'Running',durationMinutes:20,incline:null}]
}, 'incline was 3%');
assert.equal(correction.parsed.items[0].incline, 3);

correction = T.applyReliabilityCorrection({
  items:[{kind:'cardio',name:'Cycling',durationMinutes:15,resistanceLevel:null}]
}, 'bike level 6');
assert.equal(correction.parsed.items[0].resistanceLevel, 6);

global.__LASTSET_TEST_ONLY__ = previous;
console.log('LastSet core reliability smoke tests passed');

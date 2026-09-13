const assert = require('assert');

const previous = global.__LASTSET_TEST_ONLY__;
global.__LASTSET_TEST_ONLY__ = true;
require('../lastset-smartlog-shorthand.js');

const helpers = global.LastSetSmartLogShorthandTest;
assert(helpers, 'Expected Smart Log shorthand test helpers');

const sets = helpers.parseWeightSetCountShorthand('Bench press 80kg 3x5 rest 120 sec');
assert.deepStrictEqual(sets, [
  { weightKg: 80, reps: 5, setType: 'working' },
  { weightKg: 80, reps: 5, setType: 'working' },
  { weightKg: 80, reps: 5, setType: 'working' }
]);
assert.strictEqual(sets.some((set) => set.weightKg === 120 || set.reps === 120), false);

const lbSets = helpers.parseWeightSetCountShorthand('Bench 176lb 2x8');
assert.strictEqual(lbSets.length, 2);
assert.strictEqual(lbSets[0].weightKg, 79.8);
assert.strictEqual(lbSets[0].reps, 8);

assert.strictEqual(helpers.parseWeightSetCountShorthand('rest 120 sec'), null);
assert.strictEqual(helpers.parseWeightSetCountShorthand('80kg 0x5'), null);

assert.deepStrictEqual(
  helpers.parseInlineCardioMetrics('treadmill 20 min 8 km/h 3% incline'),
  { avgSpeed: 8, incline: 3 }
);
assert.deepStrictEqual(
  helpers.parseInlineCardioMetrics('run 20 min at 6 mph incline 2%'),
  { avgSpeed: 9.7, incline: 2 }
);
assert.deepStrictEqual(
  helpers.parseInlineCardioMetrics('cycling 30 min'),
  { avgSpeed: null, incline: null }
);

global.__LASTSET_TEST_ONLY__ = previous;
console.log('LastSet Smart Log shorthand smoke tests passed');

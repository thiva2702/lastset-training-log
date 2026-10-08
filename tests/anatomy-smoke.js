const assert=require('assert');
delete global.LastSetAnatomy;
require('../lastset-anatomy.js');
const atlas=global.LastSetAnatomy;
assert(atlas,'Atlas renderer missing');
assert.equal(atlas.version,'0.15.0');
assert.deepEqual(atlas.frontGroups.sort(),['Arms','Chest','Core','Legs','Shoulders'].sort());
assert.deepEqual(atlas.backGroups.sort(),['Arms','Back','Legs','Shoulders'].sort());
for(const gender of ['male','female']){
  for(const side of ['front','back']){
    const html=atlas.render({side,gender,activeGroup:side==='front'?'Chest':'Back'});
    assert(html.includes('viewBox="0 0 300 596"'));
    assert(html.includes('ls-anatomy-premium'));
    assert(html.includes('role="button" tabindex="0"'));
    assert(html.includes('aria-label="Explore '));
    assert(html.includes('ls-atlas-segment'));
    assert(html.includes('ls-atlas-figure'));
    assert(!html.includes('NaN'));
    assert.equal((html.match(/<svg/g)||[]).length,1);
    assert.equal((html.match(/<\/svg>/g)||[]).length,1);
    assert.equal((html.match(/class="ls-muscle-hit /g)||[]).length,side==='front'?5:4);
    assert.equal((html.match(/class="ls-muscle-hit ls-atlas-group active"/g)||[]).length,1);
    for(const group of (side==='front'?atlas.frontGroups:atlas.backGroups))
      assert(html.includes('data-explore-group="'+group+'"'),group+' not clickable');
    assert(!/<rect[^>]+rx="13"/.test(html),'Old stickman arm shape should not remain');
  }
}
const unknown=atlas.render({side:'sideways',gender:'other',activeGroup:'Unknown'});
assert(unknown.includes('male'));
assert(unknown.includes('front'));
assert(!unknown.includes('ls-atlas-group active'));
console.log('Premium anatomy SVG interaction smoke tests passed');
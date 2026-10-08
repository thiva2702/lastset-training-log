const assert=require('assert');
delete global.LastSetAnatomy;
require('../lastset-atlas-regions.js');
require('../lastset-anatomy.js');
const atlas=global.LastSetAnatomy;
assert(atlas,'Atlas renderer missing');
assert.equal(atlas.version,'0.22.0');
assert.deepEqual(atlas.frontGroups.sort(),['Arms','Chest','Core','Legs','Shoulders'].sort());
assert.deepEqual(atlas.backGroups.sort(),['Arms','Back','Legs','Shoulders'].sort());
for(const gender of ['male','female']){
  for(const side of ['front','back']){
    const html=atlas.render({side,gender,activeGroup:side==='front'?'Chest':'Back'});
    assert(html.includes('viewBox="0 0 '+(gender==='male'?(side==='front'?346:356)+' 631':'300 596')+'"'));
    assert(html.includes('ls-anatomy-premium'));
    assert(html.includes('role="button" tabindex="0"'));
    assert(html.includes('aria-label="Explore '));
    assert(html.includes('ls-atlas-segment'));
    if(gender==='male')assert(html.includes('/assets/anatomy-'+side+'.webp'));
    if(gender==='female')assert(!html.includes('ls-realistic-anatomy'));
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
assert(atlas.render({side:'front',gender:'male'}).includes('ls-central-chest-target'));
assert(atlas.render({side:'back',gender:'male'}).includes('ls-central-back-target'));
for(const [side,regions] of Object.entries({front:['Biceps','Forearms','Upper Chest','Mid Chest','Lower Chest','Quads','Calves','Abs'],back:['Triceps','Forearms','Lats','Glutes','Hamstrings','Calves']})){
  const html=atlas.render({side,gender:'male'});
  for(const region of regions)assert(html.includes('data-anatomy-region="'+region+'"'),'No photographic tap region: '+side+' '+region);
}
assert(!atlas.render({side:'front',gender:'female'}).includes('data-anatomy-region="Forearms"'),'Keep existing female atlas geometry unchanged');
const biceps=atlas.render({side:'front',gender:'male',activeGroup:'Arms',activeRegion:'Biceps'});
assert.equal((biceps.match(/ls-region-selected/g)||[]).length,2);
const forearms=atlas.render({side:'front',gender:'male',activeGroup:'Arms',activeRegion:'Forearms'});
assert.equal((forearms.match(/ls-region-selected/g)||[]).length,4);
const unknown=atlas.render({side:'sideways',gender:'other',activeGroup:'Unknown'});
assert(unknown.includes('male'));
assert(unknown.includes('front'));
assert(!unknown.includes('ls-atlas-group active'));
console.log('Premium anatomy SVG interaction smoke tests passed');
for(const side of ['front','back']){
  const html=atlas.render({side,gender:'male'});
  assert(html.includes('ls-atlas-visual'),'Visible color overlay missing');
  assert(html.includes('ls-atlas-hit'),'Separate touch hit paths missing');
  assert(html.includes('width="'+(side==='front'?346:356)+'" height="631"'),'Anatomy photo stretched away from source pixels');
  assert(!html.includes('preserveAspectRatio="none"'),'Photo should not be stretched');
  assert(html.includes('translate('+(side==='front'?346:356)+' 0) scale(-1 1)'),'Mirrored mapping must use the real image width');
}

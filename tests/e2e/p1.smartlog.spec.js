const {test,expect}=require('@playwright/test');
const KEY='lastset-data-v1';
async function start(page){
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#ls-onboard-name')).toBeVisible();
  await page.locator('#ls-onboard-name').fill('Smart Log P1 Test');
  await page.locator('[data-onboard-save]').click();
  await expect(page.locator('.ls-onboard-finish')).toBeVisible();
  await page.locator('[data-start="day"]').click();
  await expect(page.locator('.bottom-nav')).toBeVisible();
  await page.locator('[data-day-action="describe"]').first().click();
  await expect(page.locator('#ai-text')).toBeVisible();
}
async function parse(page,phrase){
  await page.locator('#ai-text').fill(phrase);
  await page.locator('[data-action="parse-ai"]').click();
  await expect(page.locator('.ls-p1-review')).toBeVisible({timeout:12000});
}
async function records(page){
  return page.evaluate(key=>JSON.parse(localStorage.getItem(key)).sessions,key);
}
function resistance(sessions){return Object.values(sessions||{}).flat().find(s=>s.type==='resistance')}
test.describe('P1 progressive Smart Log end-to-end',()=>{
  test('every bench set persists after full reload',async({page})=>{
    await start(page);
    await parse(page,'Bench press 80kg for 8, then 85kg for 6 and 5');
    console.log('P1 parsed debug:',JSON.stringify(await page.evaluate(()=>({
      p1Loaded:document.documentElement.dataset.lastsetSmartLogP1,
      items:state.aiParsed?.items?.map(it=>({name:it.name,id:it.exerciseId,p1Source:it.p1Source,sets:it.sets,warnings:it.p1Warnings,diag:it.p1Diag,loadType:it.loadType})),
      mentions:findExerciseMentions('Bench press 80kg for 8, then 85kg for 6 and 5').map(m=>({name:m.exercise?.name,start:m.start,end:m.end,alias:m.alias}))
    }))));
    await expect(page.locator('.ls-p1-set')).toHaveCount(3);
    for(const [i,w,r] of [[0,'80','8'],[1,'85','6'],[2,'85','5']]){
      await expect(page.locator('[data-p1-weight="0:'+i+'"]')).toHaveValue(w);
      await expect(page.locator('[data-p1-reps="0:'+i+'"]')).toHaveValue(r);
    }
    await expect(page.locator('[data-action="confirm-ai-workout"]')).toBeEnabled();
    await page.locator('[data-action="confirm-ai-workout"]').click();
    await expect(page.locator('.session-card')).toContainText('85 kg');
    let session=resistance(await records(page));
    expect(session.exercises[0].sets.map(s=>[s.weight,s.reps])).toEqual([[80,8],[85,6],[85,5]]);
    await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.locator('.bottom-nav')).toBeVisible();
    session=resistance(await records(page));
    expect(session.exercises[0].sets.map(s=>[s.weight,s.reps])).toEqual([[80,8],[85,6],[85,5]]);
  });
  test('editing the second weight changes the saved set, not the original',async({page})=>{
    await start(page);
    await parse(page,'Bench press 80kg for 8, then 85kg for 6 and 5');
    await page.locator('[data-p1-weight="0:1"]').fill('87.5');
    await page.locator('[data-p1-weight="0:1"]').blur();
    await expect(page.locator('[data-p1-weight="0:1"]')).toHaveValue('87.5');
    await page.locator('[data-action="confirm-ai-workout"]').click();
    const session=resistance(await records(page));
    expect(session.exercises[0].sets.map(s=>[s.weight,s.reps])).toEqual([[80,8],[87.5,6],[85,5]]);
    expect(session.exercises[0].note).toContain('Original Smart Log:');
  });
  test('an unknown AMRAP count cannot be saved without explicit review',async({page})=>{
    await start(page);
    await parse(page,'Overhead press 60x5 then 55 amrap');
    await expect(page.locator('.ls-p1-set')).toHaveCount(2);
    await expect(page.locator('[data-action="confirm-ai-workout"]')).toBeDisabled();
    await page.locator('[data-p1-reps="0:1"]').fill('7');
    await page.locator('[data-p1-reps="0:1"]').blur();
    await expect(page.locator('[data-action="confirm-ai-workout"]')).toBeDisabled();
    await page.locator('[data-p1-ack="0"]').check();
    await expect(page.locator('[data-action="confirm-ai-workout"]')).toBeEnabled();
    await page.locator('[data-action="confirm-ai-workout"]').click();
    const session=resistance(await records(page));
    expect(session.exercises[0].sets.map(s=>[s.weight,s.reps])).toEqual([[60,5],[55,7]]);
  });
  test('compound plus accessory descriptions keep all exercises',async({page})=>{
    await start(page);
    await parse(page,'Bench press 80kg for 8, then 85kg for 6 and 5. Incline dumbbell press 30kg 3x10. Cable fly 15kg 3 sets of 12');
    await expect(page.locator('.ls-p1-card')).toHaveCount(3);
    await expect(page.locator('.ls-p1-set')).toHaveCount(9);
    await expect(page.locator('[data-action="confirm-ai-workout"]')).toBeEnabled();
    await page.locator('[data-action="confirm-ai-workout"]').click();
    const session=resistance(await records(page));
    expect(session.exercises.length).toBe(3);
    expect(session.exercises.map(e=>e.sets.length)).toEqual([3,3,3]);
    expect(session.exercises[0].sets.map(s=>[s.weight,s.reps])).toEqual([[80,8],[85,6],[85,5]]);
  });
});
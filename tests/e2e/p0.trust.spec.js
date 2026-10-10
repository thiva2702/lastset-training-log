const {test,expect}=require('@playwright/test');
const KEY='lastset-data-v1',USERS='lastset-user-spaces-v1';
async function fresh(page){
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#ls-onboard-name')).toBeVisible();
  await page.locator('#ls-onboard-name').fill('P0 QA');
  await page.locator('[data-onboard-save]').click();
  await expect(page.locator('.ls-onboard-finish')).toBeVisible();
  await page.locator('[data-start="day"]').click();
  await expect(page.locator('.bottom-nav')).toBeVisible();
}
async function stored(page,key=KEY){
  return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
}
test.describe('Phase 0 local-first data trust',()=>{
  test('three progressive manual sets survive reload unchanged',async({page})=>{
    await fresh(page);
    await page.locator('[data-day-action="resistance"]').first().click();
    await expect(page.locator('#exercise-search')).toBeVisible();
    await page.locator('[data-exercise="chest-press"]').click();
    await expect(page.locator('[data-set-weight="0"]')).toBeVisible();
    await page.locator('[data-set-weight="0"]').fill('80');
    await page.locator('[data-set-reps="0"]').fill('8');
    await page.locator('[data-action="add-set"]').click();
    await page.locator('[data-set-weight="1"]').fill('85');
    await page.locator('[data-set-reps="1"]').fill('6');
    await page.locator('[data-action="add-set"]').click();
    await page.locator('[data-set-weight="2"]').fill('85');
    await page.locator('[data-set-reps="2"]').fill('5');
    await page.locator('[data-action="save-exercise"]').click();
    await page.waitForFunction(key=>Object.values(JSON.parse(localStorage.getItem(key)||'{}').sessions||{}).flat().some(s=>s.type==='resistance'),KEY);
    const original=await stored(page);
    const session=Object.values(original.sessions).flat().find(s=>s.type==='resistance');
    expect(session.exercises[0].sets.map(s=>[Number(s.weight),Number(s.reps)])).toEqual([[80,8],[85,6],[85,5]]);
    await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.locator('.bottom-nav')).toBeVisible();
    const reopened=await stored(page);
    expect(reopened.sessions).toEqual(original.sessions);
    const reg=await stored(page,USERS);
    const active=reg.users.find(u=>u.id===reg.activeId);
    expect(active.data.sessions).toEqual(original.sessions);
  });
  test('backup restores into new profile without overwriting newer workouts',async({page})=>{
    await fresh(page);
    const before=await stored(page);
    const backup={sessions:{'2026-10-01':[{type:'resistance',exercises:[{exerciseId:'chest-press',sets:[{weight:80,reps:8},{weight:85,reps:6},{weight:85,reps:5}]}]}]},profile:{name:'Recovered Lifter',weightUnit:'kg'},templates:[{id:'push',name:'Push Day',exerciseIds:['chest-press']}]};
    await page.locator('.bottom-nav [data-nav="profile"]').click();
    await expect(page.locator('[data-backup-input]')).toHaveCount(1);
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('[data-backup-input]').setInputFiles({name:'my-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
    await expect.poll(async()=>{const r=await stored(page,USERS);return r.users.filter(u=>u.name==='Recovered Lifter').length;}).toBe(1);
    const current=await stored(page);
    expect(current.sessions).toEqual(before.sessions);
    const reg=await stored(page,USERS);
    expect(reg.activeId).toBe(before.profile.userId);
    expect(reg.users.find(u=>u.name==='Recovered Lifter').data.sessions).toEqual(backup.sessions);
    await page.reload();
    expect((await stored(page,USERS)).users.find(u=>u.name==='Recovered Lifter')).toBeTruthy();
    await page.locator('.bottom-nav [data-nav="profile"]').click();
    await page.locator('[data-backup-input]').setInputFiles({name:'damaged.json',mimeType:'application/json',buffer:Buffer.from('{"sessions":{"oops":[null]}}')});
    await page.waitForTimeout(100);
    expect((await stored(page,USERS)).users.length).toBe(reg.users.length);
    expect((await stored(page)).sessions).toEqual(before.sessions);
  });
  test('offline reload keeps confirmed training records intact',async({page,context})=>{
    await fresh(page);
    await page.locator('[data-day-action="resistance"]').first().click();
    await page.locator('[data-exercise="chest-press"]').click();
    await page.locator('[data-set-weight="0"]').fill('80');
    await page.locator('[data-set-reps="0"]').fill('8');
    await page.locator('[data-action="save-exercise"]').click();
    const before=await stored(page);
    await page.waitForFunction(async()=>{
      if(!navigator.serviceWorker)return false;
      const keys=await caches.keys();
      if(!keys.some(key=>key.startsWith('lastset-v1-beta1')))return false;
      return !!(await caches.match(new URL('/index.html',location.origin).href));
    },null,{timeout:30000});
    await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.locator('.bottom-nav')).toBeVisible();
    await context.setOffline(true);
    try{
      await page.reload({waitUntil:'domcontentloaded',timeout:20000});
      await expect(page.locator('.bottom-nav')).toBeVisible({timeout:10000});
      expect((await stored(page)).sessions).toEqual(before.sessions);
    }finally{
      await context.setOffline(false);
    }
  });
  test('quota failure shows emergency backup and does not claim the workout saved',async({page})=>{
    await fresh(page);
    const before=await stored(page);
    await page.locator('[data-day-action="resistance"]').first().click();
    await page.locator('[data-exercise="chest-press"]').click();
    await page.locator('[data-set-weight="0"]').fill('80');
    await page.locator('[data-set-reps="0"]').fill('8');
    await page.evaluate(()=>{
      const orig=Storage.prototype.setItem;
      Storage.prototype.setItem=function(key,value){
        if(key==='lastset-data-v1'||key==='lastset-user-spaces-v1')throw new DOMException('Quota exceeded','QuotaExceededError');
        return orig.call(this,key,value);
      };
    });
    await page.locator('[data-action="save-exercise"]').click();
    await expect(page.locator('#ls-save-failure')).toBeVisible();
    await expect(page.locator('#ls-save-failure')).toContainText('Workout NOT saved');
    const after=await stored(page);
    expect(after.sessions).toEqual(before.sessions);
  });
});

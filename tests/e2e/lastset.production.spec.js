const { test, expect } = require('@playwright/test');

const DATA_KEY = 'lastset-data-v1';
const USERS_KEY = 'lastset-user-spaces-v1';

async function cleanStart(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    if ('caches' in window) {
      for (const key of await caches.keys()) await caches.delete(key);
    }
    if ('serviceWorker' in navigator) {
      for (const reg of await navigator.serviceWorker.getRegistrations()) await reg.unregister();
    }
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.bottom-nav')).toBeVisible();
  await expect(page.locator('[data-nav="day"]')).toBeVisible();
  await page.waitForFunction(() => document.documentElement.dataset.lastsetNavigation === '0.13.1');
}

async function storedData(page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, DATA_KEY);
}

async function registryData(page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, USERS_KEY);
}

async function waitForSessionType(page, type) {
  await page.waitForFunction(({ key, type }) => {
    try {
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : null;
      return Object.values(data?.sessions || {}).flat().some((session) => session?.type === type);
    } catch (_) {
      return false;
    }
  }, { key: DATA_KEY, type });
}

async function todayIso(page) {
  return page.evaluate(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
}

async function goToday(page) {
  await page.locator('[data-nav="day"]').click();
  await expect(page.locator('[data-day-action="resistance"]').first()).toBeVisible();
}

async function goProfile(page) {
  await page.locator('[data-nav="profile"]').click();
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
}

async function openExercise(page, exerciseId) {
  await goToday(page);
  await page.locator('[data-day-action="resistance"]').first().click();
  await expect(page.locator('#exercise-search')).toBeVisible();
  await page.locator(`[data-exercise="${exerciseId}"]`).click();
  await expect(page.locator('[data-action="save-exercise"]')).toBeVisible();
}

async function logExternalExercise(page, exerciseId, weight, reps) {
  await openExercise(page, exerciseId);
  await page.locator('[data-set-weight="0"]').fill(String(weight));
  await page.locator('[data-set-reps="0"]').fill(String(reps));
  await page.locator('[data-action="save-exercise"]').click();
  await waitForSessionType(page, 'resistance');
  await expect(page.locator('[data-day-action="describe"]')).toBeVisible();
}

async function createUserKeepingCurrent(page, name) {
  await goProfile(page);
  await page.locator('[data-profile-manage-users]').click();
  await expect(page.locator('[data-user-new]')).toBeVisible();
  await page.locator('[data-user-new]').click();
  await expect(page.locator('#ls-new-user-name')).toBeVisible();
  await page.locator('#ls-new-user-name').fill(name);
  await page.locator('[data-new-keep]').click();
  await expect(page.locator('[data-nav="day"]')).toBeVisible();
}

async function switchUser(page, name) {
  await goProfile(page);
  await page.locator('[data-profile-manage-users]').click();
  const row = page.locator('.ls-user-row').filter({ hasText: name });
  await expect(row).toBeVisible();
  await row.locator('[data-user-switch]').click();
  await expect(page.locator('[data-nav="day"]')).toBeVisible();
}

async function saveProfileValues(page, { displayName, bodyWeight, height, gender } = {}) {
  await goProfile(page);
  if (displayName != null) await page.locator('#profile-name').fill(String(displayName));
  if (bodyWeight != null) await page.locator('#profile-bodyweight').fill(String(bodyWeight));
  if (height != null) await page.locator('#profile-height').fill(String(height));
  if (gender != null) await page.locator('#profile-gender').selectOption(gender);
  await page.locator('[data-action="save-profile"]').click();
  await expect(page.locator('.toast')).toContainText('Profile saved');
}

async function runSmartLog(page, text, expectedType) {
  await goToday(page);
  await page.locator('[data-day-action="describe"]').click();
  await expect(page.locator('#ai-text')).toBeVisible();
  await page.locator('#ai-text').fill(text);
  await page.locator('[data-action="parse-ai"]').click();
  await expect(page.locator('[data-action="confirm-ai-workout"]')).toBeVisible({ timeout: 8_000 });
  await page.locator('[data-action="confirm-ai-workout"]').click();
  await waitForSessionType(page, expectedType);
  await expect(page.locator('[data-day-action="describe"]')).toBeVisible();
}

test.describe('LastSet production v0.13.1', () => {
  test.beforeEach(async ({ page }) => {
    await cleanStart(page);
  });

  test('fresh browser data is clean and Today is a top level destination without Back', async ({ page }) => {
    let data = await storedData(page);
    expect(data).toBeTruthy();
    expect(Object.keys(data.sessions || {})).toHaveLength(0);

    await goToday(page);
    await expect(page.locator('[data-nav="day"]')).toHaveClass(/active/);
    await expect(page.locator('[data-action="back"]')).toHaveCount(0);

    data = await storedData(page);
    expect(Object.keys(data.sessions || {})).toHaveLength(0);
  });

  test('Calendar to today uses genuine app Back and returns to Calendar', async ({ page }) => {
    await page.locator('[data-nav="calendar"]').click();
    await expect(page.locator('.calendar-grid')).toBeVisible();

    const iso = await todayIso(page);
    await page.locator(`[data-date="${iso}"]`).click();
    await expect(page.locator('[data-action="back"]')).toBeVisible();

    await page.locator('[data-action="back"]').click();
    await expect(page.locator('.calendar-grid')).toBeVisible();
    await expect(page.locator('[data-nav="calendar"]')).toHaveClass(/active/);
  });

  test('nested Calendar workout navigation unwinds day by day', async ({ page }) => {
    await page.locator('[data-nav="calendar"]').click();
    const iso = await todayIso(page);
    await page.locator(`[data-date="${iso}"]`).click();

    await page.locator('[data-day-action="resistance"]').first().click();
    await expect(page.locator('#exercise-search')).toBeVisible();
    await page.locator('[data-exercise="chest-press"]').click();
    await expect(page.locator('[data-action="save-exercise"]')).toBeVisible();

    await page.locator('[data-action="back"]').click();
    await expect(page.locator('#exercise-search')).toBeVisible();

    await page.locator('[data-action="back"]').click();
    await expect(page.locator('[data-day-action="resistance"]').first()).toBeVisible();

    await page.locator('[data-action="back"]').click();
    await expect(page.locator('.calendar-grid')).toBeVisible();
  });

  test('top right profile shortcut opens Profile directly', async ({ page }) => {
    await expect(page.locator('[data-action="profile-top"]')).toBeVisible();
    await page.locator('[data-action="profile-top"]').click();
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
    await expect(page.locator('[data-action="back"]')).toHaveCount(0);
  });

  test('equipment filters and aliases find the new v0.13.0 exercise variants', async ({ page }) => {
    await goToday(page);
    await page.locator('[data-day-action="resistance"]').first().click();

    await page.locator('#equipment-filter').selectOption({ label: 'EZ Bar' });
    await page.locator('#exercise-search').fill('easy curl bar');
    await expect(page.locator('[data-exercise-row="ez-bar-curl"]')).toBeVisible();

    await page.locator('#exercise-search').fill('kb squat');
    await page.locator('#equipment-filter').selectOption({ label: 'Kettlebell' });
    await expect(page.locator('[data-exercise-row="kettlebell-goblet-squat"]')).toBeVisible();

    await page.locator('#exercise-search').fill('band pull up');
    await page.locator('#equipment-filter').selectOption({ label: 'Resistance Band' });
    await expect(page.locator('[data-exercise-row="band-assisted-pull-up"]')).toBeVisible();
  });

  test('negative resistance weight is blocked and does not create history', async ({ page }) => {
    await openExercise(page, 'chest-press');
    await page.locator('[data-set-weight="0"]').fill('-100');
    await page.locator('[data-set-reps="0"]').fill('10');
    await page.locator('[data-action="save-exercise"]').click();

    await expect(page.locator('.toast')).toContainText('Weight looks invalid');
    const data = await storedData(page);
    expect(Object.keys(data.sessions || {})).toHaveLength(0);
  });

  test('Smart Log ignores rest 120 sec as a load and records bench 80 kg 3x5', async ({ page }) => {
    await runSmartLog(page, 'Bench press 80kg 3x5 rest 120 sec', 'resistance');

    const data = await storedData(page);
    const sessions = Object.values(data.sessions || {}).flat();
    const resistance = sessions.find((s) => s.type === 'resistance');
    expect(resistance).toBeTruthy();

    const item = resistance.exercises.find((e) => /bench/i.test(e.name || '') || /bench/.test(e.exerciseId || ''));
    expect(item).toBeTruthy();
    expect(item.sets).toHaveLength(3);
    expect(item.sets.map((s) => Number(s.weight))).toEqual([80, 80, 80]);
    expect(item.sets.map((s) => Number(s.reps))).toEqual([5, 5, 5]);
    expect(item.sets.some((s) => Number(s.weight) === 120 || Number(s.reps) === 120)).toBeFalsy();
  });

  test('Smart Log keeps treadmill speed and incline separate from distance', async ({ page }) => {
    await runSmartLog(page, 'treadmill 20 min 8 km/h 3% incline', 'cardio');

    const data = await storedData(page);
    const sessions = Object.values(data.sessions || {}).flat();
    const cardio = sessions.find((s) => s.type === 'cardio');
    expect(cardio).toBeTruthy();
    expect(Number(cardio.duration)).toBe(20);
    expect(Number(cardio.avgSpeed)).toBe(8);
    expect(Number(cardio.incline)).toBe(3);
    expect(Number(cardio.distance || 0)).toBe(0);
  });

  test('starting a Saved Workout from Profile creates a plan, not completed history', async ({ page }) => {
    await goProfile(page);
    await page.locator('[data-open-saved-workouts]').click();
    await expect(page.getByRole('heading', { name: 'Saved Workouts' })).toBeVisible();

    await page.locator('[data-workout-create]').first().click();
    await page.locator('#ls-workout-name').fill('QA Push');
    await page.locator('#ls-workout-search').fill('Chest Press');
    await page.locator('[data-add="chest-press"]').click();
    await page.locator('[data-builder-save]').click();

    const card = page.locator('.ls-workout-card').filter({ hasText: 'QA Push' });
    await expect(card).toBeVisible();
    await card.locator('[data-template-start]').click();
    await expect(page.locator('[data-day-action="resistance"]').first()).toBeVisible();

    const iso = await todayIso(page);
    const data = await storedData(page);
    expect(Object.keys(data.sessions || {})).toHaveLength(0);
    expect(data.plans?.[iso]?.exerciseIds || []).toContain('chest-press');
  });

  test('two test users keep bodyweight and workout history isolated', async ({ page }) => {
    await createUserKeepingCurrent(page, 'QA User A');
    await saveProfileValues(page, { displayName: 'Alpha', bodyWeight: 70, height: 175, gender: 'male' });
    await logExternalExercise(page, 'chest-press', 50, 10);

    await createUserKeepingCurrent(page, 'QA User B');
    await goProfile(page);
    await expect(page.locator('#profile-bodyweight')).toHaveValue('');
    let data = await storedData(page);
    expect(Object.keys(data.sessions || {})).toHaveLength(0);

    await saveProfileValues(page, { displayName: 'Beta', bodyWeight: 95, height: 182, gender: 'prefer_not_to_say' });

    await switchUser(page, 'QA User A');
    await goProfile(page);
    await expect(page.locator('.ls-profile-identity strong')).toHaveText('QA User A');
    await expect(page.locator('#profile-bodyweight')).toHaveValue('70');
    data = await storedData(page);
    expect(Object.keys(data.sessions || {}).length).toBeGreaterThan(0);

    await switchUser(page, 'QA User B');
    await goProfile(page);
    await expect(page.locator('.ls-profile-identity strong')).toHaveText('QA User B');
    await expect(page.locator('#profile-bodyweight')).toHaveValue('95');
    data = await storedData(page);
    expect(Object.keys(data.sessions || {})).toHaveLength(0);

    const registry = await registryData(page);
    expect(registry.users.filter((u) => /QA User [AB]/.test(u.name || '')).length).toBe(2);
  });
});

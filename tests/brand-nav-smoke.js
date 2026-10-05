const fs=require('fs');
const assert=require('assert');

const js=fs.readFileSync('lastset-brand.js','utf8');
const css=fs.readFileSync('lastset-brand.css','utf8');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
const index=fs.readFileSync('index.html','utf8');
const build=fs.readFileSync('build-cloudflare.sh','utf8');
const worker=fs.readFileSync('worker.js','utf8');
const serviceWorker=fs.readFileSync('service-worker.js','utf8');

assert.ok(fs.existsSync('assets/lastset-mark.svg'),'Progression brand mark is missing');
assert.ok(fs.existsSync('apple-touch-icon.png'),'Apple touch icon is missing');
assert.ok(js.includes("const VERSION = '0.13.9'"),'Brand module version missing');
assert.ok(js.includes('Remember today. Build tomorrow.'),'Header tagline missing');
assert.ok(js.includes('data-nav="profile"'),'Header profile button must navigate to Profile');
assert.ok(js.includes("navButtonBrand('calendar','Calendar')"),'Calendar nav missing');
assert.ok(js.includes("navButtonBrand('day','Today')"),'Today nav missing');
assert.ok(js.includes("navButtonBrand('progress','Progress')"),'Progress nav missing');
assert.ok(js.includes("navButtonBrand('profile','Profile')"),'Profile nav missing');
assert.ok(!js.includes('📅')&&!js.includes('📊')&&!js.includes('👤'),'Brand navigation must not use emoji icons');
assert.ok(css.includes('env(safe-area-inset-top,0px)')||css.includes('env(safe-area-inset-top, 0px)'),'Top safe area must remain supported');
assert.ok(css.includes('env(safe-area-inset-bottom,0px)')||css.includes('env(safe-area-inset-bottom, 0px)'),'Bottom safe area must remain supported');
assert.ok(css.includes('padding-bottom:calc(152px'),'Scrollable content needs clearance above fixed navigation');
assert.ok(css.includes('.ls-brand-nav .nav-btn.active'),'Branded active navigation state missing');
assert.ok(manifest.icons.some(x=>x.src==='assets/lastset-mark.svg'),'Manifest must include the progression mark');
assert.ok(index.includes('apple-touch-icon.png'),'Index must use the branded Apple touch icon');
assert.ok(build.includes('lastset-brand.css')&&build.includes('lastset-brand.js'),'Production build must include brand layer');
assert.ok(worker.includes('lastset-brand.css')&&worker.includes('lastset-brand.js'),'Worker must inject brand layer');
assert.ok(serviceWorker.includes('lastset-brand.css')&&serviceWorker.includes('lastset-brand.js'),'Service worker must inject brand layer');

console.log('LastSet brand and navigation smoke tests passed');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sw=fs.readFileSync('service-worker.js','utf8');
const worker=fs.readFileSync('worker.js','utf8');
const build=fs.readFileSync('build-cloudflare.sh','utf8');
const stamp=fs.readFileSync('scripts/stamp-release.mjs','utf8');
const boot=fs.readFileSync('index.html','utf8');
assert(worker.includes('lastset-build.json'),'Worker must obtain release identity');
assert(worker.includes('stampExternalAssets'),'Server HTML must version every JS/CSS tag');
assert(worker.includes('lastset-diagnostics.js'),'Diagnostic script must be injected before app boot');
assert(worker.includes('no-store'),'Navigation must bypass HTTP cache');
assert(sw.includes('__LASTSET_BUILD_ID__'),'Offline cache must be keyed to release');
assert(sw.includes('staticResponse'),'Offline asset handler must be installed');
assert(sw.includes("networkFirstAsset"),'JS/CSS should use network-first caching');
assert(sw.includes("'./lastset-diagnostics.js'"),'Diagnostics JS must be included offline');
assert(sw.includes("'./lastset-diagnostics.css'"),'Diagnostics CSS must be included offline');
assert(boot.includes('lastset-diagnostics.js'),'Diagnostics must load before inline application');
assert(worker.includes('lastset-mobility.js'),'Mobility extension must be injected');
assert(worker.includes('lastset-mobility.css'),'Mobility styling must be injected');
assert(build.includes('lastset-mobility.js'),'Mobility bundle must be included');
assert(sw.includes("'./lastset-mobility.js'"),'Mobility must be offline available');
assert(boot.indexOf('lastset-diagnostics.js')<boot.indexOf('const EXERCISES = ['),'Diagnostics loaded too late');
assert(build.includes('scripts/stamp-release.mjs'),'Bundle must tag release identity');
assert(stamp.includes("LASTSET_RELEASE_ID")&&stamp.includes('GITHUB_SHA'),'Build version should follow commit');
assert(fs.existsSync('lastset-diagnostics.js'));
assert(fs.existsSync('lastset-diagnostics.css'));
assert(sw.includes('if(/\\.(?:js|css|json)$/i.test(path))return networkFirstAsset(request);'),'JS and CSS must use network-first path');

// Production must serve all known assets without invoking the request-metered Worker.
const wrangler=JSON.parse(fs.readFileSync('wrangler.jsonc','utf8'));
assert.equal(wrangler.assets.run_worker_first,false,'Static assets must bypass the Worker quota');
assert.equal(wrangler.assets.not_found_handling,'single-page-application');
assert.equal(wrangler.assets.html_handling,'auto-trailing-slash');
assert(stamp.includes('injectBuildAssets'),'Built HTML must contain all functional app layers');
const assetMap=fs.readFileSync('worker.js','utf8');
assert(assetMap.includes('lastset-mobility.js'));

console.log('LastSet versioning smoke tests passed');

// Test the service worker's actual network-first path, not just its source text.
(async()=>{
  const vm=require('node:vm');
  const handlers={};
  let offline=false;
  const oldResponse=new Response('OLD version');
  const cached={
    put:async()=>{},
    match:async(req,opts)=>opts?.ignoreSearch?oldResponse:null
  };
  const ctx={
    self:{
      location:{href:'https://lastset.example/service-worker.js',origin:'https://lastset.example'},
      addEventListener:(event,fn)=>{handlers[event]=fn;},
      skipWaiting:()=>{}
    },
    caches:{open:async()=>cached,keys:async()=>[],match:async()=>oldResponse},
    fetch:async()=>{
      if(offline)throw new Error('Offline');
      return new Response('NEW version');
    },
    URL,Response,Request,console
  };
  vm.createContext(ctx);
  vm.runInContext(sw,ctx);
  let response=await vm.runInContext("networkFirstAsset(new Request('https://lastset.example/lastset-explore.js?v=releaseA'))",ctx);
  assert.equal(await response.text(),'NEW version','Online asset returned a stale cached script');
  offline=true;
  response=await vm.runInContext("networkFirstAsset(new Request('https://lastset.example/lastset-explore.js?v=releaseA'))",ctx);
  assert.equal(await response.text(),'OLD version','Offline JavaScript fallback is unavailable');
  console.log('LastSet code network-first and offline-fallback behavior passed');
})().catch(error=>{console.error(error);process.exitCode=1;});


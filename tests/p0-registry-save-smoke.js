// Simulate profile registry storage failure without touching real user history.
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const source=fs.readFileSync('lastset-integrity.js','utf8');
const start=source.indexOf('  let registryCorrupted=false;');
const end=source.indexOf('  if(baseLoadData){',start);
assert(start>0&&end>start,'Unable to locate active profile persistence implementation');
const records=new Map();
let errorCount=0;
const storage={
  getItem:k=>records.has(k)?records.get(k):null,
  setItem:(k,v)=>{records.set(k,String(v));return true;},
  removeItem:k=>records.delete(k)
};
const context={
  USER_SPACES_KEY:'lastset-user-spaces-v1',
  localStorage:storage,
  data:{sessions:{},profile:{name:'P0 Device',userId:'p0-profile'}},
  clone:obj=>JSON.parse(JSON.stringify(obj)),
  baseSaveData:()=>true,
  reportStorageFailure:()=>{errorCount++;},
  Date,Math
};
vm.createContext(context);
vm.runInContext(source.slice(start,end)+'\nthis.P0={syncActiveSnapshot,readRegistry,writeRegistry};',context);
const api=context.P0;
api.syncActiveSnapshot(context.data);
assert.equal(api.readRegistry().activeId,'p0-profile');
const snapshot={sessions:{'2026-10-10':[{type:'resistance',exercises:[{name:'Bench Press',sets:[{weight:80,reps:8},{weight:85,reps:6},{weight:85,reps:5}]}]}]},profile:{name:'P0 Device',userId:'p0-profile'}};
api.syncActiveSnapshot(snapshot);
let previous=JSON.parse(storage.getItem(context.USER_SPACES_KEY));
assert.deepStrictEqual(JSON.parse(JSON.stringify(previous.users[0].data)),snapshot);

const save=storage.setItem;
storage.setItem=()=>{throw new Error('QuotaExceededError');};
assert.throws(()=>api.syncActiveSnapshot({sessions:{},profile:{name:'changed'}}),/could not be saved/i);
assert.deepStrictEqual(JSON.parse(storage.getItem(context.USER_SPACES_KEY)),previous);
assert(errorCount>=1,'storage failure must be surfaced');
storage.setItem=()=>{};
assert.equal(api.writeRegistry({...previous,version:99}),false,'no-op write must fail read-back');
storage.setItem=save;
assert.equal(api.writeRegistry(previous),true,'registry recovers when persistence returns');
console.log('LastSet P0 active profile registry safety tests passed');

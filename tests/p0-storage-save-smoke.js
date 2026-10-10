// P0: exercise the real LastSet browser storage functions with a simulated device.
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf("const STORAGE_KEY = 'lastset-data-v1';");
const end=html.indexOf('let data = loadData();',start);
assert(start>=0 && end>start,'Cannot find live local-storage implementation');
const saved=new Map();
const store={
  getItem:key=>saved.has(key)?saved.get(key):null,
  setItem:(key,value)=>saved.set(key,String(value)),
  removeItem:key=>saved.delete(key)
};
const ctx={window:{localStorage:store},console:{error(){}},setTimeout,URL,Blob};
vm.createContext(ctx);
vm.runInContext(html.slice(start,end)+'\nthis.storageApi={safeStorageSet,saveData,safeStorageGet};',ctx);
const {safeStorageSet,saveData,safeStorageGet}=ctx.storageApi;

const workout={sessions:{'2026-10-10':[{type:'resistance',exercises:[{name:'Bench Press',sets:[{weight:80,reps:8},{weight:85,reps:6},{weight:85,reps:5}]}]}]},profile:{name:'P0 test'}};
assert.strictEqual(saveData(workout),true,'normal save should succeed and acknowledge');
assert.deepStrictEqual(JSON.parse(safeStorageGet()),workout,'confirmed workout must round-trip exactly');

const original=store.setItem;
store.setItem=()=>{throw new Error('QuotaExceededError')};
assert.strictEqual(safeStorageSet({...workout,test:'new data'}),false,'quota failure must not be marked as saved');
assert.throws(()=>saveData(workout),/could not persist/i,'failed save must stop success path');
assert.deepStrictEqual(JSON.parse(safeStorageGet()),workout,'previous confirmed data must remain intact');
store.setItem=()=>{}; // Silent no-op storage implementation must fail read-back verification.
assert.strictEqual(safeStorageSet({...workout,test:'unsaved'}),false,'missing read-back must fail');
store.setItem=original;
assert.strictEqual(saveData(workout),true,'save recovers once storage works again');
console.log('LastSet P0 storage failure and read-back tests passed');

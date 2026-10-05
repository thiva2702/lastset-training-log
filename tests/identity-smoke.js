const assert=require('assert');
const fs=require('fs');

global.__LASTSET_TEST_ONLY__=true;
require('../lastset-identity.js');
const T=global.LastSetIdentityTest;
assert(T,'Identity test API missing');

assert.equal(T.cleanLabel('  Thiva   Rajasekaran  '),'Thiva Rajasekaran');
assert.equal(T.initialsFor('Thiva'),'T');
assert.equal(T.initialsFor('Thiva Rajasekaran'),'TR');
assert.equal(T.initialsFor(''),'Y');

const valid='data:image/jpeg;base64,YWJjZA==';
assert.equal(T.safeAvatarUrl(valid),valid);
assert.equal(T.safeAvatarUrl('javascript:alert(1)'),'');
assert.equal(T.safeAvatarUrl('data:text/html;base64,YQ=='),'');

const memory=new Map();
const storage={getItem:k=>memory.has(k)?memory.get(k):null,setItem:(k,v)=>{memory.set(k,v);}};
storage.setItem('lastset-user-spaces-v1',JSON.stringify({
  version:1,activeId:'u1',users:[
    {id:'u1',name:'Thiva',data:{sessions:{},profile:{userLabel:'Thiva'}}},
    {id:'u2',name:'Test User',data:{sessions:{},profile:{userLabel:'Test User'}}}
  ]
}));

assert(T.persistIdentityToRegistry({userLabel:'Thiva',name:'Thiva',avatarDataUrl:valid},storage));
let reg=T.readRegistry(storage);
assert.equal(reg.users[0].data.profile.avatarDataUrl,valid);
assert.equal(reg.users[1].data.profile.avatarDataUrl,undefined);

const target={profile:{userLabel:'Thiva'}};
assert(T.syncIdentityFromRegistry(target,storage));
assert.equal(target.profile.avatarDataUrl,valid);
assert.deepEqual(T.identityFromProfile(target.profile),{label:'Thiva',initials:'T',avatarUrl:valid});

assert(T.persistIdentityToRegistry({userLabel:'Thiva',name:'Thiva'},storage));
reg=T.readRegistry(storage);
assert.equal(reg.users[0].data.profile.avatarDataUrl,undefined);

const css=fs.readFileSync('lastset-identity.css','utf8');
const brand=fs.readFileSync('lastset-brand.js','utf8');
assert.ok(css.includes('min-height:64px'),'Header height polish missing');
assert.ok(css.includes('drop-shadow(0 3px 8px'),'Softer logo glow missing');
assert.ok(css.includes('.ls-user-name'),'Header username styling missing');
assert.ok(css.includes('min-height:56px'),'Calendar mobile spacing polish missing');
assert.ok(brand.includes('LastSetBrand'),'Brand dependency unexpectedly missing');

const identitySource=fs.readFileSync('lastset-identity.js','utf8');
assert.ok(identitySource.includes("document.querySelector('[data-manage-users]')"),'Switch user identity card handler missing');
assert.ok(identitySource.includes('manager.click()'),'Switch user must open the existing user manager after identity rerender');

console.log('LastSet personal identity smoke tests passed');
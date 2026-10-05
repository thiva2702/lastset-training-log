(() => {
  'use strict';

  const VERSION='0.13.10';
  const USER_SPACES_KEY='lastset-user-spaces-v1';
  const MAX_SOURCE_BYTES=15*1024*1024;
  const AVATAR_SIZE=256;

  function cleanLabel(value){
    return String(value||'').trim().replace(/\s+/g,' ')||'You';
  }

  function initialsFor(value){
    const parts=cleanLabel(value).split(' ').filter(Boolean);
    if(!parts.length) return 'Y';
    if(parts.length===1) return parts[0].slice(0,1).toUpperCase();
    return (parts[0][0]+parts[parts.length-1][0]).toUpperCase();
  }

  function safeAvatarUrl(value){
    const s=String(value||'');
    return /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(s)?s:'';
  }

  function identityFromProfile(profile){
    const p=profile||{};
    const label=cleanLabel(p.userLabel||p.name||'You');
    return {label,initials:initialsFor(label),avatarUrl:safeAvatarUrl(p.avatarDataUrl)};
  }

  function readRegistry(storage){
    try{
      const raw=(storage||localStorage).getItem(USER_SPACES_KEY);
      const parsed=raw?JSON.parse(raw):null;
      return parsed&&Array.isArray(parsed.users)?parsed:{version:1,activeId:null,users:[]};
    }catch(_){
      return {version:1,activeId:null,users:[]};
    }
  }

  function writeRegistry(reg,storage){
    try{(storage||localStorage).setItem(USER_SPACES_KEY,JSON.stringify(reg));return true;}
    catch(_){return false;}
  }

  function persistIdentityToRegistry(profile,storage){
    const reg=readRegistry(storage);
    const active=reg.users.find(u=>u.id===reg.activeId);
    if(!active) return false;
    active.data=active.data||{sessions:{},profile:{}};
    active.data.profile=active.data.profile||{};
    const p=profile||{};
    if(p.avatarDataUrl) active.data.profile.avatarDataUrl=safeAvatarUrl(p.avatarDataUrl);
    else delete active.data.profile.avatarDataUrl;
    if(p.userLabel) active.data.profile.userLabel=p.userLabel;
    if(p.name!=null) active.data.profile.name=p.name;
    return writeRegistry(reg,storage);
  }

  function syncIdentityFromRegistry(target,storage){
    const reg=readRegistry(storage);
    const active=reg.users.find(u=>u.id===reg.activeId);
    const stored=active?.data?.profile;
    if(!target||!stored) return false;
    target.profile=target.profile||{};
    let changed=false;
    const avatar=safeAvatarUrl(stored.avatarDataUrl);
    if(avatar&&target.profile.avatarDataUrl!==avatar){target.profile.avatarDataUrl=avatar;changed=true;}
    if(!avatar&&target.profile.avatarDataUrl){delete target.profile.avatarDataUrl;changed=true;}
    return changed;
  }

  if(typeof globalThis!=='undefined'&&globalThis.__LASTSET_TEST_ONLY__){
    globalThis.LastSetIdentityTest={cleanLabel,initialsFor,safeAvatarUrl,identityFromProfile,readRegistry,writeRegistry,persistIdentityToRegistry,syncIdentityFromRegistry};
    return;
  }

  if(typeof window==='undefined') return;

  function db(){return typeof data!=='undefined'?data:null;}
  function currentIdentity(){return identityFromProfile(db()?.profile);}
  function esc(v){return typeof escapeHtml==='function'?escapeHtml(v):String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function currentState(){return typeof state!=='undefined'?state:null;}

  function hasBack(){
    try{
      if(globalThis.LastSetNavigation&&typeof globalThis.LastSetNavigation.hasBack==='function') return !!globalThis.LastSetNavigation.hasBack();
    }catch(_){}
    const s=currentState();
    return !!s&&s.view!==s.tab&&!['calendar','progress','profile'].includes(s.view);
  }

  function avatarMarkup(identity,large=false){
    const cls=large?'ls-user-avatar ls-user-avatar-large':'ls-user-avatar';
    if(identity.avatarUrl) return '<span class="'+cls+' has-photo"><img src="'+identity.avatarUrl+'" alt=""></span>';
    return '<span class="'+cls+' initials" aria-hidden="true">'+esc(identity.initials)+'</span>';
  }

  function topbarIdentity(){
    const back=hasBack();
    const identity=currentIdentity();
    const brand=globalThis.LastSetBrand?.brandLockup?globalThis.LastSetBrand.brandLockup():'<div class="brand"><strong>LastSet</strong></div>';
    const backIcon=globalThis.LastSetBrand?.icons?.back||'‹';
    return '<header class="topbar ls-brand-topbar ls-identity-topbar '+(back?'has-back':'')+'"><div class="topbar-inner">'+
      '<div class="ls-topbar-left">'+
        (back?'<button class="icon-btn ls-back-btn" data-action="back" aria-label="Back" title="Back">'+backIcon+'</button>':'')+
        brand+
      '</div>'+
      '<button class="ls-user-chip" data-nav="profile" aria-label="Open '+esc(identity.label)+' profile" title="Profile — '+esc(identity.label)+'">'+
        '<span class="ls-user-name">'+esc(identity.label)+'</span>'+avatarMarkup(identity,false)+
      '</button>'+
    '</div></header>';
  }

  function profileIdentityHtml(){
    const identity=currentIdentity();
    return '<div class="ls-profile-person">'+
      avatarMarkup(identity,true)+
      '<div class="ls-profile-person-copy"><span>Current user</span><strong>'+esc(identity.label)+'</strong><small>This photo and training history stay with this LastSet user on this device.</small></div>'+
      '<input class="ls-avatar-input" type="file" accept="image/*" aria-label="Choose profile photo">'+
      '<div class="ls-profile-person-actions">'+
        '<button type="button" class="secondary" data-avatar-change>'+(identity.avatarUrl?'Change photo':'Upload photo')+'</button>'+
        (identity.avatarUrl?'<button type="button" class="ls-avatar-remove" data-avatar-remove>Remove</button>':'')+
        '<button type="button" class="secondary" data-profile-manage-users>Switch user</button>'+
      '</div>'+
    '</div>';
  }

  function readFileAsDataUrl(file){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(String(reader.result||''));
      reader.onerror=()=>reject(reader.error||new Error('Could not read image'));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src){
    return new Promise((resolve,reject)=>{
      const image=new Image();
      image.onload=()=>resolve(image);
      image.onerror=()=>reject(new Error('Could not open image'));
      image.src=src;
    });
  }

  async function resizeAvatar(file){
    if(!file||!String(file.type||'').startsWith('image/')) throw new Error('Choose an image file');
    if(Number(file.size||0)>MAX_SOURCE_BYTES) throw new Error('Choose a photo smaller than 15 MB');
    const src=await readFileAsDataUrl(file);
    const image=await loadImage(src);
    const w=image.naturalWidth||image.width,h=image.naturalHeight||image.height;
    if(!w||!h) throw new Error('Photo could not be read');
    const side=Math.min(w,h),sx=Math.max(0,(w-side)/2),sy=Math.max(0,(h-side)/2);
    const canvas=document.createElement('canvas');
    canvas.width=AVATAR_SIZE;canvas.height=AVATAR_SIZE;
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx) throw new Error('Photo processing is not available');
    ctx.fillStyle='#120d1c';ctx.fillRect(0,0,AVATAR_SIZE,AVATAR_SIZE);
    ctx.drawImage(image,sx,sy,side,side,0,0,AVATAR_SIZE,AVATAR_SIZE);
    return canvas.toDataURL('image/jpeg',0.84);
  }

  function saveAvatar(value){
    const target=db(); if(!target) return false;
    target.profile=target.profile||{};
    if(value) target.profile.avatarDataUrl=safeAvatarUrl(value);
    else delete target.profile.avatarDataUrl;
    if(typeof saveData==='function') saveData(target);
    return true;
  }

  const previousSave=typeof saveData==='function'?saveData:null;
  if(previousSave){
    saveData=function(value){
      previousSave(value);
      try{persistIdentityToRegistry(value?.profile);}catch(_){}
    };
  }

  try{
    const target=db();
    if(target&&syncIdentityFromRegistry(target)&&previousSave) previousSave(target);
  }catch(_){}

  if(typeof topbar==='function') topbar=topbarIdentity;

  function decorateProfile(){
    const s=currentState();
    if(!s||s.view!=='profile') return;
    const section=document.querySelector('.ls-profile-identity');
    if(!section) return;
    section.classList.add('ls-profile-identity-v2');
    section.innerHTML=profileIdentityHtml();

    const fileInput=section.querySelector('.ls-avatar-input');
    const change=section.querySelector('[data-avatar-change]');
    if(change&&fileInput) change.onclick=()=>fileInput.click();

    if(fileInput) fileInput.onchange=async()=>{
      const file=fileInput.files?.[0]; if(!file) return;
      if(change){change.disabled=true;change.textContent='Preparing…';}
      try{
        const avatar=await resizeAvatar(file);
        saveAvatar(avatar);
        if(typeof showToast==='function') showToast('Profile photo updated');
        else if(typeof render==='function') render();
      }catch(error){
        if(typeof showToast==='function') showToast(error?.message||'Could not use that photo');
        else if(typeof render==='function') render();
      }
    };

    const remove=section.querySelector('[data-avatar-remove]');
    if(remove) remove.onclick=()=>{
      if(!confirm('Remove this profile photo?')) return;
      saveAvatar('');
      if(typeof showToast==='function') showToast('Profile photo removed');
      else if(typeof render==='function') render();
    };

    const switchUser=section.querySelector('[data-profile-manage-users]');
    if(switchUser) switchUser.onclick=()=>{
      const manager=document.querySelector('[data-manage-users]');
      if(manager){ manager.click(); return; }
      if(typeof showToast==='function') showToast('User manager is not available yet');
    };
  }

  function decorate(){
    document.documentElement.dataset.lastsetIdentity=VERSION;
    decorateProfile();
  }

  if(typeof render==='function'){
    const previousRender=render;
    render=function(){
      previousRender();
      decorate();
    };
    render();
  }else{
    document.addEventListener('DOMContentLoaded',decorate,{once:true});
  }

  globalThis.LastSetIdentity={version:VERSION,currentIdentity,resizeAvatar,saveAvatar};
})();
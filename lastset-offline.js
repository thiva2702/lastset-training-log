(() => {
  'use strict';

  const VERSION='0.14.1';
  let wasOffline=false;
  let reconnectTimer=null;

  function isOffline(){
    return typeof navigator!=='undefined' ? navigator.onLine===false : false;
  }

  function statusCopy(offline){
    return offline
      ? {label:'Offline',detail:'Training is saved on this device.'}
      : {label:'Online',detail:'LastSet is connected.'};
  }

  function sameOriginAsset(url,origin){
    try{
      const u=new URL(url,origin||'https://lastset.local');
      const base=new URL(origin||'https://lastset.local');
      return u.origin===base.origin && !/\/api\//i.test(u.pathname);
    }catch(_){return false;}
  }

  if(typeof globalThis!=='undefined'&&globalThis.__LASTSET_TEST_ONLY__){
    globalThis.LastSetOfflineTest={statusCopy,sameOriginAsset};
    return;
  }

  if(typeof window==='undefined')return;

  function ensureBadge(){
    let badge=document.querySelector('.ls-offline-pill');
    if(!isOffline()){
      if(badge)badge.remove();
      return;
    }
    if(!badge){
      badge=document.createElement('div');
      badge.className='ls-offline-pill';
      badge.setAttribute('role','status');
      badge.setAttribute('aria-live','polite');
      document.body.appendChild(badge);
    }
    const copy=statusCopy(true);
    badge.innerHTML='<span class="ls-offline-dot"></span><strong>'+copy.label+'</strong><span>'+copy.detail+'</span>';
  }

  function decorateSmartLog(){
    if(typeof state==='undefined'||state.view!=='describe')return;
    const main=document.querySelector('main.container');
    if(!main)return;
    let note=main.querySelector('.ls-offline-smart-note');
    if(!isOffline()){
      if(note)note.remove();
      return;
    }
    if(!note){
      note=document.createElement('div');
      note.className='ls-offline-smart-note';
      note.innerHTML='<strong>Offline mode</strong><span>Typed Smart Log works offline. Voice recognition depends on your phone\'s speech service.</span>';
      const target=main.querySelector('.ls-v14-smart-actions')||main.querySelector('textarea')?.parentElement;
      if(target)target.insertAdjacentElement('afterend',note); else main.prepend(note);
    }
  }

  function decorate(){
    document.documentElement.dataset.lastsetOffline=VERSION;
    document.documentElement.dataset.network=isOffline()?'offline':'online';
    ensureBadge();
    decorateSmartLog();
  }

  async function prepareOffline(){
    if(!('serviceWorker'in navigator)||location.protocol!=='https:')return false;
    try{
      const reg=await navigator.serviceWorker.register('./service-worker.js');
      const ready=await navigator.serviceWorker.ready;
      const worker=ready.active||reg.active||reg.waiting;
      if(worker)worker.postMessage({type:'LASTSET_WARM_OFFLINE'});
      if(navigator.storage&&typeof navigator.storage.persist==='function'){
        try{await navigator.storage.persist();}catch(_){}
      }
      return true;
    }catch(_){return false;}
  }

  window.addEventListener('offline',()=>{
    wasOffline=true;
    decorate();
    if(typeof render==='function')render();
  });
  window.addEventListener('online',()=>{
    const hadOffline=wasOffline;
    wasOffline=false;
    decorate();
    if(typeof render==='function')render();
    if(hadOffline&&typeof showToast==='function'){
      clearTimeout(reconnectTimer);
      reconnectTimer=setTimeout(()=>showToast('Back online — your local workout is safe'),80);
    }
  });

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

  window.addEventListener('load',()=>{prepareOffline();decorate();},{once:true});

  globalThis.LastSetOffline={version:VERSION,isOffline,prepareOffline};
})();
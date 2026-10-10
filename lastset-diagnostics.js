/* LastSet diagnostics: private, bounded, opt-in display. No network or persistent log storage. */
(() => {
  'use strict';
  const VERSION='1.0.0';
  if(globalThis.LastSetDiagnostics)return;
  const LIMIT=120,MAX_LINE=1100;
  const entries=[];
  const originals={};
  let panel=null,list=null,status=null,opened=false,hotTaps=[];

  function redact(value){
    return String(value??'')
      .replace(/\b(Bearer\s+)[A-Za-z0-9._~+\/=-]+/gi,'$1[REDACTED]')
      .replace(/\b(authorization|access[_-]?token|refresh[_-]?token|id[_-]?token|api[_-]?key|password|passwd|secret|session[_-]?id)\b(\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;&}]+)/gi,'$1$2[REDACTED]')
      .replace(/([?&](?:token|key|code|auth|session|password|secret)=)[^&#\s]+/gi,'$1[REDACTED]')
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,'[EMAIL]')
      .replace(/\b(?:\+?\d[\d\s()\-]{9,}\d)\b/g,'[PHONE]')
      .slice(0,MAX_LINE);
  }

  function printable(value){
    if(value instanceof Error)return redact(value.name+': '+value.message+(value.stack?'\n'+value.stack.split('\n').slice(1,4).join('\n'):''));
    if(value===null)return 'null';
    if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')return redact(value);
    if(typeof value==='undefined')return 'undefined';
    // Do not serialize arbitrary objects: they may contain workouts, notes, or credentials.
    return Array.isArray(value)?'[Array]':'[Object]';
  }

  function line(level,args){
    const stamp=new Date().toLocaleTimeString('en-GB',{hour12:false});
    return stamp+'  '+level.toUpperCase()+'  '+args.map(printable).join(' ').slice(0,MAX_LINE);
  }

  function record(level,...args){
    entries.push(line(level,args));
    if(entries.length>LIMIT)entries.splice(0,entries.length-LIMIT);
    if(opened)refresh();
  }

  function refresh(){
    if(!list)return;
    list.textContent=entries.length?entries.join('\n'):'No logs yet. Use LastSet normally to collect diagnostics.';
    list.scrollTop=list.scrollHeight;
  }

  function withinHotspot(x,y,width=0){
    return Number.isFinite(x)&&Number.isFinite(y)&&x>=Math.max(0,width-74)&&y>=0&&y<=90;
  }

  function tap(x,y,width,now){
    if(!withinHotspot(x,y,width)){hotTaps=[];return false;}
    hotTaps=hotTaps.filter(t=>now-t<=900);
    hotTaps.push(now);
    if(hotTaps.length>=3){hotTaps=[];return true;}
    return false;
  }

  function close(){
    if(!panel)return;
    opened=false;
    panel.hidden=true;
    panel.setAttribute('aria-hidden','true');
  }
  function open(){
    mount();
    if(!panel)return;
    opened=true;
    panel.hidden=false;
    panel.setAttribute('aria-hidden','false');
    refresh();
    panel.querySelector('[data-ls-diagnostics-close]')?.focus({preventScroll:true});
  }

  async function copyLogs(){
    const text=['LastSet diagnostic report','Captured: '+new Date().toISOString(),
      'Page: '+location.pathname,'Version: '+(document.querySelector('meta[name="lastset-release"]')?.content||'unknown'),
      'Logs:',...entries].join('\n');
    let copied=false;
    try{
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);copied=true;}
    }catch(_){/* Use legacy iOS fallback. */}
    if(!copied){
      const temp=document.createElement('textarea');
      temp.value=text;temp.readOnly=true;temp.style.cssText='position:fixed;left:-9999px;top:0;opacity:0;';
      document.body.appendChild(temp);
      temp.focus();temp.select();temp.setSelectionRange(0,temp.value.length);
      try{copied=document.execCommand('copy');}catch(_){}
      temp.remove();
    }
    if(status)status.textContent=copied?'Logs copied. Review before sharing.':'Copy unavailable. Select the log text and copy it manually.';
  }

  function mount(){
    if(panel||!document.body)return;
    panel=document.createElement('section');
    panel.id='ls-diagnostics-panel';
    panel.className='ls-diagnostics-panel';
    panel.hidden=true;
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-label','LastSet debug console');
    panel.setAttribute('aria-hidden','true');
    panel.innerHTML='<div class="ls-diag-top"><strong>LastSet Debug Console</strong><button type="button" data-ls-diagnostics-close aria-label="Close debug console">✕</button></div>'+
      '<p class="ls-diag-hint">Temporary device logs only. Check the text before sharing it.</p>'+
      '<pre class="ls-diag-lines" data-ls-diagnostics-logs tabindex="0"></pre>'+
      '<div class="ls-diag-actions"><button type="button" data-ls-diagnostics-copy>Copy Logs</button><button type="button" data-ls-diagnostics-clear>Clear</button></div>'+
      '<p class="ls-diag-status" data-ls-diagnostics-status aria-live="polite"></p>';
    document.body.appendChild(panel);
    list=panel.querySelector('[data-ls-diagnostics-logs]');
    status=panel.querySelector('[data-ls-diagnostics-status]');
    panel.querySelector('[data-ls-diagnostics-close]').addEventListener('click',close);
    panel.querySelector('[data-ls-diagnostics-copy]').addEventListener('click',copyLogs);
    panel.querySelector('[data-ls-diagnostics-clear]').addEventListener('click',()=>{entries.length=0;refresh();if(status)status.textContent='Logs cleared.';});
    refresh();
  }

  const levels=['log','info','warn','error'];
  for(const level of levels){
    if(typeof console[level]!=='function')continue;
    originals[level]=console[level];
    console[level]=function(...args){
      try{record(level,...args);}catch(_){}
      return originals[level].apply(console,args);
    };
  }
  if(typeof window!=='undefined'){
    window.addEventListener('error',event=>{
      if(event.target&&event.target!==window){
        const tag=event.target.tagName||'resource';
        const path=event.target.getAttribute?.('src')||event.target.getAttribute?.('href')||'';
        record('error','Resource load failed:',tag,path);
      }else record('error','Uncaught:',event.message||'Unknown error',event.filename||'',event.lineno||'');
    },true);
    window.addEventListener('unhandledrejection',event=>{
      const why=event.reason instanceof Error?event.reason:typeof event.reason==='string'?event.reason:'Unhandled promise rejection';
      record('error','Promise rejected:',why);
    });
    document.addEventListener('pointerup',event=>{
      if(opened||event.target?.closest?.('#ls-diagnostics-panel'))return;
      if(tap(event.clientX,event.clientY,innerWidth,Date.now()))open();
    },true);
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&opened)close();});
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
    else mount();
  }

  globalThis.LastSetDiagnostics=Object.freeze({
    version:VERSION,open,close,note:(label)=>record('app',String(label||'event')),
    logs:()=>entries.slice(),clear:()=>{entries.length=0;refresh();}
  });
  if(globalThis.__LASTSET_TEST_ONLY__){
    globalThis.LastSetDiagnosticsTest={redact,withinHotspot,tap,printable,record};
  }
  record('info','LastSet diagnostics initialized');
})();

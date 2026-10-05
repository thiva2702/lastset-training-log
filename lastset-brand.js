(() => {
  'use strict';

  const VERSION = '0.13.9';

  const ICONS = Object.freeze({
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M7.5 3.5v4M16.5 3.5v4M3.5 9.5h17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    today: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.7" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="2.7" fill="currentColor"/><path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    progress: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="13.2" width="3.4" height="6.3" rx="1.2" fill="currentColor"/><rect x="10.2" y="9.3" width="3.4" height="10.2" rx="1.2" fill="currentColor"/><path d="M16.4 7.3q0-1 .8-1.5l2.6-1.6q1-.6 1 .7v13.3q0 1.3-1.3 1.3h-1.8q-1.3 0-1.3-1.3Z" fill="currentColor"/></svg>',
    profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.1" r="3.25" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5.8 19.2c.7-3.5 3-5.4 6.2-5.4s5.5 1.9 6.2 5.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'
  });

  function currentState(){
    return typeof state !== 'undefined' ? state : null;
  }

  function hasBack(){
    try{
      if(globalThis.LastSetNavigation && typeof globalThis.LastSetNavigation.hasBack === 'function'){
        return !!globalThis.LastSetNavigation.hasBack();
      }
    }catch(_){ }
    const s = currentState();
    return !!s && s.view !== s.tab && !['calendar','progress','profile'].includes(s.view);
  }

  function brandLockup(){
    return '<div class="ls-brand-lockup">' +
      '<img class="ls-brand-mark" src="./assets/lastset-mark.svg?v=0139" alt="" aria-hidden="true">' +
      '<div class="ls-brand-copy">' +
        '<div class="ls-brand-line"><span class="ls-brand-last">Last</span><span class="ls-brand-set">Set</span><span class="ls-brand-beta">BETA</span></div>' +
        '<span class="ls-brand-tagline">Remember today. Build tomorrow.</span>' +
      '</div>' +
    '</div>';
  }

  function topbarBrand(){
    const back = hasBack();
    const s = currentState();
    const profileActive = !!s && (s.tab === 'profile' || s.view === 'profile');
    return '<header class="topbar ls-brand-topbar ' + (back ? 'has-back' : '') + '"><div class="topbar-inner">' +
      '<div class="ls-topbar-left">' +
        (back ? '<button class="icon-btn ls-back-btn" data-action="back" aria-label="Back" title="Back">' + ICONS.back + '</button>' : '') +
        brandLockup() +
      '</div>' +
      '<button class="icon-btn ls-profile-top ' + (profileActive ? 'active' : '') + '" data-nav="profile" aria-label="Profile" title="Profile">' + ICONS.profile + '</button>' +
    '</div></header>';
  }

  function navIsActive(view){
    const s = currentState();
    if(!s) return false;
    return view === 'day' ? s.tab === 'today' : s.tab === view;
  }

  function navButtonBrand(view,label){
    const icon = ICONS[view === 'day' ? 'today' : view] || ICONS.today;
    const active = navIsActive(view);
    return '<button class="nav-btn ' + (active ? 'active' : '') + '" data-nav="' + view + '" aria-label="' + label + '"' +
      (active ? ' aria-current="page"' : '') + '>' +
      '<span class="nicon">' + icon + '</span><span class="nav-label">' + label + '</span></button>';
  }

  function bottomNavBrand(){
    return '<nav class="bottom-nav ls-brand-nav" aria-label="Primary navigation"><div class="bottom-nav-inner">' +
      navButtonBrand('calendar','Calendar') +
      navButtonBrand('day','Today') +
      navButtonBrand('progress','Progress') +
      navButtonBrand('profile','Profile') +
    '</div></nav>';
  }

  function splashMarkup(){
    return '<div class="ls-launch-splash" id="ls-launch-splash" role="presentation" aria-hidden="true">' +
      '<div class="ls-splash-inner">' +
        '<img class="ls-splash-mark" src="./assets/lastset-mark.svg?v=0139" alt="">' +
        '<div class="ls-splash-word"><span>Last</span><strong>Set</strong><em>BETA</em></div>' +
        '<div class="ls-splash-tagline">Remember today. Build tomorrow.</div>' +
        '<div class="ls-splash-progress"><i></i><i></i><i></i></div>' +
      '</div>' +
    '</div>';
  }

  function showLaunchSplash(){
    try{
      if(sessionStorage.getItem('lastset-brand-splash-0139')) return;
      sessionStorage.setItem('lastset-brand-splash-0139','1');
    }catch(_){ }
    if(document.getElementById('ls-launch-splash')) return;

    const host = document.createElement('div');
    host.innerHTML = splashMarkup();
    const splash = host.firstElementChild;
    if(!splash) return;
    document.body.appendChild(splash);

    const reduced = !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hold = reduced ? 220 : 720;
    setTimeout(() => {
      splash.classList.add('out');
      setTimeout(() => splash.remove(), reduced ? 80 : 320);
    }, hold);
  }

  if(typeof topbar === 'function') topbar = topbarBrand;
  if(typeof bottomNav === 'function') bottomNav = bottomNavBrand;

  const previousRender = typeof render === 'function' ? render : null;
  if(previousRender){
    render = function(){
      previousRender();
      document.documentElement.dataset.lastsetBrand = VERSION;
    };
    render();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', showLaunchSplash, {once:true});
  }else{
    requestAnimationFrame(showLaunchSplash);
  }

  globalThis.LastSetBrand = {
    version: VERSION,
    icons: ICONS,
    brandLockup,
    topbarBrand,
    bottomNavBrand
  };
})();
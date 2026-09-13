(() => {
  'use strict';

  const RELEASE = Object.freeze({
    label: 'V1 Beta',
    semver: '1.0.0-beta.1',
    build: '0.13.2'
  });

  window.LASTSET_RELEASE = RELEASE;

  function decorateBeta(){
    document.querySelectorAll('.brand strong').forEach(brand => {
      if (brand.querySelector('.ls-beta-badge')) return;
      const badge = document.createElement('span');
      badge.className = 'ls-beta-badge';
      badge.textContent = 'BETA';
      badge.setAttribute('aria-label', 'Beta release');
      Object.assign(badge.style, {
        display: 'inline-flex',
        alignItems: 'center',
        marginLeft: '8px',
        padding: '3px 7px',
        borderRadius: '999px',
        border: '1px solid rgba(173,255,79,.55)',
        background: 'rgba(173,255,79,.10)',
        color: '#adff4f',
        fontSize: '8px',
        fontWeight: '900',
        letterSpacing: '1.1px',
        lineHeight: '1',
        verticalAlign: 'middle',
        transform: 'translateY(-2px)'
      });
      brand.appendChild(badge);
    });

    const desiredVersion = `LastSet ${RELEASE.label} · build ${RELEASE.build}`;
    const version = [...document.querySelectorAll('.muted')].find(el => /LastSet\s+(?:v|V)/i.test(el.textContent || ''));
    if (version && version.textContent !== desiredVersion) version.textContent = desiredVersion;

    if (document.documentElement.dataset.lastsetRelease !== RELEASE.semver) {
      document.documentElement.dataset.lastsetRelease = RELEASE.semver;
    }
  }

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      decorateBeta();
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  decorateBeta();
})();

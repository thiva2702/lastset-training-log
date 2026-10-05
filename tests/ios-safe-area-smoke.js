const fs=require('fs');
const assert=require('assert');

const index=fs.readFileSync('index.html','utf8');
const theme=fs.readFileSync('lastset-theme.css','utf8');
const premium=fs.readFileSync('lastset-premium.css','utf8');

assert.ok(index.includes('viewport-fit=cover'),'iPhone viewport must opt into safe areas');
assert.ok(index.includes('apple-mobile-web-app-status-bar-style" content="black-translucent"'),'Standalone PWA status-bar mode changed unexpectedly');
assert.ok(theme.includes('padding-top: env(safe-area-inset-top, 0px)'),'Theme topbar must reserve the iPhone top safe area');
assert.ok(premium.includes('padding-top:env(safe-area-inset-top,0px)'),'Premium topbar must reserve the iPhone top safe area');
assert.ok(index.includes('env(safe-area-inset-bottom)'),'Bottom navigation must continue respecting the home-indicator safe area');

console.log('LastSet iOS safe-area smoke tests passed');
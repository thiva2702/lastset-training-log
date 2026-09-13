# LastSet Cloudflare Pages setup

Use Cloudflare Pages with GitHub integration so every push to `main` deploys automatically.

## Project settings

Repository: `thiva2702/lastset-training-log`
Production branch: `main`
Framework preset: `None`
Root directory: leave blank
Build command: `bash build-cloudflare.sh`
Build output directory: `dist`

## Why this setup

The build script copies only the files required by the LastSet PWA into `dist`.
The `_redirects` file rewrites `/` to `app-v12.html`, matching the existing production entry behaviour.
The `_headers` file keeps the security headers and prevents stale caching of the app entry point and service worker.

## After the first deploy

Open the generated `*.pages.dev` address and test Home, Calendar, Exercises, Profile, Smart Log, and PWA installation.
Once verified, the old Netlify project can remain as an inactive fallback until it is no longer needed.

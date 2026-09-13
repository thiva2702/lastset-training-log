set -euo pipefail

rm -rf dist
mkdir -p dist/assets

cp index.html dist/
cp app-v12.html dist/
cp manifest.webmanifest dist/
cp icon-192.png dist/
cp icon-512.png dist/
cp lastset-theme.css dist/
cp lastset-premium.css dist/
cp lastset-images.css dist/
cp lastset-hotfix.css dist/
cp lastset-calendar.css dist/
cp lastset-enhancements.js dist/
cp lastset-premium.js dist/
cp lastset-hotfix.js dist/
cp lastset-calendar.js dist/
cp lastset-workouts.js dist/
cp service-worker.js dist/
cp _headers dist/
cp _redirects dist/
cp assets/*.webp dist/assets/

echo "Cloudflare bundle ready in dist"

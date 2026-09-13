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
cp lastset-enhancements.js dist/
cp lastset-premium.js dist/
cp lastset-hotfix.js dist/
cp service-worker.js dist/
cp _headers dist/
cp _redirects dist/
cp assets/*.webp dist/assets/

# Validate the approved Home hero before Cloudflare publishes it.
python3 - <<'PY'
from pathlib import Path
p=Path('dist/assets/home-hero-thiva.webp')
b=p.read_bytes()
declared=int.from_bytes(b[4:8],'little')+8 if len(b)>=12 else -1
if b[:4] != b'RIFF' or b[8:12] != b'WEBP' or declared != len(b):
    raise SystemExit('home hero asset failed WebP integrity validation')
print(f'Validated home hero WebP: {len(b)} bytes')
PY

echo "Cloudflare bundle ready in dist"

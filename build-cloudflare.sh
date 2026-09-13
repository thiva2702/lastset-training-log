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

# The home hero is stored as base64 text in GitHub so the connector can carry
# the generated binary safely. Rebuild the actual WebP for Cloudflare output.
base64 -d assets/home-hero-thiva-valid.webp.b64 > dist/assets/home-hero-thiva.webp

# Fail the build if the decoded hero is not a real WebP file.
python3 - <<'PY'
from pathlib import Path
p=Path('dist/assets/home-hero-thiva.webp')
b=p.read_bytes()
if not (len(b)>12 and b[:4]==b'RIFF' and b[8:12]==b'WEBP'):
    raise SystemExit('home hero asset failed WebP validation')
print(f'Validated home hero: {len(b)} bytes')
PY

echo "Cloudflare bundle ready in dist"

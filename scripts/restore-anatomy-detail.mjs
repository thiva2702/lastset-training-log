/* Build-time, deterministic high-density conversion of the original anatomy files.
 * Preserves positions and ratios, so interactive muscle polygons stay registered.
 * Recompresses at high quality after resampling and sharpening; it cannot
 * reconstruct fine photographic details that were absent in the source. */
import sharp from 'sharp';
import {CUTOUT_PATHS} from './anatomy-cutouts.mjs';
import {stat} from 'node:fs/promises';
const targets=[
  ['front',346,631],
  ['back',356,631]
];
const height4k=4096;
for(const [side,nativeWidth,nativeHeight] of targets){
  const input='assets/anatomy-'+side+'.webp';
  const output='dist/assets/anatomy-'+side+'.webp';
  const outWidth=Math.round(nativeWidth*height4k/nativeHeight);
  const mask=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="'+outWidth+'" height="'+height4k+'" viewBox="0 0 '+nativeWidth+' '+nativeHeight+'" preserveAspectRatio="none">'+
    '<path d="'+CUTOUT_PATHS[side]+'" fill="white"/></svg>');
  await sharp(input,{limitInputPixels:5000000})
    .resize(Math.round(nativeWidth*height4k/nativeHeight),height4k,{fit:'fill',kernel:'lanczos3'})
    .sharpen({sigma:1.18,m1:0.9,m2:2.4,x1:2,y2:6,y3:12})
    .ensureAlpha()
    // Alpha compositing removes the photographed black rectangular background.
    // The same native viewBox guarantees old touch overlays stay registered.
    .composite([{input:mask,blend:'dest-in'}])
    .webp({quality:96,effort:6})
    .toFile(output+'.tmp.webp');
  const {rename}=await import('node:fs/promises');
  await rename(output+'.tmp.webp',output);
  const bytes=(await stat(output)).size;
  if(bytes<16000)throw new Error('Anatomy asset was not enhanced: '+side);
  const {hasAlpha}=await sharp(output).metadata();
  const {isOpaque}=await sharp(output).stats();
  if(!hasAlpha||isOpaque)throw new Error('Anatomy background was not removed: '+side);
  console.log('Transparent high resolution '+side+' asset: '+Math.round(nativeWidth*height4k/nativeHeight)+'x'+height4k+', '+bytes+' bytes (resampled from existing original)');
}

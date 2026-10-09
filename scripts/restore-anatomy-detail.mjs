/* Build-time, deterministic high-density conversion of the original anatomy files.
 * Preserves positions and ratios, so interactive muscle polygons stay registered.
 * Recompresses at high quality after resampling and sharpening; it cannot
 * reconstruct fine photographic details that were absent in the source. */
import sharp from 'sharp';
import {stat} from 'node:fs/promises';
const targets=[
  ['front',346,631],
  ['back',356,631]
];
const height4k=4096;
for(const [side,nativeWidth,nativeHeight] of targets){
  const input='assets/anatomy-'+side+'.webp';
  const output='dist/assets/anatomy-'+side+'.webp';
  await sharp(input,{limitInputPixels:5000000})
    .resize(Math.round(nativeWidth*height4k/nativeHeight),height4k,{fit:'fill',kernel:'lanczos3'})
    .sharpen({sigma:1.18,m1:0.9,m2:2.4,x1:2,y2:6,y3:12})
    .webp({quality:96,effort:6})
    .toFile(output+'.tmp.webp');
  const {rename}=await import('node:fs/promises');
  await rename(output+'.tmp.webp',output);
  const bytes=(await stat(output)).size;
  if(bytes<16000)throw new Error('Anatomy asset was not enhanced: '+side);
  console.log('High resolution '+side+' asset: '+Math.round(nativeWidth*height4k/nativeHeight)+'x'+height4k+', '+bytes+' bytes (resampled from existing original)');
}

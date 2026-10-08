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
for(const [side,nativeWidth,nativeHeight] of targets){
  const input='assets/anatomy-'+side+'.webp';
  const output='dist/assets/anatomy-'+side+'.webp';
  await sharp(input,{limitInputPixels:5000000})
    .resize(nativeWidth*3,nativeHeight*3,{fit:'fill',kernel:'lanczos3'})
    .sharpen({sigma:1.1,m1:0.7,m2:1.5,x1:2,y2:6,y3:12})
    .webp({quality:90,effort:6})
    .toFile(output+'.tmp.webp');
  const {rename}=await import('node:fs/promises');
  await rename(output+'.tmp.webp',output);
  const bytes=(await stat(output)).size;
  if(bytes<16000)throw new Error('Anatomy asset was not enhanced: '+side);
  console.log('Enhanced '+side+' image: '+(nativeWidth*3)+'x'+(nativeHeight*3)+', '+bytes+' bytes');
}

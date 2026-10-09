/* LastSet premium anatomy atlas. Original, interactive SVG artwork. */
(() => {
  'use strict';
  const VERSION='0.25.0';
  const GROUP_LABELS={Chest:'Chest',Shoulders:'Shoulders',Arms:'Arms',Core:'Core',Back:'Back',Legs:'Legs'};
  const FRONT=globalThis.LastSetAtlasRegions?.front;
  const BACK=globalThis.LastSetAtlasRegions?.back;
  if(!FRONT||!BACK)throw new Error('Anatomical region assets not loaded');
  const BASE={
    head:'M150 21 C136 20 127 29 124 45 Q121 57 126 70 L132 80 Q139 91 150 91 Q161 91 168 80 L174 70 Q179 57 176 45 C173 29 164 20 150 21 Z',
    neck:'M137 83 Q140 99 137 106 Q124 112 112 117 Q131 128 150 128 Q169 128 188 117 Q176 112 163 106 Q160 99 163 83 Z',
    torsoMale:'M113 109 Q94 111 83 124 Q75 141 84 165 Q91 180 102 191 Q112 214 117 241 Q118 263 106 289 Q126 305 150 310 Q174 305 194 289 Q182 263 183 241 Q188 214 198 191 Q209 180 216 165 Q225 141 217 124 Q206 111 187 109 Q166 119 150 120 Q134 119 113 109 Z',
    torsoFemale:'M121 111 Q105 115 96 136 Q92 156 104 185 Q113 210 115 239 Q107 264 106 287 Q126 307 150 314 Q174 307 194 287 Q193 264 185 239 Q187 210 196 185 Q208 156 204 136 Q195 115 179 111 Q163 121 150 121 Q137 121 121 111 Z',
    armLeft:'M91 118 Q73 113 64 134 Q57 151 66 174 Q72 192 69 212 Q61 234 53 253 L37 296 Q33 308 26 318 Q19 326 12 329 Q7 334 11 338 Q19 340 27 333 L19 349 Q17 356 22 357 Q28 357 31 350 L27 362 Q27 369 33 368 Q39 367 41 358 L42 368 Q46 373 50 367 L56 347 Q61 336 63 322 Q72 307 78 287 L92 247 Q102 221 99 197 Q110 168 105 145 Z',
    armRight:'M209 118 Q227 113 236 134 Q243 151 234 174 Q228 192 231 212 Q239 234 247 253 L263 296 Q267 308 274 318 Q281 326 288 329 Q293 334 289 338 Q281 340 273 333 L281 349 Q283 356 278 357 Q272 357 269 350 L273 362 Q273 369 267 368 Q261 367 259 358 L258 368 Q254 373 250 367 L244 347 Q239 336 237 322 Q228 307 222 287 L208 247 Q198 221 201 197 Q190 168 195 145 Z',
    legLeft:'M109 287 Q100 313 102 347 Q105 376 114 405 Q118 424 116 448 Q112 480 118 509 Q122 534 118 550 Q113 558 108 568 Q105 579 113 582 Q126 584 143 580 Q149 574 147 560 Q144 540 147 518 Q153 480 151 447 L150 311 Z',
    legRight:'M191 287 Q200 313 198 347 Q195 376 186 405 Q182 424 184 448 Q188 480 182 509 Q178 534 182 550 Q187 558 192 568 Q195 579 187 582 Q174 584 157 580 Q151 574 153 560 Q156 540 153 518 Q147 480 149 447 L150 311 Z'
  };
  const LINE_ART={
    front:[
      'M150 132 V279',
      'M117 167 Q130 176 146 176',
      'M183 167 Q170 176 154 176',
      'M124 215 Q134 219 144 217 M156 217 Q166 219 176 215',
      'M124 244 Q135 247 144 244 M156 244 Q165 247 176 244',
      'M121 343 Q128 357 130 381 M179 343 Q172 357 170 381',
      'M125 438 Q132 446 139 439 M175 438 Q168 446 161 439',
      'M128 72 Q136 77 141 78 M159 78 Q164 77 172 72'
    ],
    back:[
      'M150 118 V281',
      'M113 163 Q122 181 140 192 M187 163 Q178 181 160 192',
      'M116 204 Q127 215 141 223 M184 204 Q173 215 159 223',
      'M120 253 Q133 257 145 254 M180 253 Q167 257 155 254',
      'M116 310 Q130 327 144 318 M184 310 Q170 327 156 318',
      'M125 353 Q130 379 135 399 M175 353 Q170 379 165 399',
      'M125 454 Q134 446 140 455 M175 454 Q166 446 160 455'
    ]
  };
  const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render(options){
    options=options||{};
    const side=options.side==='back'?'back':'front';
    const gender=options.gender==='female'?'female':'male';
    const active=GROUP_LABELS[options.activeGroup]?options.activeGroup:'';
    const activeRegion=String(options.activeRegion||'');
    const activeSubregion=String(options.activeSubregion||'');
    const photographic=gender==='male';
    const femaleMapped=gender==='female'?globalThis.LastSetAtlasRegions?.female?.[side]:null;
    const imageWidth=side==='front'?346:356;
    const imageHeight=631;
    const groups=(photographic?globalThis.LastSetAtlasRegions?.photo?.[side]:femaleMapped)||(side==='back'?BACK:FRONT);
    const detail=active==='Arms'?(photographic?globalThis.LastSetAtlasRegions?.photoDetail?.[side]?.[activeRegion]:globalThis.LastSetAtlasRegions?.femaleDetail?.[side]?.[activeRegion]):null;
    const detailedSelection=Boolean(detail?.length&&activeSubregion);
    const defs='<defs>'+
      '<linearGradient id="ls-atlas-body" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#544663"/><stop offset=".43" stop-color="#30253d"/><stop offset="1" stop-color="#191624"/></linearGradient>'+
      '<linearGradient id="ls-atlas-muscle" x1=".08" y1="0" x2=".94" y2="1"><stop stop-color="#bd82de"/><stop offset=".38" stop-color="#7f4b9f"/><stop offset=".72" stop-color="#573a78"/><stop offset="1" stop-color="#342549"/></linearGradient>'+
      '<linearGradient id="ls-atlas-active" x1=".16" y1="0" x2=".89" y2="1"><stop stop-color="#e9ffa5"/><stop offset=".46" stop-color="#b9ff64"/><stop offset="1" stop-color="#59ac58"/></linearGradient>'+
      '<linearGradient id="ls-female-body-shade" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#342235"/><stop offset=".2" stop-color="#a87789"/><stop offset=".46" stop-color="#c995a0"/><stop offset=".72" stop-color="#915e73"/><stop offset="1" stop-color="#31202e"/></linearGradient>'+ 
      '<radialGradient id="ls-atlas-halo"><stop stop-color="#8b43c5" stop-opacity=".24"/><stop offset="1" stop-color="#8b43c5" stop-opacity="0"/></radialGradient>'+
      '<filter id="ls-atlas-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5"/></filter>'+
      '</defs>';
    const bg='<ellipse cx="150" cy="290" rx="142" ry="247" fill="url(#ls-atlas-halo)"/>'+
      '<path class="ls-atlas-guide" d="M150 10V588 M55 99H245 M39 305H261 M78 500H222"/>'+
      '<circle class="ls-atlas-ring" cx="150" cy="287" r="124" stroke-dasharray="2 9"/>';
    const base='<g class="ls-atlas-body">'+
      '<path d="'+BASE.legLeft+'"/><path d="'+BASE.legRight+'"/>'+
      '<path d="'+BASE.armLeft+'"/><path d="'+BASE.armRight+'"/>'+
      '<path d="'+(gender==='female'?BASE.torsoFemale:BASE.torsoMale)+'"/>'+
      '<path d="'+BASE.neck+'"/><path d="'+BASE.head+'"/>'+
      '</g>';
    const topography='<g class="ls-atlas-topography" aria-hidden="true">'+
      '<path d="M134 48 Q142 52 148 49 M152 49 Q158 52 166 48 M140 70 Q150 76 160 70"/>'+
      '<path d="M89 139 Q80 168 79 194 M211 139 Q220 168 221 194"/>'+
      '<path d="M60 271 Q61 289 56 300 M240 271 Q239 289 244 300"/>'+
      '<path d="M115 353 Q119 388 121 409 M185 353 Q181 388 179 409"/>'+
      '<path d="M123 496 L122 530 M177 496 L178 530"/>'+
      '</g>';
    const shapeOrder=side==='front'?['Shoulders','Chest','Arms','Core','Legs']:['Shoulders','Back','Arms','Legs'];
    const shapes=shapeOrder.map(group=>{
      const isActive=active===group;
      const centerHit=group==='Chest'?(photographic?'<rect class="ls-central-chest-target" data-anatomy-region="Mid Chest" x="165" y="153" width="16" height="30" fill="transparent"/>':'<rect class="ls-central-chest-target" x="138" y="139" width="24" height="42" fill="transparent"/>'):group==='Back'?(photographic?'<rect class="ls-central-back-target" data-anatomy-region="Upper Back" x="166" y="169" width="24" height="68" fill="transparent"/>':'<rect class="ls-central-back-target" x="137" y="151" width="26" height="104" fill="transparent"/>'):'';
      const muscleEntries=(photographic||femaleMapped)&&group==='Arms'&&side==='front'
        ?[...groups[group]].sort((a,b)=>({Triceps:0,Forearms:1,Biceps:2}[a.region]??3)-({Triceps:0,Forearms:1,Biceps:2}[b.region]??3))
        :groups[group];
      const segments=muscleEntries.map((entry,index)=>{
        const region=typeof entry==='string'?'':String(entry.region||'');
        const d=typeof entry==='string'?entry:entry.d;
        const selected=region ? (activeRegion===region&&!detailedSelection) : (group==='Arms' && ((activeRegion==='Biceps' && index<2)||(activeRegion==='Forearms' && index>=2&&index<4)||(activeRegion==='Triceps'&&index>=4)));
        const mirror=entry.mirror?' transform="translate('+(photographic?imageWidth:300)+' 0) scale(-1 1)"':'';
        if(photographic||femaleMapped){
          return '<g class="ls-atlas-muscle">'+
            '<path class="ls-atlas-segment ls-atlas-visual'+(selected?' ls-region-selected':'')+'" data-segment="'+index+'"'+mirror+' d="'+d+'" aria-hidden="true"/>'+
            '<path class="ls-atlas-hit" data-segment="'+index+'" data-anatomy-region="'+escape(region)+'"'+mirror+' d="'+d+'"/>'+
          '</g>';
        }
        return '<path class="ls-atlas-segment'+(selected?' ls-region-selected':'')+'" data-segment="'+index+'"'+(region?' data-anatomy-region="'+escape(region)+'"':'')+mirror+' d="'+d+'"/>';
      }).join('');
      const specialist=group==='Arms'&&detail?.length?detail.map((entry,index)=>{
        const mirror=entry.mirror?' transform="translate('+(photographic?imageWidth:300)+' 0) scale(-1 1)"':'';
        const selected=activeSubregion===entry.region;
        return '<g class="ls-atlas-muscle ls-specialist-muscle'+(!activeSubregion?' ls-specialist-hint':'')+'">'+
          '<path class="ls-atlas-segment ls-atlas-visual ls-specialist-visual'+(selected?' ls-region-selected':'')+'" d="'+entry.d+'"'+mirror+' aria-hidden="true"/>'+
          '<path class="ls-atlas-hit ls-specialist-hit" data-anatomy-region="'+escape(entry.region)+'" data-anatomy-parent="'+escape(activeRegion)+'" data-anatomy-subregion="'+escape(entry.region)+'" d="'+entry.d+'"'+mirror+'/>'+
          '</g>';
      }).join(''):'';
      return '<g class="ls-muscle-hit ls-atlas-group'+(isActive?' active':'')+'" data-explore-group="'+group+'" role="button" tabindex="0" aria-pressed="'+(isActive?'true':'false')+'" aria-label="Explore '+escape(GROUP_LABELS[group])+'">'+
        '<title>'+escape(GROUP_LABELS[group])+'</title>'+centerHit+segments+specialist+'</g>';
    }).join('');
    const details='<g class="ls-atlas-etch" aria-hidden="true">'+LINE_ART[side].map(d=>'<path d="'+d+'"/>').join('')+'</g>';
    const photo=photographic?'<image class="ls-realistic-anatomy" href="/assets/anatomy-'+side+'.webp?v=4k0250" x="0" y="0" width="'+imageWidth+'" height="'+imageHeight+'" preserveAspectRatio="xMidYMid meet"/>':'';
    const figure=gender==='male'?photo+shapes:base+shapes+details;
    const footer='';
    return '<svg class="ls-anatomy ls-anatomy-premium '+gender+' ls-anatomy-'+side+'" viewBox="0 0 '+(photographic?imageWidth:300)+' '+(photographic?imageHeight:596)+'" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="'+(gender==='female'?'Female':'Male')+' muscular anatomy, '+side+' view. Select a muscle group." preserveAspectRatio="xMidYMid meet">'+
      '<title>'+escape(gender==='female'?'Female':'Male')+' anatomy, '+side+' view</title>'+defs+bg+
      '<g class="ls-atlas-figure">'+figure+'</g>'+footer+'</svg>';
  }
  globalThis.LastSetAnatomy=Object.freeze({version:VERSION,render,frontGroups:Object.keys(FRONT),backGroups:Object.keys(BACK)});
})();
/* LastSet premium anatomy atlas. Original, interactive SVG artwork. */
(() => {
  'use strict';
  const VERSION='0.15.0';
  const GROUP_LABELS={Chest:'Chest',Shoulders:'Shoulders',Arms:'Arms',Core:'Core',Back:'Back',Legs:'Legs'};
  const FRONT={
    Shoulders:[
      'M112 109 Q100 108 91 116 Q81 123 80 138 Q81 155 90 166 Q100 164 106 153 Q111 136 119 122 Z',
      'M188 109 Q200 108 209 116 Q219 123 220 138 Q219 155 210 166 Q200 164 194 153 Q189 136 181 122 Z'
    ],
    Chest:[
      'M120 130 Q132 123 148 132 L148 173 Q137 185 124 182 Q112 181 106 165 Q109 145 120 130 Z',
      'M180 130 Q168 123 152 132 L152 173 Q163 185 176 182 Q188 181 194 165 Q191 145 180 130 Z',
      'M116 184 Q133 191 148 183 L148 190 Q130 198 116 190 Z',
      'M184 184 Q167 191 152 183 L152 190 Q170 198 184 190 Z'
    ],
    Arms:[
      'M80 158 Q89 163 93 174 Q94 193 86 211 L76 231 Q68 228 66 217 Q66 193 74 172 Z',
      'M220 158 Q211 163 207 174 Q206 193 214 211 L224 231 Q232 228 234 217 Q234 193 226 172 Z',
      'M66 225 Q79 224 80 239 Q76 263 69 286 Q65 299 56 306 L48 298 Q52 259 59 237 Z',
      'M234 225 Q221 224 220 239 Q224 263 231 286 Q235 299 244 306 L252 298 Q248 259 241 237 Z',
      'M87 179 Q89 195 82 213 Q78 219 76 221 L72 211 Q75 193 81 178 Z',
      'M213 179 Q211 195 218 213 Q222 219 224 221 L228 211 Q225 193 219 178 Z'
    ],
    Core:[
      'M124 195 Q135 197 147 193 L147 214 Q134 218 124 213 Z',
      'M153 193 Q165 197 176 195 L176 213 Q166 218 153 214 Z',
      'M123 219 Q135 223 147 219 L147 241 Q136 245 124 239 Z',
      'M153 219 Q165 223 177 219 L176 239 Q164 245 153 241 Z',
      'M127 246 Q136 250 147 246 L147 267 Q138 270 130 264 Z',
      'M153 246 Q164 250 173 246 L170 264 Q162 270 153 267 Z',
      'M111 186 Q119 193 121 214 Q118 239 126 271 L117 284 Q109 266 110 247 Q106 218 104 203 Z',
      'M189 186 Q181 193 179 214 Q182 239 174 271 L183 284 Q191 266 190 247 Q194 218 196 203 Z'
    ],
    Legs:[
      'M116 309 Q128 310 144 318 L142 389 Q136 405 123 414 Q116 396 114 371 Q109 339 116 309 Z',
      'M184 309 Q172 310 156 318 L158 389 Q164 405 177 414 Q184 396 186 371 Q191 339 184 309 Z',
      'M146 321 Q137 335 141 376 L143 410 Q150 416 150 406 L149 322 Z',
      'M154 321 Q163 335 159 376 L157 410 Q150 416 150 406 L151 322 Z',
      'M120 419 Q133 422 144 415 L144 459 Q139 468 130 475 Q122 464 121 448 Z',
      'M180 419 Q167 422 156 415 L156 459 Q161 468 170 475 Q178 464 179 448 Z',
      'M123 475 Q134 484 143 472 Q144 489 139 518 L136 541 L121 542 Q119 520 122 496 Z',
      'M177 475 Q166 484 157 472 Q156 489 161 518 L164 541 L179 542 Q181 520 178 496 Z'
    ]
  };
  const BACK={
    Shoulders:[
      'M111 110 Q96 108 87 120 Q78 134 83 154 Q88 164 95 166 Q108 150 119 127 Z',
      'M189 110 Q204 108 213 120 Q222 134 217 154 Q212 164 205 166 Q192 150 181 127 Z'
    ],
    Back:[
      'M142 114 Q128 120 120 139 Q121 152 132 163 L148 178 L148 132 Z',
      'M158 114 Q172 120 180 139 Q179 152 168 163 L152 178 L152 132 Z',
      'M116 145 Q102 155 107 185 Q108 203 121 219 Q129 226 143 234 L146 186 Q124 170 116 145 Z',
      'M184 145 Q198 155 193 185 Q192 203 179 219 Q171 226 157 234 L154 186 Q176 170 184 145 Z',
      'M123 171 Q136 184 147 194 L146 226 Q132 216 124 203 Z',
      'M177 171 Q164 184 153 194 L154 226 Q168 216 176 203 Z',
      'M126 225 Q140 234 148 238 L148 280 Q133 276 117 286 Q118 257 126 225 Z',
      'M174 225 Q160 234 152 238 L152 280 Q167 276 183 286 Q182 257 174 225 Z',
      'M117 124 Q129 109 148 108 L148 125 Q131 137 125 152 Z',
      'M183 124 Q171 109 152 108 L152 125 Q169 137 175 152 Z'
    ],
    Arms:[
      'M82 163 Q89 165 90 183 Q84 210 76 228 L66 222 Q65 201 75 175 Z',
      'M218 163 Q211 165 210 183 Q216 210 224 228 L234 222 Q235 201 225 175 Z',
      'M64 230 Q79 231 78 245 L67 284 Q63 299 57 309 L48 300 Q53 266 57 243 Z',
      'M236 230 Q221 231 222 245 L233 284 Q237 299 243 309 L252 300 Q247 266 243 243 Z',
      'M87 177 Q88 197 78 218 L72 219 Q75 194 80 178 Z',
      'M213 177 Q212 197 222 218 L228 219 Q225 194 220 178 Z'
    ],
    Legs:[
      'M117 284 Q131 279 147 292 L147 326 Q136 337 125 330 Q111 322 110 303 Z',
      'M183 284 Q169 279 153 292 L153 326 Q164 337 175 330 Q189 322 190 303 Z',
      'M117 336 Q132 345 145 338 L143 399 Q140 414 131 420 Q122 415 116 391 Z',
      'M183 336 Q168 345 155 338 L157 399 Q160 414 169 420 Q178 415 184 391 Z',
      'M123 428 Q131 422 144 429 L140 477 Q134 492 123 484 Q118 465 123 428 Z',
      'M177 428 Q169 422 156 429 L160 477 Q166 492 177 484 Q182 465 177 428 Z',
      'M123 484 Q134 493 141 484 L138 542 L120 543 Z',
      'M177 484 Q166 493 159 484 L162 542 L180 543 Z'
    ]
  };
  const BASE={
    head:'M150 23 C134 23 125 36 126 55 Q126 73 134 82 Q139 88 150 90 Q161 88 166 82 Q174 73 174 55 C175 36 166 23 150 23 Z',
    neck:'M138 83 Q143 92 141 106 L125 112 Q140 124 150 124 Q160 124 175 112 L159 106 Q157 92 162 83 Z',
    torsoMale:'M117 110 Q103 114 100 146 L103 196 Q109 223 111 247 Q115 261 110 282 Q116 303 150 311 Q184 303 190 282 Q185 261 189 247 Q191 223 197 196 L200 146 Q197 114 183 110 Q166 119 150 119 Q134 119 117 110 Z',
    torsoFemale:'M122 113 Q107 120 106 146 L108 186 Q116 213 111 239 Q105 258 105 281 Q118 305 150 315 Q182 305 195 281 Q195 258 189 239 Q184 213 192 186 L194 146 Q193 120 178 113 Q164 121 150 121 Q136 121 122 113 Z',
    armLeft:'M101 120 Q85 109 78 121 Q70 132 69 155 L64 210 Q60 225 58 239 L47 291 Q43 308 39 320 Q36 336 41 349 Q44 356 49 352 L56 321 Q62 316 68 305 L81 262 Q88 235 92 220 L100 175 Z',
    armRight:'M199 120 Q215 109 222 121 Q230 132 231 155 L236 210 Q240 225 242 239 L253 291 Q257 308 261 320 Q264 336 259 349 Q256 356 251 352 L244 321 Q238 316 232 305 L219 262 Q212 235 208 220 L200 175 Z',
    legLeft:'M114 291 Q108 310 109 347 L114 401 Q117 432 120 463 Q117 493 120 528 L119 551 Q113 565 109 571 Q108 579 115 582 L150 582 Q153 577 147 564 Q144 535 146 501 Q150 470 148 435 L149 315 Z',
    legRight:'M186 291 Q192 310 191 347 L186 401 Q183 432 180 463 Q183 493 180 528 L181 551 Q187 565 191 571 Q192 579 185 582 L150 582 Q147 577 153 564 Q156 535 154 501 Q150 470 152 435 L151 315 Z'
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
    const groups=side==='back'?BACK:FRONT;
    const defs='<defs>'+
      '<linearGradient id="ls-atlas-body" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#544663"/><stop offset=".43" stop-color="#30253d"/><stop offset="1" stop-color="#191624"/></linearGradient>'+
      '<linearGradient id="ls-atlas-muscle" x1=".08" y1="0" x2=".94" y2="1"><stop stop-color="#bd82de"/><stop offset=".38" stop-color="#7f4b9f"/><stop offset=".72" stop-color="#573a78"/><stop offset="1" stop-color="#342549"/></linearGradient>'+
      '<linearGradient id="ls-atlas-active" x1=".16" y1="0" x2=".89" y2="1"><stop stop-color="#e9ffa5"/><stop offset=".46" stop-color="#b9ff64"/><stop offset="1" stop-color="#59ac58"/></linearGradient>'+
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
      const segments=groups[group].map((d,index)=>
        '<path class="ls-atlas-segment" data-segment="'+index+'" d="'+d+'"/>').join('');
      return '<g class="ls-muscle-hit ls-atlas-group'+(isActive?' active':'')+'" data-explore-group="'+group+'" role="button" tabindex="0" aria-pressed="'+(isActive?'true':'false')+'" aria-label="Explore '+escape(GROUP_LABELS[group])+'">'+
        '<title>'+escape(GROUP_LABELS[group])+'</title>'+segments+'</g>';
    }).join('');
    const details='<g class="ls-atlas-etch" aria-hidden="true">'+LINE_ART[side].map(d=>'<path d="'+d+'"/>').join('')+'</g>';
    const footer='<g class="ls-atlas-marker" aria-hidden="true"><circle cx="150" cy="591" r="2.5"/></g>';
    return '<svg class="ls-anatomy ls-anatomy-premium '+gender+'" viewBox="0 0 300 596" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="'+(gender==='female'?'Female':'Male')+' muscular anatomy, '+side+' view. Select a muscle group." preserveAspectRatio="xMidYMid meet">'+
      '<title>'+escape(gender==='female'?'Female':'Male')+' anatomy, '+side+' view</title>'+defs+bg+
      '<g class="ls-atlas-figure">'+base+shapes+topography+details+'</g>'+footer+'</svg>';
  }
  globalThis.LastSetAnatomy=Object.freeze({version:VERSION,render,frontGroups:Object.keys(FRONT),backGroups:Object.keys(BACK)});
})();
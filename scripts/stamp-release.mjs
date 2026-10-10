/* Stable per-build version tags for all local JS/CSS references.
   This is deliberately a deployment ID, not Date.now() on each request. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

export function releaseId(){
  let sha=process.env.LASTSET_RELEASE_ID||process.env.GITHUB_SHA||'';
  if(!sha){
    try{sha=execFileSync('git',['rev-parse','--short=12','HEAD'],{encoding:'utf8'}).trim();}
    catch(_){sha=Date.now().toString(36);}
  }
  return String(sha).trim().replace(/[^a-zA-Z0-9_-]/g,'').slice(0,28)||Date.now().toString(36);
}

export function stampHtml(html,id){
  // Touch external JS/CSS only. Inline scripts, data URLs and user data stay intact.
  return String(html).replace(/<(script|link)\b[^>]*>/gi,tag=>
    tag.replace(/\b(src|href)=(["'])([^"']+)\2/gi,(full,attr,q,raw)=>{
      if(/^(https?:)?\/\//i.test(raw)||raw.startsWith('data:'))return full;
      const split=raw.match(/^([^?#]+\.(?:js|css))(\?[^#]*)?(#.*)?$/i);
      if(!split)return full;
      const params=new URLSearchParams((split[2]||'').slice(1));
      params.delete('v');
      params.set('v',id);
      return attr+'='+q+split[1]+'?'+params.toString()+(split[3]||'')+q;
    })
  );
}

export function stampBuild(dir,id){
  const dist=path.resolve(dir);
  fs.writeFileSync(path.join(dist,'lastset-build.json'),JSON.stringify({
    id,builtAt:new Date().toISOString(),schema:1
  })+'\n');
  for(const name of ['index.html','app-v12.html']){
    const file=path.join(dist,name);
    let html=stampHtml(fs.readFileSync(file,'utf8'),id);
    if(!html.includes('name="lastset-release"')){
      html=html.replace('</head>','<meta name="lastset-release" content="'+id+'">\n</head>');
    }
    fs.writeFileSync(file,html);
  }
  for(const name of ['service-worker.js']){
    const file=path.join(dist,name);
    fs.writeFileSync(file,fs.readFileSync(file,'utf8').replaceAll('__LASTSET_BUILD_ID__',id));
  }
}

if(process.argv[1] && path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
  const id=releaseId();
  stampBuild(process.argv[2]||'dist',id);
  console.log('LastSet build version:',id);
}

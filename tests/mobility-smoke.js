const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const js=fs.readFileSync('lastset-mobility.js','utf8');
const source=fs.readFileSync('index.html','utf8');
const worker=fs.readFileSync('worker.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const build=fs.readFileSync('build-cloudflare.sh','utf8');
assert(source.includes("'Mobility & Recovery'"),'Mobility shortcut is missing');
assert(!source.includes("action('purple','📷','Scan Machine'"),'Machine Scan shortcut remains visible');
assert(!source.includes("case 'scan':return scanScreen()"),'Machine Scan route remains exposed');
assert(!source.includes("case 'scan': return scanScreen()"),'Machine Scan route remains exposed');
assert(worker.includes('lastset-mobility.js')&&worker.includes('lastset-mobility.css'));
assert(sw.includes("'./lastset-mobility.js'")&&sw.includes("'./lastset-mobility.css'"));
assert(build.includes('lastset-mobility.js')&&build.includes('lastset-mobility.css'));
assert(source.includes("s.type==='mobility'"),'Rest day must treat mobility as active training');
const state={view:'day',selectedDate:'2026-10-10',month:new Date(2026,9,1)};
const data={sessions:{}};
let rerenders=0,oldParserCalls=0;
const oldParser=(t)=>{oldParserCalls++;return {summary:'Old',items:[]};};
const originalScreen=()=>'<main>base screen</main>';
const fn={
  screen:originalScreen,dayAction:()=>{},bindEvents:()=>{},sessionCard:()=>'old card',
  calendarScreen:()=>'<main><div class="stats"><div class="stat"><span>Cardio</span></div></div></main>',
  progressScreen:()=>'<main><div class="card">strength</div></main>',
  parseSmartWorkout:oldParser,aiActivityHtml:()=>'old preview',getSmartMissing:()=>null,
  handleSmartConversationReply:()=>{},saveSmartLogWorkout:()=>{}
};
const ctx={...fn,state,data,console,Date,Number,String,Array,Object,Math,Set,Map,globalThis:null,
   escapeHtml:s=>String(s),render:()=>{rerenders++;},showToast:()=>{},sessionsFor:(day)=>data.sessions[day]||[],
   saveData:()=>{},addSession:()=>{},removeRestSessions:()=>{},cryptoId:()=>'unique',
   profileName:()=>'QA'};
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(js,ctx);
const m=ctx.LastSetMobility;
assert(m,'Mobility extension did not initialize');
assert.equal(m.parseDuration('45 minutes'),45);
assert.equal(m.parseDuration('1 hour 15 mins'),75);
assert.equal(m.parseDuration('5 minutes'),5);
assert.equal(m.parseDuration('0 minutes'),0);
assert.equal(m.parseDuration('1000 minutes'),0);
assert.equal(m.identifyActivity('Did vinyasa today'),'Yoga');
assert.equal(m.identifyActivity('Foam rolling for hips'),'Foam Rolling');
assert.equal(m.identifyActivity('Reformer Pilates'),'Pilates');
assert.equal(m.identifyActivity('Mobility drills'),'Mobility Drills');
assert.equal(m.identifyActivity('Stretching'), 'Stretching');
assert.equal(m.identifyActivity('Ran 5k'),'');
assert.equal(m.detectMobility('45 minutes of Vinyasa yoga').durationMinutes,45);
assert.equal(m.detectMobility('30 min Mat Pilates').style,'Mat');
assert.equal(m.detectMobility('20 mins gentle yoga').intensity,'Gentle');
assert.equal(m.detectMobility('40 minutes intense Pilates').intensity,'Intense');
ctx.dayAction('mobility');
assert.equal(state.view,'mobility-list');
assert(ctx.screen().includes('Mobility &amp; Recovery'));
assert(ctx.screen().includes('Yoga'));
assert(!ctx.screen().includes('Scan Machine'));
ctx.dayAction('scan');
assert.equal(state.view,'mobility-list','Machine Scan opened a hidden route');
state.view='day';
const parsed=ctx.parseSmartWorkout('45 minutes of Vinyasa yoga');
assert.equal(parsed.items[0].kind,'mobility');
assert.equal(parsed.items[0].durationMinutes,45);
assert.equal(parsed.items[0].style,'Vinyasa');
assert.equal(oldParserCalls,0,'Simple yoga sentence should not enter resistance parser');
const missing=ctx.parseSmartWorkout('Yoga yesterday');
assert.equal(ctx.getSmartMissing(missing).type,'mobility-duration');
assert(ctx.aiActivityHtml(parsed.items[0],0).includes('45 min'));
data.sessions['2026-10-10']=[{id:'saved',type:'mobility',activity:'Yoga',duration:45,intensity:'Gentle',style:'Hatha'}];
assert(ctx.sessionCard(data.sessions['2026-10-10'][0]).includes('data-edit-mobility'));
assert(ctx.calendarScreen().includes('>1</strong><span>Mobility'));
assert(ctx.progressScreen().includes('45</b> minutes'));
assert(ctx.progressScreen().includes('ls-mobility-progress-card'));
assert.equal(rerenders,1);
console.log('Mobility & Recovery smoke tests passed');

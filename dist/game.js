import {freshState,steer,jump,duck,tick,interact,makeRow} from './engine.mjs';
import {createScene} from './scene.js';
import {BIOMES,landscapeAt} from './biomes.mjs';
const $=id=>document.getElementById(id);
let state=freshState(),view,items=[],nextRow=40,last=0,flash=0,shake=0,toastTime=0,uiTime=0,muted=true,audioContext,best=0,oldBest=0,previousMode='menu',lastMult=1;
let currentLandscape=-1,lastSegment=0;
try{
  best=Number(localStorage.getItem('unbridled-best-score')||0);if(!Number.isFinite(best))best=0;
  muted=localStorage.getItem('unbridled-sound')!=='1';
}catch{}
$('intro-best').textContent=Math.floor(best).toLocaleString();
$('sound').setAttribute('aria-label',muted?'Turn sound on':'Turn sound off');
$('sound-wave').setAttribute('d',muted?'m16 9 5 6m0-6-5 6':'M15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14');
function mode(value){state.mode=value;$('game').dataset.mode=value;}
function toast(text,tone=''){$('toast').textContent=text;$('toast').dataset.tone=tone;$('toast').classList.add('show');toastTime=1.6;}
function sound(kind){
  if(muted)return;
  try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();const now=audioContext.currentTime;
  const notes=kind==='hit'?[100,65]:kind==='gold'?[392,494,587,784]:kind==='jump'?[180,300]:kind==='hoof'?[75]:[523,659];
  notes.forEach((f,i)=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type=kind==='hit'?'sawtooth':'sine';osc.frequency.setValueAtTime(f,now+i*.065);gain.gain.setValueAtTime(kind==='hoof'?.022:.07,now+i*.065);gain.gain.exponentialRampToValueAtTime(.001,now+i*.065+.13);osc.connect(gain);gain.connect(audioContext.destination);osc.start(now+i*.065);osc.stop(now+i*.065+.15);});}catch{}
}
function start(){
  for(const item of items)view.release(item);items=[];state=freshState();nextRow=40;flash=0;shake=0;oldBest=best;lastSegment=0;lastMult=1;updateLandscape();
  for(const d of document.querySelectorAll('dialog[open]'))d.close();mode('running');$('start').blur();toast('HIT THE TRAIL!');sound('gold');
  addItem({lane:0,type:'carrot',z:-25});addItem({lane:1,type:'carrot',z:-48});addItem({lane:-1,type:'fence',z:-48});addItem({lane:0,type:'fence',z:-75});addItem({lane:-1,type:'carrot',z:-75});nextRow=22;
}
function addItem(data){const item={...data,hit:false};view.obtain(item);items.push(item);}
function finish(){
  const score=totalScore();state.sprinting=false;best=Math.max(best,score);try{localStorage.setItem('unbridled-best-score',String(best));}catch{}
  $('final-score').textContent=score.toLocaleString();$('final-best').textContent=best.toLocaleString();$('intro-best').textContent=best.toLocaleString();$('finish-label').textContent=score>oldBest?'A NEW PERSONAL BEST':'A GOOD DAY TO GALLOP';mode('finished');$('finish').showModal();
}
function totalScore(){return Math.floor(state.distance)+state.points;}
function comboMult(){return Math.min(5,1+Math.floor(state.combo/5));}
function pause(){if(state.mode!=='running')return;state.sprinting=false;mode('paused');$('pause-dialog').showModal();}
function resume(){if(state.mode!=='paused')return;$('pause-dialog').close();mode('running');last=performance.now();}
function openGuide(){previousMode=state.mode;if(state.mode==='running'){state.sprinting=false;mode('paused');}$('guide').showModal();}
function closeGuide(){if($('guide').open)$('guide').close();if(previousMode==='running')mode('running');last=performance.now();}
function doJump(){if(state.mode!=='running')return;jump(state);if(state.y<.1)sound('jump');}
function doSteer(d){if(state.mode==='running')steer(state,d);}
function doDuck(){if(state.mode==='running')duck(state);}
$('start').addEventListener('click',start);$('again').addEventListener('click',start);$('restart-pause').addEventListener('click',start);$('pause').addEventListener('click',pause);$('resume').addEventListener('click',resume);$('help').addEventListener('click',openGuide);$('guide').querySelector('.close').addEventListener('click',closeGuide);$('guide').querySelector('.close-guide').addEventListener('click',closeGuide);
$('guide').addEventListener('cancel',e=>{e.preventDefault();closeGuide();});$('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});$('finish').addEventListener('cancel',e=>e.preventDefault());
$('sound').addEventListener('click',()=>{muted=!muted;try{localStorage.setItem('unbridled-sound',muted?'0':'1');}catch{}$('sound').setAttribute('aria-label',muted?'Turn sound on':'Turn sound off');$('sound-wave').setAttribute('d',muted?'m16 9 5 6m0-6-5 6':'M15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14');sound('carrot');});
document.addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup','arrowdown',' ','shift'].includes(key)&&state.mode==='running')e.preventDefault();
  if(key==='m'){$('sound').click();return;}
  if($('guide').open||$('finish').open)return;
  if(state.mode==='menu'&&key==='arrowup'&&!$('start').disabled){e.preventDefault();start();return;}
  if(key==='p'||key==='escape'){e.preventDefault();if(state.mode==='running')pause();else if(state.mode==='paused')resume();return;}
  if(state.mode!=='running')return;
  if(!e.repeat){if(key==='arrowleft'||key==='a')doSteer(-1);if(key==='arrowright'||key==='d')doSteer(1);if(key===' '||key==='arrowup'||key==='w')doJump();if(key==='arrowdown'||key==='s')doDuck();}
  if(key==='shift')state.sprinting=true;
});
document.addEventListener('keyup',e=>{if(e.key==='Shift')state.sprinting=false;});
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
for(const [id,action] of [['left',()=>doSteer(-1)],['right',()=>doSteer(1)],['jump',doJump],['duck',doDuck]])$(id).addEventListener('pointerdown',e=>{e.preventDefault();action();});
$('sprint').addEventListener('pointerdown',e=>{e.preventDefault();$('sprint').setPointerCapture(e.pointerId);state.sprinting=state.mode==='running';});
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('sprint').addEventListener(type,()=>state.sprinting=false);
let gesture;
$('world').addEventListener('pointerdown',e=>{gesture={x:e.clientX,y:e.clientY};$('world').setPointerCapture(e.pointerId);});
$('world').addEventListener('pointerup',e=>{if(!gesture)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;gesture=null;if(Math.max(Math.abs(dx),Math.abs(dy))<22){doJump();return;}if(Math.abs(dx)>Math.abs(dy))doSteer(Math.sign(dx));else if(dy<0)doJump();else doDuck();});
$('world').addEventListener('pointercancel',()=>gesture=null);
$('world').addEventListener('webglcontextlost',e=>{e.preventDefault();pause();$('error-message').textContent='The 3D view was interrupted. Reload to get back on the trail. Your best run is saved.';$('error').hidden=false;});
const messages={carrot:'CARROT KICK!',apple:'APPLE!',gold:'GOLDEN GALLOP!',mud:'MUDDY HOOVES!',smash:'UNSTOPPABLE!',hit:'SHAKE IT OFF!',protected:'SAFE & SOUND!'};
const toastTone={apple:'ok',mud:'mud',hit:'hit',protected:'ok'};
function updateUI(){
  $('score').textContent=totalScore().toLocaleString();$('hearts').textContent='♥ '.repeat(state.hearts)+'♡ '.repeat(3-state.hearts);$('hearts').setAttribute('aria-label',`${state.hearts} hearts`);
  $('energy').style.transform=`scaleX(${state.energy/100})`;$('energy-label').textContent=state.energy<5?'CATCH YOUR BREATH':matchMedia('(pointer:coarse)').matches?'HOLD ϟ':'HOLD SHIFT';
  $('speed').textContent=Math.round(state.speed*1.8);$('gait').textContent=state.mud?'MUDDY':state.sting?'STUNG':state.gold?'GOLDEN':state.sprinting&&state.energy>1?'SPRINT':state.carrot?'BOOST':'CANTER';
  let label='',ratio=0;if(state.gold){label='✦ GOLDEN GALLOP';ratio=state.gold/5;}else if(state.mud){label='MUDDY HOOVES';ratio=state.mud/2.2;}else if(state.sting){label='BEE STING';ratio=state.sting/1.8;}else if(state.carrot){label='CARROT KICK';ratio=state.carrot/4;}else if(state.invincible){label='PROTECTED';ratio=state.invincible/2;}
  $('effect-label').textContent=label;$('effect-time').style.transform=`scaleX(${ratio})`;
  $('speed-lines').style.opacity=state.mode==='running'&&(state.gold||state.carrot||state.sprinting&&state.energy>1)?'.7':'0';
}
function updateLandscape(){
  const {index,next,blend,segment}=landscapeAt(state.distance);
  if(currentLandscape!==index){$('landscape-base').style.backgroundImage=`url('${BIOMES[index].image}')`;$('landscape-next').style.backgroundImage=`url('${BIOMES[next].image}')`;currentLandscape=index;}
  $('landscape-next').style.opacity=blend;view.setBiome(index,next,blend);
  if(segment!==lastSegment&&state.mode==='running'){lastSegment=segment;toast(`ENTERING ${BIOMES[index].name}`,'ok');}
}
let hoofTime=0;
function loop(now){
  const dt=Math.min(.04,(now-(last||now))/1000);last=now;
  if(state.mode==='running'){
    const wasGrounded=state.y===0;tick(state,dt);const travel=state.speed*dt;
    nextRow-=travel;if(nextRow<=0){for(const item of makeRow(state.distance))addItem({...item,z:-120});nextRow=22+Math.random()*8;}
    for(const item of items){const prev=item.z;item.z+=travel;if(!item.hit&&item.z>=.9&&prev<2.1){const result=interact(state,item);if(result){const mult=comboMult();if(mult>lastMult){toast(`${mult}× STREAK!`,'ok');lastMult=mult;}else toast(messages[result],toastTone[result]||'');if(result==='hit')lastMult=1;sound(result);if(result==='hit'){flash=1;shake=1;if(navigator.vibrate)navigator.vibrate(60);}if(['carrot','apple','gold','smash'].includes(result)){view.burst(state.x,1.3,1.4,result==='gold'?42:22);view.release(item);}if(state.mode==='finished'){finish();break;}}}if(!item.hit&&item.z>2.1&&item.type==='fence'&&Math.abs(item.lane*2.35-state.x)<.75&&state.y>.8){item.hit=true;state.points+=15;toast('CLEAN JUMP!','ok');}}
    items=items.filter(item=>{if(item.z>11){view.release(item);return false;}return true;});
    if(!wasGrounded&&state.y===0)view.burst(state.x,.1,1.8,10);
    hoofTime-=dt;if(hoofTime<=0&&state.y===0){sound('hoof');hoofTime=5/state.speed;}
  }
  if(state.mode!=='paused'){flash=Math.max(0,flash-dt*5);shake=Math.max(0,shake-dt*3);toastTime-=dt;if(toastTime<=0)$('toast').classList.remove('show');}
  $('flash').style.opacity=flash*.76;
  view.render(state,dt,items,shake);
  uiTime+=dt;if(uiTime>.08){updateUI();updateLandscape();uiTime=0;}
  requestAnimationFrame(loop);
}
async function init(){
  try{view=createScene($('world'));await Promise.all(BIOMES.map(async biome=>{const image=new Image();image.src=new URL(biome.image,import.meta.url).href;await image.decode();}));updateLandscape();mode('menu');$('start').disabled=false;requestAnimationFrame(loop);}catch(error){console.error(error);$('error').hidden=false;$('error-message').textContent='The artwork or 3D graphics couldn’t load. Try a browser with WebGL enabled.';}
}
init();

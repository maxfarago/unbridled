import {freshState,steer,jump,duck,tick,interact,makeRow} from './engine.mjs';
import {createScene} from './scene.js';
import {BIOMES,landscapeAt,landmarkAt,skyOf} from './biomes.mjs';
const $=id=>document.getElementById(id);
const startAt=Math.max(0,Number(new URLSearchParams(location.search).get('at'))||0);
let state=freshState(),view,items=[],nextRow=40,last=0,flash=0,shake=0,toastTime=0,uiTime=0,muted=true,audioContext,best=0,oldBest=0,previousMode='menu',lastMult=1;
let currentLandscape=-1,currentLandmark='',lastSegment=0;
if(startAt)state.distance=startAt;
try{
  best=Number(localStorage.getItem('unbridled-best-score')||0);if(!Number.isFinite(best))best=0;
  muted=localStorage.getItem('unbridled-sound')!=='1';
}catch{}
$('intro-best').textContent=Math.floor(best).toLocaleString();
$('sound').setAttribute('aria-label',muted?'Turn sound on':'Turn sound off');
$('sound-wave').setAttribute('d',muted?'m16 9 5 6m0-6-5 6':'M15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14');
const chromeProbe=document.createElement('div');
chromeProbe.setAttribute('aria-hidden','true');
chromeProbe.style.cssText='position:fixed;left:0;bottom:0;width:0;height:env(safe-area-inset-bottom,0px);pointer-events:none;visibility:hidden';
document.body.appendChild(chromeProbe);
function pinChrome(){
  const vv=window.visualViewport,game=$('game');
  if(!game)return;
  const overlap=vv?Math.max(0,game.getBoundingClientRect().bottom-(vv.offsetTop+vv.height)):0;
  const safe=chromeProbe.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--vv-bottom',Math.max(0,overlap-safe)+'px');
}
pinChrome();
window.addEventListener('resize',pinChrome);
window.visualViewport?.addEventListener('resize',pinChrome);
window.visualViewport?.addEventListener('scroll',pinChrome);
function mode(value){state.mode=value;$('game').dataset.mode=value;}
function toast(text,tone=''){$('toast').textContent=text;$('toast').dataset.tone=tone;$('toast').classList.add('show');toastTime=1.6;}
function sound(kind){
  if(muted)return;
  try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();const now=audioContext.currentTime;
  const notes=kind==='hit'?[100,65]:kind==='gold'?[392,494,587,784]:kind==='jump'?[180,300]:kind==='hoof'?[75]:[523,659];
  notes.forEach((f,i)=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type=kind==='hit'?'sawtooth':'sine';osc.frequency.setValueAtTime(f,now+i*.065);gain.gain.setValueAtTime(kind==='hoof'?.022:.07,now+i*.065);gain.gain.exponentialRampToValueAtTime(.001,now+i*.065+.13);osc.connect(gain);gain.connect(audioContext.destination);osc.start(now+i*.065);osc.stop(now+i*.065+.15);});}catch{}
}
function paintSky(from,to){
  $('landscape-sky').style.backgroundImage=`url('${skyOf(from)}')`;
  $('landscape-sky-next').style.backgroundImage=`url('${skyOf(to)}')`;
}
function paintLandmark(src,node){node.style.backgroundImage=src?`url('${src}')`:'none';}
function start(){
  for(const item of items)view.release(item);items=[];state=freshState();if(startAt)state.distance=startAt;nextRow=40;flash=0;shake=0;oldBest=best;lastSegment=landscapeAt(state.distance).segment;lastMult=1;currentLandscape=-1;currentLandmark='';updateLandscape();
  for(const d of document.querySelectorAll('dialog[open]'))d.close();mode('running');$('start').blur();toast('HIT THE TRAIL!');sound('gold');
  addItem({lane:0,type:'carrot',z:-25});addItem({lane:1,type:'carrot',z:-48});addItem({lane:-1,type:'fence',z:-48});addItem({lane:0,type:'fence',z:-75});addItem({lane:-1,type:'carrot',z:-75});nextRow=22;
}
function addItem(data){const item={...data,hit:false};view.obtain(item);items.push(item);}
function finish(){
  const score=totalScore();best=Math.max(best,score);try{localStorage.setItem('unbridled-best-score',String(best));}catch{}
  $('final-score').textContent=score.toLocaleString();$('final-best').textContent=best.toLocaleString();$('intro-best').textContent=best.toLocaleString();$('finish-label').textContent=score>oldBest?'A NEW PERSONAL BEST':'A GOOD DAY TO GALLOP';mode('finished');$('finish').showModal();
}
function totalScore(){return Math.floor(state.distance)+state.points;}
function comboMult(){return Math.min(5,1+Math.floor(state.combo/5));}
function pause(){if(state.mode!=='running')return;mode('paused');$('pause-dialog').showModal();}
function resume(){if(state.mode!=='paused')return;$('pause-dialog').close();mode('running');last=performance.now();}
function openGuide(){previousMode=state.mode;if(state.mode==='running')mode('paused');$('guide').showModal();}
function closeGuide(){if($('guide').open)$('guide').close();if(previousMode==='running')mode('running');last=performance.now();}
function doJump(){if(state.mode!=='running')return;jump(state);if(state.y<.1)sound('jump');}
function doSteer(d){if(state.mode==='running')steer(state,d);}
function doDuck(){if(state.mode==='running')duck(state);}
$('start').addEventListener('click',start);$('again').addEventListener('click',start);$('restart-pause').addEventListener('click',start);$('pause').addEventListener('click',pause);$('resume').addEventListener('click',resume);$('help').addEventListener('click',openGuide);$('guide').querySelector('.close').addEventListener('click',closeGuide);$('guide').querySelector('.close-guide').addEventListener('click',closeGuide);
$('guide').addEventListener('cancel',e=>{e.preventDefault();closeGuide();});$('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});$('finish').addEventListener('cancel',e=>e.preventDefault());
$('sound').addEventListener('click',()=>{muted=!muted;try{localStorage.setItem('unbridled-sound',muted?'0':'1');}catch{}$('sound').setAttribute('aria-label',muted?'Turn sound on':'Turn sound off');$('sound-wave').setAttribute('d',muted?'m16 9 5 6m0-6-5 6':'M15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14');sound('carrot');});
document.addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup','arrowdown',' '].includes(key)&&state.mode==='running')e.preventDefault();
  if(key==='m'){$('sound').click();return;}
  if($('guide').open||$('finish').open)return;
  if(state.mode==='menu'&&key===' '&&!$('start').disabled){e.preventDefault();start();return;}
  if(key==='p'||key==='escape'){e.preventDefault();if(state.mode==='running')pause();else if(state.mode==='paused')resume();return;}
  if(state.mode!=='running')return;
  if(!e.repeat){if(key==='arrowleft'||key==='a')doSteer(-1);if(key==='arrowright'||key==='d')doSteer(1);if(key===' '||key==='arrowup'||key==='w')doJump();if(key==='arrowdown'||key==='s')doDuck();}
});
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
for(const [id,action] of [['left',()=>doSteer(-1)],['right',()=>doSteer(1)],['jump',doJump],['duck',doDuck]])$(id).addEventListener('pointerdown',e=>{e.preventDefault();action();});
let gesture;
$('world').addEventListener('pointerdown',e=>{gesture={x:e.clientX,y:e.clientY};$('world').setPointerCapture(e.pointerId);});
$('world').addEventListener('pointerup',e=>{if(!gesture)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;gesture=null;if(Math.max(Math.abs(dx),Math.abs(dy))<22){doJump();return;}if(Math.abs(dx)>Math.abs(dy))doSteer(Math.sign(dx));else if(dy<0)doJump();else doDuck();});
$('world').addEventListener('pointercancel',()=>gesture=null);
$('world').addEventListener('webglcontextlost',e=>{e.preventDefault();pause();$('error-message').textContent='The 3D view was interrupted. Reload to get back on the trail. Your best run is saved.';$('error').hidden=false;});
const messages={carrot:'CARROT KICK!',apple:'APPLE!',gold:'GOLDEN GALLOP!',mud:'MUDDY HOOVES!',smash:'UNSTOPPABLE!',hit:'SHAKE IT OFF!',protected:'SAFE & SOUND!'};
const toastTone={apple:'ok',mud:'mud',hit:'hit',protected:'ok'};
function updateUI(){
  $('score').textContent=totalScore().toLocaleString();$('hearts').textContent='♥ '.repeat(state.hearts)+'♡ '.repeat(3-state.hearts);$('hearts').setAttribute('aria-label',`${state.hearts} hearts`);
  $('speed').textContent=Math.round(state.speed*1.8);
  const carrotLabel=state.carrotStacks>1?`CARROT KICK ×${state.carrotStacks}`:'CARROT KICK';
  for(const row of document.querySelectorAll('#effects .effect')){
    const fx=row.dataset.fx;
    const on=fx==='gold'?state.gold:fx==='carrot'?state.carrot:fx==='ok'?state.invincible&&!state.gold:fx==='mud'?state.mud:state.sting;
    const ratio=fx==='gold'?state.gold/5:fx==='carrot'?state.carrot/4:fx==='ok'?state.invincible/2:fx==='mud'?state.mud/2.2:state.sting/1.8;
    row.hidden=!on;
    if(on){
      if(fx==='carrot')row.querySelector('span').textContent=carrotLabel;
      row.querySelector('i').style.transform=`scaleX(${ratio})`;
    }
  }
  $('speed-lines').style.opacity=state.mode==='running'&&state.carrot?'.7':'0';
}
function updateLandscape(){
  const {index,next,blend,segment}=landscapeAt(state.distance);
  const from=BIOMES[index],to=BIOMES[next],layers=from.layers||[];
  if(currentLandscape!==index){$('landscape-sky-next').style.opacity=0;paintSky(from,to);currentLandscape=index;currentLandmark='';}
  $('landscape-sky-next').style.opacity=blend;
  const mark=landmarkAt(state.distance,layers.length);
  const key=`${index}:${mark.from}:${mark.to}`;
  if(currentLandmark!==key){paintLandmark(mark.from<0?'':layers[mark.from],$('landscape-base'));paintLandmark(mark.to<0?'':layers[mark.to],$('landscape-next'));currentLandmark=key;}
  $('landscape-base').style.opacity=mark.from<0?0:1-mark.blend;
  $('landscape-next').style.opacity=mark.to<0?0:mark.blend;
  view.setBiome(index,next,blend);
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
  updateLandscape();
  uiTime+=dt;if(uiTime>.08){updateUI();uiTime=0;}
  requestAnimationFrame(loop);
}
async function init(){
  try{
    const [,v]=await Promise.all([
      Promise.all([...new Set(BIOMES.flatMap(biome=>[biome.image,skyOf(biome),...(biome.layers||[])]))].map(async src=>{const image=new Image();image.src=new URL(src,import.meta.url).href;await image.decode();})),
      createScene($('world'))
    ]);
    view=v;updateLandscape();
    requestAnimationFrame(now=>{
      last=now;
      view.render(state,0,items,0);
      mode('menu');$('start').disabled=false;requestAnimationFrame(loop);
    });
  }catch(error){console.error(error);$('error').hidden=false;$('error-message').textContent='The artwork or 3D graphics couldn’t load. Try a browser with WebGL enabled.';}
}
init();

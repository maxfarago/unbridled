import { Run, LANES } from './game.js';
import { Renderer } from './render.js';
const $=id=>document.getElementById(id);
const game=new Run();
let renderer;
try{renderer=new Renderer($('world'));}catch(e){$('error').hidden=false;console.error(e);}
const coarse=matchMedia('(pointer:coarse)').matches;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let best=0,bestScore=0,soundEnabled=false,audio=null,toastTime=0,popTime=0,flash=0,last=0,accumulator=0,hudClock=0,lastHoof=0,deathDelay=0,guidePaused=false;
try{best=Number(localStorage.getItem('unbridled-best'))||0;bestScore=Number(localStorage.getItem('unbridled-score'))||0;soundEnabled=localStorage.getItem('unbridled-sound')==='1';}catch{}
const format=n=>Math.floor(n).toLocaleString('en-US');
if(best)$('start-best').textContent=`YOUR BEST: ${format(best)} METERS. READY TO BEAT IT?`;
function soundButton(){ $('sound').setAttribute('aria-pressed',String(soundEnabled));$('sound').setAttribute('aria-label',soundEnabled?'Turn sound off':'Turn sound on');$('sound-waves').setAttribute('d',soundEnabled?'M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14':'m16 9 6 6m0-6-6 6'); }
soundButton();
function unlockAudio(){if(!audio){try{audio=new (window.AudioContext||window.webkitAudioContext)();}catch{}}if(audio?.state==='suspended')audio.resume().catch(()=>{});}
function tone(freq,duration=.1,type='sine',volume=.055,slide=0,delay=0){
  if(!soundEnabled||!audio||audio.state!=='running')return;
  const at=audio.currentTime+delay,osc=audio.createOscillator(),gain=audio.createGain();
  osc.type=type;osc.frequency.setValueAtTime(freq,at);if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(25,slide),at+duration);
  gain.gain.setValueAtTime(.001,at);gain.gain.linearRampToValueAtTime(volume,at+.005);gain.gain.exponentialRampToValueAtTime(.001,at+duration);
  osc.connect(gain);gain.connect(audio.destination);osc.start(at);osc.stop(at+duration+.01);
}
function vibrate(ms){if(!reduced&&coarse&&navigator.vibrate)navigator.vibrate(ms);}
function toast(message,tone=''){ const el=$('toast');el.textContent=message;el.dataset.tone=tone;el.classList.add('show');toastTime=1.45; }
function scorePop(message){$('combo-pop').textContent=message;$('combo-pop').classList.add('show');popTime=.65;}
function start(){
  if(!renderer)return;
  unlockAudio();game.reset();game.start();accumulator=0;deathDelay=0;lastHoof=0;flash=0;popTime=0;renderer.shake=0;renderer.squash=0;renderer.particles.length=0;
  $('combo-pop').classList.remove('show');
  $('start-screen').hidden=true;$('over-screen').hidden=true;$('pause-screen').hidden=true;$('hud').hidden=false;$('pause').hidden=false;$('touch-controls').hidden=!coarse;
  $('desktop-help').style.opacity=coarse?'0':'.85';toast('HIT THE TRAIL!');updateHud();tone(330,.1,'triangle',.08,550);tone(660,.15,'triangle',.065,880,.12);
  document.activeElement?.blur();
}
function pause(){if(game.phase!=='running')return;game.phase='paused';$('pause-screen').hidden=false;$('touch-controls').hidden=true;$('resume').focus();}
function resume(){if(game.phase!=='paused')return;game.phase='running';$('pause-screen').hidden=true;$('touch-controls').hidden=!coarse;accumulator=0;document.activeElement?.blur();unlockAudio();}
function openGuide(){guidePaused=game.phase==='running';if(guidePaused)pause();$('guide').showModal();}
function closeGuide(){$('guide').close();}
$('guide').addEventListener('close',()=>{if(guidePaused){guidePaused=false;resume();}});
function end(){
  const distance=Math.floor(game.distance),score=Math.floor(game.score),record=distance>best;
  best=Math.max(best,distance);bestScore=Math.max(bestScore,score);
  try{localStorage.setItem('unbridled-best',String(best));localStorage.setItem('unbridled-score',String(bestScore));}catch{}
  $('result-label').textContent=record?'A NEW PERSONAL BEST!':'A GOOD DAY TO GALLOP';
  $('result-distance').textContent=format(distance);$('result-score').textContent=format(score);$('result-shoes').textContent=format(game.shoes);$('result-best').textContent=`${format(best)} m`;
  $('result-reason').textContent=game.reason;$('over-screen').hidden=false;$('pause').hidden=true;$('touch-controls').hidden=true;$('hud').hidden=true;
  $('toast').classList.remove('show');$('again').focus();
}
function action(name){unlockAudio();if(game.phase!=='running')return;if(name==='left')game.move(-1);else if(name==='right')game.move(1);else if(name==='jump')game.jump();else if(name==='duck')game.crouch();}
$('start').addEventListener('click',start);$('again').addEventListener('click',start);$('resume').addEventListener('click',resume);$('restart-pause').addEventListener('click',start);
$('pause').addEventListener('click',pause);$('guide-button').addEventListener('click',openGuide);$('guide-link').addEventListener('click',openGuide);$('guide-done').addEventListener('click',closeGuide);$('close-guide').addEventListener('click',closeGuide);
$('sound').addEventListener('click',()=>{soundEnabled=!soundEnabled;unlockAudio();soundButton();try{localStorage.setItem('unbridled-sound',soundEnabled?'1':'0');}catch{}if(soundEnabled)tone(660,.1,'triangle');});
document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('pointerdown',event=>{event.preventDefault();action(button.dataset.action);}));
document.addEventListener('keydown',event=>{
  if($('guide').open)return;
  const key=event.key.toLowerCase();
  if(['arrowleft','arrowright','arrowup','arrowdown',' ','a','d','w','s','p','escape'].includes(key))event.preventDefault();
  if(event.repeat)return;
  if(key==='m'){$('sound').click();return;}
  if(key==='escape'||key==='p'){if(game.phase==='running')pause();else if(game.phase==='paused')resume();return;}
  if(key==='enter'||key===' '){
    if(game.phase==='ready'||(game.phase==='over'&&deathDelay<=0)){event.preventDefault();start();return;}
    if(game.phase==='paused'){event.preventDefault();resume();return;}
  }
  if(key==='arrowleft'||key==='a')action('left');
  if(key==='arrowright'||key==='d')action('right');
  if(key==='arrowup'||key==='w'||key===' ')action('jump');
  if(key==='arrowdown'||key==='s')action('duck');
});
let swipe=null;
$('world').addEventListener('pointerdown',e=>{if(game.phase!=='running')return;swipe={x:e.clientX,y:e.clientY,id:e.pointerId};$('world').setPointerCapture(e.pointerId);});
$('world').addEventListener('pointermove',e=>{if(!swipe||e.pointerId!==swipe.id)return;const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;if(Math.max(Math.abs(dx),Math.abs(dy))<26)return;action(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy<0?'jump':'duck'));swipe=null;});
$('world').addEventListener('pointerup',()=>{swipe=null;});$('world').addEventListener('pointercancel',()=>{swipe=null;});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();last=performance.now();accumulator=0;});
window.addEventListener('blur',()=>pause());
$('world').addEventListener('webglcontextlost',e=>{e.preventDefault();pause();$('error-message').textContent='The 3D view was interrupted. Reload to get back on the trail. Your best run is saved.';$('error').hidden=false;});
function updateHud(){
  $('distance').textContent=format(game.distance);$('score').textContent=format(game.score);$('shoes').textContent=game.shoes;$('combo').textContent=`×${game.multiplier}`;
  const hearts=Array.from({length:3},(_,i)=>i<game.health?'♥':'<span class="lost">♥</span>').join(' ');
  if($('hearts').innerHTML!==hearts)$('hearts').innerHTML=hearts;
  $('hearts').setAttribute('aria-label',`${game.health} hearts`);$('shield-label').hidden=!game.shield;
  $('biome-label').textContent=['TERRACOTTA DAWN','MIDDAY HEAT','DESERT NIGHT'][Math.floor(game.distance/700)%3];
  $('speed-lines').style.opacity=game.boost>0&&game.phase==='running'?'.7':'0';
}
function events(){
  for(const event of game.events){
    const e=event.entity,x=e?LANES[e.lane]:game.x;
    switch(event.type){
      case 'jump':tone(180,.15,'sine',.04,420);renderer.burst(game.x,.15,.3,[.80,.72,.48],6,2);break;
      case 'duck':tone(200,.09,'triangle',.025,80);break;
      case 'lane':tone(230,.04,'sine',.014,170);break;
      case 'land':renderer.squash=1;renderer.burst(game.x,.12,.5,[.79,.69,.45],7,2.6);tone(95,.075,'triangle',.05,42);vibrate(8);break;
      case 'collect':renderer.burst(x,1.35,-e.d,[1,.79,.25],7,3);tone(540+game.combo*27,.11,'sine',.045,850+game.combo*25);if(game.combo%5===0){scorePop(`×${game.multiplier} MULTIPLIER!`);vibrate(10);}break;
      case 'carrot':renderer.burst(x,1.3,0,[1,.45,.12],24,6);toast('COYOTE RUSH!','rush');[330,440,550,880].forEach((f,i)=>tone(f,.16,'triangle',.065,0,i*.065));vibrate([18,25,18]);break;
      case 'apple':renderer.burst(x,1.3,0,[.86,.28,.16],20,4);toast(game.shield?'APPLE SHIELD!':'+1 HEART!','ok');tone(660,.13,'sine',.06);tone(990,.18,'sine',.06,0,.1);vibrate(12);break;
      case 'near':scorePop('CLOSE CALL +20');tone(470,.07,'sine',.02,640);break;
      case 'clear':scorePop(e.type==='branch'?'SMOOTH DUCK +25':'CLEAN JUMP +25');tone(720,.08,'sine',.025);break;
      case 'smash':renderer.burst(x,1,0,[1,.68,.20],18,6);renderer.shake=.07;scorePop('UNSTOPPABLE!');tone(100,.13,'sawtooth',.025,40);break;
      case 'shieldBreak':renderer.burst(x,1.3,0,[.96,.84,.42],24,6);toast('SHIELD SAVED YOU!','ok');tone(760,.25,'sine',.05,200);vibrate(20);break;
      case 'hit':renderer.shake=.18;flash=.35;renderer.burst(x,.9,0,[.9,.4,.2],18,5);toast(game.health>0?'SHAKE IT OFF!':'WHOA!','hit');tone(135,.3,'sawtooth',.04,40);vibrate([35,25,45]);break;
      case 'mud':renderer.burst(x,.3,0,[.35,.27,.15],18,4);toast('MUDDY HOOVES!','mud');tone(160,.2,'triangle',.04,45);break;
      case 'rescue':if(game.health>0)toast('BACK ON YOUR HOOVES!','ok');break;
      case 'over':deathDelay=.48;$('touch-controls').hidden=true;break;
    }
  }
  game.events.length=0;
}
function frame(now){
  requestAnimationFrame(frame);if(!renderer)return;
  const raw=last?(now-last)/1000:1/60;last=now;
  if(document.hidden)return;
  const dt=Math.min(raw,.065);
  if(game.phase==='running'){
    accumulator+=dt;
    while(accumulator>=1/120){game.update(1/120);accumulator-=1/120;if(game.phase!=='running'){accumulator=0;break;}}
    events();
    if(game.grounded&&game.time-lastHoof>4.8/game.speed){lastHoof=game.time;tone(85+Math.random()*25,.055,'triangle',.024,40);}
  }else accumulator=0;
  if(deathDelay>0){deathDelay-=dt;if(deathDelay<=0)end();}
  renderer.draw(game,game.phase==='paused'?0:dt);
  hudClock+=dt;if(hudClock>.07){updateHud();hudClock=0;}
  if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').classList.remove('show');}
  if(popTime>0){popTime-=dt;if(popTime<=0)$('combo-pop').classList.remove('show');}
  flash=Math.max(0,flash-dt*2);$('flash').style.opacity=reduced?'0':flash;
}
requestAnimationFrame(frame);

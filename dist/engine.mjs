export const LANE_WIDTH=2.35;
export const TIMER_KEYS=['carrot','gold','mud','sting','invincible','duck'];
export function freshState(){return {mode:'menu',distance:0,points:0,hearts:3,lane:0,x:0,y:0,vy:0,speed:18,carrot:0,carrotStacks:0,gold:0,mud:0,sting:0,invincible:0,duck:0,jumpBuffer:0,combo:0,bestCombo:0,time:0};}
export function steer(s,direction){s.lane=Math.max(-1,Math.min(1,s.lane+direction));}
export function jump(s){s.jumpBuffer=.16;}
export function duck(s){if(s.y>.1)s.vy=Math.min(s.vy,-10);else s.duck=.75;}
export function tick(s,dt){
  if(s.mode!=='running')return;
  s.time+=dt;
  const carrotWas=s.carrot;
  for(const key of TIMER_KEYS)s[key]=Math.max(0,s[key]-dt);
  if(carrotWas&&!s.carrot)s.carrotStacks=0;
  const kick=s.carrotStacks?1+s.carrotStacks*.3:1;
  let target=(18+Math.min(10,s.distance/250))*kick*(s.mud?.52:1)*(s.sting?.7:1);
  s.speed+=(target-s.speed)*Math.min(1,dt*4);
  s.distance+=s.speed*dt;
  s.x+=(s.lane*LANE_WIDTH-s.x)*(1-Math.exp(-14*dt));
  if(s.jumpBuffer>0&&s.y<=0){s.vy=9.7;s.duck=0;s.jumpBuffer=0;}
  s.jumpBuffer=Math.max(0,s.jumpBuffer-dt);
  s.vy-=23*dt;s.y=Math.max(0,s.y+s.vy*dt);if(!s.y)s.vy=0;
}
export function interact(s,item){
  if(item.hit||Math.abs(item.lane*LANE_WIDTH-s.x)>.64)return null;
  const type=item.type;
  if(['carrot','apple','gold'].includes(type)){
    if(s.y>2.8)return null;
    item.hit=true;s.combo++;s.bestCombo=Math.max(s.bestCombo,s.combo);s.points+=25*Math.min(5,1+Math.floor(s.combo/5));
    if(type==='carrot'){s.carrot=4;s.carrotStacks=Math.min(5,s.carrotStacks+1);return 'carrot';}
    if(type==='apple'){s.hearts=Math.min(3,s.hearts+1);s.invincible=Math.max(s.invincible,2);return 'apple';}
    s.gold=5;s.invincible=Math.max(s.invincible,5);s.mud=0;s.sting=0;return 'gold';
  }
  if(type==='fence'&&s.y>.86)return null;
  if(type==='mud'&&s.y>.25)return null;
  if(type==='bees'&&s.duck>0&&s.y<.2)return null;
  item.hit=true;
  if(s.gold){s.points+=50;return 'smash';}
  if(s.invincible)return 'protected';
  if(type==='mud'){s.mud=2.2;return 'mud';}
  s.hearts--;s.combo=0;s.invincible=1.7;
  if(type==='bees')s.sting=1.8;
  if(!s.hearts)s.mode='finished';
  return 'hit';
}
export function makeRow(distance,rng=Math.random){
  const safe=Math.floor(rng()*3)-1;
  const difficulty=Math.min(1,distance/1400);
  const result=[];
  for(let lane=-1;lane<=1;lane++){
    if(lane===safe){const r=rng();result.push({lane,type:r<.16?'gold':r<.19?'apple':'carrot'});}
    else if(rng()<.53+difficulty*.36){const r=rng();result.push({lane,type:r<.5?'fence':r<.78?'mud':'bees'});}
  }
  return result;
}

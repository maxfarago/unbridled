import * as T from './assets/three.module.js';
import {LANE_WIDTH} from './engine.mjs';
import {BIOMES} from './biomes.mjs';
import {RoadFrame,PLAYER_Z,ROAD_SEGMENTS,writeRoadStrip} from './road.mjs';
import {loadHorse} from './horse-model.js';

const palette={sand:0xd5a76a,trail:0xe6bb7b,cream:0xffe0a3,shadow:0x28374d,green:0x304e49,lightGreen:0x698270,coral:0xcb7250,brown:0x563b35,gold:0xffcd64};
const materials=new Map();
function mat(color){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:1,flatShading:true}));return materials.get(color);}
const sphere=new T.SphereGeometry(1,10,7),box=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,7),cone=new T.ConeGeometry(1,1,7);
function mesh(group,geometry,color,x,y,z,sx,sy,sz){const m=new T.Mesh(geometry,mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);group.add(m);return m;}
function ell(g,c,x,y,z,sx,sy,sz){return mesh(g,sphere,c,x,y,z,sx,sy,sz);}
function cube(g,c,x,y,z,sx,sy,sz){return mesh(g,box,c,x,y,z,sx,sy,sz);}
function bone(g,c,a,b,r1,r2){const d=new T.Vector3(...b).sub(new T.Vector3(...a));const geom=r2!==undefined?new T.CylinderGeometry(r2,r1,1,6):cylinder;const m=mesh(g,geom,c,...a,r2!==undefined?1:r1,d.length(),r2!==undefined?1:r1);m.position.addScaledVector(d,.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
function combineStatic(group){
  group.updateMatrixWorld(true);const batches=new Map();
  group.traverse(object=>{if(!object.isMesh)return;const key=object.material;let batch=batches.get(key);if(!batch){batch={positions:[],normals:[],length:0};batches.set(key,batch);}const geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();geometry.applyMatrix4(object.matrixWorld);batch.positions.push(geometry.attributes.position.array);batch.normals.push(geometry.attributes.normal.array);batch.length+=geometry.attributes.position.array.length;geometry.dispose();});
  group.clear();group.position.set(0,0,0);group.rotation.set(0,0,0);group.scale.setScalar(1);
  for(const [material,batch] of batches){const geometry=new T.BufferGeometry();for(const [name,chunks] of [['position',batch.positions],['normal',batch.normals]]){const array=new Float32Array(batch.length);let offset=0;for(const chunk of chunks){array.set(chunk,offset);offset+=chunk.length;}geometry.setAttribute(name,new T.BufferAttribute(array,3));}geometry.computeBoundingSphere();group.add(new T.Mesh(geometry,material));}return group;
}
function horse(scale=1,color=0xc48b59){
  const root=new T.Group(),body=new T.Group();root.add(body);
  ell(body,color,0,1.35,.05,.47,.51,.97);
  ell(body,0xd6a16a,0,1.46,-.55,.39,.54,.49);
  ell(body,color,0,1.36,.65,.48,.49,.46);
  const neck=ell(body,0xdba871,0,1.96,-.78,.28,.72,.34);neck.rotation.x=-.38;
  const head=new T.Group();head.position.set(0,2.5,-1.12);body.add(head);
  ell(head,0xe4b781,0,0,-.08,.25,.3,.44);
  const muzzle=ell(head,0xdbc09a,0,-.16,-.41,.21,.18,.27);muzzle.rotation.x=.22;
  for(const side of [-1,1]){
    const ear=mesh(head,cone,color,side*.16,.37,.03,.10,.38,.12);ear.rotation.z=-side*.18;
    ell(head,0x251f28,side*.235,.02,-.19,.035,.047,.055);
    ell(head,0x6b5148,side*.14,-.17,-.61,.034,.033,.022);
  }
  cube(head,0xffe6b2,0,.1,-.4,.085,.26,.035).rotation.x=.5;
  // The mane follows the neck; cream socks and dark hooves keep the gait readable.
  for(let i=0;i<7;i++){const tuft=mesh(body,cone,0x423330,0,2.62-i*.13,-.90+i*.085,.16,.32,.16);tuft.rotation.x=.7;}
  const legs=[];
  for(const side of [-1,1])for(const front of [-1,1]){
    const pivot=new T.Group();pivot.position.set(side*.30,1.37,front*.61);body.add(pivot);
    bone(pivot,color,[0,0,0],[0,-.59,.06],.115);
    const knee=new T.Group();knee.position.set(0,-.59,.06);pivot.add(knee);
    bone(knee,0xe0c6a0,[0,0,0],[0,-.48,0],.078);
    cube(knee,0x30303c,0,-.51,-.045,.19,.16,.26);
    legs.push({pivot,knee,phase:(front===-1?0:2.4)+(side===-1?0:.7)});
  }
  const tail=new T.Group();tail.position.set(0,1.57,.9);body.add(tail);
  for(let i=0;i<5;i++){const t=ell(tail,0x423330,(i-2)*.053,-.30,.16,.07,.52,.1);t.rotation.x=-.55-(i%2)*.1;}
  root.scale.setScalar(scale);return {root,body,head,legs,tail};
}
function cactus(){const g=new T.Group();const h=2.3+Math.random()*2.2;bone(g,palette.green,[0,0,0],[0,h,0],.22);ell(g,palette.lightGreen,0,h,0,.22,.25,.22);for(const side of [-1,1]){const y=h*(side===1?.38:.58);bone(g,palette.green,[0,y,0],[side*.67,y,0],.17);bone(g,palette.green,[side*.67,y,0],[side*.67,y+.8,0],.17);ell(g,palette.lightGreen,side*.67,y+.8,0,.17,.2,.17);}for(let i=0;i<4;i++)bone(g,0x7b8b69,[(i-1.5)*.07,.2,.215],[(i-1.5)*.07,h-.12,.215],.012);return g;}
function tree(){const g=new T.Group();bone(g,0x4a4540,[0,0,0],[.1,3.8,0],.14);for(let i=0;i<6;i++){const a=i*2.4,x=Math.cos(a)*1.2,z=Math.sin(a)*.65,y=2.9+(i%3)*.45;bone(g,0x4a4540,[0,1.6,0],[x,y,z],.065);ell(g,i%2?0x52694e:0x364f49,x,y,z,.8,.22,.66);ell(g,0x9a9863,x-.12,y+.1,z,.55,.13,.5);}return g;}
function shrub(){const g=new T.Group();for(let i=0;i<6;i++){const a=i*2.4;const m=mesh(g,cone,i%2?0x858866:0x4a6755,Math.cos(a)*.23,.25,Math.sin(a)*.23,.16,.65,.14);m.rotation.z=Math.sin(a)*.45;m.rotation.x=Math.cos(a)*.45;}return g;}
function rabbit(){const g=new T.Group();ell(g,0x796b5a,0,.25,0,.18,.22,.32);ell(g,0xb3a084,0,.43,-.23,.13,.15,.12);for(const i of [-1,1]){ell(g,0xb3a084,i*.065,.66,-.19,.045,.20,.055);ell(g,0x514c4c,i*.1,.44,-.30,.015,.02,.018);}ell(g,0xd5c4a0,0,.29,.29,.10,.10,.10);return g;}
function fence(){const g=new T.Group();for(const x of [-.85,.85]){cube(g,0x654739,x,.65,0,.15,1.3,.16);mesh(g,cone,0xa4794e,x,1.35,0,.12,.16,.12);}for(const y of [.43,.95])cube(g,0xc59a61,0,y,0,1.94,.14,.15);const rail=cube(g,0x9c754c,0,.67,-.1,1.72,.09,.09);rail.rotation.z=.3;return g;}
function carrot(){const g=new T.Group();mesh(g,cone,0xf58a32,0,0,0,.18,.69,.18).rotation.z=Math.PI+.25;for(let i=0;i<3;i++){const leaf=mesh(g,cone,0x5e9661,(i-1)*.08,.49,0,.08,.36,.045);leaf.rotation.z=-(i-1)*.4;}return g;}
function apple(){const g=new T.Group();ell(g,0xd6523d,-.1,0,0,.22,.27,.24);ell(g,0xe67046,.1,0,0,.22,.27,.24);bone(g,0x684a39,[0,.22,0],[.06,.41,0],.025);ell(g,0x618653,.17,.34,0,.14,.045,.07).rotation.z=.4;return g;}
function gold(){const g=new T.Group();const m=new T.Mesh(new T.TorusGeometry(.31,.072,6,16,Math.PI*1.5),mat(palette.gold));m.rotation.z=-Math.PI*.25;g.add(m);for(let i=0;i<6;i++){const a=-Math.PI*.25+i*Math.PI*1.5/5;ell(g,0xffedb3,Math.cos(a)*.31,Math.sin(a)*.31,.067,.022,.022,.015);}return g;}
function bees(){const g=new T.Group();for(let i=0;i<5;i++){const b=new T.Group();b.position.set((i%3-1)*.35,(i%2)*.28,(i%2)*.3);ell(b,0xf0bc47,0,0,0,.13,.13,.21);ell(b,0x342e39,0,0,.04,.134,.134,.045);for(const side of [-1,1]){const w=ell(b,0xdbe4d5,side*.15,.13,0,.14,.025,.10);w.rotation.z=side*.4;}g.add(b);}return g;}
function mud(){const g=new T.Group();for(let i=0;i<4;i++){const m=ell(g,i%2?0x6a4b3a:0x7e5640,(i%2-.5)*.5,.035,(i-1.5)*.5,.65,.028,.5);}for(let i=0;i<3;i++)ell(g,0x9b7351,(i-1)*.3,.067,.25,.1,.01,.32);return g;}

export async function createScene(canvas){
  const horseRig=await loadHorse();
  const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
  const scene=new T.Scene();scene.fog=new T.Fog(palette.sand,60,150);
  const camera=new T.PerspectiveCamera(46,1,.1,220);
  const skyLight=new T.HemisphereLight(0xffedc5,0x546778,2.3);scene.add(skyLight);const sun=new T.DirectionalLight(0xffdfac,3);sun.position.set(-12,18,-9);scene.add(sun);
  const ground=new T.Mesh(new T.PlaneGeometry(600,400),mat(palette.sand));ground.rotation.x=-Math.PI/2;ground.position.set(0,-.05,-150);scene.add(ground);
  const roadFrame=new RoadFrame(),roadPoint={},ribbons=[];
  function ribbon(left,right,height,color){
    const geometry=new T.BufferGeometry(),positions=new Float32Array((ROAD_SEGMENTS+1)*6),normals=new Float32Array(positions.length),indices=[];
    for(let i=1;i<normals.length;i+=3)normals[i]=1;
    for(let i=0;i<ROAD_SEGMENTS;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
    geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('normal',new T.BufferAttribute(normals,3));geometry.setIndex(indices);
    writeRoadStrip(positions,roadFrame,left,right,height);
    const object=new T.Mesh(geometry,mat(color));object.frustumCulled=false;scene.add(object);ribbons.push({geometry,positions,left,right,height});
  }
  ribbon(-4,4,0,palette.trail);ribbon(-4.18,-4.06,.013,0xad8055);ribbon(4.06,4.18,.013,0xad8055);
  // Static instanced trail marks and desert gravel travel as one bounded batch.
  const count=430,gravel=new T.InstancedMesh(box,mat(0xb98b59),count),matrix=new T.Object3D();const marks=[];
  for(let i=0;i<count;i++){const x=i<190?(Math.random()-.5)*7.6:(Math.random()<.5?-1:1)*(4.7+Math.random()*34);marks.push({x,z:Math.random()*180-170,w:.025+Math.random()*.08,l:.14+Math.random()*.8});}scene.add(gravel);
  scene.add(horseRig.root);
  const shadowMat=new T.MeshBasicMaterial({color:palette.shadow,transparent:true,opacity:.23,depthWrite:false});
  const shadow=new T.Mesh(new T.CircleGeometry(1,24),shadowMat);shadow.rotation.x=-Math.PI/2;shadow.scale.set(.66,1.36,1);shadow.position.y=.025;scene.add(shadow);
  const scenery=[];
  for(let i=0;i<58;i++){let obj;const type=i%12;if(type<4)obj=cactus();else if(type===4||type===8)obj=tree();else if(type===5)obj=rabbit();else if(type===7){obj=horse(.65,0x64534a).root;obj.rotation.y=1.3;}else if(type<10)obj=shrub();else{obj=new T.Group();ell(obj,i%2?0x9c775b:0xbd9062,0,.3,0,.8,.5,.65);}
    combineStatic(obj);const side=i%2===0?-1:1;const scale=.7+Math.random()*.5;obj.scale.multiplyScalar(scale);scene.add(obj);scenery.push({object:obj,offset:side*(5.3+Math.random()*21),z:-Math.random()*175});
  }
  // Reuse pickup/obstacle groups so an endless run never grows GPU memory.
  const factories={fence,carrot,apple,gold,bees,mud},pools={};for(const [type,factory] of Object.entries(factories)){pools[type]=[];const template=combineStatic(factory());for(let i=0;i<22;i++){const object=template.clone();object.visible=false;scene.add(object);pools[type].push(object);}}
  const sparkleMat=new T.MeshBasicMaterial({color:0xffe5a5});const particles=new T.InstancedMesh(new T.IcosahedronGeometry(.045,0),sparkleMat,100);scene.add(particles);const dust=Array.from({length:100},()=>({life:0,x:0,y:0,z:0,vx:0,vy:0,vz:0}));let dustIndex=0;
  const ring=new T.Mesh(new T.TorusGeometry(.85,.018,5,45),new T.MeshBasicMaterial({color:palette.gold,transparent:true,opacity:.8}));ring.rotation.x=Math.PI/2;ring.position.y=.08;ring.visible=false;scene.add(ring);
  let elapsed=0,frame=0,slowFrames=0,quality=1.65,cameraLead=0,lastRoadDistance=-1;
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<.8?56:46;camera.updateProjectionMatrix();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);resize();
  function obtain(item){const obj=pools[item.type].find(x=>!x.visible);if(!obj)return;obj.visible=true;item.object=obj;}
  function release(item){if(item.object){item.object.visible=false;item.object=null;}}
  function burst(x,y,z,n=22){for(let i=0;i<n;i++){const p=dust[dustIndex++%dust.length];Object.assign(p,{life:.5+Math.random()*.4,x,y,z,vx:(Math.random()-.5)*4,vy:Math.random()*3,vz:(Math.random()-.5)*5});}}
  function render(s,dt,items,shake=0){
    const moving=s.mode==='running'||s.mode==='menu';const travel=moving?(s.mode==='menu'?5:s.speed)*dt:0;elapsed+=moving?dt:0;
    roadFrame.setDistance(s.distance);
    for(const strip of ribbons){writeRoadStrip(strip.positions,roadFrame,strip.left,strip.right,strip.height);strip.geometry.attributes.position.needsUpdate=true;}
    const gallop=elapsed*(s.mode==='menu'?9:Math.max(7,s.speed*.50));
    const cornerLean=reduceMotion?0:T.MathUtils.clamp(s.speed*s.speed*roadFrame.curvature*.012,-.1,.1);
    horseRig.root.position.set(s.x,s.y,PLAYER_Z);horseRig.root.rotation.z=-(s.lane*LANE_WIDTH-s.x)*.075-cornerLean;
    horseRig.update(s,dt,moving);
    horseRig.root.visible=!(s.invincible>2.01||s.invincible<=0)&&s.mode==='running'?Math.sin(elapsed*35)>-.45:true;
    shadow.position.x=s.x;shadow.position.z=PLAYER_Z;shadow.scale.set(.66+s.y*.14,1.36+s.y*.2,1);shadowMat.opacity=.23-s.y*.05;
    for(let i=0;i<marks.length;i++){const p=marks[i];p.z+=travel;if(p.z>12)p.z-=180;roadFrame.sample(PLAYER_Z-p.z,p.x,roadPoint);matrix.position.set(roadPoint.x,.012,roadPoint.z);matrix.rotation.set(0,roadPoint.yaw,0);matrix.scale.set(p.w,.012,p.l);matrix.updateMatrix();gravel.setMatrixAt(i,matrix.matrix);}gravel.instanceMatrix.needsUpdate=true;
    for(const p of scenery){p.z+=travel;if(p.z>16){p.z-=190;p.offset=Math.sign(p.offset)*(5.3+Math.random()*21);}roadFrame.sample(PLAYER_Z-p.z,p.offset,roadPoint);p.object.position.set(roadPoint.x,0,roadPoint.z);p.object.rotation.y=roadPoint.yaw;}
    for(const item of items){const obj=item.object;if(!obj)continue;roadFrame.sample(PLAYER_Z-item.z,item.lane*LANE_WIDTH+(item.type==='bees'?Math.sin(elapsed*8)*.08:0),roadPoint);obj.position.set(roadPoint.x,['fence','mud'].includes(item.type)?0:item.type==='bees'?1.75:1.35+Math.sin(elapsed*3+item.z)*.1,roadPoint.z);obj.rotation.y=roadPoint.yaw;if(['carrot','apple','gold'].includes(item.type))obj.rotation.y+=elapsed*1.8;if(item.type==='bees')obj.rotation.y+=Math.sin(elapsed*4)*.3;}
    if(moving&&frame++%3===0&&s.y<.1) {const p=dust[dustIndex++%dust.length];Object.assign(p,{life:.45,x:s.x+(Math.random()-.5)*.5,y:.12,z:2.4,vx:(Math.random()-.5),vy:.5,vz:3});}
    for(let i=0;i<dust.length;i++){const p=dust[i];const particleDt=moving?dt:0;p.life=Math.max(0,p.life-particleDt);p.x+=p.vx*particleDt;p.y+=p.vy*particleDt;p.z+=p.vz*particleDt+travel;roadFrame.sample(PLAYER_Z-p.z,p.x,roadPoint);matrix.position.set(roadPoint.x,p.y,roadPoint.z);matrix.scale.setScalar(p.life>0?p.life*2:0);matrix.updateMatrix();particles.setMatrixAt(i,matrix.matrix);}particles.instanceMatrix.needsUpdate=true;
    const boost=(s.gold>0||s.carrot>0||s.sprinting&&s.energy>1);ring.visible=s.gold>0||s.invincible>0;ring.position.x=s.x;ring.position.z=PLAYER_Z;ring.rotation.z+=dt;
    const desiredFov=(camera.aspect<.8?56:46)+(boost&&!reduceMotion?5:0);camera.fov+=(desiredFov-camera.fov)*dt*3;camera.updateProjectionMatrix();
    const bob=reduceMotion?0:Math.sin(gallop*2)*.015;
    roadFrame.sample(32,0,roadPoint);const leadTarget=reduceMotion?0:roadPoint.x*.35;
    if(lastRoadDistance<0||s.distance<lastRoadDistance)cameraLead=leadTarget;
    else if(moving)cameraLead+=(leadTarget-cameraLead)*(1-Math.exp(-3*dt));
    lastRoadDistance=s.distance;
    camera.position.set(s.x*.12+(reduceMotion?0:(Math.random()-.5)*shake*.22),4.5+bob,12.7);camera.lookAt(s.x*.12+cameraLead,1.15,-30);
    renderer.render(scene,camera);
    if(dt>.026&&moving)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);
    if(slowFrames>110&&quality>1){quality=1;renderer.setPixelRatio(Math.min(devicePixelRatio,1));resize();slowFrames=0;}
  }
  const biomeColors=BIOMES.map(b=>Object.fromEntries(Object.entries(b).filter(([,v])=>typeof v==='number').map(([k,v])=>[k,new T.Color(v)])));
  function setBiome(index,next,blend){
    const from=biomeColors[index],to=biomeColors[next];
    for(const [color,key] of [[palette.sand,'ground'],[palette.trail,'trail'],[0xb98b59,'gravel'],[0xad8055,'edge'],[palette.green,'plant'],[palette.lightGreen,'plantLight'],[0x7b8b69,'plantLight'],[0x52694e,'plantLight'],[0x364f49,'plant'],[0x9a9863,'plantLight'],[0x858866,'plantLight'],[0x4a6755,'plant'],[0x9c775b,'rock'],[0xbd9062,'rockLight']]){materials.get(color)?.color.copy(from[key]).lerp(to[key],blend);}
    scene.fog.color.copy(from.ground).lerp(to.ground,blend);skyLight.color.copy(from.skyLight).lerp(to.skyLight,blend);skyLight.groundColor.copy(from.groundLight).lerp(to.groundLight,blend);sun.color.copy(from.sun).lerp(to.sun,blend);shadowMat.color.set(0x080b21);
  }
  setBiome(0,1,0);
  return {render,obtain,release,burst,setBiome,renderer,scene,dispose(){resizeObserver.disconnect();horseRig.dispose();renderer.dispose();}};
}

import * as T from './assets/three.module.js';
import {GLTFLoader} from './assets/GLTFLoader.js';
import {MeshoptDecoder} from './assets/meshopt_decoder.module.js';

export async function loadHorse(){
  const loader=new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf=await loader.loadAsync(new URL('./assets/horse-run-lite.glb',import.meta.url).href);
  const root=new T.Group(),pose=new T.Group(),model=gltf.scene;
  root.add(pose);pose.add(model);
  let horse;
  model.traverse(object=>{if(object.morphTargetInfluences?.length)horse=object;});
  if(!horse)throw new Error('Horse model is missing its animated mesh.');
  // source faces +x; rotate into the trail (-z), then fit the existing player footprint.
  model.rotation.y+=Math.PI/2;
  model.updateMatrixWorld(true);
  horse.geometry.computeBoundingBox();
  const bounds=new T.Box3().setFromBufferAttribute(horse.geometry.attributes.position).applyMatrix4(horse.matrixWorld);
  const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  const scale=2.65/size.y;
  model.scale.multiplyScalar(scale);
  model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
  const clip=gltf.animations.find(animation=>animation.tracks.some(track=>track.name.endsWith('.morphTargetInfluences')))?.clone();
  if(!clip)throw new Error('Horse model is missing its run cycle.');
  const start=Math.min(...clip.tracks.map(track=>track.times[0]));
  for(const track of clip.tracks)track.shift(-start);
  clip.resetDuration();
  const mixer=new T.AnimationMixer(model),action=mixer.clipAction(clip);action.play();
  let lastDistance=0;
  return {root,update(s,dt,moving){
    if(s.distance<lastDistance){action.reset().play();pose.scale.y=1;pose.rotation.x=0;}
    lastDistance=s.distance;
    if(!moving)return;
    mixer.update(dt*(s.y>.1?.35:s.mode==='menu'?.8:T.MathUtils.clamp(s.speed/22,.45,2.2)));
    pose.scale.y=T.MathUtils.damp(pose.scale.y,s.duck?.54:1,22,dt);
    pose.rotation.x=T.MathUtils.damp(pose.rotation.x,s.duck?.1:s.y>.1?-.09:0,12,dt);
  },dispose(){
    mixer.stopAllAction();mixer.uncacheRoot(model);
    const textures=new Set(),materials=new Set();
    model.traverse(object=>{if(!object.isMesh)return;object.geometry.dispose();for(const material of [object.material].flat()){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}});
    for(const texture of textures){texture.dispose();texture.source.data?.close?.();}
    for(const material of materials)material.dispose();
  }};
}

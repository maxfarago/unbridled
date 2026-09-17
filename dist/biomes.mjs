// Each sky is stationary. Distance dissolves palettes and, when a biome has cutout layers, walks a landmark toward the camera.
export const SPAN=1200;
export const BIOMES=[
  {name:'VERMILION VALLEY',image:'./assets/vermilion-valley.jpg',sky:'./assets/vermilion-valley-sky.png',layers:['./assets/vermilion-valley-layer-1.png','./assets/vermilion-valley-layer-2.png','./assets/vermilion-valley-layer-3.png','./assets/vermilion-valley-layer-4.png'],floor:'./assets/ground-vermilion-valley.jpg',ground:0xbcc4be,trail:0xe5c9a0,gravel:0x8e7889,edge:0x727797,plant:0x14273a,plantLight:0x354b5b,rock:0x864766,rockLight:0xce6574,skyLight:0xffedc7,sun:0xffdab1,groundLight:0x434765},
  {name:'GOLDEN MONOLITH',image:'./assets/golden-monolith-sky.png',sky:'./assets/golden-monolith-sky.png',layers:['./assets/golden-monolith-layer-1.png','./assets/golden-monolith-layer-2.png','./assets/golden-monolith-layer-3.png','./assets/golden-monolith-layer-4.png'],floor:'./assets/ground-golden-monolith.jpg',ground:0xc46a40,trail:0xe8a060,gravel:0x8a4838,edge:0x6a3028,plant:0x241018,plantLight:0x5a2830,rock:0xc05030,rockLight:0xf07848,skyLight:0xffb070,sun:0xffe070,groundLight:0x3a1828},
  {name:'MIDNIGHT MESAS',image:'./assets/midnight-mesas.jpg',sky:'./assets/midnight-mesas-sky.png',layers:['./assets/midnight-mesas-layer-1.png','./assets/midnight-mesas-layer-2.png','./assets/midnight-mesas-layer-3.png','./assets/midnight-mesas-layer-4.png'],floor:'./assets/ground-midnight-mesas.jpg',ground:0x4a5e9e,trail:0x7a8fc0,gravel:0x303f73,edge:0x293b75,plant:0x101b39,plantLight:0x2f3e65,rock:0x444876,rockLight:0x806baf,skyLight:0x99b9ff,sun:0xdcc9ff,groundLight:0x252a58}
];
function smooth(t){t=Math.min(1,Math.max(0,t));return t*t*(3-2*t);}
export function skyOf(biome){return biome.sky||biome.image;}
export function landscapeAt(distance){const segment=Math.floor(Math.max(0,distance)/SPAN),index=segment%BIOMES.length,progress=(Math.max(0,distance)%SPAN)/SPAN;const t=Math.max(0,(progress-.75)/.25);return {index,next:(index+1)%BIOMES.length,blend:smooth(t),segment,progress};}
// hold 1+2 long, 3 medium, 4 short, then empty sky before the biome dissolve finishes
const LANDMARK_KEYS=[[0,-1],[.04,0],[.22,0],[.28,1],[.48,1],[.54,2],[.66,2],[.72,3],[.8,3],[.9,-1],[1,-1]];
export function landmarkAt(distance,layerCount=0){
  if(!layerCount)return {from:-1,to:-1,blend:0};
  const progress=(Math.max(0,distance)%SPAN)/SPAN;
  let i=0;while(i<LANDMARK_KEYS.length-2&&progress>=LANDMARK_KEYS[i+1][0])i++;
  const [p0,a]=LANDMARK_KEYS[i],[p1,b]=LANDMARK_KEYS[i+1];
  const clamp=plate=>plate<0?-1:Math.min(plate,layerCount-1);
  const from=clamp(a),to=clamp(b);
  if(from===to||p1<=p0)return {from,to:from,blend:0};
  return {from,to,blend:smooth((progress-p0)/(p1-p0))};
}

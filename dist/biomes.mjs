// Each painting is stationary. Distance drives a gradual dissolve and matching 3D colors.
export const BIOMES=[
  {name:'VIOLET MONOLITHS',image:'./assets/violet-monoliths.jpg',ground:0x8497cf,trail:0xb4a3ce,gravel:0x57639b,edge:0x525b93,plant:0x111e3c,plantLight:0x34466d,rock:0x645eaa,rockLight:0x9e7bb7,skyLight:0xb4c8ff,sun:0xffd5d4,groundLight:0x383e78},
  {name:'VERMILION VALLEY',image:'./assets/vermilion-valley.jpg',ground:0xbcc4be,trail:0xe5c9a0,gravel:0x8e7889,edge:0x727797,plant:0x14273a,plantLight:0x354b5b,rock:0x864766,rockLight:0xce6574,skyLight:0xffedc7,sun:0xffdab1,groundLight:0x434765},
  {name:'MIDNIGHT MESAS',image:'./assets/midnight-mesas.jpg',ground:0x4a5e9e,trail:0x7a8fc0,gravel:0x303f73,edge:0x293b75,plant:0x101b39,plantLight:0x2f3e65,rock:0x444876,rockLight:0x806baf,skyLight:0x99b9ff,sun:0xdcc9ff,groundLight:0x252a58}
];
export function landscapeAt(distance){const segment=Math.floor(Math.max(0,distance)/600),index=segment%BIOMES.length,progress=(Math.max(0,distance)%600)/600;const t=Math.max(0,(progress-.75)/.25);return {index,next:(index+1)%BIOMES.length,blend:t*t*(3-2*t),segment};}

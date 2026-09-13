// Each painting is stationary. Distance drives a gradual dissolve and matching 3D colors.
export const BIOMES=[
  {name:'MIDNIGHT MESAS',image:'./assets/midnight-mesas.jpg',ground:0x4a5e9e,trail:0x7a8fc0,gravel:0x303f73,edge:0x293b75,plant:0x101b39,plantLight:0x2f3e65,rock:0x444876,rockLight:0x806baf,skyLight:0x99b9ff,sun:0xdcc9ff,groundLight:0x252a58},
  {name:'DAWN',image:'./assets/dawn.jpg',ground:0x5a6cb8,trail:0xc4b0c8,gravel:0x4a4e88,edge:0x3d4578,plant:0x1a2048,plantLight:0x3d4a70,rock:0x8a6a88,rockLight:0xc4a0b0,skyLight:0xe8c8d4,sun:0xffd5c4,groundLight:0x2a3060},
  {name:'DAY',image:'./assets/day.jpg',ground:0x6aa8d8,trail:0xdce8f0,gravel:0x6a88a8,edge:0x5a7a98,plant:0x1a3850,plantLight:0x3a6080,rock:0xc45a50,rockLight:0xe88870,skyLight:0xc8e4ff,sun:0xfff0c8,groundLight:0x3a5070},
  {name:'VERMILION VALLEY',image:'./assets/vermilion-valley.jpg',ground:0xbcc4be,trail:0xe5c9a0,gravel:0x8e7889,edge:0x727797,plant:0x14273a,plantLight:0x354b5b,rock:0x864766,rockLight:0xce6574,skyLight:0xffedc7,sun:0xffdab1,groundLight:0x434765},
  {name:'SUNSET',image:'./assets/sunset.jpg',ground:0x2c3488,trail:0x8a6a90,gravel:0x2a2868,edge:0x241e58,plant:0x140c28,plantLight:0x3a2850,rock:0xa83850,rockLight:0xe07060,skyLight:0xffc4a0,sun:0xff8a50,groundLight:0x1a1848},
  {name:'VIOLET MONOLITHS',image:'./assets/violet-monoliths.jpg',ground:0x8497cf,trail:0xb4a3ce,gravel:0x57639b,edge:0x525b93,plant:0x111e3c,plantLight:0x34466d,rock:0x645eaa,rockLight:0x9e7bb7,skyLight:0xb4c8ff,sun:0xffd5d4,groundLight:0x383e78}
];
export function landscapeAt(distance){const segment=Math.floor(Math.max(0,distance)/600),index=segment%BIOMES.length,progress=(Math.max(0,distance)%600)/600;const t=Math.max(0,(progress-.75)/.25);return {index,next:(index+1)%BIOMES.length,blend:t*t*(3-2*t),segment};}

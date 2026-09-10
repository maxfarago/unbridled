import { LANES } from './game.js';
const C = {
  grass: [0.38,.59,.28], grass2: [.44,.65,.32], grass3:[.31,.5,.25],
  trail:[.72,.58,.36], trailLight:[.82,.69,.46], fence:[.79,.77,.59],
  wood:[.37,.25,.15], dark:[.13,.18,.13], horse:[.57,.28,.13], chest:[.69,.36,.17],
  mane:[.20,.12,.075], cream:[.96,.88,.68], gold:[1,.77,.2], carrot:[1,.39,.075],
  apple:[.86,.18,.13], leaf:[.22,.47,.16], mud:[.30,.24,.15]
};
const PAL = [
  { sky:[.36,.16,.56], horizon:[.96,.80,.55], ground:[.58,.24,.12], ground2:[.40,.14,.09],
    trail:[.93,.90,.84], edge:[.86,.70,.48], mesaLit:[.90,.36,.14], mesaShade:[.05,.04,.07],
    ridge:[.76,.46,.40], plant:[.04,.03,.05], shadow:[.10,.05,.14], cloud:[.96,.94,.90], fence:[.86,.80,.68] },
  { sky:[.10,.08,.32], horizon:[.98,.68,.20], ground:[.74,.48,.14], ground2:[.52,.30,.09],
    trail:[.90,.78,.46], edge:[.82,.56,.20], mesaLit:[.96,.60,.16], mesaShade:[.11,.05,.20],
    ridge:[.58,.24,.46], plant:[.05,.03,.07], shadow:[.14,.06,.22], cloud:[.98,.92,.78], fence:[.78,.62,.32] },
  { sky:[.03,.06,.18], horizon:[.16,.24,.48], ground:[.08,.12,.24], ground2:[.05,.08,.18],
    trail:[.22,.30,.48], edge:[.38,.46,.60], mesaLit:[.74,.70,.42], mesaShade:[.02,.03,.08],
    ridge:[.28,.32,.55], plant:[.02,.03,.06], shadow:[.04,.05,.12], cloud:[.70,.78,.92], fence:[.42,.50,.64] }
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const lerp3=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
function mixPal(a,b,t){const o={};for(const k of Object.keys(a))o[k]=lerp3(a[k],b[k],t);return o;}
function paletteAt(distance){
  const u=Math.max(0,distance)/700,i=((Math.floor(u)%3)+3)%3,t=u-Math.floor(u);
  return mixPal(PAL[i],PAL[(i+1)%3],t*t*(3-2*t));
}
const cube=[];
// Positions and face brightness; every primitive shares one dynamic draw buffer.
function face(a,b,c,d,l){for(const p of [a,b,c,a,c,d]) cube.push(...p,l);}
face([-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],.8);
face([.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5],.78);
face([-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5],1.12);
face([-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5],.54);
face([.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],.73);
face([-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],.95);
const oct=[];
for(let side=0;side<2;side++)for(let i=0;i<6;i++){
  const a=i*Math.PI/3,b=(i+1)*Math.PI/3;
  const pts=side?[[0,-.65,0],[Math.cos(b)*.5,0,Math.sin(b)*.5],[Math.cos(a)*.5,0,Math.sin(a)*.5]]:[[0,.65,0],[Math.cos(a)*.5,0,Math.sin(a)*.5],[Math.cos(b)*.5,0,Math.sin(b)*.5]];
  for(const p of pts)oct.push(...p,side?.68:.88+Math.cos(a)*.16);
}
const cylinder=[];
for(let i=0;i<8;i++){
  const a=i*Math.PI/4,b=(i+1)*Math.PI/4,x=Math.cos(a)*.5,z=Math.sin(a)*.5,u=Math.cos(b)*.5,v=Math.sin(b)*.5;
  for(const p of [[x,-.5,z],[u,-.5,v],[u,.5,v],[x,-.5,z],[u,.5,v],[x,.5,z]])cylinder.push(...p,.83+.14*Math.cos(a));
  for(const p of [[0,.5,0],[x,.5,z],[u,.5,v]])cylinder.push(...p,1.08);
  for(const p of [[0,-.5,0],[u,-.5,v],[x,-.5,z]])cylinder.push(...p,.6);
}
const wedge=[];
function wtri(a,b,c,l){for(const p of [a,b,c])wedge.push(...p,l);}
function wquad(a,b,c,d,l){wtri(a,b,c,l);wtri(a,c,d,l);}
{
  const pf=[0,.5,.5],pb=[0,.5,-.5],lf=[-.5,-.5,.5],rf=[.5,-.5,.5],lb=[-.5,-.5,-.5],rb=[.5,-.5,-.5];
  wquad(lf,pf,pb,lb,1);
  wquad(rf,rb,pb,pf,.22);
  wtri(lf,rf,pf,.7);
  wtri(lb,pb,rb,.5);
  wquad(lf,lb,rb,rf,.35);
}
const shapes={cube,oct,cylinder,wedge};
function norm(v){const l=Math.hypot(...v)||1;return v.map(x=>x/l);}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function matrix(eye,target,aspect,fov){
  const z=norm(eye.map((v,i)=>v-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  const v=[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];
  const f=1/Math.tan(fov/2),n=.1,far=360;
  const p=[f/aspect,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0];
  const out=new Float32Array(16);
  for(let col=0;col<4;col++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)out[col*4+row]+=p[k*4+row]*v[col*4+k];
  return out;
}
export class Renderer {
  constructor(canvas){
    this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'high-performance'});
    if(!this.gl)throw Error('WebGL unavailable');
    const gl=this.gl;
    const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
    const vs=shader(gl.VERTEX_SHADER,`attribute vec3 aPosition;attribute vec3 aColor;uniform mat4 uMatrix;varying vec3 vColor;varying float vDepth;varying float vNdcY;void main(){gl_Position=uMatrix*vec4(aPosition,1.0);vColor=aColor;vDepth=gl_Position.w;vNdcY=gl_Position.y/max(gl_Position.w,0.001);}`);
    const fs=shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec3 vColor;varying float vDepth;varying float vNdcY;uniform vec3 uFog;uniform vec3 uSky;void main(){float band=floor(smoothstep(-0.22,0.88,vNdcY)*5.0)/5.0;vec3 atmos=mix(uFog,uSky,band);float fog=smoothstep(160.0,310.0,vDepth)*0.45;gl_FragColor=vec4(mix(vColor,atmos,fog),1.0);}`);
    this.program=gl.createProgram();gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
    gl.useProgram(this.program);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
    this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
    this.data=new Float32Array(180000*6);gl.bufferData(gl.ARRAY_BUFFER,this.data.byteLength,gl.DYNAMIC_DRAW);
    for(const [name,offset]of [['aPosition',0],['aColor',12]]){const at=gl.getAttribLocation(this.program,name);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,3,gl.FLOAT,false,24,offset);}
    this.uMatrix=gl.getUniformLocation(this.program,'uMatrix');this.uFog=gl.getUniformLocation(this.program,'uFog');this.uSky=gl.getUniformLocation(this.program,'uSky');
    this.count=0;this.time=0;this.offset=0;this.camBlend=0;this.shake=0;this.squash=0;this.particles=[];this.maxParticles=85;
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.ratio=Math.min(devicePixelRatio||1,matchMedia('(pointer:coarse)').matches?1.35:1.65);
    this.avgFrame=16;this.frameSamples=0;this.resize();
  }
  resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;this.width=w;this.height=h;this.canvas.width=Math.round(w*this.ratio);this.canvas.height=Math.round(h*this.ratio);this.gl.viewport(0,0,this.canvas.width,this.canvas.height);}
  put(shape,x,y,z,sx,sy,sz,color,ry=0,rx=0,rz=0,flat=false){
    const src=shapes[shape],cy=Math.cos(ry),ssy=Math.sin(ry),cx=Math.cos(rx),ssx=Math.sin(rx),cz=Math.cos(rz),ssz=Math.sin(rz),data=this.data;
    let count=this.count;
    if(count+src.length/4*6>data.length)return;
    for(let i=0;i<src.length;i+=4){
      let a=src[i]*sx,b=src[i+1]*sy,c=src[i+2]*sz;
      const bb=b*cx-c*ssx; c=b*ssx+c*cx;b=bb;
      const aa=a*cy+c*ssy;c=-a*ssy+c*cy;a=aa;
      const aaa=a*cz-b*ssz;b=a*ssz+b*cz;a=aaa;
      const light=flat?1:src[i+3];
      data[count++]=a+x;data[count++]=b+y;data[count++]=c+z;
      data[count++]=color[0]*light;data[count++]=color[1]*light;data[count++]=color[2]*light;
    }
    this.count=count;
  }
  box(x,y,z,sx,sy,sz,c,ry=0,rx=0,rz=0){this.put('cube',x,y,z,sx,sy,sz,c,ry,rx,rz);}
  slab(x,y,z,sx,sy,sz,c,ry=0,rx=0,rz=0){this.put('cube',x,y,z,sx,sy,sz,c,ry,rx,rz,true);}
  rock(x,y,z,sx,sy,sz,c,ry=0){this.put('oct',x,y,z,sx,sy,sz,c,ry);}
  mesa(x,z,s,p){
    const ry=x>0?-.52:.52;
    this.put('wedge',x,24*s,z,88*s,58*s,9*s,p.mesaShade,ry,0,0,true);
    this.put('wedge',x-(x>0?22:-22)*s,22*s,z+.4,46*s,54*s,8*s,p.mesaLit,ry,0,0,true);
  }
  cactus(x,z,h,c){
    this.put('cylinder',x,h*.5,z,.2,h,.2,c,0,0,0,true);
    this.put('cylinder',x-h*.16,h*.62,z,.16,h*.2,.16,c,0,0,Math.PI/2,true);
    this.put('cylinder',x-h*.26,h*.82,z,.16,h*.4,.16,c,0,0,0,true);
    this.put('cylinder',x+h*.14,h*.48,z,.14,h*.16,.14,c,0,0,Math.PI/2,true);
    this.put('cylinder',x+h*.24,h*.64,z,.14,h*.32,.14,c,0,0,0,true);
  }
  burst(x,y,z,color,n=14,force=3){
    if(this.reduced)n=Math.min(n,5);
    for(let i=0;i<n&&this.particles.length<this.maxParticles;i++)this.particles.push({x,y,z,vx:(Math.random()-.5)*force,vy:Math.random()*force+1,vz:(Math.random()-.5)*force,size:.07+Math.random()*.1,life:.4+Math.random()*.35,max:.8,color});
  }
  horse(run,idle){
    const t=this.time,ground=run.grounded||idle,duck=!idle&&run.duck>0;
    const gallop=t*(idle?11:run.speed*.8),bounce=ground?Math.abs(Math.sin(gallop))*.09:0;
    const x=run.x+(idle?1.55:0), y=Math.max(-.6,run.y)+bounce-this.squash*.15;
    const bodyY=duck?1.02:1.39,lean=clamp((LANES[run.lane]-run.x)*-.10,-.18,.18);
    if(!idle && run.invincible>0 && Math.sin(t*35)>.55)return;
    // Soft, low-cost contact shadow.
    this.put('cylinder',x,.02,0,1.3+run.y*.15,.016,2.6+run.y*.1,this.pal?.shadow||[.12,.06,.16]);
    const brown=run.boost>0?[.72,.37,.14]:C.horse;
    this.box(x,bodyY+y,.08,.86,duck?.67:.84,1.85,brown,0,0,lean);
    this.box(x,bodyY+.12+y,-.7,.78,.92,.68,C.chest,0,-.13,lean);
    this.box(x,bodyY-.03+y,.87,.83,.78,.48,brown,0,.12,lean);
    // Legs swing from their shoulders, with articulated knees and cream socks.
    for(let side=-1;side<=1;side+=2)for(let front=0;front<2;front++){
      const z=front?-.57:.65,phase=gallop+(front?0:1.7)+(side===1?Math.PI:0);
      const angle=ground?Math.sin(phase)*.68:(front?-.75:.7);
      const hipY=(duck?.94:1.13)+y;
      const kneeY=hipY-.31*Math.cos(angle),kneeZ=z-.31*Math.sin(angle);
      this.box(x+side*.34,kneeY,kneeZ,.2,.69,.23,brown,0,angle);
      const lower=angle+(ground?Math.max(0,Math.cos(phase))*.7:.7);
      const hoofY=kneeY-.35*Math.cos(lower),hoofZ=kneeZ-.35*Math.sin(lower);
      this.box(x+side*.35,hoofY,hoofZ,.16,.53,.17,C.cream,0,lower);
      this.box(x+side*.35,hoofY-.22*Math.cos(lower),hoofZ-.22*Math.sin(lower),.23,.19,.30,C.mane,0,lower);
    }
    const headY=duck?1.51:2.2,headZ=duck?-1.27:-1.03;
    this.box(x,bodyY+.44+y,-.9,.50,.97,.58,C.chest,0,-.38);
    this.box(x,headY+y,headZ,.51,.58,.95,brown,0,duck?-.15:.18);
    this.box(x,headY-.17+y,headZ-.45,.52,.37,.38,[.34,.20,.12],0,.18);
    this.box(x,headY+.04+y,headZ-.08,.12,.58,.72,C.cream,0,.18);
    for(const side of [-1,1]){
      this.box(x+side*.18,headY+.40+y,headZ+.22,.15,.42,.19,brown,0,-.18,side*-.17);
      this.box(x+side*.265,headY+.08+y,headZ-.17,.035,.10,.13,C.dark);
      this.box(x+side*.281,headY+.1+y,headZ-.20,.018,.035,.04,C.cream);
    }
    // Raised mane and a swishing tail keep the silhouette unmistakably horse.
    for(let i=0;i<5;i++)this.box(x,bodyY+.7+y-i*.11,-.7+i*.13,.18,.28,.22,C.mane,0,-.5);
    const tail=Math.sin(t*8)*.27;
    this.box(x+tail*.3,bodyY-.1+y,1.35,.20,.22,.86,C.mane,tail,-.5);
    this.box(x+tail*.7,bodyY-.38+y,1.72,.26,.36,.52,C.mane,tail,-.6);
    if(run.shield){
      for(let i=0;i<10;i++){const a=t*1.8+i*Math.PI/5;this.rock(x+Math.cos(a)*.85,1.2+y+Math.sin(a*2)*.18,Math.sin(a)*1.5,.09,.12,.09,[.75,.96,.43]);}
    }
  }
  shoe(x,y,z,rotation){
    // An open U built from seven short metal segments.
    for(let i=0;i<7;i++){
      const a=-Math.PI*.12+i*Math.PI*1.24/6;
      const ox=Math.cos(a)*.31,oy=-Math.sin(a)*.33;
      this.box(x+ox*Math.cos(rotation),y+oy,z+ox*Math.sin(rotation),.16,.26,.15,C.gold,-rotation,0,a-Math.PI/2);
    }
  }
  entity(e,time){
    if(e.taken||e.d>175||e.d< -10)return;
    const x=LANES[e.lane],z=-e.d,bob=Math.sin(time*3+e.id)*.09,p=this.pal||PAL[0];
    switch(e.type){
      case 'shoe':this.shoe(x,(e.high?2.65:1.35)+bob,z,time*2+e.id);break;
      case 'carrot':
        this.rock(x,1.22+bob,z,.69,1.3,.65,C.carrot,-.2);
        for(let i=0;i<3;i++)this.box(x+(i-1)*.17,1.98+bob,z,.13,.5,.14,C.leaf,0,0,(i-1)*-.4);
        this.put('cylinder',x,.015,z,1.25,.02,1.25,p.shadow);break;
      case 'apple':
        this.rock(x-.16,1.37+bob,z,.74,.87,.83,C.apple,-.2);this.rock(x+.16,1.37+bob,z,.74,.87,.83,C.apple,.3);
        this.box(x,1.94+bob,z,.1,.29,.1,C.wood,0,0,-.2);this.rock(x+.19,1.98+bob,z,.45,.15,.3,C.leaf,.3);
        this.put('cylinder',x,.015,z,1.2,.02,1.2,p.shadow);break;
      case 'fence':
        this.put('cylinder',x,.02,z,2.4,.02,1.2,p.shadow,0,0,0,true);
        this.put('cylinder',x,.5,z,.5,2.5,.5,p.plant,0,0,Math.PI/2,true);
        this.put('cylinder',x-.7,1.05,z,.32,1.0,.32,p.plant,0,0,0,true);
        this.put('cylinder',x+.85,.72,z,.28,.28,.9,p.plant,0,Math.PI/2,0,true);break;
      case 'hay':
        this.put('cylinder',x,.02,z,2.4,.025,1.6,p.shadow,0,0,0,true);
        this.put('oct',x,.85,z,2.15,1.7,1.7,p.mesaShade,.1,0,0,true);
        this.put('oct',x+.35,1.55,z-.1,1.35,1.2,1.25,p.mesaLit,-.2,0,0,true);
        this.put('oct',x-.4,.55,z+.35,1.1,.7,1.0,p.mesaShade,.4,0,0,true);break;
      case 'branch':
        this.slab(x-1.28,1.45,z,.32,2.9,.32,p.mesaShade);
        this.slab(x+1.28,1.45,z,.32,2.9,.32,p.mesaShade);
        this.slab(x,2.12,z,2.85,.42,.42,p.mesaShade);
        this.slab(x,2.12,z+.22,2.85,.12,.12,p.mesaLit);break;
      case 'mud':
        this.put('cylinder',x,.015,z,2.72,.04,4.1,p.shadow);
        this.put('cylinder',x+.2,.044,z+.3,1.44,.015,1.9,p.ground2);break;
      case 'gap':
        this.box(x,-.005,z,2.97,.04,5.4,p.mesaShade);
        this.box(x,.04,z+2.8,3,.1,.2,p.ground);this.box(x,.04,z-2.8,3,.1,.2,p.ground);
        for(const s of [-1,1])this.box(x+s*1.44,-.04,z,.12,.22,5.5,p.ground2);break;
      case 'bees':
        this.cactus(x,z,2.15,p.plant);
        this.put('cylinder',x,.02,z,1.4,.02,1.1,p.shadow);
        for(let i=0;i<5;i++){const a=time*5+i*2,bx=x+Math.cos(a)*.62,by=1.55+Math.sin(a*1.3)*.42,bz=z+Math.sin(a)*.5;
          this.rock(bx,by,bz,.29,.25,.42,C.gold);this.box(bx,by,bz,.31,.2,.11,C.dark);this.box(bx,by+.12,bz,.64,.035,.17,C.cream,0,0,Math.sin(time*60)*.4);
        }break;
    }
  }
  draw(run,dt){
    const gl=this.gl;this.time+=dt;this.count=0;
    if(this.canvas.clientWidth!==this.width||this.canvas.clientHeight!==this.height)this.resize();
    // Adapt only downward, slowly, when a device cannot keep up.
    if(dt>0&&dt<.1){this.avgFrame=this.avgFrame*.98+dt*1000*.02;this.frameSamples++;if(this.frameSamples>180&&this.avgFrame>24&&this.ratio>.85){this.ratio=Math.max(.85,this.ratio-.15);this.resize();this.frameSamples=0;}}
    const idle=run.phase==='ready';
    this.camBlend+=(Number(!idle)-this.camBlend)*(1-Math.exp(-dt*3));
    this.offset=idle?this.offset+dt*8:run.distance;
    const offset=this.offset,t=this.time;
    const p=this.pal=paletteAt(idle?0:run.distance);
    gl.clearColor(...p.sky,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const b=this.camBlend,portrait=this.width/this.height<.8;
    const shake=this.reduced?0:this.shake;
    const eye=[(1-b)*9+run.x*.16+Math.sin(t*87)*shake,6.4+(portrait?2.5:0)+(run.boost>0?.35:0)+Math.cos(t*73)*shake,12.5+(portrait?3:0)];
    const target=[(1-b)*-.5+run.x*.12,.9,-15];
    gl.uniformMatrix4fv(this.uMatrix,false,matrix(eye,target,this.width/this.height,(portrait?64:58)*Math.PI/180+(run.boost>0?.065:0)));
    gl.uniform3fv(this.uFog,p.horizon);gl.uniform3fv(this.uSky,p.sky);
    this.shake*=Math.exp(-dt*13);this.squash*=Math.exp(-dt*12);
    this.slab(0,-.2,-90,240,.35,240,p.ground);
    this.slab(-80,-.18,-90,110,.32,240,p.ground2);
    this.slab(80,-.18,-90,110,.32,240,p.ground);
    for(const s of [-1,1])for(let i=1;i<=2;i++){
      this.put('wedge',s*(28+i*18),-.145,-90,36,190,.03,i%2?p.ground:p.ground2,s*i*.08,Math.PI/2,0,true);
    }
    this.slab(0,-.12,-90,16,.22,240,p.trail);
    this.slab(-7.4,.004,-90,.18,.03,240,p.edge);this.slab(7.4,.004,-90,.18,.03,240,p.edge);
    this.slab(-8.15,.12,-90,.7,.22,240,p.ground2);this.slab(8.15,.12,-90,.7,.22,240,p.ground2);
    for(let i=0;i<26;i++){
      const z=12-i*8+(offset%8);
      for(const x of [-1.55,1.55])this.slab(x,.003,z,.07,.017,2.5,p.edge);
    }
    for(let i=0;i<8;i++){
      const side=i%2?1:-1,z=8-i*24+(offset%24),x=side*(11+(i*7%5)),h=4.2+(i%3)*1.4;
      this.cactus(x,z,h,p.plant);
    }
    {
      const span=220,z=-(120+(offset*.1)%span),side=((offset/span)|0)%2?-1:1;
      this.mesa(side*88,z,1.7,p);
    }
    this.put('wedge',-40,16,-255,180,36,10,p.mesaShade,.2,0,0,true);
    this.put('wedge',90,11,-258,140,24,9,p.ridge,-.15,0,0,true);
    {
      const cloud=lerp3(p.cloud,p.sky,.45),x=(offset*.02%100)-50;
      this.put('cylinder',x,34,-195,32,2.4,11,cloud,0,0,0,true);
      this.put('cylinder',x-18,33.2,-193,18,2,8,cloud,.2,0,0,true);
      this.put('cylinder',x+62,38,-205,20,2.1,9,cloud,-.15,0,0,true);
    }
    if(!idle)for(const e of run.entities)this.entity(e,t);
    else{
      for(let i=0;i<8;i++)this.shoe(LANES[1],1.3+Math.sin(t*3+i)*.07,-16-i*9+(offset%9),t+i);
      this.entity({type:'fence',lane:0,d:46,taken:false},t);this.entity({type:'carrot',lane:2,d:30,id:9},t);this.entity({type:'hay',lane:2,d:70},t);
    }
    this.horse(run,idle);
    if((run.phase==='running'||idle)&&run.grounded&&Math.random()<dt*20){
      this.burst(run.x+(idle?1.55:0)+(Math.random()-.5)*.7,.12,1.1,run.boost>0?C.gold:[.74,.65,.44],1,.55);
    }
    for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life-=dt;if(p.life<=0){this.particles.splice(i,1);continue;}p.vy-=dt*5;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt+(run.phase==='running'?run.speed*dt*.25:0);const s=p.size*Math.min(1,p.life*4);this.box(p.x,Math.max(.035,p.y),p.z,s,s,s,p.color,t,p.life);}
    gl.bufferSubData(gl.ARRAY_BUFFER,0,this.data.subarray(0,this.count));gl.drawArrays(gl.TRIANGLES,0,this.count/6);
  }
}

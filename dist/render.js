import { LANES } from './game.js';
const C = {
  grass: [0.38,.59,.28], grass2: [.44,.65,.32], grass3:[.31,.5,.25],
  trail:[.72,.58,.36], trailLight:[.82,.69,.46], fence:[.79,.77,.59],
  wood:[.37,.25,.15], dark:[.13,.18,.13], horse:[.57,.28,.13], chest:[.69,.36,.17],
  mane:[.20,.12,.075], cream:[.96,.88,.68], gold:[1,.77,.2], carrot:[1,.39,.075],
  apple:[.86,.18,.13], leaf:[.22,.47,.16], mud:[.30,.24,.15]
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
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
const shapes={cube,oct,cylinder};
function norm(v){const l=Math.hypot(...v)||1;return v.map(x=>x/l);}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function matrix(eye,target,aspect,fov){
  const z=norm(eye.map((v,i)=>v-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  const v=[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];
  const f=1/Math.tan(fov/2),n=.1,far=280;
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
    const vs=shader(gl.VERTEX_SHADER,`attribute vec3 aPosition;attribute vec3 aColor;uniform mat4 uMatrix;varying vec3 vColor;varying float vDepth;void main(){gl_Position=uMatrix*vec4(aPosition,1.0);vColor=aColor;vDepth=gl_Position.w;}`);
    const fs=shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec3 vColor;varying float vDepth;uniform vec3 uFog;void main(){float fog=smoothstep(65.0,205.0,vDepth);gl_FragColor=vec4(mix(vColor,uFog,fog),1.0);}`);
    this.program=gl.createProgram();gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
    gl.useProgram(this.program);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
    this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
    this.data=new Float32Array(180000*6);gl.bufferData(gl.ARRAY_BUFFER,this.data.byteLength,gl.DYNAMIC_DRAW);
    for(const [name,offset]of [['aPosition',0],['aColor',12]]){const at=gl.getAttribLocation(this.program,name);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,3,gl.FLOAT,false,24,offset);}
    this.uMatrix=gl.getUniformLocation(this.program,'uMatrix');this.uFog=gl.getUniformLocation(this.program,'uFog');
    this.count=0;this.time=0;this.offset=0;this.camBlend=0;this.shake=0;this.squash=0;this.particles=[];this.maxParticles=85;
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.ratio=Math.min(devicePixelRatio||1,matchMedia('(pointer:coarse)').matches?1.35:1.65);
    this.avgFrame=16;this.frameSamples=0;this.resize();
  }
  resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;this.width=w;this.height=h;this.canvas.width=Math.round(w*this.ratio);this.canvas.height=Math.round(h*this.ratio);this.gl.viewport(0,0,this.canvas.width,this.canvas.height);}
  put(shape,x,y,z,sx,sy,sz,color,ry=0,rx=0,rz=0){
    const src=shapes[shape],cy=Math.cos(ry),ssy=Math.sin(ry),cx=Math.cos(rx),ssx=Math.sin(rx),cz=Math.cos(rz),ssz=Math.sin(rz),data=this.data;
    let count=this.count;
    if(count+src.length/4*6>data.length)return;
    for(let i=0;i<src.length;i+=4){
      let a=src[i]*sx,b=src[i+1]*sy,c=src[i+2]*sz;
      const bb=b*cx-c*ssx; c=b*ssx+c*cx;b=bb;
      const aa=a*cy+c*ssy;c=-a*ssy+c*cy;a=aa;
      const aaa=a*cz-b*ssz;b=a*ssz+b*cz;a=aaa;
      const light=src[i+3];
      data[count++]=a+x;data[count++]=b+y;data[count++]=c+z;
      data[count++]=color[0]*light;data[count++]=color[1]*light;data[count++]=color[2]*light;
    }
    this.count=count;
  }
  box(x,y,z,sx,sy,sz,c,ry=0,rx=0,rz=0){this.put('cube',x,y,z,sx,sy,sz,c,ry,rx,rz);}
  rock(x,y,z,sx,sy,sz,c,ry=0){this.put('oct',x,y,z,sx,sy,sz,c,ry);}
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
    this.put('cylinder',x,.02,0,1.3+run.y*.15,.016,2.6+run.y*.1,[.32,.30,.18]);
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
    const x=LANES[e.lane],z=-e.d,bob=Math.sin(time*3+e.id)*.09;
    switch(e.type){
      case 'shoe':this.shoe(x,(e.high?2.65:1.35)+bob,z,time*2+e.id);break;
      case 'carrot':
        this.rock(x,1.22+bob,z,.69,1.3,.65,C.carrot,-.2);
        for(let i=0;i<3;i++)this.box(x+(i-1)*.17,1.98+bob,z,.13,.5,.14,C.leaf,0,0,(i-1)*-.4);
        this.put('cylinder',x,.015,z,1.25,.02,1.25,[.80,.61,.26]);break;
      case 'apple':
        this.rock(x-.16,1.37+bob,z,.74,.87,.83,C.apple,-.2);this.rock(x+.16,1.37+bob,z,.74,.87,.83,C.apple,.3);
        this.box(x,1.94+bob,z,.1,.29,.1,C.wood,0,0,-.2);this.rock(x+.19,1.98+bob,z,.45,.15,.3,C.leaf,.3);
        this.put('cylinder',x,.015,z,1.2,.02,1.2,[.50,.56,.26]);break;
      case 'fence':
        for(const s of [-1,1])this.box(x+s*1.13,.65,z,.18,1.3,.23,C.wood);
        this.box(x,.64,z,2.55,.24,.24,C.fence);this.box(x,1.12,z,2.55,.25,.25,C.fence);
        this.box(x,.94,z+.14,.65,.09,.035,[.88,.36,.16]);break;
      case 'hay':
        this.box(x,.95,z,2.2,1.9,1.5,[.77,.56,.17],.035);this.box(x,2.1,z,.99,.52,1.25,[.84,.64,.23],-.14);
        for(const s of [-1,1]){this.box(x+s*.62,.96,z+.76,.1,1.92,.04,C.wood);this.box(x+s*.62,1.92,z,.1,.035,1.5,C.wood);}break;
      case 'branch':
        for(const s of [-1,1])this.box(x+s*1.28,1.4,z,.26,2.8,.35,C.wood,0,0,s*.05);
        this.box(x,2.11,z,2.8,.55,.55,C.wood,0,0,.03);this.rock(x+.9,2.7,z,1.5,.9,1.2,C.leaf);
        this.box(x,2.07,z+.30,.65,.14,.02,[.88,.65,.24]);break;
      case 'mud':
        this.put('cylinder',x,.015,z,2.72,.04,4.1,C.mud);
        this.put('cylinder',x+.2,.044,z+.3,1.44,.015,1.9,[.43,.35,.22]);break;
      case 'gap':
        this.box(x,-.005,z,2.97,.04,5.4,[.10,.15,.10]);
        this.box(x,.035,z+2.8,3,.12,.22,C.wood);this.box(x,.035,z-2.8,3,.12,.22,C.wood);
        for(const s of [-1,1])this.box(x+s*1.44,-.04,z,.1,.2,5.5,[.44,.31,.17]);break;
      case 'bees':
        this.box(x,.3,z,.7,.6,.8,C.wood,0,0,.1);this.rock(x,.8,z,.9,.85,.9,[.74,.52,.16]);
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
    const season=Math.floor(run.distance/700)%3;
    const fog=season===1?[.75,.76,.58]:season===2?[.57,.69,.72]:[.68,.79,.66];
    gl.clearColor(...fog,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const b=this.camBlend,portrait=this.width/this.height<.8;
    const shake=this.reduced?0:this.shake;
    const eye=[(1-b)*9+run.x*.16+Math.sin(t*87)*shake,6.4+(portrait?2.5:0)+(run.boost>0?.35:0)+Math.cos(t*73)*shake,12.5+(portrait?3:0)];
    const target=[(1-b)*-.5+run.x*.12,.9,-15];
    gl.uniformMatrix4fv(this.uMatrix,false,matrix(eye,target,this.width/this.height,(portrait?64:58)*Math.PI/180+(run.boost>0?.065:0)));
    gl.uniform3fv(this.uFog,fog);this.shake*=Math.exp(-dt*13);this.squash*=Math.exp(-dt*12);
    const grass=season===1?[.51,.59,.24]:season===2?[.31,.49,.35]:C.grass;
    this.box(-55,-.22,-90,100,.4,240,grass);this.box(55,-.22,-90,100,.4,240,grass);
    this.box(0,-.15,-90,10,.28,240,C.trail);
    this.box(-4.87,.005,-90,.20,.035,240,C.trailLight);this.box(4.87,.005,-90,.20,.035,240,C.trailLight);
    for(let i=0;i<26;i++){
      const z=12-i*8+(offset%8);
      for(const x of [-1.55,1.55])this.box(x,.003,z,.07,.017,2.5,[.80,.66,.43]);
      for(const x of [-6,6]){
        this.box(x,.67,z,.19,1.34,.19,C.fence);
        this.box(x,.84,z-3.9,.12,.16,8,C.fence);
        if(i<13)this.box(x,.4,z-3.9,.1,.12,8,C.fence);
      }
      if(i%2===0){this.rock(-7-(i%5)*1.2,.14,z,1.5,.38,1.3,C.grass3);this.rock(7+(i%3),.14,z-3,1.6,.4,1.3,C.grass2);}
    }
    for(let i=0;i<18;i++){
      const side=i%2?1:-1,z=15-i*14+(offset%28),x=side*(11+(i*7%13)),h=2.2+(i%4)*.65;
      this.box(x,h*.5,z,.4,h,.42,C.wood);this.rock(x,h+1,z,3.8,h*1.7,3.8,i%3===0?C.grass3:C.leaf,i);
      this.rock(x+.6,h+2,z-.25,2.7,h*1.2,2.8,i%3===0?C.grass:C.grass2,i);
    }
    for(let i=0;i<9;i++){
      const x=(i-4)*37;this.rock(x,7+(i%3)*2,-182-(i%2)*25,70,35+(i%3)*14,75,[.47+i*.006,.61,.38],i);
    }
    // A few geometric clouds at the horizon; no texture requests or model files.
    for(let i=0;i<6;i++){const x=(i-2.5)*36+Math.sin(t*.012+i)*4;this.rock(x,29+(i%3)*8,-150,26,5.6,12,[.91,.91,.80],i);}
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

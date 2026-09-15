export const PLAYER_Z=1.4;
export const ROAD_SEGMENTS=104;
export const ROAD_NEAR=-16;
export const ROAD_FAR=192;
export const ROAD_TILE=8;
export const ROAD_SHOULDER=.36;

// Two long, smooth waves make broad bends without repeating every few seconds.
// These are longitudinal course coordinates; collision distances remain unchanged.
export function courseX(distance){return 18*Math.sin(distance/120)+5*(Math.cos(distance/64)-1);}
function courseSlope(distance){return .15*Math.cos(distance/120)-5/64*Math.sin(distance/64);}

export class RoadFrame {
  constructor(){this.setDistance(0);}
  setDistance(distance){
    this.distance=distance;this.origin=courseX(distance);
    const slope=courseSlope(distance),length=Math.hypot(1,slope);
    this.cos=1/length;this.sin=slope/length;this.angle=Math.atan(slope);
    this.curvature=(-18/120**2*Math.sin(distance/120)-5/64**2*Math.cos(distance/64))/length**3;
  }
  sample(ahead,offset=0,out={}){
    const station=this.distance+ahead,slope=courseSlope(station),length=Math.hypot(1,slope);
    const dx=courseX(station)-this.origin+offset/length;
    const dz=-ahead+offset*slope/length;
    // Rebase and rotate to the horse's tangent: the camera follows the course
    // without accumulating coordinates or moving the painted horizon.
    out.x=this.cos*dx+this.sin*dz;
    out.z=PLAYER_Z-this.sin*dx+this.cos*dz;
    out.yaw=this.angle-Math.atan(slope);
    return out;
  }
}

// Refill an existing ribbon buffer instead of allocating geometry each frame.
export function writeRoadStrip(positions,frame,left,right,height=0){
  const p={};
  for(let i=0;i<=ROAD_SEGMENTS;i++){
    const ahead=ROAD_NEAR+(ROAD_FAR-ROAD_NEAR)*i/ROAD_SEGMENTS;
    for(let side=0;side<2;side++){
      frame.sample(ahead,side?right:left,p);
      const at=(i*2+side)*3;
      positions[at]=p.x;positions[at+1]=height;positions[at+2]=p.z;
    }
  }
}
// course-local uvs; texture offset scrolls along the track
export function writeRoadUVs(uvs,left,right){
  for(let i=0;i<=ROAD_SEGMENTS;i++){
    const ahead=ROAD_NEAR+(ROAD_FAR-ROAD_NEAR)*i/ROAD_SEGMENTS,at=i*4;
    uvs[at]=left/ROAD_TILE;uvs[at+1]=ahead/ROAD_TILE;uvs[at+2]=right/ROAD_TILE;uvs[at+3]=ahead/ROAD_TILE;
  }
}

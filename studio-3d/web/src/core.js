/* 2H4Y 3D Studio - model core, pure JS, no external dependencies */
(function(root) {
'use strict';
const MAX_TRIANGLES = 350000;
function assert(cond,msg){ if(!cond) throw Error(msg); }
function dim(x){return Number.isFinite(x)&&x>0&&x<=500 ? x : null;}
function geometry(tri){
  assert(tri instanceof Float32Array && tri.length>0 && tri.length%9===0, 'Ungültige Dreiecke');
  assert(tri.length/9<=MAX_TRIANGLES,'Zu viele Dreiecke für diese Version');
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<tri.length;i+=3)for(let j=0;j<3;j++){
    const n=tri[i+j]; assert(Number.isFinite(n),'Ungültige Mesh-Koordinaten');
    min[j]=Math.min(min[j],n);max[j]=Math.max(max[j],n);
  }
  return {triangles:tri,faces:tri.length/9,min,max,size:max.map((n,i)=>n-min[i])};
}
function normal(a,b,c){const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
  const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  const len=Math.hypot(...n)||1;return n.map(x=>x/len);
}
function toBinarySTL(model){const t=model.triangles;const n=t.length/9;assert(n<=MAX_TRIANGLES,'Zu großes Modell');
  const buf=new ArrayBuffer(84+n*50);const dv=new DataView(buf);const hdr='2H4Y 3D Studio 1.0 - millimeters';
  for(let i=0;i<hdr.length;i++)dv.setUint8(i,hdr.charCodeAt(i)); dv.setUint32(80,n,true);
  for(let i=0;i<n;i++){const o=i*9,p=[t[o],t[o+1],t[o+2]],q=[t[o+3],t[o+4],t[o+5]],r=[t[o+6],t[o+7],t[o+8]],N=normal(p,q,r);const off=84+i*50;
    N.forEach((v,j)=>dv.setFloat32(off+j*4,v,true));for(let j=0;j<9;j++)dv.setFloat32(off+12+j*4,t[o+j],true);dv.setUint16(off+48,0,true);
  }return buf;
}
function fromSTL(buf){assert(buf.byteLength>=15,'Datei ist zu klein');const dv=new DataView(buf),b=new Uint8Array(buf);
  if(buf.byteLength>=84){const count=dv.getUint32(80,true); if(count>0 && count<=MAX_TRIANGLES && 84+count*50===buf.byteLength){const v=new Float32Array(count*9);
      for(let i=0;i<count;i++)for(let j=0;j<9;j++)v[i*9+j]=dv.getFloat32(84+i*50+12+j*4,true);return geometry(v);
    }
  }
  const s=new TextDecoder('utf-8').decode(b);const pattern=/\bvertex\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+([-+\d.eE]+)/gi;let m;const out=[];
  while((m=pattern.exec(s))!==null){out.push(+m[1],+m[2],+m[3]);if(out.length>MAX_TRIANGLES*9)throw Error('Zu viele Dreiecke');}
  assert(out.length>=9 && out.length%9===0,'Kein gültiges STL erkannt');return geometry(new Float32Array(out));
}
function fromOBJ(s){const verts=[],out=[];for(const line of s.split(/\r?\n/)){
  const a=line.trim().split(/\s+/);if(a[0]==='v'&&a.length>=4){const p=a.slice(1,4).map(Number);assert(p.every(Number.isFinite),'Ungültiger Vertex');verts.push(p)}
  else if(a[0]==='f'&&a.length>=4){const ids=a.slice(1).map(x=>{let k=parseInt(x.split('/')[0],10);assert(Number.isInteger(k)&&k!==0,'Ungültiger Face-Index');return k<0?verts.length+k:k-1;});
    for(let i=1;i<ids.length-1;i++){for(const k of [ids[0],ids[i],ids[i+1]]){assert(verts[k], 'Face verweist auf fehlenden Vertex');out.push(...verts[k])}; if(out.length>MAX_TRIANGLES*9)throw Error('Zu viele Dreiecke');}
  }
  }assert(out.length,'Keine Dreiecke im OBJ');return geometry(new Float32Array(out));
}
async function inflateRaw(u8){if(typeof DecompressionStream==='undefined')throw Error('3MF-Komprimierung wird in diesem Browser nicht unterstützt');
  const ds=new DecompressionStream('deflate-raw');const stream=new Blob([u8]).stream().pipeThrough(ds);return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function from3MF(buf){const dv=new DataView(buf);const b=new Uint8Array(buf);let eo=-1;
  for(let p=b.length-22;p>=Math.max(0,b.length-65557);p--)if(dv.getUint32(p,true)===0x06054b50){eo=p;break;}
  assert(eo>=0,'3MF/ZIP-Struktur nicht gefunden');const entries=dv.getUint16(eo+10,true),cent=dv.getUint32(eo+16,true);let p=cent,xml=null;
  for(let i=0;i<entries;i++){
    assert(p+46<=b.length&&dv.getUint32(p,true)===0x02014b50,'Ungültiges ZIP-Verzeichnis');const method=dv.getUint16(p+10,true),size=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),el=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
    const name=new TextDecoder().decode(b.slice(p+46,p+46+nl));p+=46+nl+el+cl;
    if(/(^|\/)3D\/.*\.model$/i.test('/'+name)||/\.model$/i.test(name)){
      assert(size<30e6,'3MF ist zu groß');assert(off+30<=b.length&&dv.getUint32(off,true)===0x04034b50,'ZIP-Eintrag beschädigt');
      const start=off+30+dv.getUint16(off+26,true)+dv.getUint16(off+28,true);let data=b.slice(start,start+size);
      if(method===8)data=await inflateRaw(data);else assert(method===0,'ZIP-Komprimierung unbekannt');xml=new TextDecoder().decode(data);break;
    }
  }
  assert(xml,'Keine 3MF-Modellgeometrie gefunden');const doc=new DOMParser().parseFromString(xml,'application/xml');assert(!doc.querySelector('parsererror'),'3MF-XML ungültig');
  let multiplier=1;const units=doc.documentElement.getAttribute('unit')||'millimeter';if(units==='inch')multiplier=25.4;if(units==='centimeter')multiplier=10;if(units==='meter')multiplier=1000;if(units==='micron')multiplier=.001;
  const meshes=[...doc.getElementsByTagName('*')].filter(el=>el.localName==='mesh');const out=[];
  for(const mesh of meshes){const parent=mesh.parentElement;if(parent?.getAttribute('type')==='other')continue;
    const verts=[...mesh.getElementsByTagName('*')].filter(el=>el.localName==='vertex').map(v=>['x','y','z'].map(k=>Number(v.getAttribute(k))*multiplier));
    const fs=[...mesh.getElementsByTagName('*')].filter(el=>el.localName==='triangle');for(const f of fs)for(const k of ['v1','v2','v3']){const v=verts[Number(f.getAttribute(k))];assert(v&&v.every(Number.isFinite),'3MF-Vertex ungültig');out.push(...v);if(out.length>MAX_TRIANGLES*9)throw Error('Zu viele Dreiecke');}
  }
  assert(out.length,'3MF enthält keine einfachen Dreiecksmeshes');return geometry(new Float32Array(out));
}
function box(w,d,h){assert(dim(w)&&dim(d)&&dim(h),'Breite/Tiefe/Höhe muss 0–500 mm betragen');const x=w/2,y=d/2,z=h;
const pts=[[0,0,0],[0,0,z],[x,-y,0],[x,y,0],[-x,y,0],[-x,-y,0],[x,-y,z],[x,y,z],[-x,y,z],[-x,-y,z]];
const faces=[[2,3,4],[2,4,5],[6,8,7],[6,9,8],[2,6,7],[2,7,3],[3,7,8],[3,8,4],[4,8,9],[4,9,5],[5,9,6],[5,6,2]];
return geometry(Float32Array.from(faces.flatMap(f=>f.flatMap(i=>pts[i]))));}
function cylinder(rad,h,segments=64){assert(dim(rad*2)&&dim(h),'Durchmesser/Höhe ungültig');segments=Math.min(144,Math.max(12,segments));const out=[];const p=(r,z,a)=>[r*Math.cos(a),r*Math.sin(a),z];
for(let i=0;i<segments;i++){const a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;const u=p(rad,0,a),v=p(rad,0,b),U=p(rad,h,a),V=p(rad,h,b);out.push(...u,...v,...V,...u,...V,...U,...[0,0,h],...U,...V,...[0,0,0],...v,...u);}return geometry(new Float32Array(out));}
/* Fully solid, oriented rectangular height-field with closed bottom and side walls. Pixel colors are input [0..255]. */
function relief(image, options){const {data,width,height}=image;assert(width>0&&height>0&&data.length>=width*height*4,'Kein Bild geladen');
  const cols=Math.min(196,Math.max(16,Math.round(+options.resolution||80)));const rows=Math.max(8,Math.round(cols*height/width));
  const mm=+options.mm,base=+options.base,raised=+options.relief;assert(dim(mm)&&dim(base)&&Number.isFinite(raised)&&raised>0&&raised<=40,'Abmessungen ungültig');
  const dep=mm*height/width;assert(dim(dep),'Ausschnitt zu schmal');const inverted=!!options.invert;
  const xyz=(i,j,z)=>[-mm/2+mm*i/(cols-1),-dep/2+dep*j/(rows-1),z];
  const tops=Array.from({length:rows},()=>new Array(cols));
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const px=Math.min(width-1,Math.round((i/(cols-1))*(width-1))),py=Math.min(height-1,Math.round(j/(rows-1)*(height-1))),idx=4*(py*width+px);
    const a=data[idx+3]/255;let light=(0.2126*data[idx]+0.7152*data[idx+1]+0.0722*data[idx+2])/255;
    if(inverted)light=1-light;tops[j][i]=xyz(i,j,base+raised*(light*a));
  }
  const out=[];const tri=(a,b,c)=>{out.push(...a,...b,...c)};
  for(let j=0;j<rows-1;j++)for(let i=0;i<cols-1;i++){
    const a=tops[j][i],b=tops[j][i+1],c=tops[j+1][i],d=tops[j+1][i+1];tri(a,b,c);tri(b,d,c);
  }
  for(let j=0;j<rows-1;j++)for(let i=0;i<cols-1;i++){
    const a=xyz(i,j,0),b=xyz(i+1,j,0),c=xyz(i,j+1,0),d=xyz(i+1,j+1,0);
    tri(a,c,b);tri(b,c,d);
  }
  for(let i=0;i<cols-1;i++){
    const a=tops[0][i],b=tops[0][i+1],botA=xyz(i,0,0),botB=xyz(i+1,0,0);tri(botA,botB,b);tri(botA,b,a);
    const c=tops[rows-1][i],d=tops[rows-1][i+1],botC=xyz(i,rows-1,0),botD=xyz(i+1,rows-1,0);tri(botC,c,d);tri(botC,d,botD);
  }
  for(let j=0;j<rows-1;j++){
    const a=tops[j][0],b=tops[j+1][0],botA=xyz(0,j,0),botB=xyz(0,j+1,0);tri(botA,a,b);tri(botA,b,botB);
    const c=tops[j][cols-1],d=tops[j+1][cols-1],botC=xyz(cols-1,j,0),botD=xyz(cols-1,j+1,0);tri(botC,botD,d);tri(botC,d,c);
  }
  return geometry(new Float32Array(out));
}
root.StudioCore={geometry,toBinarySTL,fromSTL,fromOBJ,from3MF,relief,box,cylinder,normal,MAX_TRIANGLES};
if(typeof module!=='undefined'&&module.exports) module.exports=root.StudioCore;
})(typeof module!=='undefined'&&module.exports?module.exports:window);

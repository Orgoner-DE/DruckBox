(function(){'use strict';
const C=window.StudioCore,$=id=>document.getElementById(id);let current=null,currentName='',img=null,selection=null,working=false;
const glCanvas=$('glCanvas'),drawCanvas=$('imageCanvas'),drawCtx=drawCanvas.getContext('2d',{willReadFrequently:true});
function status(msg,err=false){$('status').textContent=msg;$('status').classList.toggle('error',err);$('footstatus').textContent=err?'● Fehler':'● Bereit'}
function err(e){console.error(e);status(e?.message||String(e),true)}
function swapTab(name){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));document.querySelectorAll('.tabpage').forEach(p=>p.hidden=p.id!=='tab-'+name)}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>swapTab(b.dataset.tab)));
function number(id){return Number($(id).value)}
function nameSafe(n){return n.replace(/[^a-zA-Z0-9_.-]/g,'_').slice(0,70)||'2H4Y_modell'}
function setModel(model,name){current=model;currentName=name;viewer.upload(model);$('modelname').textContent=name;$('modelstats').textContent=`${model.faces.toLocaleString('de-DE')} Dreiecke · ${model.size.map(v=>v.toFixed(1)).join(' × ')} mm`;
  $('saveSTL').disabled=false;$('downloadOBJ').disabled=false;status('3D-Modell bereit. Drehen, prüfen oder STL exportieren.');glCanvas.scrollIntoView({behavior:'smooth',block:'nearest'});}
function objText(model){const t=model.triangles;const text=['# 2H4Y 3D Studio 1.0'];for(let i=0;i<t.length;i+=3)text.push(`v ${t[i]} ${t[i+1]} ${t[i+2]}`);for(let i=0;i<t.length/3;i+=3)text.push(`f ${i+1} ${i+2} ${i+3}`);return text.join('\n')+'\n';}
function downloadFallback(bytes,mime,name){const blob=bytes instanceof Blob?bytes:new Blob([bytes],{type:mime});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000)}
function nativeExport(bytes,mime,name){if(!(window.Native&&typeof Native.beginExport==='function'))return false;
  const arr=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes),sz=36*1024;
  Native.beginExport(name,mime);for(let p=0;p<arr.length;p+=sz){const data=arr.subarray(p,p+sz);let str='';for(let j=0;j<data.length;j++)str+=String.fromCharCode(data[j]);Native.exportChunk(btoa(str));}Native.finishExport();return true;
}
function exportData(bytes,mime,name){if(!nativeExport(bytes,mime,name))downloadFallback(bytes,mime,name);status('Export gestartet: '+name)}
$('saveSTL').onclick=()=>{try{if(!current)return;const buf=C.toBinarySTL(current);exportData(buf,'model/stl',nameSafe(currentName.replace(/\.[^.]+$/,''))+'.stl')}catch(e){err(e)}};
$('downloadOBJ').onclick=()=>{try{if(!current)return;const txt=objText(current);const bytes=new TextEncoder().encode(txt);exportData(bytes,'text/plain',nameSafe(currentName.replace(/\.[^.]+$/,''))+'.obj')}catch(e){err(e)}};
$('makeShape').onclick=()=>{try{const w=number('shapeW'),h=number('shapeH'),d=number('shapeD'),type=$('shape').value;setModel(type==='box'?C.box(w,d,h):C.cylinder(w/2,h,80),type==='box'?`Quader_${w}x${d}x${h}`:`Zylinder_D${w}_H${h}`)}catch(e){err(e)}};
async function openModel(file){if(!file)return;try{status('Lade Datei: '+file.name);if(file.size>80*1024*1024)throw Error('Maximale Dateigröße: 80 MB');let result;if(/\.stl$/i.test(file.name))result=C.fromSTL(await file.arrayBuffer());else if(/\.obj$/i.test(file.name))result=C.fromOBJ(await file.text());else if(/\.3mf$/i.test(file.name))result=await C.from3MF(await file.arrayBuffer());else throw Error('STL, OBJ oder 3MF auswählen');setModel(result,file.name)}catch(e){err(e)}}
$('modelFile').addEventListener('change',e=>openModel(e.target.files[0]));
const vp=$('viewport');vp.addEventListener('dragover',e=>{e.preventDefault();vp.style.outline='2px dashed #f7a339'});vp.addEventListener('dragleave',()=>vp.style.outline='');vp.addEventListener('drop',e=>{e.preventDefault();vp.style.outline='';openModel(e.dataTransfer.files[0]);});
function fitImage(){if(!img)return;const maxW=Math.min(880,$('imageWrap').clientWidth-2),scale=Math.min(maxW/img.naturalWidth,420/img.naturalHeight,1.5);drawCanvas.width=Math.round(img.naturalWidth*scale);drawCanvas.height=Math.round(img.naturalHeight*scale);renderImage()}
function renderImage(){if(!img)return;const w=drawCanvas.width,h=drawCanvas.height;drawCtx.clearRect(0,0,w,h);drawCtx.drawImage(img,0,0,w,h);if(selection){const{x,y,w:sw,h:sh}=selection;const sx=x*w,sy=y*h,cw=sw*w,ch=sh*h;drawCtx.fillStyle='rgba(8,14,20,.58)';drawCtx.fillRect(0,0,w,h);drawCtx.save();drawCtx.beginPath();drawCtx.rect(sx,sy,cw,ch);drawCtx.clip();drawCtx.drawImage(img,0,0,w,h);drawCtx.restore();drawCtx.strokeStyle='#ffb542';drawCtx.lineWidth=3;drawCtx.setLineDash([9,5]);drawCtx.strokeRect(sx,sy,cw,ch);drawCtx.setLineDash([]);for(const [cx,cy] of [[sx,sy],[sx+cw,sy],[sx,sy+ch],[sx+cw,sy+ch]]){drawCtx.fillStyle='#fcb74d';drawCtx.fillRect(cx-4,cy-4,8,8);}}
  $('cropInfo').textContent=selection?`${Math.round(selection.w*img.naturalWidth)} × ${Math.round(selection.h*img.naturalHeight)} Pixel markiert`:`Ganzes Bild: ${img.naturalWidth} × ${img.naturalHeight}`;
}
$('photoFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>25e6)throw Error('Foto zu groß (maximal 25 MB)');if(img&&img._url)URL.revokeObjectURL(img._url);const url=URL.createObjectURL(file),pic=new Image();pic.onload=()=>{img=pic;img._url=url;selection=null;$('imageWrap').classList.add('hasImage');$('photoEmpty').hidden=true;$('imageHint').hidden=false;fitImage();status('Foto geladen. Jetzt den gewünschten Bereich einrahmen.')};pic.onerror=()=>{URL.revokeObjectURL(url);err(Error('Foto konnte nicht gelesen werden'))};pic.src=url}catch(e){err(e)}});
const pos=(e)=>{const r=drawCanvas.getBoundingClientRect();return [Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))]};let anchor=null;
drawCanvas.addEventListener('pointerdown',e=>{if(!img)return;drawCanvas.setPointerCapture(e.pointerId);anchor=pos(e);selection={x:anchor[0],y:anchor[1],w:0,h:0}});
drawCanvas.addEventListener('pointermove',e=>{if(!anchor)return;const [x,y]=pos(e);selection={x:Math.min(x,anchor[0]),y:Math.min(y,anchor[1]),w:Math.abs(x-anchor[0]),h:Math.abs(y-anchor[1])};renderImage()});
drawCanvas.addEventListener('pointerup',e=>{if(!anchor)return;const [x,y]=pos(e);selection={x:Math.min(x,anchor[0]),y:Math.min(y,anchor[1]),w:Math.abs(x-anchor[0]),h:Math.abs(y-anchor[1])};if(selection.w<.015||selection.h<.015)selection=null;anchor=null;renderImage()});
drawCanvas.addEventListener('pointercancel',()=>{anchor=null;renderImage()});drawCanvas.addEventListener('dblclick',()=>{selection=null;renderImage()});$('resetCrop').onclick=()=>{selection=null;renderImage()};
$('generate').onclick=async()=>{if(working)return;try{if(!img)throw Error('Bitte zuerst ein Foto laden');working=true;$('generate').disabled=true;status('Berechne geschlossenes Relief-Mesh …');await new Promise(r=>setTimeout(r,40));const s=selection||{x:0,y:0,w:1,h:1};
  const iw=img.naturalWidth,ih=img.naturalHeight;const x=Math.max(0,Math.floor(s.x*iw)),y=Math.max(0,Math.floor(s.y*ih)),w=Math.max(2,Math.min(iw-x,Math.round(s.w*iw))),h=Math.max(2,Math.min(ih-y,Math.round(s.h*ih)));
  if(w<3||h<3)throw Error('Ausschnitt zu klein');const res=Number($('quality').value),aspect=h/w,scale=Math.min(1,(Math.round(res*aspect)>220?220/(res*aspect):1));const canvas=document.createElement('canvas');canvas.width=Math.max(4,Math.round(res*scale));canvas.height=Math.max(4,Math.round(res*aspect*scale));const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,x,y,w,h,0,0,canvas.width,canvas.height);
  const data=ctx.getImageData(0,0,canvas.width,canvas.height);const mesh=C.relief(data,{mm:number('widthMM'),base:number('baseMM'),relief:number('reliefMM'),resolution:canvas.width,invert:$('invert').checked});setModel(mesh,`2H4Y_Relief_${Math.round(number('widthMM'))}mm`);
  }catch(e){err(e)}finally{working=false;$('generate').disabled=false}};
$('resetView').onclick=()=>viewer.reset();
$('update').onclick=()=>{try{$('updateUrl').value=localStorage.getItem('2h4y-update-url')||''}catch(e){$('updateUrl').value=''}$('updateDialog').hidden=false};$('closeUpdate').onclick=()=>{$('updateDialog').hidden=true};
$('saveUpdateUrl').onclick=()=>{const url=$('updateUrl').value.trim();if(url&&!/^https:\/\//i.test(url)){status('Bitte gültige HTTPS-Update-Adresse eingeben',true);return}try{localStorage.setItem('2h4y-update-url',url)}catch(e){status('Speichern in diesem Browser eingeschränkt',true);return}$('updateDialog').hidden=true;status('Update-Quelle gespeichert. Aktuelle Version: 1.0.0.')};
$('openUpdate').onclick=()=>{const url=$('updateUrl').value.trim();if(!/^https:\/\//i.test(url)){status('Noch keine Update-Quelle eingerichtet',true);return}(window.Native&&typeof Native.openUrl==='function'?Native.openUrl(url):window.open(url,'_blank','noopener,noreferrer'))};
/* no third-party rendering libraries; lean WebGL triangle viewer */
class Viewer{
constructor(canvas){this.canvas=canvas;this.gl=canvas.getContext('webgl',{antialias:true,alpha:false,preserveDrawingBuffer:false});this.ctx2d=this.gl?null:canvas.getContext('2d');this.yaw=-.6;this.pitch=.37;this.zoom=3.5;this.points=new Map();this.mesh=null;this.wire=false;this.init();this.resize();new ResizeObserver(()=>this.resize()).observe(canvas);canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.max(1.7,Math.min(12,this.zoom*Math.exp(e.deltaY*.001)));this.draw()},{passive:false});canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);this.points.set(e.pointerId,[e.clientX,e.clientY]);});canvas.addEventListener('pointermove',e=>{if(!this.points.has(e.pointerId))return;const o=this.points.get(e.pointerId);if(this.points.size===1){this.yaw+=(e.clientX-o[0])*.008;this.pitch=Math.max(-1.46,Math.min(1.46,this.pitch+(e.clientY-o[1])*.008))}else{const ps=[...this.points.entries()];const other=ps.find(p=>p[0]!==e.pointerId);if(other){const od=Math.hypot(o[0]-other[1][0],o[1]-other[1][1]);const nd=Math.hypot(e.clientX-other[1][0],e.clientY-other[1][1]);if(nd>5&&od>5)this.zoom=Math.max(1.7,Math.min(12,this.zoom*od/nd));}}this.points.set(e.pointerId,[e.clientX,e.clientY]);this.draw()});['pointerup','pointercancel','lostpointercapture'].forEach(n=>canvas.addEventListener(n,e=>this.points.delete(e.pointerId)));
}
init(){const gl=this.gl;if(!gl){$('viewhint').textContent='2D-Ersatzvorschau · mit dem Finger drehen';return}
const vs=`attribute vec3 position;attribute vec3 normal;uniform mat4 vp;uniform vec3 center;uniform float scale;varying vec3 nrm;varying float z;void main(){vec3 p=(position-center)*scale;gl_Position=vp*vec4(p,1.0);nrm=normal;z=p.z;}`;
const fs=`precision mediump float;varying vec3 nrm;varying float z;void main(){vec3 n=normalize(nrm);float diffuse=max(dot(n,normalize(vec3(-0.35,0.4,0.84))),0.0);float light=0.34+0.66*diffuse;vec3 dark=vec3(0.15,0.51,0.56);vec3 gold=vec3(0.96,0.67,0.32);vec3 col=mix(dark,gold,clamp(z*0.35+0.55,0.0,1.0));gl_FragColor=vec4(col*light+vec3(0.02),1.0);}`;
function shader(type,src){const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh}
try{this.program=gl.createProgram();gl.attachShader(this.program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(this.program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
 this.pLoc=gl.getAttribLocation(this.program,'position');this.nLoc=gl.getAttribLocation(this.program,'normal');this.matrixLoc=gl.getUniformLocation(this.program,'vp');this.scaleLoc=gl.getUniformLocation(this.program,'scale');this.centerLoc=gl.getUniformLocation(this.program,'center');gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
}catch(e){err(Error('3D-Vorschau konnte nicht gestartet werden: '+e.message));this.program=null}}
reset(){this.yaw=-.6;this.pitch=.37;this.zoom=3.5;this.draw()}
resize(){const dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(1,Math.round(this.canvas.clientWidth*dpr)),h=Math.max(1,Math.round(this.canvas.clientHeight*dpr));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h}this.draw()}
upload(model){this.mesh=model;const gl=this.gl;if(!gl||!this.program){this.draw();return;}const vertices=model.triangles;const normals=new Float32Array(vertices.length);
for(let i=0;i<vertices.length;i+=9){const n=C.normal([vertices[i],vertices[i+1],vertices[i+2]],[vertices[i+3],vertices[i+4],vertices[i+5]],[vertices[i+6],vertices[i+7],vertices[i+8]]);for(let k=0;k<3;k++)normals.set(n,i+k*3)}
if(this.pBuf)gl.deleteBuffer(this.pBuf);if(this.nBuf)gl.deleteBuffer(this.nBuf);this.pBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.pBuf);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);this.nBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.nBuf);gl.bufferData(gl.ARRAY_BUFFER,normals,gl.STATIC_DRAW);this.reset();}
draw(){const gl=this.gl;if(!gl||!this.program){this.drawCPU();return;}gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(.035,.065,.09,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);if(!this.mesh)return;
const ar=this.canvas.width/this.canvas.height,near=.1,far=100,f=1/Math.tan(Math.PI/7);const proj=[f/ar,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,(2*far*near)/(near-far),0];
const eye=[this.zoom*Math.sin(this.yaw)*Math.cos(this.pitch),this.zoom*Math.sin(this.pitch),this.zoom*Math.cos(this.yaw)*Math.cos(this.pitch)];
function norm(v){const len=Math.hypot(...v)||1;return v.map(t=>t/len)}function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}function dot(a,b){return a.reduce((s,x,i)=>s+x*b[i],0)}
const z=norm(eye),x=norm(cross([0,0,1],z)),y=cross(z,x),view=[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];const mat=new Float32Array(16);
for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)mat[c*4+r]+=proj[k*4+r]*view[c*4+k];
const m=this.mesh,scale=2/Math.max(...m.size,1),center=m.min.map((v,i)=>(v+m.max[i])/2);
gl.useProgram(this.program);gl.uniformMatrix4fv(this.matrixLoc,false,mat);gl.uniform3fv(this.centerLoc,new Float32Array(center));gl.uniform1f(this.scaleLoc,scale);
gl.bindBuffer(gl.ARRAY_BUFFER,this.pBuf);gl.enableVertexAttribArray(this.pLoc);gl.vertexAttribPointer(this.pLoc,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,this.nBuf);gl.enableVertexAttribArray(this.nLoc);gl.vertexAttribPointer(this.nLoc,3,gl.FLOAT,false,0,0);
gl.drawArrays(gl.TRIANGLES,0,m.triangles.length/3);
}
drawCPU(){
 const ctx=this.ctx2d;if(!ctx)return;const W=this.canvas.width,H=this.canvas.height;ctx.fillStyle='#101823';ctx.fillRect(0,0,W,H);
 const m=this.mesh;if(!m)return;const t=m.triangles;const fac=m.faces;
 const scale=Math.min(W,H)*.72/Math.max(...m.size,1)*3.5/this.zoom;
 const cen=m.min.map((v,i)=>(v+m.max[i])/2),cy=Math.cos(this.yaw),sy=Math.sin(this.yaw),cp=Math.cos(this.pitch),sp=Math.sin(this.pitch);
 const proj=(i)=>{const x=t[i]-cen[0],y=t[i+1]-cen[1],z=t[i+2]-cen[2];const rx=x*cy-y*sy,ry=x*sy+y*cy;return [W*.5+scale*rx,H*.53+scale*(ry*sp-z*cp),ry*cp+z*sp]};
 const faces=[],stride=Math.max(1,Math.ceil(fac/28000));for(let f=0;f<fac;f+=stride){const k=f*9,a=proj(k),b=proj(k+3),c=proj(k+6);const N=C.normal([t[k],t[k+1],t[k+2]],[t[k+3],t[k+4],t[k+5]],[t[k+6],t[k+7],t[k+8]]);
 const light=Math.max(.18,.38+N[0]*-.2+N[1]*.15+N[2]*.52),shade=Math.round(light*235);faces.push({a,b,c,depth:(a[2]+b[2]+c[2])/3,color:`rgb(${Math.round(shade*.88)},${Math.round(shade*.72)},${Math.round(shade*.46)})`});}
 faces.sort((a,b)=>b.depth-a.depth);for(const f of faces){ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo(f.a[0],f.a[1]);ctx.lineTo(f.b[0],f.b[1]);ctx.lineTo(f.c[0],f.c[1]);ctx.closePath();ctx.fill();}
}
}
const viewer=new Viewer(glCanvas);window.addEventListener('resize',()=>{if(img)fitImage()});
})();

const assert=require('node:assert/strict');const core=require('../web/src/core.js');
function close(a,b,eps=1e-4){assert(Math.abs(a-b)<eps,`${a} != ${b}`)}
for(const mod of [core.box(20,10,6),core.cylinder(5,4,36)]){
 assert(mod.faces>=12);const bin=core.toBinarySTL(mod);assert(bin.byteLength===84+mod.faces*50);let parsed=core.fromSTL(bin);assert.equal(parsed.faces,mod.faces);parsed.size.forEach((x,i)=>close(x,mod.size[i]));}
const obj=core.fromOBJ('v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n');assert.equal(obj.faces,1);
const ascii=core.fromSTL(new TextEncoder().encode('solid test\n facet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid').buffer);assert.equal(ascii.faces,1);
const data=new Uint8ClampedArray(4*4*4);for(let i=0;i<data.length;i+=4){data[i]=200;data[i+1]=200;data[i+2]=200;data[i+3]=255;}
const m=core.relief({width:4,height:4,data},{mm:40,base:2,relief:3,resolution:24,invert:false});assert(m.faces>1000);assert(m.size[0]===40);assert(m.size[1]===40);close(m.size[2],2+3*200/255);assert.equal(core.fromSTL(core.toBinarySTL(m)).faces,m.faces);
function checkClosed(mesh){const t=mesh.triangles,edges=new Map();const round=p=>[...p].map(x=>x.toFixed(4)).join('/');for(let i=0;i<t.length;i+=9){const vs=[round(t.subarray(i,i+3)),round(t.subarray(i+3,i+6)),round(t.subarray(i+6,i+9))];for(let k=0;k<3;k++){const a=vs[k],b=vs[(k+1)%3],key=[a,b].sort().join('|');edges.set(key,(edges.get(key)||0)+1)}}assert([...edges.values()].every(v=>v===2),'Non-manifold edge found')};checkClosed(core.box(20,10,6));checkClosed(m);
console.log('OK: box, cylinder, ASCII/Binary STL, OBJ, relief & watertight edges');

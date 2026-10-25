"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RotateCcw, Plus, Minus, Maximize, Compass, LoaderCircle } from "lucide-react";
import type { ProjectData } from "../lib/domain";

export default function Scene({data,selected,onSelect,filter="all",labels=true,tour=false,share}:{data:ProjectData;selected?:string;onSelect:(id:string)=>void;filter?:string;labels?:boolean;tour?:boolean;share?:string}) {
  const host=useRef<HTMLDivElement>(null), controlsRef=useRef<OrbitControls|null>(null), cameraRef=useRef<THREE.PerspectiveCamera|null>(null);
  const selectRef=useRef(onSelect);selectRef.current=onSelect;
  const tourRef=useRef(tour);tourRef.current=tour;
  const [error,setError]=useState(""),[ready,setReady]=useState(false),[modelError,setModelError]=useState("");
  const selectedRef=useRef(selected);selectedRef.current=selected;
  const plotsRef=useRef(data.plots);plotsRef.current=data.plots;
  const filterRef=useRef(filter);filterRef.current=filter;
  const cameraMemory=useRef<{position:THREE.Vector3;target:THREE.Vector3}|null>(null);
  const geometryKey=JSON.stringify({plots:data.plots.map(p=>({id:p.id,points:p.points,number:p.number,building:p.building})),roads:data.roads,amenities:data.amenities,model:data.modelKey,labels});
  useEffect(()=>{
    const target=host.current;if(!target)return;
    let renderer:THREE.WebGLRenderer;
    try{ renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"}); }catch{setError("3D is unavailable on this device. Switch to the 2D plan to continue.");return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor(0xe7eae3);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    target.appendChild(renderer.domElement);renderer.domElement.setAttribute("aria-label","Interactive 3D site plan. Drag to orbit, scroll to zoom, click a plot to inspect.");renderer.domElement.setAttribute("role","img");
    const scene=new THREE.Scene();scene.background=new THREE.Color(0xe7eae3);scene.fog=new THREE.Fog(0xe7eae3,180,350);
    const camera=new THREE.PerspectiveCamera(36,1,.1,500);camera.position.copy(cameraMemory.current?.position||new THREE.Vector3(93,105,113));cameraRef.current=camera;
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.06;controls.minDistance=35;controls.maxDistance=200;controls.maxPolarAngle=Math.PI*.465;controls.target.set(0,0,0);controlsRef.current=controls;
    if(cameraMemory.current)controls.target.copy(cameraMemory.current.target);
    scene.add(new THREE.HemisphereLight(0xf9f9ee,0x8b9b82,2.5));
    const sun=new THREE.DirectionalLight(0xfff6df,3);sun.position.set(-45,85,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-80,right:80,top:80,bottom:-80,near:1,far:220});sun.shadow.bias=-.0004;sun.shadow.normalBias=.08;scene.add(sun);
    const group=new THREE.Group();scene.add(group);
    const mats:THREE.Material[]=[],geos:THREE.BufferGeometry[]=[],textures:THREE.Texture[]=[];
    const mat=(color:THREE.ColorRepresentation,roughness=.85)=>{const m=new THREE.MeshStandardMaterial({color,roughness});mats.push(m);return m;};
    const beige=mat(0xe5dfcf),grass=mat(0x8caa6c),edge=mat(0xcec9b8),road=mat(0x818680),line=mat(0xdadbc8),white=mat(0xf4f0e5),wood=mat(0x9e7e52),glass=mat(0x5f8585,.25),trunk=mat(0x9e8e6c),leaf=mat(0x54744b),leafLight=mat(0x78945a);
    function box(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material){const g=new THREE.BoxGeometry(w,h,d);geos.push(g);const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;}
    box(89,1.4,73,0,-1.2,0,beige);box(85,.35,69,0,-.32,0,grass);
    box(300,.2,300,0,-2,0,mat(0xe7eae3));
    const world=(x:number,y:number)=>[x/10-45,y/10-37.5];
    const treePositions:{x:number;z:number;size:number}[]=[];
    function tree(x:number,z:number,size=1){treePositions.push({x,z,size});}
    for(let i=0;i<36;i++){tree(-41+i*2.35,-33, .7+(i%3)*.12);tree(-41+i*2.35,30.5,.8);}
    for(let i=0;i<26;i++){tree(-41,-30+i*2.4,.8);tree(40,-30+i*2.4,.85);}
    box(83,.7,.3,0,.1,-34,edge);box(.3,.7,67,-42,.1,0,edge);box(.3,.7,67,42,.1,0,edge);
    for(const r of data.roads) for(let i=1;i<r.points.length;i++){
      const a=world(...r.points[i-1]),b=world(...r.points[i]),len=Math.hypot(b[0]-a[0],b[1]-a[1]),angle=-Math.atan2(b[1]-a[1],b[0]-a[0]);
      const mesh=box(len,.13,r.width/10,(a[0]+b[0])/2,.04,(a[1]+b[1])/2,road);mesh.rotation.y=angle;
      for(let d=2;d<len;d+=4){const t=d/len;const dash=box(1.5,.02,.12,a[0]+(b[0]-a[0])*t,.12,a[1]+(b[1]-a[1])*t,line);dash.rotation.y=angle;}
      if(r.width<60)for(let d=4;d<len;d+=8){const t=d/len;tree(a[0]+(b[0]-a[0])*t+r.width/20+1.3,a[1]+(b[1]-a[1])*t,.65);tree(a[0]+(b[0]-a[0])*t-r.width/20-1.3,a[1]+(b[1]-a[1])*t,.65);}
    }
    function label(text:string,x:number,y:number,z:number,color="#3f543b",size=3.5){const canvas=document.createElement("canvas");canvas.width=256;canvas.height=96;const ctx=canvas.getContext("2d")!;ctx.font="600 35px Arial";ctx.textAlign="center";ctx.fillStyle=color;ctx.fillText(text,128,58);const t=new THREE.CanvasTexture(canvas);textures.push(t);const m=new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true});mats.push(m);const s=new THREE.Sprite(m);s.position.set(x,y,z);s.scale.set(size,size*.375,1);group.add(s);}
    const pickables:THREE.Object3D[]=[];
    const plotMeshes:THREE.Mesh[]=[];
    for(const p of data.plots){
      const shape=new THREE.Shape();p.points.forEach(([x,y],i)=>{const [a,b]=world(x,y);i?shape.lineTo(a,-b):shape.moveTo(a,-b);});shape.closePath();
      const g=new THREE.ExtrudeGeometry(shape,{depth:.13,bevelEnabled:false});g.rotateX(-Math.PI/2);geos.push(g);
      const m=mat(p.status==="sold"?0xb9b5a3:p.status==="reserved"?0xc9bb7d:0xa3bc83);const mesh=new THREE.Mesh(g,m);mesh.position.y=.04;mesh.receiveShadow=true;mesh.userData={id:p.id,status:p.status,base:(m as THREE.MeshStandardMaterial).color.clone()};group.add(mesh);pickables.push(mesh);plotMeshes.push(mesh);
      const lineG=new THREE.EdgesGeometry(g);geos.push(lineG);const lineM=new THREE.LineBasicMaterial({color:0xdfe2c4,transparent:true,opacity:.8});mats.push(lineM);const edges=new THREE.LineSegments(lineG,lineM);edges.position.y=.08;group.add(edges);
      const center=p.points.reduce((a,b)=>[a[0]+b[0]/p.points.length,a[1]+b[1]/p.points.length],[0,0]);const [x,z]=world(center[0],center[1]);
      if(labels)label(p.number,x,.8,z+1.6,"#44533b",3.2);
      if(p.building){
        box(7.5,.2,4.9,x,.3,z,beige);box(6.4,2.8,3.9,x,1.8,z,white);box(3.6,2.5,3.5,x-1.3,4.25,z-.1,white);box(6.8,.25,4.2,x,3.3,z,wood);box(3.9,.25,3.8,x-1.3,5.6,z-.1,white);box(4.5,1.9,.05,x,1.8,z+1.98,glass);box(2.5,1.5,.05,x-1.3,4.3,z+1.68,glass);box(.4,2.8,.4,x+2.8,1.8,z+1.65,wood);tree(x-4,z-2,.6);
      }
    }
    for(const a of data.amenities){const[x,z]=world(a.x,a.y);
      if(a.type==="pool"){box(7,.2,4,x,.3,z,white);box(6.3,.24,3.3,x,.45,z,mat(0x73b6be,.25));for(let i=0;i<4;i++)box(.8,.3,1.7,x-2.8+i*1.8,.5,z+3,white);}
      if(a.type==="clubhouse"){box(8,3,5,x,1.6,z,white);box(8.5,.3,5.5,x,3.25,z,wood);box(5.5,2.1,.1,x,1.6,z+2.55,glass);box(8.3,.2,6,x,.2,z,beige);}
      if(a.type==="park"){box(18,.1,7,x,.15,z,mat(0x7d9d5f));for(let i=0;i<6;i++)tree(x-8+i*3,z-2,.8);const ringG=new THREE.TorusGeometry(1.8,.3,6,32);geos.push(ringG);const ring=new THREE.Mesh(ringG,beige);ring.rotation.x=Math.PI/2;ring.position.set(x,.4,z);group.add(ring);}
      if(a.type==="gate"){box(.8,4,.8,x-3,1.8,z,white);box(.8,4,.8,x+3,1.8,z,white);box(7,.7,1,x,3.7,z,wood);}
      if(labels)label(a.name.toUpperCase(),x,1.3,z-4,"#66725c",7);
    }
    // Hundreds of trees share two draw calls rather than hundreds of separate meshes.
    const trunkGeometry=new THREE.BoxGeometry(.2,1.5,.2),leafGeometry=new THREE.IcosahedronGeometry(1.15,1);geos.push(trunkGeometry,leafGeometry);
    const trunks=new THREE.InstancedMesh(trunkGeometry,trunk,treePositions.length),crowns=new THREE.InstancedMesh(leafGeometry,leaf,treePositions.length),dummy=new THREE.Object3D();
    treePositions.forEach(({x,z,size},i)=>{dummy.position.set(x,.6*size,z);dummy.scale.set(1,size,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);dummy.position.set(x,2.2*size,z);dummy.scale.set(.85*size,1.1*size,.85*size);dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);crowns.setColorAt(i,new THREE.Color(i%3?0xa8b99a:0xd2dcaa));});trunks.castShadow=true;crowns.castShadow=true;group.add(trunks,crowns);
    let alive=true;
    if(data.modelKey){const url=`/api/files/${data.modelKey}${share?`?share=${share}`:""}`;new GLTFLoader().load(url,gltf=>{if(!alive)return;const model=gltf.scene;const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());const s=70/Math.max(size.x,size.z);model.scale.setScalar(s);model.position.set(-center.x*s,-bounds.min.y*s+.5,-center.z*s);model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=o.receiveShadow=true;}});group.add(model);},undefined,()=>setModelError("The GLB could not be loaded. The editable site plan is still available."));}
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=[0,0],hover="";
    function pick(e:PointerEvent){const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(pickables)[0]?.object.userData.id;}
    const onDown=(e:PointerEvent)=>{down=[e.clientX,e.clientY];},onUp=(e:PointerEvent)=>{if(Math.hypot(e.clientX-down[0],e.clientY-down[1])<6){const id=pick(e);if(id)selectRef.current(id);}},onMove=(e:PointerEvent)=>{hover=pick(e)||"";renderer.domElement.style.cursor=hover?"pointer":"grab";};
    renderer.domElement.addEventListener("pointerdown",onDown);renderer.domElement.addEventListener("pointerup",onUp);renderer.domElement.addEventListener("pointermove",onMove);
    const resize=new ResizeObserver(()=>{const w=target.clientWidth,h=target.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);});resize.observe(target);
    renderer.setAnimationLoop(()=>{controls.autoRotate=tourRef.current;controls.autoRotateSpeed=.45;controls.update();for(const m of plotMeshes){const selected=m.userData.id===selectedRef.current;const material=m.material as THREE.MeshStandardMaterial;const status=plotsRef.current.find(p=>p.id===m.userData.id)?.status;material.color.set(status==="sold"?0xb9b5a3:status==="reserved"?0xc9bb7d:0xa3bc83);material.transparent=true;material.opacity=filterRef.current==="all"||filterRef.current===status?1:.15;if(selected)material.color.set(0x50765d);else if(hover===m.userData.id)material.color.multiplyScalar(1.13);}renderer.render(scene,camera);});
    setReady(true);
    return()=>{cameraMemory.current={position:camera.position.clone(),target:controls.target.clone()};alive=false;resize.disconnect();renderer.setAnimationLoop(null);controls.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh&&o.geometry&&!geos.includes(o.geometry))o.geometry.dispose();});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();};
  },[geometryKey,share]);
  return <div className="scene-wrap"><div ref={host} className="scene-host"/>{error?<div className="scene-loading">{error}</div>:!ready?<div className="scene-loading"><LoaderCircle className="spin"/> Building your perspective…</div>:null}{modelError&&<div className="model-warning">{modelError}</div>}<div className="north"><Compass size={28}/><span>N</span></div><div className="canvas-controls"><button aria-label="Zoom in" onClick={()=>{cameraRef.current?.position.multiplyScalar(.85);}}><Plus size={17}/></button><button aria-label="Zoom out" onClick={()=>cameraRef.current?.position.multiplyScalar(1.15)}><Minus size={17}/></button><i/><button aria-label="Reset camera" onClick={()=>{cameraRef.current?.position.set(93,105,113);controlsRef.current?.target.set(0,0,0);}}><RotateCcw size={17}/></button><button aria-label="Fullscreen scene" onClick={()=>{if(document.fullscreenElement)document.exitFullscreen();else host.current?.parentElement?.requestFullscreen();}}><Maximize size={16}/></button></div><div className="scene-hint"><span className="mouse-shape"/> Drag to orbit <b>·</b> Scroll to zoom</div></div>;
}


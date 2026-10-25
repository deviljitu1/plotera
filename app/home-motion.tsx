"use client";
import {useEffect} from "react";

function loadScript(src:string){
  return new Promise<void>((resolve,reject)=>{
    const existing=document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if(existing?.dataset.loaded)return resolve();
    const script=existing||document.createElement("script");
    script.addEventListener("load",()=>{script.dataset.loaded="true";resolve();},{once:true});
    script.addEventListener("error",()=>reject(new Error(`Could not load ${src}`)),{once:true});
    if(!existing){script.src=src;document.body.appendChild(script);}
  });
}

export default function HomeMotion(){
  useEffect(()=>{
    let active=true;
    let dispose:(()=>void)|undefined;
    (async()=>{
      await Promise.all(["gsap.min.js","ScrollTrigger.min.js","SplitText.min.js","lenis.min.js"].map(file=>loadScript(`/design/vendor/${file}`)));
      if(!active)return;
      if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("motion");
      await loadScript("/design/home-motion.js");
      if(active)dispose=(window as Window & {initPloteraHome?:()=>()=>void}).initPloteraHome?.();
    })().catch(()=>document.documentElement.classList.remove("motion"));
    return()=>{active=false;dispose?.();};
  },[]);
  return null;
}

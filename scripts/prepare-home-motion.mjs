// Keep the reference choreography while adapting its lifecycle to React.
export function prepareHomeMotion(source){
  if(!source.startsWith("(()=>{")||!source.endsWith("})();"))throw new Error("Unexpected reference motion format");
  let code=source.slice(6,-5)
    .replace(/\b([A-Za-z_$][\w$]*)\.addEventListener\(/g,"listen($1,")
    .replace(/(?<!\.)\baddEventListener\(/g,"listen(window,")
    .replace(/\bsetTimeout\(/g,"schedule(")
    .replaceAll("new IntersectionObserver(","observe(")
    .replaceAll("SplitText.create(","makeTextSplit(")
    .replace("lenis=new Lenis(","lenis=state.lenis=new Lenis(")
    .replace("gsap.ticker.add(t=>lenis.raf(t*1000))","gsap.ticker.add(state.tick=t=>lenis.raf(t*1000))")
    .replace("||!root.classList.contains('motion'))return;","||!root.classList.contains('motion'))return dispose;")
    .replace("if(ready.has(sec))return;ready.add(sec);try{effects(sec)}","if(disposed||ready.has(sec))return;ready.add(sec);const context=gsap.context(()=>{try{effects(sec)}")
    .replace("});ScrollTrigger.sort()};const queue=[]","});});contexts.push(context);ScrollTrigger.sort();refreshSoon()};const queue=[]")
    .replace("const start=()=>{sections.filter","const start=()=>{if(disposed)return;sections.filter")
    .replace("end:'+=90%',scrub:0.7,pin:true","end:()=>'+='+Math.round(Math.min(innerHeight*0.4,360)),scrub:0.7,pin:true,invalidateOnRefresh:true")
    .replace("const stats=sec.querySelectorAll('.stats > div');",`sec.querySelectorAll('.stats dd').forEach(dd=>{const value=Number(dd.textContent.trim());if(!Number.isFinite(value)||inView(dd))return;const count={value:0};gsap.to(count,{value,duration:1.3,ease:'power2.out',onUpdate:()=>{dd.textContent=String(Math.round(count.value))},scrollTrigger:{trigger:dd,start:'top 92%',once:true}})});const stats=sec.querySelectorAll('.stats > div');`);
  const lifecycle=`const controller=new AbortController(),timers=[],observers=[],splits=[],contexts=[],state={lenis:null,tick:null};let disposed=false,refreshTimer;const listen=(target,event,fn,options)=>target.addEventListener(event,fn,{...options,signal:controller.signal});const schedule=(fn,delay)=>{const id=setTimeout(()=>{if(!disposed)fn()},delay);timers.push(id);return id};const observe=(...args)=>{const observer=new IntersectionObserver(...args);observers.push(observer);return observer};const split=(...args)=>{const item=SplitText.create(...args);splits.push(item);return item};const refreshSoon=()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{if(!disposed&&window.ScrollTrigger)ScrollTrigger.refresh(true)},80)};const dispose=()=>{disposed=true;controller.abort();clearTimeout(refreshTimer);timers.forEach(clearTimeout);observers.forEach(o=>o.disconnect());state.lenis?.destroy();if(state.tick)gsap.ticker.remove(state.tick);contexts.reverse().forEach(c=>c.revert());splits.reverse().forEach(s=>s.revert())};`;
  const refresh=`listen(window,'resize',refreshSoon,{passive:true});document.querySelectorAll('main img').forEach(img=>{if(!img.complete)listen(img,'load',refreshSoon,{once:true})});if(document.fonts)document.fonts.ready.then(()=>{if(!disposed)refreshSoon()});refreshSoon();return dispose;`;
  return `window.initPloteraHome=()=>{${lifecycle.replace("const split=", "const makeTextSplit=")}${code};${refresh}};`;
}

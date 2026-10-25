import {readFile,writeFile,mkdir,access} from "node:fs/promises";
import {parse,parseFragment,serialize} from "parse5";
import {prepareHomeMotion} from "./prepare-home-motion.mjs";
const source=await readFile(new URL("../design/reference.html",import.meta.url),"utf8");
const doc=parse(source),attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const all=(node,predicate)=>{const out=[];function visit(n){if(predicate(n))out.push(n);for(const c of n.childNodes||[])visit(c);}visit(node);return out;};
const cls=(node,name)=>all(node,n=>(attr(n,"class")||"").split(/\s+/).includes(name));
const tag=(node,name)=>all(node,n=>n.tagName===name);
const id=name=>all(doc,n=>attr(n,"id")===name)[0];
const setAttr=(n,k,value)=>{if(!n)return;const a=n.attrs.find(a=>a.name===k);if(a)a.value=value;else n.attrs.push({name:k,value});};
const text=(n,value)=>{if(n)n.childNodes=[{nodeName:"#text",value,parentNode:n}];};
const html=(n,value)=>{if(n){n.childNodes=parseFragment(value).childNodes;for(const c of n.childNodes)c.parentNode=n;}};
const remove=n=>{if(n?.parentNode)n.parentNode.childNodes=n.parentNode.childNodes.filter(c=>c!==n);};
const first=(n,c)=>cls(n,c)[0];
const icon=(name="ne")=>`<svg class="i"><use href="#i-${name}"/></svg>`;
const btn=(label,href="/studio",solid=false)=>`<a class="btn${solid?" btn-solid":""}" href="${href}"><span>${label}</span><i class="btn-dot">${icon()}</i></a>`;
const body=tag(doc,"body")[0];
const scripts=tag(doc,"script");
const theme=scripts.find(n=>serialize(n).includes("localStorage.getItem('theme')"));
const motion=scripts.find(n=>serialize(n).length>10000);
const themeJs=serialize(theme),motionJs=serialize(motion);
for(const script of scripts)remove(script);
// Keep the supplied geometry, CSS and motion hooks; change the product content.
for(const bar of cls(body,"bar"))remove(bar);
for(const n of all(body,n=>n.nodeName==="#text"))n.value=n.value.replaceAll("Mirador","Plotera");
for(const n of all(body,n=>n.attrs))for(const a of n.attrs)if(a.name==="aria-label")a.value=a.value.replaceAll("Mirador","Plotera");
const hero=id("home");html(first(hero,"hero-title"),"<span>Your Plots.</span> <span>In 3D.</span>");
text(first(hero,"hero-lede"),"Turn your approved site map into an interactive 3D brochure. Give buyers a clear view of every plot — and one direct way to reach you.");
text(first(hero,"find-title"),"See The Bigger Picture");
text(tag(first(hero,"hero-find"),"p")[0],"A simple map editor. A considered 3D experience. One link to present the place you’re building.");
html(first(hero,"find-num"),"<strong>2</strong><span>Connected perspectives</span>");
const findLink=tag(first(hero,"find-row"),"a")[0];setAttr(findLink,"href","/studio");setAttr(findLink,"aria-label","Open the design studio");
text(first(hero,"feat-name"),"Boulevard Estate");text(tag(first(hero,"feat-addr"),"span")[0],"Interactive sample project");
const previewLink=tag(first(hero,"feat-top"),"a")[0];setAttr(previewLink,"href","/demo");setAttr(previewLink,"aria-label","Explore the sample project");
text(first(hero,"feat-desc"),"A plotted neighbourhood with clear boundaries, tree-lined avenues and room to imagine. Explore the editable sample before building your own.");
html(first(hero,"specs"),`<li>${icon("area")}24 plots</li><li>${icon("leaf")}4 amenities</li><li>${icon("bed")}2 perspectives</li><li>${icon("bath")}1 shared plan</li>`);
html(first(hero,"feat-acts"),`<a class="act" href="/demo" aria-label="View the live demo"><span class="ibtn">${icon("grid")}</span>View live demo</a><a class="act" href="/studio" aria-label="Start a project"><span class="ibtn">${icon("save")}</span>Start a project</a><button class="act" type="button" data-share aria-label="Share"><span class="ibtn">${icon("share")}</span></button>`);
const intro=id("intro"),statement=first(intro,"statement"),inline=cls(statement,"inl").map(n=>serialize({nodeName:"#document-fragment",childNodes:[n]}));
html(statement,`Start with the map you already have ${inline[0]} — shape every boundary with care ${inline[1]}, give every place a little perspective ${inline[2]} and make the next step feel natural.`);
const note=first(intro,"intro-note");text(tag(note,"p")[0],"Plotera brings site planning and property presentation into one workspace. Trace the actual map, check its scale, and carry the same layout into a brochure buyers can explore.");
html(tag(note,"a")[0],`<span>Explore the studio</span><i class="btn-dot">${icon()}</i>`);setAttr(tag(note,"a")[0],"href","/studio");
const counters=tag(first(intro,"stats"),"div");[["Plots in the sample","24"],["Connected perspectives","2"],["Direct contact channel","1"]].forEach(([label,value],i)=>{text(tag(counters[i],"dt")[0],label);text(tag(counters[i],"dd")[0],value);setAttr(tag(counters[i],"dd")[0],"style",`--len:${value.length}`);});
const homes=id("homes");text(tag(homes,"h2")[0],"A perspective for every kind of place");text(tag(first(homes,"sec-aside"),"p")[0],"Plotted developments, villa communities and quieter retreats. Start with a sample, then bring your own map and architecture into the picture. Photos illustrate the design direction.");
text(tag(tag(first(homes,"sec-aside"),"a")[0],"span")[0],"Create a project");setAttr(tag(first(homes,"sec-aside"),"a")[0],"href","/studio");
const sampleNames=["Boulevard Estate","Palm Grove","The Ridge"],samplePlaces=["Residential plotted development","Villa community concept","Farmhouse layout concept"];
cls(homes,"home").forEach((card,i)=>{text(tag(card,"h3")[0],sampleNames[i]);html(first(card,"home-where"),icon("pin")+samplePlaces[i]);html(first(card,"tag"),icon("nw")+"Sample project");text(first(card,"home-price"),"Explore the layout");for(const a of tag(card,"a")){setAttr(a,"href",`/demo?layout=${i}`);setAttr(a,"aria-label",`Explore ${sampleNames[i]}`);}html(first(card,"home-specs"),`<li>${icon("area")}<span><b>${i===0?24:i===1?20:16}</b> plots</span></li><li>${icon("leaf")}<span><b>2D</b> site plan</span></li><li>${icon("bed")}<span><b>3D</b> perspective</span></li><li>${icon("bath")}<span><b>Live</b> preview</span></li>`);});
const regions=id("regions");text(tag(regions,"h2")[0],"Built around the way you sell");text(tag(regions,"p")[0],"Make the layout understandable, the availability visible and the next conversation specific to a plot. A shared link works on a phone, tablet or desktop.");
const regionCards=tag(regions,"a");regionCards.forEach((card,i)=>{const labels=["Plotting schemes","Villa communities","Farmhouse layouts","Broker presentations"],notes=["Clear numbered plots","Architecture in context","Room for a bigger picture","A single link to share"];const headings=tag(card,"h3");text(first(card,"region-name")||headings[0],labels[i]);for(const n of all(card,n=>n.nodeName==="#text")){if(/\d+ homes/.test(n.value))n.value="2D + 3D";if(/Sedona|Big Sur|Tahoe|Sonoma/.test(n.value))n.value=notes[i];}setAttr(card,"href","/demo");});
const gallery=id("gallery");text(tag(gallery,"h2")[0],"Every angle, every considered detail");text(tag(gallery,"p")[0],"Bring your project imagery, documents and 3D models into one presentation. These architectural photographs illustrate the visual direction; your own files tell your project’s story.");
const captions=["A sense of possibility","Architecture with character","Room to imagine","The details that matter","Light, space and perspective"];tag(gallery,"figcaption").forEach((c,i)=>text(c,captions[i%captions.length]));
const process=first(body,"process")||all(body,n=>attr(n,"data-kind")==="process")[0];
if(process){text(tag(process,"h2")[0],"From an actual map to a place worth sharing");const titles=["Start with the actual map","Set the scale once","Trace, or design with Codex","Give buyers a clear next step"],copies=["Upload a PNG, JPG or WebP of your approved layout. Keep it beneath the drawing as your reference.","Mark a known distance from the survey. The editor uses that scale to calculate areas as you trace each plot.","Draw boundaries and roads with simple tools, or connect Codex to inspect the map and prepare an editable draft.","Preview in 2D or 3D, add your documents, and publish. Buyers select a plot and contact you directly on WhatsApp."];tag(process,"h3").forEach((h,i)=>{text(h,titles[i]);const p=tag(h.parentNode,"p")[0];text(p,copies[i]);html(first(h.parentNode,"proc-time"),icon("check")+["Your source layout","One known distance","An editable draft","A link to explore"][i]);});}
// The product is sold per project; the supplied fee-card layout becomes capability cards.
const pricing=id("pricing");text(tag(pricing,"h2")[0],"One project. Your kind of presentation.");text(tag(first(pricing,"sec-aside"),"p")[0],"Start with an accurate layout. Add the level of detail your development needs. Any project fee is agreed directly — there is no online checkout.");remove(first(pricing,"seg"));
const planTitles=["Map & plan","Present & share","Add architectural detail"],planNotes=["The source of every perspective","A brochure buyers can explore","When your project needs more"];
const features=[["Trace the approved site map","Calibrate scale and plot areas","Manage plot status and pricing"],["Switch between 2D and 3D","Share a project brochure","Plot-specific WhatsApp contact","Documents and click analytics"],["Upload a detailed Blender GLB","Add project narration and imagery","Let Codex help design the map"]];
cls(pricing,"plan").forEach((card,i)=>{text(tag(card,"h3")[0],planTitles[i]);text(first(card,"plan-for"),planNotes[i]);text(first(card,"plan-fee"),i===0?"Create":i===1?"Explore":"Refine");text(first(card,"plan-note"),"Part of your project workflow");html(first(card,"plan-list"),features[i].map(f=>`<li>${icon("check")}${f}</li>`).join(""));const a=tag(card,"a")[0];setAttr(a,"href","/studio");text(tag(a,"span")[0],i===2?"Open the studio":"Start your project");});
remove(id("team"));for(const n of all(body,n=>attr(n,"data-kind")==="reviews"||cls(n,"reviews").includes(n)))remove(n);
const faq=id("faq");text(tag(faq,"h2")[0],"A few things you might be wondering");text(tag(first(faq,"faq-intro")||faq,"p")[0],"A simpler way to build, with room for the details that matter.");
const questions=["Can I use my actual approved layout?","Will a flat map become a photorealistic building?","Can Codex create the layout for me?","How do buyers contact the developer?","Do I need to pay through the app?"];
const answers=["Yes. Upload a PNG, JPG or WebP map, calibrate it using a known survey distance, and trace each boundary. Check the result over the source map and confirm dimensions against the approved survey.","The editor builds a 3D site layout from your plot and road geometry. Detailed villas, interiors and photorealistic architecture require a suitable 3D model. You can create that in Blender and upload a GLB.","Once the authenticated MCP server is connected, Codex can inspect an uploaded reference image, create plot polygons, add a layout and revise inventory. You can review and edit the result in the same studio.","The brochure uses a WhatsApp contact button. A selected plot’s number and area are included in the draft message. Clicks measure intent; they do not confirm a message or sale.","There is no payment gateway or online checkout. Project fees can be agreed separately and recorded manually in the workspace."];
tag(faq,"details").forEach((detail,i)=>{const summary=tag(detail,"summary")[0];if(summary){const name=tag(summary,"span")[0];if(name)text(name,questions[i]);else{const last=summary.childNodes.filter(x=>x.nodeName==="#text")[0];if(last)last.value=questions[i];}}const p=tag(detail,"p")[0];text(p,answers[i]);});
for(const a of tag(faq,"a")){setAttr(a,"href","/studio");const span=tag(a,"span")[0];if(span)text(span,"Open the studio");}
const sell=first(body,"sell")||all(body,n=>attr(n,"data-kind")==="cta")[0];
if(sell){text(tag(sell,"h2")[0],"Your next project starts with a map");text(tag(sell,"p")[0],"Bring your approved layout into the studio. Shape its presentation, add the detail it deserves and give buyers a clear way to explore it.");for(const a of tag(sell,"a")){setAttr(a,"href","/studio");const span=tag(a,"span")[0];if(span)text(span,"Create your project");}const list=tag(sell,"ul")[0];if(list)html(list,"<li><strong>2D + 3D</strong> One connected layout</li><li><strong>WhatsApp</strong> Direct plot enquiries</li>");}
const contact=id("contact");text(tag(contact,"h2")[0],"Make room for a better perspective");
const form=tag(contact,"form")[0];if(form){const replacement=parseFragment(`<div class="cform plotera-start"><h3>Your map is the starting point.</h3><p>Open the studio to create a project, upload your map and start shaping the layout. The same design becomes your interactive brochure.</p>${btn("Open the design studio","/studio",true)}${btn("Explore the sample","/demo")}<p class="plotera-start-note">Project enquiries go directly to the developer on WhatsApp. There are no enquiry forms or payment gateways.</p></div>`).childNodes[0];replacement.parentNode=form.parentNode;form.parentNode.childNodes=form.parentNode.childNodes.map(n=>n===form?replacement:n);}
const contactCard=first(contact,"contact-card");if(contactCard){text(tag(contactCard,"h3")[0],"Your project workspace");text(tag(contactCard,"address")[0],"Create the plan. Shape the perspective.");html(first(contactCard,"contact-list"),`<li>${icon("grid")}Editable map boundaries</li><li>${icon("leaf")}Connected 2D and 3D views</li><li>${icon("chat")}Plot-specific WhatsApp contact</li>`);}
const footer=tag(body,"footer")[0];if(footer){const news=tag(footer,"form")[0];if(news){html(news,btn("Start with your map","/studio"));news.tagName="div";news.nodeName="div";}text(tag(footer,"h2")[0],"A new perspective, from the first plot");const footerHeads=tag(footer,"h3");["Explore","Plotera","Your next step"].forEach((v,i)=>text(footerHeads[i],v));const links=tag(footer,"a").filter(a=>attr(a,"href")!=="#home");const entries=[["The studio","/studio"],["Sample brochure","/demo"],["Project types","#regions"],["How it works","#process"],["Capabilities","#pricing"],["Questions","#faq"],["Create a project","/studio"],["Explore a demo","/demo"],["Back to the map","/studio"]];links.forEach((a,i)=>{if(entries[i]){text(a,entries[i][0]);setAttr(a,"href",entries[i][1]);}});}
const rail=first(body,"rail");for(const a of tag(rail,"a")){const label=attr(a,"aria-label");if(label==="Your agent"){setAttr(a,"href","/studio");setAttr(a,"aria-label","Your design workspace");html(a,icon("grid"));}if(label==="New-home alerts"){setAttr(a,"href","/studio");setAttr(a,"aria-label","Your projects");}if((attr(a,"href")||"").startsWith("tel:")){setAttr(a,"href","/studio");setAttr(a,"aria-label","Start your project");}if(label==="Homes for sale")setAttr(a,"aria-label","Sample projects");if(label==="Contact")setAttr(a,"aria-label","Create a project");}
// Normal links preserve a full document boundary between the public design and the studio.
for(const a of tag(body,"a")){const href=attr(a,"href")||"";if(href==="#team")setAttr(a,"href","#intro");if(href==="#alerts")setAttr(a,"href","/studio");if(href.startsWith("mailto:")||href.startsWith("tel:")){setAttr(a,"href","/studio");text(a,"Open the studio");}}
// The public page sells the experience. Authoring lives only in the signed-in admin.
const whatsapp="https://wa.me/917875783498?text="+encodeURIComponent("Hi, I’m interested in an interactive plot brochure. Can we discuss my project and approved layout?");
for(const a of tag(body,"a").filter(a=>attr(a,"href")==="/studio")){
  setAttr(a,"href",whatsapp);setAttr(a,"target","_blank");setAttr(a,"rel","noopener noreferrer");setAttr(a,"aria-label","Discuss your project on WhatsApp");
  const label=tag(a,"span").find(n=>!(attr(n,"class")||"").includes("ibtn"));
  if(label)text(label,"Discuss your project");
  else if(!tag(a,"svg").length)text(a,"Discuss your project");
  if((attr(a,"class")||"").split(/\s+/).includes("act"))html(a,`<span class="ibtn">${icon("chat")}</span>Discuss project`);
}
const start=first(contact,"plotera-start");if(start){text(tag(start,"h3")[0],"Let’s talk about your project.");text(tag(start,"p")[0],"Share your approved layout and requirements on WhatsApp. Explore a working example, then discuss the presentation your project needs.");}
if(footer){const admin=parseFragment('<a class="admin-access" href="/admin">Admin sign in</a>').childNodes[0];admin.parentNode=footer;footer.childNodes.push(admin);}
await mkdir("public/design/assets",{recursive:true});await mkdir("public/design/vendor",{recursive:true});
const images=tag(body,"img"),urls=[...new Set(images.map(n=>attr(n,"src")).filter(Boolean))];
const manifest=[];
for(let i=0;i<urls.length;i++){const url=urls[i],path=`/design/assets/image-${String(i+1).padStart(2,"0")}.jpg`;manifest.push({url,path});for(const img of images.filter(n=>attr(n,"src")===url)){setAttr(img,"src",path);if(!attr(img,"fetchpriority")){setAttr(img,"loading","lazy");setAttr(img,"decoding","async");}}}
let css=tag(doc,"style").map(n=>serialize(n)).join("\n");
css+='\n.plotera-start{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:24px;min-height:520px;padding:44px;border:1px solid var(--line);border-radius:var(--r-plate);background:var(--card)}.plotera-start h3{font:500 clamp(30px,3vw,46px)/1.08 var(--f-display);letter-spacing:-.035em}.plotera-start p{color:var(--muted);max-width:40ch}.plotera-start-note{font-size:13px!important}.ava>.i{margin:14px}.hero-title{pointer-events:none}@media(max-width:767px){.plotera-start{padding:30px;min-height:460px}}';
css+='\n.admin-access{display:inline-block;margin:0 0 28px var(--inset);font-size:12px;color:var(--muted)}';
await writeFile("public/design/home.css",css);await writeFile("public/design/theme-init.js",themeJs);await writeFile("public/design/home-motion.js",prepareHomeMotion(motionJs));
for(const n of all(body,n=>n.nodeName==="#text"))n.value=n.value.replaceAll("Plotera Homes","Plotera Studio");
const fragment={nodeName:"#document-fragment",childNodes:body.childNodes};await writeFile("app/home-content.ts","// Adapted from the user-supplied reference. Original DOM hooks preserve its motion.\nexport const homeContent = "+JSON.stringify(serialize(fragment))+";\n");
await writeFile("research/home-assets.json",JSON.stringify(manifest,null,2));
console.log(`Prepared the supplied design with ${urls.length} image assets, original CSS and original motion.`);
